const sequelize = require('../src/config/database');
const { QueryTypes } = require('sequelize');

async function fixDatabase() {
    try {
        await sequelize.authenticate();
        console.log('Connected to database.');

        // Check columns in Products table
        const [results] = await sequelize.query("SHOW COLUMNS FROM Products");
        const columns = results.map(r => r.Field);
        console.log('Current columns in Products:', columns);

        const missingColumns = [];
        if (!columns.includes('embroideryStyle')) missingColumns.push('ADD COLUMN embroideryStyle VARCHAR(255) DEFAULT "Traditional Calado"');
        if (!columns.includes('fabric')) missingColumns.push('ADD COLUMN fabric VARCHAR(255) DEFAULT "Piña-Seda Silk"');
        if (!columns.includes('lowStockThreshold')) missingColumns.push('ADD COLUMN lowStockThreshold INTEGER DEFAULT 5');
        if (!columns.includes('status')) missingColumns.push('ADD COLUMN status ENUM("pending", "approved", "rejected") DEFAULT "pending"');

        if (missingColumns.length > 0) {
            console.log('Adding missing columns to Products...');
            await sequelize.query(`ALTER TABLE Products ${missingColumns.join(', ')}`);
            console.log('Successfully updated Products table.');
        }

        // Check Users table
        const [uResults] = await sequelize.query("SHOW COLUMNS FROM Users");
        const uColumns = uResults.map(r => r.Field);
        console.log('Current columns in Users:', uColumns);

        const missingUColumns = [];
        if (!uColumns.includes('shopName')) missingUColumns.push('ADD COLUMN shopName VARCHAR(255)');
        if (!uColumns.includes('shopDescription')) missingUColumns.push('ADD COLUMN shopDescription TEXT');
        if (!uColumns.includes('gcashNumber')) missingUColumns.push('ADD COLUMN gcashNumber VARCHAR(255)');
        if (!uColumns.includes('isVerified')) missingUColumns.push('ADD COLUMN isVerified BOOLEAN DEFAULT FALSE');
        if (!uColumns.includes('profileImage')) missingUColumns.push('ADD COLUMN profileImage VARCHAR(255)');

        if (missingUColumns.length > 0) {
            console.log('Adding missing columns to Users...');
            await sequelize.query(`ALTER TABLE Users ${missingUColumns.join(', ')}`);
            console.log('Successfully updated Users table.');
        }

        process.exit(0);
    } catch (error) {
        console.error('Error fixing database:', error);
        process.exit(1);
    }
}

fixDatabase();
