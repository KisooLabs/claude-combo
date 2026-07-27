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
| `assets/hero.svg` | README hero — hand-authored QuickPick mock (site palette) |
| `LICENSE` | MIT |

## Editing this project — non-negotiable loop

Editing the source does **nothing** to the running editor. VS Code loads the *copy* at
`~/.vscode/extensions/kisoo.claude-combo-<version>/`. After every edit:

1. Re-run `install.ps1` (Windows) / `install.sh` (Mac).
2. Tell the owner to run `Developer: Reload Window` — Claude cannot reload the window.

A change reported as "done" without both steps is untested. Say which of the two you
ran and which the owner still has to do.

## Testing caution — this extension writes `~/.claude/settings.json`

That is the live Claude Code user settings file, including the settings of the session
doing the testing. Before exercising a code path that writes:

- Prefer `claudeCombo.applyTarget: "workspace"` so writes land in a throwaway project's
  `.claude/settings.json` instead of the user file.
- Every write leaves `<path>.bak`. That is the restore point.
- A live Claude session persisting `/effort` can race the extension's write. The `.bak`
  is the mitigation; do not attempt to "fix" the race with locking — the failure mode is
  a lost keystroke, not corruption, and file locking on a Syncthing-adjacent path is
  worse than the disease.

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

## Version bumps

`install.ps1` / `install.sh` hardcode the target folder id
(`kisoo.claude-combo-<version>`) to match `package.json`'s `version`. Bumping the
version means editing all three, and deleting the previous
`kisoo.claude-combo-<old>` folder on every machine — two copies of the same extension
id make VS Code load an unpredictable one.

## Commit scope

This folder is its own git repo (`Development/` holds independent per-project repos; no
parent `.git`). Commit only within it. `.git` is Syncthing-synced, so never work this
project on two machines at once, and commit before any cross-device handoff.

---

> Changelog for this file: [CLAUDE_CHANGELOG.md](CLAUDE_CHANGELOG.md)
