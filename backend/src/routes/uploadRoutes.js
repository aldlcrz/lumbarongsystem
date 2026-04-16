const express = require('express');
const router = express.Router();
const multer = require('multer');
const cloudinary = require('../utils/cloudinaryConfig');
const auth = require('../middleware/authMiddleware');

const fs = require('fs');
const path = require('path');

const storage = multer.memoryStorage();
const upload = multer({ storage });

// Local storage fallback directory
const uploadDir = path.join(__dirname, '../../public/uploads');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

router.post('/', auth(['seller', 'admin', 'customer']), upload.single('image'), async (req, res) => {
    try {
        if (!req.file) return res.status(400).json({ message: 'No file uploaded' });

        try {
            // Convert buffer to base64
            const fileStr = req.file.buffer.toString('base64');
            const fileUri = `data:${req.file.mimetype};base64,${fileStr}`;

            const uploadResponse = await cloudinary.uploader.upload(fileUri, {
                folder: 'lumbarong/products'
            });

            return res.json({ url: uploadResponse.secure_url });
        } catch (cloudinaryError) {
            console.warn('Cloudinary upload failed or not configured, falling back to local storage:', cloudinaryError.message);

            // Local fallback
            const fileName = Date.now() + '-' + req.file.originalname;
            const filePath = path.join(uploadDir, fileName);

            fs.writeFileSync(filePath, req.file.buffer);

            // Return local URL - Use the host from the request so it works for mobile/web
            const host = req.get('host');
            const localUrl = `http://${host}/uploads/${fileName}`;
            res.json({ url: localUrl });
        }
    } catch (error) {
        console.error('Upload error:', error);
        res.status(500).json({ message: 'Upload failed', error: error.message });
    }
});

module.exports = router;
