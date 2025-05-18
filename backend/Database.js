const sqlite3 = require("sqlite3").verbose();
const path = require("path");
const fs = require("fs");
const os = require("os");

const documentsPath = path.join(os.homedir(), "Documents");
const dbPath = path.join(documentsPath, "automark.db");
const db = new sqlite3.Database(dbPath);


function initializeDatabase() {
  if (!fs.existsSync(documentsPath)) {
    fs.mkdirSync(documentsPath);
  }

  db.serialize(() => {
    // Create Projects table
    db.run(`CREATE TABLE IF NOT EXISTS Projects (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        config_id INTEGER,
        submissions_path TEXT NOT NULL,
        FOREIGN KEY (config_id) REFERENCES Configurations(id)
      );`);

    // Create Configurations table
    db.run(`CREATE TABLE IF NOT EXISTS Configurations (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        compile_command TEXT,
        source_code TEXT,
        compile_parameters TEXT,
        run_command TEXT
      );`);

    // Create TestConfig table
    db.run(`CREATE TABLE IF NOT EXISTS TestConfig (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        project_id INTEGER,
        input_method TEXT,
        input TEXT,
        output_method TEXT,
        expected_output TEXT,
        FOREIGN KEY (project_id) REFERENCES Projects(id)
      );`);

    // Create Submissions table
    db.run(`CREATE TABLE IF NOT EXISTS Submissions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        project_id INTEGER,
        student_id TEXT,
        status TEXT,
        path TEXT,
        error_message TEXT,
        actual_output TEXT,
        FOREIGN KEY (project_id) REFERENCES Projects(id)
      );`);

    console.log("All tables ensured (created if not exist).");
  });


}


// Projects Table Methods
function addProject(name, configId, submissionsPath, callback) {
  const query = `INSERT INTO Projects (name, config_id, submissions_path) VALUES (?, ?, ?)`;
  db.run(query, [name, configId, submissionsPath], function (err) {
    callback(err, this.lastID);
  });
}

function getProjects(callback) {
  const query = `SELECT * FROM Projects`;
  db.all(query, [], (err, rows) => {
    callback(err, rows);
  });
}

function updateProject(id, name, configId, submissionsPath, callback) {
  const query = `UPDATE Projects SET name = ?, config_id = ?, submissions_path = ? WHERE id = ?`;
  db.run(query, [name, configId, submissionsPath, id], function (err) {
    // Ensure this.changes is correctly passed or handled if err occurs
    if (err) {
      return callback(err);
    }
    callback(null, this.changes);
  });
}

function deleteProject(id, callback) {
  const query = `DELETE FROM Projects WHERE id = ?`;
  db.run(query, [id], function (err) {
    callback(err, this.changes);
  });
}

// Configurations Table Methods
function addConfiguration(name, compileCommand, sourceCode, compileParameters, runCommand, callback) {
  const query = `INSERT INTO Configurations (name, compile_command, source_code, compile_parameters, run_command) VALUES (?, ?, ?, ?, ?)`;
  db.run(query, [name, compileCommand, sourceCode, compileParameters, runCommand], function (err) {
    callback(err, this.lastID);
  });
}

function getConfigurations(callback) {
  const query = `
    SELECT 
      id AS config_id,
      name AS config_name,
      compile_command,
      source_code,
      compile_parameters,
      run_command
    FROM Configurations`;
  
  db.all(query, [], (err, rows) => {
    callback(err, rows);
  });
}


function updateConfiguration(id, name, compileCommand, sourceCode, compileParameters, runCommand, callback) {
  const query = `UPDATE Configurations SET name = ?, compile_command = ?, source_code = ?, compile_parameters = ?, run_command = ? WHERE id = ?`;
  db.run(query, [name, compileCommand, sourceCode, compileParameters, runCommand, id], function (err) {
    callback(err, this.changes);
  });
}

function deleteConfiguration(id, callback) {
  const query = `DELETE FROM Configurations WHERE id = ?`;
  db.run(query, [id], function (err) {
    callback(err, this.changes);
  });
}

// TestConfig Table Methods
function addTestConfig(projectId, inputMethod, input, outputMethod, expectedOutput, callback) {
  if (outputMethod === "file" && expectedOutput) {
    try {
      // Read the file content if the output method is "file"
      expectedOutput = fs.readFileSync(expectedOutput, "utf-8").trim();
    } catch (err) {
      console.error(`Error reading expected output file:`, err);
      return callback(err);
    }
  } else if (outputMethod === "script" && expectedOutput) {
    try {
      // Execute the script and capture its output
      const scriptOutput = require("child_process").execSync(expectedOutput, { shell: true }).toString().trim();
      expectedOutput = scriptOutput;
    } catch (err) {
      console.error(`Error executing expected output script:`, err);
      return callback(err);
    }
  }

  const query = `INSERT INTO TestConfig (project_id, input_method, input, output_method, expected_output) VALUES (?, ?, ?, ?, ?)`;
  db.run(query, [projectId, inputMethod, input, outputMethod, expectedOutput], function (err) {
    callback(err, this.lastID);
  });
}

function getTestConfigs(callback) {
  const query = `SELECT * FROM TestConfig`;
  db.all(query, [], (err, rows) => {
    callback(err, rows);
  });
}

function updateTestConfig(id, projectId, inputMethod, input, outputMethod, expectedOutput, callback) {
  const query = `UPDATE TestConfig SET project_id = ?, input_method = ?, input = ?, output_method = ?, expected_output = ? WHERE id = ?`;
  db.run(query, [projectId, inputMethod, input, outputMethod, expectedOutput, id], function (err) {
    // Ensure this.changes is correctly passed or handled if err occurs
    if (err) {
      return callback(err);
    }
    callback(null, this.changes);
  });
}

function deleteTestConfig(id, callback) {
  const query = `DELETE FROM TestConfig WHERE id = ?`;
  db.run(query, [id], function (err) {
    // Ensure this.changes is correctly passed or handled if err occurs
    if (err) {
      return callback(err);
    }
    callback(null, this.changes);
  });
}

// Submissions Table Methods
function addSubmission(projectId, studentId, status, path, errorMessage, actualOutput, callback) {
  const query = `INSERT INTO Submissions (project_id, student_id, status, path, error_message, actual_output) VALUES (?, ?, ?, ?, ?, ?)`;
  db.run(query, [projectId, studentId, status, path, errorMessage, actualOutput], function (err) {
    callback(err, this.lastID);
  });
}

async function getSubmissions(callback) {
  const query = `SELECT * FROM Submissions`;
  db.all(query, [], (err, rows) => {
    callback(err, rows);
  });
}

function updateSubmission(id, projectId, studentId, status, path, errorMessage, actualOutput, callback) {
  const query = `UPDATE Submissions SET project_id = ?, student_id = ?, status = ?, path = ?, error_message = ?, actual_output = ? WHERE id = ?`;
  db.run(query, [projectId, studentId, status, path, errorMessage, actualOutput, id], function (err) {
    callback(err, this.changes);
  });
}

function deleteSubmission(id, callback) {
  const query = `DELETE FROM Submissions WHERE id = ?`;
  db.run(query, [id], function (err) {
    callback(err, this.changes);
  });
}

// Other Methods
function updateSubmissionStatus(id, status, callback) {
  const query = `UPDATE Submissions SET status = ? WHERE id = ?`;
  db.run(query, [status, id], function (err) {
    callback(err, this.changes);
  });
}

function getConfigurationByProjectId(projectId, callback) {
  const query = `SELECT * FROM Configurations WHERE id = (SELECT config_id FROM Projects WHERE id = ?)`;
  db.get(query, [projectId], (err, row) => {
    callback(err, row);
  });
}

function getSubmissionsAndTestConfig(projectId, callback) {
  const query = `
    SELECT 
      s.id AS submission_id,
      s.project_id,
      s.student_id,
      s.status,
      s.path,
      s.error_message,
      s.actual_output,
      tc.input_method,
      tc.input,
      tc.output_method,
      tc.expected_output
    FROM Submissions s
    JOIN TestConfig tc ON s.project_id = tc.project_id
    WHERE s.project_id = ?`;

  db.all(query, [projectId], callback);
}


function updateActualOutput(id, actualOutput, callback) {
  const query = `UPDATE Submissions SET actual_output = ? WHERE id = ?`;
  db.run(query, [actualOutput, id], function (err) {
    callback(err, this.changes);
  });
}

function getConfigurationByName(name, callback) {
  const query = `SELECT * FROM Configurations WHERE name = ?`;
  db.get(query, [name], (err, row) => {
    callback(err, row);
  });
}


// Close the database connection
function closeDatabase() {
  db.close((err) => {
    if (err) {
      console.error("Error closing the database:", err.message);
    } else {
      console.log("Database closed.");
    }
  });
}

function submissionExists(projectId, studentId, callback) {
  const query = `SELECT COUNT(*) as count FROM Submissions WHERE project_id = ? AND student_id = ?`;
  db.get(query, [projectId, studentId], (err, row) => {
    if (err) callback(err, null);
    else callback(null, row.count > 0);
  });
}

async function getProjectById(projectId, callback) {
  const query = `SELECT * FROM Projects WHERE id = ?`;
  db.get(query, [projectId], (err, row) => {
    callback(err, row);
  });
}
function getTestConfigByProjectId(projectId, callback) {
  const query = `SELECT * FROM TestConfig WHERE project_id = ?`;
  db.get(query, [projectId], (err, row) => {
    callback(err, row);
  });
}

function getAllProjects(callback) {
  const query = `SELECT id, name FROM Projects ORDER BY id DESC`;
  db.all(query, [], (err, rows) => {
    callback(err, rows);
  });
}



module.exports = {
  initializeDatabase,
  addProject,
  getProjects,
  updateProject,
  deleteProject,
  addConfiguration,
  getConfigurations,
  updateConfiguration,
  deleteConfiguration,
  addTestConfig,
  getTestConfigs,
  updateTestConfig,
  deleteTestConfig,
  addSubmission,
  getSubmissions,
  updateSubmission,
  deleteSubmission,
  updateSubmissionStatus,
  getConfigurationByProjectId,
  getSubmissionsAndTestConfig,
  updateActualOutput,
  closeDatabase,
  submissionExists,
  getConfigurationByName,
  getProjectById,
  getTestConfigByProjectId,
  getAllProjects,
};