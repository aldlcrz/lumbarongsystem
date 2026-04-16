const express = require('express');
const router = express.Router();
const addressController = require('../controllers/addressController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);

router.route('/')
  .get(addressController.getAddresses)
  .post(addressController.createAddress);

router.route('/:id')
  .put(addressController.updateAddress)
  .delete(addressController.deleteAddress);

router.patch('/:id/set-default', addressController.setDefaultAddress);

module.exports = router;
