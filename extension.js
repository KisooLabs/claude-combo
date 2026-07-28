const vscode = require('vscode');
const fs = require('fs');
const os = require('os');
const path = require('path');

// Claude reads its user settings from CLAUDE_CONFIG_DIR when that is set — which is how
// claude-account-switcher gives each window its own account slot
// (~/.claude-slots/<slot>/config). Hardcoding ~/.claude made every pick a no-op in such a
// window, and made the status bar report a combo no session was actually running.
const HOME = os.homedir();
const GLOBAL_SETTINGS = path.join(HOME, '.claude', 'settings.json');
const DEFAULT_SHARED_CONFIG = path.join(HOME, '.claude-combo', 'config.json');
const CLAUDE_DIR = process.env.CLAUDE_CONFIG_DIR || path.join(HOME, '.claude');
const USER_SETTINGS = path.join(CLAUDE_DIR, 'settings.json');
const VALID_EFFORTS = ['low', 'medium', 'high', 'xhigh'];
const TARGETS = ['user', 'workspace', 'allSlots'];
const TARGET_LABEL = { user: 'user', workspace: 'workspace', allSlots: 'all slots' };
const TARGET_BLURB = {
  user: "this window's Claude config only",
  workspace: 'this project only',
  allSlots: 'global + every account slot',
};

/** @type {vscode.StatusBarItem | undefined} */
let statusItem;
/** @type {Set<string>} */
const watched = new Set();

function cfg() {
  return vscode.workspace.getConfiguration('claudeCombo');
}

function expandHome(p) {
  return String(p).replace(/^~(?=[/\\]|$)/, HOME);
}

function sharedConfigPath() {
  const configured = String(cfg().get('sharedConfigFile') || '').trim();
  return configured ? expandHome(configured) : DEFAULT_SHARED_CONFIG;
}

/**
 * The one file every window can agree on. VS Code *settings* cannot play this role: an
 * account switcher gives each window its own `--user-data-dir`, so `claudeCombo.presets`
 * edited in one window is invisible to a window on another slot — the same shape of trap as
 * CLAUDE_CONFIG_DIR, one layer up. A plain file outside every user-data-dir is immune.
 *
 * Accepts an array (presets only) or `{ presets, applyTarget, slotsRoot }`. Absent → null,
 * which is not an error; unparseable → error, and the caller falls back to the settings.
 * @returns {{ config: object | null, error: string | null, path: string }}
 */
function sharedConfig() {
  const p = sharedConfigPath();
  try {
    const txt = fs.readFileSync(p, 'utf8');
    if (!txt.trim()) return { config: null, error: null, path: p };
    const parsed = JSON.parse(txt);
    if (Array.isArray(parsed)) return { config: { presets: parsed }, error: null, path: p };
    if (!parsed || typeof parsed !== 'object') {
      return { config: null, error: 'expected an object or an array', path: p };
    }
    return { config: parsed, error: null, path: p };
  } catch (e) {
    if (e && e.code === 'ENOENT') return { config: null, error: null, path: p };
    return { config: null, error: e.message, path: p };
  }
}

function presets() {
  const shared = sharedConfig().config;
  const raw = shared && Array.isArray(shared.presets) ? shared.presets : cfg().get('presets');
  if (!Array.isArray(raw)) return [];
  return raw.filter((p) => p && typeof p.model === 'string' && p.model.trim());
}

function presetLabel(p) {
  if (p.label && p.label.trim()) return p.label;
  return p.effort ? `${p.model} · ${p.effort}` : p.model;
}

function workspaceSettingsPath() {
  const folders = vscode.workspace.workspaceFolders;
  if (!folders || folders.length === 0) return null;
  return path.join(folders[0].uri.fsPath, '.claude', 'settings.json');
}

function activeTarget(forceWorkspace) {
  if (forceWorkspace) return 'workspace';
  const shared = sharedConfig().config;
  const t = (shared && shared.applyTarget) || cfg().get('applyTarget');
  return TARGETS.includes(t) ? t : 'user';
}

/**
 * Root that holds the account switcher's per-account vaults. A vault is
 * `<root>/<slot>/config`, and this window's CLAUDE_CONFIG_DIR *is* one of them, so the
 * root is two levels up from it. Falls back to the switcher's default location.
 */
function slotsRoot() {
  const shared = sharedConfig().config;
  const configured = String((shared && shared.slotsRoot) || cfg().get('slotsRoot') || '').trim();
  if (configured) return expandHome(configured);
  const pinned = process.env.CLAUDE_CONFIG_DIR;
  if (pinned && path.basename(pinned) === 'config') {
    return path.dirname(path.dirname(pinned));
  }
  return path.join(HOME, '.claude-slots');
}

/**
 * `<root>/<slot>/config/settings.json` for every slot that has a `config/` directory.
 * Keyed on the directory, not the file, so a vault that has not written settings yet is
 * still pinned; a non-vault entry under the root (a stray file, a `sessions/` dir) has no
 * `config/` and is skipped. Missing root → no slots, no error.
 */
function slotSettingsPaths() {
  const root = slotsRoot();
  let entries;
  try {
    entries = fs.readdirSync(root, { withFileTypes: true });
  } catch (e) {
    if (!e || e.code !== 'ENOENT') console.warn('claude-combo: could not read', root, e);
    return [];
  }
  const out = [];
  for (const d of entries) {
    if (!d.isDirectory()) continue;
    const dir = path.join(root, d.name, 'config');
    try {
      if (fs.statSync(dir).isDirectory()) out.push(path.join(dir, 'settings.json'));
    } catch {
      // no config/ — not a vault
    }
  }
  return out;
}

/**
 * Every file one pick writes. More than one only for `allSlots`: CLAUDE_CONFIG_DIR
 * *replaces* ~/.claude rather than layering over it, so a combo that is meant to hold
 * across account slots has to be written into each slot's own settings.json.
 */
function targetPaths(forceWorkspace) {
  const target = activeTarget(forceWorkspace);
  if (target === 'workspace') {
    const p = workspaceSettingsPath();
    if (p) return [p];
    vscode.window.showWarningMessage(
      'Claude Combo: no workspace folder is open — applying to the user settings instead.'
    );
    return [USER_SETTINGS];
  }
  if (target === 'allSlots') {
    // USER_SETTINGS last: a vault living outside the slots root would otherwise be missed.
    return [...new Set([GLOBAL_SETTINGS, ...slotSettingsPaths(), USER_SETTINGS])];
  }
  return [USER_SETTINGS];
}

function describeTargets(forceWorkspace, paths) {
  const target = activeTarget(forceWorkspace);
  if (target === 'allSlots') {
    const slots = paths.filter((p) => p !== GLOBAL_SETTINGS).length;
    return `global + ${slots} slot${slots === 1 ? '' : 's'}`;
  }
  if (paths[0] === USER_SETTINGS) return 'user';
  return 'project';
}

/**
 * Settings files open with unsaved edits. VS Code applies a dirty settings.json's content
 * in the window doing the editing, but other windows only ever see the file on disk — so an
 * unsaved preset edit looks applied to its author and is invisible everywhere else. Twice
 * mistaken for a bug, hence the warning.
 */
function dirtySettingsDocs() {
  const shared = sharedConfigPath().toLowerCase();
  return vscode.workspace.textDocuments.filter((d) => {
    if (!d.isDirty) return false;
    if (d.uri.scheme === 'file' && d.uri.fsPath.toLowerCase() === shared) return true;
    if (path.posix.basename(d.uri.path) !== 'settings.json') return false;
    // user settings open as vscode-userdata:, workspace settings as file:.../.vscode/
    return d.uri.scheme === 'vscode-userdata' || d.uri.path.includes('/.vscode/');
  });
}

function readSettings(p) {
  try {
    const txt = fs.readFileSync(p, 'utf8');
    if (!txt.trim()) return {};
    return JSON.parse(txt);
  } catch (e) {
    if (e && e.code === 'ENOENT') return {};
    throw new Error(`could not read/parse ${p}: ${e.message}`);
  }
}

// read-modify-write: only the two keys change; every other key and the key order survive.
// A running Claude session writing the same file (e.g. /effort persisting its choice) can
// still race this, so the state just before each overwrite is kept as a single .bak.
function writeSettings(p, obj) {
  fs.mkdirSync(path.dirname(p), { recursive: true });
  if (fs.existsSync(p)) {
    try {
      fs.copyFileSync(p, `${p}.bak`);
    } catch (e) {
      console.warn('claude-combo: backup failed', e);
    }
  }
  const tmp = `${p}.claude-combo.tmp`;
  fs.writeFileSync(tmp, `${JSON.stringify(obj, null, 2)}\n`, 'utf8');
  fs.renameSync(tmp, p);
}

/** Current value, resolved the way Claude Code itself resolves it (user < project). */
function effectiveCombo() {
  let merged = {};
  try {
    merged = readSettings(USER_SETTINGS);
  } catch (e) {
    console.warn('claude-combo:', e.message);
  }
  const ws = workspaceSettingsPath();
  if (ws) {
    try {
      merged = { ...merged, ...readSettings(ws) };
    } catch (e) {
      console.warn('claude-combo:', e.message);
    }
  }
  return { model: merged.model, effortLevel: merged.effortLevel };
}

function refreshStatusBar() {
  if (!statusItem) return;
  if (!cfg().get('showStatusBarItem')) {
    statusItem.hide();
    return;
  }
  const cur = effectiveCombo();
  const match = presets().find(
    (p) => p.model === cur.model && (p.effort || undefined) === cur.effortLevel
  );
  const label = match
    ? presetLabel(match)
    : `${cur.model || 'default'} · ${cur.effortLevel || 'default'}`;
  statusItem.text = `$(zap) ${label}`;
  const target = activeTarget(false);
  let writesTo;
  if (target === 'allSlots') {
    const slots = slotSettingsPaths().length;
    writesTo = `\`${GLOBAL_SETTINGS}\` + ${slots} slot config${slots === 1 ? '' : 's'} under \`${slotsRoot()}\``;
  } else if (target === 'workspace') {
    writesTo = `\`${workspaceSettingsPath() || '(no workspace folder)'}\``;
  } else {
    writesTo = `\`${USER_SETTINGS}\``;
  }
  statusItem.tooltip = new vscode.MarkdownString(
    [
      '**Claude Combo** — click to pick a model + effort combo',
      '',
      `- Current: \`${cur.model || 'default'}\` · \`${cur.effortLevel || 'default'}\``,
      `- Presets from: ${
        sharedConfig().config ? `\`${sharedConfigPath()}\`` : '`claudeCombo.presets` (this window only)'
      }`,
      `- Writes to: ${writesTo}`,
      '',
      'A pick applies to the **next** conversation. A running session still needs `/model` + `/effort`.',
    ].join('\n')
  );
  statusItem.show();
}

async function openNewConversation() {
  const all = await vscode.commands.getCommands(true);
  for (const cmd of ['claude-vscode.newConversation', 'claude-vscode.editor.open']) {
    if (!all.includes(cmd)) continue;
    try {
      await vscode.commands.executeCommand(cmd);
      return true;
    } catch (e) {
      console.warn(`claude-combo: ${cmd} failed`, e);
    }
  }
  return false;
}

async function applyPreset(preset, forceWorkspace) {
  if (preset.effort && !VALID_EFFORTS.includes(preset.effort)) {
    vscode.window.showErrorMessage(
      `Claude Combo: effort "${preset.effort}" is not allowed (${VALID_EFFORTS.join(', ')}). Fix the preset.`
    );
    return;
  }

  const paths = targetPaths(forceWorkspace);
  // Each file is independent: one unreadable slot must not cost the other 180 their write.
  let written = 0;
  /** @type {string[]} */
  const failed = [];
  for (const p of paths) {
    try {
      const settings = readSettings(p);
      settings.model = preset.model;
      if (preset.effort) settings.effortLevel = preset.effort;
      writeSettings(p, settings);
      written++;
    } catch (e) {
      console.warn('claude-combo:', e);
      failed.push(`${p} — ${e.message}`);
    }
  }

  if (written === 0) {
    vscode.window.showErrorMessage(
      `Claude Combo: nothing was written. ${failed[0] || 'no target file resolved.'}`
    );
    return;
  }

  refreshStatusBar();

  if (failed.length) {
    vscode.window.showWarningMessage(
      `Claude Combo: wrote ${written} file${written === 1 ? '' : 's'}, ${failed.length} failed. First: ${failed[0]}`
    );
  }

  const opened = cfg().get('openNewConversationAfterPick') ? await openNewConversation() : false;
  const where = describeTargets(forceWorkspace, paths);
  const tail = opened ? 'applied to the new conversation.' : 'applies to the next new conversation.';
  const msg = `Claude Combo → ${presetLabel(preset)} (${where}) — ${tail}`;
  // A fan-out touched every account on the machine; that deserves a receipt that survives a
  // hidden status bar (workbench.statusBar.visible: false swallows setStatusBarMessage).
  if (paths.length > 1) vscode.window.showInformationMessage(msg);
  else vscode.window.setStatusBarMessage(msg, 6000);
}

async function pick(forceWorkspace) {
  const list = presets();
  if (list.length === 0) {
    const choice = await vscode.window.showWarningMessage(
      'Claude Combo: the preset list is empty.',
      'Edit presets'
    );
    if (choice) await editPresets();
    return;
  }

  /** @type {(vscode.QuickPickItem & {_preset?: object, _action?: string})[]} */
  const items = list.map((p) => ({
    label: presetLabel(p),
    description: p.effort ? `${p.model} · ${p.effort}` : p.model,
    detail: p.detail,
    _preset: p,
  }));

  const dirty = dirtySettingsDocs();
  const broken = sharedConfig().error;
  const warnings = [];
  if (broken) {
    warnings.push({
      label: '$(error) Shared config is not valid JSON',
      description: 'falling back to the claudeCombo.presets setting',
      detail: `${sharedConfigPath()} — ${broken}`,
      _action: 'edit',
    });
  }
  if (dirty.length) {
    warnings.push({
      label: '$(warning) Unsaved changes — press Ctrl+S there',
      description: 'until saved, the edit applies to THIS window only',
      detail: `Select to save now: ${dirty.map((d) => d.uri.fsPath).join(', ')}`,
      _action: 'saveSettings',
    });
  }
  if (warnings.length) {
    items.unshift(...warnings, { label: '', kind: vscode.QuickPickItemKind.Separator });
  }

  const sharedExists = fs.existsSync(sharedConfigPath());
  items.push({ label: '', kind: vscode.QuickPickItemKind.Separator });
  items.push({
    label: '$(gear) Edit presets…',
    detail: sharedExists
      ? `Open ${sharedConfigPath()} — shared by every window`
      : 'Open claudeCombo.presets in settings.json',
    _action: 'edit',
  });
  if (!sharedExists) {
    items.push({
      label: '$(link) Share these presets with every window…',
      description: 'account switchers give each window its own VS Code settings',
      detail: `Create ${sharedConfigPath()} from the current presets`,
      _action: 'createShared',
    });
  }
  const target = activeTarget(false);
  const next = TARGETS[(TARGETS.indexOf(target) + 1) % TARGETS.length];
  items.push({
    label: '$(arrow-swap) Switch apply target',
    description: `currently: ${TARGET_LABEL[target]}`,
    detail: `Switch to ${TARGET_LABEL[next]} (${TARGET_BLURB[next]})`,
    _action: 'toggleTarget',
  });

  const picked = await vscode.window.showQuickPick(items, {
    title: `Claude Combo — writes to: ${
      forceWorkspace ? 'workspace (this pick only)' : TARGET_LABEL[target]
    }`,
    placeHolder: 'Pick a model + effort combo (applies to the next conversation)',
    matchOnDescription: true,
    matchOnDetail: true,
  });
  if (!picked) return;

  if (picked._action === 'saveSettings') {
    const saved = [];
    for (const d of dirty) {
      try {
        if (await d.save()) saved.push(d.uri.fsPath);
      } catch (e) {
        console.warn('claude-combo:', e);
      }
    }
    vscode.window.showInformationMessage(
      saved.length
        ? `Claude Combo: saved ${saved.length} settings file${saved.length === 1 ? '' : 's'} — your other windows have the presets now.`
        : 'Claude Combo: could not save the settings file. Press Ctrl+S in its tab.'
    );
    refreshStatusBar();
    return pick(forceWorkspace);
  }
  if (picked._action === 'edit') return editPresets();
  if (picked._action === 'createShared') return createSharedConfig();
  if (picked._action === 'toggleTarget') {
    // Whichever file is actually in charge is the one that has to change, or the toggle
    // would appear to do nothing.
    const shared = sharedConfig();
    if (shared.config && typeof shared.config.applyTarget === 'string') {
      try {
        writeSettings(shared.path, { ...shared.config, applyTarget: next });
      } catch (e) {
        vscode.window.showErrorMessage(`Claude Combo: could not write ${shared.path} — ${e.message}`);
        return;
      }
    } else {
      await cfg().update('applyTarget', next, vscode.ConfigurationTarget.Global);
    }
    refreshStatusBar();
    return pick(forceWorkspace);
  }
  if (picked._preset) return applyPreset(picked._preset, forceWorkspace);
}

async function openInEditor(p) {
  const doc = await vscode.workspace.openTextDocument(vscode.Uri.file(p));
  await vscode.window.showTextDocument(doc);
}

async function editPresets() {
  const p = sharedConfigPath();
  if (fs.existsSync(p)) {
    await openInEditor(p);
    vscode.window.showInformationMessage(
      `Claude Combo: press Ctrl+S when done — every window reads its presets from ${p}.`
    );
    return;
  }
  await vscode.commands.executeCommand('workbench.action.openSettingsJson', {
    revealSetting: { key: 'claudeCombo.presets', edit: true },
  });
  // Said up front because the failure is silent: the editing window honours the unsaved
  // buffer, so nothing looks wrong until another window shows a stale list.
  vscode.window.showInformationMessage(
    'Claude Combo: press Ctrl+S when done — an unsaved settings.json applies to this window only.'
  );
}

/** Move the current presets out of the per-window VS Code settings into the shared file. */
async function createSharedConfig() {
  const p = sharedConfigPath();
  if (fs.existsSync(p)) {
    await openInEditor(p);
    vscode.window.showInformationMessage(`Claude Combo: ${p} already exists — opened it.`);
    return;
  }
  try {
    writeSettings(p, { presets: presets(), applyTarget: activeTarget(false) });
  } catch (e) {
    vscode.window.showErrorMessage(`Claude Combo: could not write ${p} — ${e.message}`);
    return;
  }
  watchFile(p);
  refreshStatusBar();
  await openInEditor(p);
  vscode.window.showInformationMessage(
    `Claude Combo: created ${p}. Every window now takes its presets from this one file, whichever VS Code settings it was launched with.`
  );
}

function watchFile(p) {
  if (!p || watched.has(p)) return;
  watched.add(p);
  // The Claude config dir sits outside the workspace, where FileSystemWatcher can't reach.
  // Poll instead.
  fs.watchFile(p, { interval: 3000 }, refreshStatusBar);
}

function activate(context) {
  statusItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
  statusItem.command = 'claudeCombo.pick';
  context.subscriptions.push(statusItem);

  context.subscriptions.push(
    vscode.commands.registerCommand('claudeCombo.pick', () => pick(false)),
    vscode.commands.registerCommand('claudeCombo.pickForWorkspace', () => pick(true)),
    vscode.commands.registerCommand('claudeCombo.editPresets', editPresets),
    vscode.commands.registerCommand('claudeCombo.createSharedConfig', createSharedConfig),
    vscode.workspace.onDidChangeConfiguration((e) => {
      if (e.affectsConfiguration('claudeCombo')) refreshStatusBar();
    }),
    vscode.window.onDidChangeWindowState((s) => {
      if (s.focused) refreshStatusBar();
    })
  );

  watchFile(USER_SETTINGS);
  watchFile(workspaceSettingsPath());
  watchFile(sharedConfigPath());
  refreshStatusBar();
}

function deactivate() {
  for (const p of watched) fs.unwatchFile(p, refreshStatusBar);
  watched.clear();
}

module.exports = { activate, deactivate };
