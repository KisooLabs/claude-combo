const vscode = require('vscode');
const fs = require('fs');
const os = require('os');
const path = require('path');

const USER_SETTINGS = path.join(os.homedir(), '.claude', 'settings.json');
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
      'Claude Combo: 열린 워크스페이스 폴더가 없어 user settings에 적용합니다.'
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
    throw new Error(`${p} 읽기/파싱 실패: ${e.message}`);
  }
}

// read-modify-write: 두 키만 갈아끼우고 나머지 키·순서는 그대로 둔다.
// 실행 중인 Claude 세션이 /effort 등으로 같은 파일을 쓰는 경합은 완전히 막을 수 없어
// 덮어쓰기 직전 상태를 .bak 한 개로 남긴다.
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

/** Claude Code의 실제 해석 순서(user < project)를 그대로 흉내낸 현재 값. */
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
      '**Claude Combo** — 클릭해서 모델 + effort 선택',
      '',
      `- 현재: \`${cur.model || 'default'}\` · \`${cur.effortLevel || 'default'}\``,
      `- 적용 대상: \`${target || '(워크스페이스 없음)'}\``,
      '',
      '선택은 **새 대화**부터 적용됩니다. 진행 중인 세션은 `/model` + `/effort`가 필요합니다.',
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
      console.warn(`claude-combo: ${cmd} 실행 실패`, e);
    }
  }
  return false;
}

async function applyPreset(preset, forceWorkspace) {
  if (preset.effort && !VALID_EFFORTS.includes(preset.effort)) {
    vscode.window.showErrorMessage(
      `Claude Combo: effort "${preset.effort}"는 허용되지 않습니다 (${VALID_EFFORTS.join(', ')}). 프리셋을 고쳐주세요.`
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
    vscode.window.showErrorMessage(`Claude Combo: ${p} 쓰기 실패 — ${e.message}`);
    return;
  }

  refreshStatusBar();

  const opened = cfg().get('openNewConversationAfterPick') ? await openNewConversation() : false;
  const where = p === USER_SETTINGS ? 'user' : 'project';
  const tail = opened ? '새 대화에 적용됨.' : '다음 새 대화부터 적용됩니다.';
  vscode.window.setStatusBarMessage(
    `Claude Combo → ${presetLabel(preset)} (${where}) — ${tail}`,
    6000
  );
}

async function pick(forceWorkspace) {
  const list = presets();
  if (list.length === 0) {
    const choice = await vscode.window.showWarningMessage(
      'Claude Combo: 프리셋이 비어 있습니다.',
      '프리셋 편집'
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
    label: '$(gear) 프리셋 편집…',
    detail: 'settings.json의 claudeCombo.presets 열기',
    _action: 'edit',
  });
  const target = cfg().get('applyTarget') || 'user';
  items.push({
    label: '$(arrow-swap) 적용 대상 전환',
    description: `현재: ${target}`,
    detail: target === 'user' ? 'workspace(이 프로젝트 전용)로 전환' : 'user(전역)로 전환',
    _action: 'toggleTarget',
  });

  const picked = await vscode.window.showQuickPick(items, {
    title: `Claude Combo — 적용 대상: ${forceWorkspace ? 'workspace (이번만)' : target}`,
    placeHolder: '모델 + effort 콤보 선택 (새 대화부터 적용)',
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
  // ~/.claude 는 워크스페이스 밖이라 FileSystemWatcher가 닿지 않는다. 폴링으로 처리.
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
