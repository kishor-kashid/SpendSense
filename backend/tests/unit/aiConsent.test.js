/**
 * Unit tests for AI Consent Management
 */

// Use test database for tests
process.env.DB_PATH = './data/test_database.sqlite';

const { initializeDatabase, closeDatabase } = require('../../src/config/database');
const { User } = require('../../src/models');
const AIConsent = require('../../src/models/AIConsent');
const {
  hasAIConsent,
  requireAIConsent,
  getAIConsentStatus,
  grantAIConsent,
  revokeAIConsent,
  checkAIConsent
} = require('../../src/services/guardrails/aiConsentChecker');

describe('AI Consent Management', () => {
  let testUserId;
  let testUserId2;

  beforeAll(async () => {
    await initializeDatabase();
    
    // Create test users
    const uniqueId = Date.now();
    const user1 = User.create({
      name: 'AI Consent Test User 1',
      first_name: 'AIConsent',
      last_name: 'Test1',
      username: `aiconsenttest1${uniqueId}`,
      password: 'aiconsenttest1123',
      consent_status: 'revoked'
    });
    testUserId = user1.user_id;

    const user2 = User.create({
      name: 'AI Consent Test User 2',
      first_name: 'AIConsent',
      last_name: 'Test2',
      username: `aiconsenttest2${uniqueId}`,
      password: 'aiconsenttest2123',
      consent_status: 'revoked'
    });
    testUserId2 = user2.user_id;
  });

  afterAll(async () => {
    await closeDatabase();
  });

  beforeEach(() => {
    // Clear AI consent for test users before each test
    AIConsent.revoke(testUserId);
    AIConsent.revoke(testUserId2);
  });

  describe('AIConsent Model', () => {
    test('should create AI consent record when granting consent', () => {
      const consent = AIConsent.grant(testUserId);
      
      expect(consent).toBeDefined();
      expect(consent.user_id).toBe(testUserId);
      expect(consent.opted_in).toBe(1);
      expect(consent.timestamp).toBeDefined();
    });

    test('should update existing AI consent record', () => {
      // Grant consent first
      const consent1 = AIConsent.grant(testUserId);
      const timestamp1 = consent1.timestamp;
      
      // Wait a bit to ensure timestamp changes
      setTimeout(() => {
        // Revoke consent
        const consent2 = AIConsent.revoke(testUserId);
        
        expect(consent2.user_id).toBe(testUserId);
        expect(consent2.opted_in).toBe(0);
        expect(consent2.ai_consent_id).toBe(consent1.ai_consent_id); // Same record
        expect(consent2.timestamp).not.toBe(timestamp1); // Timestamp updated
      }, 100);
    });

    test('should find AI consent by user ID', () => {
      AIConsent.grant(testUserId);
      const consent = AIConsent.findByUserId(testUserId);
      
      expect(consent).toBeDefined();
      expect(consent.user_id).toBe(testUserId);
      expect(consent.opted_in).toBe(1);
    });

    test('should return null when AI consent not found', () => {
      const consent = AIConsent.findByUserId(99999);
      expect(consent).toBeNull();
    });

    test('hasConsent should return true when AI consent granted', () => {
      AIConsent.grant(testUserId);
      expect(AIConsent.hasConsent(testUserId)).toBe(true);
    });

    test('hasConsent should return false when AI consent not granted', () => {
      expect(AIConsent.hasConsent(testUserId)).toBe(false);
    });
  });

  describe('AI Consent Checker Service', () => {
    test('hasAIConsent should return true when AI consent granted', () => {
      AIConsent.grant(testUserId);
      expect(hasAIConsent(testUserId)).toBe(true);
    });

    test('hasAIConsent should return false when AI consent not granted', () => {
      expect(hasAIConsent(testUserId)).toBe(false);
    });

    test('requireAIConsent should not throw when AI consent granted', () => {
      AIConsent.grant(testUserId);
      expect(() => requireAIConsent(testUserId)).not.toThrow();
    });

    test('requireAIConsent should throw when AI consent not granted', () => {
      expect(() => requireAIConsent(testUserId)).toThrow('has not granted consent for AI-powered features');
    });

    test('getAIConsentStatus should return correct status when AI consent granted', () => {
      AIConsent.grant(testUserId);
      const status = getAIConsentStatus(testUserId);
      
      expect(status.has_consent).toBe(true);
      expect(status.status).toBe('granted');
      expect(status.message).toContain('granted consent for AI-powered features');
      expect(status.timestamp).toBeDefined();
    });

    test('getAIConsentStatus should return correct status when AI consent revoked', () => {
      AIConsent.grant(testUserId);
      AIConsent.revoke(testUserId);
      const status = getAIConsentStatus(testUserId);
      
      expect(status.has_consent).toBe(false);
      expect(status.status).toBe('revoked');
      expect(status.message).toContain('revoked AI consent');
    });

    test('getAIConsentStatus should return no_consent when no AI consent record exists', () => {
      const status = getAIConsentStatus(testUserId2);
      
      expect(status.has_consent).toBe(false);
      expect(status.status).toBe('no_consent');
      expect(status.message).toContain('No AI consent record found');
      expect(status.timestamp).toBeNull();
    });

    test('grantAIConsent should grant AI consent and return status', () => {
      const result = grantAIConsent(testUserId);
      
      expect(result.has_consent).toBe(true);
      expect(result.status).toBe('granted');
      expect(result.user_id).toBe(testUserId);
      expect(hasAIConsent(testUserId)).toBe(true);
    });

    test('grantAIConsent should throw error for non-existent user', () => {
      expect(() => grantAIConsent(99999)).toThrow('User 99999 not found');
    });

    test('revokeAIConsent should revoke AI consent and return status', () => {
      AIConsent.grant(testUserId);
      const result = revokeAIConsent(testUserId);
      
      expect(result.has_consent).toBe(false);
      expect(result.status).toBe('revoked');
      expect(result.user_id).toBe(testUserId);
      expect(hasAIConsent(testUserId)).toBe(false);
    });

    test('revokeAIConsent should throw error for non-existent user', () => {
      expect(() => revokeAIConsent(99999)).toThrow('User 99999 not found');
    });

    test('checkAIConsent should return hasConsent flag and message', () => {
      AIConsent.grant(testUserId);
      const check = checkAIConsent(testUserId);
      
      expect(check.hasConsent).toBe(true);
      expect(check.message).toContain('granted AI consent');
    });

    test('checkAIConsent should return false when AI consent not granted', () => {
      const check = checkAIConsent(testUserId);
      
      expect(check.hasConsent).toBe(false);
      expect(check.message).toContain('not granted AI consent');
    });
  });

  describe('AI Consent Independence', () => {
    test('AI consent should be independent of data processing consent', () => {
      // User has data processing consent but not AI consent
      const { grantConsent } = require('../../src/services/guardrails/consentChecker');
      grantConsent(testUserId);
      
      // AI consent should still be false
      expect(hasAIConsent(testUserId)).toBe(false);
      
      // Grant AI consent
      grantAIConsent(testUserId);
      expect(hasAIConsent(testUserId)).toBe(true);
      
      // Data processing consent should still be true
      const { hasConsent } = require('../../src/services/guardrails/consentChecker');
      expect(hasConsent(testUserId)).toBe(true);
    });
  });
});

