# Claude Combo

A tiny VS Code extension that turns "pick a model, then pick an effort level" into one
QuickPick. Combos are defined in your own settings, not hardcoded here.

## What it does

1. Status bar shows the current combo (`⚡ Opus · medium`).
2. Click it — or press `Ctrl+Alt+M` (`Cmd+Alt+M` on Mac) — to open the QuickPick.
3. Picking a combo writes the `model` and `effortLevel` keys into a Claude Code
   `settings.json`, then opens a new Claude conversation.

## Hard limitation (by design, not a bug)

**A picked combo applies to the *next* conversation, never the running one.**
The Claude Code VS Code extension exposes no command or API for changing the model or
effort of a live session — its contributed commands are all open/new-conversation
variants. A running session still needs `/model` + `/effort`.

This matters because switching model first resets effort to that model's default, which
is exactly the two-step dance this extension removes for new sessions.

## Configuration

```jsonc
"claudeCombo.presets": [
  { "label": "Fable · xhigh", "model": "fable",    "effort": "xhigh",  "detail": "judgment" },
  { "label": "Opus · high",   "model": "opus[1m]", "effort": "high",   "detail": "execution" },
  { "label": "Opus · medium", "model": "opus[1m]", "effort": "medium", "detail": "execution" },
  { "label": "Sonnet · low",  "model": "sonnet",   "effort": "low",    "detail": "mechanical" }
],
"claudeCombo.applyTarget": "user",                  // "user" | "workspace"
"claudeCombo.openNewConversationAfterPick": true,
"claudeCombo.showStatusBarItem": true
```

- `model` — anything `claude --model` accepts: `fable`, `opus`, `sonnet`, `opus[1m]`,
  or a full model id such as `claude-fable-5`.
- `effort` — `low` | `medium` | `high` | `xhigh` (the enum the settings schema accepts;
  the CLI's `--effort max` has no persisted-settings equivalent). Omit to leave effort
  untouched.
- Order in the array is the order in the QuickPick. Edit via the QuickPick's
  "프리셋 편집…" entry or `Claude Combo: Edit presets`.

### Apply target

| `applyTarget` | Writes to | Effect |
|---|---|---|
| `user` | `~/.claude/settings.json` | Everywhere |
| `workspace` | `<project>/.claude/settings.json` | This project only; overrides the user setting |

`workspace` is the way to pin a per-project default (e.g. a judgment-tier project always
opening on Fable). `Claude Combo: Pick model + effort (this project only)` forces the
workspace target for a single pick without changing the setting. The QuickPick also has an
inline "적용 대상 전환" entry.

The status bar reflects `user` settings overlaid with the current project's, matching how
Claude Code actually resolves them.

## Write safety

The two keys are set via read-modify-write, so every other key and the key order survive.
The previous file is copied to `settings.json.bak` before each write, and the new content
lands via a temp file + rename.

A live Claude session writing the same file (e.g. `/effort` persisting its choice) can
still race this extension. The `.bak` is the mitigation; the race cannot be eliminated.

## Install

Extensions folders are machine-local (not Syncthing-synced), so install once per machine:

- Windows: `powershell -ExecutionPolicy Bypass -File "C:\Users\kisoo\Sharing\Development\claude-combo\install.ps1"` (add `-Cursor` for Cursor too)
- Mac: `bash "$HOME/Sharing/Development/claude-combo/install.sh"` (add `--cursor`)

Then `Developer: Reload Window`.

No build step — plain CommonJS, no dependencies, no bundler.

## Alternatives considered

- `claude --model X --effort Y` in a VS Code terminal profile — zero code, gives a
  dropdown of combos, but runs the terminal TUI instead of the native panel.
- `.claude/settings.json` per project — zero code, no picker; this extension's
  `workspace` target is a one-click way to write exactly that.
