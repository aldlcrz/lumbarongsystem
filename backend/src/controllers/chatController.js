const { Message, User, Order, OrderItem, Product } = require('../models');
const { Op } = require('sequelize');
const socketUtility = require('../utils/socketUtility');

// Send message
exports.sendMessage = async (req, res) => {
    try {
        const { receiverId, content } = req.body;
        const senderId = req.user.id || req.user.userId;

        if (!receiverId || !content) {
            console.error('Missing receiverId or content in chat/send', { receiverId, content, reqBody: req.body });
            return res.status(400).json({ message: 'Receiver and content are required', received: { receiverId, content } });
        }

        const message = await Message.create({
            senderId,
            receiverId,
            content
        });

        const populatedMessage = await Message.findByPk(message.id, {
            include: [{ model: User, as: 'sender', attributes: ['id', 'name', 'role', 'profilePhoto'] }]
        });

        // REAL-TIME: Notify Stakeholders
        socketUtility.emitToUser(receiverId, 'receive_message', populatedMessage);
        socketUtility.emitToUser(senderId, 'receive_message', populatedMessage);

        res.status(201).json(populatedMessage);
    } catch (error) {
        console.error('Chat Error:', error);
        res.status(500).json({ message: 'Error sending message' });
    }
};

// Get conversation with a specific user
exports.getConversation = async (req, res) => {
    try {
        const userId = req.user.id || req.user.userId;
        const { otherUserId } = req.params;

        const messages = await Message.findAll({
            where: {
                [Op.or]: [
                    { senderId: userId, receiverId: otherUserId },
                    { senderId: otherUserId, receiverId: userId }
                ]
            },
            order: [['createdAt', 'ASC']],
            include: [
                { model: User, as: 'sender', attributes: ['id', 'name', 'profilePhoto', 'role'] },
                { model: User, as: 'receiver', attributes: ['id', 'name', 'profilePhoto', 'role'] }
            ]
        });

        // Mark as read
        await Message.update(
            { read: true },
            {
                where: {
                    senderId: otherUserId,
                    receiverId: userId,
                    read: false
                }
            }
        );

        res.json(messages);
    } catch (error) {
        console.error('Fetch Conversation Error:', error);
        res.status(500).json({ message: 'Error fetching messages' });
    }
};

// Get all recent conversations for the logged-in user
exports.getConversations = async (req, res) => {
    try {
        const userId = req.user.id || req.user.userId;

        const messages = await Message.findAll({
            where: {
                [Op.or]: [{ senderId: userId }, { receiverId: userId }]
            },
            order: [['createdAt', 'DESC']]
        });

        const chattedUserIds = new Set();
        messages.forEach(msg => {
            if (msg.senderId !== userId) chattedUserIds.add(msg.senderId);
            if (msg.receiverId !== userId) chattedUserIds.add(msg.receiverId);
        });

        // Get customer IDs who have placed orders with this seller (if user is seller)
        let customerIdsWithOrders = new Set();
        const user = await User.findByPk(userId);
        if (user && user.role === 'seller') {
            const ordersBySeller = await Order.findAll({
                include: [{
                    model: OrderItem,
                    as: 'items',
                    required: true,
                    include: [{
                        model: Product,
                        as: 'product',
                        where: { sellerId: userId },
                        required: true
                    }]
                }],
                attributes: ['customerId']
            });
            customerIdsWithOrders = new Set(ordersBySeller.map(o => o.customerId));
        }

        const conversations = await Promise.all(Array.from(chattedUserIds).map(async (otherId) => {
            const lastMessage = await Message.findOne({
                where: {
                    [Op.or]: [
                        { senderId: userId, receiverId: otherId },
                        { senderId: otherId, receiverId: userId }
                    ]
                },
                order: [['createdAt', 'DESC']],
                include: [
                    { model: User, as: 'sender', attributes: ['id', 'name', 'profilePhoto', 'role'] },
                    { model: User, as: 'receiver', attributes: ['id', 'name', 'profilePhoto', 'role'] }
                ]
            });

            const unreadCount = await Message.count({
                where: {
                    senderId: otherId,
                    receiverId: userId,
                    read: false
                }
            });

            const msgObj = lastMessage ? lastMessage.toJSON() : null;
            if (!msgObj) return null;

            const isSender = msgObj.senderId === userId;
            const otherUserValues = isSender ? msgObj.receiver : msgObj.sender;
            const otherUserId = isSender ? msgObj.receiverId : msgObj.senderId;

            return {
                otherUser: {
                    id: otherUserId,
                    name: otherUserValues ? otherUserValues.name : null,
                    shopName: otherUserValues ? otherUserValues.name : null,
                    profileImage: otherUserValues ? otherUserValues.profilePhoto : null,
                    role: otherUserValues ? otherUserValues.role : null,
                    hasOrders: customerIdsWithOrders.has(otherUserId)
                },
                lastMessage: msgObj.content,
                timestamp: msgObj.createdAt,
                unreadCount
            };
        }));

        // Filter out any potential nulls from deleted data
        const filteredConversations = conversations.filter(c => c !== null);

        res.json(filteredConversations.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)));
    } catch (error) {
        console.error('Fetch Conversations Error:', error);
        res.status(500).json({ message: 'Error fetching conversations', error: error.message });
    }
};

// Manually mark conversation as read
exports.markAsRead = async (req, res) => {
    try {
        const userId = req.user.id || req.user.userId;
        const { otherUserId } = req.params;

        await Message.update(
            { read: true },
            {
                where: {
                    senderId: otherUserId,
                    receiverId: userId,
                    read: false
                }
            }
        );

        res.json({ message: 'Marked as read' });
    } catch (error) {
        console.error('Mark Read Error:', error);
        res.status(500).json({ message: 'Error marking messages as read' });
    }
};

// Delete an entire conversation with a user
exports.deleteConversation = async (req, res) => {
    try {
        const userId = req.user.id || req.user.userId;
        const { otherUserId } = req.params;

        await Message.destroy({
            where: {
                [Op.or]: [
                    { senderId: userId, receiverId: otherUserId },
                    { senderId: otherUserId, receiverId: userId }
                ]
            }
        });

        res.json({ message: 'Conversation deleted successfully' });
    } catch (error) {
        console.error('Delete Conversation Error:', error);
        res.status(500).json({ message: 'Error deleting conversation' });
    }
};
