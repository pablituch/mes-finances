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

// Mises à jour automatiques depuis les « Releases » GitHub
function setupUpdates(win) {
  if (!app.isPackaged) return;
  autoUpdater.autoDownload = true;          // télécharge en arrière-plan
  autoUpdater.autoInstallOnAppQuit = true;  // sinon s'installe à la fermeture
  autoUpdater.on('update-downloaded', async info => {
    const r = await dialog.showMessageBox(win, {
      type: 'info', title: 'Mise à jour disponible',
      buttons: ['Redémarrer maintenant', 'Plus tard'], defaultId: 0, cancelId: 1,
      message: `La version ${info.version} de Mes Finances est prête.`,
      detail: "Tes données sont conservées. Si tu choisis « Plus tard », elle s'installera à la prochaine fermeture de l'app.",
    });
    if (r.response === 0) autoUpdater.quitAndInstall();
  });
  autoUpdater.on('error', () => {}); // pas d'Internet, GitHub indisponible… on réessaiera au prochain lancement
  const check = () => autoUpdater.checkForUpdates().catch(() => {});
  check();
  setInterval(check, 6 * 60 * 60 * 1000);
}

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
