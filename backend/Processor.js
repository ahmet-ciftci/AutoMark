const path = require('path');
const { 
  getSubmissionsAndTestConfig, 
  getConfigurationByProjectId,
  getTestConfigByProjectId,
  updateSubmissionStatus
} = require('./Database.js');
const { extractAndSaveSubmissions } = require('./FileManager.js');
const { compileSubmission } = require('./Compiler.js');
const { runSubmission } = require('./Runner.js');
const { compareOutput } = require('./Comparer.js');

// TTL value in milliseconds
const SUBMISSION_TIMEOUT = 30000; // 30 seconds

/**
 * Create a promise that rejects after a specified timeout
 * @param {number} ms - Timeout in milliseconds
 * @returns {Promise} A promise that rejects after the timeout
 */
function timeout(ms) {
  return new Promise((_, reject) => {
    setTimeout(() => {
      reject(new Error(`Operation timed out after ${ms}ms`));
    }, ms);
  });
}

/**
 * Execute a promise with a timeout
 * @param {Promise} promise - The promise to execute
 * @param {number} ms - Timeout in milliseconds
 * @returns {Promise} A promise that resolves with the result or rejects with timeout
 */
function withTimeout(promise, ms) {
  return Promise.race([
    promise,
    timeout(ms)
  ]);
}

async function processProject(projectId, submissionsPath, concurrency = 4) {
  try {
    // Step 1: Extract all submission files
    console.log(`Starting extraction of all submissions for project ${projectId}`);
    const outputPath = path.join(submissionsPath, '..', 'output');
    await extractAndSaveSubmissions(submissionsPath, outputPath, projectId);
    console.log('Extraction complete');
    
    // Step 2: Get all submissions for this project
    const submissions = await new Promise((resolve, reject) => {
      getSubmissionsAndTestConfig(projectId, (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
    
    // Step 3: Get the compilation configuration for this project
    const config = await new Promise((resolve, reject) => {
      getConfigurationByProjectId(projectId, (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });
    
    // Step 4: Get test configuration for this project
    const testConfig = await new Promise((resolve, reject) => {
      getTestConfigByProjectId(projectId, (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });
    
    if (!config) {
      throw new Error(`No configuration found for project ${projectId}`);
    }
    
    if (!testConfig) {
      throw new Error(`No test configuration found for project ${projectId}`);
    }
    
    // Step 5: Process submissions in batches (parallel processing)
    const results = {
      total: submissions.length,
      compiled: 0,
      compileErrors: 0,
      executed: 0,
      runtimeErrors: 0,
      success: 0,
      failed: 0,
      errors: 0,
      skipped: 0,
      timeouts: 0
    };
    
    console.log(`Processing ${submissions.length} submissions with concurrency of ${concurrency}`);
    
    const batchProcess = async (submissions, batchSize) => {
      for (let i = 0; i < submissions.length; i += batchSize) {
        const batch = submissions.slice(i, i + batchSize);
        console.log(`Processing batch ${i/batchSize + 1} of ${Math.ceil(submissions.length/batchSize)}`);
        
        // Process each submission in the batch in parallel with timeout
        await Promise.all(batch.map(submission => 
          processSubmissionWithTimeout(submission, config, testConfig, results)
        ));
      }
    };
    
    await batchProcess(submissions, concurrency);
    
    return results;
  } catch (error) {
    console.error('Project processing failed:', error);
    throw error;
  }
}

/**
 * Process a submission with a timeout
 * @param {Object} submission - The submission to process
 * @param {Object} config - Compilation configuration
 * @param {Object} testConfig - Test configuration
 * @param {Object} results - Results tracker
 * @returns {Promise<Object>} The processing result
 */
async function processSubmissionWithTimeout(submission, config, testConfig, results) {
  try {
    return await withTimeout(
      processSubmission(submission, config, testConfig, results),
      SUBMISSION_TIMEOUT
    );
  } catch (error) {
    const studentId = submission.student_id;
    const submissionId = submission.submission_id || submission.id;
    const isTimeout = error.message.includes('timed out');
    
    if (isTimeout) {
      console.error(`⏱️ ${studentId} processing timed out after ${SUBMISSION_TIMEOUT/1000}s`);
      results.timeouts++;
      
      // Update the submission status in the database
      await new Promise((resolve) => {
        updateSubmissionStatus(
          submissionId, 
          'time_exceeded', 
          `Processing exceeded the maximum allowed time (${SUBMISSION_TIMEOUT/1000}s)`, 
          (err) => {
            if (err) console.error(`Failed to update status for ${studentId}:`, err);
            resolve();
          }
        );
      });
      
      return { 
        studentId, 
        status: 'time_exceeded', 
        message: `Processing exceeded the maximum allowed time (${SUBMISSION_TIMEOUT/1000}s)`
      };
    } else {
      console.error(`Error processing ${studentId}:`, error);
      results.errors++;
      
      // Update the submission status in the database
      await new Promise((resolve) => {
        updateSubmissionStatus(
          submissionId, 
          'error', 
          error.message, 
          (err) => {
            if (err) console.error(`Failed to update status for ${studentId}:`, err);
            resolve();
          }
        );
      });
      
      return { studentId, status: 'error', message: error.message };
    }
  }
}

async function processSubmission(submission, config, testConfig, results) {
  const studentId = submission.student_id;
  console.log(`Starting sequential processing for ${studentId}`);
  
  try {
    // Step 1: Compile the submission
    console.log(`Compiling submission for ${studentId}`);
    const compileResult = await compileSubmission(submission, config);
    
    if (!compileResult.success) {
      console.log(`Compilation failed for ${studentId}: ${compileResult.errorMessage}`);
      results.compileErrors++;
      return { studentId, status: 'compile_error', message: compileResult.errorMessage };
    }
    
    results.compiled++;
    console.log(`Compilation successful for ${studentId}`);
    
    // Step 2: Run the submission
    console.log(`Running submission for ${studentId}`);
    // Merge submission with test config for input method and data
    const submissionWithInput = {
      ...submission,
      input_method: testConfig.input_method,
      input: testConfig.input
    };
    
    const runResult = await runSubmission(submissionWithInput, config);
    
    if (!runResult.success) {
      console.log(`Runtime error for ${studentId}: ${runResult.message}`);
      results.runtimeErrors++;
      return { studentId, status: 'runtime_error', message: runResult.message };
    }
    
    results.executed++;
    console.log(`Execution successful for ${studentId}`);
    
    // Step 3: Compare the output
    console.log(`Comparing output for ${studentId}`);
    // Merge everything needed for comparison
    const submissionForComparison = {
      ...submission,
      ...testConfig,
      actual_output: runResult.output
    };
    
    const compareResult = await compareOutput(submissionForComparison);
    
    if (compareResult.status === 'success') {
      results.success++;
      console.log(`✅ ${studentId} successful!`);
    } else if (compareResult.status === 'failed') {
      results.failed++;
      console.log(`❌ ${studentId} failed: ${compareResult.message}`);
    } else if (compareResult.status === 'skipped') {
      results.skipped++;
      console.log(`⏭️ ${studentId} skipped: ${compareResult.message}`);
    } else {
      results.errors++;
      console.log(`⚠️ ${studentId} error: ${compareResult.message}`);
    }
    
    return { 
      studentId, 
      status: compareResult.status, 
      message: compareResult.message,
      output: runResult.output
    };
  } catch (error) {
    console.error(`Error processing ${studentId}:`, error);
    results.errors++;
    return { studentId, status: 'error', message: error.message };
  }
}


module.exports = {
  processProject,
  processSubmission
};