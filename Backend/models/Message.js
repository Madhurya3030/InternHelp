const mongoose = require('mongoose');

const replyToSchema = new mongoose.Schema({
  user: String,
  message: String,
}, { _id: false });

const messageSchema = new mongoose.Schema({
  user: { type: String, required: true },
  message: { type: String, required: true },
  timestamp: { type: Date, default: Date.now },
  channel: { type: String, required: true },
  replyTo: replyToSchema,
});

module.exports = mongoose.model('Message', messageSchema);
