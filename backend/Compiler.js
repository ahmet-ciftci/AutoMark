const { exec } = require("child_process");
const path = require("path");
const fs = require("fs");

const {
  getSubmissionsAndTestConfig,
  getConfigurationByProjectId,
  updateSubmissionStatus
} = require("./Database");

/*
Fetches Submissions and TestConfig by project ID.
Then retrieves Configuration for each submission.
Compiles each submission using its config and test setup.
Updates submission status based on compilation result.
*/

function compileSubmission(submission, config, callback) { //Compiles a single student
  const sourcePath = path.join(submission.path, config.source_code);
  const outputPath = path.join(submission.path, "main");

  if (!fs.existsSync(sourcePath)) {
    return callback({
      success: false,
      errorMessage: `Source file not found: ${sourcePath}`
    });
  }

  const compileCmd = `${config.compile_command} ${sourcePath} ${config.compile_parameters} -o ${outputPath}`;
  
  exec(compileCmd, (error, stdout, stderr) => {
    if (error) {
      return callback({
        success: false,
        errorMessage: stderr || stdout || error.message
      });
    }

    callback({
      success: true
    });
  });
}

async function compileAllInProject(projectId, doneCallback) { //doneCallback =  called when a task finishes to notify the main function it's done.
  getSubmissionsAndTestConfig(projectId, (err, submissions) => { //pulls both Submissions and TestConfig tables along with projectId. 
    if (err || !submissions || submissions.length === 0) {
      if (doneCallback) doneCallback();
      return;
    }

    let remaining = submissions.length; //We keep track of how many students' codes will be compiled. When all of them are finished, doneCallback will be called.

    submissions.forEach((submission) => {
      const projectId = submission.project_id;

      //Bring the Config settings of the project that each submission is connected to. (gcc or clang, which .c file, which parameter, etc.)
      getConfigurationByProjectId(projectId, (err, config) => { 
        if (err || !config) {
          if (--remaining === 0 && doneCallback) doneCallback();
          return;
        }
        //compiles the file with gcc according to the config settings.
        compileSubmission(submission, config, (result) => { 
          if (result.success) {
            console.log(`${submission.student_id} compiled successfully.`);
            updateSubmissionStatus(submission.id, "compiled", (err) => {
              if (err) console.error("Failed to update submission status:", err);
              if (--remaining === 0 && doneCallback) doneCallback();
            });
          } else {
            console.error(`${submission.student_id} failed to compile: ${result.errorMessage}`);
            updateSubmissionStatus(submission.id, "compile_error", (err) => {
              if (err) console.error("Failed to update submission status:", err);
              if (--remaining === 0 && doneCallback) doneCallback();
            });
          }
        });
      });
    });
  });
}


module.exports = {
  compileSubmission,
  compileAllInProject
};
