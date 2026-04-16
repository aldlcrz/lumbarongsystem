const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.get('/stats', protect, authorize('admin'), adminController.getGlobalStats);
router.get('/analytics', protect, authorize('admin'), adminController.getAdminAnalytics);
router.get('/pending-sellers', protect, authorize('admin'), adminController.getPendingSellers);
router.get('/customers', protect, authorize('admin'), adminController.getCustomers);
router.delete('/customers/:id', protect, authorize('admin'), adminController.deleteCustomer);
router.put('/customers/:id/toggle-status', protect, authorize('admin'), adminController.toggleCustomerStatus);
router.get('/sellers', protect, authorize('admin'), adminController.getSellers);
router.delete('/sellers/:id', protect, authorize('admin'), adminController.deleteCustomer);
router.put('/sellers/:id/toggle-status', protect, authorize('admin'), adminController.toggleCustomerStatus);
router.put('/verify-seller/:id', protect, authorize('admin'), adminController.verifySeller);
router.put('/reject-seller/:id', protect, authorize('admin'), adminController.rejectSeller);
router.get('/seller-performance', protect, authorize('admin'), adminController.getSellerPerformance);

// System Settings
router.get('/settings', protect, authorize('admin'), adminController.getSettings);
router.put('/settings', protect, authorize('admin'), adminController.updateSettings);
router.post('/purge-cache', protect, authorize('admin'), adminController.purgeCache);
router.post('/broadcast', protect, authorize('admin'), adminController.sendBroadcast);

module.exports = router;
