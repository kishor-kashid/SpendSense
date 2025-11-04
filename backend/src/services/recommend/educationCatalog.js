/**
 * Education Content Catalog Service
 * Manages educational content items mapped to personas
 */

const fs = require('fs');
const path = require('path');

// Path: backend/src/services/recommend -> backend/data/content/education_items.json
const EDUCATION_CONTENT_PATH = path.join(__dirname, '../../../data/content/education_items.json');

/**
 * Load education content from JSON file
 * @returns {Array} Array of education items
 */
function loadEducationContent() {
  try {
    const content = fs.readFileSync(EDUCATION_CONTENT_PATH, 'utf8');
    return JSON.parse(content);
  } catch (error) {
    console.error('Error loading education content:', error);
    return [];
  }
}

/**
 * Get education items by persona ID
 * @param {string} personaId - Persona ID (e.g., 'high_utilization')
 * @returns {Array} Filtered education items for the persona
 */
function getItemsByPersona(personaId) {
  const allItems = loadEducationContent();
  return allItems.filter(item => 
    item.persona_fit && item.persona_fit.includes(personaId)
  );
}

/**
 * Get education items by category
 * @param {string} category - Content category (e.g., 'article', 'guide', 'calculator', 'template')
 * @returns {Array} Filtered education items by category
 */
function getItemsByCategory(category) {
  const allItems = loadEducationContent();
  return allItems.filter(item => item.category === category);
}

/**
 * Get education items by recommendation type
 * @param {string} recommendationType - Recommendation type (e.g., 'debt_paydown', 'budgeting')
 * @returns {Array} Filtered education items by recommendation type
 */
function getItemsByRecommendationType(recommendationType) {
  const allItems = loadEducationContent();
  return allItems.filter(item => 
    item.recommendation_types && item.recommendation_types.includes(recommendationType)
  );
}

/**
 * Get all education items
 * @returns {Array} All education items
 */
function getAllItems() {
  return loadEducationContent();
}

/**
 * Get education item by ID
 * @param {string} itemId - Education item ID
 * @returns {Object|null} Education item or null
 */
function getItemById(itemId) {
  const allItems = loadEducationContent();
  return allItems.find(item => item.id === itemId) || null;
}

/**
 * Select education items for a persona
 * Returns 3-5 items that best match the persona and recommendation types
 * 
 * @param {Object} persona - Persona object with recommendationTypes
 * @param {Object} options - Selection options
 * @param {number} options.minItems - Minimum items to return (default: 3)
 * @param {number} options.maxItems - Maximum items to return (default: 5)
 * @returns {Array} Selected education items
 */
function selectItemsForPersona(persona, options = {}) {
  const { minItems = 3, maxItems = 5 } = options;
  
  if (!persona || !persona.recommendationTypes) {
    return [];
  }

  const allItems = loadEducationContent();
  const personaId = persona.id;
  
  // Score items based on how well they match
  const scoredItems = allItems.map(item => {
    let score = 0;
    
    // High score if persona_fit includes this persona
    if (item.persona_fit && item.persona_fit.includes(personaId)) {
      score += 10;
    }
    
    // Score based on recommendation type matches
    if (item.recommendation_types && persona.recommendationTypes) {
      const matchingTypes = item.recommendation_types.filter(type => 
        persona.recommendationTypes.includes(type)
      );
      score += matchingTypes.length * 5;
    }
    
    return { item, score };
  });
  
  // Sort by score (descending) and select top items
  const sorted = scoredItems.sort((a, b) => b.score - a.score);
  const selected = sorted
    .filter(scored => scored.score > 0) // Only include items with positive score
    .slice(0, maxItems)
    .map(scored => scored.item);
  
  // Ensure we have at least minItems (if available)
  if (selected.length < minItems && allItems.length >= minItems) {
    // Fill with top-scoring items from persona matches
    const personaItems = getItemsByPersona(personaId);
    const remaining = minItems - selected.length;
    const additional = personaItems
      .filter(item => !selected.find(s => s.id === item.id))
      .slice(0, remaining);
    selected.push(...additional);
  }
  
  return selected.slice(0, maxItems);
}

module.exports = {
  loadEducationContent,
  getItemsByPersona,
  getItemsByCategory,
  getItemsByRecommendationType,
  getAllItems,
  getItemById,
  selectItemsForPersona
};

