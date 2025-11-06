/**
 * Unit tests for Predictive Financial Insights
 */

// Use test database for tests
process.env.DB_PATH = './data/test_database.sqlite';

const { initializeDatabase, closeDatabase } = require('../../src/config/database');
const { User } = require('../../src/models');
const Transaction = require('../../src/models/Transaction');
const Account = require('../../src/models/Account');
const AIConsent = require('../../src/models/AIConsent');
const {
  generatePredictiveInsights,
  generateMultiHorizonPredictions,
  analyzeTransactionPatterns
} = require('../../src/services/ai/predictiveInsights');
const { grantAIConsent } = require('../../src/services/guardrails/aiConsentChecker');
const { grantConsent } = require('../../src/services/guardrails/consentChecker');

// Mock OpenAI client
jest.mock('../../src/services/ai/openaiClient', () => {
  const mockResponse = {
    choices: [{
      message: {
        content: JSON.stringify({
          summary: 'Based on your spending patterns, you are projected to have positive cash flow over the next 30 days.',
          predicted_income: 5000,
          predicted_expenses: 3500,
          predicted_net_flow: 1500,
          confidence_level: 'high',
          stress_points: [],
          recommendations: ['Continue current spending patterns', 'Consider increasing savings']
        })
      }
    }]
  };

  return {
    getOpenAIClient: jest.fn(() => ({
      chat: {
        completions: {
          create: jest.fn().mockResolvedValue(mockResponse)
        }
      }
    })),
    isConfigured: jest.fn(() => true)
  };
});

// Mock cache
jest.mock('../../src/utils/cache', () => {
  const cache = new Map();
  return {
    get: jest.fn((key) => cache.get(key) || null),
    set: jest.fn((key, value, ttl) => {
      cache.set(key, value);
      return value;
    }),
    delete: jest.fn((key) => cache.delete(key))
  };
});

// Mock AI utils
jest.mock('../../src/services/ai/utils', () => {
  const originalModule = jest.requireActual('../../src/services/ai/utils');
  return {
    ...originalModule,
    getCachedOrGenerate: jest.fn(async (key, fn) => await fn()),
    sanitizeDataForAI: jest.fn((data) => data),
    handleAIError: jest.fn((error) => ({ code: 'ERROR', message: error.message })),
    clearAICache: jest.fn()
  };
});

describe('Predictive Financial Insights', () => {
  let testUserId;

  const mockTransactions = [
    { amount: -100, date: '2024-01-01', personal_finance_category_primary: 'FOOD_AND_DRINK' },
    { amount: -50, date: '2024-01-02', personal_finance_category_primary: 'TRANSPORTATION' },
    { amount: 2000, date: '2024-01-15', personal_finance_category_primary: 'INCOME' },
    { amount: -200, date: '2024-01-20', personal_finance_category_primary: 'SHOPPING' }
  ];

  const mockAccounts = [
    { account_id: 'acc1', current_balance: 5000 },
    { account_id: 'acc2', current_balance: 1000 }
  ];

  beforeAll(async () => {
    await initializeDatabase();
    
    // Create test user
    const uniqueId = Date.now();
    const user = User.create({
      name: 'Predictive Insights Test User',
      first_name: 'Predictive',
      last_name: 'Insights',
      username: `predictivetest${uniqueId}`,
      password: 'predictivetest123',
      consent_status: 'revoked'
    });
    testUserId = user.user_id;

    // Grant both consents
    grantConsent(testUserId);
    grantAIConsent(testUserId);
  });

  afterAll(async () => {
    await closeDatabase();
  });

  describe('analyzeTransactionPatterns', () => {
    test('should analyze transaction patterns correctly', () => {
      const patterns = analyzeTransactionPatterns(testUserId, 90);
      
      expect(patterns).toBeDefined();
      expect(patterns).toHaveProperty('lookbackDays');
      expect(patterns).toHaveProperty('totalIncome');
      expect(patterns).toHaveProperty('totalExpenses');
      expect(patterns).toHaveProperty('netFlow');
      expect(patterns).toHaveProperty('avgDailyIncome');
      expect(patterns).toHaveProperty('avgDailyExpenses');
      expect(patterns).toHaveProperty('avgDailyNetFlow');
      expect(patterns).toHaveProperty('topCategories');
      expect(patterns).toHaveProperty('incomeFrequency');
    });

    test('should handle users with no transactions', () => {
      // This should work even if user has no transactions
      const patterns = analyzeTransactionPatterns(testUserId, 90);
      
      expect(patterns.totalIncome).toBeGreaterThanOrEqual(0);
      expect(patterns.totalExpenses).toBeGreaterThanOrEqual(0);
      expect(patterns.netFlow).toBeDefined();
    });
  });

  describe('generatePredictiveInsights', () => {
    test('should throw error when AI consent not granted', async () => {
      // Revoke AI consent
      AIConsent.revoke(testUserId);

      await expect(generatePredictiveInsights(testUserId, 30)).rejects.toThrow('AI consent');

      // Restore AI consent
      grantAIConsent(testUserId);
    });

    test('should throw error for invalid horizon', async () => {
      await expect(generatePredictiveInsights(testUserId, 15)).rejects.toThrow('Invalid prediction horizon');
    });

    test('should generate predictions for valid horizon', async () => {
      const predictions = await generatePredictiveInsights(testUserId, 30);
      
      expect(predictions).toBeDefined();
      expect(predictions.horizon_days).toBe(30);
      expect(predictions).toHaveProperty('predictions');
      expect(predictions).toHaveProperty('stress_points');
      expect(predictions).toHaveProperty('recommendations');
      expect(predictions.predictions).toHaveProperty('predicted_income');
      expect(predictions.predictions).toHaveProperty('predicted_expenses');
      expect(predictions.predictions).toHaveProperty('predicted_net_flow');
      expect(predictions.predictions).toHaveProperty('predicted_end_balance');
      expect(predictions.predictions).toHaveProperty('confidence_level');
    });

    test('should generate predictions for 7 days', async () => {
      const predictions = await generatePredictiveInsights(testUserId, 7);
      
      expect(predictions.horizon_days).toBe(7);
      expect(predictions.predictions).toBeDefined();
    });

    test('should generate predictions for 90 days', async () => {
      const predictions = await generatePredictiveInsights(testUserId, 90);
      
      expect(predictions.horizon_days).toBe(90);
      expect(predictions.predictions).toBeDefined();
    });
  });

  describe('generateMultiHorizonPredictions', () => {
    test('should generate predictions for all horizons', async () => {
      const predictions = await generateMultiHorizonPredictions(testUserId, [7, 30, 90]);
      
      expect(predictions).toBeDefined();
      expect(predictions.user_id).toBe(testUserId);
      expect(predictions.horizons).toEqual([7, 30, 90]);
      expect(predictions.predictions).toHaveProperty('7_days');
      expect(predictions.predictions).toHaveProperty('30_days');
      expect(predictions.predictions).toHaveProperty('90_days');
    });

    test('should handle partial failures gracefully', async () => {
      // Mock getCachedOrGenerate to throw error for 30-day horizon
      const { getCachedOrGenerate } = require('../../src/services/ai/utils');
      getCachedOrGenerate.mockImplementation(async (key, fn) => {
        // For horizon 30, throw error
        if (key.includes('predictions:') && key.includes(':30')) {
          throw new Error('API Error for 30 days');
        }
        // Otherwise execute the function
        return await fn();
      });

      Transaction.findByUserId = jest.fn().mockReturnValue(mockTransactions);
      Account.findByUserId = jest.fn().mockReturnValue(mockAccounts);

      const predictions = await generateMultiHorizonPredictions(testUserId, [7, 30, 90]);
      
      expect(predictions.predictions['7_days']).toBeDefined();
      expect(predictions.predictions['30_days']).toHaveProperty('error');
      expect(predictions.predictions['90_days']).toBeDefined();
    });
  });
});

