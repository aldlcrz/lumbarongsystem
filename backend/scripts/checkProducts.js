const { Product } = require('../src/models');
const sequelize = require('../src/config/db');

async function check() {
  try {
    const products = await Product.findAll();
    console.log(JSON.stringify(products.map(p => ({
      id: p.id,
      name: p.name,
      image: p.image
    })), null, 2));
  } catch (err) {
    console.error(err);
  } finally {
    await sequelize.close();
  }
}

check();
