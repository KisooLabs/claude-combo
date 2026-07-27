# Install / Update / Uninstall — Claude Combo

A runbook for someone who has never installed a VS Code extension by hand. Do the steps
in order; each one ends with a **Check** so you know it worked before moving on.

Before you start, you need:

- **VS Code** (or Cursor) installed and open.
- The **Claude Code** extension installed in it, and used at least once — that is what
  creates the settings file this extension writes to.

You do *not* need Node, npm, or git for § A.

Pick **one** install path:

| Path | Who it's for | Terminal needed? |
|---|---|---|
| **§ A — from the .vsix file** | everyone | no |
| **§ B / § C — from source** | people who want to edit the code | yes |

Both put the extension in the same folder, so doing both is pointless — not harmful,
just redundant.

---

## A. Install from the .vsix file (recommended)

**Step 1 — Download the file.**
Open <https://github.com/kisoolabs/claude-combo/releases/latest> in your browser.
Scroll to the **Assets** section and click `claude-combo-0.0.1.vsix`.
It downloads like any other file, into your `Downloads` folder.

If the browser asks whether to keep the file, keep it — a `.vsix` is a zip file that
VS Code knows how to open.

**Check:** the file `claude-combo-0.0.1.vsix` is in your Downloads folder.

**Step 2 — Open the Extensions panel in VS Code.**
Press `Ctrl+Shift+X` (Mac: `Cmd+Shift+X`). Or click the square-blocks icon in the left
sidebar.

**Check:** a panel titled **EXTENSIONS** appears on the left, with a search box at the top.

**Step 3 — Open the panel's menu.**
At the very top of that EXTENSIONS panel, on the right side of its title row, there is a
`…` button (three dots). Click it.

**Check:** a menu drops down with entries such as *Install from VSIX…*, *Show Installed
Extensions*, *Check for Extension Updates*.

**Step 4 — Click "Install from VSIX…" and pick the file.**
A file dialog opens. Go to your `Downloads` folder, select
`claude-combo-0.0.1.vsix`, and click **Install**.

**Check:** a notification appears at the bottom right: *"Completed installing extension"*.

**Step 5 — Look at the status bar.**
The status bar is the thin strip along the very bottom of the VS Code window. On its
right side you should now see something like `⚡ opus[1m] · medium`.

**Check:** you can see that item.
If you can't, press `Ctrl+Shift+P` (Mac: `Cmd+Shift+P`), type `Developer: Reload Window`,
press Enter, and look again.

**Step 6 — Try one pick.**
Press `Ctrl+Alt+M` (Mac: `Cmd+Alt+M`), or just click that status bar item. A list of
combos opens. Choose any one.

**Check:** a new Claude conversation opens **and** the status bar text changes to the
combo you picked.

**Important, and not a bug:** the combo you pick applies to that *new* conversation. A
conversation that was already running keeps its own model and effort — see README.md
§ Hard limitation.

Cursor works the same way: same panel, same `…` menu, same file.

---

## B. Install from source — Windows

Only if you want to edit the code. Needs `git`
(if `git` is not installed, get it from <https://git-scm.com/download/win>).

**Step 1 — Open PowerShell.**
Press `Win+X` and choose **Terminal** (on older Windows: **Windows PowerShell**).
A window with a blinking cursor opens.

**Check:** the prompt line ends with `>`, e.g. `PS C:\Users\you>`.

**Step 2 — Download the code.** Paste this line and press Enter:

```
git clone https://github.com/kisoolabs/claude-combo.git
```

**Check:** the output ends with something like `Resolving deltas: 100% ... done.`
The folder `claude-combo` now exists inside the folder shown in your prompt.

**Step 3 — Go into that folder.** Paste and press Enter:

```
cd claude-combo
```

**Check:** the prompt now ends with `\claude-combo>`.

**Step 4 — Run the installer.** Paste and press Enter:

```
powershell -ExecutionPolicy Bypass -File .\install.ps1
```

Add ` -Cursor` at the end of that line if you want it in Cursor as well.

**Check:** the output ends with
`installed -> C:\Users\<you>\.vscode\extensions\kisoo.claude-combo-0.0.1`.
If you got a red *execution policy* error instead, the `-ExecutionPolicy Bypass` part got
lost — paste the whole line again.

**Step 5 — Reload VS Code.**
`Ctrl+Shift+P` → type `Developer: Reload Window` → Enter.

**Check:** the status bar (bottom right) shows `⚡ <model> · <effort>`. Then do § A Step 6
to test a pick.

---

## C. Install from source — Mac

**Step 1 — Open Terminal.**
Press `Cmd+Space`, type `Terminal`, press Enter.

**Check:** a window with a text prompt ending in `$` or `%` opens.

**Step 2 — Download the code.** Paste and press Enter:

```
git clone https://github.com/kisoolabs/claude-combo.git
```

If macOS says the command needs developer tools, accept the install prompt and run the
line again once it finishes.

**Check:** the output ends with `done.` and a `claude-combo` folder now exists.

**Step 3 — Go into that folder:**

```
cd claude-combo
```

**Check:** the prompt now contains `claude-combo`.

**Step 4 — Run the installer:**

```
bash ./install.sh
```

Add ` --cursor` at the end for Cursor as well.

**Check:** the output ends with
`installed -> /Users/<you>/.vscode/extensions/kisoo.claude-combo-0.0.1`.

**Step 5 — Reload VS Code.** `Cmd+Shift+P` → `Developer: Reload Window` → Enter.

**Check:** the status bar shows `⚡ <model> · <effort>`. Then do § A Step 6 to test a pick.

---

## D. Change which combos are offered

The list is yours — the extension ships four defaults and nothing is hardcoded.

`Ctrl+Shift+P` (Mac: `Cmd+Shift+P`) → `Claude Combo: Edit presets` → the settings editor
opens at `claudeCombo.presets`. The same entry is at the bottom of the QuickPick itself.

Field-by-field reference: README.md § Configuration.

---

## E. Update after editing the source

Only relevant to § B / § C. Editing `extension.js` or `package.json` in your clone does
**nothing** on its own — the running VS Code loads the *copy* under `.vscode/extensions`.
Every edit needs both:

1. Re-run the installer (§ B Step 4 / § C Step 4) — it overwrites the copy.
2. `Developer: Reload Window`.

**Check:** the behavior you changed is visible. If not, you skipped one of the two.

**Version bump pitfall:** the install scripts hardcode the folder id
`kisoo.claude-combo-0.0.1`. If `package.json`'s `version` changes, update `$id` / `id` in
both `install.ps1` and `install.sh`, **and** delete the old
`kisoo.claude-combo-<oldversion>` folder — otherwise VS Code sees two copies of the same
extension and loads an unpredictable one. A released `.vsix` must be rebuilt for the new
version too (`npx @vscode/vsce package`).

---

## F. Troubleshooting

**No status bar item after installing.**
Reload the window first (`Developer: Reload Window`). Still nothing:
`Ctrl+Shift+P` → `Developer: Show Logs…` → `Extension Host`, and search that log for
`claude-combo`. Usual causes: the installer copied to a folder VS Code does not scan, or
`package.json` was edited into invalid JSON.

**"Install from VSIX…" is missing from the `…` menu.**
You opened the menu of the wrong panel. It must be the EXTENSIONS panel (`Ctrl+Shift+X`),
not the file Explorer.

**The QuickPick opens, but picking does nothing.**
The file it writes may be read-only or missing. Check that `~/.claude/settings.json`
exists and is writable — on Windows that is `C:\Users\<you>\.claude\settings.json`. An
error message naming the exact path appears in this case.

**The status bar shows a combo I didn't pick.**
It shows your user settings overlaid with the current project's
`.claude/settings.json` — a project-level file wins. That is correct behavior; it matches
how Claude Code itself resolves settings. Look at `<project>/.claude/settings.json`.

**I think it broke my settings file.**
Every write leaves the previous content next to it as `settings.json.bak`. Copy that file
back over `settings.json`.

---

## G. Uninstall

**From the .vsix install (§ A):** Extensions panel (`Ctrl+Shift+X`) → search
`Claude Combo` → gear icon → **Uninstall**.

**From a source install (§ B / § C):**

Windows:

```
powershell -NoProfile -Command "Remove-Item -Recurse -Force '$env:USERPROFILE\.vscode\extensions\kisoo.claude-combo-0.0.1'"
```

Mac:

```
rm -rf "$HOME/.vscode/extensions/kisoo.claude-combo-0.0.1"
```

Then `Developer: Reload Window`.

**Check:** the status bar item is gone. Any `model` / `effortLevel` values already written
into `settings.json` stay as they are — uninstalling changes no Claude setting.

---

## H. Owner's machines (copy-paste-ready)

The source folder is Syncthing-synced; only the installed copy is machine-local, so the
installer is re-run per machine and after every source edit.

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
