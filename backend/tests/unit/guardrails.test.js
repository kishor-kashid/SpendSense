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
    const user1 = User.create({
      name: 'Consent Test User 1',
      consent_status: 'pending'
    });
    testUserId = user1.user_id;

    const user2 = User.create({
      name: 'Consent Test User 2',
      consent_status: 'pending'
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
      
      const status = getConsentStatus(testUserId);
      
      expect(status).toHaveProperty('user_id');
      expect(status).toHaveProperty('has_consent');
      expect(status).toHaveProperty('status');
      expect(status).toHaveProperty('message');
      expect(status.has_consent).toBe(false);
      expect(status.status).toBe('no_consent');
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

    test('should block recommendation generation without consent', () => {
      expect(() => {
        generateRecommendations(testUserId);
      }).toThrow('has not granted consent');
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

