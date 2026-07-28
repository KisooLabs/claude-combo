# Claude Combo Extension — project CLAUDE.md

## What this is

A ~200-line VS Code extension (plain CommonJS, no deps, no build) that replaces the
`/model` + `/effort` two-step with one QuickPick, applied to the **next** Claude
conversation. Owner-built for personal use; **public on GitHub** at
`https://github.com/kisoolabs/claude-combo` (MIT) and listed on the portfolio site
`kisoolabs.github.io` — but not published to any marketplace.

Read `README.md` for the feature surface and `INSTALL.md` for the per-machine runbook.

Because the repo is public and the README is the landing page, an edit that changes
behavior or configuration has three follow-ups, not one: reinstall + reload (below),
README, and — if the one-line pitch changes — the `claude-combo` entry in
`kisoolabs.github.io/data/site.json` (then `python tools/build_site.py` there).

## Layout

| File | Role |
|---|---|
| `extension.js` | Everything: status bar, QuickPick, settings read-modify-write |
| `package.json` | Manifest — the `claudeCombo.presets` schema/defaults live here |
| `install.ps1` / `install.sh` | Copy the files (+ `assets/`) into the machine-local extensions folder |
| `INSTALL.md` | Human runbook (install / update / troubleshoot / uninstall) |
| `README.md` | Public landing page: hero, install, feature + configuration reference |
| `assets/hero.svg` | Source of the hero — hand-authored QuickPick mock (site palette) |
| `assets/hero.png` | What the README actually references (see § Releases) |
| `.vscodeignore` | What stays out of the `.vsix` (docs, install scripts, the SVG) |
| `LICENSE` | MIT |

## Editing this project — non-negotiable loop

Editing the source does **nothing** to the running editor. VS Code loads the *copy* at
`~/.vscode/extensions/kisoo.claude-combo-<version>/`. After every edit:

1. Re-run `install.ps1` (Windows) / `install.sh` (Mac).
2. Tell the owner to run `Developer: Reload Window` — Claude cannot reload the window.

A change reported as "done" without both steps is untested. Say which of the two you
ran and which the owner still has to do.

## The settings path is not `~/.claude` — it is `CLAUDE_CONFIG_DIR`

Claude reads user settings from `$CLAUDE_CONFIG_DIR/settings.json` whenever that variable is
set, and falls back to `~/.claude/settings.json` otherwise. claude-account-switcher launches
each VS Code window with `CLAUDE_CONFIG_DIR=~/.claude-slots/<slot>/config`, and the variable
is in the *window* environment, so the extension host sees it in `process.env`.

0.0.1 hardcoded `~/.claude`, which made every pick a silent no-op in a switcher window while
the status bar cheerfully reported the phantom value it had just written. Fixed in 0.0.2
([extension.js:14](extension.js#L14)). Any future code that touches a Claude settings path
resolves it the same way — never `os.homedir()/.claude` directly.

**It replaces, it does not merge.** Verified on Home 2026-07-28: a slot's
`config/settings.json` held only the LaunchPad heartbeat hooks, yet the session running on
that slot had auto-memory *on* while `~/.claude/settings.json` says `autoMemoryEnabled:
false`. So the home file contributes nothing to a pinned window. The consequence is
structural, not a bug: a pick can only ever be per-window, and "make it global" cannot mean
"write `~/.claude`" — that is the 0.0.1 mistake wearing a different hat.

0.0.3 answers it with `applyTarget: "allSlots"`, which fans the two keys out to
`~/.claude/settings.json` *and* every `<slotsRoot>/*/config/settings.json` (185 of 187 slots
on Home). Slots are keyed on the `config/` directory rather than an existing settings file,
so a fresh vault is pinned too. Writes are independent — one unreadable slot is reported and
skipped, never aborting the rest. Two costs the owner accepted knowingly: a model gets
written into slots whose account may not have it, and the documented `/effort` write race now
spans every account at once (the `.bak` per file remains the only mitigation; no locking).

## Testing caution — this extension writes the live Claude user settings

That is the live Claude Code user settings file, including the settings of the session
doing the testing. Before exercising a code path that writes:

- Prefer `claudeCombo.applyTarget: "workspace"` so writes land in a throwaway project's
  `.claude/settings.json` instead of the user file.
- Every write leaves `<path>.bak`. That is the restore point.
- A live Claude session persisting `/effort` can race the extension's write. The `.bak`
  is the mitigation; do not attempt to "fix" the race with locking — the failure mode is
  a lost keystroke, not corruption, and file locking on a Syncthing-adjacent path is
  worse than the disease.

## VS Code settings are per window here too — `--user-data-dir`

The same trap as `CLAUDE_CONFIG_DIR`, one layer up, and it cost two wrong diagnoses on
2026-07-28 before anyone looked at the right file. claude-account-switcher's launcher
(`Development/claude-account-switcher/launcher/Core.cs:157`) starts every window with
`--user-data-dir=<slot>/vscode-ud`, so **VS Code user settings are per account slot**:
`C:\Users\kisoo\.claude-slots\<slot>\vscode-ud\User\settings.json`, not
`%APPDATA%\Code\User\settings.json`. A preset list edited in one window is invisible in a
window on another slot, forever, no matter how often it is saved. Extensions are *not*
per-slot (no `vscode-ud/extensions`; `--user-data-dir` alone does not move the extensions
folder), which is why the extension loads everywhere and only its settings diverge.

Before diagnosing any "setting didn't take", read `process.env.CLAUDE_CONFIG_DIR` **and**
find the settings.json the window actually uses. Reading `%APPDATA%` and concluding "the
edit was never saved" is the mistake that was made here; the edit was saved, to a file that
was never checked.

0.0.5 answers it with `claudeCombo.sharedConfigFile` — one JSON file outside every
user-data-dir (default `~/.claude-combo/config.json`) carrying `presets` / `applyTarget` /
`slotsRoot`. When it exists it wins over the VS Code settings, `Edit presets…` opens it, and
the apply-target toggle writes back to it. `Claude Combo: Share presets with every window`
creates it from whatever presets the window currently has.

## Two silent-feedback traps this extension has to work around

**An unsaved settings file applies in its own window.** VS Code honours the dirty buffer
locally but only ever ships the file on disk to other windows, so an edited-not-saved preset
list looks applied to its author and is invisible everywhere else. Real, but note it was
*wrongly* blamed for the 2026-07-28 cross-window report above — a genuine per-file check
(mtime, content) must come before naming it. 0.0.4 added `dirtySettingsDocs()` + a
`$(warning)` row at the top of the QuickPick that saves the file when selected, plus a hint
when `Edit presets…` opens the editor.

**`setStatusBarMessage` is invisible here.** The owner's VS Code sets
`workbench.statusBar.visible: false`, which swallows both the status bar item and every
`setStatusBarMessage`. So a confirmation that matters must be a `showInformationMessage` —
that is why an `allSlots` pick (a 186-file write) reports through a notification while a
single-file pick still uses the quiet channel.

## Known limit — do not try to "fix" it

The picked combo applies only to a **new** conversation. `anthropic.claude-code`
2.1.220 contributes no command or API for changing a live session's model or effort
(verified against its `package.json`: config keys are `useTerminal`,
`environmentVariables`, `claudeProcessWrapper`, …; commands are all open/new-conversation
variants). If a future extension version adds one, that is the moment to revisit —
re-check its `package.json` before assuming.

`claudeCode.claudeProcessWrapper` is the one unexplored hook (it names the executable
used to launch Claude, so a wrapper script could inject `--model` / `--effort`). It is
undocumented whether the extension appends its args to the wrapper. Untested; do not
build on it without an experiment.

## Releases (the install path strangers use)

`README.md` § Install leads with a no-terminal path: download the `.vsix` from the latest
GitHub release → Extensions panel → `…` → *Install from VSIX…*. That path only works if a
release with a matching asset exists, so a version bump that never gets packaged silently
breaks the documented install.

```
npx --yes @vscode/vsce@latest package --out ./claude-combo-<version>.vsix
code --install-extension ./claude-combo-<version>.vsix --force   # smoke test
gh release create v<version> ./claude-combo-<version>.vsix --title ... --notes ...
```

Two constraints found the hard way:

- **vsce rejects any SVG referenced from the README.** Hence `assets/hero.png`, generated
  from `hero.svg` with headless Chrome (`--window-size=1000,420
  --force-device-scale-factor=2 --screenshot=...` against the `file:///` SVG). Edit the
  SVG, re-render the PNG — never hand-edit the PNG.
- The `.vsix` is gitignored; the release asset is its only home.

A VSIX install and an `install.ps1` install land in the *same* folder
(`kisoo.claude-combo-<version>`), so they overwrite each other rather than coexisting.
That is why README/INSTALL tell the reader to pick one path.

## Version bumps

`install.ps1` / `install.sh` hardcode the target folder id
(`kisoo.claude-combo-<version>`) to match `package.json`'s `version`. Bumping the
version means editing all three, and deleting the previous
`kisoo.claude-combo-<old>` folder on every machine — two copies of the same extension
id make VS Code load an unpredictable one. It also means a fresh `.vsix` + release
(above) and updating the filename written in `README.md` / `INSTALL.md` § A Step 1.

## Commit scope

This folder is its own git repo (`Development/` holds independent per-project repos; no
parent `.git`). Commit only within it. `.git` is Syncthing-synced, so never work this
project on two machines at once, and commit before any cross-device handoff.

---

> Changelog for this file: [CLAUDE_CHANGELOG.md](CLAUDE_CHANGELOG.md)
