const express = require('express');
const { register, login, forgotPassword, resetPassword, getProfile } = require('../controllers/authController');
const upload = require('../middleware/uploadMiddleware');
const router = express.Router();

router.post(
  '/register',
  upload.fields([
    { name: 'indigencyCertificate', maxCount: 1 },
    { name: 'validId', maxCount: 1 },
    { name: 'gcashQrCode', maxCount: 1 },
  ]),
  register
);
router.post('/login', login);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);
// router.get('/profile', verifyToken, getProfile); // placeholder for auth middleware

module.exports = router;
