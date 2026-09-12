# 🌬️ AirWatch — AI-Powered Air Quality Forecasting for BRICS Cities

> **Hack2Skill — Build with AI Code for Communities**
> Track 2: Clean Air & Climate Resilience

![AirWatch Dashboard](https://img.shields.io/badge/Status-Live%20Prototype-brightgreen)
![Next.js](https://img.shields.io/badge/Next.js-16-black)
![FastAPI](https://img.shields.io/badge/FastAPI-Python-009688)
![XGBoost](https://img.shields.io/badge/ML-XGBoost%20%2B%20SHAP-orange)
![Gemini](https://img.shields.io/badge/AI-Gemini%203.6%20Flash-blue)

---

## 🎯 Problem Statement

BRICS cities (Delhi, Mumbai, Beijing, Shanghai, Moscow, São Paulo, Cairo, Johannesburg) are home to over 3 billion people, yet suffer from **sparse air quality sensor coverage** and **lack of citizen-facing health guidance**. Existing solutions are either too technical for everyday use or too slow to act on.

**AirWatch bridges this gap** by combining real-time AQI data, machine learning forecasts, and AI-generated health advisories into a single citizen-facing dashboard.

---

## 🚀 Live Demo

> 🔗 [airwatch-demo.vercel.app](https://airwatch-demo.vercel.app) *(coming soon)*
> 📦 [GitHub Repository](https://github.com/reuke1111/airwatch)

---

## ✨ Key Features

| Feature | Description |
|--------|-------------|
| 🗺️ **Live AQI Map** | Interactive map with color-coded markers for 8 BRICS cities |
| 📊 **XGBoost Forecast** | Predicts next 24hr AQI using machine learning |
| 🔬 **SHAP Explainability** | Shows *why* the model made each prediction |
| 🤖 **AI Health Advisory** | Gemini-powered personalized health tips per city |
| ⚡ **Real-time Data** | Live AQI from WAQI API, updated continuously |
| 🏙️ **8 BRICS Cities** | Delhi, Mumbai, Beijing, Shanghai, Moscow, São Paulo, Cairo, Johannesburg |

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────┐
│              Next.js Frontend               │
│  Map (Leaflet) · Charts (Recharts) · UI     │
└──────────────┬──────────────────────────────┘
               │ REST API
┌──────────────▼──────────────────────────────┐
│            FastAPI Backend                  │
│  /api/aqi · /api/forecast/{city}            │
└──────┬───────────────────────┬──────────────┘
       │                       │
┌──────▼──────┐        ┌───────▼──────────────┐
│  WAQI API   │        │   ML Models (XGBoost) │
│  Live AQI   │        │   + SHAP Explainer    │
│  8 cities   │        │   pkl files per city  │
└─────────────┘        └──────────────────────┘
                                │
                    ┌───────────▼──────────────┐
                    │    Gemini AI API         │
                    │  Health Advisory Tips    │
                    └──────────────────────────┘
```

---

## 🧠 ML Model

- **Algorithm:** XGBoost Regressor (one model per city)
- **Features:** AQI lag values (1-3 days), rolling averages, PM2.5/PM10 lags, day of week, month
- **Explainability:** SHAP (SHapley Additive exPlanations) — shows feature contribution to each forecast
- **Training data:** Historical AQI from WAQI API

### Why XGBoost?
Validated by Singh et al. (2026) — ensemble tree methods achieve R²>0.99 on urban AQI datasets. Simple, fast, and interpretable — perfect for a citizen-facing prototype.

---

## 🛠️ Tech Stack

### Frontend
- **Next.js 16** (App Router, TypeScript)
- **Tailwind CSS** — styling
- **Leaflet.js** — interactive map
- **Recharts** — AQI charts & SHAP visualization
- **Gemini 3.6 Flash** — AI health advisory

### Backend
- **Python 3.11 + FastAPI** — REST API
- **WAQI API** — real-time AQI data
- **XGBoost + SHAP** — forecasting & explainability
- **httpx** — async HTTP client

### DevOps
- **Vercel** — frontend deployment
- **GitHub** — version control

---

## 📡 API Endpoints

| Endpoint | Description |
|----------|-------------|
| `GET /api/aqi` | Live AQI for all 8 BRICS cities |
| `GET /api/forecast/{city}` | XGBoost forecast + SHAP values for a city |
| `GET /docs` | Interactive Swagger UI |

---

## 🚀 Getting Started

### Prerequisites
- Python 3.11+
- Node.js 18+
- WAQI API token (free at [aqicn.org](https://aqicn.org/data-platform/token/))
- Gemini API key (free at [aistudio.google.com](https://aistudio.google.com))

### Backend Setup

```bash
cd backend
pip install -r requirements.txt

# Create .env file
echo "WAQI_API_KEY=your_token_here" > .env

# Start the server
python -m uvicorn main:app --reload
# API running at http://localhost:8000
```

### ML Model Training

```bash
cd ml
pip install xgboost shap pandas scikit-learn

# Fetch historical data
python fetch_history.py

# Train models + generate SHAP plots
python train_model.py
```

### Frontend Setup

```bash
cd frontend
npm install

# Create .env.local
echo "GEMINI_API_KEY=your_key_here" > .env.local

# Start dev server
npm run dev
# Dashboard at http://localhost:3000
```

---

## 🗺️ Supported Cities

| City | Country | Region |
|------|---------|--------|
| Delhi | 🇮🇳 India | South Asia |
| Mumbai | 🇮🇳 India | South Asia |
| Beijing | 🇨🇳 China | East Asia |
| Shanghai | 🇨🇳 China | East Asia |
| Moscow | 🇷🇺 Russia | Eastern Europe |
| São Paulo | 🇧🇷 Brazil | South America |
| Cairo | 🇪🇬 Egypt | North Africa |
| Johannesburg | 🇿🇦 South Africa | Sub-Saharan Africa |

---

## 🔬 Research Foundation

This project is grounded in peer-reviewed research:

- **Singh et al. (2026)** — Ensemble XGBoost + SHAP for AQI (R²≈0.9969)
- **Rajesh et al. (2025)** — ML framework for real-time health risk mapping
- **Chadalavada et al. (2025)** — AI in air pollution: systematic review of 65 papers
- **Lee & Lee (2023)** — Federated learning for air pollution (future roadmap)

---

## 🔮 Future Roadmap

- [ ] **LSTM/GNN models** for temporal & spatial forecasting
- [ ] **Satellite data integration** (NASA MODIS, CAMS)
- [ ] **Federated learning** for smartphone crowdsensing
- [ ] **Route advisor** — suggest lower-pollution commute routes
- [ ] **Mobile app** with push alerts for AQI spikes
- [ ] **CPCB integration** for India-specific hyperlocal data

---

## ⚠️ Patent Compliance

AirWatch is designed to avoid known patent conflicts:
- Uses **standalone XGBoost** (not the patented XGB+LSTM stacking in TWI662422B)
- **Software-only** approach (avoids IIT Delhi hardware patent US12313612B2)
- Uses **existing public APIs** (avoids Particles Plus crowdsourcing patents)

---

## 👨‍💻 Author

Built solo in 4 weeks for the **Hack2Skill Build with AI Code for Communities** hackathon.

---

## 📄 License

MIT License — open source, open data, open future. 🌱
