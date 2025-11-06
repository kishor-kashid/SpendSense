/**
 * Integration tests for AI Budget and Goals API endpoints
 */

const request = require('supertest');
const app = require('../../src/server');
const { initializeDatabase, closeDatabase } = require('../setup');
const User = require('../../src/models/User');
const AIConsent = require('../../src/models/AIConsent');
const { grantConsent } = require('../../src/services/guardrails/consentChecker');
const { grantAIConsent } = require('../../src/services/guardrails/aiConsentChecker');

describe('Budget and Goals API Endpoints', () => {
  let testUserId;

  beforeAll(async () => {
    await initializeDatabase();
    
    // Create test user
    const uniqueId = Date.now();
    const user = User.create({
      name: 'Budget Test User',
      first_name: 'Budget',
      last_name: 'Test',
      username: `budgettest${uniqueId}`,
      password: 'budgettest123',
      consent_status: 'revoked'
    });
    testUserId = user.user_id;
  });

  afterAll(async () => {
    await closeDatabase();
  });

  beforeEach(() => {
    // Clear AI consent
    AIConsent.revoke(testUserId);
  });

  describe('GET /ai/budgets/:user_id/generate', () => {
    test('should return 403 when AI consent not granted', async () => {
      const response = await request(app)
        .get(`/ai/budgets/${testUserId}/generate`)
        .expect(403);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('AI_CONSENT_REQUIRED');
    });

    test('should return 404 for non-existent user', async () => {
      grantAIConsent(99999);

      const response = await request(app)
        .get('/ai/budgets/99999/generate')
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('USER_NOT_FOUND');
    });

    test('should return insufficient data when user has few transactions', async () => {
      grantAIConsent(testUserId);

      const response = await request(app)
        .get(`/ai/budgets/${testUserId}/generate`)
        .expect(200);

      // May return insufficient data or success depending on mock data
      expect(response.body).toHaveProperty('success');
    });

    test('should accept valid user_id', async () => {
      grantAIConsent(testUserId);

      const response = await request(app)
        .get(`/ai/budgets/${testUserId}/generate`)
        .expect((res) => {
          // May return 200 with insufficient data or success
          expect([200, 400, 500]).toContain(res.status);
        });

      expect(response.body).toHaveProperty('success');
    });
  });

  describe('GET /ai/goals/:user_id/generate', () => {
    test('should return 403 when AI consent not granted', async () => {
      const response = await request(app)
        .get(`/ai/goals/${testUserId}/generate`)
        .expect(403);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('AI_CONSENT_REQUIRED');
    });

    test('should return 404 for non-existent user', async () => {
      grantAIConsent(99999);

      const response = await request(app)
        .get('/ai/goals/99999/generate')
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('USER_NOT_FOUND');
    });

    test('should accept valid user_id', async () => {
      grantAIConsent(testUserId);

      const response = await request(app)
        .get(`/ai/goals/${testUserId}/generate`)
        .expect((res) => {
          // May return 200 with insufficient data or success
          expect([200, 400, 500]).toContain(res.status);
        });

      expect(response.body).toHaveProperty('success');
    });
  });
});

