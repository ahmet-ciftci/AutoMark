const {
  getSubmissionsAndTestConfig,
  updateSubmissionStatus
} = require("./Database");

const fs = require("fs");
const { exec } = require("child_process");

function compareAllOutputs(projectId, doneCallback) {
  getSubmissionsAndTestConfig(projectId, (err, submissions) => {
    if (err) {
      console.error("Error fetching submissions and test config:", err);
      return doneCallback?.(err);
    }

    if (!submissions || submissions.length === 0) {
      console.log("No submissions found.");
      return doneCallback?.();
    }

    let executedSubs = submissions.filter(s => s.status === "executed");
    let remaining = executedSubs.length;

    if (remaining === 0) {
      console.log("No executed submissions to compare.");
      return doneCallback?.();
    }

    executedSubs.forEach((submission) => {
      const submissionId = submission.submission_id || submission.id;
      const actual = submission.actual_output?.trim();

      const finish = (status) => {
        updateSubmissionStatus(submissionId, status, (err) => {
          if (err) console.error("Error updating status:", err);
          if (--remaining === 0 && doneCallback) doneCallback();
        });
      };

      // Normalize line endings for any comparison method
      const normalizeLineEndings = (str) => str?.replace(/\r\n/g, "\n");
      const expectedNormalized = normalizeLineEndings(submission.expected_output?.trim());
      const actualNormalized = normalizeLineEndings(actual);

      if (submission.output_method === "manual") {
        // Direct string comparison
        const matched = actualNormalized === expectedNormalized;
        console.log(`${submission.student_id}: manual comparison ${matched ? 'matched' : 'failed'}`);
        finish(matched ? "success" : "failed");
      } 
      else if (submission.output_method === "file") {
        // Compare with file content
        try {
          const matched = actualNormalized === expectedNormalized;
          console.log(`${submission.student_id}: file comparison ${matched ? 'matched' : 'failed'}`);
          finish(matched ? "success" : "failed");
        } catch (error) {
          console.error(`Error comparing file output for ${submission.student_id}:`, error);
          finish("error");
        }
      } 
      else if (submission.output_method === "script") {
        // Write outputs to temporary files and execute comparison script
        try {
          // For script comparison, both expected and actual should be available in the submission
          if (!submission.expected_output || !actual) {
            console.error(`Missing expected or actual output for ${submission.student_id}`);
            return finish("error");
          }
          
          // Same comparison as manual for now
          // In a full implementation, you'd execute the script specified in submission.expected_output
          // and pass it the actual output, then check its return code
          const matched = actualNormalized === expectedNormalized;
          console.log(`${submission.student_id}: script comparison ${matched ? 'matched' : 'failed'}`);
          finish(matched ? "success" : "failed");
        } catch (error) {
          console.error(`Error executing comparison script for ${submission.student_id}:`, error);
          finish("error");
        }
      } 
      else {
        console.warn(`Unsupported method ${submission.output_method} for ${submission.student_id}`);
        finish("skipped");
      }
    });
  });
}

module.exports = {
  compareAllOutputs
};
