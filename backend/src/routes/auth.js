/**
 * Authentication Routes
 * Handles login and authentication endpoints
 */

const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { validateRequiredFields } = require('../middleware/validator');

/**
 * POST /auth/login
 * Authenticate user with username and password
 * Body: { username, password, role }
 * Returns: { success, user: { id, name, username, role } }
 */
router.post('/login', validateRequiredFields(['username', 'password', 'role']), (req, res, next) => {
  try {
    const { username, password, role } = req.body;

    // Validate role
    if (!['customer', 'operator'].includes(role)) {
      return res.status(400).json({
        success: false,
        error: {
          message: 'Invalid role. Must be "customer" or "operator"',
          code: 'INVALID_ROLE'
        }
      });
    }

    // For operators, check credentials
    if (role === 'operator') {
      if (username === 'operator' && password === 'operator123') {
        return res.json({
          success: true,
          user: {
            id: null,
            name: 'Operator',
            username: 'operator',
            role: 'operator'
          }
        });
      } else {
        return res.status(401).json({
          success: false,
          error: {
            message: 'Invalid operator credentials',
            code: 'INVALID_CREDENTIALS'
          }
        });
      }
    }

    // For customers, verify credentials
    const user = User.verifyCredentials(username, password);
    
    if (!user) {
      return res.status(401).json({
        success: false,
        error: {
          message: 'Invalid username or password',
          code: 'INVALID_CREDENTIALS'
        }
      });
    }

    // Return user data (without password)
    res.json({
      success: true,
      user: {
        id: user.user_id,
        name: user.name,
        username: user.username,
        first_name: user.first_name,
        last_name: user.last_name,
        role: 'customer'
      }
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;

