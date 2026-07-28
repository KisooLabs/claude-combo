# CLAUDE.md Changelog — Claude Combo Extension

- 2026-07-28: § "VS Code settings are per window here too — `--user-data-dir`" added — the switcher gives each slot its own `vscode-ud`, so VS Code user settings diverge per account (extensions do not); records the two wrong diagnoses this caused, the "find the file the window actually uses" rule, and 0.0.5's shared-config answer. The unsaved-buffer trap is demoted to "real but wrongly blamed here".

- 2026-07-28: § "Two silent-feedback traps" added — an unsaved settings.json applies only in its own window (mistaken for an extension bug twice, 0.0.4 warns + offers to save), and `workbench.statusBar.visible: false` on the owner's machine swallows `setStatusBarMessage`, so confirmations that matter must be notifications.

- 2026-07-28: § `CLAUDE_CONFIG_DIR` extended — verified that a slot config *replaces* `~/.claude` instead of merging, so "global" cannot mean writing the home file; records 0.0.3's `allSlots` fan-out (keyed on `config/`, independent per-file writes) and the two accepted costs (cross-account model mismatch, race surface widened to every slot).

- 2026-07-27: § "The settings path is not `~/.claude`" added (0.0.2 bug) — every Claude settings path resolves through `CLAUDE_CONFIG_DIR` first, because account switchers put each window on its own slot config; hardcoding the home path made picks silent no-ops.
- 2026-07-27: § Releases added — the documented install is now the .vsix from the GitHub release, so a version bump must re-package + re-release (vsce forbids README SVGs → hero.png is generated from hero.svg; the .vsix is gitignored; VSIX and script installs share one folder).
- 2026-07-27: Public release recorded — repo is now public at github.com/kisoolabs/claude-combo and listed on kisoolabs.github.io; layout table gains `assets/hero.svg` + `LICENSE`; behavior/config edits now also carry README + site-entry follow-ups.
- 2026-07-26: Created. Project spec for the model+effort QuickPick extension — layout, the mandatory edit→reinstall→reload loop, settings-write testing caution, the "applies to next conversation only" limit (do not try to fix), version-bump pitfall, commit scope.
