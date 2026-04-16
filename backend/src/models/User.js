const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const User = sequelize.define('User', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    validate: {
      isEmail: true,
    },
  },
  password: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  role: {
    type: DataTypes.ENUM('customer', 'seller', 'admin'),
    defaultValue: 'customer',
  },
  isVerified: {
    type: DataTypes.BOOLEAN,
    defaultValue: false, // Used for seller verification
  },
  profilePhoto: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  indigencyCertificate: {
    type: DataTypes.STRING,
    allowNull: true, // Required for community verification
  },
  validId: {
    type: DataTypes.STRING,
    allowNull: true, 
  },
  mobileNumber: {
    type: DataTypes.STRING,
    allowNull: true,
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
  facebookLink: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  instagramLink: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  tiktokLink: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  youtubeLink: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  socialLinks: {
    type: DataTypes.JSON,
    defaultValue: [],
  },
  shopHouseNo: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  shopStreet: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  shopAddress: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  shopBarangay: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  shopCity: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  shopProvince: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  shopPostalCode: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  shopLatitude: {
    type: DataTypes.FLOAT,
    allowNull: true,
  },
  shopLongitude: {
    type: DataTypes.FLOAT,
    allowNull: true,
  },
  isAdult: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
  fcmToken: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  followers: {
    type: DataTypes.JSON,
    allowNull: true,
  },
  following: {
    type: DataTypes.JSON,
    allowNull: true,
  },
  resetPasswordToken: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  resetPasswordExpires: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  passwordChangedAt: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  status: {
    type: DataTypes.ENUM('active', 'frozen', 'blocked'),
    defaultValue: 'active',
  },
}, {
  timestamps: true,
  indexes: [
    {
      unique: true,
      fields: ['email']
    }
  ]
});

module.exports = User;
