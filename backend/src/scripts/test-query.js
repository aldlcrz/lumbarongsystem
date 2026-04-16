const { OrderItem, Order, Product, sequelize } = require('./src/models');
const { Op } = require('sequelize');

async function testQuery() {
  const start = new Date();
  start.setHours(0,0,0,0);
  try {
    const data = await OrderItem.findAll({
        attributes: [
            'productId',
            [sequelize.fn('SUM', sequelize.col('quantity')), 'totalSold']
        ],
        include: [{
            model: Order,
            attributes: [],
            where: {
                status: { [Op.notIn]: ['Cancelled'] },
            }
        }, {
            model: Product,
            as: 'product',
            attributes: ['name']
        }],
        group: ['productId', 'product.id'],
        order: [[sequelize.fn('SUM', sequelize.col('quantity')), 'DESC']],
        limit: 5,
        raw: true,
        nest: true
    });
    console.log("Success:", data);
  } catch(e) {
    console.error("Error:", e.message);
  }
}
testQuery();
