const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const request = require('supertest');
jest.mock('../src/utils/emailService', () => ({
    sendPasswordResetEmail: jest.fn().mockResolvedValue({ provider: 'test' }),
}));
const emailService = require('../src/utils/emailService');
const { app } = require('../src/app');
const sequelize = require('../src/config/db');
const User = require('../src/models/User');

describe('Auth Endpoints', () => {
    beforeAll(async () => {
        // Use Sequelize (MySQL), NOT Mongoose/MongoDB
        await sequelize.authenticate();
        await sequelize.query('SET FOREIGN_KEY_CHECKS = 0');
        await sequelize.sync({ force: true });
        await sequelize.query('SET FOREIGN_KEY_CHECKS = 1');
    });

    afterAll(async () => {
        await sequelize.query('SET FOREIGN_KEY_CHECKS = 0');
        await sequelize.drop();
        await sequelize.query('SET FOREIGN_KEY_CHECKS = 1');
        await sequelize.close();
    });

    it('should register a new user', async () => {
        const res = await request(app)
            .post('/api/v1/auth/register')
            .send({
                name: 'Test User',
                email: 'test@example.com',
                password: 'password123'
            });
        expect(res.statusCode).toEqual(201);
        expect(res.body.user).toHaveProperty('email', 'test@example.com');
    });

    it('should reject registration names with numbers', async () => {
        const res = await request(app)
            .post('/api/v1/auth/register')
            .send({
                name: 'Test User 123',
                email: 'invalid-name@example.com',
                password: 'password123'
            });
        expect(res.statusCode).toEqual(400);
        expect(res.body.message).toMatch(/letters/i);
    });

    it('should not register user with existing email', async () => {
        const res = await request(app)
            .post('/api/v1/auth/register')
            .send({
                name: 'Test User',
                email: 'test@example.com',
                password: 'password123'
            });
        expect(res.statusCode).toEqual(400);
    });

    it('should login with valid credentials', async () => {
        const res = await request(app)
            .post('/api/v1/auth/login')
            .send({
                email: 'test@example.com',
                password: 'password123'
            });
        expect(res.statusCode).toEqual(200);
        expect(res.body).toHaveProperty('token');
        expect(res.body.user).toHaveProperty('role', 'customer');
    });

    it('should not login with wrong password', async () => {
        const res = await request(app)
            .post('/api/v1/auth/login')
            .send({
                email: 'test@example.com',
                password: 'wrongpassword'
            });
        expect(res.statusCode).toEqual(400);
    });

    it('should create a password reset token and send a reset link', async () => {
        const res = await request(app)
            .post('/api/v1/auth/forgot-password')
            .send({
                email: 'test@example.com'
            });

        expect(res.statusCode).toEqual(200);
        expect(res.body.message).toMatch(/If an account with that email exists/i);
        expect(emailService.sendPasswordResetEmail).toHaveBeenCalledTimes(1);

        const updatedUser = await User.findOne({ where: { email: 'test@example.com' } });
        expect(updatedUser.resetPasswordToken).toBeTruthy();
        expect(updatedUser.resetPasswordExpires).toBeTruthy();
    });

    it('should reset the password using the emailed token', async () => {
        const [{ resetUrl }] = emailService.sendPasswordResetEmail.mock.calls.at(-1);
        const token = new URL(resetUrl).searchParams.get('token');

        const resetResponse = await request(app)
            .post('/api/v1/auth/reset-password')
            .send({
                token,
                password: 'newpassword123'
            });

        expect(resetResponse.statusCode).toEqual(200);

        const updatedUser = await User.findOne({ where: { email: 'test@example.com' } });
        expect(updatedUser.resetPasswordToken).toBeNull();
        expect(updatedUser.resetPasswordExpires).toBeNull();
        expect(updatedUser.passwordChangedAt).toBeTruthy();

        const oldLoginResponse = await request(app)
            .post('/api/v1/auth/login')
            .send({
                email: 'test@example.com',
                password: 'password123'
            });
        expect(oldLoginResponse.statusCode).toEqual(400);

        const newLoginResponse = await request(app)
            .post('/api/v1/auth/login')
            .send({
                email: 'test@example.com',
                password: 'newpassword123'
            });
        expect(newLoginResponse.statusCode).toEqual(200);
        expect(newLoginResponse.body).toHaveProperty('token');
    });
});
