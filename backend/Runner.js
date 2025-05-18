const { spawn, execSync } = require("child_process");
const fs = require("fs");
const path = require("path");

const {
  updateSubmissionStatus,
  updateActualOutput
} = require("./Database");

function runSubmission(submission, config, callback) {
  console.log(`Running submission for student: ${submission.student_id}`);
  
  return new Promise((resolve) => {
    if (!config || !config.run_command?.trim()) {
      console.warn(`No valid run config for ${submission.student_id}`);
      updateSubmissionStatus(submission.submission_id, "skipped", "No valid run configuration", (err) => {
        if (err) console.error("DB update failed:", err.message);
        const result = { success: false, status: "skipped", message: "No valid run configuration" };
        resolve(result);
        if (callback) callback(result);
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
        updateSubmissionStatus(submission.submission_id, "skipped", (err) => {
          if (err) console.error("DB update failed:", err.message);
          const result = { success: false, status: "skipped", message: "Unsupported input method" };
          resolve(result);
          if (callback) callback(result);
        });
        return;
      }
    } catch (inputErr) {
      console.error(`Error preparing input for ${submission.student_id}:`, inputErr.message);
      updateSubmissionStatus(submission.submission_id, "runtime_error", inputErr.message, (err) => {
        if (err) console.error("DB update failed:", err.message);
        const result = { success: false, status: "runtime_error", message: inputErr.message };
        resolve(result);
        if (callback) callback(result);
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

          updateSubmissionStatus(submission.submission_id, "executed", null, (err2) => {
            if (err2) console.error("Error updating status:", err2);
            const result = { success: true, status: "executed", output: output.trim() };
            resolve(result);
            if (callback) callback(result);
          });
        });
      } else {
        console.error(`${submission.student_id} runtime error:`, errorOutput.trim());
        updateSubmissionStatus(submission.submission_id, "runtime_error", errorOutput.trim(), (err) => {
          if (err) console.error("Error updating status:", err);
          const result = { success: false, status: "runtime_error", message: errorOutput.trim() };
          resolve(result);
          if (callback) callback(result);
        });
      }
    });

    // Write input data to stdin if required
    if (inputData) {
      child.stdin.write(inputData + "\n");
    }
    child.stdin.end();
  });
}

module.exports = { runSubmission };