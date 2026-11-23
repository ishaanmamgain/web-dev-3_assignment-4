const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { asyncHandler } = require('../middleware/errorHandler');
const appEvents = require('../events/appEvents');

const publicUser = (user) => ({
  id: user._id.toString(),
  username: user.username,
  email: user.email,
  role: user.role,
  createdAt: user.createdAt
});

const signToken = (user) =>
  jwt.sign({ id: user._id.toString(), role: user.role }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN
  });

// Demo only: allowing role="admin" at signup keeps RBAC easy to show.
// In production the role would always be forced to "user" (or set by an admin).
const signup = asyncHandler(async (req, res) => {
  const { username, email, password } = req.body || {};
  const role = req.body && req.body.role === 'admin' ? 'admin' : 'user';

  if (!username || !email || !password) {
    return res.status(400).json({ message: 'Username, email and password are required' });
  }
  if (password.length < 6) {
    return res.status(400).json({ message: 'Password must be at least 6 characters' });
  }

  const normalizedEmail = email.toLowerCase().trim();
  const existing = await User.findOne({
    $or: [{ email: normalizedEmail }, { username: username.trim() }]
  });
  if (existing) {
    const field = existing.email === normalizedEmail ? 'Email' : 'Username';
    return res.status(409).json({ message: `${field} already exists` });
  }

  const hashed = await bcrypt.hash(password, 10);
  const user = await User.create({ username, email: normalizedEmail, password: hashed, role });

  appEvents.emit('user:registered', user);

  return res.status(201).json({
    message: 'User registered',
    id: user._id.toString(),
    username: user.username,
    email: user.email
  });
});

const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body || {};

  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password are required' });
  }

  const user = await User.findOne({ email: email.toLowerCase().trim() });
  const valid = user ? await bcrypt.compare(password, user.password) : false;

  // Same message for unknown email and wrong password.
  if (!valid) return res.status(401).json({ message: 'Invalid email or password' });

  appEvents.emit('user:loggedIn', user);

  return res.status(200).json({ message: 'Login successful', token: signToken(user) });
});

const profile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.id);
  if (!user) return res.status(404).json({ message: 'User not found' });
  return res.json(publicUser(user));
});

// Admin-only smoke test endpoint.
const adminPanel = (req, res) =>
  res.json({ message: 'Welcome, admin', user: { id: req.user.id, role: req.user.role } });

const listUsers = asyncHandler(async (req, res) => {
  const users = await User.find().select('-password -__v');
  res.json(users.map(publicUser));
});

module.exports = { signup, login, profile, adminPanel, listUsers };
