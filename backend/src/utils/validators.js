// utils/validators.js

const validateEmail = (email) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(String(email).toLowerCase());
};

const validatePasswordLength = (password) => {
    return password && password.length >= 6 && password.length <= 32;
};

const validateRequiredFields = (fields, body) => {
    for (const field of fields) {
        if (!body[field] || String(body[field]).trim() === '') {
            return { valid: false, field };
        }
    }
    return { valid: true };
};

module.exports = {
    validateEmail,
    validatePasswordLength,
    validateRequiredFields
};
