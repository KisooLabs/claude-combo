# Install claude-combo into the local VS Code (and optionally Cursor) extensions folder.
# Extensions folders are machine-local (not Syncthing-synced), so run this once per machine.
#
#   powershell -ExecutionPolicy Bypass -File "C:\Users\kisoo\Sharing\Development\claude-combo\install.ps1"
#   powershell -ExecutionPolicy Bypass -File "...\install.ps1" -Cursor      # Cursor as well
#
# ASCII-only on purpose (PowerShell 5.1 codepage).

param(
    [switch]$Cursor
)

$ErrorActionPreference = 'Stop'

$src = $PSScriptRoot
$files = @('package.json', 'extension.js', 'README.md')
$id = 'kisoo.claude-combo-0.0.1'

$targets = @(Join-Path $env:USERPROFILE ".vscode\extensions\$id")
if ($Cursor) { $targets += Join-Path $env:USERPROFILE ".cursor\extensions\$id" }

foreach ($dst in $targets) {
    if (-not (Test-Path $dst)) { New-Item -ItemType Directory -Path $dst -Force | Out-Null }
    foreach ($f in $files) {
        $from = Join-Path $src $f
        if (Test-Path $from) { Copy-Item $from -Destination $dst -Force }
    }
    Write-Output "installed -> $dst"
}

Write-Output ""
Write-Output "Now reload the window: Ctrl+Shift+P -> 'Developer: Reload Window'"
Write-Output "Then Ctrl+Alt+M (or click the status bar item) to pick a combo."
