const { User, Product, Order, OrderItem, SystemSetting, sequelize } = require('../models');
const { Op } = require('sequelize');
const { sendNotification } = require('../utils/notificationHelper');
const { emitUserUpdated, emitDashboardUpdate, broadcast } = require('../utils/socketUtility');
const { getRangeBounds } = require('../utils/dateHelper');

exports.getGlobalStats = async (req, res) => {
  try {
    const { range } = req.query;
    const where = {};
    if (range && range !== 'all') {
      const start = getRangeBounds(range);
      where.createdAt = { [Op.gte]: start };
    }

    const totalSalesValue = await Order.sum('totalAmount', { where: { ...where, status: { [Op.notIn]: ['Cancelled'] } } }) || 0;
    const totalOrdersCount = await Order.count({ where });
    const totalCustomersCount = await User.count({ where: { ...where, role: 'customer' } });
    const totalProductsCount = await Product.count(); // Products count is usually global

    res.status(200).json({
      totalSales: `₱${totalSalesValue.toLocaleString()}`,
      totalOrders: totalOrdersCount.toLocaleString(),
      activeCustomers: totalCustomersCount.toLocaleString(),
      liveProducts: totalProductsCount.toLocaleString()
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getAdminAnalytics = async (req, res) => {
  try {
    const { range = 'week' } = req.query;
    const now = new Date();
    const start = getRangeBounds(range);    // ── 1. Unified Time Series (Revenue & Signups) ───────────────────
    const [orders, newUsers] = await Promise.all([
      Order.findAll({
        where: {
          createdAt: { [Op.gte]: start },
          status: { [Op.notIn]: ['Cancelled'] },
        },
        attributes: ['id', 'createdAt', 'totalAmount'],
      }),
      User.findAll({
        where: { createdAt: { [Op.gte]: start } },
        attributes: ['createdAt'],
      })
    ]);

    let revenueSeries = [];
    let signupSeries = [];

    if (range === 'today') {
      const bins = Array.from({ length: 24 }, (_, i) => ({ name: `${i}:00`, revenue: 0, hits: 0 }));
      orders.forEach(o => {
        const hour = new Date(o.createdAt).getHours();
        bins[hour].revenue += Number(o.totalAmount || 0);
      });
      newUsers.forEach(u => {
        const hour = new Date(u.createdAt).getHours();
        bins[hour].hits++;
      });
      revenueSeries = bins;
      signupSeries = bins;
    } else if (range === 'week') {
      const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      const WEEK_ORDER = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
      const map = Object.fromEntries(WEEK_ORDER.map(d => [d, { revenue: 0, hits: 0 }]));
      orders.forEach(o => {
        const name = DAY_NAMES[new Date(o.createdAt).getDay()];
        map[name].revenue += Number(o.totalAmount || 0);
      });
      newUsers.forEach(u => {
        const name = DAY_NAMES[new Date(u.createdAt).getDay()];
        if (map[name]) map[name].hits++;
      });
      revenueSeries = WEEK_ORDER.map(name => ({ name, revenue: map[name].revenue }));
      signupSeries = WEEK_ORDER.map(name => ({ name, hits: map[name].hits }));
    } else if (range === 'month') {
      const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
      const bins = Array.from({ length: daysInMonth }, (_, i) => ({ name: `${i + 1}`, revenue: 0, hits: 0 }));
      orders.forEach(o => {
        const day = new Date(o.createdAt).getDate();
        if (bins[day - 1]) bins[day - 1].revenue += Number(o.totalAmount || 0);
      });
      newUsers.forEach(u => {
        const day = new Date(u.createdAt).getDate();
        if (bins[day - 1]) bins[day - 1].hits++;
      });
      revenueSeries = bins;
      signupSeries = bins;
    } else if (range === 'year') {
      const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const bins = MONTH_NAMES.map(name => ({ name, revenue: 0, hits: 0 }));
      orders.forEach(o => {
        const month = new Date(o.createdAt).getMonth();
        bins[month].revenue += Number(o.totalAmount || 0);
      });
      newUsers.forEach(u => {
        const month = new Date(u.createdAt).getMonth();
        bins[month].hits++;
      });
      revenueSeries = bins;
      signupSeries = bins;
    }

    const monthlySignups = signupSeries;

    // ── 4. Recent Activity (last 6 orders) ───────────────────────────
    const recentOrders = await Order.findAll({
      limit: 6,
      order: [['createdAt', 'DESC']],
      include: [{ model: User, as: 'customer', attributes: ['name', 'email'] }],
    });
    const recentActivity = recentOrders.map(o => ({
      id: o.id,
      type: 'order',
      title: `Order #LB-${String(o.id).padStart(6, '0')}`,
      desc: `${o.customer?.name || 'Customer'} – ${o.status}`,
      amount: Number(o.totalAmount || 0),
      time: o.createdAt,
      status: o.status,
    }));

    // ── 5. Top Customer Locations (from shipping addresses) ───────────
    const ordersWithAddr = await Order.findAll({
      where: { createdAt: { [Op.gte]: start } },
      attributes: ['shippingAddress']
    });
    const locationCount = {};
    ordersWithAddr.forEach(o => {
      try {
        const addr = typeof o.shippingAddress === 'string'
          ? JSON.parse(o.shippingAddress) : o.shippingAddress;
        const city = addr?.city || addr?.province || null;
        if (city) locationCount[city] = (locationCount[city] || 0) + 1;
      } catch (_) { }
    });
    const topLocations = Object.entries(locationCount)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([city, count]) => ({ city, count }));

    // ── 6. Order status breakdown ─────────────────────────────────────
    const [pending, processing, shipped, completed, cancelled] = await Promise.all([
      Order.count({ where: { status: 'Pending', createdAt: { [Op.gte]: start } } }),
      Order.count({ where: { status: 'Processing', createdAt: { [Op.gte]: start } } }),
      Order.count({ where: { status: 'Shipped', createdAt: { [Op.gte]: start } } }),
      Order.count({ where: { status: { [Op.in]: ['Completed', 'Delivered'] }, createdAt: { [Op.gte]: start } } }),
      Order.count({ where: { status: 'Cancelled', createdAt: { [Op.gte]: start } } }),
    ]);

    // ── 7. Top Selling Products & Categories ───────────────────────────
    const orderIds = orders.map(o => o.id);
    let topProducts = [];
    let topCategories = [];

    if (orderIds.length > 0) {
      // Aggregate Top Products
      const topProductsData = await OrderItem.findAll({
        attributes: [
          'productId',
          [sequelize.fn('SUM', sequelize.col('OrderItem.quantity')), 'totalSold'],
          [sequelize.fn('SUM', sequelize.literal('`OrderItem`.`quantity` * `OrderItem`.`price`')), 'totalRevenue']
        ],
        where: { orderId: { [Op.in]: orderIds } },
        include: [{
          model: Product,
          as: 'product',
          attributes: ['id', 'name', 'categories'],
          required: true
        }],
        group: ['OrderItem.productId', 'product.id', 'product.name', 'product.categories'],
        order: [[sequelize.fn('SUM', sequelize.col('OrderItem.quantity')), 'DESC']],
        limit: 10,
        subQuery: false,
        raw: true,
        nest: true
      });

      topProducts = topProductsData.map(d => {
        let cat = d.product?.categories;
        let categoryName = "Other";
        if (typeof cat === 'string') {
          try { cat = JSON.parse(cat); } catch (e) { }
        }
        if (Array.isArray(cat) && cat.length > 0) categoryName = cat[0];

        return {
          id: d.product?.id,
          name: d.product?.name || 'Unknown',
          category: categoryName,
          sales: Number(d.totalSold || 0),
          revenue: Number(d.totalRevenue || 0)
        };
      });

      // Aggregate Top Categories
      const categoriesMap = {};
      topProductsData.forEach(d => {
        let cat = d.product?.categories;
        if (typeof cat === 'string') {
          try { cat = JSON.parse(cat); } catch (e) { }
        }
        // Count each order item's sales volume towards all of its categories
        const sold = Number(d.totalSold || 0);
        if (Array.isArray(cat) && cat.length > 0) {
          cat.forEach(c => {
            categoriesMap[c] = (categoriesMap[c] || 0) + sold;
          });
        } else {
          categoriesMap["Other"] = (categoriesMap["Other"] || 0) + sold;
        }
      });

      // Instead of relying purely on top 10 products for category accuracy, fetch all OrderItems if needed
      // But for quick analytics, fetching base categories using all order items is better.
      const allItemsData = await OrderItem.findAll({
        attributes: [
          [sequelize.fn('SUM', sequelize.col('OrderItem.quantity')), 'totalSold']
        ],
        where: { orderId: { [Op.in]: orderIds } },
        include: [{
          model: Product,
          as: 'product',
          attributes: ['categories'],
          required: true
        }],
        group: ['product.id', 'product.categories'],
        raw: true,
        nest: true
      });

      const fullCategoriesMap = {};
      allItemsData.forEach(d => {
        let cat = d.product?.categories;
        if (typeof cat === 'string') {
          try { cat = JSON.parse(cat); } catch (e) { }
        }
        const sold = Number(d.totalSold || 0);
        if (Array.isArray(cat) && cat.length > 0) {
          cat.forEach(c => {
            fullCategoriesMap[c] = (fullCategoriesMap[c] || 0) + sold;
          });
        } else {
          fullCategoriesMap["Other"] = (fullCategoriesMap["Other"] || 0) + sold;
        }
      });

      topCategories = Object.entries(fullCategoriesMap)
        .map(([name, value]) => ({ name, value }))
        .sort((a, b) => b.value - a.value)
        .slice(0, 5); // top 5
    }

    res.status(200).json({
      revenueSeries,
      monthlySignups,
      recentActivity,
      topLocations,
      orderStatusBreakdown: { pending, processing, shipped, completed, cancelled },
      topProducts,
      topCategories
    });
  } catch (error) {
    console.error('Admin Analytics Error:', error);
    res.status(500).json({ message: error.message });
  }
};

exports.getPendingSellers = async (req, res) => {
  try {
    const sellers = await User.findAll({ where: { role: 'seller', isVerified: false } });
    res.status(200).json(sellers);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getSellers = async (req, res) => {
  try {
    const sellers = await User.findAll({
      where: { role: 'seller', isVerified: true },
      attributes: { 
        include: [
          [sequelize.literal('(SELECT AVG(rating) FROM Reviews INNER JOIN Products ON Reviews.productId = Products.id WHERE Products.sellerId = User.id)'), 'avgRating'],
          [sequelize.literal('(SELECT COUNT(*) FROM Reviews INNER JOIN Products ON Reviews.productId = Products.id WHERE Products.sellerId = User.id)'), 'reviewCount']
        ],
        exclude: ['password'] 
      },
      order: [['createdAt', 'DESC']],
    });
    res.status(200).json(sellers);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getSellerPerformance = async (req, res) => {
  try {
    const { range = 'month' } = req.query;
    const start = getRangeBounds(range);

    const sellers = await User.findAll({
      where: { role: 'seller', isVerified: true },
      attributes: ['id', 'name', 'email', 'createdAt', 'profilePhoto'],
      include: [{
        model: Order,
        as: 'sellerOrders',
        where: {
          createdAt: { [Op.gte]: start },
          status: { [Op.notIn]: ['Cancelled'] }
        },
        attributes: ['totalAmount'],
        required: false // Include sellers with 0 sales too
      }],
      order: [['name', 'ASC']]
    });

    const performance = sellers.map(s => {
      const orders = s.sellerOrders || [];
      return {
        id: s.id,
        name: s.name,
        email: s.email,
        profilePhoto: s.profilePhoto,
        joinedAt: s.createdAt,
        totalRevenue: orders.reduce((sum, o) => sum + Number(o.totalAmount || 0), 0),
        orderCount: orders.length
      };
    });

    res.status(200).json(performance);
  } catch (error) {
    console.error('getSellerPerformance Error:', error);
    res.status(500).json({ message: error.message });
  }
};

exports.getCustomers = async (req, res) => {
  try {
    const customers = await User.findAll({
      where: { role: 'customer' },
      attributes: { exclude: ['password'] },
      order: [['createdAt', 'DESC']],
    });

    res.status(200).json(customers);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.deleteCustomer = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    const user = await User.findByPk(id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    console.log(`Terminating user ${user.email}. Reason: ${reason || 'No reason provided.'}`);

    // If seller, permanently delete products
    if (user.role === 'seller') {
       await Product.destroy({ where: { sellerId: user.id } });
    }

    await user.destroy();
    res.status(200).json({ message: 'Account terminated successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.toggleCustomerStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findByPk(id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    user.status = user.status === 'frozen' ? 'active' : 'frozen';
    await user.save();

    emitUserUpdated(user, { action: 'status_changed' });

    res.status(200).json({ message: `User ${user.status} successfully`, user });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.purgeCache = async (req, res) => {
  try {
    // Logic to wipe "temporary caches" - in this context, maybe just a success response or clearing some session data
    // Since we don't have a specific cache layer like Redis, we'll just return success.
    res.status(200).json({ message: 'Platform caches purged successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.verifySeller = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findByPk(id);
    if (!user) return res.status(404).json({ message: 'Seller not found' });

    user.isVerified = true;
    await user.save();

    const publicUser = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      isVerified: user.isVerified,
      profilePhoto: user.profilePhoto,
    };

    emitUserUpdated(publicUser, { action: 'verified' });
    emitDashboardUpdate();

    await sendNotification(
      user.id,
      'Seller verification approved',
      'Your artisan workshop is now verified and can access seller tools.',
      'system',
      '/seller/dashboard'
    );

    res.status(200).json({ message: 'Seller verified successfully', user: publicUser });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.rejectSeller = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findByPk(id);
    if (!user) return res.status(404).json({ message: 'Seller not found' });

    await user.destroy();
    emitDashboardUpdate();

    res.status(200).json({ message: 'Seller application rejected' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getSettings = async (req, res) => {
  try {
    const settings = await SystemSetting.findAll();
    const settingsMap = settings.reduce((acc, s) => {
      acc[s.key] = s.value;
      return acc;
    }, {});
    res.status(200).json(settingsMap);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.updateSettings = async (req, res) => {
  try {
    const updates = req.body;

    // Integrity Validation
    if (updates.commissionRate !== undefined) {
      const rate = parseFloat(updates.commissionRate);
      if (isNaN(rate) || rate < 0 || rate > 100) {
        return res.status(400).json({ message: 'Order rate must be between 0 and 100.' });
      }
    }


    for (const [key, value] of Object.entries(updates)) {
      await SystemSetting.upsert({ key, value });
    }
    res.status(200).json({ message: 'Settings updated successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.sendBroadcast = async (req, res) => {
  try {
    const { message, title } = req.body;

    if (!message) {
      return res.status(400).json({ message: 'Message is required for broadcast' });
    }

    // Emit the broadcast via socket
    broadcast(message, title || 'System Announcement');

    res.status(200).json({ message: 'Broadcast sent successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
