# TODO — Claude Combo Extension

## Now

- [ ] Verify 0.0.4 after the owner reloads the window. (a) With the presets tab still
      unsaved, `Ctrl+Alt+M` shows the `$(warning) Unsaved settings.json` row and selecting
      it saves the file — then `%APPDATA%\Code\User\settings.json` gains `claudeCombo.presets`
      and another window's QuickPick shows the added combo. (b) **Switch apply target** to
      `currently: all slots` → pick a combo → expect a *notification* reading
      `Claude Combo → <combo> (global + 185 slots)`, then confirm a differently pinned
      window's next conversation starts on it.

## Next

- [ ] Install 0.0.4 on the other machines (Office Windows, Macbook) — `.vsix` from the
      release or the install script; delete any leftover `kisoo.claude-combo-0.0.2/0.0.3`
      folder there first.

## Blocked

- (none)

## Inbox

- (optional) `claudeCode.claudeProcessWrapper` experiment — could a wrapper inject
  `--model` / `--effort` and thus fix a *running* session? Untested; see CLAUDE.md § Known limit.
- (optional) `allSlots` writes a model into slots whose account may not have it. If that
  ever bites, the fix is per-slot preset filtering, not abandoning the fan-out.

## Done (recent)

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
