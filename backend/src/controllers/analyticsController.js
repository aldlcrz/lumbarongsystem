const { Order, OrderItem, Product, Message } = require('../models');
const { Op } = require('sequelize');
const ExcelJS = require('exceljs');

exports.getSellerAnalytics = async (req, res) => {
    try {
        const { startDate, endDate } = req.query;
        const sellerId = req.user.id || req.user.userId;

        console.log(`>>> [Analytics] Fetching for Seller: ${sellerId}, Range: ${startDate} to ${endDate}`);

        if (!sellerId) {
            console.error('Analytics Error: No sellerId found in request user object', { user: req.user });
            return res.status(401).json({ message: 'User ID missing from token' });
        }

        // Build date filter
        const dateFilter = {};
        if (startDate && endDate) {
            const start = new Date(startDate);
            start.setHours(0, 0, 0, 0);
            const end = new Date(endDate);
            end.setHours(23, 59, 59, 999);
            dateFilter.createdAt = {
                [Op.between]: [start, end]
            };
        }

        // 1. Get all products owned by this seller
        const sellerProducts = await Product.findAll({
            where: { sellerId },
            attributes: ['id', 'name', 'price']
        });
        const productIds = sellerProducts.map(p => p.id);

        if (productIds.length === 0) {
            return res.json({
                revenue: 0,
                totalOrders: 0,
                deliveredOrders: 0,
                inquiryCount: 0,
                bestSellers: [],
                monthlyTrends: [],
                recentActivity: [],
                orderStatusDistribution: {
                    pending: 0,
                    processing: 0,
                    shipped: 0,
                    completed: 0,
                    cancelled: 0
                }
            });
        }

        // 1.5 Get unique inquiries (unique customers messaged)
        const messages = await Message.findAll({
            where: {
                [Op.or]: [
                    { senderId: sellerId },
                    { receiverId: sellerId }
                ]
            },
            attributes: ['senderId', 'receiverId']
        });

        const uniqueInquirers = new Set();
        messages.forEach(msg => {
            if (msg.senderId !== sellerId) uniqueInquirers.add(msg.senderId);
            if (msg.receiverId !== sellerId) uniqueInquirers.add(msg.receiverId);
        });
        const inquiryCount = uniqueInquirers.size;

        // 2. Fetch orders containing these products with date filter
        const orders = await Order.findAll({
            where: {
                ...dateFilter
            },
            include: [
                {
                    model: OrderItem,
                    as: 'items',
                    where: { productId: { [Op.in]: productIds } },
                    include: [{ model: Product, as: 'product', attributes: ['name', 'sellerId'] }]
                }
            ],
            order: [['createdAt', 'DESC']]
        });

        // 3. Process Analytics
        let totalRevenue = 0;
        let deliveredOrdersCount = 0;
        const productStats = {};
        const monthlyData = {};

        orders.forEach(order => {
            const isValidForRevenue = !['Cancelled', 'Cancellation Requested'].includes(order.status);

            order.items.forEach(item => {
                if (item.product && item.product.sellerId === sellerId) {
                    const itemRevenue = item.price * item.quantity;

                    if (isValidForRevenue) {
                        totalRevenue += Number(itemRevenue);
                    }

                    const pid = item.productId;
                    if (!productStats[pid]) {
                        productStats[pid] = { name: item.product.name, qty: 0, revenue: 0 };
                    }
                    productStats[pid].qty += item.quantity;
                    if (isValidForRevenue) {
                        productStats[pid].revenue += Number(itemRevenue);
                    }
                }
            });

            if (order.status === 'Completed' || order.status === 'Delivered') {
                deliveredOrdersCount++;
            }

            // Monthly Trends
            const date = new Date(order.createdAt);
            const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
            if (!monthlyData[monthKey]) {
                monthlyData[monthKey] = { revenue: 0, orders: 0 };
            }
            monthlyData[monthKey].orders++;
            if (isValidForRevenue) {
                let sellerOrderRevenue = 0;
                order.items.forEach(item => {
                    if (item.product && item.product.sellerId === sellerId) {
                        sellerOrderRevenue += Number(item.price * item.quantity);
                    }
                });
                monthlyData[monthKey].revenue += sellerOrderRevenue;
            }
        });

        const bestSellers = Object.values(productStats)
            .sort((a, b) => b.revenue - a.revenue)
            .slice(0, 5);

        const sortedMonths = Object.keys(monthlyData).sort().reverse().slice(0, 6).reverse();
        const monthlyTrends = sortedMonths.map(month => ({
            month,
            revenue: monthlyData[month].revenue,
            orders: monthlyData[month].orders
        }));

        // --- COHORT ANALYSIS (LTV & RETENTION) ---
        const userCohorts = {};
        orders.forEach(o => {
            const isValid = !['Cancelled', 'Cancellation Requested'].includes(o.status);
            if (!isValid || !o.userId) return;
            const d = new Date(o.createdAt);
            const mKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
            if (!userCohorts[o.userId] || userCohorts[o.userId] > mKey) {
                userCohorts[o.userId] = mKey;
            }
        });

        const cohortStats = {};
        orders.forEach(o => {
            const isValid = !['Cancelled', 'Cancellation Requested'].includes(o.status);
            if (!isValid || !o.userId) return;

            const cohortMonth = userCohorts[o.userId];
            if (!cohortMonth) return;

            if (!cohortStats[cohortMonth]) {
                cohortStats[cohortMonth] = { users: new Set(), revenuePerMonth: {}, retainedUsersPerMonth: {} };
            }
            cohortStats[cohortMonth].users.add(o.userId);

            const oDate = new Date(o.createdAt);
            const cYear = parseInt(cohortMonth.split('-')[0]);
            const cM = parseInt(cohortMonth.split('-')[1]);
            const oYear = oDate.getFullYear();
            const oM = oDate.getMonth() + 1;
            const monthsSince = (oYear - cYear) * 12 + (oM - cM);

            if (monthsSince < 0) return;

            let sRev = 0;
            o.items.forEach(item => {
                if (item.product && item.product.sellerId === sellerId) {
                    sRev += Number(item.price * item.quantity);
                }
            });

            if (!cohortStats[cohortMonth].revenuePerMonth[monthsSince]) {
                cohortStats[cohortMonth].revenuePerMonth[monthsSince] = 0;
                cohortStats[cohortMonth].retainedUsersPerMonth[monthsSince] = new Set();
            }
            cohortStats[cohortMonth].revenuePerMonth[monthsSince] += sRev;
            cohortStats[cohortMonth].retainedUsersPerMonth[monthsSince].add(o.userId);
        });

        // Current max month offset to ensure all arrays pad to the same relative "now"
        const now = new Date();

        const cohortDataRaw = Object.keys(cohortStats).sort().map(month => {
            const stats = cohortStats[month];
            const totalUsers = stats.users.size;

            const cYear = parseInt(month.split('-')[0]);
            const cM = parseInt(month.split('-')[1]);
            const nYear = now.getFullYear();
            const nM = now.getMonth() + 1;
            const maxMonthsForThisCohort = Math.max(0, (nYear - cYear) * 12 + (nM - cM));

            const ltv = [];
            const retention = [];
            let cumulativeRev = 0;

            for (let i = 0; i <= maxMonthsForThisCohort; i++) {
                const revThisMonth = stats.revenuePerMonth[i] || 0;
                cumulativeRev += revThisMonth;
                ltv.push(totalUsers > 0 ? (cumulativeRev / totalUsers) : 0);

                const retainedSet = stats.retainedUsersPerMonth[i];
                const retainedCount = retainedSet ? retainedSet.size : 0;
                retention.push(totalUsers > 0 ? parseFloat(((retainedCount / totalUsers) * 100).toFixed(1)) : 0);
            }

            return { cohort: month, ltv, retention };
        });

        // Filter to last 6 active cohorts for display
        const cohortData = cohortDataRaw.slice(-6);

        res.json({
            revenue: totalRevenue,
            totalOrders: orders.length,
            deliveredOrders: deliveredOrdersCount,
            inquiryCount,
            bestSellers,
            monthlyTrends,
            cohortData,
            orderStatusDistribution: {
                pending: orders.filter(o => o.status === 'Pending').length,
                processing: orders.filter(o => o.status === 'Processing' || o.status === 'To Ship').length,
                shipped: orders.filter(o => o.status === 'Shipped').length,
                completed: orders.filter(o => o.status === 'Completed' || o.status === 'Delivered').length,
                cancelled: orders.filter(o => o.status === 'Cancelled').length
            }
        });

    } catch (error) {
        console.error('Analytics Error Details:', {
            userId: req.user.id,
            userId2: req.user.userId,
            message: error.message,
            stack: error.stack
        });
        res.status(500).json({ message: 'Server error fetching analytics', error: error.message });
    }
};

exports.exportSellerAnalytics = async (req, res) => {
    try {
        const { startDate, endDate } = req.query;
        const sellerId = req.user.id || req.user.userId;

        console.log(`>>> [Analytics Export] Seller: ${sellerId}, Range: ${startDate} to ${endDate}`);

        // Build date filter
        const dateFilter = {};
        if (startDate && endDate) {
            const start = new Date(startDate);
            start.setHours(0, 0, 0, 0);
            const end = new Date(endDate);
            end.setHours(23, 59, 59, 999);
            dateFilter.createdAt = {
                [Op.between]: [start, end]
            };
        }

        // 1. Get seller products
        const sellerProducts = await Product.findAll({
            where: { sellerId },
            attributes: ['id', 'name']
        });
        const productIds = sellerProducts.map(p => p.id);

        // 2. Fetch orders (guard against empty productIds to prevent Sequelize error)
        let orders = [];
        if (productIds.length > 0) {
            orders = await Order.findAll({
                where: { ...dateFilter },
                include: [
                    {
                        model: OrderItem,
                        as: 'items',
                        where: { productId: { [Op.in]: productIds } },
                        include: [{ model: Product, as: 'product', attributes: ['name'] }]
                    }
                ],
                order: [['createdAt', 'DESC']]
            });
        }

        // 3. Generate Excel
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Sales Analytics');

        worksheet.columns = [
            { header: 'Order ID', key: 'id', width: 25 },
            { header: 'Date', key: 'date', width: 20 },
            { header: 'Product', key: 'product', width: 40 },
            { header: 'Quantity', key: 'quantity', width: 10 },
            { header: 'Price', key: 'price', width: 15 },
            { header: 'Total', key: 'total', width: 15 },
            { header: 'Status', key: 'status', width: 15 }
        ];

        // Style the header row
        worksheet.getRow(1).font = { bold: true };
        worksheet.getRow(1).fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFEFEFEF' }
        };

        orders.forEach(order => {
            order.items.forEach(item => {
                worksheet.addRow({
                    id: order.id,
                    date: new Date(order.createdAt).toLocaleDateString(),
                    product: item.product?.name || 'N/A',
                    quantity: item.quantity,
                    price: Number(item.price),
                    total: Number(item.price) * item.quantity,
                    status: order.status
                });
            });
        });

        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename=seller_analytics_${new Date().toISOString().split('T')[0]}.xlsx`);

        await workbook.xlsx.write(res);
        res.end();

    } catch (error) {
        console.error('Export Analytics Error:', error);
        if (!res.headersSent) {
            res.status(500).json({ message: 'Server error exporting analytics', error: error.message });
        }
    }
};

