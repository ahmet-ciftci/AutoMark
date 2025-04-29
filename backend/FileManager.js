const fs = require('fs');
const path = require('path');
const AdmZip = require('adm-zip');


function extractAndValidateZips(submissionsDir, outputDir) {
    const results = [];
  
    //dosya var mı kontrol et
    if (!fs.existsSync(submissionsDir)) {
      console.error('Submissions directory not found:', submissionsDir);
      return results;
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
        console.log(`Extracted ${zipFile} → ${extractPath}`);
  
        // Çıkarılan klasör gerçekten oluştu mu?
        if (fs.existsSync(extractPath)) {
          results.push({
            studentId,
            status: 'extracted',
            message: 'Extracted successfully',
            extractPath
          });
        } else {
          results.push({
            studentId,
            status: 'extraction_failed',
            message: 'Extracted folder not found',
            extractPath: null
          });
        }
        //validation 
      } catch (err) {
        console.error(`Failed to extract ${zipFile}: ${err.message}`);
        results.push({
          studentId,
          status: 'zip_error',
          message: err.message,
          extractPath: null
        });
      }
    });
  
    return results;
  }
  
  module.exports = {
    extractAndValidateZips
  };