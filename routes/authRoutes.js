const express = require('express');
const { signup, login, profile, adminPanel, listUsers } = require('../controllers/authController');
const { verifyToken } = require('../middleware/auth');
const { authorizeRoles } = require('../middleware/role');

const router = express.Router();

router.post('/signup', signup);
router.post('/login', login);

router.get('/profile', verifyToken, profile);
router.get('/admin', verifyToken, authorizeRoles('admin'), adminPanel);
router.get('/users', verifyToken, authorizeRoles('admin'), listUsers);

module.exports = router;
