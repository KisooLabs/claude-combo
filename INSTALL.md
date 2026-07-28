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
Scroll to the **Assets** section and click `claude-combo-0.0.5.vsix`.
It downloads like any other file, into your `Downloads` folder.

If the browser asks whether to keep the file, keep it — a `.vsix` is a zip file that
VS Code knows how to open.

**Check:** the file `claude-combo-0.0.5.vsix` is in your Downloads folder.

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
`claude-combo-0.0.5.vsix`, and click **Install**.

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
`installed -> C:\Users\<you>\.vscode\extensions\kisoo.claude-combo-0.0.5`.
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
`installed -> /Users/<you>/.vscode/extensions/kisoo.claude-combo-0.0.5`.

**Step 5 — Reload VS Code.** `Cmd+Shift+P` → `Developer: Reload Window` → Enter.

**Check:** the status bar shows `⚡ <model> · <effort>`. Then do § A Step 6 to test a pick.

---

## D. Change which combos are offered

The list is yours — the extension ships four defaults and nothing is hardcoded.

`Ctrl+Shift+P` (Mac: `Cmd+Shift+P`) → `Claude Combo: Edit presets` → the settings editor
opens at `claudeCombo.presets`. The same entry is at the bottom of the QuickPick itself.

**Then press `Ctrl+S`.** This is the one step people miss. The window you are editing in
honours the *unsaved* text immediately, so your new combo shows up in its QuickPick and
everything looks finished — but every other window reads the file on disk and keeps the old
list. Saving propagates it at once, with no reload.

The extension nags you about exactly this: leave the file unsaved and the QuickPick grows a
`$(warning) Unsaved changes` row at the top, which saves the file when you select it.

**Which file am I editing?** Normally `%APPDATA%\Code\User\settings.json` on Windows,
`~/Library/Application Support/Code/User/settings.json` on Mac. But **if an account switcher
launched this window, it is not that file** — the switcher gives each window its own
`--user-data-dir`, e.g. `~/.claude-slots/<slot>/vscode-ud/User/settings.json`. VS Code labels
every one of them just `settings.json`, so hover the tab to see the real path. Editing one
of those reaches that account's windows and no others — see § E.

Field-by-field reference: README.md § Configuration.

---

## E. Use one preset list in every window

Skip this unless you use an account switcher. If you don't, your presets are already shared.

A switcher launches each window with its own VS Code `--user-data-dir`, so
`claudeCombo.presets` is per account: add a combo in one window and the others never see it,
no matter how many times you save. Nothing is broken — they are different files.

The fix is one shared file that lives outside every user-data-dir.

**Step 1 — Create it.** `Ctrl+Alt+M` → choose
**Share these presets with every window…**. (Equivalently: `Ctrl+Shift+P` →
`Claude Combo: Share presets with every window`.)

**Check:** `~/.claude-combo/config.json` opens in the editor, containing the presets you
already had. On Windows that is `C:\Users\<you>\.claude-combo\config.json`.

**Step 2 — Confirm it took over.** `Ctrl+Alt+M` → hover the status bar item, or look at the
`Edit presets…` row.

**Check:** it now names `…\.claude-combo\config.json` rather than the settings file.

**Step 3 — Edit there from now on.** `Edit presets…` opens that file, and `Ctrl+S` in it
reaches every window at once — no reload.

`claudeCombo.sharedConfigFile` points somewhere else if you prefer. The file may also carry
`applyTarget` and `slotsRoot`; whatever it defines wins over the per-window settings, and the
QuickPick's apply-target toggle writes back into it.

---

## F. Make one pick apply to every window

Skip this unless you use an account switcher (a tool that launches VS Code windows pinned
to different Claude accounts). If you don't, the default already applies everywhere.

By default a pick is written to the Claude config **the current window uses**. A switcher
gives each window its own config folder, and Claude *replaces* the home config with it
rather than merging the two — so a pick made in one window genuinely does not reach a
window pinned to a different account.

To make one pick hold across all of them:

`Ctrl+Alt+M` (Mac: `Cmd+Alt+M`) → at the bottom of the list choose
**Switch apply target** until it reads `currently: all slots`. Then pick a combo.

**Check:** the confirmation along the bottom reads
`Claude Combo → <your combo> (global + N slots)` with N greater than 0. Hovering the status
bar item names the home settings file plus the slot count.

What it does: writes the same `model` / `effortLevel` into `~/.claude/settings.json` and
into every slot's own `settings.json`. Nothing else in those files is touched.

Two consequences worth knowing:

- Slots belong to **different accounts**. A model one account can't use gets written to its
  slot anyway, and that account's next conversation will refuse it. Pick a combo every
  account can run.
- One pick now writes every slot, so it can overwrite an effort a *live* session in another
  account just set with `/effort`. Every file still gets its `.bak` (see § I).

The setting behind it is `claudeCombo.applyTarget: "allSlots"`; `claudeCombo.slotsRoot`
overrides the auto-detected vault folder if your switcher keeps it somewhere unusual.

---

## G. Update after editing the source

Only relevant to § B / § C. Editing `extension.js` or `package.json` in your clone does
**nothing** on its own — the running VS Code loads the *copy* under `.vscode/extensions`.
Every edit needs both:

1. Re-run the installer (§ B Step 4 / § C Step 4) — it overwrites the copy.
2. `Developer: Reload Window`.

**Check:** the behavior you changed is visible. If not, you skipped one of the two.

---

## H. Troubleshooting

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

**The pick seems to apply, but the new conversation runs a different model.**
Hover the status bar item: the tooltip names the exact file being written. If your window
was launched by an account switcher, that path is a per-account slot
(`~/.claude-slots/<slot>/config/settings.json`) rather than `~/.claude/` — that is correct,
because `CLAUDE_CONFIG_DIR` is where Claude itself reads from. Versions before 0.0.2 always
wrote `~/.claude/settings.json` and so had no effect in such a window.

**A pick applies in the window I made it in, but not in my other windows.**
Expected if an account switcher launched them: each window has its own Claude config folder
and Claude replaces the home one with it rather than merging. Switch the apply target to
**all slots** — § F.

**My preset list only exists in one window.**
Different cause, same symptom shape — and note `applyTarget` has nothing to do with it:
that setting only chooses which *Claude* settings file a picked combo is written to, while
the preset list is a *VS Code* setting in a different file entirely.

Other windows read that file from disk, so an unsaved `settings.json` tab applies in the
editing window alone. Press `Ctrl+S` in it (`%APPDATA%\Code\User\settings.json` on Windows)
— the other windows update immediately, no reload. Since 0.0.4 the QuickPick shows a
`$(warning) Unsaved settings.json` row while this is the case; selecting it saves the file.

If it is still window-local after saving, you edited the **Workspace** tab of the settings
editor instead of the User tab.

**The status bar shows a combo I didn't pick.**
It shows your user settings overlaid with the current project's
`.claude/settings.json` — a project-level file wins. That is correct behavior; it matches
how Claude Code itself resolves settings. Look at `<project>/.claude/settings.json`.

**I think it broke my settings file.**
Every write leaves the previous content next to it as `settings.json.bak`. Copy that file
back over `settings.json`.

---

## I. Uninstall

**From the .vsix install (§ A):** Extensions panel (`Ctrl+Shift+X`) → search
`Claude Combo` → gear icon → **Uninstall**.

**From a source install (§ B / § C):**

Windows:

```
powershell -NoProfile -Command "Remove-Item -Recurse -Force '$env:USERPROFILE\.vscode\extensions\kisoo.claude-combo-0.0.5'"
```

Mac:

```
rm -rf "$HOME/.vscode/extensions/kisoo.claude-combo-0.0.5"
```

Then `Developer: Reload Window`.

**Check:** the status bar item is gone. Any `model` / `effortLevel` values already written
into `settings.json` stay as they are — uninstalling changes no Claude setting.

---

## J. Owner's machines (copy-paste-ready)

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

A version bump renames the target folder, so after updating also delete the previous one —
two copies of the same extension id make VS Code load an unpredictable one:

```
powershell -NoProfile -Command "Remove-Item -Recurse -Force '$env:USERPROFILE\.vscode\extensions\kisoo.claude-combo-0.0.4'"
```

Installed as of 2026-07-28: **Home (Windows)** — VS Code only, 0.0.5.
Pending: Office (Windows), Macbook.
