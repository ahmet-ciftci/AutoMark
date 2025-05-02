const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electron', {
  // Keep functions but they'll return empty values when called
  openDirectory: () => Promise.resolve(''),
  openFile: (options) => Promise.resolve('')
});