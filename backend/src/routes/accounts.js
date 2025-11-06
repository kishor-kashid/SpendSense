/**
 * Accounts Routes
 * Handles account information endpoints (balance, credit cards, etc.)
 */

const express = require('express');
const router = express.Router();
const Account = require('../models/Account');
const User = require('../models/User');
// Note: Accounts don't require consent - users can always view their own account data

/**
 * GET /accounts/:user_id
 * Get all accounts for a user
 */
router.get('/:user_id', (req, res, next) => {
  try {
    const userIdParam = req.params.user_id;
    if (!userIdParam || isNaN(parseInt(userIdParam, 10)) || parseInt(userIdParam, 10) <= 0) {
      return res.status(400).json({
        success: false,
        error: {
          message: `Invalid user_id: ${userIdParam}. Must be a positive integer.`,
          code: 'INVALID_USER_ID'
        }
      });
    }
    
    const userId = parseInt(userIdParam, 10);
    
    // Check if user exists
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
    
    // Get all accounts for the user
    const accounts = Account.findByUserId(userId) || [];
    
    // Separate accounts by type
    const depositoryAccounts = accounts.filter(acc => acc.type === 'depository') || [];
    const creditAccounts = accounts.filter(acc => acc.type === 'credit') || [];
    
    // Calculate total balances
    const totalCurrentBalance = depositoryAccounts.reduce((sum, acc) => sum + (acc.current_balance || 0), 0);
    const totalAvailableBalance = depositoryAccounts.reduce((sum, acc) => sum + (acc.available_balance || 0), 0);
    
    // Calculate credit card balances and limits
    const creditCardsData = (creditAccounts || []).map(card => ({
      account_id: card.account_id,
      subtype: card.subtype || 'credit card',
      current_balance: card.current_balance || 0,
      credit_limit: card.credit_limit || 0,
      available_credit: (card.credit_limit || 0) - (card.current_balance || 0),
      utilization_rate: card.credit_limit > 0 
        ? ((card.current_balance || 0) / card.credit_limit * 100).toFixed(1)
        : 0
    }));
    
    const totalCreditBalance = creditAccounts.reduce((sum, acc) => sum + (acc.current_balance || 0), 0);
    const totalCreditLimit = creditAccounts.reduce((sum, acc) => sum + (acc.credit_limit || 0), 0);
    const totalAvailableCredit = totalCreditLimit - totalCreditBalance;
    const overallUtilization = totalCreditLimit > 0 
      ? ((totalCreditBalance / totalCreditLimit) * 100).toFixed(1)
      : 0;
    
    res.json({
      success: true,
      accounts: {
        all: accounts,
        depository: depositoryAccounts,
        credit: creditAccounts
      },
      total_balance: {
        current: totalCurrentBalance,
        available: totalAvailableBalance
      },
      credit_cards: {
        cards: creditCardsData,
        total_balance: totalCreditBalance,
        total_limit: totalCreditLimit,
        total_available: totalAvailableCredit,
        overall_utilization: overallUtilization
      }
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;

