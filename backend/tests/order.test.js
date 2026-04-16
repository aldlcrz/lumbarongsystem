const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const request = require('supertest');
const express = require('express');
const bodyParser = require('body-parser');
const orderRoutes = require('../src/routes/orderRoutes');
const { User, Product, Order, OrderItem, Notification, Address, Wishlist, ReturnRequest } = require('../src/models');
const sequelize = require('../src/config/db');
const jwt = require('jsonwebtoken');

const TEST_SECRET = process.env.JWT_SECRET || 'lumbarong_secret_key_2026';

const app = express();
app.use(bodyParser.json());
app.use('/api/orders', orderRoutes);

describe('Order System API', () => {
    let customerToken, sellerToken, productId;
    const validShippingAddress = {
        recipientName: 'Juan Dela Cruz',
        phone: '09123456789',
        houseNo: '123',
        street: 'Test Street',
        barangay: 'Poblacion',
        city: 'Lumban',
        province: 'Laguna',
        postalCode: '4014',
    };

    beforeAll(async () => {
        await sequelize.authenticate();
        await sequelize.query('SET FOREIGN_KEY_CHECKS = 0');
        await sequelize.sync({ force: true });
        await sequelize.query('SET FOREIGN_KEY_CHECKS = 1');

        const customer = await User.create({
            name: 'Test Customer',
            email: 'customer@test.com',
            password: 'password123',
            role: 'customer'
        });
        customerToken = jwt.sign({ id: customer.id, role: 'customer' }, TEST_SECRET);

        const seller = await User.create({
            name: 'Test Seller',
            email: 'seller@test.com',
            password: 'password123',
            role: 'seller'
        });
        sellerToken = jwt.sign({ id: seller.id, role: 'seller' }, TEST_SECRET);

        const product = await Product.create({
            name: 'Test Barong',
            description: 'Beautiful Barong',
            price: 5000,
            stock: 10,
            sellerId: seller.id,
            category: 'Barong Tagalog'
        });
        productId = product.id;
    });

    afterAll(async () => {
        await sequelize.query('SET FOREIGN_KEY_CHECKS = 0');
        await sequelize.drop();
        await sequelize.query('SET FOREIGN_KEY_CHECKS = 1');
        await sequelize.close();
    });

    it('should create an order as customer', async () => {
        const res = await request(app)
            .post('/api/orders')
            .set('Authorization', `Bearer ${customerToken}`)
            .send({
                items: [{ product: productId, quantity: 2, price: 5000 }],
                paymentMethod: 'GCash',
                paymentReference: '12345678',
                shippingAddress: validShippingAddress,
            });

        expect(res.statusCode).toEqual(201);
        expect(res.body).toHaveProperty('id');

        const product = await Product.findByPk(productId);
        expect(product.stock).toBe(8);
    });

    it('should reject orders with invalid shipping names', async () => {
        const res = await request(app)
            .post('/api/orders')
            .set('Authorization', `Bearer ${customerToken}`)
            .send({
                items: [{ product: productId, quantity: 1, price: 5000 }],
                paymentMethod: 'GCash',
                paymentReference: '12345678',
                shippingAddress: {
                    ...validShippingAddress,
                    recipientName: 'Juan 123',
                },
            });

        expect(res.statusCode).toEqual(400);
        expect(res.body.message).toMatch(/letters/i);
    });

    it('should get orders for customer', async () => {
        const res = await request(app)
            .get('/api/orders/my-orders')
            .set('Authorization', `Bearer ${customerToken}`);

        expect(res.statusCode).toEqual(200);
        expect(Array.isArray(res.body)).toBeTruthy();
        expect(res.body.length).toBeGreaterThan(0);
    });

    it('should get orders for seller if it contains their product', async () => {
        const res = await request(app)
            .get('/api/orders/seller-orders')
            .set('Authorization', `Bearer ${sellerToken}`);

        expect(res.statusCode).toEqual(200);
        expect(Array.isArray(res.body)).toBeTruthy();
    });
});
