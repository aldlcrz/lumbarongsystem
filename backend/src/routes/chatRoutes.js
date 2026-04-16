const express = require('express');
const router = express.Router();
const chatController = require('../controllers/chatController');
const auth = require('../middleware/authMiddleware');

// Conversations list (threads)
router.get('/threads', auth.protect, chatController.getConversations);
router.get('/conversations', auth.protect, chatController.getConversations);

// Messages in a specific conversation
router.get('/conversation/:otherUserId', auth.protect, chatController.getConversation);
router.get('/messages/:otherUserId', auth.protect, chatController.getConversation);
router.get('/:otherUserId', auth.protect, chatController.getConversation);
router.delete('/conversation/:otherUserId', auth.protect, chatController.deleteConversation);

// Mark conversation as read
router.put('/read/:otherUserId', auth.protect, chatController.markAsRead);

// Send a message
router.post('/send', auth.protect, chatController.sendMessage);
router.post('/', auth.protect, chatController.sendMessage);

module.exports = router;
