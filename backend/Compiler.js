const { exec } = require("child_process");
const path = require("path");
const fs = require("fs");

const {
  getSubmissionsAndTestConfig,
  getConfigurationByProjectId,
  updateSubmissionStatus
} = require("./Database");

function compileSubmission(submission, config) {
  return new Promise((resolve) => {
    const sourcePath = path.join(submission.path, config.source_code);
    const outputPath = path.join(submission.path, "main");

    if (!fs.existsSync(sourcePath)) {
      console.error(`Source not found for ${submission.student_id}`);
      return resolve({ success: false, errorMessage: `Source file not found: ${sourcePath}` });
    }

    const compileCmd = `${config.compile_command} ${sourcePath} ${config.compile_parameters} -o ${outputPath}`;
    exec(compileCmd, (error, stdout, stderr) => {
      if (error) {
        return resolve({ success: false, errorMessage: stderr || stdout || error.message });
      }
      resolve({ success: true });
    });
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
            console.error(`⚠️ No config for ${submission.student_id}`);
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
