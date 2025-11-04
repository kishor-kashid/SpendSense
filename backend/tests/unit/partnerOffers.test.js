/**
 * Unit tests for Partner Offers Catalog Service
 */

const {
  loadPartnerOffers,
  getOffersByPersona,
  getOffersByCategory,
  getOffersByRecommendationType,
  getAllOffers,
  getOfferById,
  checkEligibility,
  filterEligibleOffers,
  selectOffersForPersona
} = require('../../src/services/recommend/partnerOffers');

describe('Partner Offers Catalog', () => {
  describe('loadPartnerOffers', () => {
    test('should load partner offers from JSON file', () => {
      const offers = loadPartnerOffers();
      expect(Array.isArray(offers)).toBe(true);
      expect(offers.length).toBeGreaterThan(0);
    });

    test('should have all required fields for each offer', () => {
      const offers = loadPartnerOffers();
      offers.forEach(offer => {
        expect(offer).toHaveProperty('id');
        expect(offer).toHaveProperty('title');
        expect(offer).toHaveProperty('description');
        expect(offer).toHaveProperty('offer_type');
        expect(offer).toHaveProperty('offer_category');
        expect(offer).toHaveProperty('persona_fit');
        expect(offer).toHaveProperty('recommendation_types');
        expect(offer).toHaveProperty('eligibility');
        expect(offer).toHaveProperty('benefits');
        expect(offer).toHaveProperty('provider_name');
        expect(offer).toHaveProperty('provider_url');
      });
    });
  });

  describe('getAllOffers', () => {
    test('should return all partner offers', () => {
      const offers = getAllOffers();
      expect(Array.isArray(offers)).toBe(true);
      expect(offers.length).toBeGreaterThanOrEqual(8); // At least 8-10 offers
    });
  });

  describe('getOfferById', () => {
    test('should get offer by ID', () => {
      const offers = getAllOffers();
      if (offers.length > 0) {
        const firstOffer = offers[0];
        const foundOffer = getOfferById(firstOffer.id);
        expect(foundOffer).toBeDefined();
        expect(foundOffer.id).toBe(firstOffer.id);
      }
    });

    test('should return null for invalid offer ID', () => {
      const offer = getOfferById('invalid_offer_id');
      expect(offer).toBeNull();
    });
  });

  describe('getOffersByPersona', () => {
    test('should get offers for high_utilization persona', () => {
      const offers = getOffersByPersona('high_utilization');
      expect(Array.isArray(offers)).toBe(true);
      offers.forEach(offer => {
        expect(offer.persona_fit).toContain('high_utilization');
      });
    });

    test('should get offers for savings_builder persona', () => {
      const offers = getOffersByPersona('savings_builder');
      expect(Array.isArray(offers)).toBe(true);
      offers.forEach(offer => {
        expect(offer.persona_fit).toContain('savings_builder');
      });
    });

    test('should get offers for subscription_heavy persona', () => {
      const offers = getOffersByPersona('subscription_heavy');
      expect(Array.isArray(offers)).toBe(true);
      offers.forEach(offer => {
        expect(offer.persona_fit).toContain('subscription_heavy');
      });
    });

    test('should get offers for variable_income persona', () => {
      const offers = getOffersByPersona('variable_income');
      expect(Array.isArray(offers)).toBe(true);
      offers.forEach(offer => {
        expect(offer.persona_fit).toContain('variable_income');
      });
    });

    test('should get offers for new_user persona', () => {
      const offers = getOffersByPersona('new_user');
      expect(Array.isArray(offers)).toBe(true);
      offers.forEach(offer => {
        expect(offer.persona_fit).toContain('new_user');
      });
    });
  });

  describe('getOffersByCategory', () => {
    test('should get offers by category', () => {
      const balanceTransferOffers = getOffersByCategory('balance_transfer');
      expect(Array.isArray(balanceTransferOffers)).toBe(true);
      balanceTransferOffers.forEach(offer => {
        expect(offer.offer_category).toBe('balance_transfer');
      });
    });

    test('should return empty array for non-existent category', () => {
      const offers = getOffersByCategory('non_existent_category');
      expect(Array.isArray(offers)).toBe(true);
      expect(offers.length).toBe(0);
    });
  });

  describe('getOffersByRecommendationType', () => {
    test('should get offers by recommendation type', () => {
      const debtPaydownOffers = getOffersByRecommendationType('debt_paydown');
      expect(Array.isArray(debtPaydownOffers)).toBe(true);
      debtPaydownOffers.forEach(offer => {
        expect(offer.recommendation_types).toContain('debt_paydown');
      });
    });

    test('should return empty array for non-existent recommendation type', () => {
      const offers = getOffersByRecommendationType('non_existent_type');
      expect(Array.isArray(offers)).toBe(true);
      expect(offers.length).toBe(0);
    });
  });

  describe('checkEligibility', () => {
    test('should check eligibility based on credit score', () => {
      const offer = {
        id: 'test_offer',
        eligibility: {
          min_credit_score: 670,
          min_income: null,
          max_utilization: null
        }
      };

      // Eligible user
      const eligibleUser = { creditScore: 720, estimatedAnnualIncome: 50000 };
      const eligibleResult = checkEligibility(offer, eligibleUser);
      expect(eligibleResult.isEligible).toBe(true);

      // Ineligible user
      const ineligibleUser = { creditScore: 650, estimatedAnnualIncome: 50000 };
      const ineligibleResult = checkEligibility(offer, ineligibleUser);
      expect(ineligibleResult.isEligible).toBe(false);
      expect(ineligibleResult.disqualifiers.length).toBeGreaterThan(0);
    });

    test('should check eligibility based on income', () => {
      const offer = {
        id: 'test_offer',
        eligibility: {
          min_credit_score: null,
          min_income: 30000,
          max_utilization: null
        }
      };

      // Eligible user
      const eligibleUser = { estimatedAnnualIncome: 40000 };
      const eligibleResult = checkEligibility(offer, eligibleUser);
      expect(eligibleResult.isEligible).toBe(true);

      // Ineligible user
      const ineligibleUser = { estimatedAnnualIncome: 25000 };
      const ineligibleResult = checkEligibility(offer, ineligibleUser);
      expect(ineligibleResult.isEligible).toBe(false);
    });

    test('should check eligibility based on utilization', () => {
      const offer = {
        id: 'test_offer',
        eligibility: {
          min_credit_score: null,
          min_income: null,
          max_utilization: 0.40
        }
      };

      // Eligible user
      const eligibleUser = { maxCreditUtilization: 0.35 };
      const eligibleResult = checkEligibility(offer, eligibleUser);
      expect(eligibleResult.isEligible).toBe(true);

      // Ineligible user
      const ineligibleUser = { maxCreditUtilization: 0.50 };
      const ineligibleResult = checkEligibility(offer, ineligibleUser);
      expect(ineligibleResult.isEligible).toBe(false);
    });

    test('should check for excluded account types', () => {
      const offer = {
        id: 'test_offer',
        eligibility: {
          min_credit_score: null,
          min_income: null,
          max_utilization: null,
          excluded_account_types: ['savings_account']
        }
      };

      // Eligible user (no savings account)
      const eligibleUser = {};
      const eligibleAccounts = [{ type: 'checking' }];
      const eligibleResult = checkEligibility(offer, eligibleUser, eligibleAccounts);
      expect(eligibleResult.isEligible).toBe(true);

      // Ineligible user (has savings account)
      const ineligibleAccounts = [{ type: 'savings', subtype: 'savings' }];
      const ineligibleResult = checkEligibility(offer, eligibleUser, ineligibleAccounts);
      expect(ineligibleResult.isEligible).toBe(false);
    });

    test('should handle missing eligibility criteria gracefully', () => {
      const offer = {
        id: 'test_offer',
        eligibility: {}
      };

      const user = {};
      const result = checkEligibility(offer, user);
      expect(result.isEligible).toBe(true);
    });
  });

  describe('filterEligibleOffers', () => {
    test('should filter offers to only eligible ones', () => {
      const offers = [
        {
          id: 'offer1',
          eligibility: { min_credit_score: 670, min_income: null, max_utilization: null }
        },
        {
          id: 'offer2',
          eligibility: { min_credit_score: 650, min_income: null, max_utilization: null }
        }
      ];

      const userData = { creditScore: 680, estimatedAnnualIncome: 50000 };
      const eligibleOffers = filterEligibleOffers(offers, userData);

      expect(eligibleOffers.length).toBeGreaterThan(0);
      eligibleOffers.forEach(offer => {
        expect(offer.eligibility_check.isEligible).toBe(true);
      });
    });

    test('should include eligibility details with each offer', () => {
      const offers = [
        {
          id: 'offer1',
          eligibility: { min_credit_score: null, min_income: null, max_utilization: null }
        }
      ];

      const userData = {};
      const eligibleOffers = filterEligibleOffers(offers, userData);

      expect(eligibleOffers[0]).toHaveProperty('eligibility_check');
      expect(eligibleOffers[0].eligibility_check).toHaveProperty('isEligible');
    });
  });

  describe('selectOffersForPersona', () => {
    test('should select offers for persona', () => {
      const persona = {
        id: 'high_utilization',
        recommendationTypes: ['debt_paydown', 'balance_transfer']
      };

      const userData = {
        creditScore: 700,
        estimatedAnnualIncome: 50000,
        maxCreditUtilization: 0.75
      };

      const userAccounts = [];
      const selected = selectOffersForPersona(persona, userData, userAccounts);

      expect(Array.isArray(selected)).toBe(true);
      expect(selected.length).toBeGreaterThanOrEqual(0);
      expect(selected.length).toBeLessThanOrEqual(3);
    });

    test('should only return eligible offers', () => {
      const persona = {
        id: 'high_utilization',
        recommendationTypes: ['debt_paydown']
      };

      const userData = {
        creditScore: 600, // Low credit score
        estimatedAnnualIncome: 50000
      };

      const userAccounts = [];
      const selected = selectOffersForPersona(persona, userData, userAccounts);

      // All selected offers should be eligible
      selected.forEach(offer => {
        expect(offer.eligibility_check.isEligible).toBe(true);
      });
    });

    test('should return empty array for persona without recommendation types', () => {
      const persona = {
        id: 'high_utilization'
        // No recommendationTypes
      };

      const userData = {};
      const selected = selectOffersForPersona(persona, userData);
      expect(selected).toEqual([]);
    });

    test('should respect maxOffers limit', () => {
      const persona = {
        id: 'high_utilization',
        recommendationTypes: ['debt_paydown', 'balance_transfer']
      };

      const userData = {
        creditScore: 750,
        estimatedAnnualIncome: 60000,
        maxCreditUtilization: 0.50
      };

      const userAccounts = [];
      const selected = selectOffersForPersona(persona, userData, userAccounts, { maxOffers: 2 });
      expect(selected.length).toBeLessThanOrEqual(2);
    });
  });

  describe('Content Quality', () => {
    test('should have offers for all 5 personas', () => {
      const personas = ['high_utilization', 'variable_income', 'subscription_heavy', 'savings_builder', 'new_user'];
      const allOffers = getAllOffers();
      
      personas.forEach(persona => {
        const personaOffers = allOffers.filter(offer => 
          offer.persona_fit && offer.persona_fit.includes(persona)
        );
        expect(personaOffers.length).toBeGreaterThan(0);
      });
    });

    test('should have at least 8-10 partner offers', () => {
      const offers = getAllOffers();
      expect(offers.length).toBeGreaterThanOrEqual(8);
    });

    test('should have no predatory products', () => {
      const offers = getAllOffers();
      const predatoryKeywords = ['payday', 'title loan', 'pawn', 'cash advance', 'high interest'];
      
      offers.forEach(offer => {
        const title = offer.title.toLowerCase();
        const description = offer.description.toLowerCase();
        const text = `${title} ${description}`;
        
        predatoryKeywords.forEach(keyword => {
          expect(text).not.toContain(keyword);
        });
      });
    });

    test('should have clear eligibility criteria for each offer', () => {
      const offers = getAllOffers();
      offers.forEach(offer => {
        expect(offer.eligibility).toBeDefined();
        expect(typeof offer.eligibility).toBe('object');
      });
    });

    test('should have minimum income or credit requirements where appropriate', () => {
      const offers = getAllOffers();
      const creditCardOffers = offers.filter(o => o.offer_type === 'credit_card');
      
      // Credit card offers should have eligibility criteria
      creditCardOffers.forEach(offer => {
        expect(offer.eligibility).toBeDefined();
      });
    });
  });
});

