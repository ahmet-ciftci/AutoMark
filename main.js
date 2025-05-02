const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const db = require('./backend/Database');
const { getSubmissionsAndTestConfig } = require('./backend/Database.js');
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

  db.initializeDatabase();
  
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

  ipcMain.handle('save-config', async (event, config) => {
    return new Promise((resolve, reject) => {
      db.addConfiguration(
        config.config_name,
        config.compile_command,
        config.source_code,
        config.compile_parameters,
        config.run_command,
        (err, id) => {
          if (err) reject(err);
          else resolve(id);
        }
      );
    });
  });

  ipcMain.handle('get-configs', async () => {
    return new Promise((resolve, reject) => {
      db.getConfigurations((err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
  });

  ipcMain.handle('get-config-by-name', async (event, name) => {
    return new Promise((resolve, reject) => {
      db.getConfigurationByName(name, (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });
  });
  
  ipcMain.handle('update-config', async (event, config) => {
    return new Promise((resolve, reject) => {
      db.updateConfiguration(
        config.id,
        config.config_name,
        config.compile_command,
        config.source_code,
        config.compile_parameters,
        config.run_command,
        (err, changes) => {
          if (err) reject(err);
          else resolve(changes);
        }
      );
    });
  });
  


  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
