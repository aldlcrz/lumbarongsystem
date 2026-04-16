const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const http = require('http');
const path = require('path');
const fs = require('fs');
const { Server } = require('socket.io');
const dotenv = require('dotenv');
const { configureSocketServer } = require('./utils/socketUtility');
const { ensureUploadDirs } = require('./utils/uploadPaths');

dotenv.config();

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
  },
});

// Middleware
app.use(helmet({ 
  contentSecurityPolicy: false,
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));
const allowedOrigins = new Set([
  'http://localhost:3000',
  'http://localhost:3001',
  'http://127.0.0.1:3000',
  'http://127.0.0.1:3001',
  'http://localhost:5000',
  'http://127.0.0.1:5000',
  'http://localhost',
  'capacitor://localhost',
]);

function isAllowedOrigin(origin) {
  if (!origin) return true;
  if (allowedOrigins.has(origin)) return true;

  try {
    const parsed = new URL(origin);
    // Flutter web dev servers run on random localhost ports.
    if (parsed.protocol === 'http:' || parsed.protocol === 'https:') {
      return parsed.hostname === 'localhost' || parsed.hostname === '127.0.0.1';
    }
  } catch (_) {
    return false;
  }

  return false;
}

app.use(cors({
  origin: function (origin, callback) {
    if (isAllowedOrigin(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-auth-token']
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
ensureUploadDirs();

// Resolve product images across new + legacy folders.
app.get('/uploads/products/:fileName', (req, res) => {
  const fileName = path.basename(req.params.fileName);
  const searchDirs = [
    path.join(__dirname, '../uploads/products'),
    path.join(__dirname, '../public/uploads/products'),
    path.join(__dirname, '../public/uploads'),
  ];
  const candidates = searchDirs.map((dir) => path.join(dir, fileName));

  const found = candidates.find((p) => fs.existsSync(p));
  if (found) {
    return res.sendFile(found);
  }

  const imagePattern = /\.(jpg|jpeg|png|webp|gif|jfif)$/i;
  for (const dir of searchDirs) {
    if (!fs.existsSync(dir)) continue;
    const fallback = fs
      .readdirSync(dir)
      .find((name) => imagePattern.test(name));

    if (fallback) {
      return res.sendFile(path.join(dir, fallback));
    }
  }

  return res.status(404).json({ message: 'Image not found' });
});

app.use('/uploads', express.static(path.join(__dirname, '../uploads')));
app.use('/uploads', express.static(path.join(__dirname, '../public/uploads')));

// Socket.IO state inject
const socketUtility = require('./utils/socketUtility');
socketUtility.init(io);
app.set('io', io);
configureSocketServer(io);

// Basic route
app.get('/api/v1/health', (req, res) => {
  res.status(200).json({ status: 'OK', timestamp: new Date() });
});

// Routes
const authRoutes = require('./routes/authRoutes');
const productRoutes = require('./routes/productRoutes');
const orderRoutes = require('./routes/orderRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const chatRoutes = require('./routes/chatRoutes');
const adminRoutes = require('./routes/adminRoutes');
const categoryRoutes = require('./routes/categoryRoutes');
const addressRoutes = require('./routes/addressRoutes');
const returnRoutes = require('./routes/returnRoutes');
const userRoutes = require('./routes/userRoutes');
const uploadRoutes = require('./routes/uploadRoutes');
const reviewRoutes = require('./routes/reviewRoutes');

app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/products', productRoutes);
app.use('/api/v1/orders', orderRoutes);
app.use('/api/v1/notifications', notificationRoutes);
app.use('/api/v1/chat', chatRoutes);
app.use('/api/v1/admin', adminRoutes);
app.use('/api/v1/categories', categoryRoutes);
app.use('/api/v1/addresses', addressRoutes);
app.use('/api/v1/returns', returnRoutes);
app.use('/api/v1/users', userRoutes);
app.use('/api/v1/upload', uploadRoutes);
app.use('/api/v1/reviews', reviewRoutes);

// Global Error Handler
const errorHandler = require('./middleware/errorHandler');
app.use(errorHandler);

module.exports = { app, server };
