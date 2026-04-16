const sequelize = require('../src/config/database');
const { Product, User } = require('../src/models/Product');
require('../src/models/User');

async function checkData() {
    try {
        await sequelize.authenticate();
        const products = await Product.findAll();
        console.log(`Total Products: ${products.length}`);
        if (products.length > 0) {
            console.log('Sample Product:', JSON.stringify(products[0], null, 2));
        }

        const users = await sequelize.query("SELECT id, name, email, role FROM Users", { type: sequelize.QueryTypes.SELECT });
        console.log(`Total Users: ${users.length}`);
        console.log('Users:', users);

        process.exit(0);
    } catch (error) {
        console.error('Error checking data:', error);
        process.exit(1);
    }
}

checkData();
