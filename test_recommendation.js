const { getBestFacility, getRecommendations } = require('./recommendationLogic');

console.log("Running VenueFlow AI Recommendation Tests...\n");

const mockData = {
  gates: [
    { id: 'gate-a', name: 'Gate A', waitTimeMs: 120000 },
    { id: 'gate-b', name: 'Gate B', waitTimeMs: 45000 }, // best
    { id: 'gate-c', name: 'Gate C', waitTimeMs: 300000 }
  ],
  foodStalls: [
    { id: 'food-1', name: 'Burger Stand', waitTimeMs: 600000 },
    { id: 'food-2', name: 'Hot Dog Cart', waitTimeMs: 150000 }, // best
    { id: 'food-3', name: 'Pizza Spot', waitTimeMs: 400000 }
  ],
  restrooms: [
    { id: 'rr-1', name: 'North Restrooms', waitTimeMs: 300000 },
    { id: 'rr-2', name: 'East Restrooms', waitTimeMs: 0 },       // best
    { id: 'rr-3', name: 'South Restrooms', waitTimeMs: 10000 }
  ]
};

let testsPassed = 0;
let testsTotal = 0;

function assertEqual(actual, expected, testName) {
  testsTotal++;
  if (actual === expected) {
    console.log(`✅ [PASS] ${testName}`);
    testsPassed++;
  } else {
    console.log(`❌ [FAIL] ${testName}. Expected '${expected}', got '${actual}'`);
  }
}

// Test 1: getBestFacility
const bestFood = getBestFacility(mockData.foodStalls);
assertEqual(bestFood.id, 'food-2', 'getBestFacility selects lowest wait time');

// Test 2: getRecommendations
const recs = getRecommendations(mockData);
assertEqual(recs.bestGate.id, 'gate-b', 'getRecommendations selects best gate');
assertEqual(recs.bestFood.id, 'food-2', 'getRecommendations selects best food');
assertEqual(recs.bestRestroom.id, 'rr-2', 'getRecommendations selects best restroom');

console.log(`\nTest Summary: ${testsPassed}/${testsTotal} passed.`);
if (testsPassed !== testsTotal) {
  process.exit(1);
}
