const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const SystemSetting = sequelize.define('SystemSetting', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  key: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
  },
  value: {
    type: DataTypes.JSON, // flexible storage for targets or global flags
    allowNull: false,
  },
}, {
  timestamps: true,
});

module.exports = SystemSetting;
