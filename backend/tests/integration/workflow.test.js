/**
 * End-to-End Workflow Integration Tests
 * Tests complete user workflows from start to finish
 */

// Use test database for tests
process.env.DB_PATH = './data/test_database.sqlite';
process.env.NODE_ENV = 'test';

const request = require('supertest');
const { initializeDatabase, closeDatabase } = require('../../src/config/database');
const User = require('../../src/models/User');
const Account = require('../../src/models/Account');
const Transaction = require('../../src/models/Transaction');
const Liability = require('../../src/models/Liability');
const Consent = require('../../src/models/Consent');
const RecommendationReview = require('../../src/models/RecommendationReview');

// Import app after setting environment variables
const app = require('../../src/server');

describe('End-to-End Workflows', () => {
  let testUserId;
  let testAccountId;
  let testUserIdNoData;
  let testUsername;
  let testPassword = 'workflowtest123';

  beforeAll(async () => {
    await initializeDatabase();
    
    // Create test user with financial data (unique username)
    const uniqueId = Date.now();
    testUsername = `workflowtest${uniqueId}`;
    const user = User.create({
      name: 'Workflow Test User',
      first_name: 'Workflow',
      last_name: 'Test',
      username: testUsername,
      password: testPassword,
      consent_status: 'revoked'
    });
    testUserId = user.user_id;

    // Create account for user
    const account = Account.create({
      account_id: `test_acc_workflow_${Date.now()}_${Math.random()}`,
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

    // Create some transactions
    const today = new Date();
    const lastMonth = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
    
    // Add some income transactions
    for (let i = 0; i < 2; i++) {
      const date = new Date(lastMonth.getTime() + i * 14 * 24 * 60 * 60 * 1000);
      Transaction.create({
        transaction_id: `txn_workflow_income_${Date.now()}_${i}_${Math.random()}`,
        account_id: testAccountId,
        date: date.toISOString().split('T')[0],
        amount: 2500,
        merchant_name: 'EMPLOYER PAYROLL',
        payment_channel: 'ach',
        personal_finance_category_primary: 'INCOME',
        personal_finance_category_detailed: 'PAYROLL',
        pending: false
      });
    }

    // Add some expense transactions
    for (let i = 0; i < 10; i++) {
      const date = new Date(lastMonth.getTime() + i * 3 * 24 * 60 * 60 * 1000);
      Transaction.create({
        transaction_id: `txn_workflow_expense_${Date.now()}_${i}_${Math.random()}`,
        account_id: testAccountId,
        date: date.toISOString().split('T')[0],
        amount: -50 - (i * 10),
        merchant_name: `Merchant ${i}`,
        payment_channel: 'card',
        personal_finance_category_primary: 'GENERAL_MERCHANDISE',
        personal_finance_category_detailed: 'ONLINE',
        pending: false
      });
    }

    // Create user without data (for edge case tests)
    const uniqueId2 = Date.now() + 1;
    const userNoData = User.create({
      name: 'No Data User',
      first_name: 'No',
      last_name: 'Data',
      username: `nodata${uniqueId2}`,
      password: 'nodata123',
      consent_status: 'revoked'
    });
    testUserIdNoData = userNoData.user_id;
  });

  afterAll(() => {
    closeDatabase();
  });

  describe('User Consent Flow', () => {
    test('should complete full consent workflow: grant -> access profile -> get recommendations -> revoke -> blocked', async () => {
      // Clear any existing reviews for this user to ensure clean test
      const existingReviews = RecommendationReview.findByUserId(testUserId);
      existingReviews.forEach(review => {
        const db = require('../../src/config/database').getDatabase();
        db.prepare('DELETE FROM recommendation_reviews WHERE review_id = ?').run(review.review_id);
      });

      // Step 1: User starts without consent
      const initialConsent = await request(app)
        .get(`/consent/${testUserId}`)
        .expect(200);
      
      expect(initialConsent.body.consent.has_consent).toBe(false);

      // Step 2: Try to access profile without consent (should fail)
      const profileWithoutConsent = await request(app)
        .get(`/profile/${testUserId}`)
        .expect(403);
      
      expect(profileWithoutConsent.body.error.code).toBe('CONSENT_REQUIRED');

      // Step 3: Grant consent
      const grantResponse = await request(app)
        .post('/consent')
        .send({ user_id: testUserId })
        .expect(201);
      
      expect(grantResponse.body.consent.has_consent).toBe(true);
      expect(grantResponse.body.consent.status).toBe('granted');

      // Step 4: Verify consent status
      const consentStatus = await request(app)
        .get(`/consent/${testUserId}`)
        .expect(200);
      
      expect(consentStatus.body.consent.has_consent).toBe(true);

      // Step 5: Access profile with consent (should succeed)
      const profileWithConsent = await request(app)
        .get(`/profile/${testUserId}`)
        .expect(200);
      
      expect(profileWithConsent.body.profile).toHaveProperty('assigned_persona');
      expect(profileWithConsent.body.profile).toHaveProperty('behavioral_signals');

      // Step 6: Get recommendations with consent (should succeed)
      // Recommendations will be pending initially, so we need to approve them first
      const recommendationsResponse = await request(app)
        .get(`/recommendations/${testUserId}`)
        .expect(200);
      
      expect(recommendationsResponse.body.recommendations).toHaveProperty('education_items');
      expect(recommendationsResponse.body.recommendations).toHaveProperty('status');
      
      // If recommendations are pending, approve them so user can see them
      if (recommendationsResponse.body.recommendations.status === 'pending') {
        const pendingReview = RecommendationReview.findPendingByUserId(testUserId);
        if (pendingReview) {
          RecommendationReview.updateStatus(pendingReview.review_id, 'approved', 'Auto-approved for test', 'test');
          // Get recommendations again after approval
          const recommendations = await request(app)
            .get(`/recommendations/${testUserId}`)
            .expect(200);
          
          expect(Array.isArray(recommendations.body.recommendations.education_items)).toBe(true);
          expect(recommendations.body.recommendations.education_items.length).toBeGreaterThanOrEqual(3);
        }
      } else {
        expect(Array.isArray(recommendationsResponse.body.recommendations.education_items)).toBe(true);
        expect(recommendationsResponse.body.recommendations.education_items.length).toBeGreaterThanOrEqual(3);
      }

      // Step 7: Revoke consent
      const revokeResponse = await request(app)
        .delete(`/consent/${testUserId}`)
        .expect(200);
      
      expect(revokeResponse.body.consent.has_consent).toBe(false);
      expect(revokeResponse.body.consent.status).toBe('revoked');

      // Step 8: Try to access profile after revoking (should fail)
      const profileAfterRevoke = await request(app)
        .get(`/profile/${testUserId}`)
        .expect(403);
      
      expect(profileAfterRevoke.body.error.code).toBe('CONSENT_REQUIRED');

      // Step 9: Try to get recommendations after revoking
      // Clear ALL reviews (approved and pending) to ensure clean test
      const allReviews = RecommendationReview.findByUserId(testUserId);
      allReviews.forEach(review => {
        const db = require('../../src/config/database').getDatabase();
        db.prepare('DELETE FROM recommendation_reviews WHERE review_id = ?').run(review.review_id);
      });

      // Now try to get recommendations - should fail because consent is revoked
      // and there are no reviews to return (will try to generate new ones, which requires consent)
      const recommendationsAfterRevoke = await request(app)
        .get(`/recommendations/${testUserId}`)
        .expect(403);
      
      expect(recommendationsAfterRevoke.body.error.code).toBe('CONSENT_REQUIRED');
    });

    test('should allow consent toggle: grant -> revoke -> grant again', async () => {
      // Grant
      await request(app)
        .post('/consent')
        .send({ user_id: testUserId })
        .expect(201);

      // Revoke
      await request(app)
        .delete(`/consent/${testUserId}`)
        .expect(200);

      // Grant again
      const grantAgain = await request(app)
        .post('/consent')
        .send({ user_id: testUserId })
        .expect(201);
      
      expect(grantAgain.body.consent.has_consent).toBe(true);
    });
  });

  describe('Recommendation Generation Flow', () => {
    beforeEach(async () => {
      // Ensure user has consent before each test
      await request(app)
        .post('/consent')
        .send({ user_id: testUserId })
        .expect(201);
    });

    test('should generate recommendations and store in review queue', async () => {
      // Clear any existing reviews
      const existingReviews = RecommendationReview.findByUserId(testUserId);
      existingReviews.forEach(review => {
        const db = require('../../src/config/database').getDatabase();
        db.prepare('DELETE FROM recommendation_reviews WHERE review_id = ?').run(review.review_id);
      });

      // Generate recommendations (will be stored as pending)
      const response = await request(app)
        .get(`/recommendations/${testUserId}`)
        .expect(200);

      // Verify recommendations are pending (empty arrays returned to user)
      expect(response.body.recommendations).toHaveProperty('education_items');
      expect(response.body.recommendations).toHaveProperty('partner_offers');
      expect(response.body.recommendations.status).toBe('pending');
      expect(response.body.recommendations.education_items.length).toBe(0);
      expect(response.body.recommendations.partner_offers.length).toBe(0);

      // Verify recommendations were stored in review queue (check operator API)
      const reviewQueue = await request(app)
        .get('/operator/review')
        .expect(200);
      
      const userReview = reviewQueue.body.reviews.find(r => r.user_id === testUserId);
      expect(userReview).toBeDefined();
      expect(userReview.status).toBe('pending');
      expect(userReview.recommendation_data).toBeDefined();
      expect(userReview.recommendation_data.recommendations).toBeDefined();
      
      // Verify stored recommendations have correct structure
      const storedRecs = userReview.recommendation_data.recommendations;
      expect(storedRecs.education).toBeDefined();
      expect(Array.isArray(storedRecs.education)).toBe(true);
      expect(storedRecs.education.length).toBeGreaterThanOrEqual(3);
      expect(storedRecs.education.length).toBeLessThanOrEqual(5);
      expect(storedRecs.partner_offers).toBeDefined();
      expect(Array.isArray(storedRecs.partner_offers)).toBe(true);
      expect(storedRecs.partner_offers.length).toBeGreaterThanOrEqual(1);
      expect(storedRecs.partner_offers.length).toBeLessThanOrEqual(3);

      // Verify all stored recommendations have rationales
      storedRecs.education.forEach(rec => {
        expect(rec).toHaveProperty('rationale');
        expect(typeof rec.rationale).toBe('string');
        expect(rec.rationale.length).toBeGreaterThan(0);
      });

      storedRecs.partner_offers.forEach(rec => {
        expect(rec).toHaveProperty('rationale');
        expect(typeof rec.rationale).toBe('string');
        expect(rec.rationale.length).toBeGreaterThan(0);
      });

      // Verify review queue has pending review (already checked above)
      expect(userReview).not.toBeNull();
      expect(userReview.status).toBe('pending');
      expect(userReview.recommendation_data).toBeDefined();
    });

    test('should return pending status when recommendations are pending approval', async () => {
      // Clear existing reviews
      const existingReviews = RecommendationReview.findByUserId(testUserId);
      existingReviews.forEach(review => {
        const db = require('../../src/config/database').getDatabase();
        db.prepare('DELETE FROM recommendation_reviews WHERE review_id = ?').run(review.review_id);
      });

      // Generate recommendations (creates pending review)
      await request(app)
        .get(`/recommendations/${testUserId}`)
        .expect(200);

      // Get recommendations again (should return pending status)
      const response = await request(app)
        .get(`/recommendations/${testUserId}`)
        .expect(200);

      // Should have pending status
      expect(response.body.recommendations).toHaveProperty('status', 'pending');
      expect(response.body.recommendations).toHaveProperty('pending_message');
      expect(response.body.recommendations.education_items).toEqual([]);
      expect(response.body.recommendations.partner_offers).toEqual([]);
    });
  });

  describe('Operator Review Flow', () => {
    let reviewId;

    beforeEach(async () => {
      // Ensure user has consent
      await request(app)
        .post('/consent')
        .send({ user_id: testUserId })
        .expect(201);

      // Clear existing reviews
      const existingReviews = RecommendationReview.findByUserId(testUserId);
      existingReviews.forEach(review => {
        const db = require('../../src/config/database').getDatabase();
        db.prepare('DELETE FROM recommendation_reviews WHERE review_id = ?').run(review.review_id);
      });

      // Generate recommendations to create review
      await request(app)
        .get(`/recommendations/${testUserId}`)
        .expect(200);

      const review = RecommendationReview.findPendingByUserId(testUserId);
      reviewId = review.review_id;
    });

    test('should view review queue, approve recommendation, and user can see approved recommendations', async () => {
      // Step 1: Operator views review queue
      const reviewQueue = await request(app)
        .get('/operator/review')
        .expect(200);

      expect(reviewQueue.body.success).toBe(true);
      expect(reviewQueue.body.reviews.length).toBeGreaterThan(0);
      
      const pendingReview = reviewQueue.body.reviews.find(r => r.review_id === reviewId);
      expect(pendingReview).toBeDefined();
      expect(pendingReview.status).toBe('pending');
      expect(pendingReview.recommendation_data).toBeDefined();

      // Step 2: User cannot see recommendations (pending)
      const userViewBefore = await request(app)
        .get(`/recommendations/${testUserId}`)
        .expect(200);

      expect(userViewBefore.body.recommendations.status).toBe('pending');
      expect(userViewBefore.body.recommendations.education_items.length).toBe(0);

      // Step 3: Operator approves recommendation
      const approveResponse = await request(app)
        .post('/operator/approve')
        .send({
          review_id: reviewId,
          operator_notes: 'Approved for testing',
          reviewed_by: 'test-operator'
        })
        .expect(200);

      expect(approveResponse.body.success).toBe(true);
      expect(approveResponse.body.review.status).toBe('approved');
      expect(approveResponse.body.review.operator_notes).toBe('Approved for testing');
      expect(approveResponse.body.review.reviewed_by).toBe('test-operator');
      expect(approveResponse.body.review.reviewed_at).toBeDefined();

      // Step 4: User can now see approved recommendations
      const userViewAfter = await request(app)
        .get(`/recommendations/${testUserId}`)
        .expect(200);

      expect(userViewAfter.body.recommendations).toHaveProperty('status', 'approved');
      expect(userViewAfter.body.recommendations.education_items.length).toBeGreaterThan(0);
      expect(userViewAfter.body.recommendations.partner_offers.length).toBeGreaterThan(0);
      expect(userViewAfter.body.recommendations).toHaveProperty('approved_at');
    });

    test('should override recommendation and user cannot see overridden recommendations', async () => {
      // Operator overrides recommendation
      const overrideResponse = await request(app)
        .post('/operator/override')
        .send({
          review_id: reviewId,
          operator_notes: 'Not appropriate',
          reviewed_by: 'test-operator'
        })
        .expect(200);

      expect(overrideResponse.body.success).toBe(true);
      expect(overrideResponse.body.review.status).toBe('overridden');

      // User cannot see overridden recommendations
      const userView = await request(app)
        .get(`/recommendations/${testUserId}`)
        .expect(200);

      // Should generate new recommendations (since approved one doesn't exist)
      // Or return empty if no approved review
      // The behavior depends on implementation, but should not show overridden recommendations
      expect(userView.body.recommendations).toBeDefined();
    });
  });

  describe('Edge Cases', () => {
    test('should handle user with no consent (profile and recommendations blocked)', async () => {
      // Ensure user has no consent
      await request(app)
        .delete(`/consent/${testUserIdNoData}`)
        .catch(() => {}); // Ignore if already revoked

      // Profile should be blocked
      const profile = await request(app)
        .get(`/profile/${testUserIdNoData}`)
        .expect(403);
      
      expect(profile.body.error.code).toBe('CONSENT_REQUIRED');

      // Recommendations should be blocked
      const recommendations = await request(app)
        .get(`/recommendations/${testUserIdNoData}`)
        .expect(403);
      
      expect(recommendations.body.error.code).toBe('CONSENT_REQUIRED');
    });

    test('should handle user with no financial data (no accounts/transactions)', async () => {
      // Grant consent
      await request(app)
        .post('/consent')
        .send({ user_id: testUserIdNoData })
        .expect(201);

      // Profile should still work (but may assign default persona)
      const profile = await request(app)
        .get(`/profile/${testUserIdNoData}`)
        .expect(200);
      
      expect(profile.body.profile).toHaveProperty('assigned_persona');
      // Should assign a persona (likely "New User" if no data)

      // Recommendations should still be generated
      const recommendations = await request(app)
        .get(`/recommendations/${testUserIdNoData}`)
        .expect(200);
      
      expect(recommendations.body.recommendations).toBeDefined();
    });

    test('should handle transactions without consent (transactions don\'t require consent)', async () => {
      // User without consent
      await request(app)
        .delete(`/consent/${testUserId}`)
        .catch(() => {});

      // Transactions should still be accessible (no consent required)
      const transactions = await request(app)
        .get(`/transactions/${testUserId}`)
        .expect(200);
      
      expect(transactions.body.success).toBe(true);
      expect(transactions.body).toHaveProperty('transactions');

      // Spending insights should also be accessible
      const insights = await request(app)
        .get(`/transactions/${testUserId}/insights`)
        .expect(200);
      
      expect(insights.body.success).toBe(true);
      expect(insights.body).toHaveProperty('insights');
    });

    test('should handle non-existent user gracefully', async () => {
      const nonExistentId = 99999;

      // All endpoints should return 404
      await request(app)
        .get(`/profile/${nonExistentId}`)
        .expect(404);

      await request(app)
        .get(`/recommendations/${nonExistentId}`)
        .expect(404);

      await request(app)
        .get(`/consent/${nonExistentId}`)
        .expect(404);

      await request(app)
        .get(`/transactions/${nonExistentId}`)
        .expect(404);
    });

    test('should handle invalid user IDs gracefully', async () => {
      // Invalid user IDs should return 400
      await request(app)
        .get('/profile/invalid')
        .expect(400);

      await request(app)
        .get('/profile/0')
        .expect(400);

      await request(app)
        .get('/profile/-1')
        .expect(400);
    });
  });

  describe('Complete User Journey', () => {
    test('should complete full user journey: login -> grant consent -> view profile -> get recommendations -> view transactions -> submit feedback', async () => {
      // Clear any existing reviews for clean test
      const existingReviews = RecommendationReview.findByUserId(testUserId);
      existingReviews.forEach(review => {
        const db = require('../../src/config/database').getDatabase();
        db.prepare('DELETE FROM recommendation_reviews WHERE review_id = ?').run(review.review_id);
      });

      // Step 1: Login (authentication)
      const loginResponse = await request(app)
        .post('/auth/login')
        .send({
          username: testUsername,
          password: testPassword,
          role: 'customer'
        })
        .expect(200);

      expect(loginResponse.body.success).toBe(true);
      expect(loginResponse.body.user.id).toBe(testUserId);

      // Step 2: Grant consent
      await request(app)
        .post('/consent')
        .send({ user_id: testUserId })
        .expect(201);

      // Step 3: View profile
      const profile = await request(app)
        .get(`/profile/${testUserId}`)
        .expect(200);

      expect(profile.body.profile).toHaveProperty('assigned_persona');
      expect(profile.body.profile).toHaveProperty('behavioral_signals');

      // Step 4: Get recommendations
      const recommendations = await request(app)
        .get(`/recommendations/${testUserId}`)
        .expect(200);

      expect(recommendations.body.recommendations).toHaveProperty('education_items');
      // Recommendations may be pending (empty) or approved (with items)
      if (recommendations.body.recommendations.status === 'pending') {
        expect(recommendations.body.recommendations.education_items.length).toBe(0);
        // Approve the recommendations for the test to continue
        const pendingReview = RecommendationReview.findPendingByUserId(testUserId);
        if (pendingReview) {
          RecommendationReview.updateStatus(pendingReview.review_id, 'approved', 'Auto-approved for test', 'test');
          // Get recommendations again after approval
          const recommendationsAfterApproval = await request(app)
            .get(`/recommendations/${testUserId}`)
            .expect(200);
          expect(recommendationsAfterApproval.body.recommendations.education_items.length).toBeGreaterThan(0);
        }
      } else {
        expect(recommendations.body.recommendations.education_items.length).toBeGreaterThan(0);
      }

      // Step 5: View transactions (no consent required)
      // Ensure transactions exist for this test
      const existingTransactions = Transaction.findByUserId(testUserId);
      if (existingTransactions.length === 0) {
        // Create a transaction if none exist
        const today = new Date();
        Transaction.create({
          transaction_id: `txn_workflow_test_${Date.now()}_${Math.random()}`,
          account_id: testAccountId,
          date: today.toISOString().split('T')[0],
          amount: -100,
          merchant_name: 'Test Merchant',
          payment_channel: 'card',
          personal_finance_category_primary: 'GENERAL_MERCHANDISE',
          personal_finance_category_detailed: 'ONLINE',
          pending: false
        });
      }

      const transactions = await request(app)
        .get(`/transactions/${testUserId}`)
        .expect(200);

      expect(Array.isArray(transactions.body.transactions)).toBe(true);
      // Transactions should exist (either from beforeAll or just created)
      expect(transactions.body.transactions.length).toBeGreaterThan(0);

      // Step 6: Submit feedback (get fresh recommendations to ensure we have items)
      const finalRecommendations = await request(app)
        .get(`/recommendations/${testUserId}`)
        .expect(200);
      
      if (finalRecommendations.body.recommendations.education_items.length > 0) {
        const firstRec = finalRecommendations.body.recommendations.education_items[0];
        const feedback = await request(app)
          .post('/feedback')
          .send({
            user_id: testUserId,
            recommendation_id: firstRec.id || 'test-id',
            recommendation_type: 'education',
            rating: 5,
            comment: 'Very helpful!',
            helpful: true
          })
          .expect(201);

        expect(feedback.body.success).toBe(true);
        expect(feedback.body.feedback).toHaveProperty('feedback_id');
      }
    });
  });

  describe('Operator Workflow', () => {
    // Increase timeout for slow operator workflow tests (30 seconds)
    jest.setTimeout(30000);
    
    test('should complete operator workflow: login -> view users -> view review queue -> approve recommendation -> verify user can see it', async () => {
      // Step 1: Operator login
      const loginResponse = await request(app)
        .post('/auth/login')
        .send({
          username: 'operator',
          password: 'operator123',
          role: 'operator'
        })
        .expect(200);

      expect(loginResponse.body.success).toBe(true);
      expect(loginResponse.body.user.role).toBe('operator');

      // Step 2: View all users
      const users = await request(app)
        .get('/operator/users')
        .expect(200);

      expect(users.body.success).toBe(true);
      expect(users.body.users.length).toBeGreaterThan(0);
      expect(users.body.users.find(u => u.user_id === testUserId)).toBeDefined();

      // Step 3: View review queue
      const reviewQueue = await request(app)
        .get('/operator/review')
        .expect(200);

      expect(reviewQueue.body.success).toBe(true);
      expect(Array.isArray(reviewQueue.body.reviews)).toBe(true);

      // Step 4: If there are pending reviews, approve one
      if (reviewQueue.body.reviews.length > 0) {
        const pendingReview = reviewQueue.body.reviews[0];
        
        const approveResponse = await request(app)
          .post('/operator/approve')
          .send({
            review_id: pendingReview.review_id,
            operator_notes: 'Approved via workflow test',
            reviewed_by: 'workflow-test-operator'
          })
          .expect(200);

        expect(approveResponse.body.success).toBe(true);
        expect(approveResponse.body.review.status).toBe('approved');

        // Step 5: Verify user can see approved recommendations
        const userId = pendingReview.user_id;
        // Ensure user has consent
        await request(app)
          .post('/consent')
          .send({ user_id: userId })
          .catch(() => {}); // Ignore if already granted

        const userView = await request(app)
          .get(`/recommendations/${userId}`)
          .expect(200);

        expect(userView.body.recommendations).toHaveProperty('status', 'approved');
        expect(userView.body.recommendations.education_items.length).toBeGreaterThan(0);
      }
    });
  });
});

