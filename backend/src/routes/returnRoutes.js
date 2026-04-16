const express = require('express');
const router = express.Router();
const returnController = require('../controllers/returnController');
const authMiddleware = require('../middleware/authMiddleware');

router.use(authMiddleware(['customer', 'seller', 'admin']));

router.post('/', returnController.createReturnRequest);
router.put('/:id', returnController.updateReturnStatus);
router.get('/', returnController.getReturnRequests);

module.exports = router;
