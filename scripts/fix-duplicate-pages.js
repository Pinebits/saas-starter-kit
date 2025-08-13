// Temporary script to find and resolve duplicate pages
const fs = require('fs');
const path = require('path');

// Directories to check
const directoriesToCheck = [
  'pages/admin',
  'pages/admin/tenants',
  'pages/api/admin/users'
];

// Function to check for duplicates in a directory
function checkForDuplicates(dirPath) {
  console.log(`Checking directory: ${dirPath}`);
  
  const files = fs.readdirSync(dirPath);
  const baseNames = new Map();
  
  files.forEach(file => {
    if (fs.lstatSync(path.join(dirPath, file)).isDirectory()) {
      return; // Skip directories
    }
    
    const baseName = path.parse(file).name;
    const extension = path.parse(file).ext;
    
    if (!baseNames.has(baseName)) {
      baseNames.set(baseName, []);
    }
    
    baseNames.get(baseName).push({
      fullPath: path.join(dirPath, file),
      extension
    });
  });
  
  // Check for duplicates
  for (const [baseName, fileList] of baseNames.entries()) {
    if (fileList.length > 1) {
      console.log(`Duplicate found for ${baseName}:`);
      fileList.forEach(file => {
        console.log(`  - ${file.fullPath}`);
      });
      
      // Keep the .tsx file if it exists, otherwise keep the first file
      const tsxFile = fileList.find(file => file.extension === '.tsx');
      const fileToKeep = tsxFile || fileList[0];
      
      console.log(`Keeping: ${fileToKeep.fullPath}`);
      
      // Remove other files
      fileList.forEach(file => {
        if (file.fullPath !== fileToKeep.fullPath) {
          console.log(`Removing: ${file.fullPath}`);
          fs.unlinkSync(file.fullPath);
        }
      });
    }
  }
}

// Run the check for each directory
directoriesToCheck.forEach(dir => {
  const fullPath = path.resolve(dir);
  if (fs.existsSync(fullPath)) {
    checkForDuplicates(fullPath);
  } else {
    console.log(`Directory not found: ${fullPath}`);
  }
});