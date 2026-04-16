const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const ProductView = sequelize.define('ProductView', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  productId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'Products',
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
  customerId: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'Users',
      key: 'id',
    },
  },
  ipAddress: {
    type: DataTypes.STRING,
    allowNull: true,
  },
}, {
  timestamps: true,
  updatedAt: false, // Views are append-only
  indexes: [
    { fields: ['productId'] },
    { fields: ['sellerId'] },
    { fields: ['customerId'] },
    { fields: ['ipAddress'] },
    { fields: ['createdAt'] }
  ]
});

module.exports = ProductView;
