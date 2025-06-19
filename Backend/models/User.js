const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  username: String,
  password: String,
  otp: String,
  otpExpiresAt: Date,
  isVerified: { type: Boolean, default: false },
  fullName: String,
  skills: [String],
  location: String,
  internRole: String,
  lastSeen: { type: Date, default: Date.now }, // added lastSeen field
});

module.exports = mongoose.model('User', userSchema);
