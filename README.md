# VenueFlow AI

**Challenge Name & Vertical**  
Physical Event Experience (Vertical: Sports & Entertainment / Smart Venues)

---

## 1. Problem Statement
Large-scale live sporting events and physical venues suffer from extreme micro-congestion. Fans routinely encounter massive bottlenecks at specific gates, food stalls, and restrooms, resulting in degraded user experiences, missed event moments, and localized operational hazards—even when identical facilities in other venue zones are completely empty.

## 2. Target Users
- **Event Attendees (Fans):** Seeking quick, frictionless guidance to the fastest facilities and shortest lines so they do not miss the event.
- **Venue Operators:** Needing a unified high-level dashboard to securely monitor crowd density metrics across physical zones in real-time.

## 3. Solution Overview
VenueFlow AI is a seamlessly lightweight full-stack web application designed to democratize venue telemetry. Through a unified interface, fans get access to continuously computing "Top Picks" (shortest lines algorithmically derived from wait times and capacity) and an interactive **Venue AI Assistant** capable of interpreting custom fan requests. Concurrently, operations teams get a live dashboard detailing percentage-based capacity burdens.

## 4. Architecture Overview
To achieve strict size efficiency (under 1MB bundle target):
- **Frontend Layer**: Zero-build-step Vanilla JavaScript engineered via isolated Namespaces (`State`, `UI`, `API`, `Controller`), coupled with raw CSS parsing for a beautiful glassmorphic experience.
- **Backend Layer**: A localized Express.js (Node 20+) micro-server processing REST connections, housing the simulated venue data loops, and executing rule-based pathing algorithms.
- **AI Integrations**: Direct standard HTTP client `fetch()` chains hook into `generativelanguage.googleapis.com` without imposing bloat from bulk Google SDK libraries.

## 5. API Endpoints
- `GET /api/status`: Returns the full real-time venue telemetry JSON object containing dynamically shifting wait times and capacities.
- `GET | POST /api/recommend`: Executes the `recommendationLogic.js` core algorithms to compute the optimal pathings natively and returns calculated Top Picks.
- `POST /api/ai`: Evaluates { `query` } payload against venue data contexts. Implements `system_instructions` formatting and enforces a JSON response format representing `{ response: "message", intent: "rule" }`. Defaults cleanly to a mocked static fallback if API keys are withheld.

## 6. Testing Strategy
- **Minimalist Approach**: Tests are written natively on top of Node.js `assert` and global `fetch()` modules rather than relying on heavy runners like Jest or Cypress.
- **Unit Logic Coverage**: Exhaustively verifies bounded wait computations, edge-cases for missing segments, and zero-length contingencies.
- **Integration API Suite**: Programmatically hoists a random-port server proxy to simulate network boundary requests verifying `GET` schemas, expected HTTP `200` boundaries, and AI fallback parsing. Can be executed seamlessly via `npm test`.

## 7. Accessibility Features
- **Semantic DOM & Landmarks**: Implements fully explicit `<header>`, `<main>`, `<section>`, and `<nav>` landmarks.
- **Keyboard Traversal**: Natively intercepts `keydown` logic across the navigation tabs, deploying a mathematically stable roving `tabindex` framework allowing purely mouseless operation and `Arrow` key focus toggles.
- **Screen Reader Hooks**: Deploys an isolated `.sr-only` mounting node (`aria-live="polite"`) restricting chatter so that the screen reader is only pinged when algorithm outputs distinctly alter, rather than on every arbitrary 5-second datastream poll.
- **WCAG Constraints**: Includes robust `:focus-visible` ring enhancements and heavily compliant high-contrast color shifts.

## 8. Security Considerations
- **Generic Fallthroughs**: API boundaries securely wrap routes in `try/catch` enclosures forwarding to a final un-leaking generic error node. It safely prevents internal Node stacks from exposing system internals to malicious clients.
- **Payload Fortification**: Uses top-level `express.json` guards to bounce and HTTP `400` malformed data formats.
- **Defensive Sanitization**: Blocks raw `<` or `>` payload inputs from user strings, effectively breaking generalized XSS/Injection vectors before touching external processing engines.

## 9. Google Services Used
- **Google Gemini 1.5 Flash**: Evaluates contextual constraints via strict REST protocols utilizing `system_instructions` and constrained `generationConfigs`.
- **Google Cloud Run**: Configured via Dockerfile wrapper built strictly around Alpine Node.js 20, capable of direct `gcloud` provisioning.

## 10. Assumptions
1. We assume mock data behaviors effectively substitute for what would be real-world venue IoT webhook integrations.
2. Web platforms accurately reflect mobile-first CSS media queries when handled gracefully.
3. Users operate Modern Browsers equipped with ES6 execution layers.

---

## Local Setup Steps

1. **Install Local Dependencies**
   ```bash
   npm install
   ```

2. **Configuration Settings**
   Generate your secrets file payload:
   ```bash
   cp .env.example .env
   ```
   Provide your `GEMINI_API_KEY` to unlock AI routing. *(If left blank, the app relies safely on hardcoded mock engines).*

3. **Start Service Node**
   ```bash
   npm start
   ```
   Navigate to `http://localhost:8080/`.

---

## Cloud Run Deployment Steps

VenueFlow AI natively supports frictionless Google Cloud deployment. 

1. **Environment Authentication**
   Ensure the Google Cloud CLI `gcloud` commands are bootstrapped securely on your machine:
   ```bash
   gcloud auth login
   gcloud config set project YOUR_PROJECT_ID
   ```

2. **Commit Pipeline Container**
   Leverage direct-from-source build operations to circumvent manual Docker registry pushes:
   ```bash
   gcloud run deploy venueflow-ai --source . --port 8080 --allow-unauthenticated
   ```

3. **Configure the AI Node**
   Within your standard Google Cloud UI Web Console -> Cloud Run -> `venueflow-ai` -> *Edit & Deploy Revision* -> **Variables & Secrets**: Add your mapped `GEMINI_API_KEY`.

---

## Future Improvements
- **WebSocket Protocol Shifts**: Replacing repetitive HTTP 5-second interval loops with a true bidirectional WebSockets layer would greatly reduce network handshakes.
- **Authenticated Identity Routing**: Integrating generic login procedures to split the interface natively at domain load rather than CSS toggle constraints.
- **GPS Triangulation**: Enhancing the core algorithms manually to penalize paths structurally based on physical GPS distance to the user coordinates rather than raw wait-time.
