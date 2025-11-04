/**
 * Unit tests for education catalog service
 */

const {
  loadEducationContent,
  getItemsByPersona,
  getItemsByCategory,
  getItemsByRecommendationType,
  getAllItems,
  getItemById,
  selectItemsForPersona
} = require('../../src/services/recommend/educationCatalog');
const { getAllPersonas } = require('../../src/services/personas/personaDefinitions');

describe('Education Catalog', () => {
  test('should load education content from JSON file', () => {
    const items = loadEducationContent();
    expect(Array.isArray(items)).toBe(true);
    expect(items.length).toBeGreaterThanOrEqual(15); // At least 15-20 items required
  });

  test('should have all required fields for each item', () => {
    const items = getAllItems();
    
    items.forEach(item => {
      expect(item).toHaveProperty('id');
      expect(item).toHaveProperty('title');
      expect(item).toHaveProperty('description');
      expect(item).toHaveProperty('category');
      expect(item).toHaveProperty('persona_fit');
      expect(item).toHaveProperty('recommendation_types');
      expect(Array.isArray(item.persona_fit)).toBe(true);
      expect(Array.isArray(item.recommendation_types)).toBe(true);
    });
  });

  test('should get items by persona ID', () => {
    const highUtilItems = getItemsByPersona('high_utilization');
    expect(highUtilItems.length).toBeGreaterThan(0);
    
    highUtilItems.forEach(item => {
      expect(item.persona_fit).toContain('high_utilization');
    });
  });

  test('should get items for all personas', () => {
    const personas = getAllPersonas();
    
    Object.values(personas).forEach(persona => {
      const items = getItemsByPersona(persona.id);
      expect(items.length).toBeGreaterThan(0);
    });
  });

  test('should get items by category', () => {
    const articles = getItemsByCategory('article');
    const guides = getItemsByCategory('guide');
    const calculators = getItemsByCategory('calculator');
    const templates = getItemsByCategory('template');
    
    expect(articles.length).toBeGreaterThan(0);
    expect(guides.length).toBeGreaterThan(0);
    expect(calculators.length).toBeGreaterThan(0);
    expect(templates.length).toBeGreaterThan(0);
  });

  test('should get items by recommendation type', () => {
    const debtPaydownItems = getItemsByRecommendationType('debt_paydown');
    expect(debtPaydownItems.length).toBeGreaterThan(0);
    
    debtPaydownItems.forEach(item => {
      expect(item.recommendation_types).toContain('debt_paydown');
    });
  });

  test('should get item by ID', () => {
    const allItems = getAllItems();
    if (allItems.length > 0) {
      const firstItem = allItems[0];
      const foundItem = getItemById(firstItem.id);
      
      expect(foundItem).toBeDefined();
      expect(foundItem.id).toBe(firstItem.id);
      expect(foundItem.title).toBe(firstItem.title);
    }
  });

  test('should return null for invalid item ID', () => {
    const item = getItemById('non_existent_id');
    expect(item).toBeNull();
  });

  test('should select items for persona', () => {
    const personas = getAllPersonas();
    const highUtilPersona = personas.HIGH_UTILIZATION;
    
    const selected = selectItemsForPersona(highUtilPersona);
    
    expect(Array.isArray(selected)).toBe(true);
    expect(selected.length).toBeGreaterThanOrEqual(3);
    expect(selected.length).toBeLessThanOrEqual(5);
    
    // All selected items should match the persona
    selected.forEach(item => {
      expect(item.persona_fit).toContain('high_utilization');
    });
  });

  test('should prioritize items that match recommendation types', () => {
    const personas = getAllPersonas();
    const savingsPersona = personas.SAVINGS_BUILDER;
    
    const selected = selectItemsForPersona(savingsPersona);
    
    // Should have items that match savings-related recommendation types
    const hasSavingsItems = selected.some(item => 
      item.recommendation_types.some(type => 
        ['savings_goals', 'automation', 'hysa', 'cd_basics'].includes(type)
      )
    );
    
    expect(hasSavingsItems).toBe(true);
  });

  test('should have content for all persona focus areas', () => {
    const personas = getAllPersonas();
    const focusAreas = [
      'debt_paydown',
      'budgeting',
      'subscription_audit',
      'emergency_fund',
      'savings_goals',
      'credit_building'
    ];
    
    focusAreas.forEach(area => {
      const items = getItemsByRecommendationType(area);
      expect(items.length).toBeGreaterThan(0);
    });
  });

  test('should use empowering, non-judgmental language', () => {
    const allItems = getAllItems();
    
    const judgmentalPhrases = [
      'you\'re overspending',
      'you\'re bad with money',
      'you should',
      'you must',
      'you\'re wasting'
    ];
    
    allItems.forEach(item => {
      const text = `${item.title} ${item.description}`.toLowerCase();
      
      judgmentalPhrases.forEach(phrase => {
        expect(text).not.toContain(phrase);
      });
    });
  });

  test('should have content covering all 5 personas', () => {
    const personas = getAllPersonas();
    
    Object.values(personas).forEach(persona => {
      const items = getItemsByPersona(persona.id);
      expect(items.length).toBeGreaterThanOrEqual(2); // At least 2 items per persona
    });
  });
});

