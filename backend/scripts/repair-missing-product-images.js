const fs = require('fs');
const path = require('path');
const { Product, sequelize } = require('../src/models');

const uploadsProductsDir = path.join(__dirname, '..', 'uploads', 'products');

function parseImages(value) {
  if (Array.isArray(value)) return value;
  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value);
      if (Array.isArray(parsed)) return parsed;
    } catch (_) {}
  }
  return [];
}

function firstUrl(images) {
  if (!Array.isArray(images) || images.length === 0) return null;
  const first = images[0];
  if (typeof first === 'string') return first;
  if (first && typeof first === 'object' && typeof first.url === 'string') {
    return first.url;
  }
  return null;
}

function toImageObject(entry) {
  if (typeof entry === 'string') {
    return { url: entry, variation: 'Variation 1' };
  }
  if (entry && typeof entry === 'object') return entry;
  return { url: '', variation: 'Variation 1' };
}

function fileExistsForUploadUrl(url) {
  if (typeof url !== 'string') return false;
  if (!url.startsWith('/uploads/products/')) return true;

  const fileName = path.basename(url);
  const resolved = path.join(uploadsProductsDir, fileName);
  return fs.existsSync(resolved);
}

async function run() {
  if (!fs.existsSync(uploadsProductsDir)) {
    console.error('Missing uploads/products directory:', uploadsProductsDir);
    process.exitCode = 1;
    return;
  }

  const pool = fs
    .readdirSync(uploadsProductsDir, { withFileTypes: true })
    .filter((d) => d.isFile())
    .map((d) => d.name)
    .sort();

  if (pool.length === 0) {
    console.error('No files available in uploads/products for repair.');
    process.exitCode = 1;
    return;
  }

  const products = await Product.findAll({ order: [['createdAt', 'DESC']] });

  let repaired = 0;
  let checked = 0;
  let cursor = 0;

  for (const product of products) {
    let images = parseImages(product.image);
    const currentFirst = firstUrl(images);

    if (!currentFirst) continue;
    checked += 1;

    if (fileExistsForUploadUrl(currentFirst)) {
      continue;
    }

    const pick = pool[cursor % pool.length];
    cursor += 1;
    const replacementUrl = `/uploads/products/${pick}`;

    if (!Array.isArray(images) || images.length === 0) {
      images = [{ url: replacementUrl, variation: 'Variation 1' }];
    } else {
      const first = toImageObject(images[0]);
      images[0] = { ...first, url: replacementUrl };
    }

    product.image = images;
    await product.save();
    repaired += 1;

    console.log(
      `Repaired ${product.id} (${product.name}) -> ${replacementUrl}`,
    );
  }

  console.log('Repair complete.');
  console.log(`Checked products with image: ${checked}`);
  console.log(`Repaired missing image refs: ${repaired}`);
}

run()
  .catch((err) => {
    console.error('Repair failed:', err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await sequelize.close();
  });
