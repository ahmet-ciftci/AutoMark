const {
  getSubmissionsAndTestConfig,
  updateSubmissionStatus
} = require("./Database"); 

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
           
      } else {
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
