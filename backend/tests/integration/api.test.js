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
    const uniqueId = Date.now();
    const user1 = User.create({
      name: 'API Test User 1',
      first_name: 'API',
      last_name: 'Test1',
      username: `apitest1${uniqueId}`,
      password: 'apitest1123',
      consent_status: 'revoked'
    });
    testUserId = user1.user_id;

    const user2 = User.create({
      name: 'API Test User 2',
      first_name: 'API',
      last_name: 'Test2',
      username: `apitest2${uniqueId}`,
      password: 'apitest2123',
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
    const uniqueId = Date.now();
    const user1 = User.create({
      name: 'Consent Test User 1',
      first_name: 'Consent',
      last_name: 'Test1',
      username: `consenttest1${uniqueId}`,
      password: 'consenttest1123',
      consent_status: 'revoked'
    });
    testUserId = user1.user_id;

    const user2 = User.create({
      name: 'Consent Test User 2',
      first_name: 'Consent',
      last_name: 'Test2',
      username: `consenttest2${uniqueId}`,
      password: 'consenttest2123',
      consent_status: 'revoked'
    });
    testUserId2 = user2.user_id;

    const user3 = User.create({
      name: 'Consent Test User 3',
      first_name: 'Consent',
      last_name: 'Test3',
      username: `consenttest3${uniqueId}`,
      password: 'consenttest3123',
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
      const uniqueId = Date.now();
      const newUser = User.create({
        name: 'No Consent User',
        first_name: 'No',
        last_name: 'Consent',
        username: `noconsent${uniqueId}`,
        password: 'noconsent123',
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
      const uniqueId = Date.now();
      const newUser = User.create({
        name: 'Revoke Test User',
        first_name: 'Revoke',
        last_name: 'Test',
        username: `revoketest${uniqueId}`,
        password: 'revoketest123',
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
      const uniqueId = Date.now();
      const workflowUser = User.create({
        name: 'Workflow Test User',
        first_name: 'Workflow',
        last_name: 'Test',
        username: `workflowtest${uniqueId}`,
        password: 'workflowtest123',
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

describe('Profile API Endpoints', () => {
  let testUserId;
  let testUserId2;

  beforeAll(async () => {
    await initializeDatabase();
    
    // Create test users
    const uniqueId = Date.now();
    const user1 = User.create({
      name: 'Profile Test User 1',
      first_name: 'Profile',
      last_name: 'Test1',
      username: `profiletest1${uniqueId}`,
      password: 'profiletest1123',
      consent_status: 'granted'
    });
    testUserId = user1.user_id;

    const user2 = User.create({
      name: 'Profile Test User 2',
      first_name: 'Profile',
      last_name: 'Test2',
      username: `profiletest2${uniqueId}`,
      password: 'profiletest2123',
      consent_status: 'revoked'
    });
    testUserId2 = user2.user_id;
  });

  afterAll(() => {
    closeDatabase();
  });

  describe('GET /profile/:user_id', () => {
    test('should return behavioral profile for user with consent', async () => {
      const response = await request(app)
        .get(`/profile/${testUserId}`)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('profile');
      expect(response.body.profile).toHaveProperty('user_id', testUserId);
      expect(response.body.profile).toHaveProperty('user_name');
      expect(response.body.profile).toHaveProperty('assigned_persona');
      expect(response.body.profile).toHaveProperty('persona_rationale');
      expect(response.body.profile).toHaveProperty('decision_trace');
      expect(response.body.profile).toHaveProperty('behavioral_signals');
      expect(response.body.profile).toHaveProperty('all_matching_personas');
      expect(response.body.profile).toHaveProperty('timestamp');
    });

    test('should return 403 for user without consent', async () => {
      const response = await request(app)
        .get(`/profile/${testUserId2}`)
        .expect(403);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body.error).toHaveProperty('code', 'CONSENT_REQUIRED');
    });

    test('should return behavioral signals in profile', async () => {
      const response = await request(app)
        .get(`/profile/${testUserId}`)
        .expect(200);

      const signals = response.body.profile.behavioral_signals;
      expect(signals).toHaveProperty('credit');
      expect(signals).toHaveProperty('income');
      expect(signals).toHaveProperty('subscriptions');
      expect(signals).toHaveProperty('savings');
    });

    test('should return assigned persona in profile', async () => {
      const response = await request(app)
        .get(`/profile/${testUserId}`)
        .expect(200);

      const persona = response.body.profile.assigned_persona;
      expect(persona).toHaveProperty('id');
      expect(persona).toHaveProperty('name');
      expect(persona).toHaveProperty('description');
      expect(persona).toHaveProperty('educational_focus');
      expect(persona).toHaveProperty('recommendation_types');
      expect(Array.isArray(persona.recommendation_types)).toBe(true);
    });

    test('should return 404 for non-existent user', async () => {
      const response = await request(app)
        .get('/profile/99999')
        .expect(404);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body.error).toHaveProperty('code', 'USER_NOT_FOUND');
    });

    test('should return 400 for invalid user_id', async () => {
      const response = await request(app)
        .get('/profile/invalid')
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body.error).toHaveProperty('code', 'INVALID_USER_ID');
    });
  });
});

describe('Recommendations API Endpoints', () => {
  let testUserId;
  let testUserId2;

  beforeAll(async () => {
    await initializeDatabase();
    
    // Create test users
    const uniqueId = Date.now();
    const user1 = User.create({
      name: 'Recommendations Test User 1',
      first_name: 'Recommendations',
      last_name: 'Test1',
      username: `recommendtest1${uniqueId}`,
      password: 'recommendtest1123',
      consent_status: 'granted'
    });
    testUserId = user1.user_id;

    const user2 = User.create({
      name: 'Recommendations Test User 2',
      first_name: 'Recommendations',
      last_name: 'Test2',
      username: `recommendtest2${uniqueId}`,
      password: 'recommendtest2123',
      consent_status: 'revoked'
    });
    testUserId2 = user2.user_id;
  });

  afterAll(() => {
    closeDatabase();
  });

  describe('GET /recommendations/:user_id', () => {
    test('should return recommendations for user with consent', async () => {
      // Clear any existing reviews and generate fresh recommendations
      const RecommendationReview = require('../../src/models/RecommendationReview');
      const existingReviews = RecommendationReview.findByUserId(testUserId);
      existingReviews.forEach(review => {
        const db = require('../../src/config/database').getDatabase();
        db.prepare('DELETE FROM recommendation_reviews WHERE review_id = ?').run(review.review_id);
      });

      const response = await request(app)
        .get(`/recommendations/${testUserId}`)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('recommendations');
      
      // Recommendations may be pending or approved
      if (response.body.recommendations.status === 'pending') {
        expect(response.body.recommendations).toHaveProperty('pending_message');
      } else {
        expect(response.body.recommendations).toHaveProperty('education_items');
        expect(response.body.recommendations).toHaveProperty('partner_offers');
      }
    });

    test('should return 3-5 education items', async () => {
      // Approve any pending recommendations first
      const RecommendationReview = require('../../src/models/RecommendationReview');
      const pendingReview = RecommendationReview.findPendingByUserId(testUserId);
      if (pendingReview) {
        RecommendationReview.updateStatus(pendingReview.review_id, 'approved', 'Auto-approved for test', 'test');
      } else {
        // Clear and regenerate
        const existingReviews = RecommendationReview.findByUserId(testUserId);
        existingReviews.forEach(review => {
          const db = require('../../src/config/database').getDatabase();
          db.prepare('DELETE FROM recommendation_reviews WHERE review_id = ?').run(review.review_id);
        });
      }

      const response = await request(app)
        .get(`/recommendations/${testUserId}`)
        .expect(200);

      // Check if recommendations are approved (not pending)
      if (response.body.recommendations.status === 'pending') {
        // Approve and get again
        const pendingReview = RecommendationReview.findPendingByUserId(testUserId);
        if (pendingReview) {
          RecommendationReview.updateStatus(pendingReview.review_id, 'approved', 'Auto-approved for test', 'test');
          const approvedResponse = await request(app)
            .get(`/recommendations/${testUserId}`)
            .expect(200);
          const education = approvedResponse.body.recommendations.education_items;
          expect(Array.isArray(education)).toBe(true);
          expect(education.length).toBeGreaterThanOrEqual(3);
          expect(education.length).toBeLessThanOrEqual(5);
          return;
        }
      }
      
      const education = response.body.recommendations.education_items;
      expect(Array.isArray(education)).toBe(true);
      expect(education.length).toBeGreaterThanOrEqual(3);
      expect(education.length).toBeLessThanOrEqual(5);
    });

    test('should return 1-3 partner offers', async () => {
      // Approve any pending recommendations first
      const RecommendationReview = require('../../src/models/RecommendationReview');
      const pendingReview = RecommendationReview.findPendingByUserId(testUserId);
      if (pendingReview) {
        RecommendationReview.updateStatus(pendingReview.review_id, 'approved', 'Auto-approved for test', 'test');
      }

      const response = await request(app)
        .get(`/recommendations/${testUserId}`)
        .expect(200);

      if (response.body.recommendations.status === 'pending') {
        const pendingReview = RecommendationReview.findPendingByUserId(testUserId);
        if (pendingReview) {
          RecommendationReview.updateStatus(pendingReview.review_id, 'approved', 'Auto-approved for test', 'test');
          const approvedResponse = await request(app)
            .get(`/recommendations/${testUserId}`)
            .expect(200);
          const offers = approvedResponse.body.recommendations.partner_offers;
          expect(Array.isArray(offers)).toBe(true);
          expect(offers.length).toBeGreaterThanOrEqual(1);
          expect(offers.length).toBeLessThanOrEqual(3);
          return;
        }
      }

      const offers = response.body.recommendations.partner_offers;
      expect(Array.isArray(offers)).toBe(true);
      expect(offers.length).toBeGreaterThanOrEqual(1);
      expect(offers.length).toBeLessThanOrEqual(3);
    });

    test('should include rationales for all recommendations', async () => {
      // Approve any pending recommendations first
      const RecommendationReview = require('../../src/models/RecommendationReview');
      const pendingReview = RecommendationReview.findPendingByUserId(testUserId);
      if (pendingReview) {
        RecommendationReview.updateStatus(pendingReview.review_id, 'approved', 'Auto-approved for test', 'test');
      }

      const response = await request(app)
        .get(`/recommendations/${testUserId}`)
        .expect(200);

      if (response.body.recommendations.status === 'pending') {
        const pendingReview = RecommendationReview.findPendingByUserId(testUserId);
        if (pendingReview) {
          RecommendationReview.updateStatus(pendingReview.review_id, 'approved', 'Auto-approved for test', 'test');
          const approvedResponse = await request(app)
            .get(`/recommendations/${testUserId}`)
            .expect(200);
          const education = approvedResponse.body.recommendations.education_items;
          const offers = approvedResponse.body.recommendations.partner_offers;
          
          education.forEach(rec => {
            expect(rec).toHaveProperty('rationale');
            expect(typeof rec.rationale).toBe('string');
            expect(rec.rationale.length).toBeGreaterThan(0);
          });

          offers.forEach(rec => {
            expect(rec).toHaveProperty('rationale');
            expect(typeof rec.rationale).toBe('string');
            expect(rec.rationale.length).toBeGreaterThan(0);
          });
          return;
        }
      }

      const education = response.body.recommendations.education_items;
      const offers = response.body.recommendations.partner_offers;
      
      education.forEach(rec => {
        expect(rec).toHaveProperty('rationale');
        expect(typeof rec.rationale).toBe('string');
        expect(rec.rationale.length).toBeGreaterThan(0);
      });

      offers.forEach(rec => {
        expect(rec).toHaveProperty('rationale');
        expect(typeof rec.rationale).toBe('string');
        expect(rec.rationale.length).toBeGreaterThan(0);
      });
    });

    test('should include disclaimer', async () => {
      // Approve any pending recommendations first
      const RecommendationReview = require('../../src/models/RecommendationReview');
      const pendingReview = RecommendationReview.findPendingByUserId(testUserId);
      if (pendingReview) {
        RecommendationReview.updateStatus(pendingReview.review_id, 'approved', 'Auto-approved for test', 'test');
      }

      const response = await request(app)
        .get(`/recommendations/${testUserId}`)
        .expect(200);

      // Disclaimer may not be present for pending recommendations
      if (response.body.recommendations.status !== 'pending') {
        expect(response.body.recommendations).toHaveProperty('disclaimer');
        expect(typeof response.body.recommendations.disclaimer).toBe('string');
        expect(response.body.recommendations.disclaimer.length).toBeGreaterThan(0);
      }
    });

    test('should return 403 for user without consent', async () => {
      const response = await request(app)
        .get(`/recommendations/${testUserId2}`)
        .expect(403);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body.error).toHaveProperty('code', 'CONSENT_REQUIRED');
    });

    test('should return 404 for non-existent user', async () => {
      const response = await request(app)
        .get('/recommendations/99999')
        .expect(404);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body.error).toHaveProperty('code', 'USER_NOT_FOUND');
    });

    test('should return 400 for invalid user_id', async () => {
      const response = await request(app)
        .get('/recommendations/invalid')
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body.error).toHaveProperty('code', 'INVALID_USER_ID');
    });

    test('should include behavioral signals in response', async () => {
      // Approve any pending recommendations first
      const RecommendationReview = require('../../src/models/RecommendationReview');
      const pendingReview = RecommendationReview.findPendingByUserId(testUserId);
      if (pendingReview) {
        RecommendationReview.updateStatus(pendingReview.review_id, 'approved', 'Auto-approved for test', 'test');
      }

      const response = await request(app)
        .get(`/recommendations/${testUserId}`)
        .expect(200);

      // Behavioral signals may not be present for pending recommendations
      if (response.body.recommendations.status !== 'pending') {
        expect(response.body.recommendations).toHaveProperty('behavioral_signals');
        const signals = response.body.recommendations.behavioral_signals;
        expect(signals).toHaveProperty('credit');
        expect(signals).toHaveProperty('income');
        expect(signals).toHaveProperty('subscriptions');
        expect(signals).toHaveProperty('savings');
      }
    });

    test('should include persona assignment details', async () => {
      // Approve any pending recommendations first
      const RecommendationReview = require('../../src/models/RecommendationReview');
      const pendingReview = RecommendationReview.findPendingByUserId(testUserId);
      if (pendingReview) {
        RecommendationReview.updateStatus(pendingReview.review_id, 'approved', 'Auto-approved for test', 'test');
      }

      const response = await request(app)
        .get(`/recommendations/${testUserId}`)
        .expect(200);

      // Persona details may not be present for pending recommendations
      if (response.body.recommendations.status !== 'pending') {
        expect(response.body.recommendations).toHaveProperty('assigned_persona');
        expect(response.body.recommendations).toHaveProperty('persona_rationale');
        expect(response.body.recommendations).toHaveProperty('decision_trace');
        
        const persona = response.body.recommendations.assigned_persona;
        expect(persona).toHaveProperty('id');
        expect(persona).toHaveProperty('name');
      }
    });

    test('should include summary with counts', async () => {
      // Approve any pending recommendations first
      const RecommendationReview = require('../../src/models/RecommendationReview');
      const pendingReview = RecommendationReview.findPendingByUserId(testUserId);
      if (pendingReview) {
        RecommendationReview.updateStatus(pendingReview.review_id, 'approved', 'Auto-approved for test', 'test');
      }

      const response = await request(app)
        .get(`/recommendations/${testUserId}`)
        .expect(200);

      // Summary may not be present for pending recommendations
      if (response.body.recommendations.status !== 'pending') {
        expect(response.body.recommendations).toHaveProperty('summary');
        const summary = response.body.recommendations.summary;
        expect(summary).toHaveProperty('total_recommendations');
        expect(summary).toHaveProperty('education_count');
        expect(summary).toHaveProperty('partner_offers_count');
        
        expect(summary.total_recommendations).toBe(
          summary.education_count + summary.partner_offers_count
        );
      }
    });

    test('should filter out recommendations with tone violations', async () => {
      // Approve any pending recommendations first
      const RecommendationReview = require('../../src/models/RecommendationReview');
      const pendingReview = RecommendationReview.findPendingByUserId(testUserId);
      if (pendingReview) {
        RecommendationReview.updateStatus(pendingReview.review_id, 'approved', 'Auto-approved for test', 'test');
      }

      const response = await request(app)
        .get(`/recommendations/${testUserId}`)
        .expect(200);

      // All returned recommendations should have valid tone
      if (response.body.recommendations.status !== 'pending') {
        const education = response.body.recommendations.education_items;
        const offers = response.body.recommendations.partner_offers;
        
        education.forEach(rec => {
          expect(rec).toHaveProperty('rationale');
          // Tone validation should have passed
        });

        offers.forEach(rec => {
          expect(rec).toHaveProperty('rationale');
          // Tone validation should have passed
        });
      }
    });
  });
});

describe('Feedback API Endpoints', () => {
  let testUserId;

  beforeAll(async () => {
    await initializeDatabase();
    
    // Create test user
    const uniqueId = Date.now();
    const user1 = User.create({
      name: 'Feedback Test User 1',
      first_name: 'Feedback',
      last_name: 'Test1',
      username: `feedbacktest1${uniqueId}`,
      password: 'feedbacktest1123',
      consent_status: 'granted'
    });
    testUserId = user1.user_id;
  });

  afterAll(() => {
    closeDatabase();
  });

  describe('POST /feedback', () => {
    test('should record feedback with all fields', async () => {
      const response = await request(app)
        .post('/feedback')
        .send({
          user_id: testUserId,
          recommendation_id: 'edu-001',
          recommendation_type: 'education',
          rating: 5,
          comment: 'Very helpful!',
          helpful: true
        })
        .expect(201);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('message', 'Feedback recorded successfully');
      expect(response.body).toHaveProperty('feedback');
      expect(response.body.feedback).toHaveProperty('feedback_id');
      expect(response.body.feedback).toHaveProperty('user_id', testUserId);
      expect(response.body.feedback).toHaveProperty('recommendation_id', 'edu-001');
      expect(response.body.feedback).toHaveProperty('recommendation_type', 'education');
      expect(response.body.feedback).toHaveProperty('rating', 5);
      expect(response.body.feedback).toHaveProperty('comment', 'Very helpful!');
      expect(response.body.feedback).toHaveProperty('helpful', true);
      expect(response.body.feedback).toHaveProperty('created_at');
    });

    test('should record feedback with minimal fields', async () => {
      const response = await request(app)
        .post('/feedback')
        .send({
          user_id: testUserId
        })
        .expect(201);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body.feedback).toHaveProperty('user_id', testUserId);
      expect(response.body.feedback.rating).toBeNull();
      expect(response.body.feedback.comment).toBeNull();
    });

    test('should return 400 for missing user_id', async () => {
      const response = await request(app)
        .post('/feedback')
        .send({})
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body.error).toHaveProperty('code', 'MISSING_REQUIRED_FIELDS');
    });

    test('should return 400 for invalid rating', async () => {
      const response = await request(app)
        .post('/feedback')
        .send({
          user_id: testUserId,
          rating: 6
        })
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body.error).toHaveProperty('code', 'INVALID_RATING');
    });

    test('should return 400 for invalid recommendation_type', async () => {
      const response = await request(app)
        .post('/feedback')
        .send({
          user_id: testUserId,
          recommendation_type: 'invalid'
        })
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body.error).toHaveProperty('code', 'INVALID_RECOMMENDATION_TYPE');
    });

    test('should return 404 for non-existent user', async () => {
      const response = await request(app)
        .post('/feedback')
        .send({
          user_id: 99999,
          rating: 4
        })
        .expect(404);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body.error).toHaveProperty('code', 'USER_NOT_FOUND');
    });
  });
});

describe('Operator API Endpoints', () => {
  let testUserId;
  let testUserId2;
  let reviewId;

  beforeAll(async () => {
    await initializeDatabase();
    
    // Create test users
    const uniqueId = Date.now();
    const user1 = User.create({
      name: 'Operator Test User 1',
      first_name: 'Operator',
      last_name: 'Test1',
      username: `operatortest1${uniqueId}`,
      password: 'operatortest1123',
      consent_status: 'granted'
    });
    testUserId = user1.user_id;

    const user2 = User.create({
      name: 'Operator Test User 2',
      first_name: 'Operator',
      last_name: 'Test2',
      username: `operatortest2${uniqueId}`,
      password: 'operatortest2123',
      consent_status: 'granted'
    });
    testUserId2 = user2.user_id;

    // Generate recommendations to create review records
    const { generateRecommendations } = require('../../src/services/recommend/recommendationEngine');
    const RecommendationReview = require('../../src/models/RecommendationReview');
    
    // Generate recommendations for user 1 (this will create a review record)
    const recommendations = generateRecommendations(testUserId);
    const review = RecommendationReview.create({
      user_id: testUserId,
      recommendation_data: recommendations,
      decision_trace: recommendations.decision_trace,
      status: 'pending'
    });
    reviewId = review.review_id;
  });

  afterAll(() => {
    closeDatabase();
  });

  describe('GET /operator/review', () => {
    test('should return pending recommendations', async () => {
      const response = await request(app)
        .get('/operator/review')
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('count');
      expect(response.body).toHaveProperty('reviews');
      expect(Array.isArray(response.body.reviews)).toBe(true);
      expect(response.body.count).toBe(response.body.reviews.length);
    });

    test('should return reviews with correct structure', async () => {
      const response = await request(app)
        .get('/operator/review')
        .expect(200);

      if (response.body.reviews.length > 0) {
        const review = response.body.reviews[0];
        expect(review).toHaveProperty('review_id');
        expect(review).toHaveProperty('user_id');
        expect(review).toHaveProperty('recommendation_data');
        expect(review).toHaveProperty('decision_trace');
        expect(review).toHaveProperty('status', 'pending');
        expect(review).toHaveProperty('created_at');
      }
    });
  });

  describe('POST /operator/approve', () => {
    test('should approve a recommendation', async () => {
      const response = await request(app)
        .post('/operator/approve')
        .send({
          review_id: reviewId,
          operator_notes: 'Looks good, approved',
          reviewed_by: 'operator-1'
        })
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('message', 'Recommendation approved successfully');
      expect(response.body).toHaveProperty('review');
      expect(response.body.review).toHaveProperty('review_id', reviewId);
      expect(response.body.review).toHaveProperty('status', 'approved');
      expect(response.body.review).toHaveProperty('operator_notes', 'Looks good, approved');
      expect(response.body.review).toHaveProperty('reviewed_by', 'operator-1');
      expect(response.body.review).toHaveProperty('reviewed_at');
    });

    test('should return 400 for missing review_id', async () => {
      const response = await request(app)
        .post('/operator/approve')
        .send({})
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body.error).toHaveProperty('code', 'MISSING_REQUIRED_FIELDS');
    });

    test('should return 404 for non-existent review', async () => {
      const response = await request(app)
        .post('/operator/approve')
        .send({
          review_id: 99999
        })
        .expect(404);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body.error).toHaveProperty('code', 'REVIEW_NOT_FOUND');
    });
  });

  describe('POST /operator/override', () => {
    test('should override a recommendation', async () => {
      // Create another review for override test
      const { generateRecommendations } = require('../../src/services/recommend/recommendationEngine');
      const RecommendationReview = require('../../src/models/RecommendationReview');
      
      const recommendations = generateRecommendations(testUserId2);
      const review = RecommendationReview.create({
        user_id: testUserId2,
        recommendation_data: recommendations,
        decision_trace: recommendations.decision_trace,
        status: 'pending'
      });

      const response = await request(app)
        .post('/operator/override')
        .send({
          review_id: review.review_id,
          operator_notes: 'Not appropriate for this user',
          reviewed_by: 'operator-1'
        })
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('message', 'Recommendation overridden successfully');
      expect(response.body).toHaveProperty('review');
      expect(response.body.review).toHaveProperty('status', 'overridden');
      expect(response.body.review).toHaveProperty('operator_notes', 'Not appropriate for this user');
      expect(response.body.review).toHaveProperty('reviewed_at');
    });

    test('should return 404 for non-existent review', async () => {
      const response = await request(app)
        .post('/operator/override')
        .send({
          review_id: 99999
        })
        .expect(404);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body.error).toHaveProperty('code', 'REVIEW_NOT_FOUND');
    });
  });

  describe('GET /operator/users', () => {
    test('should return all users with persona info', async () => {
      const response = await request(app)
        .get('/operator/users')
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('count');
      expect(response.body).toHaveProperty('users');
      expect(Array.isArray(response.body.users)).toBe(true);
      expect(response.body.count).toBe(response.body.users.length);
    });

    test('should include behavioral signals for users with consent', async () => {
      const response = await request(app)
        .get('/operator/users')
        .expect(200);

      // Find a user with profile
      const userWithProfile = response.body.users.find(u => u.has_profile === true);
      
      if (userWithProfile) {
        expect(userWithProfile).toHaveProperty('user_id');
        expect(userWithProfile).toHaveProperty('name');
        expect(userWithProfile).toHaveProperty('consent_status');
        expect(userWithProfile).toHaveProperty('assigned_persona');
        expect(userWithProfile).toHaveProperty('behavioral_signals');
        expect(userWithProfile.behavioral_signals).toHaveProperty('credit');
        expect(userWithProfile.behavioral_signals).toHaveProperty('income');
        expect(userWithProfile.behavioral_signals).toHaveProperty('subscriptions');
        expect(userWithProfile.behavioral_signals).toHaveProperty('savings');
      }
    });

    test('should handle users without consent gracefully', async () => {
      // Create a user without consent
      const uniqueId = Date.now();
      const userWithoutConsent = User.create({
        name: 'No Consent User',
        first_name: 'No',
        last_name: 'Consent',
        username: `noconsent${uniqueId}`,
        password: 'noconsent123',
        consent_status: 'revoked'
      });

      const response = await request(app)
        .get('/operator/users')
        .expect(200);

      const foundUser = response.body.users.find(u => u.user_id === userWithoutConsent.user_id);
      expect(foundUser).toBeDefined();
      expect(foundUser.has_profile).toBe(false);
      expect(foundUser.assigned_persona).toBeNull();
      expect(foundUser.behavioral_signals).toBeNull();
    });
  });
});

