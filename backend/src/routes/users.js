/**
 * User Routes
 * Handles user-related API endpoints
 */

const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { validateUserId } = require('../middleware/validator');

/**
 * GET /users
 * List all users (for login dropdown)
 * Returns: Array of users with id and name
 */
router.get('/', (req, res, next) => {
  try {
    const users = User.findAll();
    
    // Return id, name, and username for reference
    const userList = users.map(user => ({
      id: user.user_id,
      name: user.name,
      username: user.username,
      first_name: user.first_name,
      last_name: user.last_name
    }));
    
    res.json({
      success: true,
      count: userList.length,
      users: userList
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /users/:id
 * Get user details by ID
 * Returns: Full user object with all details
 */
router.get('/:id', validateUserId, (req, res, next) => {
  try {
    const userId = parseInt(req.params.id, 10);
    const user = User.findById(userId);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        error: {
          message: `User with ID ${userId} not found`,
          code: 'USER_NOT_FOUND'
        }
      });
    }
    
    res.json({
      success: true,
      user: {
        id: user.user_id,
        name: user.name,
        consent_status: user.consent_status,
        created_at: user.created_at
      }
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;

