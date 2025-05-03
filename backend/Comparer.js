const {
  getSubmissionsAndTestConfig,
  updateSubmissionStatus
} = require("./Database");

const fs = require("fs");
const { exec } = require("child_process");

/*
Compares the actual output of executed submissions with the expected output.
Updates the submission status to 'success' or 'failed' based on the result.
 */

function compareAllOutputs(projectId) {
  getSubmissionsAndTestConfig(projectId, (err, submissions) => {
    if (err) {
      console.error("Error fetching submissions and test config:", err);
      return;
    }

    if (!submissions || submissions.length === 0) {
      console.log("No submissions found.");
      return;
    }

    // For each submission, compare actual and expected output.
    submissions.forEach((submission) => {
      if (submission.status !== "executed") return;

      const actual = submission.actual_output?.trim();
      const expected = submission.expected_output?.trim();

      if (submission.output_method === "manual") {
        const matched = actual === expected;

        updateSubmissionStatus(submission.id, matched ? "success" : "failed", (err) => {
          if (err) {
            console.error("Error updating submission status:", err);
          } else {
            console.log(
              matched
                ? ` ${submission.student_id} output matched.`
                : ` ${submission.student_id} output mismatch.`
            );
          }
        });
           
      }
      
      
      else if (submission.output_method === "file") {
        fs.readFile(submission.expected_output, 'utf-8', (err, expected) => {
          if (err) {
            console.error(`Error reading expected output file for ${submission.student_id}:`, err);
            updateSubmissionStatus(submission.id, "skipped", () => {});
            return;
          }
      
          const matched = actual.trim() === expected.trim();
          updateSubmissionStatus(submission.id, matched ? "success" : "failed", (err) => {
            if (err) console.error("Error updating status:", err);
            else console.log(
              matched
                ? `${submission.student_id} output matched (file).`
                : `${submission.student_id} output mismatch (file).`
            );
          });
        });
      }
      
      else if (submission.output_method === "script") {
        exec(submission.expected_output, { shell: true }, (err, stdout, stderr) => {
          if (err) {
            console.error(`Error executing expected output script for ${submission.student_id}:`, err);
            updateSubmissionStatus(submission.id, "skipped", () => {});
            return;
          }
      
          const expected = stdout.trim();
          const matched = actual.trim() === expected;
      
          updateSubmissionStatus(submission.id, matched ? "success" : "failed", (err) => {
            if (err) console.error("Error updating status:", err);
            else console.log(
              matched
                ? `${submission.student_id} output matched (script).`
                : `${submission.student_id} output mismatch (script).`
            );
          });
        });
      }
      
      else {
        console.warn(`Unsupported output method for student ${submission.student_id}. Skipping.`);
        updateSubmissionStatus(submission.id, "skipped", (err) => {
          if (err) console.error("Error updating skipped status:", err);
        });
      }
    });
  });
}

module.exports = {
  compareAllOutputs
};
