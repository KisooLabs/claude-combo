# Install / Update / Uninstall — Claude Combo

Human runbook. Execute the steps in order; each step has a completion check.

The VS Code extensions folder is **machine-local**, so this runbook is run **once per
machine**, and again after any edit to the source (see § C).

Below, `<repo>` means the folder holding this file — the clone of
`https://github.com/kisoolabs/claude-combo`. Owner's own paths are listed in § F.

---

## A. Install (Windows)

**Step 1 — Open a terminal.**
In VS Code: `Ctrl+Shift+\`` (backtick). Any shell works.
완료 확인: a prompt appears in the terminal panel.

**Step 2 — Run the installer.** Paste exactly (substituting `<repo>`):

```
powershell -ExecutionPolicy Bypass -File "<repo>\install.ps1"
```

Add `-Cursor` at the end if you also want it in Cursor:

```
powershell -ExecutionPolicy Bypass -File "<repo>\install.ps1" -Cursor
```

완료 확인: the output ends with `installed -> C:\Users\<you>\.vscode\extensions\kisoo.claude-combo-0.0.1`.
If it printed an execution-policy error instead, the `-ExecutionPolicy Bypass` part was
dropped — re-paste the whole line.

**Step 3 — Reload the window.**
`Ctrl+Shift+P` → type `Developer: Reload Window` → Enter.
완료 확인: after the reload, the status bar (bottom right) shows an item like
`⚡ opus[1m] · medium`. That text is read from `C:\Users\<you>\.claude\settings.json`,
so it reflects your real current combo.

**Step 4 — Test one pick.**
Press `Ctrl+Alt+M` (or click the status bar item) → choose any combo.
완료 확인: a new Claude conversation tab opens **and** the status bar label changes to
the preset you picked.

**Pitfall at this step:** the pick applies to the conversation that just opened, not to
any conversation that was already running. That is a hard limit of the Claude Code
extension's API, not a bug here — see README.md § Hard limitation.

---

## B. Install (Mac)

**Step 1 — Open a terminal** (VS Code: `Ctrl+Shift+\``).

**Step 2 — Run the installer.** Paste exactly (substituting `<repo>`):

```
bash "<repo>/install.sh"
```

Add `--cursor` at the end for Cursor as well.
완료 확인: output ends with `installed -> /Users/<you>/.vscode/extensions/kisoo.claude-combo-0.0.1`.

**Step 3 — Reload the window.** `Cmd+Shift+P` → `Developer: Reload Window`.
완료 확인: status bar shows `⚡ <model> · <effort>`.

**Step 4 — Test one pick.** `Cmd+Alt+M` → choose a combo.
완료 확인: new Claude tab opens and the status bar label changes.

---

## C. Update after editing the source

Editing `extension.js` / `package.json` in this folder does **nothing** on its own — the
running VS Code loads the *copy* under `.vscode/extensions`. Every edit needs:

1. Re-run the installer (§ A Step 2 / § B Step 2) — it overwrites the copy.
2. `Developer: Reload Window`.

완료 확인: the behavior you changed is visible. If not, you skipped one of the two.

**Version bump pitfall:** the install scripts hardcode the folder id
`kisoo.claude-combo-0.0.1`. If `package.json`'s `version` is bumped, update `$id` /
`id` in both `install.ps1` and `install.sh` **and** delete the old
`kisoo.claude-combo-<oldversion>` folder — otherwise VS Code sees two copies of the
same extension and loads an unpredictable one.

---

## D. Troubleshooting

**No status bar item after reload.**
`Ctrl+Shift+P` → `Developer: Show Logs…` → `Extension Host`. Search for `claude-combo`.
Most likely causes: the installer copied to a folder VS Code does not scan (wrong
`$env:USERPROFILE`), or `package.json` was edited into invalid JSON.

**QuickPick opens but nothing happens on pick.**
The write target may be unwritable. Check that `~/.claude/settings.json` exists and is not
read-only. An error toast naming the path appears in this case.

**Wrong combo shown in the status bar.**
The status bar shows user settings overlaid with the current project's
`.claude/settings.json`. A project-level file wins — that is correct behavior, matching
how Claude Code resolves settings. Check `<project>/.claude/settings.json`.

**Settings file looks damaged.**
Every write leaves the prior content at `~/.claude/settings.json.bak`.
Restore by copying that file back over `settings.json`.

---

## E. Uninstall

**Windows:**

```
powershell -NoProfile -Command "Remove-Item -Recurse -Force '$env:USERPROFILE\.vscode\extensions\kisoo.claude-combo-0.0.1'"
```

**Mac:**

```
rm -rf "$HOME/.vscode/extensions/kisoo.claude-combo-0.0.1"
```

Then `Developer: Reload Window`.
완료 확인: the status bar item is gone. `model` / `effortLevel` already written into
`settings.json` stay as they are — uninstalling changes no Claude setting.

---

## F. Owner's machines (copy-paste-ready)

The source folder is Syncthing-synced; only the installed copy is machine-local.

Home / Office (Windows):

```
powershell -ExecutionPolicy Bypass -File "C:\Users\kisoo\Sharing\Development\Claude Combo Extension\install.ps1"
```

Macbook:

```
bash "/Users/kisookim/Sharing/Development/Claude Combo Extension/install.sh"
```

Installed as of 2026-07-27: **Home (Windows)** — VS Code only.
Pending: Office (Windows), Macbook.
