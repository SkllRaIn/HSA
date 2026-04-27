; Inno Setup Script for HSA Inventory Agent v1.1
; HelperSystemAdmins (HSA)

[Setup]
; Basic information
AppId={{HSA-Agent-1.1-2024}}
AppName=HSA Inventory Agent
AppVersion=1.1
AppPublisher=HelperSystemAdmins
AppPublisherURL=https://github.com/HSA
AppSupportURL=https://github.com/HSA
AppUpdatesURL=https://github.com/HSA

; Installation directories
DefaultDirName={commonpf}\HSA_Agent
DefaultGroupName=HSA Agent
AllowNoIcons=yes

; Output
OutputDir=.
OutputBaseFilename=HSA_Agent_Setup_1.1

; Installation settings
SetupIconFile=
UninstallDisplayIcon={app}\agent_collector.ps1
Compression=lzma2
SolidCompression=yes
WizardStyle=modern
PrivilegesRequired=lowest
AllowRootDirectory=yes

; Version info
VersionInfoVersion=1.1.0.0
VersionInfoCompany=HelperSystemAdmins
VersionInfoDescription=HSA Inventory Agent Setup
VersionInfoProductName=HSA Inventory Agent
VersionInfoProductVersion=1.1.0.0

[Languages]
Name: "english"; MessagesFile: "compiler:Default.isl"
Name: "russian"; MessagesFile: "compiler:Languages\Russian.isl"

[Tasks]
Name: "desktopicon"; Description: "{cm:CreateDesktopIcon}"; GroupDescription: "{cm:AdditionalIcons}"; Flags: unchecked
Name: "startup"; Description: "Add to startup (recommended)"; GroupDescription: "Auto-start options"; Flags: checkedonce
Name: "quicklaunch"; Description: "Create Quick Launch icon"; GroupDescription: "{cm:AdditionalIcons}"; Flags: unchecked

[Files]
Source: "agent_collector.ps1"; DestDir: "{app}"; Flags: ignoreversion

[Registry]
; Add to HKCU Startup (runs on user login, hidden window)
Root: HKCU; Subkey: "Software\Microsoft\Windows\CurrentVersion\Run"; ValueType: string; ValueName: "HSA_Inventory_Agent"; ValueData: "powershell.exe -ExecutionPolicy Bypass -WindowStyle Hidden -File ""{app}\agent_collector.ps1"""; Flags: uninsdeletevalue; Tasks: startup

[Icons]
; Start Menu shortcuts
Name: "{group}\HSA Inventory Agent"; Filename: "powershell.exe"; Parameters: "-NoExit -ExecutionPolicy Bypass -File ""{app}\agent_collector.ps1"""; WorkingDir: "{app}"; Comment: "Run HSA Inventory Agent"
Name: "{group}\Uninstall HSA Agent"; Filename: "{uninstallexe}"; Comment: "Remove HSA Inventory Agent"

; Desktop shortcut
Name: "{autodesktop}\HSA Inventory Agent"; Filename: "powershell.exe"; Parameters: "-NoExit -ExecutionPolicy Bypass -File ""{app}\agent_collector.ps1"""; WorkingDir: "{app}"; Tasks: desktopicon

; Quick Launch shortcut
Name: "{userappdata}\Microsoft\Internet Explorer\Quick Launch\HSA Inventory Agent"; Filename: "powershell.exe"; Parameters: "-NoExit -ExecutionPolicy Bypass -File ""{app}\agent_collector.ps1"""; WorkingDir: "{app}"; Tasks: quicklaunch

[Run]
; Optional: Run agent once after installation (commented by default)
; Filename: "powershell.exe"; Parameters: "-ExecutionPolicy Bypass -File ""{app}\agent_collector.ps1"""; Flags: runhidden; Description: "Run agent now"; Tasks: 
; Filename: "powershell.exe"; Parameters: "-NoExit -ExecutionPolicy Bypass -File ""{app}\agent_collector.ps1"""; Flags: postinstall nowait skipifsilent; Description: "Launch HSA Agent"

[Code]
function InitializeSetup(): Boolean;
var
  MsgResult: Integer;
begin
  Result := True;
  
  { Check if already installed }
  if RegKeyExists(HKLM, 'Software\Microsoft\Windows\CurrentVersion\Uninstall\{#AppId}_is1') then
  begin
    MsgResult := MsgBox('HSA Inventory Agent is already installed.' #13#10 'Do you want to reinstall it?', mbConfirmation, MB_YESNO);
    if MsgResult = IDNO then
      Result := False;
  end;
end;

procedure CurStepChanged(CurStep: TSetupStep);
var
  ConfigDir, ConfigFile: string;
  DefaultConfig: string;
begin
  if CurStep = ssPostInstall then
  begin
    ConfigDir := ExpandConstant('{userappdata}\HSA_Agent');
    if not DirExists(ConfigDir) then
      CreateDir(ConfigDir);
      
    ConfigFile := ConfigDir + '\config.json';
    
    if not FileExists(ConfigFile) then
    begin
      DefaultConfig := '{' + #13#10 +
                       '  "server": "http://localhost:3000"' + #13#10 +
                       '}';
      SaveStringToFile(ConfigFile, DefaultConfig, False);
    end;
  end;
end;