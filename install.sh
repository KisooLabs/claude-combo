#!/usr/bin/env bash
# Install claude-combo into the local VS Code (and optionally Cursor) extensions folder.
# Extensions folders are machine-local (not Syncthing-synced), so run this once per machine.
#
#   bash "$HOME/Sharing/Development/Claude Combo Extension/install.sh"
#   bash "$HOME/Sharing/Development/Claude Combo Extension/install.sh" --cursor
#
# Re-run this after ANY edit to extension.js / package.json, then reload the window.
set -euo pipefail

src="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
id="kisoo.claude-combo-0.0.3"

targets=("$HOME/.vscode/extensions/$id")
if [ "${1:-}" = "--cursor" ]; then
  targets+=("$HOME/.cursor/extensions/$id")
fi

for dst in "${targets[@]}"; do
  mkdir -p "$dst"
  for f in package.json extension.js README.md LICENSE; do
    [ -f "$src/$f" ] && cp -f "$src/$f" "$dst/"
  done
  # assets/ so the README hero image resolves in the extension details view
  [ -d "$src/assets" ] && cp -Rf "$src/assets" "$dst/"
  echo "installed -> $dst"
done

echo
echo "Now reload the window: Cmd+Shift+P -> 'Developer: Reload Window'"
echo "Then Cmd+Alt+M (or click the status bar item) to pick a combo."
