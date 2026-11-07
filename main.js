const { app, BrowserWindow, ipcMain, dialog, shell } = require('electron');
const path = require('path');
const fs = require('fs');
const { autoUpdater } = require('electron-updater');

const dataFile = () => path.join(app.getPath('userData'), 'finances.json');
const backupDir = () => path.join(app.getPath('userData'), 'sauvegardes');

function createWindow() {
  const win = new BrowserWindow({
    width: 1320, height: 860, minWidth: 1000, minHeight: 640,
    title: 'Mes Finances', backgroundColor: '#F5F4F0', autoHideMenuBar: true,
    webPreferences: { preload: path.join(__dirname, 'preload.js'), contextIsolation: true, sandbox: true },
  });
  win.loadFile(path.join(__dirname, 'app', 'index.html'));
  win.webContents.setWindowOpenHandler(() => ({ action: 'deny' }));
  setupUpdates(win);
}

// Mises à jour depuis les « Releases » GitHub :
// 1) l'app demande avant de télécharger, 2) barre de progression, 3) demande de redémarrer pour installer.
let updWin = null, downloading = false;
function setupUpdates(win) {
  if (!app.isPackaged) return;
  updWin = win;
  autoUpdater.autoDownload = false;          // on attend le « oui » de l'utilisateur
  autoUpdater.autoInstallOnAppQuit = true;   // une fois téléchargée (donc acceptée), s'installe au pire à la fermeture
  const send = m => { if (!win.isDestroyed()) win.webContents.send('update', m); };
  const notes = n => typeof n === 'string' ? n : Array.isArray(n) ? n.map(x => x.note || '').join('\n') : '';
  autoUpdater.on('update-available', info => send({ type: 'available', version: info.version, notes: notes(info.releaseNotes) }));
  autoUpdater.on('download-progress', p => { win.setProgressBar(p.percent / 100); send({ type: 'progress', percent: p.percent, transferred: p.transferred, total: p.total }); });
  autoUpdater.on('update-downloaded', info => { downloading = false; win.setProgressBar(-1); send({ type: 'downloaded', version: info.version }); });
  autoUpdater.on('error', () => { win.setProgressBar(-1); if (downloading) send({ type: 'error' }); downloading = false; });
  const check = () => { if (!downloading) autoUpdater.checkForUpdates().catch(() => {}); };
  win.webContents.once('did-finish-load', check);
  setInterval(check, 6 * 60 * 60 * 1000);
}
ipcMain.handle('update:download', () => { downloading = true; autoUpdater.downloadUpdate().catch(() => {}); });
ipcMain.handle('update:install', () => setImmediate(() => autoUpdater.quitAndInstall(false, true)));

ipcMain.handle('load', () => {
  try { return JSON.parse(fs.readFileSync(dataFile(), 'utf8')); } catch { return null; }
});

ipcMain.handle('save', (_e, json) => {
  const f = dataFile();
  fs.mkdirSync(path.dirname(f), { recursive: true });
  // Une copie de sécurité par jour (on garde les 30 dernières)
  try {
    if (fs.existsSync(f)) {
      fs.mkdirSync(backupDir(), { recursive: true });
      const b = path.join(backupDir(), `finances-${new Date().toISOString().slice(0, 10)}.json`);
      if (!fs.existsSync(b)) {
        fs.copyFileSync(f, b);
        const all = fs.readdirSync(backupDir()).filter(n => n.endsWith('.json')).sort();
        all.slice(0, Math.max(0, all.length - 30)).forEach(n => fs.unlinkSync(path.join(backupDir(), n)));
      }
    }
  } catch {}
  const tmp = f + '.tmp';
  fs.writeFileSync(tmp, json, 'utf8');
  fs.renameSync(tmp, f);
  return true;
});

ipcMain.handle('export', async (e, { name, content }) => {
  const r = await dialog.showSaveDialog(BrowserWindow.fromWebContents(e.sender), { defaultPath: name });
  if (r.canceled || !r.filePath) return false;
  fs.writeFileSync(r.filePath, content, 'utf8');
  return r.filePath;
});

ipcMain.handle('import', async e => {
  const r = await dialog.showOpenDialog(BrowserWindow.fromWebContents(e.sender), {
    filters: [{ name: 'Sauvegarde', extensions: ['json'] }], properties: ['openFile'],
  });
  if (r.canceled || !r.filePaths[0]) return null;
  return fs.readFileSync(r.filePaths[0], 'utf8');
});

ipcMain.handle('version', () => app.getVersion());
ipcMain.handle('reveal', () => shell.showItemInFolder(dataFile()));

app.whenReady().then(createWindow);
app.on('window-all-closed', () => app.quit());
