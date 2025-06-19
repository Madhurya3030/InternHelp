const User = require('../models/User');

exports.updateProfile = async (req, res) => {
  const { email, fullName, skills, location, internRole } = req.body;

  try {
    let user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found. Please signup first.' });
    } else {
      // Do not allow username or email to be changed
      user.fullName = fullName || user.fullName;
      user.skills = skills || user.skills;
      user.location = location || user.location;
      user.internRole = internRole || user.internRole;
    }

    await user.save();

    res.json({ success: true, message: 'Profile updated successfully', user });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to update profile', error: err.message });
  }
};

// New controller method to update allowed fields only (phone, address, bio)
exports.editProfileAllowedFields = async (req, res) => {
  const { username } = req.params;
  const { phone, address, bio } = req.body;

  try {
    let user = await User.findOne({ username });
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    // Update only allowed fields
    if (phone !== undefined) user.phone = phone;
    if (address !== undefined) user.address = address;
    if (bio !== undefined) user.bio = bio;

    await user.save();

    res.json({ success: true, message: 'Profile updated successfully', user });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to update profile', error: err.message });
  }
};

exports.getProfile = async (req, res) => {
  const { email } = req.query;

  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    res.json({ success: true, user });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to get profile', error: err.message });
  }
};

exports.getAllUsers = async (req, res) => {
  try {
    // Include lastSeen field in the user data
    const users = await User.find({}, '_id username email lastSeen'); // Assuming lastSeen field exists in User model
    res.json({ success: true, users });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to get users', error: err.message });
  }
};
