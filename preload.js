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
  compileSubmission: (submissionId, configId) => ipcRenderer.invoke('compile-submission', submissionId, configId),
  runSubmission: (submissionId, configId) => ipcRenderer.invoke('run-submission', submissionId, configId),
  compareOutput: (submissionId) => ipcRenderer.invoke('compare-output', submissionId),
  getProjectById: (projectId) => ipcRenderer.invoke('get-project-by-id', projectId),
  getTestConfigByProjectId: (projectId) => ipcRenderer.invoke('get-test-config-by-project-id', projectId),
  getAllProjects: () => ipcRenderer.invoke('get-all-projects'),
  deleteConfig: (config) => ipcRenderer.invoke('delete-config', config),
  getProjectFiles: (projectId) => ipcRenderer.invoke('get-project-files', projectId),
  readFile: (filePath) => ipcRenderer.invoke('read-file', filePath),
  saveFile: (path, content) => ipcRenderer.invoke('save-file', path, content),
  showSaveDialog: () => ipcRenderer.invoke('show-save-dialog'),
  getConfigurationById: (id) => ipcRenderer.invoke('get-configuration-by-id', id),
  showJsonSaveDialog: (options) => ipcRenderer.invoke('show-json-save-dialog', options),
  getSubmissionById: (id) => ipcRenderer.invoke('get-submission-by-id', id),
  updateSubmission: (submission) => ipcRenderer.invoke('update-submission', submission),
  processProject: (projectId, submissionsPath, concurrency) => 
    ipcRenderer.invoke('process-project', projectId, submissionsPath, concurrency),
  processSubmission: (submissionId, configId) => 
    ipcRenderer.invoke('process-submission', submissionId, configId),
  updateProject: (projectId, name, configId, submissionsPath) => ipcRenderer.invoke('update-project', projectId, name, configId, submissionsPath),
  deleteTestConfig: (testConfigId) => ipcRenderer.invoke('delete-test-config', testConfigId),
  deleteProject: (projectId) => ipcRenderer.invoke('delete-project', projectId),
  // View menu actions
  setZoomLevel: (level) => ipcRenderer.invoke('view-set-zoom-level', level),
  getZoomLevel: () => ipcRenderer.invoke('view-get-zoom-level'),
  zoomIn: () => ipcRenderer.invoke('view-zoom-in'),
  zoomOut: () => ipcRenderer.invoke('view-zoom-out'),
  resetZoom: () => ipcRenderer.invoke('view-reset-zoom'),
  splashFinished: () => ipcRenderer.send('splash-finished'),
});