/**
 * Integration tests for AI Consent API endpoints
 */

// Use test database for tests
process.env.DB_PATH = './data/test_database.sqlite';

const request = require('supertest');
const app = require('../../src/server');
const { initializeDatabase, closeDatabase } = require('../../src/config/database');
const { User } = require('../../src/models');
const AIConsent = require('../../src/models/AIConsent');

describe('AI Consent API Integration Tests', () => {
  let testUserId;

  beforeAll(async () => {
    await initializeDatabase();
    
    // Create test user
    const uniqueId = Date.now();
    const user = User.create({
      name: 'AI Consent API Test User',
      first_name: 'AIConsent',
      last_name: 'APITest',
      username: `aiconsentapitest${uniqueId}`,
      password: 'aiconsentapitest123',
      consent_status: 'revoked'
    });
    testUserId = user.user_id;
  });

  afterAll(async () => {
    await closeDatabase();
  });

  beforeEach(() => {
    // Clear AI consent before each test
    AIConsent.revoke(testUserId);
  });

  describe('POST /ai-consent', () => {
    test('should grant AI consent successfully', async () => {
      const response = await request(app)
        .post('/ai-consent')
        .send({ user_id: testUserId })
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('AI consent granted');
      expect(response.body.ai_consent).toBeDefined();
      expect(response.body.ai_consent.user_id).toBe(testUserId);
      expect(response.body.ai_consent.has_consent).toBe(true);
      expect(response.body.ai_consent.status).toBe('granted');
      expect(response.body.ai_consent.timestamp).toBeDefined();
    });

    test('should return 400 for invalid user_id', async () => {
      const response = await request(app)
        .post('/ai-consent')
        .send({ user_id: 'invalid' })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('INVALID_USER_ID');
    });

    test('should return 400 for missing user_id', async () => {
      const response = await request(app)
        .post('/ai-consent')
        .send({})
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    test('should return 404 for non-existent user', async () => {
      const response = await request(app)
        .post('/ai-consent')
        .send({ user_id: 99999 })
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('USER_NOT_FOUND');
    });

    test('should update existing AI consent when granting again', async () => {
      // Grant once
      await request(app)
        .post('/ai-consent')
        .send({ user_id: testUserId })
        .expect(201);

      // Grant again (should update timestamp)
      const response = await request(app)
        .post('/ai-consent')
        .send({ user_id: testUserId })
        .expect(201);

      expect(response.body.ai_consent.has_consent).toBe(true);
      expect(response.body.ai_consent.status).toBe('granted');
    });
  });

  describe('GET /ai-consent/:user_id', () => {
    test('should return AI consent status when granted', async () => {
      AIConsent.grant(testUserId);
      
      const response = await request(app)
        .get(`/ai-consent/${testUserId}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.ai_consent).toBeDefined();
      expect(response.body.ai_consent.user_id).toBe(testUserId);
      expect(response.body.ai_consent.has_consent).toBe(true);
      expect(response.body.ai_consent.status).toBe('granted');
      expect(response.body.ai_consent.message).toBeDefined();
      expect(response.body.ai_consent.timestamp).toBeDefined();
    });

    test('should return AI consent status when revoked', async () => {
      AIConsent.grant(testUserId);
      AIConsent.revoke(testUserId);
      
      const response = await request(app)
        .get(`/ai-consent/${testUserId}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.ai_consent.has_consent).toBe(false);
      expect(response.body.ai_consent.status).toBe('revoked');
    });

    test('should return no_consent status when no AI consent record exists', async () => {
      const response = await request(app)
        .get(`/ai-consent/${testUserId}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.ai_consent.has_consent).toBe(false);
      expect(response.body.ai_consent.status).toBe('no_consent');
      expect(response.body.ai_consent.message).toContain('No AI consent record found');
    });

    test('should return 400 for invalid user_id', async () => {
      const response = await request(app)
        .get('/ai-consent/invalid')
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('INVALID_USER_ID');
    });

    test('should return 404 for non-existent user', async () => {
      const response = await request(app)
        .get('/ai-consent/99999')
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('USER_NOT_FOUND');
    });
  });

  describe('DELETE /ai-consent/:user_id', () => {
    test('should revoke AI consent successfully', async () => {
      AIConsent.grant(testUserId);
      
      const response = await request(app)
        .delete(`/ai-consent/${testUserId}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('AI consent revoked');
      expect(response.body.ai_consent).toBeDefined();
      expect(response.body.ai_consent.user_id).toBe(testUserId);
      expect(response.body.ai_consent.has_consent).toBe(false);
      expect(response.body.ai_consent.status).toBe('revoked');
    });

    test('should return 400 for invalid user_id', async () => {
      const response = await request(app)
        .delete('/ai-consent/invalid')
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('INVALID_USER_ID');
    });

    test('should return 404 for non-existent user', async () => {
      const response = await request(app)
        .delete('/ai-consent/99999')
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('USER_NOT_FOUND');
    });
  });

  describe('AI Consent Workflow', () => {
    test('should handle complete AI consent lifecycle', async () => {
      // 1. Check initial status (no consent)
      let response = await request(app)
        .get(`/ai-consent/${testUserId}`)
        .expect(200);
      expect(response.body.ai_consent.status).toBe('no_consent');

      // 2. Grant AI consent
      response = await request(app)
        .post('/ai-consent')
        .send({ user_id: testUserId })
        .expect(201);
      expect(response.body.ai_consent.status).toBe('granted');

      // 3. Verify AI consent is granted
      response = await request(app)
        .get(`/ai-consent/${testUserId}`)
        .expect(200);
      expect(response.body.ai_consent.status).toBe('granted');

      // 4. Revoke AI consent
      response = await request(app)
        .delete(`/ai-consent/${testUserId}`)
        .expect(200);
      expect(response.body.ai_consent.status).toBe('revoked');

      // 5. Verify AI consent is revoked
      response = await request(app)
        .get(`/ai-consent/${testUserId}`)
        .expect(200);
      expect(response.body.ai_consent.status).toBe('revoked');
    });
  });
});

