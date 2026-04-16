const fs = require('fs');
const path = require('path');

const uploadsRoot = path.join(__dirname, '../../uploads');
const productsUploadDir = path.join(uploadsRoot, 'products');
const paymentsUploadDir = path.join(uploadsRoot, 'payments');

function ensureDir(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

function ensureUploadDirs() {
  ensureDir(uploadsRoot);
  ensureDir(productsUploadDir);
  ensureDir(paymentsUploadDir);
}

module.exports = {
  uploadsRoot,
  productsUploadDir,
  paymentsUploadDir,
  ensureUploadDirs,
};