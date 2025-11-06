/**
 * Unit tests for AI Budget Generation Service
 */

const { generateBudget, generateGoals, analyzeSpendingByCategory } = require('../../src/services/ai/budgetGenerator');
const Transaction = require('../../src/models/Transaction');
const Account = require('../../src/models/Account');
const User = require('../../src/models/User');
const { hasAIConsent, grantAIConsent } = require('../../src/services/guardrails/aiConsentChecker');

// Mock dependencies
jest.mock('../../src/services/ai/openaiClient');
jest.mock('../../src/services/ai/promptTemplates');
jest.mock('../../src/services/ai/utils');
jest.mock('../../src/models/Transaction');
jest.mock('../../src/models/Account');
jest.mock('../../src/models/User');
jest.mock('../../src/services/guardrails/aiConsentChecker');

describe('Budget Generation Service', () => {
  const testUserId = 1;
  const mockTransactions = [
    { amount: -100, date: '2024-01-01', personal_finance_category_primary: 'FOOD_AND_DRINK' },
    { amount: -50, date: '2024-01-02', personal_finance_category_primary: 'TRANSPORTATION' },
    { amount: 2000, date: '2024-01-15', personal_finance_category_primary: 'INCOME' },
    { amount: -200, date: '2024-01-20', personal_finance_category_primary: 'FOOD_AND_DRINK' }
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    grantAIConsent(testUserId);
  });

  describe('analyzeSpendingByCategory', () => {
    test('should analyze spending patterns correctly', () => {
      Transaction.findByUserId = jest.fn().mockReturnValue(mockTransactions);

      const analysis = analyzeSpendingByCategory(testUserId, 90);

      expect(analysis).toHaveProperty('totalIncome');
      expect(analysis).toHaveProperty('totalExpenses');
      expect(analysis).toHaveProperty('avgMonthlyIncome');
      expect(analysis).toHaveProperty('avgMonthlyExpenses');
      expect(analysis).toHaveProperty('categoryBreakdown');
      expect(analysis.categoryBreakdown).toBeInstanceOf(Array);
      expect(analysis.hasEnoughData).toBe(true);
    });

    test('should return hasEnoughData false for insufficient transactions', () => {
      Transaction.findByUserId = jest.fn().mockReturnValue(mockTransactions.slice(0, 2));

      const analysis = analyzeSpendingByCategory(testUserId, 90);

      expect(analysis.hasEnoughData).toBe(false);
    });

    test('should group expenses by category', () => {
      Transaction.findByUserId = jest.fn().mockReturnValue(mockTransactions);

      const analysis = analyzeSpendingByCategory(testUserId, 90);

      const foodCategory = analysis.categoryBreakdown.find(cat => cat.category === 'FOOD_AND_DRINK');
      expect(foodCategory).toBeDefined();
      expect(foodCategory.total).toBeGreaterThan(0);
    });
  });

  describe('generateBudget', () => {
    test('should require AI consent', async () => {
      hasAIConsent.mockReturnValue(false);
      Transaction.findByUserId = jest.fn().mockReturnValue(mockTransactions);

      await expect(generateBudget(testUserId)).rejects.toThrow('AI consent is required');
    });

    test('should handle insufficient data gracefully', async () => {
      hasAIConsent.mockReturnValue(true);
      Transaction.findByUserId = jest.fn().mockReturnValue([]);
      User.findById = jest.fn().mockReturnValue({ user_id: testUserId });
      Account.findByUserId = jest.fn().mockReturnValue([]);

      const { getCachedOrGenerate } = require('../../src/services/ai/utils');
      getCachedOrGenerate.mockImplementation(async (key, fn) => await fn());

      const result = await generateBudget(testUserId);

      expect(result.success).toBe(false);
      expect(result.error).toBe('insufficient_data');
    });

    test('should generate budget with valid data', async () => {
      hasAIConsent.mockReturnValue(true);
      Transaction.findByUserId = jest.fn().mockReturnValue(mockTransactions);
      User.findById = jest.fn().mockReturnValue({ user_id: testUserId });
      Account.findByUserId = jest.fn().mockReturnValue([{ current_balance: 1000 }]);

      const { getOpenAIClient } = require('../../src/services/ai/openaiClient');
      const { getBudgetPrompt } = require('../../src/services/ai/promptTemplates');
      const { getCachedOrGenerate } = require('../../src/services/ai/utils');

      const mockOpenAI = {
        chat: {
          completions: {
            create: jest.fn().mockResolvedValue({
              choices: [{
                message: {
                  content: JSON.stringify({
                    categories: [
                      { category: 'FOOD_AND_DRINK', monthly_limit: 300, current_avg: 250, rationale: 'Based on your spending' }
                    ],
                    monthly_savings_target: 500,
                    emergency_fund_goal: 6000,
                    rationale: 'Budget rationale'
                  })
                }
              }]
            })
          }
        }
      };

      getOpenAIClient.mockReturnValue(mockOpenAI);
      getBudgetPrompt.mockReturnValue({ system: 'System prompt', user: 'User prompt' });
      getCachedOrGenerate.mockImplementation(async (key, fn) => await fn());

      const result = await generateBudget(testUserId);

      expect(result.success).toBe(true);
      expect(result.categories).toBeDefined();
      expect(result.monthly_savings_target).toBeDefined();
      expect(result.emergency_fund_goal).toBeDefined();
    });
  });

  describe('generateGoals', () => {
    test('should require AI consent', async () => {
      hasAIConsent.mockReturnValue(false);
      Transaction.findByUserId = jest.fn().mockReturnValue(mockTransactions);

      await expect(generateGoals(testUserId)).rejects.toThrow('AI consent is required');
    });

    test('should generate goals with valid data', async () => {
      hasAIConsent.mockReturnValue(true);
      Transaction.findByUserId = jest.fn().mockReturnValue(mockTransactions);
      User.findById = jest.fn().mockReturnValue({ user_id: testUserId });
      Account.findByUserId = jest.fn().mockReturnValue([{ current_balance: 1000 }]);

      const { getOpenAIClient } = require('../../src/services/ai/openaiClient');
      const { getGoalPrompt } = require('../../src/services/ai/promptTemplates');
      const { getCachedOrGenerate } = require('../../src/services/ai/utils');

      const mockOpenAI = {
        chat: {
          completions: {
            create: jest.fn().mockResolvedValue({
              choices: [{
                message: {
                  content: JSON.stringify({
                    goals: [
                      {
                        name: 'Emergency Fund',
                        target_amount: 6000,
                        current_progress: 1000,
                        target_date: '2024-12-31',
                        timeframe: 'medium_term',
                        rationale: 'Build emergency fund'
                      }
                    ],
                    rationale: 'Goals rationale'
                  })
                }
              }]
            })
          }
        }
      };

      getOpenAIClient.mockReturnValue(mockOpenAI);
      getGoalPrompt.mockReturnValue({ system: 'System prompt', user: 'User prompt' });
      getCachedOrGenerate.mockImplementation(async (key, fn) => await fn());

      const result = await generateGoals(testUserId);

      expect(result.success).toBe(true);
      expect(result.goals).toBeDefined();
      expect(Array.isArray(result.goals)).toBe(true);
    });
  });
});

