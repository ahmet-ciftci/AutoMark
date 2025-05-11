const fs = require('fs');
const path = require('path');

/**
 * Recursively reads a directory and returns its structure.
 * Filters out unwanted files like .exe, __MACOSX, .DS_Store, etc.
 */
function readDirectoryRecursive(dirPath, allowedExtensions = []) {
  if (!fs.existsSync(dirPath)) return [];

  const items = fs.readdirSync(dirPath)
    .filter(name => {
      const ext = path.extname(name).toLowerCase();
      return !name.startsWith('__MACOSX') &&
             !name.startsWith('.') &&
             (allowedExtensions.length === 0 || allowedExtensions.includes(ext));
    });

  return items.map(item => {
    const fullPath = path.join(dirPath, item);
    const isDirectory = fs.statSync(fullPath).isDirectory();

    return {
      name: item,
      type: isDirectory ? 'folder' : 'file',
      path: fullPath,
      children: isDirectory ? readDirectoryRecursive(fullPath, allowedExtensions) : []
    };
  });
}


module.exports = { readDirectoryRecursive };
