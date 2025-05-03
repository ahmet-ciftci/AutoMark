const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electron', {
  openDirectory: () => ipcRenderer.invoke('open-directory'),
  openFile: (options) => ipcRenderer.invoke('open-file', options),
  getSubmissions: (projectId) => ipcRenderer.invoke('get-submissions', projectId),
  extractAndSaveSubmissions: (submissionsDir, outputDir, projectId) => ipcRenderer.invoke('extract-and-save-submissions', submissionsDir, outputDir, projectId),
  getProjectById: (projectId) => ipcRenderer.invoke('get-project-by-id', projectId),
  compileAllInProject: (projectId) => ipcRenderer.invoke('compile-all-in-project', projectId),
  runAllCompiledSubmissions: (projectId) => ipcRenderer.invoke('run-all-compiled-submissions', projectId),
  compareAllOutputs: (projectId) => ipcRenderer.invoke('compare-all-outputs', projectId),
});