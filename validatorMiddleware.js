/**
 * validatorMiddleware.js
 * Centralized request validation helpers to cleanly enforce security constraints
 * without bloating the core server.js logic or relying on heavy third-party libraries.
 */

// Helper to sanitize potentially dangerous string inputs
function enforceLengthAndSanitize(str) {
    if (typeof str !== 'string') return '';
    // Strip raw HTML tags and force a hard upper limit of 500 characters
    return str.replace(/[<>]/g, '').trim().substring(0, 500);
}

const ValidationHelpers = {
    /**
     * Gracefully handles malformed JSON syntax natively caught by express.json()
     */
    handleMalformedJSON: (err, req, res, next) => {
        if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
            return res.status(400).json({ 
                error: "Malformed Request", 
                details: "Invalid JSON structure detected in payload body." 
            });
        }
        next(err);
    },

    /**
     * Strongly validates AI chat submissions and limits string length dynamically
     */
    validateAIPayload: (req, res, next) => {
        const { query } = req.body;
        
        if (!query || typeof query !== 'string' || query.trim() === '') {
            return res.status(400).json({ 
                error: "Validation Error", 
                details: "A valid 'query' property (string) must be explicitly provided in your JSON payload." 
            });
        }

        if (query.length > 500) {
            return res.status(413).json({
                error: "Payload Too Large",
                details: "The query string exceeded the maximum allowed length of 500 characters."
            });
        }

        // Lock in the specifically sanitized string for secure downstream use
        req.safeQuery = enforceLengthAndSanitize(query);
        next();
    },

    /**
     * Provides a scalable baseline validation check for the recommendation endpoint parameters
     */
    validateRecommendationPayload: (req, res, next) => {
        // Enforce a strict cap preventing gigantic payload overflow flooding
        if (req.body && Object.keys(req.body).length > 15) {
            return res.status(413).json({ 
                error: "Payload Too Large", 
                details: "Request parameters exceeded safe limit processing thresholds." 
            });
        }
        next();
    }
};

module.exports = ValidationHelpers;
