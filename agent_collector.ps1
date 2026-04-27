# HSA Inventory Agent v1.1
# Script for collecting PC characteristics and HSA management

param (
    [string]$Server,
    [string]$PCName
)

Add-Type -AssemblyName Microsoft.VisualBasic
Add-Type -AssemblyName System.Windows.Forms

$ConfigDir = Join-Path $env:APPDATA "HSA_Agent"
$ConfigFile = Join-Path $ConfigDir "config.json"

if (-not (Test-Path $ConfigDir)) { New-Item -ItemType Directory -Path $ConfigDir | Out-Null }
$SavedConfig = if (Test-Path $ConfigFile) { Get-Content $ConfigFile | ConvertFrom-Json } else { $null }

$FinalServer = if ($Server) { $Server } 
               elseif ($SavedConfig.server) { $SavedConfig.server } 
               else { [Microsoft.VisualBasic.Interaction]::InputBox("Enter server URL (e.g., http://ip:3000):", "HSA Setup", "http://localhost:3000") }

$FinalPCName = if ($PCName) { $PCName } 
               elseif ($SavedConfig.pcName) { $SavedConfig.pcName } 
               else { [Microsoft.VisualBasic.Interaction]::InputBox("Enter computer name:", "HSA Setup", $env:COMPUTERNAME) }

if (-not $FinalServer) { exit }

$ConfigToSave = @{ server = $FinalServer; pcName = $FinalPCName } | ConvertTo-Json
$ConfigToSave | Out-File $ConfigFile -Encoding utf8

$ApiUrl = "$FinalServer/api/agent/report"

Write-Host ">>> Collecting system data..." -ForegroundColor Cyan

$CompSystem = Get-WmiObject -Class Win32_ComputerSystem
$Bios = Get-WmiObject -Class Win32_Bios

$ComputerName = if ($FinalPCName) { $FinalPCName } else { $env:COMPUTERNAME }
$SerialNumber = $Bios.SerialNumber.Trim()

$UniqueId = "$($SerialNumber)_$($env:COMPUTERNAME)".Replace(" ", "_")

$Model = $CompSystem.Model
$Manufacturer = $CompSystem.Manufacturer

$CPUObj = Get-WmiObject -Class Win32_Processor
$CPU = $CPUObj.Name
$CPUCores = $CPUObj.NumberOfCores

$RAMBytes = $CompSystem.TotalPhysicalMemory
$RAMGB = [Math]::Round($RAMBytes / 1GB, 0)

$BaseBoard = Get-WmiObject -Class Win32_BaseBoard
$Motherboard = "$($BaseBoard.Manufacturer.Trim()) $($BaseBoard.Product.Trim())"

$GPUs = Get-WmiObject -Class Win32_VideoController | ForEach-Object { $_.Name }
$GPUStr = $GPUs -join " | "
if (-not $GPUStr) { $GPUStr = "Integrated Graphics" }

$IPs = Get-NetIPAddress -AddressFamily IPv4 | Where-Object { $_.InterfaceAlias -notmatch 'Loopback|Virtual|Pseudo' } | ForEach-Object { $_.IPAddress }
$IPAddr = $IPs -join ", "

$OS = (Get-WmiObject -Class Win32_OperatingSystem).Caption

$Disks = Get-WmiObject -Class Win32_LogicalDisk | Where-Object { $_.DriveType -eq 3 } | ForEach-Object { 
    "$($_.DeviceID) $([Math]::Round($_.Size / 1GB, 0))GB" 
}
$StorageStr = $Disks -join " + "

Write-Host ">>> Auditing software (this may take a moment)..." -ForegroundColor Gray
$SoftwareList = Get-ItemProperty HKLM:\Software\Microsoft\Windows\CurrentVersion\Uninstall\*, 
                            HKLM:\Software\Wow6432Node\Microsoft\Windows\CurrentVersion\Uninstall\* | 
                Where-Object { $_.DisplayName -ne $null } |
                Select-Object DisplayName, DisplayVersion, Publisher | 
                Sort-Object DisplayName -Unique |
                ForEach-Object {
                    @{
                        name      = "$($_.DisplayName)"
                        version   = "$($_.DisplayVersion)"
                        publisher = "$($_.Publisher)"
                    }
                }

$Payload = @{
    id           = $UniqueId
    serialNumber = $SerialNumber
    name         = $ComputerName
    manufacturer = $Manufacturer
    model        = $Model
    os           = $OS
    cpu          = $CPU
    cpuCores     = $CPUCores
    ram          = "$RAMGB GB"
    storage      = $StorageStr
    motherboard  = $Motherboard
    gpu          = $GPUStr
    ip           = $IPAddr
    software     = $SoftwareList
    lastSeen     = (Get-Date -Format "yyyy-MM-ddTHH:mm:ss")
} | ConvertTo-Json -Depth 10

Write-Host ">>> Sending data to: $ApiUrl" -ForegroundColor Yellow

try {
    $Bytes = [System.Text.Encoding]::UTF8.GetBytes($Payload)
    $Response = Invoke-RestMethod -Uri $ApiUrl -Method Post -Body $Bytes -ContentType "application/json; charset=utf-8"
    
    if ($Response -and $Response.vncPassword) {
        Write-Host ">>> Configuring TightVNC..." -ForegroundColor Cyan
        try {
            $VncPath = "${env:ProgramFiles}\TightVNC\tvnserver.exe"
            if (Test-Path $VncPath) {
                Write-Host ">>> TightVNC detected. Syncing password..." -ForegroundColor Gray
                Start-Process -FilePath $VncPath -ArgumentList "-stop" -Wait -NoNewWindow -ErrorAction SilentlyContinue
                $RegPath = "HKLM:\SOFTWARE\TightVNC\Server"
                if (-not (Test-Path $RegPath)) { New-Item -Path $RegPath -Force | Out-Null }
                Set-ItemProperty -Path $RegPath -Name "Password" -Value $Response.vncPassword -Type String -Force
                Set-ItemProperty -Path $RegPath -Name "ControlPassword" -Value $Response.vncPassword -Type String -Force
                Start-Process -FilePath $VncPath -ArgumentList "-start" -WindowStyle Hidden
                Write-Host ">>> VNC password updated successfully." -ForegroundColor Green
            } else {
                Write-Host ">>> TightVNC not installed." -ForegroundColor Yellow
            }
        } catch {
            Write-Host ">>> VNC configuration error: $($_.Exception.Message)" -ForegroundColor Red
        }
    }

    Write-Host ">>> SUCCESS: Data sent." -ForegroundColor Green
} catch {
    Write-Host ">>> ERROR: $($_.Exception.Message)" -ForegroundColor Red
}
