const { Sequelize } = require('sequelize');
const path = require('path');
const dbPath = path.resolve('database.sqlite'); // Let me check if it's database.sqlite or sqlite.db
require('dotenv').config();

const dbUrl = process.env.DATABASE_URL || 'sqlite:./database.sqlite';

const sequelize = new Sequelize(dbUrl, {
  dialect: 'sqlite',
  logging: false
});

async function run() {
  try {
    await sequelize.query("UPDATE Users SET isVerified = true WHERE email = 'seller@gmail.com'");
    console.log('Successfully set seller@gmail.com isVerified to true!');
  } catch (err) {
    console.error('Error updating:', err);
  } finally {
    await sequelize.close();
  }
}

run();
