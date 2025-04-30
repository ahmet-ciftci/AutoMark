const fs = require('fs');
const path = require('path');
const AdmZip = require('adm-zip');
const { addSubmission } = require('./Database');



function extractAndSaveSubmissions(submissionsDir, outputDir, projectId) {
    if (!fs.existsSync(submissionsDir)) {
      console.error('Submissions directory not found:', submissionsDir);
      return;
    }
  
    const zipFiles = fs.readdirSync(submissionsDir).filter(file => file.endsWith('.zip'));
  
    zipFiles.forEach(zipFile => {
      const studentId = path.basename(zipFile, '.zip');
      const zipPath = path.join(submissionsDir, zipFile);
      const extractPath = path.join(outputDir, studentId);
  
      try {
        //zip extract etme
        const zip = new AdmZip(zipPath);
        zip.extractAllTo(extractPath, true);
        console.log(`Extracted ${zipFile} to ${extractPath}`);
  
        // klasör var mı kontrol etme
        if (fs.existsSync(extractPath)) {
          addSubmission(projectId, studentId,'', extractPath, '', '', 
            (err, id) => {
              if (err) {
                console.error(`Failed to insert successful submission for ${studentId}:`, err.message);
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
  
      } catch (err) {
        console.error(`Failed to extract ${zipFile}:`, err.message);
  
        addSubmission(projectId, studentId, 'zip_error', '', err.message,'',
          (err2, id) => {
            if (err2) {
              console.error(`Failed to insert zip error for ${studentId}:`, err2.message);
            } else {
              console.log(`Zip extraction error recorded for ${studentId}`);
            }
          }
        );
      }
    });
  }
  
  module.exports = {
    extractAndSaveSubmissions
  };