const Notification = require('../models/Notification');
const User = require('../models/User');
const socketUtility = require('./socketUtility');
const pushHelper = require('./pushHelper');

const sendNotification = async (userId, title, message, type = 'system', link = null, targetRole = 'customer') => {
    try {
        const resolvedTitle = title || 'Notification';
        const resolvedMessage = message || title || '';
        const notification = await Notification.create({
            userId,
            title: resolvedTitle,
            message: resolvedMessage,
            type,
            link,
            read: false,
            targetRole,
        });

        // Real-time emission using centralized utility
        socketUtility.emitToUser(userId, 'new_notification', notification);
        socketUtility.emitToUser(userId, 'notification_count_update', { userId });

        // Native Push Notification
        const user = await User.findByPk(userId);
        if (user && user.fcmToken) {
            pushHelper.sendPush(user.fcmToken, resolvedTitle, resolvedMessage, { type, link });
        }

        console.log(`Notification sent to ${userId}: ${resolvedTitle}`);
        return notification;
    } catch (error) {
        console.error('Error sending notification:', error);
        return null;
    }
};

module.exports = { sendNotification };
