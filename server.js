require('dotenv').config({ quiet: true });

const http = require('http');
const path = require('path');
const express = require('express');
const { Server } = require('socket.io');
const connectDB = require('./config/db');
const authRoutes = require('./routes/authRoutes');
const noteRoutes = require('./routes/noteRoutes');
const registerChat = require('./sockets/chat');
const { notFound, errorHandler } = require('./middleware/errorHandler');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

app.get('/api/health', (req, res) => res.json({ status: 'ok' }));
app.use('/api/auth', authRoutes);
app.use('/api/notes', noteRoutes);

app.use(notFound);
app.use(errorHandler);

registerChat(io);

const PORT = process.env.PORT || 5000;

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`[server] port ${PORT} is already in use`);
    process.exit(1);
  }
  throw err;
});

async function start() {
  if (!process.env.JWT_SECRET) {
    console.error('[server] JWT_SECRET is missing from .env');
    process.exit(1);
  }

  try {
    await connectDB(); // database first, then listen
    server.listen(PORT, () => {
      console.log(`[server] listening on http://localhost:${PORT}`);
    });
  } catch (err) {
    console.error('[server] failed to start:', err.message);
    process.exit(1);
  }
}

start();

module.exports = { app, server, io };
