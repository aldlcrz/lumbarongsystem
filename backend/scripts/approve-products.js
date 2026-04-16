const sequelize = require('../src/config/database');
const { Product } = require('../src/models/Product');
const User = require('../src/models/User');

async function approveProducts() {
    try {
        await sequelize.authenticate();
        const [updatedCount] = await Product.update({ status: 'approved' }, { where: {} });
        console.log(`Approved ${updatedCount} products.`);

        const products = await Product.findAll();
        console.log('Products after approval:', products.map(p => ({ id: p.id, name: p.name, status: p.status, sellerId: p.sellerId })));

        const sellers = await User.findAll({ where: { role: 'seller' } });
        console.log('Sellers in DB:', sellers.map(s => ({ id: s.id, name: s.name, email: s.email })));

        process.exit(0);
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
}

approveProducts();
