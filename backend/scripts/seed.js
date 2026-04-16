const bcrypt = require('bcryptjs');
const sequelize = require('../src/config/db');
const { User, Category, Product } = require('../src/models');

const seedData = async () => {
    try {
        await sequelize.authenticate();
        console.log('Connected to MySQL via Sequelize for seeding...');

        // Force sync to clear and recreate tables
        await sequelize.query('SET FOREIGN_KEY_CHECKS = 0');
        await sequelize.sync({ force: true });
        await sequelize.query('SET FOREIGN_KEY_CHECKS = 1');
        console.log('Database tables recreated.');

        // Hash passwords
        const salt = await bcrypt.genSalt(10);
        const sellerPassword = await bcrypt.hash('seller123', salt);
        const adminPassword = await bcrypt.hash('admin123', salt);
        const customerPassword = await bcrypt.hash('customer123', salt);
        const customPassword = await bcrypt.hash('password123', salt);

        // 1. Create Categories
        await Category.bulkCreate([
            { name: 'Formal', description: 'Traditional Barong Tagalog for weddings and formal events' },
            { name: 'Casual', description: 'Lightweight Barongs for semi-formal daily wear' },
            { name: 'Traditional', description: 'Classic designs with heritage patterns' },
            { name: 'Modern Elite', description: 'Contemporary cuts with artisan embroidery' },
            { name: 'Barong Tagalog', description: 'Authentic Barong Tagalog' },
            { name: 'Filipiniana Dresses', description: 'Traditional and Modern Filipiniana' },
            { name: 'Accessories', description: 'Local artisan accessories' }
        ]);

        // 2. Create Users
        const admin = await User.create({
            name: 'Root Admin',
            email: 'admin@lumbarong.com',
            password: adminPassword,
            role: 'admin',
            isVerified: true
        });

        const seller = await User.create({
            name: 'Jose Artisan Shop',
            email: 'seller@lumbarong.com',
            password: sellerPassword,
            role: 'seller',
            shopName: 'Heritage Embroideries',
            shopDescription: 'Exquisite hand-embroidered Barongs from Lumban, Laguna.',
            gcashNumber: '0917-123-4567',
            isVerified: true
        });

        const customer = await User.create({
            name: 'Juan Dela Cruz',
            email: 'customer@lumbarong.com',
            password: customerPassword,
            role: 'customer',
            isVerified: true
        });

        const aiLod = await User.create({
            name: 'Ailod',
            email: 'ailodleacruz@gmail.com',
            password: customPassword,
            role: 'customer',
            isVerified: true
        });

        // Pending Seller (for admin approval tests)
        const pendingSeller = await User.create({
            name: 'Mateo Dela Cruz',
            email: 'mateo@lumban.ph',
            password: customPassword,
            role: 'seller',
            isVerified: false,
            shopName: 'Dela Cruz Barong Heritage',
            shopDescription: 'Master weavers since 1950.'
        });

        // 3. Create Products for 'seller'
        const product1 = await Product.create({
            name: 'Classic Piña Barong',
            description: 'Authentic Piña fabric with intricate hand embroidery.',
            price: 8500,
            stock: 5,
            category: 'Barong Tagalog',
            sellerId: seller.id,
            status: 'approved',
            image: [
                'https://images.unsplash.com/photo-1544441893-675973e31985?auto=format&fit=crop&w=800&q=80',
                'https://images.unsplash.com/photo-1507679799987-c73779587ccf?auto=format&fit=crop&w=800&q=80',
                'https://images.unsplash.com/photo-1519222970733-f546218fa6d7?auto=format&fit=crop&w=800&q=80'
            ],
            sizes: ['M', 'L', 'XL']
        });

        const product2 = await Product.create({
            name: 'Modern Filipiniana Gown',
            description: 'Traditional silhouette with modern floral motifs.',
            price: 12000,
            stock: 3,
            category: 'Filipiniana Dresses',
            sellerId: seller.id,
            status: 'approved',
            image: ['https://images.unsplash.com/photo-1595777457583-95e059eb59c0?auto=format&fit=crop&w=500&q=60'],
            sizes: ['S', 'M']
        });

        const pendingProduct = await Product.create({
            name: 'Executive Semi-Calado Barong',
            description: 'A premium hand-embroidered piece pending approval.',
            price: 12500,
            stock: 3,
            category: 'Barong Tagalog',
            sellerId: seller.id,
            status: 'pending'
        });

        console.log('✅ Data seeded successfully!');
        console.log('\n--- Login Credentials ---');
        console.log('Admin:    admin@lumbarong.com      / admin123');
        console.log('Seller:   seller@lumbarong.com     / seller123');
        console.log('Customer: customer@lumbarong.com   / customer123');
        console.log('Custom:   ailodleacruz@gmail.com   / password123');
        process.exit();
    } catch (error) {
        console.error('❌ Error seeding data:', error);
        process.exit(1);
    }
};

seedData();
