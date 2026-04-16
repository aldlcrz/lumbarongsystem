const sequelize = require('../src/config/db');
const { User } = require('../src/models');
const { DataTypes } = require('sequelize');

const sync = async () => {
    try {
        await sequelize.authenticate();
        console.log('Connected to DB');
        const queryInterface = sequelize.getQueryInterface();
        const userTable = await queryInterface.describeTable('Users');
        
        if (!userTable.mayaNumber) {
            console.log('Adding mayaNumber column');
            await queryInterface.addColumn('Users', 'mayaNumber', { type: DataTypes.STRING, allowNull: true });
        }
        if (!userTable.mayaQrCode) {
            console.log('Adding mayaQrCode column');
            await queryInterface.addColumn('Users', 'mayaQrCode', { type: DataTypes.STRING, allowNull: true });
        }
        console.log('Sync complete');
        process.exit(0);
    } catch (err) {
        console.error('Sync failed', err);
        process.exit(1);
    }
};

sync();
