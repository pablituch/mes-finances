const { contextBridge, ipcRenderer } = require('electron');
contextBridge.exposeInMainWorld('native', {
  load: () => ipcRenderer.invoke('load'),
  save: json => ipcRenderer.invoke('save', json),
  exportFile: (name, content) => ipcRenderer.invoke('export', { name, content }),
  importFile: () => ipcRenderer.invoke('import'),
  reveal: () => ipcRenderer.invoke('reveal'),
  version: () => ipcRenderer.invoke('version'),
  onUpdate: cb => ipcRenderer.on('update', (_e, m) => cb(m)),
  updateDownload: () => ipcRenderer.invoke('update:download'),
  updateInstall: () => ipcRenderer.invoke('update:install'),
});
