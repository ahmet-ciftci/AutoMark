const { spawn } = require("child_process");
const path = require("path");

const {
  getSubmissionsAndTestConfig,
  getConfigurationByProjectId,
  updateSubmissionStatus,
  updateActualOutput
} = require("./Database");

/*
Executes all compiled submissions for the given project.
1. Fetch submissions and test configuration for the project.
2. Filter only submissions with status "compiled".
3. For each submission:
  Load config, run executable, capture output.
  Update status: "executed", "runtime_error", or "skipped".
4. Once all executions are complete, notify main.js via doneCallback().
 */

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

    let compiledSubmissions = submissions.filter(sub => sub.status === "compiled"); //    // Only compiled ones are executed
    let remaining = compiledSubmissions.length; //// Counter for pending executions; doneCallback is called when it hits 0.
    
    if (remaining === 0) { 
      if (doneCallback) doneCallback();
      return;
    }

    compiledSubmissions.forEach((submission) => {
      console.log(` Running compiled submission for: ${submission.student_id}`);

      //For each submission we bring the properties of those visible Configurations
      getConfigurationByProjectId(projectId, (err, config) => {
        if (err || !config) {
          console.error(`No configuration found for project ${projectId}`);
          if (--remaining === 0 && doneCallback) doneCallback();
          return;
        }

        const executablePath = path.join(submission.path, config.run_command);

        let args = [];
        let child
        if (submission.input_method === "manual") {
          args = submission.input ? submission.input.trim().split(/\s+/) : [];
          child = spawn(executablePath, args);
        } 
        else if (submission.input_method === "file") {
          // Use shell option for file redirection
          child = spawn(`${executablePath} < ${submission.input}`, {
            shell: true
          });
        }
        else if (submission.input_method === "script") {
          // Use shell option for command substitution
          child = spawn(`${executablePath} $(${submission.input})`, {
            shell: true
          });
        }
   
        else {
          console.warn(`Unsupported input method for student ${submission.student_id}`);
          updateSubmissionStatus(submission.id, "skipped", (err) => {
            if (err) console.error("Error updating skipped submission:", err);
            if (--remaining === 0 && doneCallback) doneCallback();
          });
          return;
        }


        let output = "";
        let errorOutput = "";

        child.stdout.on("data", (data) => { //Everything the program prints is collected to stdout (uses Comparer)
          output += data.toString();
        });

        child.stderr.on("data", (data) => {
          errorOutput += data.toString();
        });

        child.on("close", (code) => {
          if (code === 0) {
            console.log(` ${submission.student_id} executed successfully.`);
            updateActualOutput(submission.id, output.trim(), (err) => {
              if (err) console.error("Error updating output:", err);
            });
            updateSubmissionStatus(submission.id, "executed", (err) => {
              if (err) console.error("Error updating status:", err);
              if (--remaining === 0 && doneCallback) doneCallback();
            });
          } else {
            console.error(` ${submission.student_id} runtime error.`);
            updateSubmissionStatus(submission.id, "runtime_error", (err) => {
              if (err) console.error("Error updating runtime error status:", err);
              if (--remaining === 0 && doneCallback) doneCallback();
            });
          }
        });
      });
    });
  });
}

module.exports = { runAllCompiledSubmissions };
