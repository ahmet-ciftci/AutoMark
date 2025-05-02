const fs = require('fs');
const path = require('path');
const AdmZip = require('adm-zip');
const { addSubmission, submissionExists } = require('./Database');

function extractAndSaveSubmissions(submissionsDir, outputDir, projectId) {
  if (!fs.existsSync(submissionsDir)) {
    console.error('Submissions directory not found:', submissionsDir);
    return;
  }

  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const zipFiles = fs.readdirSync(submissionsDir).filter(file => file.endsWith('.zip'));

  zipFiles.forEach(zipFile => {
    const studentId = path.basename(zipFile, '.zip');
    const zipPath = path.join(submissionsDir, zipFile);
    const extractPath = path.join(outputDir, studentId);

    try {
      // ZIP çıkar
      const zip = new AdmZip(zipPath);
      zip.extractAllTo(extractPath, true);
      console.log(`Extracted ${zipFile} → ${extractPath}`);

      submissionExists(projectId, studentId, (err, exists) => {
        if (err) {
          console.error(`Error checking existing submission for ${studentId}:`, err.message);
          return;
        }

        if (exists) {
          console.log(`Submission for ${studentId} already exists for project ${projectId}. Skipping.`);
          return;
        }

        // klasör başarıyla oluşmuşsa kayıt yap
        if (fs.existsSync(extractPath)) {
          addSubmission(
            projectId,
            studentId,
            '', // status (henüz compile edilmedi)
            extractPath,
            '', // error_message
            '', // actual_output
            (err, id) => {
              if (err) {
                console.error(`Failed to insert submission for ${studentId}:`, err.message);
              } else {
                console.log(`Submission inserted for ${studentId}, id=${id}`);
              }
            }
          );
        } else {
          addSubmission(
            projectId,
            studentId,
            'extraction_failed',
            '',
            'Extraction directory missing',
            '',
            (err, id) => {
              if (err) {
                console.error(`Failed to insert extraction failure for ${studentId}:`, err.message);
              } else {
                console.log(`Extraction failed recorded for ${studentId}`);
              }
            }
          );
        }
      });

    } catch (err) {
      console.error(`Failed to extract ${zipFile}:`, err.message);

      // zip extraction hatası için de çakışma kontrolü ekle
      submissionExists(projectId, studentId, (err2, exists) => {
        if (err2) {
          console.error(`Error checking submission existence after ZIP failure:`, err2.message);
          return;
        }

        if (exists) {
          console.log(`Zip error for ${studentId} skipped (already exists)`);
          return;
        }

        addSubmission(
          projectId,
          studentId,
          'zip_error',
          '',
          err.message,
          '',
          (err3, id) => {
            if (err3) {
              console.error(`Failed to insert zip error for ${studentId}:`, err3.message);
            } else {
              console.log(`Zip extraction error recorded for ${studentId}`);
            }
          }
        );
      });
    }
  });
}

module.exports = {
  extractAndSaveSubmissions
};
