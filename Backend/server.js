// server.js
const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');

dotenv.config();

const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const Message = require('./models/Message');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
});

app.use(cors());
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/user', userRoutes);

// MongoDB
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('MongoDB Connected'))
  .catch(err => console.error('DB Error:', err));

// --- SOCKET.IO LOGIC ---
const groupChannel = 'allStudents';

io.on('connection', (socket) => {
  console.log(`🔌 User connected: ${socket.id}`);

  socket.on('joinRoom', (room) => {
    socket.join(room);
    console.log(`✅ ${socket.id} joined room ${room}`);
  });

  socket.on('leaveRoom', (room) => {
    socket.leave(room);
    console.log(`🚪 ${socket.id} left room ${room}`);
  });

  // GROUP MESSAGE
  socket.on('groupMessage', async (msgData, callback) => {
    try {
      const saved = await Message.create(msgData);
      io.to(groupChannel).emit('newGroupMessage', saved);
      callback && callback({ status: 'ok' });
    } catch (err) {
      console.error('Group Message Save Error:', err);
      callback && callback({ status: 'error', error: err.message });
    }
  });

  // DIRECT MESSAGE
  socket.on('send-dm', async (msgData, callback) => {
    try {
      const users = [msgData.from, msgData.to].sort(); // consistent room naming
      const dmChannel = `dm_${users[0]}_${users[1]}`;

      const messageToSave = {
        user: msgData.from,
        message: msgData.message,
        timestamp: msgData.timestamp || new Date(),
        channel: dmChannel,
        replyTo: msgData.replyTo || null,
      };

      const saved = await Message.create(messageToSave);
      socket.join(dmChannel); // ensure sender joins
      io.to(dmChannel).emit('receive-dm', saved);
      callback && callback({ status: 'ok' });
    } catch (err) {
      console.error('Direct Message Error:', err);
      callback && callback({ status: 'error', error: err.message });
    }
  });

  socket.on('disconnect', () => {
    console.log(`❌ User disconnected: ${socket.id}`);
  });
});

// FETCH MESSAGES BY CHANNEL
app.get('/api/chat', async (req, res) => {
  try {
    const channel = req.query.channel || groupChannel;
    const messages = await Message.find({ channel }).sort({ timestamp: 1 });
    res.json(messages);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch messages' });
  }
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
