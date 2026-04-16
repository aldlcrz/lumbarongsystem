const fs = require('fs');
const path = require('path');

const projectRoot = path.join(__dirname, '..');
const targetDir = path.join(projectRoot, 'uploads', 'products');
const sourceDirs = [
  path.join(projectRoot, 'public', 'uploads', 'products'),
  path.join(projectRoot, 'public', 'uploads'),
];

const imageExts = new Set([
  '.jpg',
  '.jpeg',
  '.png',
  '.webp',
  '.gif',
  '.bmp',
  '.jfif',
]);

function ensureDir(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

function isImageFile(fileName) {
  return imageExts.has(path.extname(fileName).toLowerCase());
}

function filesEqual(fileA, fileB) {
  const statA = fs.statSync(fileA);
  const statB = fs.statSync(fileB);
  if (statA.size !== statB.size) return false;

  const bufA = fs.readFileSync(fileA);
  const bufB = fs.readFileSync(fileB);
  return bufA.equals(bufB);
}

function uniqueTargetPath(baseTargetPath) {
  if (!fs.existsSync(baseTargetPath)) return baseTargetPath;

  const dir = path.dirname(baseTargetPath);
  const ext = path.extname(baseTargetPath);
  const name = path.basename(baseTargetPath, ext);
  let i = 1;

  while (true) {
    const candidate = path.join(dir, `${name}-${i}${ext}`);
    if (!fs.existsSync(candidate)) return candidate;
    i += 1;
  }
}

function run() {
  ensureDir(targetDir);

  let scanned = 0;
  let copied = 0;
  let skippedSame = 0;
  let renamed = 0;

  for (const sourceDir of sourceDirs) {
    if (!fs.existsSync(sourceDir)) {
      console.log(`Skipping missing source: ${sourceDir}`);
      continue;
    }

    const entries = fs.readdirSync(sourceDir, { withFileTypes: true });
    for (const entry of entries) {
      if (!entry.isFile()) continue;
      if (!isImageFile(entry.name)) continue;

      scanned += 1;
      const sourcePath = path.join(sourceDir, entry.name);
      const initialTarget = path.join(targetDir, entry.name);

      if (fs.existsSync(initialTarget)) {
        if (filesEqual(sourcePath, initialTarget)) {
          skippedSame += 1;
          continue;
        }

        const renamedTarget = uniqueTargetPath(initialTarget);
        fs.copyFileSync(sourcePath, renamedTarget);
        renamed += 1;
        copied += 1;
        continue;
      }

      fs.copyFileSync(sourcePath, initialTarget);
      copied += 1;
    }
  }

  console.log('Product image migration complete.');
  console.log(`Scanned images: ${scanned}`);
  console.log(`Copied images: ${copied}`);
  console.log(`Skipped identical: ${skippedSame}`);
  console.log(`Renamed on collision: ${renamed}`);
  console.log(`Target folder: ${targetDir}`);
}

run();
