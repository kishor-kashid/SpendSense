/**
 * Integration tests for Predictive Insights API endpoints
 */

// Use test database for tests
process.env.DB_PATH = './data/test_database.sqlite';

const request = require('supertest');
const app = require('../../src/server');
const { initializeDatabase, closeDatabase } = require('../../src/config/database');
const { User } = require('../../src/models');
const AIConsent = require('../../src/models/AIConsent');
const { grantConsent } = require('../../src/services/guardrails/consentChecker');
const { grantAIConsent } = require('../../src/services/guardrails/aiConsentChecker');

// Mock OpenAI for integration tests
jest.mock('../../src/services/ai/openaiClient', () => {
  const mockResponse = {
    choices: [{
      message: {
        content: JSON.stringify({
          summary: 'Based on your spending patterns, you are projected to have positive cash flow.',
          predicted_income: 5000,
          predicted_expenses: 3500,
          predicted_net_flow: 1500,
          confidence_level: 'high',
          stress_points: [],
          recommendations: ['Continue current patterns']
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

describe('Predictive Insights API Integration Tests', () => {
  let testUserId;

  beforeAll(async () => {
    await initializeDatabase();
    
    // Create test user
    const uniqueId = Date.now();
    const user = User.create({
      name: 'Predictive API Test User',
      first_name: 'Predictive',
      last_name: 'APITest',
      username: `predictiveapitest${uniqueId}`,
      password: 'predictiveapitest123',
      consent_status: 'revoked'
    });
    testUserId = user.user_id;
  });

  afterAll(async () => {
    await closeDatabase();
  });

  beforeEach(() => {
    // Clear consents
    AIConsent.revoke(testUserId);
  });

  describe('GET /ai/predictions/:user_id', () => {
    test('should return predictions when only AI consent granted (independent of data processing consent)', async () => {
      // Don't grant data processing consent
      grantAIConsent(testUserId);

      const response = await request(app)
        .get(`/ai/predictions/${testUserId}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.predictions).toBeDefined();
      expect(response.body.predictions.horizon_days).toBe(30);
      expect(response.body.predictions.predictions).toBeDefined();
    });

    test('should return 403 when AI consent not granted', async () => {
      grantConsent(testUserId);
      // Don't grant AI consent

      const response = await request(app)
        .get(`/ai/predictions/${testUserId}`)
        .expect(403);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('AI_CONSENT_REQUIRED');
    });

    test('should return predictions when AI consent granted', async () => {
      grantAIConsent(testUserId);

      const response = await request(app)
        .get(`/ai/predictions/${testUserId}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.predictions).toBeDefined();
      expect(response.body.predictions.horizon_days).toBe(30);
      expect(response.body.predictions.predictions).toBeDefined();
    });

    test('should accept horizon query parameter', async () => {
      grantAIConsent(testUserId);

      const response = await request(app)
        .get(`/ai/predictions/${testUserId}?horizon=7`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.predictions.horizon_days).toBe(7);
    });

    test('should return 400 for invalid horizon', async () => {
      grantConsent(testUserId);
      grantAIConsent(testUserId);

      const response = await request(app)
        .get(`/ai/predictions/${testUserId}?horizon=15`)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('INVALID_HORIZON');
    });

    test('should return 400 for invalid user_id', async () => {
      const response = await request(app)
        .get('/ai/predictions/invalid')
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('INVALID_USER_ID');
    });

    test('should return 404 for non-existent user', async () => {
      grantAIConsent(99999);

      const response = await request(app)
        .get('/ai/predictions/99999')
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('USER_NOT_FOUND');
    });
  });

  describe('GET /ai/predictions/:user_id/all', () => {
    test('should return predictions for all horizons', async () => {
      grantConsent(testUserId);
      grantAIConsent(testUserId);

      const response = await request(app)
        .get(`/ai/predictions/${testUserId}/all`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.predictions).toBeDefined();
      expect(response.body.predictions.predictions).toHaveProperty('7_days');
      expect(response.body.predictions.predictions).toHaveProperty('30_days');
      expect(response.body.predictions.predictions).toHaveProperty('90_days');
    });

    test('should return 403 when AI consent not granted', async () => {
      // AI consent not granted
      const response = await request(app)
        .get(`/ai/predictions/${testUserId}/all`)
        .expect(403);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('AI_CONSENT_REQUIRED');
    });
  });
});

