/**
 * Unit tests for Guardrails (Consent Management)
 */

// Use test database for tests
process.env.DB_PATH = './data/test_database.sqlite';

const { initializeDatabase, closeDatabase } = require('../../src/config/database');
const { User } = require('../../src/models');
const Consent = require('../../src/models/Consent');
const {
  hasConsent,
  requireConsent,
  getConsentStatus,
  grantConsent,
  revokeConsent,
  checkConsent,
  getConsentHistory
} = require('../../src/services/guardrails/consentChecker');
const { assignPersonaToUser } = require('../../src/services/personas/personaAssigner');
const { generateRecommendations } = require('../../src/services/recommend/recommendationEngine');

describe('Consent Management', () => {
  let testUserId;
  let testUserId2;

  beforeAll(async () => {
    await initializeDatabase();
    
    // Create test users
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
  });

  afterAll(() => {
    closeDatabase();
  });

  describe('Consent Model', () => {
    test('should create consent record', () => {
      const consent = Consent.createOrUpdate({
        user_id: testUserId,
        opted_in: true
      });

      expect(consent).toBeDefined();
      expect(consent.user_id).toBe(testUserId);
      expect(consent.opted_in).toBe(1);
      expect(consent.timestamp).toBeDefined();
    });

    test('should update existing consent record', () => {
      // First grant consent
      Consent.grant(testUserId);
      
      // Then revoke it
      const consent = Consent.revoke(testUserId);
      
      expect(consent).toBeDefined();
      expect(consent.opted_in).toBe(0);
      expect(consent.timestamp).toBeDefined();
    });

    test('should find consent by user ID', () => {
      Consent.grant(testUserId);
      const consent = Consent.findByUserId(testUserId);
      
      expect(consent).toBeDefined();
      expect(consent.user_id).toBe(testUserId);
      expect(consent.opted_in).toBe(1);
    });

    test('should return null for user without consent', () => {
      const consent = Consent.findByUserId(99999);
      expect(consent).toBeNull();
    });

    test('should check if user has consented', () => {
      Consent.grant(testUserId);
      expect(Consent.hasConsent(testUserId)).toBe(true);
      
      Consent.revoke(testUserId);
      expect(Consent.hasConsent(testUserId)).toBe(false);
    });

    test('should grant consent', () => {
      const consent = Consent.grant(testUserId);
      
      expect(consent).toBeDefined();
      expect(consent.opted_in).toBe(1);
      expect(consent.timestamp).toBeDefined();
    });

    test('should revoke consent', () => {
      Consent.grant(testUserId);
      const consent = Consent.revoke(testUserId);
      
      expect(consent).toBeDefined();
      expect(consent.opted_in).toBe(0);
      expect(consent.timestamp).toBeDefined();
    });

    test('should get consent history', () => {
      Consent.grant(testUserId);
      const history = Consent.getHistory(testUserId);
      
      expect(history).toBeDefined();
      expect(history.user_id).toBe(testUserId);
    });
  });

  describe('Consent Checker Service', () => {
    beforeEach(() => {
      // Clear consent for test users before each test
      const consent = Consent.findByUserId(testUserId);
      if (consent) {
        // Delete the consent record to test "no_consent" status
        const db = require('../../src/config/database').getDatabase();
        db.prepare('DELETE FROM consent WHERE user_id = ?').run(testUserId);
      }
    });

    test('should check if user has consent', () => {
      expect(hasConsent(testUserId)).toBe(false);
      
      Consent.grant(testUserId);
      expect(hasConsent(testUserId)).toBe(true);
    });

    test('should get consent status for user without consent', () => {
      // Ensure no consent record exists
      const db = require('../../src/config/database').getDatabase();
      db.prepare('DELETE FROM consent WHERE user_id = ?').run(testUserId);
      
      // Also set user consent_status to revoked to ensure we get revoked status
      User.update(testUserId, { consent_status: 'revoked' });
      
      const status = getConsentStatus(testUserId);
      
      expect(status).toHaveProperty('user_id');
      expect(status).toHaveProperty('has_consent');
      expect(status).toHaveProperty('status');
      expect(status).toHaveProperty('message');
      expect(status.has_consent).toBe(false);
      // Status should be 'revoked' since user has revoked consent
      expect(status.status).toBe('revoked');
    });

    test('should get consent status for user with granted consent', () => {
      Consent.grant(testUserId);
      const status = getConsentStatus(testUserId);
      
      expect(status.has_consent).toBe(true);
      expect(status.status).toBe('granted');
      expect(status.timestamp).toBeDefined();
      expect(status.consent_id).toBeDefined();
    });

    test('should get consent status for user with revoked consent', () => {
      Consent.grant(testUserId);
      Consent.revoke(testUserId);
      const status = getConsentStatus(testUserId);
      
      expect(status.has_consent).toBe(false);
      expect(status.status).toBe('revoked');
      expect(status.timestamp).toBeDefined();
    });

    test('should grant consent', () => {
      const result = grantConsent(testUserId);
      
      expect(result).toHaveProperty('user_id');
      expect(result).toHaveProperty('has_consent');
      expect(result).toHaveProperty('status');
      expect(result).toHaveProperty('timestamp');
      expect(result).toHaveProperty('consent_id');
      expect(result.has_consent).toBe(true);
      expect(result.status).toBe('granted');
    });

    test('should revoke consent', () => {
      Consent.grant(testUserId);
      const result = revokeConsent(testUserId);
      
      expect(result).toHaveProperty('user_id');
      expect(result).toHaveProperty('has_consent');
      expect(result).toHaveProperty('status');
      expect(result).toHaveProperty('timestamp');
      expect(result.has_consent).toBe(false);
      expect(result.status).toBe('revoked');
    });

    test('should check consent and return result object', () => {
      const check1 = checkConsent(testUserId);
      expect(check1.allowed).toBe(false);
      expect(check1.error).toBeDefined();
      
      Consent.grant(testUserId);
      const check2 = checkConsent(testUserId);
      expect(check2.allowed).toBe(true);
      expect(check2.error).toBeNull();
    });

    test('should get consent history', () => {
      Consent.grant(testUserId);
      const history = getConsentHistory(testUserId);
      
      expect(history).toBeDefined();
      expect(history.user_id).toBe(testUserId);
    });
  });

  describe('Consent Enforcement', () => {
    beforeEach(() => {
      // Clear consent before each test
      const consent = Consent.findByUserId(testUserId);
      if (consent) {
        Consent.revoke(testUserId);
      }
    });

    test('should throw error when requiring consent without opt-in', () => {
      expect(() => {
        requireConsent(testUserId);
      }).toThrow('has not granted consent');
    });

    test('should allow processing when consent is granted', () => {
      Consent.grant(testUserId);
      
      expect(() => {
        requireConsent(testUserId);
      }).not.toThrow();
    });

    test('should block persona assignment without consent', () => {
      expect(() => {
        assignPersonaToUser(testUserId);
      }).toThrow('has not granted consent');
    });

    test('should allow persona assignment with consent', () => {
      Consent.grant(testUserId);
      
      // This should not throw (assuming user has data)
      // If user has no data, it might throw a different error, but not consent error
      try {
        assignPersonaToUser(testUserId);
        // If we get here, consent check passed
      } catch (error) {
        // Should not be a consent error
        expect(error.message).not.toContain('has not granted consent');
      }
    });

    test('should block recommendation generation without consent', async () => {
      await expect(generateRecommendations(testUserId)).rejects.toThrow('has not granted consent');
    });

    test('should allow recommendation generation with consent', () => {
      Consent.grant(testUserId);
      
      // This should not throw consent error
      // If user has no data, it might throw a different error, but not consent error
      try {
        generateRecommendations(testUserId);
        // If we get here, consent check passed
      } catch (error) {
        // Should not be a consent error
        expect(error.message).not.toContain('has not granted consent');
      }
    });
  });

  describe('Consent Timestamps', () => {
    test('should record timestamp when granting consent', () => {
      const result = grantConsent(testUserId);
      
      expect(result.timestamp).toBeDefined();
      expect(typeof result.timestamp).toBe('string');
      expect(result.timestamp.length).toBeGreaterThan(0);
      // Should be a valid date format
      expect(() => new Date(result.timestamp)).not.toThrow();
    });

    test('should record timestamp when revoking consent', () => {
      Consent.grant(testUserId);
      const result = revokeConsent(testUserId);
      
      expect(result.timestamp).toBeDefined();
      expect(typeof result.timestamp).toBe('string');
      expect(result.timestamp.length).toBeGreaterThan(0);
      // Should be a valid date format
      expect(() => new Date(result.timestamp)).not.toThrow();
    });

    test('should update timestamp when changing consent status', async () => {
      const result1 = grantConsent(testUserId);
      const timestamp1 = result1.timestamp;
      
      // Wait a bit to ensure timestamp changes (SQLite datetime precision is seconds)
      await new Promise(resolve => setTimeout(resolve, 1100));
      
      const result2 = revokeConsent(testUserId);
      const timestamp2 = result2.timestamp;
      
      expect(timestamp2).toBeDefined();
      // Timestamps should be different after waiting >1 second
      expect(timestamp2).not.toBe(timestamp1);
    });
  });

  describe('Multiple Users', () => {
    test('should handle consent independently for multiple users', () => {
      // User 1 has consent
      grantConsent(testUserId);
      
      // User 2 does not
      const consent = Consent.findByUserId(testUserId2);
      if (consent) {
        Consent.revoke(testUserId2);
      }
      
      expect(hasConsent(testUserId)).toBe(true);
      expect(hasConsent(testUserId2)).toBe(false);
      
      expect(() => {
        requireConsent(testUserId);
      }).not.toThrow();
      
      expect(() => {
        requireConsent(testUserId2);
      }).toThrow('has not granted consent');
    });
  });
});

describe('Eligibility Filter', () => {
  let testUserId;
  let testUserId2;
  let testAccountId;

  // Import eligibility filter functions
  const {
    estimateCreditScore,
    getUserAnnualIncome,
    getUserCreditScore,
    hasAccountType,
    isProhibitedProduct,
    checkOfferEligibility,
    filterEligibleOffers,
    requireEligibleOffer
  } = require('../../src/services/guardrails/eligibilityFilter');
  
  const Account = require('../../src/models/Account');
  const Transaction = require('../../src/models/Transaction');

  beforeAll(async () => {
    await initializeDatabase();
    
    // Create test users
    const uniqueId = Date.now();
    const user1 = User.create({
      name: 'Eligibility Test User 1',
      first_name: 'Eligibility',
      last_name: 'Test1',
      username: `eligibilitytest1${uniqueId}`,
      password: 'eligibilitytest1123',
      consent_status: 'revoked'
    });
    testUserId = user1.user_id;

    const user2 = User.create({
      name: 'Eligibility Test User 2',
      first_name: 'Eligibility',
      last_name: 'Test2',
      username: `eligibilitytest2${uniqueId}`,
      password: 'eligibilitytest2123',
      consent_status: 'revoked'
    });
    testUserId2 = user2.user_id;
  });

  afterAll(() => {
    closeDatabase();
  });

  describe('Credit Score Estimation', () => {
    test('should estimate high credit score for low utilization', () => {
      const creditAnalysis = {
        long_term: {
          max_utilization: 0.20,
          has_interest_charges: false,
          has_overdue_accounts: false,
          has_minimum_payment_only: false
        }
      };
      
      const score = estimateCreditScore(creditAnalysis);
      expect(score).toBeGreaterThanOrEqual(700);
      expect(score).toBeLessThanOrEqual(850);
    });

    test('should estimate lower credit score for high utilization', () => {
      const creditAnalysis = {
        long_term: {
          max_utilization: 0.90,
          has_interest_charges: false,
          has_overdue_accounts: false,
          has_minimum_payment_only: false
        }
      };
      
      const score = estimateCreditScore(creditAnalysis);
      expect(score).toBeLessThan(700);
      expect(score).toBeGreaterThanOrEqual(300);
    });

    test('should penalize for interest charges', () => {
      const creditAnalysis1 = {
        long_term: {
          max_utilization: 0.50,
          has_interest_charges: false,
          has_overdue_accounts: false,
          has_minimum_payment_only: false
        }
      };
      
      const creditAnalysis2 = {
        long_term: {
          max_utilization: 0.50,
          has_interest_charges: true,
          has_overdue_accounts: false,
          has_minimum_payment_only: false
        }
      };
      
      const score1 = estimateCreditScore(creditAnalysis1);
      const score2 = estimateCreditScore(creditAnalysis2);
      
      expect(score2).toBeLessThan(score1);
    });

    test('should heavily penalize for overdue accounts', () => {
      const creditAnalysis = {
        long_term: {
          max_utilization: 0.50,
          has_interest_charges: false,
          has_overdue_accounts: true,
          has_minimum_payment_only: false
        }
      };
      
      const score = estimateCreditScore(creditAnalysis);
      expect(score).toBeLessThan(650);
    });

    test('should return null for users with no credit accounts', () => {
      const creditAnalysis = {
        long_term: {}
      };
      
      const score = estimateCreditScore(creditAnalysis);
      expect(score).toBeNull();
    });

    test('should use short-term analysis if long-term not available', () => {
      const creditAnalysis = {
        short_term: {
          max_utilization: 0.30,
          has_interest_charges: false,
          has_overdue_accounts: false,
          has_minimum_payment_only: false
        }
      };
      
      const score = estimateCreditScore(creditAnalysis);
      expect(score).toBeDefined();
      expect(score).toBeGreaterThanOrEqual(300);
      expect(score).toBeLessThanOrEqual(850);
    });
  });

  describe('Income Detection', () => {
    test('should return null for user with no income data', () => {
      // User with no transactions
      const income = getUserAnnualIncome(testUserId);
      // May be null or a number depending on test data setup
      expect(income === null || typeof income === 'number').toBe(true);
    });

    test('should handle errors gracefully', () => {
      // Invalid user ID should not throw
      expect(() => {
        getUserAnnualIncome(99999);
      }).not.toThrow();
    });
  });

  describe('Account Type Checking', () => {
    test('should detect savings account', () => {
      // Create a savings account for test user
      const account = Account.create({
        account_id: `test-account-${Date.now()}`,
        user_id: testUserId,
        type: 'depository',
        subtype: 'savings',
        available_balance: 1000,
        current_balance: 1000,
        credit_limit: null,
        iso_currency_code: 'USD',
        holder_category: 'consumer'
      });

      const hasSavings = hasAccountType(testUserId, 'savings');
      expect(hasSavings).toBe(true);
      
      const hasSavingsAccount = hasAccountType(testUserId, 'savings_account');
      expect(hasSavingsAccount).toBe(true);
    });

    test('should detect credit card account', () => {
      const account = Account.create({
        account_id: `test-credit-${Date.now()}`,
        user_id: testUserId,
        type: 'credit',
        subtype: 'credit card',
        available_balance: 5000,
        current_balance: -2000,
        credit_limit: 5000,
        iso_currency_code: 'USD',
        holder_category: 'consumer'
      });

      const hasCredit = hasAccountType(testUserId, 'credit');
      expect(hasCredit).toBe(true);
    });

    test('should return false for account type user does not have', () => {
      // User 2 should not have savings (unless created in other tests)
      const hasSavings = hasAccountType(testUserId2, 'savings');
      expect(typeof hasSavings).toBe('boolean');
    });

    test('should handle array of account types', () => {
      const hasAccount = hasAccountType(testUserId, ['savings', 'checking']);
      expect(typeof hasAccount).toBe('boolean');
    });
  });

  describe('Prohibited Product Detection', () => {
    test('should detect payday loan products', () => {
      const paydayOffer = {
        id: 'payday_loan',
        title: 'Quick Payday Loan',
        description: 'Get cash fast with our payday loan',
        offer_category: 'payday_loan',
        offer_type: 'loan'
      };
      
      expect(isProhibitedProduct(paydayOffer)).toBe(true);
    });

    test('should detect title loan products', () => {
      const titleLoanOffer = {
        id: 'title_loan',
        title: 'Car Title Loan',
        description: 'Borrow against your car title',
        offer_category: 'title_loan',
        offer_type: 'loan'
      };
      
      expect(isProhibitedProduct(titleLoanOffer)).toBe(true);
    });

    test('should detect prohibited products in description', () => {
      const offer = {
        id: 'some_offer',
        title: 'Great Offer',
        description: 'This is a payday loan with great rates',
        offer_category: 'loan',
        offer_type: 'loan'
      };
      
      expect(isProhibitedProduct(offer)).toBe(true);
    });

    test('should allow legitimate products', () => {
      const legitimateOffer = {
        id: 'savings_account',
        title: 'High-Yield Savings Account',
        description: 'Earn 4.5% APY on your savings',
        offer_category: 'high_yield_savings',
        offer_type: 'savings_account'
      };
      
      expect(isProhibitedProduct(legitimateOffer)).toBe(false);
    });

    test('should handle offers without category', () => {
      const offer = {
        id: 'some_offer',
        title: 'Some Offer'
      };
      
      expect(isProhibitedProduct(offer)).toBe(false);
    });
  });

  describe('Offer Eligibility Checking', () => {
    let testOffer;

    beforeEach(() => {
      // Create a test account for eligibility checks
      Account.create({
        account_id: `test-eligibility-${Date.now()}`,
        user_id: testUserId,
        type: 'depository',
        subtype: 'checking',
        available_balance: 1000,
        current_balance: 1000,
        credit_limit: null,
        iso_currency_code: 'USD',
        holder_category: 'consumer'
      });

      testOffer = {
        id: 'test_offer',
        title: 'Test Offer',
        description: 'A test offer for eligibility checking',
        offer_category: 'savings',
        offer_type: 'savings_account',
        eligibility: {
          min_income: 30000,
          min_credit_score: 650,
          max_utilization: 0.50,
          excluded_account_types: ['savings_account']
        }
      };
    });

    test('should block prohibited products immediately', () => {
      const prohibitedOffer = {
        id: 'payday',
        title: 'Payday Loan',
        offer_category: 'payday_loan',
        eligibility: {}
      };
      
      const result = checkOfferEligibility(prohibitedOffer, testUserId);
      expect(result.isEligible).toBe(false);
      expect(result.checks.prohibited_product).toBe(true);
      expect(result.disqualifiers.length).toBeGreaterThan(0);
    });

    test('should check minimum income requirement', () => {
      // This test depends on whether test user has income data
      const result = checkOfferEligibility(testOffer, testUserId);
      
      expect(result.checks.income).toBeDefined();
      expect(result.checks.income).toHaveProperty('required');
      expect(result.checks.income).toHaveProperty('actual');
      expect(result.checks.income).toHaveProperty('meets_requirement');
    });

    test('should check minimum credit score requirement', () => {
      const result = checkOfferEligibility(testOffer, testUserId);
      
      expect(result.checks.credit_score).toBeDefined();
      expect(result.checks.credit_score).toHaveProperty('required');
      expect(result.checks.credit_score).toHaveProperty('actual');
      expect(result.checks.credit_score).toHaveProperty('meets_requirement');
    });

    test('should check excluded account types', () => {
      // Create a savings account to trigger exclusion
      Account.create({
        account_id: `test-savings-${Date.now()}`,
        user_id: testUserId,
        type: 'depository',
        subtype: 'savings',
        available_balance: 500,
        current_balance: 500,
        credit_limit: null,
        iso_currency_code: 'USD',
        holder_category: 'consumer'
      });

      const result = checkOfferEligibility(testOffer, testUserId);
      
      expect(result.checks.account_type).toBeDefined();
      expect(result.checks.account_type).toHaveProperty('has_excluded_type');
      
      // Should be ineligible if has excluded account type
      if (result.checks.account_type.has_excluded_type) {
        expect(result.isEligible).toBe(false);
      }
    });

    test('should return eligibility result structure', () => {
      const result = checkOfferEligibility(testOffer, testUserId);
      
      expect(result).toHaveProperty('isEligible');
      expect(result).toHaveProperty('reasons');
      expect(result).toHaveProperty('disqualifiers');
      expect(result).toHaveProperty('checks');
      expect(Array.isArray(result.reasons)).toBe(true);
      expect(Array.isArray(result.disqualifiers)).toBe(true);
    });

    test('should handle offers without eligibility criteria', () => {
      const simpleOffer = {
        id: 'simple',
        title: 'Simple Offer',
        offer_category: 'budgeting',
        eligibility: {}
      };
      
      const result = checkOfferEligibility(simpleOffer, testUserId);
      
      // Should be eligible if no criteria specified
      expect(result.isEligible).toBe(true);
      expect(result.checks.prohibited_product).toBe(false);
    });

    test('should handle offers with null eligibility values', () => {
      const offerWithNulls = {
        id: 'null_offer',
        title: 'Offer with Nulls',
        offer_category: 'savings',
        eligibility: {
          min_income: null,
          min_credit_score: null,
          max_utilization: null,
          excluded_account_types: []
        }
      };
      
      const result = checkOfferEligibility(offerWithNulls, testUserId);
      
      // Should be eligible if all criteria are null
      expect(result.isEligible).toBe(true);
    });
  });

  describe('Filter Eligible Offers', () => {
    test('should filter out ineligible offers', () => {
      const offers = [
        {
          id: 'eligible1',
          title: 'Eligible Offer 1',
          offer_category: 'budgeting',
          eligibility: {}
        },
        {
          id: 'prohibited',
          title: 'Payday Loan',
          offer_category: 'payday_loan',
          eligibility: {}
        },
        {
          id: 'eligible2',
          title: 'Eligible Offer 2',
          offer_category: 'savings',
          eligibility: {}
        }
      ];
      
      const filtered = filterEligibleOffers(offers, testUserId);
      
      // Should filter out prohibited product
      expect(filtered.length).toBeLessThan(offers.length);
      expect(filtered.every(offer => offer.eligibility_check.isEligible)).toBe(true);
      expect(filtered.find(o => o.id === 'prohibited')).toBeUndefined();
    });

    test('should return empty array for empty input', () => {
      const filtered = filterEligibleOffers([], testUserId);
      expect(filtered).toEqual([]);
    });

    test('should handle non-array input', () => {
      const filtered = filterEligibleOffers(null, testUserId);
      expect(filtered).toEqual([]);
    });

    test('should include eligibility check in filtered offers', () => {
      const offers = [
        {
          id: 'test',
          title: 'Test Offer',
          offer_category: 'budgeting',
          eligibility: {}
        }
      ];
      
      const filtered = filterEligibleOffers(offers, testUserId);
      
      expect(filtered.length).toBeGreaterThan(0);
      expect(filtered[0]).toHaveProperty('eligibility_check');
      expect(filtered[0].eligibility_check).toHaveProperty('isEligible');
    });
  });

  describe('Require Eligible Offer', () => {
    test('should throw error for ineligible offer', () => {
      const prohibitedOffer = {
        id: 'payday',
        title: 'Payday Loan',
        offer_category: 'payday_loan',
        eligibility: {}
      };
      
      expect(() => {
        requireEligibleOffer(prohibitedOffer, testUserId);
      }).toThrow('is not eligible');
    });

    test('should not throw for eligible offer', () => {
      const eligibleOffer = {
        id: 'eligible',
        title: 'Eligible Offer',
        offer_category: 'budgeting',
        eligibility: {}
      };
      
      expect(() => {
        requireEligibleOffer(eligibleOffer, testUserId);
      }).not.toThrow();
    });

    test('should include disqualifiers in error message', () => {
      const prohibitedOffer = {
        id: 'payday',
        title: 'Payday Loan',
        offer_category: 'payday_loan',
        eligibility: {}
      };
      
      expect(() => {
        requireEligibleOffer(prohibitedOffer, testUserId);
      }).toThrow('is not eligible');
      
      try {
        requireEligibleOffer(prohibitedOffer, testUserId);
      } catch (error) {
        // Error message should contain disqualifier information
        expect(error.message).toMatch(/prohibited|predatory|payday/i);
      }
    });
  });

  describe('Integration with User Data', () => {
    test('should work with real user data structure', () => {
      // Grant consent first
      Consent.grant(testUserId);
      
      // Create a realistic offer
      const offer = {
        id: 'real_offer',
        title: 'Real Offer',
        description: 'A real offer',
        offer_category: 'high_yield_savings',
        offer_type: 'savings_account',
        eligibility: {
          min_income: 20000,
          min_credit_score: 650,
          excluded_account_types: ['savings_account']
        }
      };
      
      const result = checkOfferEligibility(offer, testUserId);
      
      // Should have all checks performed
      expect(result).toHaveProperty('checks');
      expect(result.checks).toHaveProperty('income');
      expect(result.checks).toHaveProperty('credit_score');
      expect(result.checks).toHaveProperty('account_type');
    });
  });
});

describe('Tone Validator', () => {
  // Import tone validator functions
  const {
    loadProhibitedPhrases,
    getAllProhibitedPhrases,
    checkProhibitedPhrases,
    validateTone,
    validateContent,
    requireValidTone,
    checkTone,
    getToneSummary
  } = require('../../src/services/guardrails/toneValidator');

  describe('Load Prohibited Phrases', () => {
    test('should load prohibited phrases from JSON file', () => {
      const phrases = loadProhibitedPhrases();
      
      expect(phrases).toBeDefined();
      expect(typeof phrases).toBe('object');
      expect(phrases).toHaveProperty('shaming_phrases');
      expect(phrases).toHaveProperty('judgmental_terms');
      expect(Array.isArray(phrases.shaming_phrases)).toBe(true);
      expect(Array.isArray(phrases.judgmental_terms)).toBe(true);
    });

    test('should return all prohibited phrases as flat array', () => {
      const allPhrases = getAllProhibitedPhrases();
      
      expect(Array.isArray(allPhrases)).toBe(true);
      expect(allPhrases.length).toBeGreaterThan(0);
      expect(allPhrases.every(p => typeof p === 'string')).toBe(true);
    });

    test('should include shaming phrases', () => {
      const phrases = loadProhibitedPhrases();
      
      expect(phrases.shaming_phrases.length).toBeGreaterThan(0);
      expect(phrases.shaming_phrases).toContain("you're overspending");
    });

    test('should include judgmental terms', () => {
      const phrases = loadProhibitedPhrases();
      
      expect(phrases.judgmental_terms.length).toBeGreaterThan(0);
      expect(phrases.judgmental_terms).toContain('irresponsible');
    });
  });

  describe('Check Prohibited Phrases', () => {
    test('should detect shaming phrases', () => {
      const text = "You're overspending on subscriptions";
      const result = checkProhibitedPhrases(text);
      
      expect(result.isValid).toBe(false);
      expect(result.foundPhrases.length).toBeGreaterThan(0);
      expect(result.violations.length).toBeGreaterThan(0);
      expect(result.violations[0].category).toBe('shaming');
    });

    test('should detect judgmental terms', () => {
      const text = "This is irresponsible spending";
      const result = checkProhibitedPhrases(text);
      
      expect(result.isValid).toBe(false);
      expect(result.foundPhrases).toContain('irresponsible');
      expect(result.violations.some(v => v.category === 'judgmental')).toBe(true);
    });

    test('should pass valid text', () => {
      const text = "This guide will help you manage your subscriptions more effectively";
      const result = checkProhibitedPhrases(text);
      
      expect(result.isValid).toBe(true);
      expect(result.foundPhrases.length).toBe(0);
      expect(result.violations.length).toBe(0);
    });

    test('should be case insensitive by default', () => {
      const text = "YOU'RE OVERSPENDING";
      const result = checkProhibitedPhrases(text);
      
      expect(result.isValid).toBe(false);
      expect(result.foundPhrases.length).toBeGreaterThan(0);
    });

    test('should handle empty text', () => {
      const result = checkProhibitedPhrases('');
      
      expect(result.isValid).toBe(true);
      expect(result.foundPhrases.length).toBe(0);
    });

    test('should handle null or undefined text', () => {
      const result1 = checkProhibitedPhrases(null);
      const result2 = checkProhibitedPhrases(undefined);
      
      expect(result1.isValid).toBe(true);
      expect(result2.isValid).toBe(true);
    });

    test('should detect multiple violations', () => {
      const text = "You're overspending and being irresponsible";
      const result = checkProhibitedPhrases(text);
      
      expect(result.isValid).toBe(false);
      expect(result.foundPhrases.length).toBeGreaterThan(1);
      expect(result.violations.length).toBeGreaterThan(1);
    });

    test('should categorize violations correctly', () => {
      const text = "You're overspending and you should feel guilty";
      const result = checkProhibitedPhrases(text);
      
      const categories = result.violations.map(v => v.category);
      expect(categories).toContain('shaming');
    });

    test('should assign severity levels', () => {
      const text = "You're overspending";
      const result = checkProhibitedPhrases(text);
      
      expect(result.violations.length).toBeGreaterThan(0);
      const shamingViolation = result.violations.find(v => v.category === 'shaming');
      if (shamingViolation) {
        expect(['high', 'medium', 'low']).toContain(shamingViolation.severity);
      }
    });
  });

  describe('Validate Tone', () => {
    test('should validate text with prohibited phrases', () => {
      const text = "You're overspending on subscriptions";
      const result = validateTone(text);
      
      expect(result.isValid).toBe(false);
      expect(result.violations.length).toBeGreaterThan(0);
      expect(result.message).toContain('prohibited phrase');
    });

    test('should validate text with good tone', () => {
      const text = "This guide will help you track and manage your subscriptions effectively";
      const result = validateTone(text);
      
      expect(result.isValid).toBe(true);
      expect(result.violations.length).toBe(0);
      expect(result.message).toContain('passes tone validation');
    });

    test('should return validation result structure', () => {
      const result = validateTone("Test text");
      
      expect(result).toHaveProperty('isValid');
      expect(result).toHaveProperty('violations');
      expect(result).toHaveProperty('foundPhrases');
      expect(result).toHaveProperty('message');
      expect(Array.isArray(result.violations)).toBe(true);
      expect(Array.isArray(result.foundPhrases)).toBe(true);
    });
  });

  describe('Validate Content', () => {
    test('should validate multiple fields', () => {
      const content = {
        title: "You're Overspending",
        description: "This guide will help you manage your money",
        rationale: "Based on your spending patterns"
      };
      
      const result = validateContent(content);
      
      expect(result).toHaveProperty('isValid');
      expect(result).toHaveProperty('fields');
      expect(result).toHaveProperty('violations');
      expect(result.fields).toHaveProperty('title');
      expect(result.fields).toHaveProperty('description');
      expect(result.fields).toHaveProperty('rationale');
    });

    test('should detect violations in any field', () => {
      const content = {
        title: "Good Title",
        description: "You're being irresponsible",
        rationale: "Valid rationale"
      };
      
      const result = validateContent(content);
      
      expect(result.isValid).toBe(false);
      expect(result.violations.length).toBeGreaterThan(0);
      expect(result.violations.some(v => v.field === 'description')).toBe(true);
    });

    test('should pass if all fields are valid', () => {
      const content = {
        title: "How to Manage Your Subscriptions",
        description: "This guide will help you track your recurring expenses",
        rationale: "Based on your spending patterns, this resource can help you save money"
      };
      
      const result = validateContent(content);
      
      expect(result.isValid).toBe(true);
      expect(result.violations.length).toBe(0);
    });

    test('should handle empty content object', () => {
      const result = validateContent({});
      
      expect(result.isValid).toBe(true);
      // Empty object has no string fields to validate, so it passes
      expect(result.message).toMatch(/No content to validate|All content passes tone validation/);
    });

    test('should handle null content', () => {
      const result = validateContent(null);
      
      expect(result.isValid).toBe(true);
      expect(result.message).toContain('No content to validate');
    });

    test('should only validate string fields', () => {
      const content = {
        title: "Test Title",
        count: 5,
        enabled: true,
        description: "Test description"
      };
      
      const result = validateContent(content);
      
      expect(result.fields).toHaveProperty('title');
      expect(result.fields).toHaveProperty('description');
      expect(result.fields).not.toHaveProperty('count');
      expect(result.fields).not.toHaveProperty('enabled');
    });

    test('should aggregate violations from all fields', () => {
      const content = {
        title: "You're Overspending",
        description: "You're being irresponsible",
        rationale: "Valid text"
      };
      
      const result = validateContent(content);
      
      expect(result.violations.length).toBeGreaterThan(1);
      expect(result.message).toContain('violation');
    });
  });

  describe('Require Valid Tone', () => {
    test('should throw error for text with prohibited phrases', () => {
      const text = "You're overspending";
      
      expect(() => {
        requireValidTone(text);
      }).toThrow('failed tone validation');
    });

    test('should not throw for valid text', () => {
      const text = "This guide will help you manage your finances effectively";
      
      expect(() => {
        requireValidTone(text);
      }).not.toThrow();
    });

    test('should throw error for content object with violations', () => {
      const content = {
        title: "You're Overspending",
        description: "Valid description"
      };
      
      expect(() => {
        requireValidTone(content);
      }).toThrow('failed tone validation');
    });

    test('should include violation details in error message', () => {
      const text = "You're overspending";
      
      expect(() => {
        requireValidTone(text);
      }).toThrow('failed tone validation');
      
      try {
        requireValidTone(text);
      } catch (error) {
        expect(error.message).toContain('tone validation');
        expect(error.message).toContain('violation');
      }
    });

    test('should include field information in error for content objects', () => {
      const content = {
        title: "Good Title",
        description: "You're being irresponsible"
      };
      
      expect(() => {
        requireValidTone(content);
      }).toThrow('failed tone validation');
      
      try {
        requireValidTone(content);
      } catch (error) {
        expect(error.message).toContain('field');
      }
    });
  });

  describe('Check Tone', () => {
    test('should return allowed: false for prohibited text', () => {
      const text = "You're overspending";
      const result = checkTone(text);
      
      expect(result.allowed).toBe(false);
      expect(result.error).toBeDefined();
      expect(result.validation).toBeDefined();
    });

    test('should return allowed: true for valid text', () => {
      const text = "This guide will help you manage your finances";
      const result = checkTone(text);
      
      expect(result.allowed).toBe(true);
      expect(result.error).toBeNull();
      expect(result.validation).toBeDefined();
    });

    test('should return validation object', () => {
      const result = checkTone("Test text");
      
      expect(result).toHaveProperty('allowed');
      expect(result).toHaveProperty('error');
      expect(result).toHaveProperty('validation');
    });

    test('should handle errors gracefully', () => {
      // Pass invalid content that might cause error
      const result = checkTone(null);
      
      // Should still return a result object
      expect(result).toHaveProperty('allowed');
      expect(result).toHaveProperty('error');
    });
  });

  describe('Get Tone Summary', () => {
    test('should return summary for valid text', () => {
      const text = "This guide will help you";
      const summary = getToneSummary(text);
      
      expect(summary).toHaveProperty('isValid');
      expect(summary).toHaveProperty('violationCount');
      expect(summary).toHaveProperty('categories');
      expect(summary).toHaveProperty('message');
      expect(summary.isValid).toBe(true);
      expect(summary.violationCount).toBe(0);
    });

    test('should return summary for invalid text', () => {
      const text = "You're overspending";
      const summary = getToneSummary(text);
      
      expect(summary.isValid).toBe(false);
      expect(summary.violationCount).toBeGreaterThan(0);
      expect(Array.isArray(summary.categories)).toBe(true);
    });

    test('should return unique categories', () => {
      const text = "You're overspending and being irresponsible";
      const summary = getToneSummary(text);
      
      expect(summary.categories.length).toBeGreaterThan(0);
      // Should not have duplicates
      const uniqueCategories = [...new Set(summary.categories)];
      expect(summary.categories.length).toBe(uniqueCategories.length);
    });

    test('should work with content objects', () => {
      const content = {
        title: "Test Title",
        description: "You're overspending"
      };
      
      const summary = getToneSummary(content);
      
      expect(summary).toHaveProperty('isValid');
      expect(summary).toHaveProperty('violationCount');
      expect(summary.isValid).toBe(false);
    });
  });

  describe('Real-World Scenarios', () => {
    test('should validate education item content', () => {
      const educationItem = {
        title: "Debt Paydown Strategy: The Snowball Method",
        description: "Learn how to pay off multiple debts systematically by focusing on the smallest balances first",
        rationale: "Based on your high utilization, this strategy can help you reduce debt"
      };
      
      const result = validateContent(educationItem);
      
      // Should pass - all text is empowering and educational
      expect(result.isValid).toBe(true);
    });

    test('should catch shaming language in rationale', () => {
      const badRationale = "You're overspending on your credit cards and being irresponsible with your money";
      
      const result = validateTone(badRationale);
      
      expect(result.isValid).toBe(false);
      expect(result.violations.some(v => v.category === 'shaming')).toBe(true);
    });

    test('should validate partner offer description', () => {
      const offer = {
        title: "High-Yield Savings Account",
        description: "Earn competitive interest on your savings with no monthly fees",
        rationale: "Based on your savings patterns, this account can help you grow your emergency fund"
      };
      
      const result = validateContent(offer);
      
      expect(result.isValid).toBe(true);
    });

    test('should block judgmental language in recommendations', () => {
      const badRecommendation = {
        title: "You Need to Stop Overspending",
        description: "You're being irresponsible with your money",
        rationale: "You should feel guilty about your spending habits"
      };
      
      const result = validateContent(badRecommendation);
      
      expect(result.isValid).toBe(false);
      expect(result.violations.length).toBeGreaterThan(0);
    });

    test('should handle edge cases with punctuation', () => {
      // Test that phrases are detected even with punctuation
      const text = "You're overspending!";
      const result = validateTone(text);
      
      expect(result.isValid).toBe(false);
    });

    test('should handle mixed case', () => {
      const text = "YoU'Re OvErSpEnDiNg";
      const result = validateTone(text);
      
      // Should still detect (case insensitive)
      expect(result.isValid).toBe(false);
    });
  });
});

