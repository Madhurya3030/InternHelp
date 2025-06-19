const User = require('../models/User');
const nodemailer = require('nodemailer');
const bcrypt = require('bcrypt');
const { OAuth2Client } = require('google-auth-library');

const generateOTP = () => Math.floor(100000 + Math.random() * 900000).toString();

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  }
});

exports.sendOtp = async (req, res) => {
  const { email, username, password } = req.body;
  const otp = generateOTP();

  try {
    let user = await User.findOne({ email });

    if (!user) {
      const hashedPassword = await bcrypt.hash(password, 10);
      user = new User({ email, username, password: hashedPassword });
    }

    user.otp = otp;
    user.otpExpiresAt = Date.now() + 10 * 60 * 1000; // 10 min
    await user.save();

    await transporter.sendMail({
      to: email,
      subject: 'Your OTP for InternHelp',
      html: `<h3>Your OTP is ${otp}</h3><p>It is valid for 10 minutes.</p>`
    });

    res.json({ success: true, message: 'OTP sent successfully' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to send OTP', error: err.message });
  }
};

exports.verifyOtp = async (req, res) => {
  const { email, otp } = req.body;

  try {
    const user = await User.findOne({ email });

    if (!user || user.otp !== otp || Date.now() > user.otpExpiresAt) {
      return res.status(400).json({ success: false, message: 'Invalid or expired OTP' });
    }

    user.isVerified = true;
    user.otp = undefined;
    user.otpExpiresAt = undefined;
    await user.save();

    res.json({ success: true, message: 'OTP verified successfully' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'OTP verification failed' });
  }
};

// Google OAuth client setup
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

exports.googleLogin = async (req, res) => {
  const { idToken } = req.body;

  if (!idToken) {
    return res.status(400).json({ success: false, message: 'ID token is required' });
  }

  try {
    // Verify the token with Google
    const ticket = await client.verifyIdToken({
      idToken,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    const { email, name } = payload;

    if (!email) {
      return res.status(400).json({ success: false, message: 'Google account email not found' });
    }

    // Check if user exists
    let user = await User.findOne({ email });

    if (!user) {
      // Create new user with isVerified true
      user = new User({
        email,
        username: name,
        password: '', // no password for Google login
        isVerified: true,
      });
      await user.save();
    }

    // Return user profile
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

    res.status(200).json({ success: true, message: 'Google login successful', user: userProfile });
  } catch (err) {
    console.error('Google login error:', err);
    res.status(500).json({ success: false, message: 'Google login failed', error: err.message });
  }
};
