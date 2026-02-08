const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, '..', '..', 'packages', 'proto', 'gen', 'ts-frontend');
const fallbackSrcDir = path.join('/', 'packages', 'proto', 'gen', 'ts-frontend');
const destDir = path.join(__dirname, '..', 'src', 'proto');

function copyDir(src, dest) {
  if (!fs.existsSync(src)) {
    return false;
  }

  // Remove destination if it exists
  if (fs.existsSync(dest)) {
    fs.rmSync(dest, { recursive: true, force: true });
  }

  // Create destination directory
  fs.mkdirSync(dest, { recursive: true });

  // Copy all files recursively
  const entries = fs.readdirSync(src, { withFileTypes: true });
  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);

    if (entry.isDirectory()) {
      copyDir(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }

  return true;
}

// Try primary path first
console.log(`Attempting to copy from: ${srcDir}`);
if (copyDir(srcDir, destDir)) {
  console.log(`✓ Proto files copied successfully to ${destDir}`);
  process.exit(0);
}

// Try fallback path
console.log(`Primary path not found, trying fallback: ${fallbackSrcDir}`);
if (copyDir(fallbackSrcDir, destDir)) {
  console.log(`✓ Proto files copied successfully from fallback path to ${destDir}`);
  process.exit(0);
}

// If neither path exists, log warning but exit successfully
console.warn(`⚠ Proto source directory not found at either path. Continuing with existing proto files if available.`);
process.exit(0);
