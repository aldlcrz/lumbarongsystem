const express = require('express');
const {
  getAllProducts,
  getProductById,
  getSellerProducts,
  createProduct,
  updateProduct,
  deleteProduct,
  getSellerStats,
  addReview,
} = require('../controllers/productController');
const router = express.Router();
const { protect, authorize, maybeProtect } = require('../middleware/authMiddleware');
const multer = require('multer');
const path = require('path');
const { ensureUploadDirs, productsUploadDir } = require('../utils/uploadPaths');

// Ensure static-backed upload directories exist
ensureUploadDirs();

// Multer storage configuration to keep file extensions
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, productsUploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  },
});

const upload = multer({ storage: storage });

router.get('/', getAllProducts);
router.get('/seller', protect, authorize('seller', 'admin'), getSellerProducts);
router.get('/seller-stats', protect, authorize('seller', 'admin'), getSellerStats);
router.get('/stats', protect, authorize('seller', 'admin'), getSellerStats);
router.get('/:id', maybeProtect, getProductById);

router.post('/', protect, authorize('seller'), upload.array('images', 10), createProduct);
router.put('/:id', protect, authorize('seller', 'admin'), upload.array('images', 10), updateProduct);
router.delete('/:id', protect, authorize('seller', 'admin'), deleteProduct);

router.post('/:id/reviews', protect, authorize('customer'), addReview);

module.exports = router;
