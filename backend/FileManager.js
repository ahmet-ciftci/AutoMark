const fs = require('fs');
const path = require('path');
const AdmZip = require('adm-zip');
const { addSubmission, submissionExists } = require('./Database');

function extractAndSaveSubmissions(submissionsDir, outputDir, projectId) {
  return new Promise((resolve, reject) => {
    if (!fs.existsSync(submissionsDir)) {
      const msg = `Submissions directory not found: ${submissionsDir}`;
      console.error(msg);
      return reject(new Error(msg));
    }

    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    const zipFiles = fs.readdirSync(submissionsDir).filter(file => file.endsWith('.zip'));

    const tasks = zipFiles.map(zipFile => {
      return new Promise((resolveOne) => {
        const studentId = path.basename(zipFile, '.zip');
        const zipPath = path.join(submissionsDir, zipFile);
        const extractPath = path.join(outputDir, studentId);

        try {
          const zip = new AdmZip(zipPath);
          zip.extractAllTo(extractPath, true);
          console.log(`Extracted ${zipFile} → ${extractPath}`);
        } catch (err) {
          console.error(`Failed to extract ${zipFile}:`, err.message);

          // Handle ZIP extraction error
          return submissionExists(projectId, studentId, (err2, exists) => {
            if (err2 || exists) {
              if (err2) console.error(`Error checking submission existence after ZIP failure:`, err2.message);
              else console.log(`Zip error for ${studentId} skipped (already exists)`);
              return resolveOne();
            }

            addSubmission(
              projectId, studentId, 'zip_error', '', err.message, '', (err3) => {
                if (err3) console.error(`Failed to insert zip error for ${studentId}:`, err3.message);
                else console.log(`Zip extraction error recorded for ${studentId}`);
                resolveOne();
              }
            );
          });
        }

        // If extraction succeeded:
        submissionExists(projectId, studentId, (err, exists) => {
          if (err || exists) {
            if (err) console.error(`Error checking existing submission for ${studentId}:`, err.message);
            else console.log(`Submission for ${studentId} already exists for project ${projectId}. Skipping.`);
            return resolveOne();
          }

          const status = fs.existsSync(extractPath) ? '' : 'extraction_failed';
          const pathToUse = fs.existsSync(extractPath) ? extractPath : '';
          const errorMsg = fs.existsSync(extractPath) ? '' : 'Extraction directory missing';

          addSubmission(
            projectId, studentId, status, pathToUse, errorMsg, '', (err2) => {
              if (err2) console.error(`Failed to insert submission for ${studentId}:`, err2.message);
              else console.log(`Submission ${status === '' ? 'inserted' : 'extraction failed'} for ${studentId}`);
              resolveOne();
            }
          );
        });
      });
    });

    Promise.all(tasks).then(() => resolve()).catch(reject);
  });
}

module.exports = {
  extractAndSaveSubmissions
};
