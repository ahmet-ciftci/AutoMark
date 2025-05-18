const { exec } = require("child_process");
const path = require("path");
const fs = require("fs");

const {
  getSubmissionsAndTestConfig,
  getConfigurationByProjectId,
  updateSubmissionStatus,
  updateSubmissionError
} = require("./Database");

function compileSubmission(submission, config) {
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
        return resolve({ success: false, errorMessage });
      }
    }

    if (config.compile_command && config.compile_command.trim() !== "") {
      const compileCmd = `${config.compile_command} ${sourceFiles} ${config.compile_parameters || ""}`;
      exec(compileCmd, { cwd: submission.path }, (error, stdout, stderr) => {
        if (error) {
          return resolve({ success: false, errorMessage: stderr || stdout || error.message });
        }
        resolve({ success: true });
      });
    } else {
      // No compilation needed
      resolve({ success: true });
    }
  });
}

function compileAllInProject(projectId, doneCallback) {
  console.log("Compiling all submissions for project:", projectId);

  getSubmissionsAndTestConfig(projectId, async (err, submissions) => {
    if (err) {
      console.error("Error fetching submissions:", err);
      return doneCallback?.();
    }

    if (!submissions || submissions.length === 0) {
      console.log("No submissions to compile.");
      return doneCallback?.();
    }

    for (const submission of submissions) {
      await new Promise((resolveStep) => {
        getConfigurationByProjectId(projectId, async (err, config) => {
          if (err || !config) {
            console.error(`No config for ${submission.student_id}`);
            return resolveStep();
          }

          const result = await compileSubmission(submission, config);

          if (result.success) {
            console.log(`${submission.student_id} compiled.`);
            updateSubmissionStatus(submission.submission_id, "compiled", (err) => {
              if (err) console.error("DB update failed:", err.message);
              resolveStep();
            });
          } else {
            console.error(`${submission.student_id} failed:`, result.errorMessage);

            const { updateSubmissionError } = require("./Database");
            updateSubmissionError(submission.submission_id, result.errorMessage, (err) => {
              if (err) console.error("Failed to save compile error to DB:", err.message);
            });

            updateSubmissionStatus(submission.submission_id, "compile_error", (err) => {
              if (err) console.error("DB update failed:", err.message);
              resolveStep();
            });
          }
        });
      });
    }

    console.log("Compilation done for all.");
    doneCallback?.();
  });
}

module.exports = {
  compileSubmission,
  compileAllInProject
};
