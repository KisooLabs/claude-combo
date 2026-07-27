const vscode = require('vscode');
const fs = require('fs');
const os = require('os');
const path = require('path');

// Claude reads its user settings from CLAUDE_CONFIG_DIR when that is set — which is how
// claude-account-switcher gives each window its own account slot
// (~/.claude-slots/<slot>/config). Hardcoding ~/.claude made every pick a no-op in such a
// window, and made the status bar report a combo no session was actually running.
const CLAUDE_DIR = process.env.CLAUDE_CONFIG_DIR || path.join(os.homedir(), '.claude');
const USER_SETTINGS = path.join(CLAUDE_DIR, 'settings.json');
const VALID_EFFORTS = ['low', 'medium', 'high', 'xhigh'];

/** @type {vscode.StatusBarItem | undefined} */
let statusItem;
/** @type {Set<string>} */
const watched = new Set();

function cfg() {
  return vscode.workspace.getConfiguration('claudeCombo');
}

function presets() {
  const raw = cfg().get('presets');
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

function targetPath(forceWorkspace) {
  const target = forceWorkspace ? 'workspace' : cfg().get('applyTarget') || 'user';
  if (target !== 'workspace') return USER_SETTINGS;
  const p = workspaceSettingsPath();
  if (!p) {
    vscode.window.showWarningMessage(
      'Claude Combo: no workspace folder is open — applying to the user settings instead.'
    );
    return USER_SETTINGS;
  }
  return p;
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
  const target = cfg().get('applyTarget') === 'workspace' ? workspaceSettingsPath() : USER_SETTINGS;
  statusItem.tooltip = new vscode.MarkdownString(
    [
      '**Claude Combo** — click to pick a model + effort combo',
      '',
      `- Current: \`${cur.model || 'default'}\` · \`${cur.effortLevel || 'default'}\``,
      `- Writes to: \`${target || '(no workspace folder)'}\``,
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

  const p = targetPath(forceWorkspace);
  let settings;
  try {
    settings = readSettings(p);
  } catch (e) {
    vscode.window.showErrorMessage(`Claude Combo: ${e.message}`);
    return;
  }

  settings.model = preset.model;
  if (preset.effort) settings.effortLevel = preset.effort;

  try {
    writeSettings(p, settings);
  } catch (e) {
    vscode.window.showErrorMessage(`Claude Combo: could not write ${p} — ${e.message}`);
    return;
  }

  refreshStatusBar();

  const opened = cfg().get('openNewConversationAfterPick') ? await openNewConversation() : false;
  const where = p === USER_SETTINGS ? 'user' : 'project';
  const tail = opened ? 'applied to the new conversation.' : 'applies to the next new conversation.';
  vscode.window.setStatusBarMessage(
    `Claude Combo → ${presetLabel(preset)} (${where}) — ${tail}`,
    6000
  );
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

  items.push({ label: '', kind: vscode.QuickPickItemKind.Separator });
  items.push({
    label: '$(gear) Edit presets…',
    detail: 'Open claudeCombo.presets in settings.json',
    _action: 'edit',
  });
  const target = cfg().get('applyTarget') || 'user';
  items.push({
    label: '$(arrow-swap) Switch apply target',
    description: `currently: ${target}`,
    detail:
      target === 'user'
        ? 'Switch to workspace (this project only)'
        : 'Switch to user (everywhere)',
    _action: 'toggleTarget',
  });

  const picked = await vscode.window.showQuickPick(items, {
    title: `Claude Combo — writes to: ${forceWorkspace ? 'workspace (this pick only)' : target}`,
    placeHolder: 'Pick a model + effort combo (applies to the next conversation)',
    matchOnDescription: true,
    matchOnDetail: true,
  });
  if (!picked) return;

  if (picked._action === 'edit') return editPresets();
  if (picked._action === 'toggleTarget') {
    const next = target === 'user' ? 'workspace' : 'user';
    await cfg().update('applyTarget', next, vscode.ConfigurationTarget.Global);
    refreshStatusBar();
    return pick(forceWorkspace);
  }
  if (picked._preset) return applyPreset(picked._preset, forceWorkspace);
}

async function editPresets() {
  await vscode.commands.executeCommand('workbench.action.openSettingsJson', {
    revealSetting: { key: 'claudeCombo.presets', edit: true },
  });
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
    vscode.workspace.onDidChangeConfiguration((e) => {
      if (e.affectsConfiguration('claudeCombo')) refreshStatusBar();
    }),
    vscode.window.onDidChangeWindowState((s) => {
      if (s.focused) refreshStatusBar();
    })
  );

  watchFile(USER_SETTINGS);
  watchFile(workspaceSettingsPath());
  refreshStatusBar();
}

function deactivate() {
  for (const p of watched) fs.unwatchFile(p, refreshStatusBar);
  watched.clear();
}

module.exports = { activate, deactivate };
