const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const db = require('./backend/Database');
const { getSubmissionsAndTestConfig } = require('./backend/Database.js');
const { extractAndSaveSubmissions } = require('./backend/FileManager.js');
const { getProjectById } = require('./backend/Database.js');
const { compileSubmission } = require('./backend/Compiler.js');
const { runSubmission } = require('./backend/Runner.js');
const { compareOutput } = require('./backend/Comparer.js');
const { readDirectoryRecursive } = require('./backend/DirectoryReader'); 
const fs = require('fs');
const { getSubmissionPathsByProject } = require('./backend/Database.js');
const { processProject, processSubmission } = require('./backend/Processor.js');

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

  ipcMain.handle('add-test-config', async (event, projectId, config) => {
    return new Promise((resolve, reject) => {
      db.addTestConfig(
        projectId,
        config.input_method,
        config.input,
        config.output_method,
        config.expected_output,
        (err, id) => {
          if (err) {
            reject(err);
          } else {
            resolve(id); // Resolve with the new test config ID
          }
        }
      );
    });
  });

  // Extract submissions from a directory
  ipcMain.handle('extract-submissions', async (event, projectId, submissionsPath) => {
    try {
      const outputPath = path.join(submissionsPath, '..', 'output');
      await extractAndSaveSubmissions(submissionsPath, outputPath, projectId);
      return 'Extraction complete.';
    } catch (err) {
      throw err;
    }
  });
  
  // Process individual submissions - one by one approach
  ipcMain.handle('compile-submission', async (event, submissionId, configId) => {
    return new Promise((resolve, reject) => {
      // First get the submission details
      db.getSubmissionById(submissionId, (err, submission) => {
        if (err) return reject(err);
        
        // Get the configuration if configId provided, otherwise use project's default
        const getConfig = configId 
          ? (callback) => db.getConfigurationById(configId, callback)
          : (callback) => db.getConfigurationByProjectId(submission.project_id, callback);
          
        getConfig((err, config) => {
          if (err) return reject(err);
          if (!config) return reject(new Error('Configuration not found'));
          
          // Compile the submission with the config
          compileSubmission(submission, config)
            .then(result => resolve(result))
            .catch(err => reject(err));
        });
      });
    });
  });
  
  ipcMain.handle('run-submission', async (event, submissionId, configId) => {
    return new Promise((resolve, reject) => {
      // First get the submission details
      db.getSubmissionById(submissionId, (err, submission) => {
        if (err) return reject(err);
        
        // Get the configuration if configId provided, otherwise use project's default
        const getConfig = configId 
          ? (callback) => db.getConfigurationById(configId, callback)
          : (callback) => db.getConfigurationByProjectId(submission.project_id, callback);
          
        getConfig((err, config) => {
          if (err) return reject(err);
          if (!config) return reject(new Error('Configuration not found'));
          
          // Run the submission with the config
          runSubmission(submission, config)
            .then(result => resolve(result))
            .catch(err => reject(err));
        });
      });
    });
  });
  
  ipcMain.handle('compare-output', async (event, submissionId) => {
    return new Promise((resolve, reject) => {
      // Get the submission with its test config
      db.getSubmissionById(submissionId, (err, submission) => {
        if (err) return reject(err);
        
        // Get test config for the project
        db.getTestConfigByProjectId(submission.project_id, (err, testConfig) => {
          if (err) return reject(err);
          if (!testConfig) return reject(new Error('Test configuration not found'));
          
          // Merge test config with submission for comparison
          const submissionWithConfig = { ...submission, ...testConfig };
          
          // Compare the output
          compareOutput(submissionWithConfig)
            .then(result => resolve(result))
            .catch(err => reject(err));
        });
      });
    });
  });

  ipcMain.handle('get-submission-by-id', async (event, id) => {
    return new Promise((resolve, reject) => {
      db.getSubmissionById(id, (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });
  });

  ipcMain.handle('update-submission', async (event, submission) => {
    return new Promise((resolve, reject) => {
      db.updateSubmission(
        submission.id,
        submission.student_id,
        submission.status,
        submission.path,
        submission.actual_output,
        (err, changes) => {
          if (err) reject(err);
          else resolve(changes);
        }
      );
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
      if (!projectId) {
        return reject(new Error("No project ID provided"));
      }
      
      db.getProjectById(projectId, (err, project) => {
        if (err || !project) {
          return reject(err || new Error("Project not found"));
        }
        
        db.getConfigurationByProjectId(projectId, (err, config) => {
          if (err) return reject(err || new Error("Config not found"));
          
          // Default to all common source file extensions if no config or source code is specified
          let extensions = ['.c', '.cpp', '.java', '.py', '.js', '.html', '.css'];
          
          if (config && config.source_code) {
            // Get file extension(s) from source_code field
            const sourceFiles = config.source_code.split(/\s+/);
            extensions = sourceFiles
              .map(file => path.extname(file).toLowerCase())
              .filter(ext => ext); // Remove empty extensions
              
            // If no extensions found, use defaults
            if (extensions.length === 0) {
              extensions = ['.c', '.cpp', '.java', '.py', '.js', '.html', '.css'];
            }
          }

          db.getSubmissionPathsByProject(projectId, (err2, rows) => {
            if (err2) return reject(err2);
            
            if (!rows || rows.length === 0) {
              return reject(new Error("No submissions found for this project"));
            }

            try {
              const result = rows
                .filter(row => row.path && fs.existsSync(row.path)) // Filter out invalid paths
                .map(row => {
                  const folderPath = row.path;
                  const structure = readDirectoryRecursive(folderPath, extensions);
                  return {
                    name: path.basename(folderPath),
                    type: 'folder',
                    path: folderPath,
                    children: structure
                  };
                });
                
              if (result.length === 0) {
                return reject(new Error("No valid submission folders found"));
              }
              
              resolve(result);
            } catch (e) {
              console.error("Error building file structure:", e);
              reject(e);
            }
          });
        });
      });
    });
  });

  ipcMain.handle('update-project', async (event, projectId, name, configId, submissionsPath) => {
    return new Promise((resolve, reject) => {
      // First, delete existing submissions for the project
      db.deleteSubmissionsByProjectId(projectId, (deleteErr, deleteChanges) => {
        if (deleteErr) {
          console.error('Failed to delete submissions before project update:', deleteErr);
          return reject(deleteErr); // Stop the process if deletion fails
        }
        console.log(`Successfully deleted ${deleteChanges} submissions for project ${projectId} before update.`);

        // Then, update the project details
        db.updateProject(projectId, name, configId, submissionsPath, (updateErr, updateChanges) => {
          if (updateErr) {
            console.error('Error updating project in main.js:', updateErr);
            return reject(updateErr);
          }
          // After project update, re-extract and process submissions
          // Assuming submissionsPath is up-to-date or re-confirmed by the user
          if (submissionsPath) {
            extractAndSaveSubmissions(submissionsPath, path.join(submissionsPath, '..', 'output'), projectId)
              .then(() => {
                console.log('Submissions re-extracted after project update.');
                // Optionally, trigger re-processing of all submissions here if needed
                // For example, by calling processProject or similar logic
                resolve(updateChanges);
              })
              .catch(extractErr => {
                console.error('Failed to re-extract submissions after project update:', extractErr);
                // Decide if this error should cause a rejection
                // For now, resolve the project update but log the extraction error
                resolve(updateChanges); 
              });
          } else {
            resolve(updateChanges); // Resolve if no submissions path to re-extract from
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

  ipcMain.handle('delete-test-config', async (event, testConfigId) => {
    return new Promise((resolve, reject) => {
      db.deleteTestConfig(testConfigId, (err, changes) => {
        if (err) {
          console.error('Error deleting test config in main.js:', err);
          reject(err);
        } else {
          resolve(changes);
        }
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

  ipcMain.handle('process-project', async (event, projectId, submissionsPath, concurrency) => {
    try {
      console.log(`Processing project ${projectId} with submissions at ${submissionsPath}`);
      const results = await processProject(projectId, submissionsPath, concurrency || 4);
      return results;
    } catch (err) {
      console.error('Process project error:', err);
      throw err;
    }
  });

  ipcMain.handle('process-submission', async (event, submissionId, configId) => {
    try {
      console.log(`Processing submission ${submissionId}`);
      const result = await processSubmission(submissionId, configId);
      return result;
    } catch (err) {
      console.error('Process submission error:', err);
      throw err;
    }
  });

  ipcMain.handle('delete-project', async (event, projectId) => {
    return new Promise((resolve, reject) => {
      db.deleteProject(projectId, (err, changes) => {
        if (err) {
          console.error('Error deleting project in main.js:', err);
          reject(err);
        } else {
          resolve(changes);
        }
      });
    });
  });

  // View menu handlers
  ipcMain.handle('view-set-zoom-level', (event, level) => {
    mainWindow.webContents.setZoomLevel(level);
  });

  ipcMain.handle('view-get-zoom-level', () => {
    return mainWindow.webContents.getZoomLevel();
  });

  ipcMain.handle('view-zoom-in', () => {
    const currentZoom = mainWindow.webContents.getZoomLevel();
    mainWindow.webContents.setZoomLevel(currentZoom + 0.5);
  });

  ipcMain.handle('view-zoom-out', () => {
    const currentZoom = mainWindow.webContents.getZoomLevel();
    mainWindow.webContents.setZoomLevel(currentZoom - 0.5);
  });

  ipcMain.handle('view-reset-zoom', () => {
    mainWindow.webContents.setZoomLevel(0); // Reset to default zoom level
  });

});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});