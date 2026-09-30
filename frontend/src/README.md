# ForecastGuard AI

**AI-Powered Forecast Reliability & Bust Detection**
*"Know when a forecast may fail — before it matters."*

Prototype built for **Smart India Hackathon 2026**, Problem Statement **26079** — *AI-Based Forecast Bust Detection for Medium-Range Weather Forecasts* (Ministry of Earth Sciences / NCMRWF, Software, Smart Automation).

> **This is a prototype decision-support tool. It is not an official NCMRWF system, does not use confidential NCMRWF operational data unless explicitly supplied, is not officially validated, and does not replace an NWP model or a meteorologist.** All data shipped with this repository is synthetic and is labeled **DEMONSTRATION DATA**, **MODEL ESTIMATE** or **SIMULATION** throughout the application.

## 1. Overview

Medium-range forecasts (Day 1–10) can fail badly during rapidly evolving weather — monsoon depressions, heavy rainfall, western disturbances, cyclones, heat waves, and active/break monsoon phases. ForecastGuard AI does **not** forecast weather. It is a reliability layer that sits alongside an existing NWP forecast and estimates:

1. **WHERE** is the forecast likely to fail?
2. **WHEN** is it likely to fail (which Day 1–10 horizon)?
3. **HOW LIKELY** is the forecast bust?
4. **WHY** does the model think confidence is low?

Existing NWP Forecast + Historical Forecast Performance + Observed Weather + Atmospheric Features
↓
AI Reliability Engine → Forecast Error Prediction → Bust Probability → Confidence Score
↓
Spatial Risk Map → Explainable AI → Decision Support

## 2. Problem understanding

Operational forecasters need to know not just *what* the forecast says, but *how much to trust it*, region by region and day by day. Confidence is not uniform — it decays with lead time and spikes during volatile synoptic patterns. Today that trust is largely tacit forecaster experience; ForecastGuard AI makes it an explicit, explainable, queryable signal.

## 3. Proposed solution

A three-tier system (React → Node/Express → MongoDB + Python/FastAPI ML service) that:
- Trains a reliability model on forecast/observation pairs (synthetic here, pluggable with real data),
- Serves per-region, per-horizon confidence, bust probability, expected error and feature-level explanations,
- Detects rule-based "potential event indicators" that historically correlate with larger errors,
- Lets a user run "what-if" scenarios and upload their own forecast/observation CSVs.

## 4. Innovation / uniqueness

- Not a weather app — a **reliability layer** on top of forecasts that already exist.
- Four flagship features not found in a typical weather dashboard: the **Forecast Bust Radar**, **Confidence Decay Curve** (Day 1→10), **Forecast Replay** (forecast vs. observation with flagged deviations), and a **What-If Reliability Simulator** with per-factor sensitivity.
- Explanations are **computed**, not decorative: importance-weighted feature deviation from the trained model, returned by the same API that produces the prediction.
- A CSV upload path lets a real NWP/observation dataset be plugged in without code changes.

## 5. System architecture

USER → REACT FRONTEND → NODE/EXPRESS API ──┬──→ MONGODB
└──→ PYTHON ML API (FastAPI) → AI Reliability Engine
↓
Prediction / Bust Probability / Explanation
↓
Node Backend → React Frontend


## 6. Data flow

Weather/NWP Data → Ingestion → Cleaning → Feature Engineering → Historical Forecast Error
→ ML Reliability Model → Bust Probability → Confidence Score
→ Spatial Visualization → Explainable AI → Decision Support


## 7. AI/ML approach

Three scikit-learn models trained on 12,000 synthetic region×day×horizon samples (`ml-service/app/data_generator.py`):

| Model | Algorithm | Predicts |
|---|---|---|
| Error regressor | `RandomForestRegressor` | normalised forecast error |
| Bust classifier | `RandomForestClassifier` | probability of forecast bust |
| Anomaly detector | `IsolationForest` | unusual feature combinations |

**Confidence score** = `100 × (1 − penalty)`, where `penalty` is a documented weighted blend of predicted error, bust probability and anomaly score (`ml-service/app/prediction.py::predict`). It is never a random number.

**Event detection** (`ml-service/app/event_detection.py`) is a transparent, rule-based classifier over rainfall/pressure/wind/temperature anomalies (e.g. *rainfall increase + pressure drop + wind shift → potential rapidly evolving weather system*), labeled **"Prototype Event Detection"** everywhere it appears.

## 8. Forecast bust definition used by this prototype

Two related, both **configurable, non-official** definitions:

- **Model training label** (ML service): `bust = 1` if normalised predicted error ≥ `0.55` (`BUST_THRESHOLD` in `data_generator.py`).
- **Historical/analytics label** (Node backend): a stored forecast record is a "historical bust" if `|forecast − observed| / variable_scale ≥ 1.0` (`BUST_NORM_ERROR` env var, default `1.0`, in `utils/variables.js`). Variable scale normalises mm/hPa/°C onto one axis so different variables are comparable.

Neither threshold is an official NCMRWF definition; both are returned in API responses (`bustDefinition` field) so the UI can show them next to any statistic that depends on them.

## 9. Explainability approach

`POST /explain` on the ML service returns per-feature contributions computed as **global feature importance × local standardised deviation from the training mean**, normalised to sum to 100%. This is a transparent approximation, not SHAP (SHAP was evaluated but the importance-weighted approach was chosen for speed and easy interpretation in a live demo). Every explanation response carries the label `"Model-generated explanation"` and the method name, so it is never confused with an official assessment.

## 10. Synthetic data disclaimer

All bundled data — 20 Indian states, 10 forecast horizons, 60 days of forecast/observation/error history — is **generated** by `ml-service/app/data_generator.py` (model training) and `backend/seed/seed.js` (application database), using a fixed random seed for reproducibility. Relationships (e.g. "higher horizon → generally greater uncertainty") are **demonstration assumptions**, not properties of any operational NWP model. Every synthetic record is tagged `source: "DEMONSTRATION DATA"` in MongoDB and rendered with a `DEMONSTRATION MODE` / `DEMONSTRATION DATA` badge in the UI.

## 11. Data upload format

**Model & Data Health → Upload Forecast Dataset**, or `POST /api/upload/forecast` (raw CSV body, `Content-Type: text/csv`).

Required columns: `date, region, horizon, variable, forecast, observed`
Optional context columns: `temperature, rainfall, humidity, pressure, windSpeed`

```csv
date,region,horizon,variable,forecast,observed,temperature,rainfall,humidity,pressure,windSpeed
2026-09-20,Maharashtra,3,rainfall,12.5,9.1,31.2,9.1,78,1007.5,14.2
```

- `region` must match a seeded region name or code (case-insensitive).
- `variable` must be one of the five supported variables (`wind` is accepted as an alias for `windSpeed`).
- Rows are validated and upserted (re-uploading the same rows updates them, never duplicates). Uploaded rows are tagged `source: "UPLOADED DATA"` and immediately feed Forecast Replay, error analytics and reports. They do **not** retrain the ML models in this prototype.
- Response includes rows imported/rejected, missing columns, and a sampled list of rejection reasons.
- Download a blank template from the same page or `GET /api/upload/template`.

## 12. Database schema (MongoDB / Mongoose)

`User, Region, Forecast, Observation, ForecastError, BustRisk, Alert, ModelRun, Simulation` — see `backend/models/*.js` for exact fields. Key points: `BustRisk` has a unique index on `(region, date, horizon)`; `ForecastError` stores both absolute and relative error per record.

## 13. API documentation

All routes are prefixed `/api` and (except `/auth/login`, `/auth/register`, `/health`) require `Authorization: Bearer <JWT>`.

| Method | Route | Purpose |
|---|---|---|
| POST | `/auth/register`, `/auth/login` | Auth (register cannot create Admin) |
| GET | `/auth/me` | Current user |
| GET | `/dashboard/overview` | Overview KPIs, D1–D10 trend, insight |
| GET | `/regions`, `/regions/:id` | Region list / detail |
| GET | `/forecasts`, `/forecasts/:regionId` | Forecast records / Forecast Replay |
| GET | `/observations` | Observation records |
| GET | `/errors`, `/errors/summary` | Paginated errors / aggregate stats |
| GET | `/bust-risk`, `/bust-risk/:regionId` | Radar list / D1–D10 curve + explanation |
| POST | `/predictions` | On-demand ML reliability assessment |
| POST | `/simulation` | What-If simulator |
| GET | `/alerts`, PATCH `/alerts/:id` | Alert center (Analyst/Admin can act) |
| GET | `/analytics/overview\|horizon\|regions` | Historical analytics |
| GET | `/model/health` | Model & data health |
| GET | `/upload/template`, POST | Upload/download CSV template |

ML service (internal, called by the backend): `GET /health`, `POST /predict/error\|bust-risk\|confidence`, `POST /explain`, `POST /simulate`, `POST /detect-event`, `GET /model/health`.

## 14. Folder structure

forecastguard-ai/
├── frontend/ React + Vite + Tailwind + Leaflet + Recharts (11 pages)
├── backend/ Express + Mongoose + JWT (REST API, seed, CSV upload)
├── ml-service/ FastAPI + scikit-learn (reliability engine)
├── data/
└── README.md

See Stage 1–5 messages in project history for the full per-folder tree.

## 15. Installation

Prerequisites: Node.js 18+, Python 3.10+, MongoDB (local or Atlas).

```bash
git clone <repo-url> && cd forecastguard-ai

cd ml-service && pip install -r requirements.txt && cd ..
cd backend && npm install && cd ..
cd frontend && npm install && cd ..
```

## 16. Environment variables

`backend/.env` (copy from `.env.example`):

PORT=5000
MONGO_URI=mongodb://localhost:27017/forecastguard
JWT_SECRET=replace_with_secure_secret
ML_SERVICE_URL=http://localhost:8000
CLIENT_URL=http://localhost:5173

`frontend/.env`: `VITE_API_URL=http://localhost:5000/api`
`ml-service`: `PORT=8000` (optional; defaults to 8000)

## 17. Running locally

```bash
# Terminal 1 — ML service
cd ml-service && uvicorn app.main:app --port 8000

# Terminal 2 — Backend (MongoDB must be running)
cd backend && npm run seed && npm run dev

# Terminal 3 — Frontend
cd frontend && npm run dev   # http://localhost:5173
```

## 18. Demo credentials

| Role | Email | Password |
|---|---|---|
| Analyst | analyst@forecastguard.demo | Analyst@123 |
| Researcher | researcher@forecastguard.demo | Researcher@123 |
| Admin | admin@forecastguard.demo | Admin@123 |

Researchers are read-only on alerts and cannot upload data; Analysts and Admins can do both.

## 19. Testing

```bash
cd backend && npm test   # Jest + Supertest + in-memory MongoDB; ML service is mocked
```
Covers: auth (incl. role-escalation block), dashboard, bust-risk, forecast replay, error analytics, predictions, simulation, alerts (role-gated actions), and CSV upload (valid/invalid rows, idempotency, missing columns, role restriction).

## 20. Deployment

Vercel (frontend) → Render (Node/Express) → MongoDB Atlas
↓
Render (Python/FastAPI ML service)


- **Frontend → Vercel**: import the repo, set root directory to `frontend/`, build command `npm run build`, output `dist/`, env var `VITE_API_URL=https://<your-backend>.onrender.com/api`.
- **Backend → Render**: new Web Service, root `backend/`, build `npm install`, start `npm start`, env vars `MONGO_URI`, `JWT_SECRET`, `ML_SERVICE_URL`, `CLIENT_URL` (your Vercel URL).
- **ML service → Render**: new Web Service, root `ml-service/`, build `pip install -r requirements.txt`, start `uvicorn app.main:app --host 0.0.0.0 --port $PORT`.
- **Database → MongoDB Atlas**: create a free cluster, allow Render's IPs (or 0.0.0.0/0 for a hackathon demo), copy the connection string into `MONGO_URI`.
- After first deploy, run `npm run seed` once against the Atlas URI (locally, with `MONGO_URI` and `ML_SERVICE_URL` pointed at the deployed ML service) to populate demonstration data.

## 21. Limitations

- This is **not** an official NCMRWF system and makes **no** claim of superior accuracy to any operational forecast.
- All bundled data is synthetic; real deployment requires official NWP/observation data via the upload path or a custom `WeatherDataProvider`.
- Bust thresholds (both the training label and the analytics label) are configurable prototype assumptions, not validated meteorological definitions.
- ML performance depends entirely on the quality and volume of historical data supplied; the shipped metrics describe performance on synthetic data only.
- One risk assessment is stored per "issue date" in this prototype (no rolling forecast-cycle history yet).
- CSV uploads feed analytics and replay but do not retrain the models in this build.

## 22. Future improvements

- Retrain-on-upload pipeline with model versioning and a held-out validation report.
- Real NWP/observation adapters (`WeatherDataProvider`, `NWPDataProvider`, `ObservationProvider` interfaces are already stubbed by the upload/ingestion design).
- SHAP-based explanations as an optional, heavier alternative to the current importance-weighted method.
- Gridded (sub-district) risk instead of state-centroid markers, once gridded data is available.
- Ensemble-spread-aware confidence, multi-cycle forecast comparison, and PDF report export.

## 23. SIH presentation explanation (3–5 minute demo flow)

1. **Overview** — Forecast Confidence, Bust Probability, Regions Requiring Attention.
2. **Forecast Bust Radar** — select **Day 6**, click a high-risk region.
3. Read its **Confidence** and **Bust Probability** cards.
4. Open **"Why is this forecast at risk?"** — feature contribution bars (AI Explanations page or the region detail panel).
5. **Forecast Replay** — Forecast vs. Observation, highlight a flagged divergence.
6. **What-If Simulator** — change rainfall anomaly, wind change, pressure change → Run Simulation → show bust probability change and the most influential factor.
7. Back to the **India map** — switch D1 → D10, show confidence decay.
8. **Model & Data Health** — data quality, model version, prediction latency.

---
*ForecastGuard AI — AI-based forecast reliability prototype. Designed to integrate with official NWP/observation data. Not an official NCMRWF product.*

