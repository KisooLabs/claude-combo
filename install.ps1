# Install claude-combo into the local VS Code (and optionally Cursor) extensions folder.
# Extensions folders are machine-local (not Syncthing-synced), so run this once per machine.
#
#   powershell -ExecutionPolicy Bypass -File "C:\Users\kisoo\Sharing\Development\Claude Combo Extension\install.ps1"
#   powershell -ExecutionPolicy Bypass -File "...\install.ps1" -Cursor      # Cursor as well
#
# Re-run this after ANY edit to extension.js / package.json, then reload the window.
#
# ASCII-only on purpose (PowerShell 5.1 codepage).

param(
    [switch]$Cursor
)

$ErrorActionPreference = 'Stop'

$src = $PSScriptRoot
$files = @('package.json', 'extension.js', 'README.md', 'LICENSE')
$id = 'kisoo.claude-combo-0.0.3'

$targets = @(Join-Path $env:USERPROFILE ".vscode\extensions\$id")
if ($Cursor) { $targets += Join-Path $env:USERPROFILE ".cursor\extensions\$id" }

foreach ($dst in $targets) {
    if (-not (Test-Path $dst)) { New-Item -ItemType Directory -Path $dst -Force | Out-Null }
    foreach ($f in $files) {
        $from = Join-Path $src $f
        if (Test-Path $from) { Copy-Item $from -Destination $dst -Force }
    }
    # assets/ so the README hero image resolves in the extension details view
    $assets = Join-Path $src 'assets'
    if (Test-Path $assets) { Copy-Item $assets -Destination $dst -Recurse -Force }
    Write-Output "installed -> $dst"
}

Write-Output ""
Write-Output "Now reload the window: Ctrl+Shift+P -> 'Developer: Reload Window'"
Write-Output "Then Ctrl+Alt+M (or click the status bar item) to pick a combo."
