const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const db = require('./backend/Database');
const { getSubmissionsAndTestConfig } = require('./backend/Database.js');
const { extractAndSaveSubmissions } = require('./backend/FileManager.js');
const { getProjectById } = require('./backend/Database.js');
const { compileAllInProject } = require('./backend/Compiler.js');
const {runAllCompiledSubmissions} = require('./backend/Runner.js');
const { compareAllOutputs } = require('./backend/Comparer.js');
const { readDirectoryRecursive } = require('./backend/DirectoryReader'); 
const fs = require('fs');
const { getSubmissionPathsByProject } = require('./backend/Database.js');

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
  ipcMain.handle('extract-and-save-submissions', async (event, submissionsDir, outputDir, projectId) => {
    return new Promise((resolve, reject) => {
      extractAndSaveSubmissions(submissionsDir, outputDir, projectId, (err) => {
        if (err) reject(err);
        else resolve();
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
  

  ipcMain.handle('get-project-by-id', async (event, projectId) => {
    return new Promise((resolve, reject) => {
      getProjectById(projectId, (err, row) => {
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

  ipcMain.handle('add-project', async (event, project) => {
    return new Promise((resolve, reject) => {
      db.addProject(project.name, project.config_id, project.submissions_path, (err, id) => {
        if (err) reject(err);
        else resolve(id);
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

  ipcMain.handle('add-test-config', async (event, projectId, config) => {
    return new Promise((resolve, reject) => {
      db.addTestConfig(
        projectId,
        config.input_method,
        config.input,
        config.output_method,
        config.expected_output,
        (err, id) => {
          if (err) reject(err);
          else resolve(id);
        }
      );
    });
  });

  //outputpathi sabit gir şimdilik
  ipcMain.handle('extract-submissions', async (event, projectId, submissionsPath) => {
    try {
      const outputPath = path.join(submissionsPath, '..', 'output');
      await extractAndSaveSubmissions(submissionsPath, outputPath, projectId);
      return 'Extraction complete.';
    } catch (err) {
      throw err;
    }
  });
  
  // Handle compilation of submissions
  ipcMain.handle('compile-submissions', async (event, projectId) => {
    return new Promise((resolve, reject) => {
      compileAllInProject(projectId, (err) => {
        if (err) reject(err);
        else resolve();
      });
    });
  });
  // Handle execution of submissions
  ipcMain.handle('run-submissions', async (event, projectId) => {
    return new Promise((resolve, reject) => {
      runAllCompiledSubmissions(projectId, (err) => {
        if (err) reject(err);
        else resolve();
      });
    });
  });
  // Handle output comparison
  ipcMain.handle('compare-outputs', async (event, projectId) => {
    return new Promise((resolve, reject) => {
      compareAllOutputs(projectId, (err) => {
        if (err) reject(err);
        else resolve();
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

  ipcMain.handle('get-test-config-by-project-id', async (event, projectId) => {
    return new Promise((resolve, reject) => {
      db.getTestConfigByProjectId(projectId, (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });
  });

  // Delete a configuration by id
  ipcMain.handle('delete-config', async (event, config) => {
    return new Promise((resolve, reject) => {
      db.deleteConfiguration(config, (err, changes) => {
        if (err) reject(err)
        else resolve(changes)
      })
    })
  });

  //FOR OPEN PROJECT MODAL
  ipcMain.handle('get-all-projects', async () => {
    return new Promise((resolve, reject) => {
      db.getAllProjects((err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
  });
  
ipcMain.handle('get-project-files', async (event, projectId) => {
  return new Promise((resolve, reject) => {
    db.getConfigurationByProjectId(projectId, (err, config) => {
      if (err || !config) return reject(err || new Error("Config not found"));

      const extension = path.extname(config.source_code).toLowerCase(); 

      db.getSubmissionPathsByProject(projectId, (err2, rows) => {
        if (err2 || !rows || rows.length === 0) return reject(err2 || new Error("No submissions found"));

        try {
          const result = rows.map(row => {
            const folderPath = row.path;
            const structure = readDirectoryRecursive(folderPath, [extension]);
            return {
              name: path.basename(folderPath),
              type: 'folder',
              path: folderPath,
              children: structure
            };
          });
          resolve(result);
        } catch (e) {
          reject(e);
        }
      });
    });
  });
});

  ipcMain.handle('get-configuration-by-id', async (event, id) => {
    return new Promise((resolve, reject) => {
      db.getConfigurationById(id, (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });
  });


  ipcMain.handle('read-file', async (event, filePath) => {
    try {
      const stats = fs.statSync(filePath);
      if (stats.isDirectory()) {
        throw new Error('Cannot read directory');
      }
  
      const content = fs.readFileSync(filePath, 'utf-8');
      return content;
    } catch (err) {
      console.error("Error in read-file:", err);
      throw err;
    }
  });
  
  ipcMain.handle('save-file', async (event, filePath, content) => {
  try {
    fs.writeFileSync(filePath, content, 'utf-8');
    return true;
  } catch (err) {
    console.error('Failed to save file:', err);
    throw err;
  }
});

  ipcMain.handle('show-save-dialog', async () => {
    const result = await dialog.showSaveDialog({
      title: 'Save CSV Report',
      defaultPath: 'submissions_report.csv',
      filters: [{ name: 'CSV Files', extensions: ['csv'] }]
    });

    return result.canceled ? null : result.filePath;
  });

  // Add this handler specifically for JSON configuration export
  ipcMain.handle('show-json-save-dialog', async (event, options = {}) => {
    const defaultOptions = {
      title: 'Export Configuration',
      defaultPath: options.defaultPath || 'config.json',
      filters: [{ name: 'JSON Files', extensions: ['json'] }]
    };
    
    const result = await dialog.showSaveDialog(defaultOptions);
    return result.canceled ? null : result.filePath;
  });

  
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
