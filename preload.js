const { contextBridge, ipcRenderer } = require('electron');
contextBridge.exposeInMainWorld('native', {
  get: name => ipcRenderer.invoke('store:get', name),
  set: (name, json) => ipcRenderer.invoke('store:set', name, json),
  del: name => ipcRenderer.invoke('store:del', name),
  exportFile: (name, content) => ipcRenderer.invoke('export', { name, content }),
  importFile: () => ipcRenderer.invoke('import'),
  reveal: () => ipcRenderer.invoke('reveal'),
  version: () => ipcRenderer.invoke('version'),
  onUpdate: cb => ipcRenderer.on('update', (_e, m) => cb(m)),
  updateDownload: () => ipcRenderer.invoke('update:download'),
  updateInstall: () => ipcRenderer.invoke('update:install'),
});
