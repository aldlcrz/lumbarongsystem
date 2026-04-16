const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const { Op } = require('sequelize');
const { User } = require('../models');
const socketUtility = require('../utils/socketUtility');
const { sendPasswordResetEmail } = require('../utils/emailService');
const {
  LIMITS,
  normalizeWhitespace,
  validatePersonName,
  validatePhilippineMobileNumber,
} = require('../utils/inputValidation');

const RESET_PASSWORD_WINDOW_MINUTES = Number(process.env.PASSWORD_RESET_TTL_MINUTES || 60);
const GENERIC_PASSWORD_RESET_MESSAGE = 'If an account with that email exists, a password reset link has been sent.';

const trimTrailingSlash = (value) => String(value || '').replace(/\/+$/, '');
const hashResetToken = (token) => crypto.createHash('sha256').update(token).digest('hex');
const buildResetUrl = (token) => {
  const frontendUrl = trimTrailingSlash(process.env.FRONTEND_URL || 'http://127.0.0.1:3000');
  return `${frontendUrl}/reset-password?token=${encodeURIComponent(token)}`;
};

exports.register = async (req, res) => {
  try {
    const { name, email, password, role, mobileNumber, gcashNumber, isAdult } = req.body;

    const cleanedName = validatePersonName(name, 'Name');
    const cleanedEmail = normalizeWhitespace(email).toLowerCase();

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(cleanedEmail)) {
      return res.status(400).json({ message: 'Please provide a valid email address' });
    }

    if (cleanedEmail.length > LIMITS.email) {
      return res.status(400).json({ message: `Email cannot exceed ${LIMITS.email} characters` });
    }

    if (password.length < LIMITS.passwordMin || password.length > LIMITS.passwordMax) {
      return res.status(400).json({
        message: `Password must be between ${LIMITS.passwordMin} and ${LIMITS.passwordMax} characters long`
      });
    }

    // Role-specific Validations (Seller)
    let sellerMobile = null;
    let sellerGcash = null;
    if (role === 'seller') {
      if (!mobileNumber || !gcashNumber) {
        return res.status(400).json({ message: 'Sellers must provide both a mobile number and a GCash number' });
      }

      sellerMobile = validatePhilippineMobileNumber(mobileNumber, 'Mobile number');
      sellerGcash = validatePhilippineMobileNumber(gcashNumber, 'GCash number');

      if (isAdult !== 'true' && isAdult !== true) {
        return res.status(400).json({ message: 'Sellers must confirm they are of legal age' });
      }
    }

    const existingUser = await User.findOne({ where: { email: cleanedEmail } });
    if (existingUser) {
      return res.status(400).json({ message: 'An account with this email already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    let indigencyCertificate = null;
    let validId = null;
    let gcashQrCode = null;

    if (req.files) {
      if (req.files.indigencyCertificate) indigencyCertificate = req.files.indigencyCertificate[0].path;
      if (req.files.validId) validId = req.files.validId[0].path;
      if (req.files.gcashQrCode) gcashQrCode = req.files.gcashQrCode[0].path;
    }

    const newUser = await User.create({
      name: cleanedName,
      email: cleanedEmail,
      password: hashedPassword,
      role: role || 'customer',
      indigencyCertificate,
      validId,
      gcashQrCode,
      mobileNumber: sellerMobile,
      gcashNumber: sellerGcash,
      isAdult: isAdult === 'true' || isAdult === true,
    });

    socketUtility.emitUserUpdated(newUser, { action: 'registered' });

    res.status(201).json({
      message: 'User registered successfully',
      user: {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
      },
    });
  } catch (error) {
    res.status(error.statusCode || 500).json({ message: error.message });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password, rememberMe } = req.body;

    const user = await User.findOne({ where: { email } });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (user.status === 'blocked') {
      return res.status(403).json({ message: 'This account has been blocked. Please contact support.' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { id: user.id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: rememberMe ? '30d' : '24h' }
    );

    res.status(200).json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        isVerified: user.isVerified,
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.forgotPassword = async (req, res) => {
  const email = String(req.body?.email || '').trim();

  if (!email) {
    return res.status(400).json({ message: 'Email is required' });
  }

  let user = null;

  try {
    user = await User.findOne({ where: { email } });

    if (!user) {
      return res.status(200).json({ message: GENERIC_PASSWORD_RESET_MESSAGE });
    }

    const resetToken = crypto.randomBytes(32).toString('hex');
    user.resetPasswordToken = hashResetToken(resetToken);
    user.resetPasswordExpires = new Date(Date.now() + RESET_PASSWORD_WINDOW_MINUTES * 60 * 1000);
    await user.save();

    await sendPasswordResetEmail({
      email: user.email,
      name: user.name,
      resetUrl: buildResetUrl(resetToken),
      expiresInMinutes: RESET_PASSWORD_WINDOW_MINUTES,
    });

    return res.status(200).json({ message: GENERIC_PASSWORD_RESET_MESSAGE });
  } catch (error) {
    if (user) {
      user.resetPasswordToken = null;
      user.resetPasswordExpires = null;
      await user.save();
    }

    return res.status(500).json({ message: 'Unable to send a password reset link right now' });
  }
};

exports.resetPassword = async (req, res) => {
  try {
    const token = String(req.body?.token || '').trim();
    const password = String(req.body?.password || '');

    if (!token || !password) {
      return res.status(400).json({ message: 'Reset token and new password are required' });
    }

    if (password.length < 6 || password.length > 32) {
      return res.status(400).json({ message: 'Password must be between 6 and 32 characters long' });
    }

    const user = await User.findOne({
      where: {
        resetPasswordToken: hashResetToken(token),
        resetPasswordExpires: {
          [Op.gt]: new Date(),
        },
      },
    });

    if (!user) {
      return res.status(400).json({ message: 'Reset link is invalid or has expired' });
    }

    user.password = await bcrypt.hash(password, 10);
    user.resetPasswordToken = null;
    user.resetPasswordExpires = null;
    user.passwordChangedAt = new Date();
    await user.save();

    socketUtility.emitUserUpdated(user, { action: 'password_reset' });

    return res.status(200).json({ message: 'Password reset successful' });
  } catch (error) {
    return res.status(500).json({ message: 'Unable to reset password right now' });
  }
};

exports.getProfile = async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id, {
      attributes: { exclude: ['password'] },
    });
    res.status(200).json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
