/**
 * Unit tests for Recommendation Engine and Rationale Generator
 */

// Use test database for tests
process.env.DB_PATH = './data/test_database.sqlite';

const { initializeDatabase, closeDatabase } = require('../../src/config/database');
const { User, Account, Transaction, Liability } = require('../../src/models');
const Consent = require('../../src/models/Consent');
const { generateRecommendations } = require('../../src/services/recommend/recommendationEngine');
const {
  generateEducationRationale,
  generateOfferRationale,
  generateRationale
} = require('../../src/services/recommend/rationaleGenerator');

describe('Rationale Generator', () => {
  describe('generateEducationRationale', () => {
    test('should generate rationale for debt paydown recommendation', () => {
      const item = {
        id: 'debt_paydown_snowball',
        title: 'Debt Paydown Strategy',
        recommendation_types: ['debt_paydown']
      };
      
      const persona = {
        id: 'high_utilization',
        name: 'High Utilization'
      };
      
      const behavioralSignals = {
        credit: {
          short_term: {
            cards: [{
              account_id: 'card_1234',
              utilization_percentage: 68,
              balance: 3400,
              limit: 5000,
              utilization_level: 'high'
            }]
          }
        }
      };
      
      const userData = {
        user: { user_id: 1, name: 'Test User' },
        accounts: []
      };
      
      // Mock Account.findById
      const originalFindById = Account.findById;
      Account.findById = jest.fn((id) => {
        if (id === 'card_1234') {
          return { account_id: 'card_1234_5678' };
        }
        return null;
      });
      
      const rationale = generateEducationRationale(item, persona, behavioralSignals, userData);
      
      expect(rationale).toContain('High Utilization');
      expect(rationale).toContain('68');
      expect(rationale).toContain('5678'); // Last 4 digits
      expect(rationale.length).toBeGreaterThan(50);
      
      Account.findById = originalFindById;
    });

    test('should generate rationale for subscription management', () => {
      const item = {
        id: 'subscription_audit',
        recommendation_types: ['subscription_management']
      };
      
      const persona = {
        id: 'subscription_heavy',
        name: 'Subscription-Heavy'
      };
      
      const behavioralSignals = {
        subscriptions: {
          short_term: {
            recurring_merchants: [
              { merchant_name: 'Netflix', count: 3 },
              { merchant_name: 'Spotify', count: 3 }
            ],
            total_monthly_recurring_spend: 25.99
          }
        }
      };
      
      const rationale = generateEducationRationale(item, persona, behavioralSignals, {});
      
      expect(rationale).toContain('Subscription-Heavy');
      expect(rationale).toContain('2');
      expect(rationale).toContain('subscription');
    });

    test('should generate rationale for savings building', () => {
      const item = {
        id: 'savings_guide',
        recommendation_types: ['savings_building']
      };
      
      const persona = {
        id: 'savings_builder',
        name: 'Savings Builder'
      };
      
      const behavioralSignals = {
        savings: {
          short_term: {
            net_inflow: 300,
            emergency_fund_coverage_months: 2
          }
        }
      };
      
      const rationale = generateEducationRationale(item, persona, behavioralSignals, {});
      
      expect(rationale).toContain('Savings Builder');
      expect(rationale).toContain('$300');
    });

    test('should generate default rationale when no specific data available', () => {
      const item = {
        id: 'general_guide',
        recommendation_types: ['budgeting']
      };
      
      const persona = {
        id: 'new_user',
        name: 'New User'
      };
      
      const behavioralSignals = {};
      
      const rationale = generateEducationRationale(item, persona, behavioralSignals, {});
      
      expect(rationale).toContain('New User');
      expect(rationale.length).toBeGreaterThan(0);
    });
  });

  describe('generateOfferRationale', () => {
    test('should generate rationale for balance transfer card', () => {
      const offer = {
        id: 'balance_transfer_card_a',
        offer_category: 'balance_transfer',
        benefits: ['0% APR on balance transfers for 18 months', '4.5% APY']
      };
      
      const persona = {
        id: 'high_utilization',
        name: 'High Utilization'
      };
      
      const behavioralSignals = {
        credit: {
          short_term: {
            cards: [{
              account_id: 'card_1234',
              utilization_percentage: 75,
              utilization_level: 'high'
            }],
            has_interest_charges: true
          }
        }
      };
      
      const userData = {
        user: { user_id: 1 },
        accounts: []
      };
      
      // Mock Account.findById
      const originalFindById = Account.findById;
      Account.findById = jest.fn(() => ({ account_id: 'card_1234_5678' }));
      
      const rationale = generateOfferRationale(offer, persona, behavioralSignals, userData);
      
      expect(rationale).toContain('High Utilization');
      expect(rationale).toContain('75');
      expect(rationale).toContain('balance transfer');
      expect(rationale).toContain('0% APR');
      
      Account.findById = originalFindById;
    });

    test('should generate rationale for high-yield savings', () => {
      const offer = {
        id: 'high_yield_savings_a',
        offer_category: 'high_yield_savings',
        benefits: ['4.5% Annual Percentage Yield (APY)']
      };
      
      const persona = {
        id: 'savings_builder',
        name: 'Savings Builder'
      };
      
      const behavioralSignals = {
        savings: {
          short_term: {
            total_savings_balance: 5000
          }
        }
      };
      
      const rationale = generateOfferRationale(offer, persona, behavioralSignals, {});
      
      expect(rationale).toContain('Savings Builder');
      expect(rationale).toContain('$5,000');
      expect(rationale).toContain('4.5%');
    });

    test('should generate rationale for subscription management tool', () => {
      const offer = {
        id: 'subscription_manager_a',
        offer_category: 'subscription_management'
      };
      
      const persona = {
        id: 'subscription_heavy',
        name: 'Subscription-Heavy'
      };
      
      const behavioralSignals = {
        subscriptions: {
          short_term: {
            recurring_merchants: [
              { merchant_name: 'Netflix' },
              { merchant_name: 'Spotify' },
              { merchant_name: 'Hulu' }
            ]
          }
        }
      };
      
      const rationale = generateOfferRationale(offer, persona, behavioralSignals, {});
      
      expect(rationale).toContain('Subscription-Heavy');
      expect(rationale).toContain('3');
      expect(rationale).toContain('subscription');
    });

    test('should generate default rationale when no specific data available', () => {
      const offer = {
        id: 'generic_offer',
        offer_category: 'budgeting'
      };
      
      const persona = {
        id: 'new_user',
        name: 'New User'
      };
      
      const behavioralSignals = {};
      
      const rationale = generateOfferRationale(offer, persona, behavioralSignals, {});
      
      expect(rationale).toContain('New User');
      expect(rationale.length).toBeGreaterThan(0);
    });
  });

  describe('generateRationale', () => {
    test('should generate rationale for education type', () => {
      const item = {
        id: 'test_item',
        recommendation_types: ['budgeting']
      };
      
      const persona = { id: 'new_user', name: 'New User' };
      const behavioralSignals = {};
      const userData = {};
      
      const rationale = generateRationale(item, 'education', persona, behavioralSignals, userData);
      
      expect(rationale).toContain('New User');
    });

    test('should generate rationale for offer type', () => {
      const offer = {
        id: 'test_offer',
        offer_category: 'budgeting'
      };
      
      const persona = { id: 'new_user', name: 'New User' };
      const behavioralSignals = {};
      const userData = {};
      
      const rationale = generateRationale(offer, 'offer', persona, behavioralSignals, userData);
      
      expect(rationale).toContain('New User');
    });
  });
});

