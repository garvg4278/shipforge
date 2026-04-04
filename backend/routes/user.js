// routes/user.js

const express = require('express');
const router = express.Router();

const { getProfile } = require('../controllers/userController');
const { requireAuth } = require('../middleware/auth');

/**
 * @route   GET /api/user/profile
 * @desc    Get the authenticated user's profile
 * @access  Private (USER + ADMIN)
 */
router.get('/profile', requireAuth, getProfile);

module.exports = router;
