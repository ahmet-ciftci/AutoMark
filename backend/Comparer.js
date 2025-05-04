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

      if (submission.output_method === "manual") {
        const normalizeLineEndings = (str) => str.replace(/\r\n/g, "\n");
        const expected = normalizeLineEndings(submission.expected_output?.trim());
        const actualNormalized = normalizeLineEndings(actual);
        const matched = actualNormalized === expected;
        console.log(`${submission.student_id}: manual comparison ${matched ? 'matched' : 'failed'}`);
        finish(matched ? "success" : "failed");

      } else {
        console.warn(`Unsupported method for ${submission.student_id}`);
        finish("skipped");
      }
    });
  });
}

module.exports = {
  compareAllOutputs
};
