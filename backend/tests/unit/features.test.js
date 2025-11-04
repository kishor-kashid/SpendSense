/**
 * Unit tests for feature detection services
 * Starting with subscription detection tests
 */

// Use test database for tests
process.env.DB_PATH = './data/test_database.sqlite';

const { initializeDatabase, closeDatabase } = require('../../src/config/database');
const { User, Account, Transaction, Liability } = require('../../src/models');
const {
  analyzeSubscriptions,
  analyzeSubscriptionsForUser,
  detectRecurringMerchants,
  calculateCadence,
  calculateMonthlyRecurringSpend,
  calculateSubscriptionShare,
  getDateRange
} = require('../../src/services/features/subscriptionDetector');
const {
  analyzeSavings,
  analyzeSavingsForUser,
  calculateNetInflow,
  calculateGrowthRate,
  calculateAverageMonthlyExpenses,
  calculateEmergencyFundCoverage
} = require('../../src/services/features/savingsAnalyzer');
const {
  analyzeCredit,
  analyzeCreditForUser,
  calculateUtilization,
  detectMinimumPaymentOnly,
  detectInterestCharges,
  checkOverdueStatus
} = require('../../src/services/features/creditAnalyzer');
const {
  analyzeIncome,
  analyzeIncomeForUser,
  detectPayrollTransactions,
  calculatePaymentFrequency,
  calculateCashFlowBuffer
} = require('../../src/services/features/incomeAnalyzer');

describe('Subscription Detection', () => {
  let testUserId;
  let testAccountId;

  beforeAll(async () => {
    // Initialize test database (uses separate test_database.sqlite)
    await initializeDatabase();
    
    // Create a test user
    const uniqueId = Date.now();
    const user = User.create({
      name: 'Test User',
      first_name: 'Test',
      last_name: 'User',
      username: `testuser${uniqueId}`,
      password: 'testuser123',
      consent_status: 'granted'
    });
    testUserId = user.user_id;

    // Create a test account with unique ID
    const account = Account.create({
      account_id: `test_acc_001_${Date.now()}_${Math.random()}`,
      user_id: testUserId,
      type: 'depository',
      subtype: 'checking',
      available_balance: 5000,
      current_balance: 5000,
      credit_limit: null,
      iso_currency_code: 'USD',
      holder_category: 'consumer'
    });
    testAccountId = account.account_id;
  });

  afterAll(() => {
    // Clean up test database
    const fs = require('fs');
    const path = require('path');
    const testDbPath = path.join(__dirname, '../../data/test_database.sqlite');
    closeDatabase();
    
    // Delete test database file after tests
    if (fs.existsSync(testDbPath)) {
      try {
        fs.unlinkSync(testDbPath);
      } catch (error) {
        // Ignore cleanup errors
      }
    }
  });

  beforeEach(() => {
    // Clean up transactions before each test
    const { getDatabase } = require('../../src/config/database');
    const db = getDatabase();
    db.prepare('DELETE FROM transactions WHERE account_id = ?').run(testAccountId);
  });

  describe('getDateRange', () => {
    test('should return correct date range for 30 days', () => {
      const range = getDateRange(30);
      expect(range.startDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(range.endDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      
      const start = new Date(range.startDate);
      const end = new Date(range.endDate);
      const diffDays = Math.ceil((end - start) / (1000 * 60 * 60 * 24));
      // Allow 30 or 31 days due to time-of-day differences and inclusive range
      expect(diffDays).toBeGreaterThanOrEqual(30);
      expect(diffDays).toBeLessThanOrEqual(31);
    });
  });

  describe('detectRecurringMerchants', () => {
    test('should detect merchant with 3+ occurrences', () => {
      const today = new Date();
      const dates = [];
      for (let i = 0; i < 3; i++) {
        const date = new Date(today);
        date.setDate(date.getDate() - (i * 30)); // 30 days apart
        dates.push(date.toISOString().split('T')[0]);
      }

      dates.forEach(date => {
        Transaction.create({
          transaction_id: `txn_${date}_${Math.random()}`,
          account_id: testAccountId,
          date: date,
          amount: -15.99,
          merchant_name: 'Netflix',
          pending: 0
        });
      });

      const merchants = detectRecurringMerchants(
        testUserId,
        dates[dates.length - 1],
        dates[0]
      );

      expect(merchants.length).toBeGreaterThanOrEqual(1);
      const netflix = merchants.find(m => m.merchant_name === 'Netflix');
      expect(netflix).toBeDefined();
      expect(netflix.count).toBe(3);
    });

    test('should not detect merchant with less than 3 occurrences', () => {
      const today = new Date();
      const dates = [];
      for (let i = 0; i < 2; i++) {
        const date = new Date(today);
        date.setDate(date.getDate() - (i * 30));
        dates.push(date.toISOString().split('T')[0]);
      }

      dates.forEach(date => {
        Transaction.create({
          transaction_id: `txn_${date}_${Math.random()}`,
          account_id: testAccountId,
          date: date,
          amount: -15.99,
          merchant_name: 'Spotify',
          pending: 0
        });
      });

      const merchants = detectRecurringMerchants(
        testUserId,
        dates[dates.length - 1],
        dates[0]
      );

      const spotify = merchants.find(m => m.merchant_name === 'Spotify');
      expect(spotify).toBeUndefined();
    });

    test('should ignore income transactions', () => {
      const today = new Date();
      for (let i = 0; i < 5; i++) {
        const date = new Date(today);
        date.setDate(date.getDate() - (i * 30));
        Transaction.create({
          transaction_id: `txn_${date}_${Math.random()}`,
          account_id: testAccountId,
          date: date.toISOString().split('T')[0],
          amount: 1000, // Positive = income
          merchant_name: 'Payroll Deposit',
          pending: 0
        });
      }

      const merchants = detectRecurringMerchants(
        testUserId,
        new Date(today.getTime() - 150 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        today.toISOString().split('T')[0]
      );

      const payroll = merchants.find(m => m.merchant_name === 'Payroll Deposit');
      expect(payroll).toBeUndefined();
    });
  });

  describe('calculateCadence', () => {
    test('should identify monthly cadence', () => {
      const transactions = [
        { date: '2024-01-01', amount: 15.99 },
        { date: '2024-02-01', amount: 15.99 },
        { date: '2024-03-01', amount: 15.99 }
      ];

      const cadence = calculateCadence(transactions);
      expect(cadence.cadence).toBe('monthly');
      expect(cadence.avgDaysBetween).toBeGreaterThanOrEqual(25);
      expect(cadence.avgDaysBetween).toBeLessThanOrEqual(35);
    });

    test('should identify weekly cadence', () => {
      const transactions = [
        { date: '2024-01-01', amount: 10.00 },
        { date: '2024-01-08', amount: 10.00 },
        { date: '2024-01-15', amount: 10.00 }
      ];

      const cadence = calculateCadence(transactions);
      expect(cadence.cadence).toBe('weekly');
      expect(cadence.avgDaysBetween).toBeGreaterThanOrEqual(5);
      expect(cadence.avgDaysBetween).toBeLessThanOrEqual(10);
    });

    test('should identify irregular cadence', () => {
      const transactions = [
        { date: '2024-01-01', amount: 50.00 },
        { date: '2024-01-05', amount: 50.00 },
        { date: '2024-02-20', amount: 50.00 }
      ];

      const cadence = calculateCadence(transactions);
      expect(cadence.cadence).toBe('irregular');
    });

    test('should handle single transaction', () => {
      const transactions = [
        { date: '2024-01-01', amount: 15.99 }
      ];

      const cadence = calculateCadence(transactions);
      expect(cadence.cadence).toBe('irregular');
      expect(cadence.avgDaysBetween).toBeNull();
    });
  });

  describe('calculateMonthlyRecurringSpend', () => {
    test('should calculate monthly spend for monthly subscription', () => {
      const merchant = {
        total_spend: 47.97, // 3 months * 15.99
        count: 3
      };
      const cadenceInfo = { cadence: 'monthly', avgDaysBetween: 30 };

      const monthlySpend = calculateMonthlyRecurringSpend(merchant, cadenceInfo);
      expect(monthlySpend).toBeCloseTo(15.99, 2);
    });

    test('should calculate monthly spend for weekly subscription', () => {
      const merchant = {
        total_spend: 40.00, // 4 weeks * 10.00
        count: 4
      };
      const cadenceInfo = { cadence: 'weekly', avgDaysBetween: 7 };

      const monthlySpend = calculateMonthlyRecurringSpend(merchant, cadenceInfo);
      expect(monthlySpend).toBeCloseTo(43.3, 1); // 10 * 4.33
    });
  });

  describe('calculateSubscriptionShare', () => {
    test('should calculate correct subscription share', () => {
      const subscriptionSpend = 50;
      const totalSpend = 500;
      const share = calculateSubscriptionShare(subscriptionSpend, totalSpend);
      expect(share).toBe(0.1); // 10%
    });

    test('should return 0 when total spend is 0', () => {
      const share = calculateSubscriptionShare(50, 0);
      expect(share).toBe(0);
    });

    test('should handle 100% subscription share', () => {
      const share = calculateSubscriptionShare(100, 100);
      expect(share).toBe(1.0);
    });
  });

  describe('analyzeSubscriptions', () => {
    test('should analyze subscriptions for 30-day window', () => {
      const today = new Date();
      const dates = [];
      
      // Create 3 monthly subscriptions
      for (let i = 0; i < 3; i++) {
        const date = new Date(today);
        date.setDate(date.getDate() - (i * 30));
        dates.push(date.toISOString().split('T')[0]);
        
        Transaction.create({
          transaction_id: `txn_sub_${i}`,
          account_id: testAccountId,
          date: date.toISOString().split('T')[0],
          amount: -15.99,
          merchant_name: 'Netflix',
          pending: 0
        });
      }

      // Add some other expenses
      for (let i = 0; i < 5; i++) {
        const date = new Date(today);
        date.setDate(date.getDate() - (i * 5));
        Transaction.create({
          transaction_id: `txn_other_${i}`,
          account_id: testAccountId,
          date: date.toISOString().split('T')[0],
          amount: -50.00,
          merchant_name: 'Grocery Store',
          pending: 0
        });
      }

      const analysis = analyzeSubscriptions(testUserId, 30);
      
      expect(analysis.window_days).toBe(30);
      expect(analysis.recurring_merchants.length).toBeGreaterThanOrEqual(0);
      expect(analysis.total_spend).toBeGreaterThan(0);
      expect(analysis.subscription_share).toBeGreaterThanOrEqual(0);
      expect(analysis.subscription_share).toBeLessThanOrEqual(1);
    });

    test('should handle user with no subscriptions', () => {
      // Create only one-time transactions
      const today = new Date();
      for (let i = 0; i < 5; i++) {
        const date = new Date(today);
        date.setDate(date.getDate() - (i * 10));
        Transaction.create({
          transaction_id: `txn_one_${i}`,
          account_id: testAccountId,
          date: date.toISOString().split('T')[0],
          amount: -50.00,
          merchant_name: `Store ${i}`,
          pending: 0
        });
      }

      const analysis = analyzeSubscriptions(testUserId, 30);
      
      expect(analysis.recurring_merchants.length).toBe(0);
      expect(analysis.total_subscription_spend).toBe(0);
      expect(analysis.subscription_share).toBe(0);
    });
  });

  describe('analyzeSubscriptionsForUser', () => {
    test('should analyze both 30-day and 180-day windows', () => {
      const today = new Date();
      
      // Create subscriptions spanning multiple months
      for (let i = 0; i < 6; i++) {
        const date = new Date(today);
        date.setDate(date.getDate() - (i * 30));
        Transaction.create({
          transaction_id: `txn_multi_${i}`,
          account_id: testAccountId,
          date: date.toISOString().split('T')[0],
          amount: -15.99,
          merchant_name: 'Netflix',
          pending: 0
        });
      }

      const analysis = analyzeSubscriptionsForUser(testUserId);
      
      expect(analysis.user_id).toBe(testUserId);
      expect(analysis.short_term).toBeDefined();
      expect(analysis.long_term).toBeDefined();
      expect(analysis.short_term.window_days).toBe(30);
      expect(analysis.long_term.window_days).toBe(180);
      expect(typeof analysis.has_recurring_subscriptions).toBe('boolean');
      expect(typeof analysis.meets_subscription_threshold).toBe('boolean');
    });
  });

  describe('Edge Cases', () => {
    test('should handle user with no transactions', () => {
      const analysis = analyzeSubscriptions(testUserId, 30);
      
      expect(analysis.recurring_merchants.length).toBe(0);
      expect(analysis.total_spend).toBe(0);
      expect(analysis.subscription_share).toBe(0);
    });

    test('should handle transactions with null merchant names', () => {
      const today = new Date();
      Transaction.create({
        transaction_id: 'txn_null_merchant',
        account_id: testAccountId,
        date: today.toISOString().split('T')[0],
        amount: -50.00,
        merchant_name: null,
        pending: 0
      });

      const merchants = detectRecurringMerchants(
        testUserId,
        new Date(today.getTime() - 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        today.toISOString().split('T')[0]
      );

      // Should not crash and should not include null merchant
      expect(Array.isArray(merchants)).toBe(true);
    });

    test('should handle pending transactions correctly', () => {
      const today = new Date();
      for (let i = 0; i < 3; i++) {
        const date = new Date(today);
        date.setDate(date.getDate() - (i * 30));
        Transaction.create({
          transaction_id: `txn_pending_${i}`,
          account_id: testAccountId,
          date: date.toISOString().split('T')[0],
          amount: -15.99,
          merchant_name: 'Subscription',
          pending: 1 // Pending transactions should be excluded
        });
      }

      const merchants = detectRecurringMerchants(
        testUserId,
        new Date(today.getTime() - 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        today.toISOString().split('T')[0]
      );

      const subscription = merchants.find(m => m.merchant_name === 'Subscription');
      expect(subscription).toBeUndefined();
    });
  });
});

describe('Savings Detection', () => {
  let testUserId;
  let testSavingsAccountId;
  let testCheckingAccountId;

  beforeAll(async () => {
    await initializeDatabase();
    
    const uniqueId = Date.now();
    const user = User.create({
      name: 'Savings Test User',
      first_name: 'Savings',
      last_name: 'Test',
      username: `savingstest${uniqueId}`,
      password: 'savingstest123',
      consent_status: 'granted'
    });
    testUserId = user.user_id;

    // Create savings account with unique ID
    const savingsAccount = Account.create({
      account_id: `test_savings_001_${Date.now()}_${Math.random()}`,
      user_id: testUserId,
      type: 'depository',
      subtype: 'savings',
      available_balance: 5000,
      current_balance: 5000,
      credit_limit: null,
      iso_currency_code: 'USD',
      holder_category: 'consumer'
    });
    testSavingsAccountId = savingsAccount.account_id;

    // Create checking account for expenses with unique ID
    const checkingAccount = Account.create({
      account_id: `test_checking_001_${Date.now()}_${Math.random()}`,
      user_id: testUserId,
      type: 'depository',
      subtype: 'checking',
      available_balance: 2000,
      current_balance: 2000,
      credit_limit: null,
      iso_currency_code: 'USD',
      holder_category: 'consumer'
    });
    testCheckingAccountId = checkingAccount.account_id;
  });

  afterAll(() => {
    closeDatabase();
  });

  beforeEach(() => {
    const { getDatabase } = require('../../src/config/database');
    const db = getDatabase();
    db.prepare('DELETE FROM transactions WHERE account_id IN (?, ?)').run(testSavingsAccountId, testCheckingAccountId);
  });

  describe('calculateNetInflow', () => {
    test('should calculate net inflow correctly', () => {
      const today = new Date();
      const startDate = new Date(today);
      startDate.setDate(startDate.getDate() - 30);

      // Add deposits (inflow)
      Transaction.create({
        transaction_id: 'txn_deposit_1',
        account_id: testSavingsAccountId,
        date: startDate.toISOString().split('T')[0],
        amount: 500,
        pending: 0
      });

      Transaction.create({
        transaction_id: 'txn_deposit_2',
        account_id: testSavingsAccountId,
        date: today.toISOString().split('T')[0],
        amount: 300,
        pending: 0
      });

      // Add withdrawal (outflow)
      Transaction.create({
        transaction_id: 'txn_withdrawal_1',
        account_id: testSavingsAccountId,
        date: today.toISOString().split('T')[0],
        amount: -100,
        pending: 0
      });

      const result = calculateNetInflow(
        testUserId,
        startDate.toISOString().split('T')[0],
        today.toISOString().split('T')[0]
      );

      expect(result.net_inflow).toBe(700); // 500 + 300 - 100
      expect(result.total_inflow).toBe(800);
      expect(result.total_outflow).toBe(100);
    });

    test('should return zero for user with no savings accounts', async () => {
      const uniqueId = Date.now();
      const newUser = User.create({
        name: 'No Savings User',
        first_name: 'No',
        last_name: 'Savings',
        username: `nosavings${uniqueId}`,
        password: 'nosavings123',
        consent_status: 'granted'
      });

      const today = new Date();
      const startDate = new Date(today);
      startDate.setDate(startDate.getDate() - 30);

      const result = calculateNetInflow(
        newUser.user_id,
        startDate.toISOString().split('T')[0],
        today.toISOString().split('T')[0]
      );

      expect(result.net_inflow).toBe(0);
      expect(result.account_count).toBe(0);
    });
  });

  describe('calculateGrowthRate', () => {
    test('should calculate growth rate correctly', () => {
      const growthRate = calculateGrowthRate(5000, 500, 30);
      expect(typeof growthRate).toBe('number');
      expect(growthRate).toBeGreaterThanOrEqual(0);
    });

    test('should handle zero starting balance', () => {
      const growthRate = calculateGrowthRate(1000, 1000, 30);
      expect(growthRate).toBeGreaterThanOrEqual(0);
    });
  });

  describe('calculateEmergencyFundCoverage', () => {
    test('should calculate emergency fund coverage correctly', () => {
      const coverage = calculateEmergencyFundCoverage(6000, 2000);
      expect(coverage).toBe(3); // 3 months
    });

    test('should return 0 for zero expenses', () => {
      const coverage = calculateEmergencyFundCoverage(5000, 0);
      expect(coverage).toBe(0);
    });
  });

  describe('analyzeSavings', () => {
    test('should analyze savings for 30-day window', () => {
      const today = new Date();
      
      // Add savings deposits
      for (let i = 0; i < 4; i++) {
        const date = new Date(today);
        date.setDate(date.getDate() - (i * 7));
        Transaction.create({
          transaction_id: `txn_savings_${i}`,
          account_id: testSavingsAccountId,
          date: date.toISOString().split('T')[0],
          amount: 200,
          pending: 0
        });
      }

      // Add expenses to checking account
      for (let i = 0; i < 10; i++) {
        const date = new Date(today);
        date.setDate(date.getDate() - (i * 3));
        Transaction.create({
          transaction_id: `txn_expense_${i}`,
          account_id: testCheckingAccountId,
          date: date.toISOString().split('T')[0],
          amount: -100,
          pending: 0
        });
      }

      const analysis = analyzeSavings(testUserId, 30);

      expect(analysis.window_days).toBe(30);
      expect(analysis.savings_account_count).toBeGreaterThan(0);
      expect(analysis.net_inflow).toBeGreaterThanOrEqual(0);
      expect(analysis.growth_rate).toBeGreaterThanOrEqual(0);
      expect(analysis.emergency_fund_coverage_months).toBeGreaterThanOrEqual(0);
      expect(typeof analysis.meets_threshold).toBe('boolean');
    });

    test('should handle user with no savings accounts', () => {
      const uniqueId = Date.now() + 1;
      const newUser = User.create({
        name: 'No Savings User 2',
        first_name: 'No',
        last_name: 'Savings2',
        username: `nosavings2${uniqueId}`,
        password: 'nosavings2123',
        consent_status: 'granted'
      });

      const analysis = analyzeSavings(newUser.user_id, 30);

      expect(analysis.savings_account_count).toBe(0);
      expect(analysis.net_inflow).toBe(0);
    });
  });

  describe('analyzeSavingsForUser', () => {
    test('should analyze both 30-day and 180-day windows', () => {
      const analysis = analyzeSavingsForUser(testUserId);

      expect(analysis.user_id).toBe(testUserId);
      expect(analysis.short_term).toBeDefined();
      expect(analysis.long_term).toBeDefined();
      expect(analysis.short_term.window_days).toBe(30);
      expect(analysis.long_term.window_days).toBe(180);
      expect(typeof analysis.has_savings_accounts).toBe('boolean');
      expect(typeof analysis.meets_savings_threshold).toBe('boolean');
    });
  });
});

describe('Credit Detection', () => {
  let testUserId;
  let testCreditCardId;

  beforeAll(async () => {
    await initializeDatabase();
    
    const uniqueId = Date.now();
    const user = User.create({
      name: 'Credit Test User',
      first_name: 'Credit',
      last_name: 'Test',
      username: `credittest${uniqueId}`,
      password: 'credittest123',
      consent_status: 'granted'
    });
    testUserId = user.user_id;

    // Create credit card account with unique ID
    const creditAccount = Account.create({
      account_id: `test_credit_001_${Date.now()}_${Math.random()}`,
      user_id: testUserId,
      type: 'credit',
      subtype: 'credit card',
      available_balance: 2000,
      current_balance: 3000,
      credit_limit: 5000,
      iso_currency_code: 'USD',
      holder_category: 'consumer'
    });
    testCreditCardId = creditAccount.account_id;

    // Create liability for the credit card with unique ID
    Liability.create({
      liability_id: `test_liability_001_${Date.now()}_${Math.random()}`,
      account_id: testCreditCardId,
      apr_type: 'purchase',
      apr_percentage: 18.5,
      minimum_payment_amount: 50,
      last_payment_amount: 50,
      is_overdue: 0,
      last_statement_balance: 3000,
      next_payment_due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    });
  });

  afterAll(() => {
    closeDatabase();
  });

  describe('calculateUtilization', () => {
    test('should calculate utilization correctly', () => {
      const account = Account.findById(testCreditCardId);
      const liability = Liability.findByAccountId(testCreditCardId);
      
      const utilization = calculateUtilization(account, liability);

      expect(utilization.utilization).toBe(0.6); // 3000 / 5000 = 60%
      expect(utilization.utilization_percentage).toBe(60);
      expect(utilization.utilization_level).toBe('medium');
      expect(utilization.is_medium_utilization).toBe(true);
      expect(utilization.is_high_utilization).toBe(false);
    });

    test('should handle zero limit', () => {
      const account = Account.findById(testCreditCardId);
      account.credit_limit = 0;
      
      const utilization = calculateUtilization(account, null);
      expect(utilization.utilization).toBe(0);
    });
  });

  describe('detectMinimumPaymentOnly', () => {
    test('should detect minimum payment only behavior', () => {
      const liability = Liability.findByAccountId(testCreditCardId);
      const isMinimumOnly = detectMinimumPaymentOnly(liability);

      expect(typeof isMinimumOnly).toBe('boolean');
      // In this case, last_payment equals minimum, so should be true
      expect(isMinimumOnly).toBe(true);
    });

    test('should return false for larger payments', () => {
      const liability = {
        minimum_payment_amount: 50,
        last_payment_amount: 200
      };
      expect(detectMinimumPaymentOnly(liability)).toBe(false);
    });
  });

  describe('checkOverdueStatus', () => {
    test('should detect overdue status', () => {
      // Use existing liability and update it, or use object literal
      const overdueLiability = {
        liability_id: 'test_overdue_001',
        account_id: testCreditCardId,
        is_overdue: 1,
        last_statement_balance: 1000
      };

      expect(checkOverdueStatus(overdueLiability)).toBe(true);
    });

    test('should check overdue by due date', () => {
      const pastDate = new Date();
      pastDate.setDate(pastDate.getDate() - 5);
      
      const liability = {
        is_overdue: 0,
        next_payment_due_date: pastDate.toISOString().split('T')[0]
      };

      expect(checkOverdueStatus(liability)).toBe(true);
    });
  });

  describe('analyzeCredit', () => {
    test('should analyze credit for 30-day window', () => {
      const analysis = analyzeCredit(testUserId, 30);

      expect(analysis.window_days).toBe(30);
      expect(analysis.credit_card_count).toBeGreaterThan(0);
      expect(analysis.cards.length).toBeGreaterThan(0);
      expect(typeof analysis.has_high_utilization).toBe('boolean');
      expect(typeof analysis.has_medium_utilization).toBe('boolean');
      expect(typeof analysis.has_overdue).toBe('boolean');
      expect(typeof analysis.meets_threshold).toBe('boolean');
    });

    test('should handle user with no credit cards', () => {
      const uniqueId = Date.now();
      const newUser = User.create({
        name: 'No Credit User',
        first_name: 'No',
        last_name: 'Credit',
        username: `nocredit${uniqueId}`,
        password: 'nocredit123',
        consent_status: 'granted'
      });

      const analysis = analyzeCredit(newUser.user_id, 30);

      expect(analysis.credit_card_count).toBe(0);
      expect(analysis.cards.length).toBe(0);
      expect(analysis.meets_threshold).toBe(false);
    });
  });

  describe('analyzeCreditForUser', () => {
    test('should analyze both 30-day and 180-day windows', () => {
      const analysis = analyzeCreditForUser(testUserId);

      expect(analysis.user_id).toBe(testUserId);
      expect(analysis.short_term).toBeDefined();
      expect(analysis.long_term).toBeDefined();
      expect(analysis.short_term.window_days).toBe(30);
      expect(analysis.long_term.window_days).toBe(180);
      expect(typeof analysis.has_credit_cards).toBe('boolean');
      expect(typeof analysis.meets_credit_threshold).toBe('boolean');
    });
  });
});

describe('Income Detection', () => {
  let testUserId;
  let testCheckingAccountId;

  beforeAll(async () => {
    await initializeDatabase();
    
    const uniqueId = Date.now();
    const user = User.create({
      name: 'Income Test User',
      first_name: 'Income',
      last_name: 'Test',
      username: `incometest${uniqueId}`,
      password: 'incometest123',
      consent_status: 'granted'
    });
    testUserId = user.user_id;

    // Create checking account with unique ID
    const checkingAccount = Account.create({
      account_id: `test_checking_income_${Date.now()}_${Math.random()}`,
      user_id: testUserId,
      type: 'depository',
      subtype: 'checking',
      available_balance: 3000,
      current_balance: 3000,
      credit_limit: null,
      iso_currency_code: 'USD',
      holder_category: 'consumer'
    });
    testCheckingAccountId = checkingAccount.account_id;
  });

  afterAll(() => {
    closeDatabase();
  });

  beforeEach(() => {
    const { getDatabase } = require('../../src/config/database');
    const db = getDatabase();
    db.prepare('DELETE FROM transactions WHERE account_id = ?').run(testCheckingAccountId);
  });

  describe('detectPayrollTransactions', () => {
    test('should detect payroll transactions', () => {
      const today = new Date();
      const startDate = new Date(today);
      startDate.setDate(startDate.getDate() - 60);

      // Create payroll transaction
      Transaction.create({
        transaction_id: 'txn_payroll_1',
        account_id: testCheckingAccountId,
        date: today.toISOString().split('T')[0],
        amount: 3000,
        merchant_name: 'ACME Corp Payroll',
        payment_channel: 'ach',
        personal_finance_category_primary: 'INCOME',
        pending: 0
      });

      const payroll = detectPayrollTransactions(
        testUserId,
        startDate.toISOString().split('T')[0],
        today.toISOString().split('T')[0]
      );

      expect(payroll.length).toBeGreaterThan(0);
      expect(payroll[0].amount).toBeGreaterThan(0);
    });

    test('should filter out non-payroll transactions', () => {
      const today = new Date();
      const startDate = new Date(today);
      startDate.setDate(startDate.getDate() - 30);

      // Create non-payroll transaction
      Transaction.create({
        transaction_id: 'txn_not_payroll',
        account_id: testCheckingAccountId,
        date: today.toISOString().split('T')[0],
        amount: -100,
        merchant_name: 'Grocery Store',
        pending: 0
      });

      const payroll = detectPayrollTransactions(
        testUserId,
        startDate.toISOString().split('T')[0],
        today.toISOString().split('T')[0]
      );

      expect(payroll.length).toBe(0);
    });
  });

  describe('calculatePaymentFrequency', () => {
    test('should calculate payment frequency for bi-weekly payments', () => {
      const today = new Date();
      const payrollTransactions = [];

      // Create bi-weekly payments (14 days apart)
      for (let i = 0; i < 4; i++) {
        const date = new Date(today);
        date.setDate(date.getDate() - (i * 14));
        payrollTransactions.push({
          date: date.toISOString().split('T')[0],
          amount: 2000
        });
      }

      const frequency = calculatePaymentFrequency(payrollTransactions);

      expect(frequency.frequency).toBe('bi-weekly');
      expect(frequency.median_pay_gap_days).toBe(14);
      expect(frequency.payment_count).toBe(4);
    });

    test('should handle irregular payments', () => {
      const payrollTransactions = [
        { date: '2024-01-01', amount: 2000 },
        { date: '2024-02-15', amount: 2000 }, // 45 days later
        { date: '2024-03-01', amount: 2000 }, // 15 days later
        { date: '2024-04-20', amount: 2000 }  // 50 days later (more irregular)
      ];

      const frequency = calculatePaymentFrequency(payrollTransactions);

      // With gaps [45, 15, 50], median is 45 which is outside regular ranges
      expect(frequency.frequency).toBe('irregular');
      expect(frequency.median_pay_gap_days).toBeGreaterThan(0);
    });
  });

  describe('calculateCashFlowBuffer', () => {
    test('should calculate cash flow buffer correctly', () => {
      const today = new Date();
      const startDate = new Date(today);
      startDate.setDate(startDate.getDate() - 30);

      // Add expenses
      for (let i = 0; i < 10; i++) {
        const date = new Date(startDate);
        date.setDate(startDate.getDate() + (i * 3));
        Transaction.create({
          transaction_id: `txn_exp_${i}`,
          account_id: testCheckingAccountId,
          date: date.toISOString().split('T')[0],
          amount: -200,
          pending: 0
        });
      }

      const buffer = calculateCashFlowBuffer(
        testUserId,
        startDate.toISOString().split('T')[0],
        today.toISOString().split('T')[0]
      );

      expect(buffer).toBeGreaterThan(0);
      expect(typeof buffer).toBe('number');
    });
  });

  describe('analyzeIncome', () => {
    test('should analyze income for 30-day window', () => {
      const today = new Date();

      // Create bi-weekly payroll
      for (let i = 0; i < 2; i++) {
        const date = new Date(today);
        date.setDate(date.getDate() - (i * 14));
        Transaction.create({
          transaction_id: `txn_pay_${i}`,
          account_id: testCheckingAccountId,
          date: date.toISOString().split('T')[0],
          amount: 2500,
          merchant_name: 'Employer Payroll',
          payment_channel: 'ach',
          pending: 0
        });
      }

      // Add expenses
      for (let i = 0; i < 5; i++) {
        const date = new Date(today);
        date.setDate(date.getDate() - (i * 6));
        Transaction.create({
          transaction_id: `txn_exp_${i}`,
          account_id: testCheckingAccountId,
          date: date.toISOString().split('T')[0],
          amount: -300,
          pending: 0
        });
      }

      const analysis = analyzeIncome(testUserId, 30);

      expect(analysis.window_days).toBe(30);
      expect(analysis.payroll_transaction_count).toBeGreaterThan(0);
      expect(analysis.total_payroll_income).toBeGreaterThan(0);
      expect(analysis.avg_monthly_income).toBeGreaterThan(0);
      expect(typeof analysis.payment_frequency).toBe('string');
      expect(analysis.median_pay_gap_days).toBeGreaterThanOrEqual(0);
      expect(analysis.cash_flow_buffer_months).toBeGreaterThanOrEqual(0);
      expect(typeof analysis.meets_threshold).toBe('boolean');
    });

    test('should handle user with no payroll income', () => {
      const uniqueId = Date.now();
      const newUser = User.create({
        name: 'No Income User',
        first_name: 'No',
        last_name: 'Income',
        username: `noincome${uniqueId}`,
        password: 'noincome123',
        consent_status: 'granted'
      });

      const analysis = analyzeIncome(newUser.user_id, 30);

      expect(analysis.payroll_transaction_count).toBe(0);
      expect(analysis.total_payroll_income).toBe(0);
    });
  });

  describe('analyzeIncomeForUser', () => {
    test('should analyze both 30-day and 180-day windows', () => {
      const analysis = analyzeIncomeForUser(testUserId);

      expect(analysis.user_id).toBe(testUserId);
      expect(analysis.short_term).toBeDefined();
      expect(analysis.long_term).toBeDefined();
      expect(analysis.short_term.window_days).toBe(30);
      expect(analysis.long_term.window_days).toBe(180);
      expect(typeof analysis.has_payroll_income).toBe('boolean');
      expect(typeof analysis.meets_income_threshold).toBe('boolean');
    });
  });
});

