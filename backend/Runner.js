const { spawn } = require("child_process");
const path = require("path");

const {
  getSubmissionsAndTestConfig,
  getConfigurationByProjectId,
  updateSubmissionStatus,
  updateActualOutput
} = require("./Database");

function runAllCompiledSubmissions(projectId, doneCallback) {
  getSubmissionsAndTestConfig(projectId, (err, submissions) => {
    if (err) {
      console.error("Error fetching submissions and test config:", err);
      if (doneCallback) doneCallback();
      return;
    }

    if (!submissions || submissions.length === 0) {
      console.log("No submissions found.");
      if (doneCallback) doneCallback();
      return;
    }

    const compiledSubmissions = submissions.filter(sub => sub.status === "compiled");
    let remaining = compiledSubmissions.length;

    if (remaining === 0) {
      if (doneCallback) doneCallback();
      return;
    }

    compiledSubmissions.forEach((submission) => {
      console.log(`Running compiled submission for: ${submission.student_id}`);

      getConfigurationByProjectId(projectId, (err, config) => {
        if (err || !config) {
          console.error(`No configuration found for project ${projectId}`);
          if (--remaining === 0 && doneCallback) doneCallback();
          return;
        }

        const executablePath = path.join(submission.path, config.run_command);
        let args = [];
        let child;

        if (submission.input_method === "manual") {
          args = submission.input ? submission.input.trim().split(/\s+/) : [];
          child = spawn(executablePath, args);
        } else if (submission.input_method === "file") {
          child = spawn(`${executablePath} < ${submission.input}`, { shell: true });
        } else if (submission.input_method === "script") {
          child = spawn(`${executablePath} $(${submission.input})`, { shell: true });
        } else {
          console.warn(`Unsupported input method for student ${submission.student_id}`);
          updateSubmissionStatus(submission.submission_id, "skipped", (err) => {
            if (err) console.error("Error updating skipped submission:", err);
            if (--remaining === 0 && doneCallback) doneCallback();
          });
          return;
        }

        let output = "";
        let errorOutput = "";

        child.stdout.on("data", (data) => {
          output += data.toString();
        });

        child.stderr.on("data", (data) => {
          errorOutput += data.toString();
        });

        child.on("close", (code) => {
          if (code === 0) {
            console.log(`${submission.student_id} executed successfully.`);

            updateActualOutput(submission.submission_id, output.trim(), (err) => {
              if (err) {
                console.error("Error updating actual output:", err);
              }

              updateSubmissionStatus(submission.submission_id, "executed", (err2) => {
                if (err2) {
                  console.error("Error updating execution status:", err2);
                }
                if (--remaining === 0 && doneCallback) doneCallback();
              });
            });

          } else {
            console.error(`${submission.student_id} runtime error.`);
            updateSubmissionStatus(submission.submission_id, "runtime_error", (err) => {
              if (err) {
                console.error("Error updating runtime error status:", err);
              }
              if (--remaining === 0 && doneCallback) doneCallback();
            });
          }
        });
      });
    });
  });
}

module.exports = { runAllCompiledSubmissions };
