const { spawn, execSync } = require("child_process");
const fs = require("fs");
const path = require("path");

const {
  getSubmissionsAndTestConfig,
  getConfigurationByProjectId,
  updateSubmissionStatus,
  updateActualOutput,
  updateSubmissionError,
} = require("./Database");

function runAllCompiledSubmissions(projectId, doneCallback) {
  getSubmissionsAndTestConfig(projectId, (err, submissions) => {
    if (err) {
      console.error("Error fetching submissions and test config:", err);
      return doneCallback?.();
    }

    const compiledSubmissions = (submissions || []).filter(sub => sub.status === "compiled");

    if (compiledSubmissions.length === 0) {
      console.log("No compiled submissions found.");
      return doneCallback?.();
    }

    let remaining = compiledSubmissions.length;

    compiledSubmissions.forEach((submission) => {
      console.log(`Running compiled submission for: ${submission.student_id}`);

      getConfigurationByProjectId(projectId, (err, config) => {
        if (err || !config || !config.run_command?.trim()) {
          console.warn(`No valid config for ${submission.student_id}`);
          updateSubmissionStatus(submission.submission_id, "skipped", () => {
            if (--remaining === 0) doneCallback?.();
          });
          return;
        }

        const runParts = config.run_command.trim().split(/\s+/);
        const executable = runParts[0];
        const baseArgs = runParts.slice(1);
        const options = { cwd: submission.path };
        const args = [...baseArgs];

        let inputData = "";

        try {
          if (submission.input_method === "manual") {
            inputData = submission.input?.trim() || "";
            args.push(...inputData.split(/\s+/));
          } else if (submission.input_method === "file") {
            const inputPath = submission.input?.trim() || "";
            inputData = fs.readFileSync(inputPath, "utf-8").trim();
            args.push(...inputData.split(/\s+/));
          } else if (submission.input_method === "script") {
            // Execute the script and capture its output
            inputData = execSync(submission.input, { cwd: submission.path, shell: true }).toString().trim();
            // Add the script output as arguments, similar to other methods
            args.push(...inputData.split(/\s+/));
          } else {
            console.warn(`Unsupported input method for student ${submission.student_id}`);
            updateSubmissionStatus(submission.submission_id, "skipped", () => {
              if (--remaining === 0) doneCallback?.();
            });
            return;
          }
        } catch (inputErr) {
          console.error(`Error preparing input for ${submission.student_id}:`, inputErr.message);
          updateSubmissionStatus(submission.submission_id, "runtime_error", () => {
            if (--remaining === 0) doneCallback?.();
          });
          return;
        }

        const child = spawn(executable, args, options);

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
              if (err) console.error("Error updating actual output:", err);

              updateSubmissionStatus(submission.submission_id, "executed", (err2) => {
                if (err2) console.error("Error updating status:", err2);
                if (--remaining === 0) doneCallback?.();
              });
            });
          } else {
            console.error(`${submission.student_id} runtime error:`, errorOutput.trim());

            updateSubmissionError(submission.submission_id, errorOutput.trim(), (err) => {
              if (err) console.error("Failed to save error to DB:", err.message);
            });

            updateSubmissionStatus(submission.submission_id, "runtime_error", (err) => {
              if (err) console.error("Error updating status:", err);
              if (--remaining === 0) doneCallback?.();
            });
          }
        });

        // Write input data to stdin if required
        if (inputData) {
          child.stdin.write(inputData + "\n");
        }
        child.stdin.end();
      });
    });
  });
}

module.exports = { runAllCompiledSubmissions };
