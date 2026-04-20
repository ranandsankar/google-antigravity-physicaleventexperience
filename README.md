# VenueFlow AI

A lightweight full-stack web application designed to improve the physical event experience at large sporting venues. It provides real-time AI-driven recommendations for gates, food stalls, and restrooms, as well as an operational dashboard to monitor venue congestion.

## Features
- **Fan Assistant UI**: Receive dynamic recommendations on the fastest pathways and least crowded facilities.
- **Venue AI Assistant**: Ask questions and get intelligent text responses either powered by a mock fallback or an actual Gemini Large Language Model.
- **Operations Dashboard**: View simulated live tracking of crowd densities across venue zones.
- **Lightweight**: Zero frontend build steps (vanilla HTML/CSS/JS) to keep repository size minimal. Designed to run on Google Cloud Run.

## Local Setup

### 1. Install dependencies
```bash
npm install
```

### 2. Configuration
Copy the `.env.example` file to create a `.env` file:
```bash
cp .env.example .env
```
Inside `.env`, you can provide a `GEMINI_API_KEY`. If left blank, the AI Assistant will fall back to local mock responses.

### 3. Run the App
Start the Express server:
```bash
npm start
```
By default, the server runs on `http://localhost:8080`.

### 4. Run Tests
Verify the recommendation logic unit tests execute safely:
```bash
npm test
```

## Deployment to Google Cloud Run
This project includes a `Dockerfile` optimized for Cloud Run. 

1. **Build the container**
   ```bash
   docker build -t venueflow-ai .
   ```
2. **Push to Google Container Registry or Artifact Registry**
   ```bash
   docker tag venueflow-ai gcr.io/YOUR_PROJECT_ID/venueflow-ai
   docker push gcr.io/YOUR_PROJECT_ID/venueflow-ai
   ```
3. **Deploy**
   Deploy via the Google Cloud console or using `gcloud run deploy`. Ensure to expose port `8080` (which is standard for Cloud Run).
