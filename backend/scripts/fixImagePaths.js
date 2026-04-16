const { Product } = require('../src/models');
const sequelize = require('../src/config/db');

async function fix() {
  try {
    const products = await Product.findAll();
    let updatedCount = 0;

    for (const product of products) {
      let images = product.image;
      
      // If Sequelize didn't parse it automatically
      if (typeof images === 'string') {
          try {
              images = JSON.parse(images);
          } catch(e) {
              console.error("Could not parse image string for product", product.id);
          }
      }

      if (Array.isArray(images)) {
        let changed = false;
        const newImages = images.map(img => {
          if (typeof img === 'string' && img.startsWith('/uploads/products/') && !img.includes('.')) {
            changed = true;
            return img + '.jpg';
          } else if (img && typeof img === 'object' && img.url && img.url.startsWith('/uploads/products/') && !img.url.includes('.')) {
            changed = true;
            return { ...img, url: img.url + '.jpg' };
          }
          return img;
        });

        if (changed) {
          product.image = newImages;
          await product.save();
          updatedCount++;
          console.log(`Updated product: ${product.name}`);
        }
      }
    }
    console.log(`Successfully updated ${updatedCount} products.`);
  } catch (err) {
    console.error(err);
  } finally {
    await sequelize.close();
  }
}

fix();
