const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Order = sequelize.define('Order', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  customerId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'Users',
      key: 'id',
    },
  },
  sellerId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'Users',
      key: 'id',
    },
  },
  totalAmount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
  },
  status: {
    type: DataTypes.ENUM('Pending', 'Processing', 'Shipped', 'Delivered', 'Completed', 'Cancelled'),
    defaultValue: 'Pending',
  },
  paymentMethod: {
    type: DataTypes.STRING,
    defaultValue: 'GCash',
  },
  paymentReference: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  paymentProof: {
    type: DataTypes.STRING,
    allowNull: true, // URL to screenshot proof
  },
  shippingAddress: {
    type: DataTypes.JSON, // {name, street, city, postalCode}
    allowNull: false,
  },
}, {
  timestamps: true,
  indexes: [
    {
      fields: ['customerId']
    },
    {
      fields: ['sellerId']
    }
  ]
});

module.exports = Order;
