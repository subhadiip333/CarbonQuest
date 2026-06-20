# CarbonQuest AI — Enterprise AI Sustainability Coach & Gamification Engine

CarbonQuest AI is an intelligent sustainability companion that acts like a fitness tracker, Duolingo, and personal environmental coach combined. Built using **Google Gemini 1.5 Flash**, **Google Maps Directions API**, and **Cloud Natural Language API**, the platform actively guides users to reduce their carbon footprint every day through conversational coaching, personalized challenges, and interactive digital twin feedback.

---

## 🚀 Key Product Features

### 1. AI Carbon Coach
* Powered by **Gemini 1.5 Flash**.
* A conversational assistant capable of simulating environmental impact (e.g., "What if I stop cycling?"), providing weather-aware recommendations, and giving personalized coaching.

### 2. Carbon Twin (Digital Avatar)
* A gamified digital avatar representing the user's local ecosystem health.
* Dynamically evolves from **Polluted** (grey smog, smokestacks) to **Pristine** (flashing golden forests and thriving wildlife) based on daily carbon-saving actions.

### 3. Daily Carbon Journey (NLP Logger)
* Users log activities using natural language (e.g., "Ate vegan lunch", "Took electric scooter to work").
* The backend parses input via Gemini to dynamically extract categories (Transportation, Food, Electricity, Waste) and calculate carbon costs and savings compared to high-emission alternatives.

### 4. AI Carbon Forecast
* Predicts next month's carbon footprint trajectory and explains the trend using Gemini reasoning.

### 5. Smart Sustainability Challenges
* Personal daily and community quests (e.g., "Solar Walk", "Neighborhood Clean Sweep").
* Completing quests rewards users with **XP**, **Green Coins**, and **Green Points**, while repairing the Carbon Twin avatar.

### 6. Eco Marketplace
* Spend Green Coins to plant native trees, fund ocean cleanups, or claim eco-friendly coupons.

---

## 🛠️ System Architecture

```text
[ Next.js Frontend (Dark Theme) ]
              ↓ (REST API)
[ Node.js/Express Backend API ] ──> [ Persistent JSON Database (db.json) ]
              ↓
  [ Google Cloud Services ]
  ├─ Gemini 1.5 Flash (via @google/genai)
  ├─ Cloud Natural Language API (Sentiment Analysis)
  ├─ Google Maps & Places (Route Optimization)
  └─ Sheets & Calendar APIs (Reminders & Reporting)
```

---

## 💻 Tech Stack

- **Frontend**: Next.js, React, Tailwind CSS, TypeScript, Lucide Icons.
- **Backend**: Node.js, Express, TypeScript, `@google/genai`, `@google-cloud/language`, `@googlemaps/google-maps-services-js`.
- **Database**: zero-configuration file-based persistent JSON database (`src/data/db.json`).
- **CI/CD & DevOps**: GitHub Actions, Docker, docker-compose, Google Cloud Run.

---

## 📦 API Endpoint Documentation

### Authentication & Profile
* `GET /api/v1/profile` — Fetch active user profile metrics.
* `POST /api/v1/profile/reset` — Reset activities and profile metrics.

### Activities Journal
* `GET /api/v1/activities` — Get logged activity logs.
* `POST /api/v1/activities` — Log action using Gemini NLP parser.

### AI Coach & Forecasts
* `POST /api/v1/coach/chat` — Conversational chat with the coach.
* `GET /api/v1/coach/history` — Get conversation logs.
* `GET /api/v1/coach/forecast` — Fetch 30-day predicted carbon trajectory.
* `GET /api/v1/coach/journal` — Retrieve AI-generated daily sustainability journal logs.

### Gamified Quests
* `GET /api/v1/challenges` — List active quests.
* `POST /api/v1/challenges/:id/complete` — Mark quest complete and award rewards.
* `POST /api/v1/challenges/generate` — Generate weather-aware AI quests.

### Route Planner
* `POST /api/v1/routes/optimize` — Calculate driving vs transit vs bicycle routes with carbon metrics.

### Eco Marketplace
* `GET /api/v1/marketplace` — Fetch marketplace rewards.
* `POST /api/v1/marketplace/redeem` — Deduct coins to redeem tree planting or coupons.

---

## ⚙️ Local Setup Guide

### 1. Configure Environment Variables
Create a `.env` file inside `backend/` and supply your API keys:
```env
PORT=8080
FRONTEND_URL=http://localhost:3000
GEMINI_API_KEY=your_gemini_api_key
GOOGLE_MAPS_API_KEY=your_google_maps_api_key
```

### 2. Run with Docker Compose
From the root directory, launch the complete environment:
```bash
docker-compose up --build
```
* Frontend will run at: `http://localhost:3000`
* Backend API will run at: `http://localhost:8080`

### 3. Run Locally (Development Mode)
#### Backend:
```bash
cd backend
npm install
npm run dev
```
#### Frontend:
```bash
cd frontend
npm install
npm run dev
```

---

## 🔑 How to Get API Keys

CarbonQuest AI relies on two primary Google APIs. Here is how to obtain them:

### 1. Google Gemini API Key (`GEMINI_API_KEY`)
1. Visit Google AI Studio: [https://aistudio.google.com/](https://aistudio.google.com/)
2. Sign in with your Google Account.
3. Click on **Get API key** in the left navigation menu.
4. Click **Create API key** and generate one in a new or existing Google Cloud project.
5. Copy the generated key and paste it into your `backend/.env` file.

### 2. Google Maps API Key (`GOOGLE_MAPS_API_KEY`)
1. Visit the Google Cloud Console: [https://console.cloud.google.com/](https://console.cloud.google.com/)
2. Create a new project or select an existing one.
3. Navigate to **APIs & Services > Library**.
4. Search for and enable the following two APIs:
   - **Directions API**
   - **Places API**
5. Navigate to **APIs & Services > Credentials**.
6. Click **Create Credentials > API key**.
7. Copy the generated key and paste it into your `backend/.env` file.
*(Note: Ensure billing is enabled for your GCP project, otherwise Maps requests will be denied).*

---

## ☁️ Step-by-Step Deployment to Google Cloud Run

We will deploy this fullstack application using Google Artifact Registry and Google Cloud Run for a highly scalable, serverless production environment.

### Prerequisites:
- A Google Cloud Platform (GCP) account.
- `gcloud` CLI installed and authenticated (`gcloud auth login`).
- Billing enabled on your GCP project.
- A GitHub repository containing this code (for automated CI/CD).

### Step 1: Enable Required GCP Services
Open your terminal and run the following commands to enable the necessary APIs for deployment:
```bash
gcloud services enable run.googleapis.com \
    artifactregistry.googleapis.com \
    cloudbuild.googleapis.com
```

### Step 2: Create an Artifact Registry Repository
Create a repository to store your Docker images:
```bash
gcloud artifacts repositories create carbonquest-apps \
    --repository-format=docker \
    --location=us-central1 \
    --description="Docker repository for CarbonQuest AI"
```

### Step 3: Deploy the Backend (API Engine)
1. **Build and push the image using Google Cloud Build**:
   ```bash
   cd backend
   gcloud builds submit --tag us-central1-docker.pkg.dev/YOUR_PROJECT_ID/carbonquest-apps/carbonquest-backend
   ```
2. **Deploy the image to Cloud Run**:
   ```bash
   gcloud run deploy carbonquest-backend \
       --image us-central1-docker.pkg.dev/YOUR_PROJECT_ID/carbonquest-apps/carbonquest-backend \
       --region us-central1 \
       --allow-unauthenticated \
       --set-env-vars="GEMINI_API_KEY=your_gemini_key,GOOGLE_MAPS_API_KEY=your_maps_key" \
       --port=8080
   ```
3. Copy the **Service URL** provided by Cloud Run for the backend (e.g., `https://carbonquest-backend-xyz-uc.a.run.app`).

### Step 4: Deploy the Frontend (Next.js Dashboard)
Before deploying the frontend, you must point it to your newly deployed backend API URL.

1. **Build and push the frontend image**:
   (Notice we inject the `NEXT_PUBLIC_API_URL` during the build step).
   ```bash
   cd ../frontend
   gcloud builds submit --tag us-central1-docker.pkg.dev/YOUR_PROJECT_ID/carbonquest-apps/carbonquest-frontend \
       --substitutions=_API_URL="https://carbonquest-backend-xyz-uc.a.run.app/api/v1"
   ```
   *(Note: You will need to add an `args` section in your frontend Dockerfile to accept this arg, or simply hardcode it into `next.config.js` prior to deploying if you prefer).*

2. **Deploy the image to Cloud Run**:
   ```bash
   gcloud run deploy carbonquest-frontend \
       --image us-central1-docker.pkg.dev/YOUR_PROJECT_ID/carbonquest-apps/carbonquest-frontend \
       --region us-central1 \
       --allow-unauthenticated \
       --port=3000
   ```

### Step 5: (Optional) Automated CI/CD via GitHub Actions
A complete workflow file (`.github/workflows/deploy.yml`) is already included in this repository. 
To activate it:
1. Go to your GitHub repository **Settings > Secrets and variables > Actions**.
2. Add the following secrets:
   - `GCP_PROJECT_ID`: Your Google Cloud Project ID.
   - `GCP_SA_KEY`: A JSON key for a Service Account with permissions to deploy to Cloud Run and push to Artifact Registry.
   - `GEMINI_API_KEY`: Your Gemini Key.
   - `GOOGLE_MAPS_API_KEY`: Your Google Maps Key.
3. Any push to the `main` branch will automatically build and deploy both services!
