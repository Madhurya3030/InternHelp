const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const crypto = require('crypto');
const User = require('../models/User');
const { sendOtp, verifyOtp } = require('../controllers/authController');
const { sendVerificationEmail } = require('../utils/emailService');

router.post('/signup', async (req, res) => {
  try {
    const { email, password, username } = req.body;

    const existing = await User.findOne({ email });
    if (existing)
      return res.status(400).json({ success: false, message: 'User already exists' });

    const hashedPassword = await bcrypt.hash(password, 10);
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    const user = new User({ email, username, password: hashedPassword, otp, otpExpiresAt: Date.now() + 10 * 60 * 1000, isVerified: false });
    await user.save();

    await sendVerificationEmail(email, otp);

    res.status(201).json({ success: true, message: 'User created. Please verify your email with the OTP sent.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Login route
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user)
      return res.status(400).json({ success: false, message: 'Invalid email or password' });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch)
      return res.status(400).json({ success: false, message: 'Invalid email or password' });

    if (!user.isVerified) {
      return res.status(401).json({ success: false, message: 'Please verify your email before logging in.' });
    }

    // Generate token or session here (e.g., JWT) - omitted for brevity

    // Return full user profile in response
    const userProfile = {
      _id: user._id,
      username: user.username,
      email: user.email,
      fullName: user.fullName,
      location: user.location,
      skills: user.skills,
      internRole: user.internRole,
      isVerified: user.isVerified,
    };

    res.status(200).json({ success: true, message: 'Login successful', user: userProfile });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

router.post('/send-otp', sendOtp);
router.post('/verify-otp', verifyOtp);

const { googleLogin } = require('../controllers/authController');
router.post('/google-login', googleLogin);

module.exports = router;
