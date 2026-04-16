const cloudinary = require('cloudinary').v2;
require('dotenv').config();

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME || 'mock_cloud',
    api_key: process.env.CLOUDINARY_API_KEY || 'mock_key',
    api_secret: process.env.CLOUDINARY_API_SECRET || 'mock_secret'
});

module.exports = cloudinary;
