const jwt = require('jsonwebtoken');
const { User } = require('../models');

const isTokenStale = (decoded, user) => {
    if (!decoded?.iat || !user?.passwordChangedAt) return false;

    const passwordChangedAtSeconds = Math.floor(new Date(user.passwordChangedAt).getTime() / 1000);
    return passwordChangedAtSeconds > decoded.iat;
};

// 1. Combined middleware (used by wishlist, return, upload)
const authMiddleware = (roles = []) => {
    return async (req, res, next) => {
        let token = req.header('x-auth-token');
        if (!token) {
            const authHeader = req.header('Authorization');
            if (authHeader && authHeader.startsWith('Bearer ')) token = authHeader.slice(7);
        }
        if (!token) return res.status(401).json({ message: 'No token, authorization denied' });

        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET || 'lumbarong_secret_key_2026');
            const user = await User.findByPk(decoded.id || decoded.userId);
            if (!user) return res.status(401).json({ message: 'User not found' });
            if (isTokenStale(decoded, user)) {
                return res.status(401).json({ message: 'Token is no longer valid. Please log in again' });
            }

            req.user = user;

            if (roles.length > 0 && !roles.includes(req.user.role)) {
                return res.status(403).json({ message: 'Access denied: Unauthorized role' });
            }
            next();
        } catch (error) {
            console.error('Auth Middleware Error:', error.name, ' - ', error.message);
            if (error.name === 'TokenExpiredError') {
                return res.status(401).json({ message: 'Session expired. Please log in again.' });
            }
            res.status(401).json({ message: 'Token is not valid' });
        }
    };
};

// 2. Separate protect middleware (from original auth.js)
authMiddleware.protect = async (req, res, next) => {
    try {
        let token = req.header('x-auth-token');
        if (!token) {
            const authHeader = req.header('Authorization');
            if (authHeader && authHeader.startsWith('Bearer ')) token = authHeader.slice(7);
        }
        if (!token) return res.status(401).json({ message: 'No token, authorization denied' });

        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'lumbarong_secret_key_2026');
        const user = await User.findByPk(decoded.id || decoded.userId);
        
        if (!user) return res.status(401).json({ message: 'User not found' });
        if (isTokenStale(decoded, user)) {
            return res.status(401).json({ message: 'Token is no longer valid. Please log in again' });
        }
        
        req.user = user;
        next();
    } catch (error) {
        console.error('Protect Middleware Error:', error.name, ' - ', error.message);
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({ message: 'Session expired. Please log in again.' });
        }
        res.status(401).json({ message: 'Token is not valid' });
    }
};

// 3. Separate authorize middleware (from original auth.js)
authMiddleware.authorize = (...roles) => {
    return (req, res, next) => {
        if (!req.user || !roles.includes(req.user.role)) {
            return res.status(403).json({ message: 'Access denied: Insufficient permissions' });
        }
        next();
    };
};

// 4. Optional authentication (populates req.user if token exists, but doesn't block guests)
authMiddleware.maybeProtect = async (req, res, next) => {
    try {
        let token = req.header('x-auth-token');
        if (!token) {
            const authHeader = req.header('Authorization');
            if (authHeader && authHeader.startsWith('Bearer ')) token = authHeader.slice(7);
        }
        
        if (token) {
            const decoded = jwt.verify(token, process.env.JWT_SECRET || 'lumbarong_secret_key_2026');
            const user = await User.findByPk(decoded.id || decoded.userId);
            if (user && !isTokenStale(decoded, user)) {
                req.user = user;
            }
        }
    } catch (error) {
        // Silently fail and proceed as guest
    }
    next();
};

module.exports = authMiddleware;
