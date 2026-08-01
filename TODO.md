# TODO — Claude Combo Extension

## Now

- [ ] Verify 0.0.5 after the owner reloads two windows on *different* slots. (a) Both
      QuickPicks list the same 6 English presets and the tooltip says they come from
      `C:\Users\kisoo\.claude-combo\config.json`. (b) Edit that file, save, and confirm the
      other window sees the change with no reload. (c) **Switch apply target** writes back
      into `config.json` (not a slot's settings.json). (d) An `allSlots` pick notifies
      `(global + 185 slots)` and a differently pinned window's next conversation starts on it.

## Next

- [ ] Install 0.0.5 on the other machines (Office Windows, Macbook) — `.vsix` from the
      release or the install script; delete any leftover `kisoo.claude-combo-0.0.2/3/4`
      folder there first. `~/.claude-combo/config.json` is machine-local (not synced), so
      copy it or re-run `Claude Combo: Share presets with every window` there.

## Blocked

- (none)

## Inbox

- (optional) Does a **resumed** conversation pick up a new combo? Resume is a fresh spawn
  (`Spawning Claude … resume: <id>`), so settings.json should apply — which would turn
  "next conversation only" into "next turn, history intact". Untested: resume may prefer the
  model stored in the session's own metadata. Test: pick a combo → `Claude Code: Reopen
  Closed Session` → see which model it starts on. If true, README/INSTALL § known limit change.
- (optional) The native model picker writes the *same* `es()/settings.json`, so it and Combo
  overwrite each other in a slot (last writer wins). Only worth acting on if it confuses.
- (optional) `allSlots` writes a model into slots whose account may not have it. If that
  ever bites, the fix is per-slot preset filtering, not abandoning the fan-out.

## Done (recent)

- 2026-07-28 `claudeProcessWrapper` question closed by reading the claude-code 2.1.220 bundle
  (no experiment needed): the wrapper is spawn-path only, so it can never reach a running
  session; the real live-change path is `query.applyFlagSettings()`, reachable only from
  claude-code's own webview (no command, no `activate()` export). Corollary now verified
  rather than assumed — the CLI does not watch settings.json mid-session, so a file write
  alone cannot change a live conversation. CLAUDE.md § Known limit rewritten.
- 2026-07-28 0.0.5: `claudeCombo.sharedConfigFile` — presets/applyTarget/slotsRoot read from
  one file outside every `--user-data-dir` (default `~/.claude-combo/config.json`), because
  the switcher gives each slot its own VS Code settings. `Share presets with every window`
  command seeds it; `Edit presets…` and the target toggle follow it. Also: the English preset
  list + `applyTarget: allSlots` fanned out to all 184 existing settings files (183 slots +
  the non-switcher default), all Korean `detail` strings gone.
- 2026-07-28 0.0.4: unsaved-settings warning — the QuickPick gains a `$(warning)` row (and a
  one-click save) while any settings.json is dirty, plus a hint when `Edit presets…` opens
  the editor, because VS Code applies a dirty settings.json in its own window only. `allSlots`
  picks now confirm via a notification, since the owner hides the status bar.
- 2026-07-28 0.0.3: `applyTarget: "allSlots"` — one pick now fans the two keys out to
  `~/.claude/settings.json` + every `<slotsRoot>/*/config/settings.json` (185 on Home),
  because a slot config *replaces* the home one instead of merging. Independent per-file
  writes, 3-way target cycle in the QuickPick, `claudeCombo.slotsRoot` escape hatch.
- 2026-07-27 0.0.2: fixed the account-switcher bug (user settings now resolve through
  `CLAUDE_CONFIG_DIR`, so a pick lands where Claude actually reads) + removed every Korean
  string from the extension UI, presets, comments and docs. Repackaged, 0.0.1 uninstalled and
  its folder deleted, 0.0.2 installed and verified on Home Windows.
- 2026-07-27 Public release: repo public at github.com/kisoolabs/claude-combo (MIT, hero,
  topics), listed on kisoolabs.github.io Programs, v0.0.1 release with a `.vsix` so install
  needs no terminal, README/INSTALL rewritten for a first-time user.

<!-- Next session: verification + multi-machine install are mechanical → `claude --model sonnet`,
     /effort low. (dated 2026-07-28) -->
