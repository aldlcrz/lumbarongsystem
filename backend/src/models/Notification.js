const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Notification = sequelize.define('Notification', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  userId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'Users',
      key: 'id',
    },
  },
  title: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  message: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  type: {
    type: DataTypes.STRING, // e.g., 'OrderUpdate', 'NewMessage', 'System'
    defaultValue: 'System',
  },
  link: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  read: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
  targetRole: {
    type: DataTypes.STRING, // 'customer' or 'seller'
    defaultValue: 'customer',
  },
}, {
  timestamps: true,
});

module.exports = Notification;
