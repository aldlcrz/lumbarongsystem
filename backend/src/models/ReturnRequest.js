const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const ReturnRequest = sequelize.define('ReturnRequest', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  orderId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'Orders',
      key: 'id',
    },
  },
  reason: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  proofImages: {
    type: DataTypes.JSON, // Array of URLs
    defaultValue: [],
  },
  status: {
    type: DataTypes.ENUM('Pending', 'Approved', 'Rejected', 'Completed'),
    defaultValue: 'Pending',
  },
  adminComment: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
}, {
  timestamps: true,
});

module.exports = ReturnRequest;
