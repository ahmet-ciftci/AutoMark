const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electron', {
  openDirectory: () => ipcRenderer.invoke('open-directory'),
  openFile: (options) => ipcRenderer.invoke('open-file', options),
  getSubmissions: (projectId) => ipcRenderer.invoke('get-submissions', projectId),
  saveConfig: (config) => ipcRenderer.invoke('save-config', config),
  getConfigurations: () => ipcRenderer.invoke('get-configs'),
  getConfigByName: (name) => ipcRenderer.invoke('get-config-by-name', name),
  updateConfig: (config) => ipcRenderer.invoke('update-config', config),
  addProject: (project) => ipcRenderer.invoke('add-project', project),
  addTestConfig: (projectId, config) => ipcRenderer.invoke('add-test-config', projectId, config),
  extractSubmissions: (projectId, path) => ipcRenderer.invoke('extract-submissions', projectId, path),
  compileSubmissions: (projectId) => ipcRenderer.invoke('compile-submissions', projectId),
  runSubmissions: (projectId) => ipcRenderer.invoke('run-submissions', projectId),
  compareOutputs: (projectId) => ipcRenderer.invoke('compare-outputs', projectId),
});