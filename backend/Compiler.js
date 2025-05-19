const { exec } = require("child_process");
const path = require("path");
const fs = require("fs");

const {
  getConfigurationByProjectId,
  updateSubmissionStatus,
  updateSubmissionError
} = require("./Database");

function compileSubmission(submission, config, callback) {
  console.log(`Compiling submission for student: ${submission.student_id}`);
  
  return new Promise((resolve) => {
    const sourceFiles = config.source_code
      ? config.source_code
        .split(/\s+/)
        .map(f => path.join(submission.path, f))
        .map(f => `"${f}"`)
        .join(" ")
      : "";

    // Check that all source files exist
    if (config.source_code) {
      const missingFiles = config.source_code
        .split(/\s+/)
        .filter(f => !fs.existsSync(path.join(submission.path, f)));

      if (missingFiles.length > 0) {
        const errorMessage = `Missing source file(s): ${missingFiles.join(", ")}`;
        console.error(`Source not found for ${submission.student_id}: ${errorMessage}`);
        
        // Update submission status
        updateSubmissionStatus(submission.submission_id, "compile_error", errorMessage, (err) => {
          if (err) console.error("DB update failed:", err.message);
          resolve({ success: false, errorMessage });
          if (callback) callback({ success: false, errorMessage });
        });
        
        return;
      }
    }

    if (config.compile_command && config.compile_command.trim() !== "") {
      const compileCmd = `${config.compile_command} ${sourceFiles} ${config.compile_parameters || ""}`;
      exec(compileCmd, { cwd: submission.path }, (error, stdout, stderr) => {
        if (error) {
          const errorMessage = stderr || stdout || error.message;
          console.error(`${submission.student_id} failed:`, errorMessage);
          
          // Update submission status
          updateSubmissionStatus(submission.submission_id, "compile_error", errorMessage, (err) => {
            if (err) console.error("DB update failed:", err.message);
            resolve({ success: false, errorMessage });
            if (callback) callback({ success: false, errorMessage });
          });
          
          return;
        }
        
        console.log(`${submission.student_id} compiled successfully.`);
        
        // Update submission status
        updateSubmissionStatus(submission.submission_id, "compiled", null, (err) => {
          if (err) console.error("DB update failed:", err.message);
          resolve({ success: true });
          if (callback) callback({ success: true });
        });
      });
    } else {
      // No compilation needed
      console.log(`${submission.student_id} marked as compiled (no compilation needed).`);
      
      // Update submission status
      updateSubmissionStatus(submission.submission_id, "compiled", null, (err) => {
        if (err) console.error("DB update failed:", err.message);
        resolve({ success: true });
        if (callback) callback({ success: true });
      });
    }
  });
}

module.exports = {
  compileSubmission
};