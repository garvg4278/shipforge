// controllers/userController.js

const { success } = require('../utils/apiResponse');

/**
 * GET /api/user/profile
 * Returns the authenticated user's profile (no sensitive data — middleware already strips password).
 */
const getProfile = async (req, res, next) => {
  try {
    return success(res, req.user, 'Profile retrieved');
  } catch (err) {
    next(err);
  }
};

module.exports = { getProfile };
