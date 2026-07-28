# TODO — Claude Combo Extension

## Now

- [ ] Verify 0.0.3 after the owner reloads the window: `Ctrl+Alt+M` → **Switch apply target**
      until it reads `currently: all slots` → pick a combo. Expect
      `Claude Combo → <combo> (global + 185 slots)`, then confirm a *differently pinned*
      window's next conversation starts on that combo.

## Next

- [ ] Install 0.0.3 on the other machines (Office Windows, Macbook) — `.vsix` from the
      release or the install script; delete the leftover `kisoo.claude-combo-0.0.2` folder
      there first.

## Blocked

- (none)

## Inbox

- (optional) `claudeCode.claudeProcessWrapper` experiment — could a wrapper inject
  `--model` / `--effort` and thus fix a *running* session? Untested; see CLAUDE.md § Known limit.
- (optional) `allSlots` writes a model into slots whose account may not have it. If that
  ever bites, the fix is per-slot preset filtering, not abandoning the fan-out.

## Done (recent)

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
