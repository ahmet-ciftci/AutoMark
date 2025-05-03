const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const { getSubmissionsAndTestConfig } = require('./backend/Database.js');
const { extractAndSaveSubmissions } = require('./backend/FileManager.js');
const { getProjectById } = require('./backend/Database.js');
const { compileAllInProject } = require('./backend/Compiler.js');
const {runAllCompiledSubmissions} = require('./backend/Runner.js');
const { compareAllOutputs } = require('./backend/Comparer.js');

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      // Enable the preload script
      preload: path.join(__dirname, 'preload.js'),
      // Security settings
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: true
    },
  });

  mainWindow.loadFile(path.join(__dirname, 'frontend', 'dist', 'index.html'));
  mainWindow.setMenu(null);
  
}


app.whenReady().then(() => {
  createWindow();

  // Handle directory selection dialog
  ipcMain.handle('open-directory', async () => {
    const result = await dialog.showOpenDialog(mainWindow, {
      properties: ['openDirectory']
    });
    return result.canceled ? '' : result.filePaths[0];
  });

  // Handle file selection dialog
  ipcMain.handle('open-file', async (event, options) => {
    const result = await dialog.showOpenDialog(mainWindow, {
      properties: ['openFile'],
      filters: options?.filters || [{ name: 'All Files', extensions: ['*'] }]
    });
    return result.canceled ? '' : result.filePaths[0];
  });

  // --------------------- Backend IPC Handlers ---------------------
  ipcMain.handle('get-submissions', async (event, projectId) => {
    return new Promise((resolve, reject) => {
      getSubmissionsAndTestConfig(projectId, (err, rows) => {
        if (err) reject(err);
        else {
          console.log('Submissions:', rows);
          resolve(rows)
        }
      });
    });
  });

  ipcMain.handle('extract-and-save-submissions', async (event, submissionsDir, outputDir, projectId) => {
    return new Promise((resolve, reject) => {
      extractAndSaveSubmissions(submissionsDir, outputDir, projectId, (err) => {
        if (err) reject(err);
        else resolve();
      });
    });
  });

  ipcMain.handle('get-project-by-id', async (event, projectId) => {
    return new Promise((resolve, reject) => {
      getProjectById(projectId, (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });
  });
  
  ipcMain.handle('compile-all-in-project', async (event, projectId) => {
    return new Promise((resolve, reject) => {
      compileAllInProject(projectId, (err, result) => {
        if (err) reject(err);
        else resolve(result);
      });
    });
  });

  ipcMain.handle('run-all-compiled-submissions', async (event, projectId) => {
    return new Promise((resolve, reject) => {
      runAllCompiledSubmissions(projectId, (err, result) => {
        if (err) reject(err);
        else resolve(result);
      });
    });
  });

  ipcMain.handle('compare-all-outputs', async (event, projectId) => {
    return new Promise((resolve, reject) => {
      compareAllOutputs(projectId, (err, result) => {
        if (err) reject(err);
        else resolve(result);
      });
    });
  });


  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
