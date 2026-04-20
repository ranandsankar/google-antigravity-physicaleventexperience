require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const { getRecommendations } = require('./recommendationLogic');

const app = express();
app.use(cors());
app.use(express.json());

// Catch malformed JSON payloads gracefully
app.use((err, req, res, next) => {
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    return res.status(400).json({ error: "Malformed payload format." });
  }
  next(err);
});

app.use(express.static(path.join(__dirname, 'public')));

// Simple text sanitizer
function sanitizeText(str) {
  if (typeof str !== 'string') return '';
  return str.replace(/[<>]/g, '').trim().substring(0, 500);
}

// Simulated live venue data
let venueData = {
  gates: [
    { id: 'gate-n', name: 'North Gate', waitTimeMs: 120000, capacity: 80 },
    { id: 'gate-s', name: 'South Gate', waitTimeMs: 45000, capacity: 40 },
    { id: 'gate-e', name: 'East Gate', waitTimeMs: 300000, capacity: 95 }
  ],
  foodStalls: [
    { id: 'food-burgers', name: 'Zone A Burgers', waitTimeMs: 600000, capacity: 90 },
    { id: 'food-hotdogs', name: 'Zone B Hot Dogs', waitTimeMs: 150000, capacity: 50 },
    { id: 'food-pizza', name: 'Zone C Pizza', waitTimeMs: 400000, capacity: 85 }
  ],
  restrooms: [
    { id: 'rr-n', name: 'North Restrooms', waitTimeMs: 300000, capacity: 80 },
    { id: 'rr-e', name: 'East Restrooms', waitTimeMs: 0, capacity: 10 },
    { id: 'rr-s', name: 'South Restrooms', waitTimeMs: 10000, capacity: 20 }
  ]
};

// Simulate changing crowd dynamics every 5 seconds
setInterval(() => {
  const categories = ['gates', 'foodStalls', 'restrooms'];
  categories.forEach(cat => {
    venueData[cat].forEach(item => {
      // Random wait time change between -1 min and +2 mins
      const diff = (Math.random() * 180000) - 60000;
      item.waitTimeMs = Math.max(0, item.waitTimeMs + diff);
      // Rough capacity estimation based on wait time (0-100%)
      item.capacity = Math.min(100, Math.floor((item.waitTimeMs / 600000) * 100));
    });
  });
}, 5000);

// API Endpoints
app.get('/api/status', (req, res, next) => {
  try {
    res.json(venueData);
  } catch (err) {
    next(err);
  }
});

app.get('/api/recommend', (req, res, next) => {
  try {
    const recommendations = getRecommendations(venueData);
    res.json(recommendations);
  } catch (err) {
    next(err);
  }
});

app.post('/api/recommend', (req, res, next) => {
  try {
    // Note: Future feature bodies would be validated here.
    const recommendations = getRecommendations(venueData);
    res.json(recommendations);
  } catch (err) {
    next(err);
  }
});

app.post('/api/ai', async (req, res, next) => {
  try {
    if (!req.body || typeof req.body.query !== 'string' || req.body.query.trim() === '') {
      return res.status(400).json({ error: "A valid 'query' string is required." });
    }

    const safeQuery = sanitizeText(req.body.query);
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      // Fallback mock response if no API key is provided
      return res.json({
        response: `[Mock AI] I see you asked about "${safeQuery}". Based on current data, the East Gate is empty, and Zone B Hot Dogs has the shortest line.`
      });
    }

    // Basic structured fetch to Gemini using REST API to keep lightweight without the heavy SDK
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        system_instruction: {
          parts: [{
            text: "You are VenueFlow AI, an operations and fan assistant for a physical sporting event venue. Analyze the venue data and user query. You MUST respond with pure JSON in this format: {\"response\": \"Helpful 1-2 sentence response\", \"intent\": \"fan_assistance|ops|general\"}."
          }]
        },
        contents: [{
          parts: [{
            text: `User Query: "${safeQuery}"\nLive Venue Status Data: ${JSON.stringify(venueData)}`
          }]
        }],
        generationConfig: {
          responseMimeType: "application/json"
        }
      })
    });
    
    if (!response.ok) {
        throw new Error('Failed to fetch from Gemini target service.');
    }

    const data = await response.json();
    const textResponse = data.candidates?.[0]?.content?.parts?.[0]?.text || "{}";
    
    let structuredResponse;
    try {
        structuredResponse = JSON.parse(textResponse);
    } catch (e) {
        structuredResponse = { response: textResponse || "I couldn't process your request.", intent: "general" };
    }

    // Ensure frontend contract is met
    if (!structuredResponse.response) {
       structuredResponse.response = "I couldn't formulate a clear answer.";
    }

    res.json(structuredResponse);
    
  } catch (err) {
    next(err); // Safely forward to global handler
  }
});

// Global error handler
app.use((err, req, res, next) => {
  console.error("Internal Server Error:", err.message || err);
  res.status(500).json({ error: "An unexpected error occurred. Please try again later." });
});

const PORT = process.env.PORT || 8080;
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`VenueFlow AI server running on port ${PORT}`);
  });
}

module.exports = app;

