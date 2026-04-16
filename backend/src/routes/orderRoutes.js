const express = require('express');
const { createOrder, getMyOrders, getSellerOrders, updateOrderStatus, cancelOrder, exportSellerReport } = require('../controllers/orderController');
const router = express.Router();
const { protect, authorize } = require('../middleware/authMiddleware');
const multer = require('multer');
const path = require('path');
const { ensureUploadDirs, paymentsUploadDir } = require('../utils/uploadPaths');

// Ensure static-backed upload directories exist
ensureUploadDirs();

// Multer storage configuration to keep file extensions
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, paymentsUploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'payment-' + uniqueSuffix + path.extname(file.originalname));
  },
});

const upload = multer({ storage: storage });

router.post('/', protect, upload.single('paymentProof'), createOrder);
router.get('/my-orders', protect, getMyOrders);
router.get('/seller', protect, authorize('seller', 'admin'), getSellerOrders);
router.get('/seller-orders', protect, authorize('seller', 'admin'), getSellerOrders);
router.patch('/:id/cancel', protect, cancelOrder);
router.patch('/:id/status', protect, authorize('seller', 'admin'), updateOrderStatus); // Support patch too
router.put('/:id/status', protect, authorize('seller', 'admin'), updateOrderStatus);
router.get('/export-report', protect, authorize('seller', 'admin'), exportSellerReport);

module.exports = router;
