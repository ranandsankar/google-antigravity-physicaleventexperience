const assert = require('assert');
const { getBestFacility, getRecommendations } = require('./recommendationLogic');
const app = require('./server'); // Import express app without triggering app.listen on process
const http = require('http');

async function runTests() {
  let passed = 0;
  let total = 0;

  function runTest(name, fn) {
    total++;
    try {
      fn();
      passed++;
      console.log(`✅ [PASS] ${name}`);
    } catch (e) {
      console.error(`❌ [FAIL] ${name}\n   ${e.message || e}`);
    }
  }

  console.log('--- Running Unit Tests ---');
  
  // 1. Basic getBestFacility
  runTest('Unit: getBestFacility returns item with lowest waitTime', () => {
    const items = [
      { id: '1', waitTimeMs: 50 },
      { id: '2', waitTimeMs: 10 },
      { id: '3', waitTimeMs: 100 }
    ];
    assert.strictEqual(getBestFacility(items).id, '2');
  });

  // 2. getBestFacility with negative/zero
  runTest('Unit: getBestFacility handles zero wait time correctly', () => {
    const items = [
      { id: '1', waitTimeMs: 50 },
      { id: '2', waitTimeMs: 0 }
    ];
    assert.strictEqual(getBestFacility(items).id, '2');
  });

  // 3. getBestFacility single item
  runTest('Unit: getBestFacility handles single item', () => {
    const items = [{ id: 'alpha', waitTimeMs: 200 }];
    assert.strictEqual(getBestFacility(items).id, 'alpha');
  });

  // 4. getRecommendations basic map
  runTest('Unit: getRecommendations maps best gates, food, and restrooms', () => {
    const venue = {
      gates: [{ id: 'g1', waitTimeMs: 5 }],
      foodStalls: [{ id: 'f1', waitTimeMs: 20 }, { id: 'f2', waitTimeMs: 10 }],
      restrooms: [{ id: 'r1', waitTimeMs: 1 }]
    };
    const recs = getRecommendations(venue);
    assert.strictEqual(recs.bestGate.id, 'g1');
    assert.strictEqual(recs.bestFood.id, 'f2');
    assert.strictEqual(recs.bestRestroom.id, 'r1');
  });

  // 5. Edge Case: Empty venue data
  runTest('Unit (Edge Case): getRecommendations handles empty venue data gracefully', () => {
    const recs = getRecommendations({});
    assert.strictEqual(recs.bestGate, null);
    assert.strictEqual(recs.bestFood, null);
    assert.strictEqual(recs.bestRestroom, null);
  });

  // 6. Edge Case: Missing sections
  runTest('Unit (Edge Case): getRecommendations handles missing sections (e.g. no gates array)', () => {
    const venue = {
      foodStalls: [{ id: 'f1', waitTimeMs: 0 }],
      restrooms: []
    };
    const recs = getRecommendations(venue);
    assert.strictEqual(recs.bestGate, null);
    assert.strictEqual(recs.bestFood.id, 'f1');
    assert.strictEqual(recs.bestRestroom, null);
  });


  console.log('\n--- Running API Tests ---');
  
  // Setup Server
  const server = http.createServer(app);
  await new Promise(resolve => server.listen(0, resolve)); // Listen on random available port
  const port = server.address().port;
  const baseUrl = `http://localhost:${port}`;

  async function apiTest(name, fn) {
    total++;
    try {
      await fn();
      passed++;
      console.log(`✅ [PASS] ${name}`);
    } catch (e) {
      console.error(`❌ [FAIL] ${name}\n   ${e.message || e}`);
    }
  }

  // API 1: GET /api/status
  await apiTest('API: GET /api/status returns live venue data state', async () => {
    const res = await fetch(`${baseUrl}/api/status`);
    assert.strictEqual(res.status, 200, "Expected status 200");
    const data = await res.json();
    assert.ok(Array.isArray(data.gates), "Missing gates array");
    assert.ok(Array.isArray(data.foodStalls), "Missing foodStalls array");
  });

  // API 2: POST /api/recommend
  await apiTest('API: POST /api/recommend returns rule-based recommendations', async () => {
    const res = await fetch(`${baseUrl}/api/recommend`, { method: 'POST' });
    assert.strictEqual(res.status, 200, "Expected status 200");
    const data = await res.json();
    assert.ok('bestGate' in data, "Missing bestGate property");
    assert.ok('bestFood' in data, "Missing bestFood property");
    assert.ok('bestRestroom' in data, "Missing bestRestroom property");
  });

  // API 3: POST /api/ai (Normal intent fallback)
  await apiTest('API: POST /api/ai fallback returns text response for normal query', async () => {
    const res = await fetch(`${baseUrl}/api/ai`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query: 'Where is the food?' })
    });
    assert.strictEqual(res.status, 200, "Expected status 200");
    const data = await res.json();
    assert.ok(data.response.includes('Where is the food?'), "AI didn't acknowledge the query");
  });

  // API 4: POST /api/ai (Edge Case: Unknown intent)
  await apiTest('API: POST /api/ai fallback processes unknown intent gracefully', async () => {
     const res = await fetch(`${baseUrl}/api/ai`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query: 'asdfzxcv1234' })
    });
    assert.strictEqual(res.status, 200, "Expected status 200");
    const data = await res.json();
    assert.ok(typeof data.response === 'string'); // ensuring our fallback text returns correctly
    assert.ok(data.response.includes('asdfzxcv1234'));
  });

  // Cleanup
  server.close();
  
  console.log(`\nTest Summary: ${passed}/${total} passed.`);
  if (passed !== total) process.exit(1);
}

runTests().catch(e => {
  console.error("Test harness failed:", e);
  process.exit(1);
});
