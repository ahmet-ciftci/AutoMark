const {
  updateSubmissionStatus
} = require("./Database");

const fs = require("fs");
const { exec } = require("child_process");

function compareOutput(submission, callback) {
  console.log(`Comparing output for student: ${submission.student_id}`);
  
  return new Promise((resolve) => {
    const submissionId = submission.submission_id || submission.id;
    const actual = submission.actual_output?.trim();
    
    const completeComparison = (status, message = "") => {
      updateSubmissionStatus(submissionId, status, message, (err) => {
        if (err) console.error("Error updating status:", err);
        
        const result = { 
          success: status === "success", 
          status: status, 
          message: message 
        };
        
        resolve(result);
        if (callback) callback(result);
      });
    };

    // Normalize line endings for any comparison method
    const normalizeLineEndings = (str) => str?.replace(/\r\n/g, "\n");
    const expectedNormalized = normalizeLineEndings(submission.expected_output?.trim());
    const actualNormalized = normalizeLineEndings(actual);

    if (!actual) {
      console.warn(`Missing actual output for ${submission.student_id}`);
      return completeComparison("error", "Missing actual output");
    }

    if (!submission.expected_output) {
      console.warn(`Missing expected output for ${submission.student_id}`);
      return completeComparison("error", "Missing expected output");
    }

    if (submission.output_method === "manual") {
      // Direct string comparison
      const matched = actualNormalized === expectedNormalized;
      console.log(`${submission.student_id}: manual comparison ${matched ? 'matched' : 'failed'}`);
      
      let message = "";
      if (!matched) {
        message = "Output does not match expected result";
      }
      
      completeComparison(matched ? "Success" : "Failed", message);
    } 
    else if (submission.output_method === "file") {
      // Compare with file content
      try {
        const matched = actualNormalized === expectedNormalized;
        console.log(`${submission.student_id}: file comparison ${matched ? 'matched' : 'failed'}`);
        
        let message = "";
        if (!matched) {
          message = "Output does not match expected file content";
        }
        
        completeComparison(matched ? "Success" : "Failed", message);
      } catch (error) {
        console.error(`Error comparing file output for ${submission.student_id}:`, error);
        completeComparison("error", error.message);
      }
    } 
    else if (submission.output_method === "script") {
      // Write outputs to temporary files and execute comparison script
      try {
        // For script comparison, both expected and actual should be available
        if (!submission.expected_output || !actual) {
          console.error(`Missing expected or actual output for ${submission.student_id}`);
          return completeComparison("error", "Missing expected or actual output");
        }
        
        // Same comparison as manual for now
        // In a full implementation, you'd execute the script specified in submission.expected_output
        // and pass it the actual output, then check its return code
        const matched = actualNormalized === expectedNormalized;
        console.log(`${submission.student_id}: script comparison ${matched ? 'matched' : 'failed'}`);
        
        let message = "";
        if (!matched) {
          message = "Output does not match according to script comparison";
        }
        
        completeComparison(matched ? "Success" : "Failed", message);
      } catch (error) {
        console.error(`Error executing comparison script for ${submission.student_id}:`, error);
        completeComparison("error", error.message);
      }
    } 
    else {
      console.warn(`Unsupported method ${submission.output_method} for ${submission.student_id}`);
      completeComparison("skipped", `Unsupported comparison method: ${submission.output_method}`);
    }
  });
}

module.exports = {
  compareOutput
};