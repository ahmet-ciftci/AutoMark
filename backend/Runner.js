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

        if (!config.run_command || config.run_command.trim() === "") {
          console.warn(`No run command specified for student ${submission.student_id}`);
          updateSubmissionStatus(submission.submission_id, "skipped", (err) => {
            if (err) console.error("Error updating skipped submission:", err);
            if (--remaining === 0 && doneCallback) doneCallback();
          });
          return;
        }

        const runParts = config.run_command.trim().split(/\s+/);
        const executable = runParts[0];
        const baseArgs = runParts.slice(1);

        let args = [...baseArgs];
        let options = { cwd: submission.path };

        if (submission.input_method === "manual") {
          const inputArgs = submission.input ? submission.input.trim().split(/\s+/) : [];
          args.push(...inputArgs);
        } else if (submission.input_method === "file") {
          const fullCmd = `${config.run_command} < ${submission.input}`;
          args = [];
          options = { cwd: submission.path, shell: true };
        } else if (submission.input_method === "script") {
          const fullCmd = `${config.run_command} $(${submission.input})`;
          args = [];
          options = { cwd: submission.path, shell: true };
        } else {
          console.warn(`Unsupported input method for student ${submission.student_id}`);
          updateSubmissionStatus(submission.submission_id, "skipped", (err) => {
            if (err) console.error("Error updating skipped submission:", err);
            if (--remaining === 0 && doneCallback) doneCallback();
          });
          return;
        }

        let child;
        if (options.shell) {
          child = spawn(config.run_command + (submission.input_method === "file" ? ` < ${submission.input}` : ` $(${submission.input})`), options);
        } else {
          child = spawn(executable, args, options);
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
            console.error(`${submission.student_id} runtime error:`, errorOutput.trim());
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
