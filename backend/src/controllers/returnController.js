const { ReturnRequest, Order, User, Notification } = require('../models');
const { sendNotification } = require('../utils/notificationHelper');

exports.createReturnRequest = async (req, res) => {
  try {
    const { orderId, reason, proofImages } = req.body;
    const userId = req.user.id;

    const order = await Order.findByPk(orderId);
    if (!order) return res.status(404).json({ message: 'Order not found' });
    if (String(order.customerId) !== String(userId)) {
      return res.status(403).json({ message: 'You can only request returns for your own orders' });
    }
    if (order.status !== 'Delivered') {
      return res.status(400).json({ message: 'Only delivered orders can be returned' });
    }

    const returnRequest = await ReturnRequest.create({
      orderId,
      reason,
      proofImages: proofImages || [],
      status: 'Pending'
    });

    // Notify seller
    await sendNotification(
      order.sellerId,
      'New Return Request',
      `A customer has requested a return for order #${orderId.substring(0, 8)}`,
      'order',
      '/seller/orders'
    );

    res.status(201).json(returnRequest);
  } catch (error) {
    console.error('Create Return Error:', error);
    res.status(500).json({ message: 'Error creating return request' });
  }
};

exports.updateReturnStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, adminComment } = req.body;
    const userId = req.user.id;

    const returnRequest = await ReturnRequest.findByPk(id, {
      include: [{ model: Order, as: 'Order' }]
    });

    if (!returnRequest) return res.status(404).json({ message: 'Return request not found' });

    // Check permissions (Seller or Admin)
    const order = returnRequest.Order;
    if (req.user.role === 'seller' && String(order.sellerId) !== String(userId)) {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    returnRequest.status = status;
    if (adminComment) returnRequest.adminComment = adminComment;
    await returnRequest.save();

    // Notify customer
    await sendNotification(
      order.customerId,
      'Return Request Update',
      `Your return request for order #${order.id.substring(0, 8)} has been ${status.toLowerCase()}`,
      'order',
      '/orders'
    );

    res.status(200).json(returnRequest);
  } catch (error) {
    console.error('Update Return Error:', error);
    res.status(500).json({ message: 'Error updating return status' });
  }
};

exports.getReturnRequests = async (req, res) => {
    try {
        const userId = req.user.id;
        let where = {};
        
        if (req.user.role === 'customer') {
            const orders = await Order.findAll({ where: { customerId: userId }, attributes: ['id'] });
            where.orderId = { [Op.in]: orders.map(o => o.id) };
        } else if (req.user.role === 'seller') {
            const orders = await Order.findAll({ where: { sellerId: userId }, attributes: ['id'] });
            where.orderId = { [Op.in]: orders.map(o => o.id) };
        }

        const requests = await ReturnRequest.findAll({
            where,
            include: [{ model: Order, as: 'Order' }],
            order: [['createdAt', 'DESC']]
        });

        res.json(requests);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
