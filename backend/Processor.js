const path = require('path');
const { 
  getSubmissionsAndTestConfig, 
  getConfigurationByProjectId,
  getTestConfigByProjectId 
} = require('./Database.js');
const { extractAndSaveSubmissions } = require('./FileManager.js');
const { compileSubmission } = require('./Compiler.js');
const { runSubmission } = require('./Runner.js');
const { compareOutput } = require('./Comparer.js');

/**
 * Process a project by extracting, compiling, running, and comparing all submissions
 * @param {number} projectId - The ID of the project to process
 * @param {string} submissionsPath - Path to the directory containing submission ZIP files
 * @param {number} [concurrency=4] - How many submissions to process in parallel
 * @returns {Promise<Object>} Processing results
 */
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
      skipped: 0
    };
    
    console.log(`Processing ${submissions.length} submissions with concurrency of ${concurrency}`);
    
    const batchProcess = async (submissions, batchSize) => {
      for (let i = 0; i < submissions.length; i += batchSize) {
        const batch = submissions.slice(i, i + batchSize);
        console.log(`Processing batch ${i/batchSize + 1} of ${Math.ceil(submissions.length/batchSize)}`);
        
        // Process each submission in the batch in parallel
        await Promise.all(batch.map(submission => processSubmission(submission, config, testConfig, results)));
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
 * Process a single submission sequentially through compile → run → compare
 * @param {Object} submission - The submission to process
 * @param {Object} config - Compilation configuration
 * @param {Object} testConfig - Test configuration
 * @param {Object} results - Reference to the results object for tracking
 * @returns {Promise<Object>} - The submission processing result
 */
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

/**
 * Process an individual submission by ID through the complete workflow
 * @param {number} submissionId - The ID of the submission to process
 * @param {number} configId - The configuration ID to use (optional)
 * @returns {Promise<Object>} Processing result
 */
async function processSubmissionById(submissionId, configId) {
  // This function would be implemented to process a single submission
  // by getting the submission, config, and test config by IDs
  // and calling processSubmission
  
  // Implementation would be similar to the IPC handlers in main.js
  
  throw new Error('Not implemented');
}

module.exports = {
  processProject,
  processSubmission,
  processSubmissionById
};