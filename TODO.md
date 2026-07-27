# TODO — Claude Combo Extension

## Now

- [ ] Verify 0.0.2 in a switcher window after the owner reloads: pick a combo, confirm the
      tooltip names `~/.claude-slots/<slot>/config/settings.json` and the new conversation
      actually starts on the picked model.

## Next

- [ ] Install 0.0.2 on the other machines (Office Windows, Macbook) — `.vsix` path or the
      install script; delete any leftover `kisoo.claude-combo-0.0.1` folder there first.

## Blocked

- (none)

## Inbox

- (optional) `claudeCode.claudeProcessWrapper` experiment — could a wrapper inject
  `--model` / `--effort` and thus fix a *running* session? Untested; see CLAUDE.md § Known limit.

## Done (recent)

- 2026-07-27 0.0.2: fixed the account-switcher bug (user settings now resolve through
  `CLAUDE_CONFIG_DIR`, so a pick lands where Claude actually reads) + removed every Korean
  string from the extension UI, presets, comments and docs. Repackaged, 0.0.1 uninstalled and
  its folder deleted, 0.0.2 installed and verified on Home Windows.
- 2026-07-27 Public release: repo public at github.com/kisoolabs/claude-combo (MIT, hero,
  topics), listed on kisoolabs.github.io Programs, v0.0.1 release with a `.vsix` so install
  needs no terminal, README/INSTALL rewritten for a first-time user.

<!-- Next session: bug fix + English sweep are both execution-tier → `claude --model opus`,
     /effort medium. (dated 2026-07-27) -->
