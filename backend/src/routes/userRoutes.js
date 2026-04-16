const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { protect } = require('../middleware/authMiddleware');

router.get('/profile', protect, userController.getProfile);
router.put('/profile', protect, userController.updateProfile);

router.get('/addresses', protect, userController.getAddresses);
router.post('/addresses', protect, userController.createAddress);
router.put('/addresses/:id', protect, userController.updateAddress);
router.delete('/addresses/:id', protect, userController.deleteAddress);
router.patch('/addresses/:id/set-default', protect, userController.setDefaultAddress);
router.patch('/fcm-token', protect, userController.updateFcmToken);
router.put('/change-password', protect, userController.changePassword);
router.get('/stats', protect, userController.getCustomerStats);

// Public route for shop details
router.get('/seller/:id', userController.getSellerInfo);
router.post('/seller/:id/follow', protect, userController.toggleFollow);

module.exports = router;
