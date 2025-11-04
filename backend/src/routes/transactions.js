/**
 * Transactions Routes
 * Handles transaction and spending insights endpoints
 */

const express = require('express');
const router = express.Router();
const Transaction = require('../models/Transaction');
const Account = require('../models/Account');
const User = require('../models/User');
// Note: Transactions and insights don't require consent - users can always view their own data

/**
 * GET /transactions/:user_id
 * Get all transactions for a user
 * Query params: startDate, endDate, includePending
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
    
    // Note: Transactions don't require consent - users can view their own data
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
    
    const { startDate, endDate, includePending } = req.query;
    const options = {
      startDate: startDate || null,
      endDate: endDate || null,
      includePending: includePending === 'true'
    };
    
    const transactions = Transaction.findByUserId(userId, options);
    
    // Get account information for each transaction
    const transactionsWithAccounts = transactions.map(transaction => {
      const account = Account.findById(transaction.account_id);
      return {
        ...transaction,
        account_type: account?.type || null,
        account_subtype: account?.subtype || null,
        amount: transaction.amount, // Keep as is (negative for debits)
      };
    });
    
    res.json({
      success: true,
      transactions: transactionsWithAccounts,
      count: transactionsWithAccounts.length
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /transactions/:user_id/insights
 * Get spending insights and analytics for a user
 * Query params: startDate, endDate
 */
router.get('/:user_id/insights', (req, res, next) => {
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
    
    // Note: Spending insights don't require consent - users can view their own data
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
    
    // Default to last 30 days if not specified
    const endDate = req.query.endDate || new Date().toISOString().split('T')[0];
    const startDate = req.query.startDate || (() => {
      const date = new Date(endDate);
      date.setDate(date.getDate() - 30);
      return date.toISOString().split('T')[0];
    })();
    
    // Get all transactions
    const transactions = Transaction.findByUserId(userId, {
      startDate,
      endDate,
      includePending: false
    });
    
    // Calculate spending insights
    const spending = transactions.filter(t => t.amount < 0).map(t => ({
      ...t,
      amount: Math.abs(t.amount) // Convert to positive for spending
    }));
    
    const income = transactions.filter(t => t.amount > 0);
    
    // Total spending and income
    const totalSpending = spending.reduce((sum, t) => sum + t.amount, 0);
    const totalIncome = income.reduce((sum, t) => sum + t.amount, 0);
    
    // Spending by category
    const spendingByCategory = {};
    spending.forEach(transaction => {
      const category = transaction.personal_finance_category_primary || 'Uncategorized';
      if (!spendingByCategory[category]) {
        spendingByCategory[category] = {
          category,
          amount: 0,
          count: 0,
          transactions: []
        };
      }
      spendingByCategory[category].amount += transaction.amount;
      spendingByCategory[category].count += 1;
      spendingByCategory[category].transactions.push(transaction);
    });
    
    // Sort categories by amount
    const categoryBreakdown = Object.values(spendingByCategory)
      .sort((a, b) => b.amount - a.amount);
    
    // Top merchants
    const merchantSpending = {};
    spending.forEach(transaction => {
      const merchant = transaction.merchant_name || 'Unknown';
      if (!merchantSpending[merchant]) {
        merchantSpending[merchant] = {
          merchant,
          amount: 0,
          count: 0
        };
      }
      merchantSpending[merchant].amount += transaction.amount;
      merchantSpending[merchant].count += 1;
    });
    
    const topMerchants = Object.values(merchantSpending)
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 10);
    
    // Daily spending trends (last 30 days)
    const dailySpending = {};
    spending.forEach(transaction => {
      const date = transaction.date;
      if (!dailySpending[date]) {
        dailySpending[date] = 0;
      }
      dailySpending[date] += transaction.amount;
    });
    
    // Monthly spending (last 6 months)
    const monthlySpending = {};
    spending.forEach(transaction => {
      const month = transaction.date.substring(0, 7); // YYYY-MM
      if (!monthlySpending[month]) {
        monthlySpending[month] = 0;
      }
      monthlySpending[month] += transaction.amount;
    });
    
    // Average transaction amount
    const avgTransactionAmount = spending.length > 0 
      ? totalSpending / spending.length 
      : 0;
    
    // Largest transaction
    const largestTransaction = spending.length > 0
      ? spending.reduce((max, t) => t.amount > max.amount ? t : max, spending[0])
      : null;
    
    res.json({
      success: true,
      insights: {
        period: {
          startDate,
          endDate
        },
        summary: {
          totalSpending,
          totalIncome,
          netFlow: totalIncome - totalSpending,
          transactionCount: spending.length,
          incomeCount: income.length,
          avgTransactionAmount,
          largestTransaction: largestTransaction ? {
            amount: largestTransaction.amount,
            merchant: largestTransaction.merchant_name,
            date: largestTransaction.date,
            category: largestTransaction.personal_finance_category_primary
          } : null
        },
        categoryBreakdown,
        topMerchants,
        trends: {
          daily: dailySpending,
          monthly: monthlySpending
        }
      }
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;

