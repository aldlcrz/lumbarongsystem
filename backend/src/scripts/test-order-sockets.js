const io = require('socket.io-client');
const axios = require('axios');
const path = require('path');
const dotenv = require('dotenv');

dotenv.config({ path: path.join(__dirname, '../../.env') });

const API_URL = 'http://localhost:5000/api/v1';
const SOCKET_URL = 'http://localhost:5000';

async function test() {
  console.log('--- Socket Real-Time Verification ---');
  
  // 1. Login as Seller to get token
  let sellerToken;
  try {
    const loginRes = await axios.post(`${API_URL}/auth/login`, {
      email: 'seller@gmail.com',
      password: 'seller123'
    });
    sellerToken = loginRes.data.token;
    const sellerId = loginRes.data.user.id;
    console.log(`Loggged in as Seller: ${sellerId}`);

    // 2. Connect to Socket as Seller
    const socket = io(SOCKET_URL, {
      auth: { token: sellerToken }
    });

    socket.on('connect', () => {
      console.log('Seller socket connected');
    });

    socket.on('stats_update', (data) => {
      console.log('✅ RECEIVED stats_update:', data);
    });

    socket.on('new_order', (order) => {
      console.log('✅ RECEIVED new_order:', order.id);
    });

    // 3. Login as Customer and place order
    console.log('Logging in as Customer...');
    const custRes = await axios.post(`${API_URL}/auth/login`, {
      email: 'customer@gmail.com',
      password: 'customer123'
    });
    const custToken = custRes.data.token;

    // Get a product ID for this seller
    const prodRes = await axios.get(`${API_URL}/products?seller=${sellerId}`);
    let product = prodRes.data[0];
    
    if (!product) {
        console.log('No products found for this seller. Creating a temporary test product...');
        const createProdRes = await axios.post(`${API_URL}/products`, {
            name: 'Verification Barong',
            description: 'A test product for socket verification',
            price: 1500,
            stock: 10,
            categories: ['Barong Tagalog'],
            sizes: ['S', 'M', 'L']
        }, {
            headers: { Authorization: `Bearer ${sellerToken}` }
        });
        product = createProdRes.data;
        console.log(`Created test product: ${product.id}`);
    }

    console.log('Placing test order...');
    await axios.post(`${API_URL}/orders`, {
      items: [{ productId: product.id, quantity: 1, size: 'M' }],
      shippingAddress: {
        recipientName: 'Test Recipient',
        phone: '09123456789',
        houseNo: '123',
        street: 'Main St',
        barangay: 'Brgy 1',
        city: 'Lumban',
        province: 'Laguna',
        postalCode: '4014'
      },
      paymentMethod: 'Cash on Delivery'
    }, {
      headers: { Authorization: `Bearer ${custToken}` }
    });

    console.log('Order placed. Waiting for socket events...');
    
    setTimeout(() => {
      console.log('Test timed out. Check if events were logged above.');
      process.exit(0);
    }, 5000);

  } catch (err) {
    console.error('Test failed:', err.response?.data || err.message);
    process.exit(1);
  }
}

test();
