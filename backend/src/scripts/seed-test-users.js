const bcrypt = require('bcryptjs');
const { User, sequelize } = require('../models');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../../.env') });

async function seed() {
  try {
    await sequelize.authenticate();
    console.log('Database connected.');

    const password = await bcrypt.hash('admin123', 10);
    const sellerPassword = await bcrypt.hash('seller123', 10);
    const customerPassword = await bcrypt.hash('customer123', 10);

    // Create Admin
    const [admin, adminCreated] = await User.findOrCreate({
      where: { email: 'admin@gmail.com' },
      defaults: {
        name: 'Super Admin',
        password,
        role: 'admin',
        isVerified: true,
        status: 'active'
      }
    });
    if (adminCreated) console.log('Admin created.');

    // Create Seller
    const [seller, sellerCreated] = await User.findOrCreate({
      where: { email: 'seller@gmail.com' },
      defaults: {
        name: 'Heritage Workshop',
        password: sellerPassword,
        role: 'seller',
        isVerified: true,
        status: 'active',
        mobileNumber: '09123456789',
        gcashNumber: '09123456789',
        isAdult: true
      }
    });
    if (sellerCreated) console.log('Seller created.');

    // Create Customer
    const [customer, customerCreated] = await User.findOrCreate({
      where: { email: 'customer@gmail.com' },
      defaults: {
        name: 'Juan Dela Cruz',
        password: customerPassword,
        role: 'customer',
        status: 'active'
      }
    });
    if (customerCreated) console.log('Customer created.');

    console.log('Seeding completed.');
    process.exit(0);
  } catch (error) {
    console.error('Seeding failed:', error);
    process.exit(1);
  }
}

seed();
