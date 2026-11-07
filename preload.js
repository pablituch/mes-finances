const { contextBridge, ipcRenderer } = require('electron');
contextBridge.exposeInMainWorld('native', {
  load: () => ipcRenderer.invoke('load'),
  save: json => ipcRenderer.invoke('save', json),
  exportFile: (name, content) => ipcRenderer.invoke('export', { name, content }),
  importFile: () => ipcRenderer.invoke('import'),
  reveal: () => ipcRenderer.invoke('reveal'),
  version: () => ipcRenderer.invoke('version'),
});
