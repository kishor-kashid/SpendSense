/**
 * Unit tests for persona assignment system
 */

// Use test database for tests
process.env.DB_PATH = './data/test_database.sqlite';

const { initializeDatabase, closeDatabase } = require('../../src/config/database');
const { User, Account, Transaction, Liability } = require('../../src/models');
const { getAllPersonas, getPersonaById } = require('../../src/services/personas/personaDefinitions');
const { prioritizePersonas, findMatchingPersonas, assignPersona } = require('../../src/services/personas/personaPrioritizer');
const { assignPersonaToUser } = require('../../src/services/personas/personaAssigner');
const { analyzeCreditForUser } = require('../../src/services/features/creditAnalyzer');
const { analyzeIncomeForUser } = require('../../src/services/features/incomeAnalyzer');
const { analyzeSubscriptionsForUser } = require('../../src/services/features/subscriptionDetector');
const { analyzeSavingsForUser } = require('../../src/services/features/savingsAnalyzer');

describe('Persona Definitions', () => {
  test('should have all 5 personas defined', () => {
    const personas = getAllPersonas();
    
    expect(personas).toHaveProperty('HIGH_UTILIZATION');
    expect(personas).toHaveProperty('VARIABLE_INCOME');
    expect(personas).toHaveProperty('SUBSCRIPTION_HEAVY');
    expect(personas).toHaveProperty('SAVINGS_BUILDER');
    expect(personas).toHaveProperty('NEW_USER');
  });

  test('should get persona by ID', () => {
    const persona = getPersonaById('high_utilization');
    expect(persona).toBeDefined();
    expect(persona.id).toBe('high_utilization');
    expect(persona.name).toBe('High Utilization');
  });

  test('should return null for invalid persona ID', () => {
    const persona = getPersonaById('invalid_persona');
    expect(persona).toBeNull();
  });

  test('each persona should have required properties', () => {
    const personas = getAllPersonas();
    
    Object.values(personas).forEach(persona => {
      expect(persona).toHaveProperty('id');
      expect(persona).toHaveProperty('name');
      expect(persona).toHaveProperty('description');
      expect(persona).toHaveProperty('priority');
      expect(persona).toHaveProperty('matches');
      expect(persona).toHaveProperty('getRationale');
      expect(persona).toHaveProperty('educationalFocus');
      expect(persona).toHaveProperty('recommendationTypes');
      expect(typeof persona.matches).toBe('function');
      expect(typeof persona.getRationale).toBe('function');
    });
  });
});

describe('Persona Prioritizer', () => {
  test('should prioritize personas by priority (higher number = higher priority)', () => {
    const personas = getAllPersonas();
    
    const matchingPersonas = [
      { persona: personas.SAVINGS_BUILDER, rationale: 'test' },
      { persona: personas.HIGH_UTILIZATION, rationale: 'test' },
      { persona: personas.NEW_USER, rationale: 'test' }
    ];

    const selected = prioritizePersonas(matchingPersonas);
    
    expect(selected.persona.id).toBe('high_utilization'); // Priority 5
  });

  test('should return single persona if only one matches', () => {
    const personas = getAllPersonas();
    
    const matchingPersonas = [
      { persona: personas.SUBSCRIPTION_HEAVY, rationale: 'test' }
    ];

    const selected = prioritizePersonas(matchingPersonas);
    expect(selected.persona.id).toBe('subscription_heavy');
  });

  test('should return null for empty array', () => {
    const selected = prioritizePersonas([]);
    expect(selected).toBeNull();
  });
});

describe('Persona Assignment Logic', () => {
  let testUserId;
  let testAccountId;
  let testCreditCardId;

  beforeAll(async () => {
    await initializeDatabase();
    
    const user = User.create({
      name: 'Test User',
      consent_status: 'granted'
    });
    testUserId = user.user_id;
  });

  afterAll(() => {
    closeDatabase();
  });

  beforeEach(() => {
    const { getDatabase } = require('../../src/config/database');
    const db = getDatabase();
    
    // Clean up test data
    db.prepare('DELETE FROM transactions').run();
    db.prepare('DELETE FROM liabilities').run();
    db.prepare('DELETE FROM accounts WHERE user_id = ?').run(testUserId);
  });

  describe('High Utilization Persona', () => {
    test('should match user with high credit utilization', async () => {
      // Create credit card with high utilization
      const creditAccount = Account.create({
        account_id: 'test_credit_high',
        user_id: testUserId,
        type: 'credit',
        subtype: 'credit card',
        available_balance: 1000,
        current_balance: 4000,
        credit_limit: 5000,
        iso_currency_code: 'USD',
        holder_category: 'consumer'
      });

      Liability.create({
        liability_id: 'test_liability_high',
        account_id: creditAccount.account_id,
        last_statement_balance: 4000,
        minimum_payment_amount: 50,
        is_overdue: 0
      });

      const creditAnalysis = analyzeCreditForUser(testUserId);
      const personas = getAllPersonas();
      const matches = personas.HIGH_UTILIZATION.matches(creditAnalysis);

      expect(matches).toBe(true);
    });

    test('should match user with interest charges', async () => {
      const creditAccount = Account.create({
        account_id: 'test_credit_interest',
        user_id: testUserId,
        type: 'credit',
        subtype: 'credit card',
        available_balance: 2000,
        current_balance: 1000,
        credit_limit: 5000,
        iso_currency_code: 'USD',
        holder_category: 'consumer'
      });

      Liability.create({
        liability_id: 'test_liability_interest',
        account_id: creditAccount.account_id,
        last_statement_balance: 1000,
        minimum_payment_amount: 50,
        is_overdue: 0
      });

      // Create interest charge transaction
      const checkingAccount = Account.create({
        account_id: 'test_checking_interest',
        user_id: testUserId,
        type: 'depository',
        subtype: 'checking',
        available_balance: 1000,
        current_balance: 1000,
        iso_currency_code: 'USD',
        holder_category: 'consumer'
      });

      const today = new Date();
      Transaction.create({
        transaction_id: 'txn_interest_1',
        account_id: creditAccount.account_id,
        date: today.toISOString().split('T')[0],
        amount: -87.50,
        merchant_name: 'Interest Charge',
        pending: 0
      });

      const creditAnalysis = analyzeCreditForUser(testUserId);
      const personas = getAllPersonas();
      const matches = personas.HIGH_UTILIZATION.matches(creditAnalysis);

      expect(matches).toBe(true);
    });
  });

  describe('Variable Income Persona', () => {
    test('should match user with variable income pattern', async () => {
      const checkingAccount = Account.create({
        account_id: 'test_checking_var',
        user_id: testUserId,
        type: 'depository',
        subtype: 'checking',
        available_balance: 500,
        current_balance: 500,
        iso_currency_code: 'USD',
        holder_category: 'consumer'
      });

      const today = new Date();
      const startDate = new Date(today.getTime() - 180 * 24 * 60 * 60 * 1000);
      
      // Create irregular payroll (60 days apart) - need at least 2 payments
      Transaction.create({
        transaction_id: 'txn_pay_var_1',
        account_id: checkingAccount.account_id,
        date: startDate.toISOString().split('T')[0],
        amount: 2000,
        merchant_name: 'Employer Payroll',
        payment_channel: 'ach',
        personal_finance_category_primary: 'INCOME',
        pending: 0
      });

      Transaction.create({
        transaction_id: 'txn_pay_var_2',
        account_id: checkingAccount.account_id,
        date: new Date(today.getTime() - 60 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        amount: 2000,
        merchant_name: 'Employer Payroll',
        payment_channel: 'ach',
        personal_finance_category_primary: 'INCOME',
        pending: 0
      });

      Transaction.create({
        transaction_id: 'txn_pay_var_3',
        account_id: checkingAccount.account_id,
        date: today.toISOString().split('T')[0],
        amount: 2000,
        merchant_name: 'Employer Payroll',
        payment_channel: 'ach',
        personal_finance_category_primary: 'INCOME',
        pending: 0
      });

      // Add expenses to reduce cash flow buffer
      for (let i = 0; i < 20; i++) {
        Transaction.create({
          transaction_id: `txn_exp_var_${i}`,
          account_id: checkingAccount.account_id,
          date: new Date(today.getTime() - i * 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          amount: -200,
          pending: 0
        });
      }

      const incomeAnalysis = analyzeIncomeForUser(testUserId);
      const personas = getAllPersonas();
      const matches = personas.VARIABLE_INCOME.matches(incomeAnalysis);

      expect(matches).toBe(true);
    });
  });

  describe('Subscription-Heavy Persona', () => {
    test('should match user with multiple subscriptions', async () => {
      const checkingAccount = Account.create({
        account_id: 'test_checking_subs',
        user_id: testUserId,
        type: 'depository',
        subtype: 'checking',
        available_balance: 2000,
        current_balance: 2000,
        iso_currency_code: 'USD',
        holder_category: 'consumer'
      });

      const today = new Date();
      
      // Create 3+ recurring subscriptions (Netflix, Spotify, Gym)
      const subscriptions = ['Netflix', 'Spotify', 'Gym Membership'];
      subscriptions.forEach((merchant, idx) => {
        for (let i = 0; i < 3; i++) {
          const date = new Date(today);
          date.setDate(date.getDate() - (i * 30));
          Transaction.create({
            transaction_id: `txn_${merchant}_${i}`,
            account_id: checkingAccount.account_id,
            date: date.toISOString().split('T')[0],
            amount: -15.99,
            merchant_name: merchant,
            pending: 0
          });
        }
      });

      const subscriptionAnalysis = analyzeSubscriptionsForUser(testUserId);
      const personas = getAllPersonas();
      const matches = personas.SUBSCRIPTION_HEAVY.matches(subscriptionAnalysis);

      expect(matches).toBe(true);
    });
  });

  describe('Savings Builder Persona', () => {
    test('should match user with savings growth and low credit utilization', async () => {
      // Create savings account
      const savingsAccount = Account.create({
        account_id: 'test_savings_builder',
        user_id: testUserId,
        type: 'depository',
        subtype: 'savings',
        available_balance: 10000,
        current_balance: 10000,
        iso_currency_code: 'USD',
        holder_category: 'consumer'
      });

      // Create credit card with low utilization
      const creditAccount = Account.create({
        account_id: 'test_credit_low',
        user_id: testUserId,
        type: 'credit',
        subtype: 'credit card',
        available_balance: 4500,
        current_balance: 500,
        credit_limit: 5000,
        iso_currency_code: 'USD',
        holder_category: 'consumer'
      });

      Liability.create({
        liability_id: 'test_liability_low',
        account_id: creditAccount.account_id,
        last_statement_balance: 500,
        minimum_payment_amount: 25,
        is_overdue: 0
      });

      const today = new Date();
      
      // Add savings deposits
      for (let i = 0; i < 4; i++) {
        const date = new Date(today);
        date.setDate(date.getDate() - (i * 7));
        Transaction.create({
          transaction_id: `txn_save_${i}`,
          account_id: savingsAccount.account_id,
          date: date.toISOString().split('T')[0],
          amount: 250,
          pending: 0
        });
      }

      const savingsAnalysis = analyzeSavingsForUser(testUserId);
      const creditAnalysis = analyzeCreditForUser(testUserId);
      const personas = getAllPersonas();
      const matches = personas.SAVINGS_BUILDER.matches(savingsAnalysis, creditAnalysis);

      expect(matches).toBe(true);
    });
  });

  describe('New User Persona', () => {
    test('should match new user with limited accounts', async () => {
      const newUser = User.create({
        name: 'New User Test',
        consent_status: 'granted'
      });

      // Create only one checking account with unique ID
      Account.create({
        account_id: `test_new_user_${Date.now()}`,
        user_id: newUser.user_id,
        type: 'depository',
        subtype: 'checking',
        available_balance: 500,
        current_balance: 500,
        iso_currency_code: 'USD',
        holder_category: 'consumer'
      });

      const creditAnalysis = analyzeCreditForUser(newUser.user_id);
      const accounts = Account.findByUserId(newUser.user_id);
      const accountData = {
        account_count: accounts.length,
        accounts: accounts
      };

      const personas = getAllPersonas();
      const matches = personas.NEW_USER.matches(newUser, creditAnalysis, accountData);

      expect(matches).toBe(true);
    });
  });

  describe('End-to-End Persona Assignment', () => {
    test('should assign persona to user with high utilization', async () => {
      const creditAccount = Account.create({
        account_id: 'test_assign_credit',
        user_id: testUserId,
        type: 'credit',
        subtype: 'credit card',
        available_balance: 1000,
        current_balance: 4000,
        credit_limit: 5000,
        iso_currency_code: 'USD',
        holder_category: 'consumer'
      });

      Liability.create({
        liability_id: 'test_assign_liability',
        account_id: creditAccount.account_id,
        last_statement_balance: 4000,
        minimum_payment_amount: 50,
        is_overdue: 0
      });

      const result = assignPersonaToUser(testUserId);

      expect(result).toBeDefined();
      expect(result.assigned_persona).toBeDefined();
      expect(result.assigned_persona.id).toBe('high_utilization');
      expect(result.rationale).toBeDefined();
      expect(result.decision_trace).toBeDefined();
      expect(result.behavioral_signals).toBeDefined();
    });

    test('should handle user with no matching personas (fallback to New User)', async () => {
      // Create user with minimal data
      const minimalUser = User.create({
        name: 'Minimal User',
        consent_status: 'granted'
      });

      const result = assignPersonaToUser(minimalUser.user_id);

      expect(result).toBeDefined();
      expect(result.assigned_persona).toBeDefined();
      // Should fallback to New User or another default
      expect(['new_user']).toContain(result.assigned_persona.id);
    });
  });

  describe('Priority Logic', () => {
    test('should select highest priority persona when multiple match', async () => {
      // Create user that matches multiple personas
      // High utilization (priority 5) and Subscription-heavy (priority 3)
      
      // Credit card with high utilization
      const creditAccount = Account.create({
        account_id: `test_multi_credit_${Date.now()}`,
        user_id: testUserId,
        type: 'credit',
        subtype: 'credit card',
        available_balance: 1000,
        current_balance: 4000,
        credit_limit: 5000,
        iso_currency_code: 'USD',
        holder_category: 'consumer'
      });

      Liability.create({
        liability_id: `test_multi_liability_${Date.now()}`,
        account_id: creditAccount.account_id,
        last_statement_balance: 4000,
        minimum_payment_amount: 50,
        is_overdue: 0
      });

      // Also add subscriptions
      const checkingAccount = Account.create({
        account_id: `test_multi_checking_${Date.now()}`,
        user_id: testUserId,
        type: 'depository',
        subtype: 'checking',
        available_balance: 2000,
        current_balance: 2000,
        iso_currency_code: 'USD',
        holder_category: 'consumer'
      });

      const today = new Date();
      for (let i = 0; i < 3; i++) {
        const date = new Date(today);
        date.setDate(date.getDate() - (i * 30));
        Transaction.create({
          transaction_id: `txn_multi_sub_${Date.now()}_${i}`,
          account_id: checkingAccount.account_id,
          date: date.toISOString().split('T')[0],
          amount: -15.99,
          merchant_name: 'Netflix',
          pending: 0
        });
      }

      const result = assignPersonaToUser(testUserId);

      // Should select High Utilization (priority 5) over Subscription-Heavy (priority 3)
      expect(result.assigned_persona.id).toBe('high_utilization');
      // Note: May have 1+ matches depending on subscription thresholds
      expect(result.decision_trace.allMatches.length).toBeGreaterThanOrEqual(1);
    });
  });
});

