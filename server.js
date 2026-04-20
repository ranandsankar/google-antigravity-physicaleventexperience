require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const { getRecommendations } = require('./recommendationLogic');

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

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
app.get('/api/status', (req, res) => {
  res.json(venueData);
});

app.get('/api/recommend', (req, res) => {
  const recommendations = getRecommendations(venueData);
  res.json(recommendations);
});

app.post('/api/ai', async (req, res) => {
  const { query } = req.body;
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    // Fallback mock response if no API key is provided
    return res.json({
      response: `[Mock AI] I see you asked about "${query}". Based on current data, the East Gate is empty, and Zone B Hot Dogs has the shortest line.`
    });
  }

  try {
    // Basic structured fetch to Gemini using REST API to keep lightweight without the heavy SDK
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: `You are VenueFlow AI, an assistant for a physical sporting event venue. The user asks: "${query}". Current venue status: ${JSON.stringify(venueData)}. Provide a brief, helpful 1-2 sentence response guiding them to the best options.`
          }]
        }]
      })
    });
    
    if (!response.ok) {
        throw new Error('Failed to fetch from Gemini');
    }

    const data = await response.json();
    const textResponse = data.candidates?.[0]?.content?.parts?.[0]?.text || "I was unable to process your request.";
    res.json({ response: textResponse });
    
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "AI service unavailable." });
  }
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`VenueFlow AI server running on port ${PORT}`);
});
