const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electron', {
  openDirectory: () => ipcRenderer.invoke('open-directory'),
  openFile: (options) => ipcRenderer.invoke('open-file', options),
  getSubmissions: (projectId) => ipcRenderer.invoke('get-submissions', projectId)
});