const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { readCookie } = require('../middleware/auth');
const appEvents = require('../events/appEvents');

// Token may arrive via handshake auth, Bearer header, or cookie.
function extractToken(socket) {
  const { auth = {}, headers = {} } = socket.handshake;
  const bearer = headers.authorization && headers.authorization.startsWith('Bearer ')
    ? headers.authorization.slice(7).trim()
    : null;
  return auth.token || bearer || readCookie(headers.cookie, 'token');
}

const roomName = (room) => (typeof room === 'string' && room.trim() ? room.trim() : 'general');

module.exports = function registerChat(io) {
  io.use(async (socket, next) => {
    const token = extractToken(socket);
    if (!token) return next(new Error('No token provided'));

    try {
      const { id } = jwt.verify(token, process.env.JWT_SECRET);
      // Username comes from the DB so messages show real names.
      const user = await User.findById(id).select('username role');
      if (!user) return next(new Error('Invalid or expired token'));

      socket.user = { id: user._id.toString(), username: user.username, role: user.role };
      return next();
    } catch (err) {
      return next(new Error('Invalid or expired token'));
    }
  });

  io.on('connection', (socket) => {
    console.log(`User connected: ${socket.id}`);
    socket.join('general'); // default room

    socket.on('joinRoom', (room) => {
      const name = roomName(room);
      socket.join(name);
      console.log(`${socket.id} joined room ${name}`);
      io.to(name).emit('systemMessage', {
        room: name,
        message: `${socket.user.username} joined the room`,
        time: new Date().toISOString()
      });
    });

    socket.on('chatMessage', (payload = {}) => {
      const name = roomName(payload.room);
      const text = typeof payload.message === 'string' ? payload.message.trim() : '';
      if (!text) return;

      const message = {
        room: name,
        user: socket.user.username,
        message: text,
        time: new Date().toISOString()
      };

      io.to(name).emit('chatMessage', message);
      console.log(`[${name}] ${message.user}: ${message.message}`);
      appEvents.emit('chat:message', message);
    });

    socket.on('leaveRoom', (room) => {
      const name = roomName(room);
      socket.leave(name);
      console.log(`${socket.id} left room ${name}`);
      io.to(name).emit('systemMessage', {
        room: name,
        message: `${socket.user.username} left the room`,
        time: new Date().toISOString()
      });
    });

    socket.on('disconnect', (reason) => {
      console.log(`User disconnected: ${socket.id} (${reason})`);
    });
  });
};
