# ============================================================
# HSA Inventory Agent v3.0
# Полностью автоматический сбор данных и настройка VNC
# Developer: HSA Team
# ============================================================

param (
    [string]$Server,
    [string]$PCName
)

# Подключение необходимых сборок
Add-Type -AssemblyName Microsoft.VisualBasic
Add-Type -AssemblyName System.Windows.Forms

# ============================================================
# 1. КОНФИГУРАЦИЯ
# ============================================================
$ConfigDir = Join-Path $env:APPDATA "HSA_Agent"
$ConfigFile = Join-Path $ConfigDir "config.json"

if (-not (Test-Path $ConfigDir)) { 
    New-Item -ItemType Directory -Path $ConfigDir -Force | Out-Null 
}

$SavedConfig = if (Test-Path $ConfigFile) { 
    Get-Content $ConfigFile | ConvertFrom-Json 
} else { $null }

# Определение сервера
$FinalServer = if ($Server) { $Server } 
    elseif ($SavedConfig.server) { $SavedConfig.server } 
    else { 
        [Microsoft.VisualBasic.Interaction]::InputBox(
            "Enter server URL (e.g., http://ip:3000):", 
            "HSA Setup", 
            "http://localhost:3000"
        ) 
    }

# Определение имени ПК
$FinalPCName = if ($PCName) { $PCName } 
    elseif ($SavedConfig.pcName) { $SavedConfig.pcName } 
    else { 
        [Microsoft.VisualBasic.Interaction]::InputBox(
            "Enter computer name:", 
            "HSA Setup", 
            $env:COMPUTERNAME
        ) 
    }

if (-not $FinalServer) { exit }

# Сохранение конфига
$ConfigToSave = @{ server = $FinalServer; pcName = $FinalPCName } | ConvertTo-Json
$ConfigToSave | Out-File $ConfigFile -Encoding utf8

$ApiUrl = "$FinalServer/api/agent/report"

# ============================================================
# 2. ФУНКЦИЯ УСТАНОВКИ TIGHTVNC
# ============================================================
function Install-TightVNC {
    Write-Host ">>> Installing TightVNC..." -ForegroundColor Cyan
    
    $vncUrl32 = "https://www.tightvnc.com/download/2.8.84/tightvnc-2.8.84-x86.msi"
    $vncUrl64 = "https://www.tightvnc.com/download/2.8.84/tightvnc-2.8.84-x64.msi"
    
    # Определяем архитектуру
    if ([Environment]::Is64BitOperatingSystem) {
        $vncUrl = $vncUrl64
        Write-Host ">>> Detected 64-bit OS" -ForegroundColor Gray
    } else {
        $vncUrl = $vncUrl32
        Write-Host ">>> Detected 32-bit OS" -ForegroundColor Gray
    }
    
    $msiPath = "$env:TEMP\tightvnc.msi"
    
    try {
        # Скачивание
        Write-Host ">>> Downloading TightVNC from official site..." -ForegroundColor Gray
        Invoke-WebRequest -Uri $vncUrl -OutFile $msiPath -UseBasicParsing -ErrorAction Stop
        
        # Установка
        Write-Host ">>> Installing TightVNC (silent mode)..." -ForegroundColor Gray
        $installArgs = "/i `"$msiPath`" /quiet /norestart ADDLOCAL=Server,Viewer SERVER_ADD_FIREWALL_EXCEPTION=1 SERVER_REGISTER_AS_SERVICE=1"
        $process = Start-Process -FilePath "msiexec.exe" -ArgumentList $installArgs -Wait -NoNewWindow -PassThru
        
        if ($process.ExitCode -eq 0) {
            Write-Host ">>> TightVNC installed successfully." -ForegroundColor Green
            
            # Настройка брандмауэра
            netsh advfirewall firewall add rule name="TightVNC Server" dir=in action=allow protocol=TCP localport=5900 > $null
            
            return $true
        } else {
            Write-Host ">>> Installation failed with exit code: $($process.ExitCode)" -ForegroundColor Red
            return $false
        }
    } catch {
        Write-Host ">>> Error installing TightVNC: $($_.Exception.Message)" -ForegroundColor Red
        return $false
    } finally {
        if (Test-Path $msiPath) { Remove-Item $msiPath -Force -ErrorAction SilentlyContinue }
    }
}

# ============================================================
# 3. ФУНКЦИЯ НАСТРОЙКИ VNC ПАРОЛЯ
# ============================================================
function Set-VNCPassword {
    param([string]$Password)
    
    if (-not $Password -or $Password -eq "") {
        Write-Host ">>> No password provided, skipping VNC setup" -ForegroundColor Yellow
        return $false
    }
    
    Write-Host ">>> Configuring VNC password..." -ForegroundColor Cyan
    
    try {
        # Проверка наличия VNC
        $vncPaths = @(
            "${env:ProgramFiles}\TightVNC\tvnserver.exe",
            "${env:ProgramFiles(x86)}\TightVNC\tvnserver.exe"
        )
        
        $vncPath = $null
        foreach ($path in $vncPaths) {
            if (Test-Path $path) {
                $vncPath = $path
                break
            }
        }
        
        if (-not $vncPath) {
            Write-Host ">>> TightVNC not found, installing..." -ForegroundColor Yellow
            if (-not (Install-TightVNC)) {
                Write-Host ">>> Cannot proceed without VNC" -ForegroundColor Red
                return $false
            }
        }
        
        # Создание ключей реестра
        $regPath = "HKLM:\SOFTWARE\TightVNC\Server"
        if (-not (Test-Path $regPath)) {
            New-Item -Path $regPath -Force | Out-Null
        }
        
        # Установка пароля
        Set-ItemProperty -Path $regPath -Name "Password" -Value $Password -Type String -Force
        Set-ItemProperty -Path $regPath -Name "ControlPassword" -Value $Password -Type String -Force
        
        # Дополнительные настройки
        Set-ItemProperty -Path $regPath -Name "UseVncAuthentication" -Value 1 -Type DWORD -Force
        Set-ItemProperty -Path $regPath -Name "AllowProperties" -Value 1 -Type DWORD -Force
        Set-ItemProperty -Path $regPath -Name "AcceptRfbConnections" -Value 1 -Type DWORD -Force
        Set-ItemProperty -Path $regPath -Name "QuerySetting" -Value 2 -Type DWORD -Force
        
        # Перезапуск службы VNC
        Stop-Service -Name "tvnserver" -Force -ErrorAction SilentlyContinue
        Start-Sleep -Seconds 2
        Start-Service -Name "tvnserver" -ErrorAction SilentlyContinue
        
        # Альтернативный запуск через exe
        if ((Get-Service -Name "tvnserver" -ErrorAction SilentlyContinue).Status -ne "Running") {
            Start-Process -FilePath $vncPath -ArgumentList "-start" -WindowStyle Hidden
        }
        
        Write-Host ">>> VNC password configured successfully." -ForegroundColor Green
        Write-Host ">>> VNC is ready on port 5900" -ForegroundColor Green
        
        return $true
    } catch {
        Write-Host ">>> Error configuring VNC: $($_.Exception.Message)" -ForegroundColor Red
        return $false
    }
}

# ============================================================
# 4. СБОР СИСТЕМНЫХ ДАННЫХ
# ============================================================
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "    HSA Inventory Agent v3.0" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

Write-Host ">>> Collecting system data..." -ForegroundColor Cyan

# Системная информация
$CompSystem = Get-CimInstance -Class Win32_ComputerSystem
$Bios = Get-CimInstance -Class Win32_BIOS
$Processor = Get-CimInstance -Class Win32_Processor

$ComputerName = $FinalPCName
$SerialNumber = $Bios.SerialNumber.Trim()
if ($SerialNumber -eq "" -or $SerialNumber -eq "To be filled by O.E.M.") {
    $SerialNumber = $env:COMPUTERNAME
}
$UniqueId = "$($SerialNumber)_$($env:COMPUTERNAME)".Replace(" ", "_")

$Manufacturer = $CompSystem.Manufacturer
$Model = $CompSystem.Model

$CPU = $Processor.Name
$CPUCores = $Processor.NumberOfCores

$RAMGB = [Math]::Round($CompSystem.TotalPhysicalMemory / 1GB, 0)

$OS = (Get-CimInstance -Class Win32_OperatingSystem).Caption

# IP адреса
$IPs = Get-NetIPAddress -AddressFamily IPv4 | 
    Where-Object { $_.InterfaceAlias -notmatch 'Loopback|Virtual|Pseudo' } | 
    ForEach-Object { $_.IPAddress }
$IPAddr = $IPs -join ", "

Write-Host ">>> Computer: $ComputerName" -ForegroundColor Gray
Write-Host ">>> IP: $IPAddr" -ForegroundColor Gray
Write-Host ">>> OS: $OS" -ForegroundColor Gray
Write-Host ">>> CPU: $CPU" -ForegroundColor Gray
Write-Host ">>> RAM: $RAMGB GB" -ForegroundColor Gray

# Сбор ПО (ограниченно для скорости)
Write-Host ">>> Auditing software (quick mode)..." -ForegroundColor Gray
$SoftwareList = Get-ItemProperty HKLM:\Software\Microsoft\Windows\CurrentVersion\Uninstall\*, 
                            HKLM:\Software\Wow6432Node\Microsoft\Windows\CurrentVersion\Uninstall\* | 
                Where-Object { $_.DisplayName -ne $null } |
                Select-Object DisplayName, DisplayVersion -First 50 |
                Sort-Object DisplayName |
                ForEach-Object {
                    @{
                        name = "$($_.DisplayName)"
                        version = "$($_.DisplayVersion)"
                    }
                }

# Формирование JSON
$Payload = @{
    id = $UniqueId
    serialNumber = $SerialNumber
    name = $ComputerName
    manufacturer = $Manufacturer
    model = $Model
    os = $OS
    cpu = $CPU
    cpuCores = $CPUCores
    ram = "$RAMGB GB"
    ip = $IPAddr
    software = $SoftwareList
    hostname = $env:COMPUTERNAME
    lastSeen = (Get-Date -Format "yyyy-MM-ddTHH:mm:ss")
} | ConvertTo-Json -Depth 10

# ============================================================
# 5. ОТПРАВКА ДАННЫХ НА СЕРВЕР
# ============================================================
Write-Host ">>> Sending data to server..." -ForegroundColor Yellow

try {
    $Bytes = [System.Text.Encoding]::UTF8.GetBytes($Payload)
    $Response = Invoke-RestMethod -Uri $ApiUrl -Method Post -Body $Bytes -ContentType "application/json; charset=utf-8"
    
    Write-Host ">>> Data sent successfully!" -ForegroundColor Green
    
    # ============================================================
    # 6. НАСТРОЙКА VNC (если сервер вернул пароль)
    # ============================================================
    if ($Response -and $Response.vncPassword -and $Response.vncPassword -ne "") {
        Write-Host ""
        Write-Host ">>> VNC configuration received from server!" -ForegroundColor Cyan
        Set-VNCPassword -Password $Response.vncPassword
        
        # Сохраняем статус VNC в конфиг
        $vncStatus = @{ vncConfigured = $true; vncPassword = $Response.vncPassword }
        $vncStatus | ConvertTo-Json | Out-File (Join-Path $ConfigDir "vnc.json") -Encoding utf8
    } else {
        Write-Host ">>> No VNC configuration from server" -ForegroundColor Gray
    }
    
    # ============================================================
    # 7. ОБРАБОТКА ИНТЕРВАЛА ОТПРАВКИ
    # ============================================================
    if ($Response -and $Response.interval -and $Response.interval -gt 0) {
        Write-Host ">>> Server requested interval: $($Response.interval) seconds" -ForegroundColor Cyan
        
        # Сохраняем интервал
        $intervalConfig = @{ interval = $Response.interval }
        $intervalConfig | ConvertTo-Json | Out-File (Join-Path $ConfigDir "interval.json") -Encoding utf8
    }
    
    Write-Host ""
    Write-Host "========================================" -ForegroundColor Green
    Write-Host "    OPERATION COMPLETED SUCCESSFULLY" -ForegroundColor Green
    Write-Host "========================================" -ForegroundColor Green
    
    [System.Windows.Forms.MessageBox]::Show(
        "Data sent successfully to server!`n`nComputer: $ComputerName`nIP: $IPAddr`nVNC: $(if($Response.vncPassword){'Configured'}else{'Not configured'})", 
        "HSA Agent", 
        "OK", 
        "Information"
    )
    
} catch {
    Write-Host ">>> ERROR: $($_.Exception.Message)" -ForegroundColor Red
    
    [System.Windows.Forms.MessageBox]::Show(
        "Connection error!`n`n$($_.Exception.Message)`n`nServer: $FinalServer", 
        "HSA Error", 
        "OK", 
        "Error"
    )
}

Write-Host ""
Write-Host "Press any key to exit..." -ForegroundColor Gray
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")