/**
 * recommendationLogic.js
 * Core engine to find the best facilities (least crowded, closest).
 */

// Simulated logic based on crowd density and wait times

/**
 * Finds the least congested item in a category.
 * @param {Array} items List of items (e.g., food stalls, restrooms)
 * @returns {Object} The recommended item
 */
function getBestFacility(items) {
  if (!items || items.length === 0) return null;
  // Sort primarily by wait time
  const sorted = [...items].sort((a, b) => {
    return a.waitTimeMs - b.waitTimeMs;
  });
  return sorted[0];
}

/**
 * Provide a full recommendation profile for a fan
 * @param {Object} venueData The current venue status
 * @returns {Object} Recommended gate, food stall, restroom
 */
function getRecommendations(venueData) {
  return {
    bestGate: getBestFacility(venueData.gates),
    bestFood: getBestFacility(venueData.foodStalls),
    bestRestroom: getBestFacility(venueData.restrooms),
  };
}

module.exports = {
  getBestFacility,
  getRecommendations
};
