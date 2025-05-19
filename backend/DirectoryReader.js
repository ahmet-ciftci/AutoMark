const fs = require('fs');
const path = require('path');

/**
 * Recursively reads a directory and returns its structure.
 * Filters out unwanted files like .exe, __MACOSX, .DS_Store, etc.
 */
function readDirectoryRecursive(dirPath, allowedExtensions = []) {
  // Handle non-existent directories
  if (!fs.existsSync(dirPath)) {
    console.error(`Directory does not exist: ${dirPath}`);
    return [];
  }

  try {
    // Handle permission issues or other problems with readdir
    const items = fs.readdirSync(dirPath)
      .filter(name => {
        // Skip hidden files and directories
        if (name.startsWith('.') || name.startsWith('__MACOSX')) {
          return false;
        }
        
        const ext = path.extname(name).toLowerCase();
        // If no extensions specified, include all non-hidden files
        if (allowedExtensions.length === 0) {
          return true;
        }
        
        // Otherwise only include files with the allowed extensions
        return allowedExtensions.includes(ext);
      });

    return items.map(item => {
      const fullPath = path.join(dirPath, item);
      
      try {
        const stats = fs.statSync(fullPath);
        const isDirectory = stats.isDirectory();
        
        // Skip empty directories by default
        if (isDirectory) {
          const children = readDirectoryRecursive(fullPath, allowedExtensions);
          // Return folder entry with its children
          return {
            name: item,
            type: 'folder',
            path: fullPath,
            children: children
          };
        } else {
          // Return file entry
          return {
            name: item,
            type: 'file',
            path: fullPath,
            children: []
          };
        }
      } catch (err) {
        console.error(`Error processing item ${fullPath}:`, err);
        // Return partial information for files that can't be fully processed
        return {
          name: item + ' (Error)',
          type: 'error',
          path: fullPath,
          children: []
        };
      }
    });
  } catch (err) {
    console.error(`Error reading directory ${dirPath}:`, err);
    return [];
  }
}

module.exports = { readDirectoryRecursive };
