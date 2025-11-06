/**
 * Unit tests for AI Rationale Generation
 */

// Use test database for tests
process.env.DB_PATH = './data/test_database.sqlite';

const { initializeDatabase, closeDatabase } = require('../../src/config/database');
const { User } = require('../../src/models');
const AIConsent = require('../../src/models/AIConsent');
const {
  generateAIRationale,
  validateAIRationale,
  generateAIRationalesForRecommendations
} = require('../../src/services/ai/rationaleGenerator');
const { grantAIConsent } = require('../../src/services/guardrails/aiConsentChecker');

// Mock OpenAI client - create mock functions that can be controlled in tests
const mockIsConfigured = jest.fn(() => true);
const mockGetOpenAIClient = jest.fn(() => {
  const mockResponse = {
    choices: [{
      message: {
        content: 'Based on your Subscription-Heavy profile, you have 5 subscriptions costing $75/month. This guide will help you optimize your subscription spending and potentially save money.'
      }
    }]
  };

  return {
    chat: {
      completions: {
        create: jest.fn().mockResolvedValue(mockResponse)
      }
    }
  };
});

jest.mock('../../src/services/ai/openaiClient', () => ({
  getOpenAIClient: (...args) => mockGetOpenAIClient(...args),
  isConfigured: (...args) => mockIsConfigured(...args),
  resetClient: jest.fn()
}));

// Mock cache - use a factory function to avoid TDZ issues
jest.mock('../../src/utils/cache', () => {
  const mockCacheMap = new Map();
  return {
    get: jest.fn((key) => mockCacheMap.get(key) || null),
    set: jest.fn((key, value, ttl) => {
      mockCacheMap.set(key, value);
      return value;
    }),
    delete: jest.fn((key) => mockCacheMap.delete(key)),
    cache: mockCacheMap, // Expose the Map for clearing
    clear: jest.fn(() => mockCacheMap.clear())
  };
});

describe('AI Rationale Generation', () => {
  let testUserId;
  let mockItem;
  let mockPersona;
  let mockBehavioralSignals;
  let mockUserData;

  beforeAll(async () => {
    await initializeDatabase();
    
    // Create test user
    const uniqueId = Date.now();
    const user = User.create({
      name: 'AI Rationale Test User',
      first_name: 'AIRationale',
      last_name: 'Test',
      username: `airationaletest${uniqueId}`,
      password: 'airationaletest123',
      consent_status: 'revoked'
    });
    testUserId = user.user_id;
  });

  afterAll(async () => {
    await closeDatabase();
  });

  beforeEach(() => {
    // Reset AI consent
    AIConsent.revoke(testUserId);
    
    // Clear cache using the mocked cache module
    const cache = require('../../src/utils/cache');
    if (cache.cache && cache.cache.clear) {
      cache.cache.clear();
    }
    
    // Clear cache using utility function
    const { clearAICache } = require('../../src/services/ai/utils');
    clearAICache(testUserId);
    
    // Reset mocks
    mockIsConfigured.mockReturnValue(true);
    mockGetOpenAIClient.mockReturnValue({
      chat: {
        completions: {
          create: jest.fn().mockResolvedValue({
            choices: [{
              message: {
                content: 'Based on your Subscription-Heavy profile, you have 5 subscriptions costing $75/month. This guide will help you optimize your subscription spending and potentially save money.'
              }
            }]
          })
        }
      }
    });

    // Mock recommendation item
    mockItem = {
      id: 'edu_001',
      title: 'How to Manage Subscriptions',
      description: 'A guide to subscription management',
      category: 'subscription_management',
      recommendation_types: ['subscription_management']
    };

    // Mock persona
    mockPersona = {
      type: 'subscription_heavy',
      name: 'Subscription-Heavy',
      description: 'User with high subscription spending'
    };

    // Mock behavioral signals
    mockBehavioralSignals = {
      subscriptions: {
        short_term: {
          recurring_merchants: ['Netflix', 'Spotify'],
          total_monthly_recurring_spend: 75.00,
          subscription_share_30d: 0.12
        }
      },
      credit: {
        short_term: {
          utilization_level: 'low',
          cards: []
        }
      },
      income: {
        short_term: {
          monthly_income: 5000,
          payment_frequency: 'monthly'
        }
      },
      savings: {
        short_term: {
          total_savings_balance: 10000
        }
      }
    };

    // Mock user data
    mockUserData = {
      user: { user_id: testUserId, name: 'Test User' },
      accounts: []
    };
  });

  describe('validateAIRationale', () => {
    test('should validate a good rationale', () => {
      const rationale = 'Based on your Subscription-Heavy profile, you have 5 subscriptions costing $75/month. This guide will help you optimize your spending.';
      const validation = validateAIRationale(rationale, mockItem);
      
      expect(validation.isValid).toBe(true);
      expect(validation.issues).toEqual([]);
    });

    test('should reject rationale that is too long', () => {
      const rationale = 'A'.repeat(600); // Over 500 characters
      const validation = validateAIRationale(rationale, mockItem);
      
      expect(validation.isValid).toBe(false);
      expect(validation.issues).toContain('Rationale is too long (exceeds 100 words)');
    });

    test('should reject rationale that is too short', () => {
      const rationale = 'Short';
      const validation = validateAIRationale(rationale, mockItem);
      
      expect(validation.isValid).toBe(false);
      expect(validation.issues).toContain('Rationale is too short');
    });

    test('should reject empty rationale', () => {
      const validation = validateAIRationale('', mockItem);
      
      expect(validation.isValid).toBe(false);
      expect(validation.issues).toContain('Rationale is empty or invalid');
    });
  });

  describe('generateAIRationale', () => {
    test('should return null when AI consent not granted', async () => {
      // Don't grant AI consent
      const rationale = await generateAIRationale({
        item: mockItem,
        type: 'education',
        persona: mockPersona,
        behavioralSignals: mockBehavioralSignals,
        userData: mockUserData,
        userId: testUserId
      });

      expect(rationale).toBeNull();
    });

    test('should generate rationale when AI consent is granted', async () => {
      // Grant AI consent
      grantAIConsent(testUserId);

      const rationale = await generateAIRationale({
        item: mockItem,
        type: 'education',
        persona: mockPersona,
        behavioralSignals: mockBehavioralSignals,
        userData: mockUserData,
        userId: testUserId
      });

      expect(rationale).toBeDefined();
      expect(typeof rationale).toBe('string');
      expect(rationale.length).toBeGreaterThan(0);
    });

    test('should return null when OpenAI is not configured', async () => {
      // Grant AI consent
      grantAIConsent(testUserId);

      // Clear cache to ensure no cached values
      const { clearAICache } = require('../../src/services/ai/utils');
      clearAICache(testUserId);

      // Mock isConfigured to return false
      mockIsConfigured.mockReturnValueOnce(false);

      const rationale = await generateAIRationale({
        item: mockItem,
        type: 'education',
        persona: mockPersona,
        behavioralSignals: mockBehavioralSignals,
        userData: mockUserData,
        userId: testUserId
      });

      expect(rationale).toBeNull();

      // Restore
      mockIsConfigured.mockReturnValue(true);
    });
  });

  describe('generateAIRationalesForRecommendations', () => {
    test('should generate AI rationales for multiple recommendations', async () => {
      // Grant AI consent
      grantAIConsent(testUserId);

      const recommendations = [
        {
          type: 'education',
          item: mockItem,
          rationale: 'Template rationale',
          persona: mockPersona,
          behavioralSignals: mockBehavioralSignals,
          userData: mockUserData
        },
        {
          type: 'offer',
          item: { ...mockItem, id: 'offer_001', title: 'Subscription Manager Tool' },
          rationale: 'Template rationale',
          persona: mockPersona,
          behavioralSignals: mockBehavioralSignals,
          userData: mockUserData
        }
      ];

      const result = await generateAIRationalesForRecommendations(recommendations, testUserId);

      expect(result).toHaveLength(2);
      expect(result[0].ai_rationale).toBeDefined();
      expect(result[1].ai_rationale).toBeDefined();
      expect(result[0].rationale).toBe('Template rationale'); // Template rationale preserved
      expect(result[1].rationale).toBe('Template rationale'); // Template rationale preserved
    });

    test('should handle failures gracefully', async () => {
      // Grant AI consent
      grantAIConsent(testUserId);

      // Clear cache to ensure no cached values
      const { clearAICache } = require('../../src/services/ai/utils');
      clearAICache(testUserId);

      const recommendations = [
        {
          type: 'education',
          item: mockItem,
          rationale: 'Template rationale',
          persona: mockPersona,
          behavioralSignals: mockBehavioralSignals,
          userData: mockUserData
        }
      ];

      // Mock OpenAI chat.completions.create to throw error
      const mockCreate = jest.fn().mockRejectedValue(new Error('API Error'));
      mockGetOpenAIClient.mockReturnValueOnce({
        chat: {
          completions: {
            create: mockCreate
          }
        }
      });

      const result = await generateAIRationalesForRecommendations(recommendations, testUserId);

      expect(result).toHaveLength(1);
      expect(result[0].ai_rationale).toBeNull(); // Should gracefully handle failure
      expect(result[0].rationale).toBe('Template rationale'); // Template rationale preserved

      // Restore - mock will be reset in beforeEach
    });
  });
});

