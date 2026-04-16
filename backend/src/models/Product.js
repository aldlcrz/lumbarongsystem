const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Product = sequelize.define('Product', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  price: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
  },
  sizes: {
    type: DataTypes.JSON, // Array of available sizes
    defaultValue: [],
  },
  categories: {
    type: DataTypes.JSON, // Array of Heritage Sectors
    defaultValue: ["Formal"],
  },
  image: {
    type: DataTypes.JSON, // Can store array of image URLs
    defaultValue: [],
  },
  stock: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  },
  shippingFee: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0,
  },
  shippingDays: {
    type: DataTypes.INTEGER,
    defaultValue: 3,
  },
  sellerId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'Users',
      key: 'id',
    },
  },
  gcashNumber: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  gcashQrCode: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  mayaNumber: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  mayaQrCode: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  allowGcash: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
  },
  allowMaya: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
  },
  views: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  },
}, {
  timestamps: true,
});

module.exports = Product;
