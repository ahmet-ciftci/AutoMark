const sqlite3 = require("sqlite3").verbose();
import { join } from "path";
import fs from "fs";

function initializeDatabase() {
  const documentsPath = join(require("os").homedir(), "Documents");
  const dbPath = join(documentsPath, "automark.db");

  if (!fs.existsSync(documentsPath)) {
    fs.mkdirSync(documentsPath);
  }

  if (fs.existsSync(dbPath)) {
    console.log("Database already exists at:", dbPath);
    return;
  }
  const db = new sqlite3.Database(dbPath);

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

    console.log("Database initialized at:", dbPath);
  });

  db.close();
}

module.exports = { initializeDatabase };
