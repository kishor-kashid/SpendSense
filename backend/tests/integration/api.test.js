/**
 * Integration tests for API endpoints
 */

// Use test database for tests
process.env.DB_PATH = './data/test_database.sqlite';
process.env.NODE_ENV = 'test';

const request = require('supertest');
const { initializeDatabase, closeDatabase } = require('../../src/config/database');
const User = require('../../src/models/User');

// Import app after setting environment variables
// This prevents server from starting automatically in test mode
const app = require('../../src/server');

describe('User API Endpoints', () => {
  let testUserId;
  let testUserId2;

  beforeAll(async () => {
    await initializeDatabase();
    
    // Create test users
    const user1 = User.create({
      name: 'API Test User 1',
      consent_status: 'revoked'
    });
    testUserId = user1.user_id;

    const user2 = User.create({
      name: 'API Test User 2',
      consent_status: 'granted'
    });
    testUserId2 = user2.user_id;
  });

  afterAll(() => {
    closeDatabase();
  });

  describe('GET /users', () => {
    test('should return list of all users', async () => {
      const response = await request(app)
        .get('/users')
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('count');
      expect(response.body).toHaveProperty('users');
      expect(Array.isArray(response.body.users)).toBe(true);
      expect(response.body.users.length).toBeGreaterThan(0);
    });

    test('should return users with id and name only', async () => {
      const response = await request(app)
        .get('/users')
        .expect(200);

      expect(response.body.users.length).toBeGreaterThan(0);
      
      // Check structure of first user
      const firstUser = response.body.users[0];
      expect(firstUser).toHaveProperty('id');
      expect(firstUser).toHaveProperty('name');
      expect(firstUser).not.toHaveProperty('consent_status');
      expect(firstUser).not.toHaveProperty('created_at');
      expect(typeof firstUser.id).toBe('number');
      expect(typeof firstUser.name).toBe('string');
    });

    test('should include test users in the list', async () => {
      const response = await request(app)
        .get('/users')
        .expect(200);

      const userIds = response.body.users.map(u => u.id);
      expect(userIds).toContain(testUserId);
      expect(userIds).toContain(testUserId2);
    });

    test('should return correct count', async () => {
      const response = await request(app)
        .get('/users')
        .expect(200);

      expect(response.body.count).toBe(response.body.users.length);
    });
  });

  describe('GET /users/:id', () => {
    test('should return user details for valid ID', async () => {
      const response = await request(app)
        .get(`/users/${testUserId}`)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('user');
      expect(response.body.user).toHaveProperty('id', testUserId);
      expect(response.body.user).toHaveProperty('name', 'API Test User 1');
      expect(response.body.user).toHaveProperty('consent_status', 'revoked');
      expect(response.body.user).toHaveProperty('created_at');
    });

    test('should return 404 for non-existent user', async () => {
      const response = await request(app)
        .get('/users/99999')
        .expect(404);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toHaveProperty('message');
      expect(response.body.error).toHaveProperty('code', 'USER_NOT_FOUND');
      expect(response.body.error.message).toContain('not found');
    });

    test('should return 400 for invalid user ID (non-numeric)', async () => {
      const response = await request(app)
        .get('/users/invalid')
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toHaveProperty('code', 'INVALID_USER_ID');
      expect(response.body.error.message).toContain('Invalid user ID');
    });

    test('should return 400 for invalid user ID (zero)', async () => {
      const response = await request(app)
        .get('/users/0')
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body.error).toHaveProperty('code', 'INVALID_USER_ID');
    });

    test('should return 400 for invalid user ID (negative)', async () => {
      const response = await request(app)
        .get('/users/-1')
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body.error).toHaveProperty('code', 'INVALID_USER_ID');
    });

    test('should return user with correct structure', async () => {
      const response = await request(app)
        .get(`/users/${testUserId2}`)
        .expect(200);

      const user = response.body.user;
      expect(user).toHaveProperty('id');
      expect(user).toHaveProperty('name');
      expect(user).toHaveProperty('consent_status');
      expect(user).toHaveProperty('created_at');
      expect(typeof user.id).toBe('number');
      expect(typeof user.name).toBe('string');
      expect(typeof user.consent_status).toBe('string');
      expect(typeof user.created_at).toBe('string');
    });

    test('should handle missing user ID parameter', async () => {
      // This should be caught by Express router, but let's test edge cases
      const response = await request(app)
        .get('/users/')
        .expect(200); // This actually hits GET /users route

      // Should return list of users, not error
      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('users');
    });
  });

  describe('Error Handling', () => {
    test('should return proper error format', async () => {
      const response = await request(app)
        .get('/users/99999')
        .expect(404);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toHaveProperty('message');
      expect(response.body.error).toHaveProperty('code');
    });

    test('should return proper status codes', async () => {
      // 200 for valid requests
      await request(app)
        .get('/users')
        .expect(200);

      // 404 for not found
      await request(app)
        .get('/users/99999')
        .expect(404);

      // 400 for invalid input
      await request(app)
        .get('/users/invalid')
        .expect(400);
    });
  });

  describe('Response Format', () => {
    test('should return consistent response format for GET /users', async () => {
      const response = await request(app)
        .get('/users')
        .expect(200);

      expect(response.body).toHaveProperty('success');
      expect(response.body).toHaveProperty('count');
      expect(response.body).toHaveProperty('users');
      expect(typeof response.body.success).toBe('boolean');
      expect(typeof response.body.count).toBe('number');
      expect(Array.isArray(response.body.users)).toBe(true);
    });

    test('should return consistent response format for GET /users/:id', async () => {
      const response = await request(app)
        .get(`/users/${testUserId}`)
        .expect(200);

      expect(response.body).toHaveProperty('success');
      expect(response.body).toHaveProperty('user');
      expect(typeof response.body.success).toBe('boolean');
      expect(typeof response.body.user).toBe('object');
    });
  });
});

describe('Consent API Endpoints', () => {
  let testUserId;
  let testUserId2;
  let testUserId3;

  beforeAll(async () => {
    await initializeDatabase();
    
    // Create test users for consent tests
    const user1 = User.create({
      name: 'Consent Test User 1',
      consent_status: 'revoked'
    });
    testUserId = user1.user_id;

    const user2 = User.create({
      name: 'Consent Test User 2',
      consent_status: 'revoked'
    });
    testUserId2 = user2.user_id;

    const user3 = User.create({
      name: 'Consent Test User 3',
      consent_status: 'revoked'
    });
    testUserId3 = user3.user_id;
  });

  afterAll(() => {
    closeDatabase();
  });

  describe('POST /consent', () => {
    test('should grant consent for a user', async () => {
      const response = await request(app)
        .post('/consent')
        .send({ user_id: testUserId })
        .expect(201);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('message', 'Consent granted successfully');
      expect(response.body).toHaveProperty('consent');
      expect(response.body.consent).toHaveProperty('user_id', testUserId);
      expect(response.body.consent).toHaveProperty('has_consent', true);
      expect(response.body.consent).toHaveProperty('status', 'granted');
      expect(response.body.consent).toHaveProperty('timestamp');
      expect(typeof response.body.consent.timestamp).toBe('string');
    });

    test('should return 400 for missing user_id', async () => {
      const response = await request(app)
        .post('/consent')
        .send({})
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toHaveProperty('code', 'MISSING_REQUIRED_FIELDS');
      expect(response.body.error.message).toContain('user_id');
    });

    test('should return 400 for invalid user_id (non-numeric)', async () => {
      const response = await request(app)
        .post('/consent')
        .send({ user_id: 'invalid' })
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body.error).toHaveProperty('code', 'INVALID_USER_ID');
    });

    test('should return 400 for invalid user_id (zero)', async () => {
      const response = await request(app)
        .post('/consent')
        .send({ user_id: 0 })
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body.error).toHaveProperty('code', 'INVALID_USER_ID');
    });

    test('should return 400 for invalid user_id (negative)', async () => {
      const response = await request(app)
        .post('/consent')
        .send({ user_id: -1 })
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body.error).toHaveProperty('code', 'INVALID_USER_ID');
    });

    test('should return 404 for non-existent user', async () => {
      const response = await request(app)
        .post('/consent')
        .send({ user_id: 99999 })
        .expect(404);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body.error).toHaveProperty('code', 'USER_NOT_FOUND');
    });

    test('should record timestamp when granting consent', async () => {
      const response = await request(app)
        .post('/consent')
        .send({ user_id: testUserId2 })
        .expect(201);

      expect(response.body.consent.timestamp).toBeDefined();
      expect(typeof response.body.consent.timestamp).toBe('string');
      
      // Verify timestamp is a valid date string (SQLite format: YYYY-MM-DD HH:MM:SS)
      expect(response.body.consent.timestamp).toMatch(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/);
      
      // Verify it can be parsed as a date
      const timestamp = new Date(response.body.consent.timestamp);
      expect(timestamp.toString()).not.toBe('Invalid Date');
    });
  });

  describe('GET /consent/:user_id', () => {
    test('should return consent status for user with granted consent', async () => {
      // First grant consent
      await request(app)
        .post('/consent')
        .send({ user_id: testUserId3 })
        .expect(201);

      // Then get status
      const response = await request(app)
        .get(`/consent/${testUserId3}`)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('consent');
      expect(response.body.consent).toHaveProperty('user_id', testUserId3);
      expect(response.body.consent).toHaveProperty('has_consent', true);
      expect(response.body.consent).toHaveProperty('status', 'granted');
      expect(response.body.consent).toHaveProperty('timestamp');
      expect(response.body.consent).toHaveProperty('message');
    });

    test('should return revoked or no_consent status for user without consent', async () => {
      // Create a new user without granting consent
      const newUser = User.create({
        name: 'No Consent User',
        consent_status: 'revoked'
      });

      const response = await request(app)
        .get(`/consent/${newUser.user_id}`)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body.consent).toHaveProperty('user_id', newUser.user_id);
      expect(response.body.consent).toHaveProperty('has_consent', false);
      // Status should be 'revoked' (from users table) or 'no_consent' (if no record exists)
      expect(['revoked', 'no_consent']).toContain(response.body.consent.status);
      expect(response.body.consent.timestamp).toBeNull();
    });

    test('should return 400 for invalid user_id (non-numeric)', async () => {
      const response = await request(app)
        .get('/consent/invalid')
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body.error).toHaveProperty('code', 'INVALID_USER_ID');
    });

    test('should return 400 for invalid user_id (zero)', async () => {
      const response = await request(app)
        .get('/consent/0')
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body.error).toHaveProperty('code', 'INVALID_USER_ID');
    });

    test('should return 404 for non-existent user', async () => {
      const response = await request(app)
        .get('/consent/99999')
        .expect(404);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body.error).toHaveProperty('code', 'USER_NOT_FOUND');
    });
  });

  describe('DELETE /consent/:user_id', () => {
    test('should revoke consent for a user', async () => {
      // First grant consent
      await request(app)
        .post('/consent')
        .send({ user_id: testUserId })
        .expect(201);

      // Then revoke it
      const response = await request(app)
        .delete(`/consent/${testUserId}`)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('message', 'Consent revoked successfully');
      expect(response.body).toHaveProperty('consent');
      expect(response.body.consent).toHaveProperty('user_id', testUserId);
      expect(response.body.consent).toHaveProperty('has_consent', false);
      expect(response.body.consent).toHaveProperty('status', 'revoked');
      expect(response.body.consent).toHaveProperty('timestamp');
    });

    test('should record timestamp when revoking consent', async () => {
      // Grant consent first
      await request(app)
        .post('/consent')
        .send({ user_id: testUserId2 })
        .expect(201);

      const response = await request(app)
        .delete(`/consent/${testUserId2}`)
        .expect(200);

      expect(response.body.consent.timestamp).toBeDefined();
      expect(typeof response.body.consent.timestamp).toBe('string');
      
      // Verify timestamp is a valid date string (SQLite format: YYYY-MM-DD HH:MM:SS)
      expect(response.body.consent.timestamp).toMatch(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/);
      
      // Verify it can be parsed as a date
      const timestamp = new Date(response.body.consent.timestamp);
      expect(timestamp.toString()).not.toBe('Invalid Date');
    });

    test('should return 400 for invalid user_id (non-numeric)', async () => {
      const response = await request(app)
        .delete('/consent/invalid')
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body.error).toHaveProperty('code', 'INVALID_USER_ID');
    });

    test('should return 404 for non-existent user', async () => {
      const response = await request(app)
        .delete('/consent/99999')
        .expect(404);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body.error).toHaveProperty('code', 'USER_NOT_FOUND');
    });

    test('should handle revoking consent for user without existing consent', async () => {
      // Create a new user without granting consent
      const newUser = User.create({
        name: 'Revoke Test User',
        consent_status: 'revoked'
      });

      // Revoke should still work (creates revoked record)
      const response = await request(app)
        .delete(`/consent/${newUser.user_id}`)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body.consent).toHaveProperty('has_consent', false);
      expect(response.body.consent).toHaveProperty('status', 'revoked');
    });
  });

  describe('Consent Workflow', () => {
    test('should allow grant -> revoke -> grant workflow', async () => {
      const workflowUser = User.create({
        name: 'Workflow Test User',
        consent_status: 'revoked'
      });

      // Step 1: Grant consent
      const grantResponse = await request(app)
        .post('/consent')
        .send({ user_id: workflowUser.user_id })
        .expect(201);
      expect(grantResponse.body.consent.status).toBe('granted');

      // Step 2: Check status
      const statusResponse1 = await request(app)
        .get(`/consent/${workflowUser.user_id}`)
        .expect(200);
      expect(statusResponse1.body.consent.status).toBe('granted');

      // Step 3: Revoke consent
      const revokeResponse = await request(app)
        .delete(`/consent/${workflowUser.user_id}`)
        .expect(200);
      expect(revokeResponse.body.consent.status).toBe('revoked');

      // Step 4: Check status again
      const statusResponse2 = await request(app)
        .get(`/consent/${workflowUser.user_id}`)
        .expect(200);
      expect(statusResponse2.body.consent.status).toBe('revoked');

      // Step 5: Grant again
      const grantResponse2 = await request(app)
        .post('/consent')
        .send({ user_id: workflowUser.user_id })
        .expect(201);
      expect(grantResponse2.body.consent.status).toBe('granted');
    });
  });
});

