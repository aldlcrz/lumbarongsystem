const axios = require('axios');
const io = require('socket.io-client');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../../.env') });

const API_URL = 'http://localhost:5000/api/v1';
const SOCKET_URL = 'http://localhost:5000';

async function verifyHighPrecision() {
    console.log('--- High-Precision Analytics Verification ---');
    
    // 1. Setup Test Accounts (Seller & Customer)
    const sellerCredentials = { email: 'seller@gmail.com', password: 'seller123' };
    const customerCredentials = { email: 'customer@gmail.com', password: 'customer123' };

    console.log('Logging in as Seller...');
    const sellRes = await axios.post(`${API_URL}/auth/login`, sellerCredentials);
    const sellerToken = sellRes.data.token;
    const sellerId = sellRes.data.user.id;
    console.log(`Seller ID: ${sellerId}`);

    console.log('Logging in as Customer...');
    const custRes = await axios.post(`${API_URL}/auth/login`, customerCredentials);
    const customerToken = custRes.data.token;
    const customerId = custRes.data.user.id;
    console.log(`Customer ID: ${customerId}`);

    // 2. Establish Socket Connection as Seller
    const socket = io(SOCKET_URL);
    let statsUpdateCount = 0;
    let newOrderCount = 0;

    socket.on('connect', () => {
        console.log('Seller socket connected');
        socket.emit('join_room', `user_${sellerId}`);
    });

    socket.on('stats_update', (data) => {
        console.log('✅ RECEIVED stats_update:', data);
        statsUpdateCount++;
    });

    socket.on('new_order', (data) => {
        console.log('✅ RECEIVED new_order event');
        newOrderCount++;
    });

    // 3. Get a product for this seller
    const prodRes = await axios.get(`${API_URL}/products?seller=${sellerId}`);
    const product = prodRes.data[0];
    if (!product) {
        console.error('No products found for this seller to test.');
        process.exit(1);
    }
    console.log(`Testing with Product: ${product.name} (${product.id})`);

    // 4. ACTION: View Product (Multiple Times)
    console.log('Simulating 3 views from the SAME customer...');
    for (let i = 0; i < 3; i++) {
        await axios.get(`${API_URL}/products/${product.id}`, {
            headers: { Authorization: `Bearer ${customerToken}` }
        });
        await new Promise(r => setTimeout(r, 500));
    }

    // 5. ACTION: Place Order
    console.log('Placing a test order...');
    await axios.post(`${API_URL}/orders`, {
        sellerId: sellerId,
        items: [{
            product: product.id,
            quantity: 1,
            price: product.price,
            name: product.name,
            size: 'M'
        }],
        totalAmount: product.price,
        shippingAddress: { city: 'Manila', province: 'Metro Manila', recipientName: 'Test Recipient', phone: '09123456789' },
        paymentMethod: 'GCash',
        paymentReference: '12345678901'
    }, {
        headers: { Authorization: `Bearer ${customerToken}` }
    });

    await new Promise(r => setTimeout(r, 2000));

    // 6. Verify range-bound stats (Funnel)
    console.log('Verifying range-bound funnel stats...');
    const statsRes = await axios.get(`${API_URL}/products/seller-stats?range=today`, {
        headers: { Authorization: `Bearer ${sellerToken}` }
    });
    
    const funnel = statsRes.data.funnel;
    console.log('Funnel Results:', funnel);

    console.log('--- Final Check ---');
    if (funnel.visitors === 1 && funnel.views >= 3) {
        console.log('✅ SUCCESS: Unique Visitor tracking works (1 visitor for 3 views)');
    } else {
        console.warn('⚠️ WARNING: Funnel visitors/views mismatch. Check DB logs.');
        console.log(`Expected Visitors: 1, Got: ${funnel.visitors}`);
        console.log(`Expected Views: >=3, Got: ${funnel.views}`);
    }

    if (statsUpdateCount > 0 && newOrderCount > 0) {
        console.log('✅ SUCCESS: Real-time socket synchronization works.');
    } else {
        console.warn('⚠️ WARNING: No socket events received. Check socket initialization.');
    }

    socket.disconnect();
    process.exit(0);
}

verifyHighPrecision().catch(err => {
    console.error('Verification failed:', err.response?.data || err.message);
    process.exit(1);
});
