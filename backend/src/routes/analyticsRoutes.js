const express = require('express');
const router = express.Router();
const analyticsController = require('../controllers/analyticsController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.get('/seller', protect, authorize('seller', 'admin'), analyticsController.getSellerAnalytics);
router.get('/export', protect, authorize('seller', 'admin'), analyticsController.exportSellerAnalytics);

module.exports = router;
