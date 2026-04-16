require('dotenv').config();
const sequelize = require('../src/config/db');

async function run() {
  try {
    await sequelize.authenticate();
    await sequelize.query("UPDATE Users SET isVerified = true WHERE email = 'seller@gmail.com'");
    console.log('Successfully set seller@gmail.com isVerified to true!');
  } catch (err) {
    console.error('Error updating:', err);
  } finally {
    process.exit();
  }
}

run();
