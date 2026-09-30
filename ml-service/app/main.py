from datetime import datetime, timezone
from typing import Optional
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from .prediction import engine
from .event_detection import detect_events
from .data_generator import REGIONS, BUST_THRESHOLD, ERROR_SCALE

app = FastAPI(title="ForecastGuard AI — Reliability Engine (DEMONSTRATION MODE)")
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])
STARTED = datetime.now(timezone.utc)


class Features(BaseModel):
    horizon: float = 5
    rainfallAnomaly: float = 0
    pressureChange: float = 0
    windChange: float = 0
    temperatureAnomaly: float = 0
    historicalMAE: float = 1.5
    humidityInstability: float = 0.5


class SimIn(BaseModel):
    baseline: Features
    scenario: Features


class EventIn(BaseModel):
    rain: float = 0
    pressure: float = 0
    wind: float = 0
    temp: float = 0
    month: int = 7
    regionLat: float = 20.0


@app.get("/health")
def health():
    return {"status": "ok", "mode": "DEMONSTRATION MODE", "modelVersion": engine.version}


@app.post("/predict/error")
def p_error(f: Features):
    r = engine.predict(f.model_dump())
    return {"expectedError": r["expectedError"], "expectedErrorLevel": r["expectedErrorLevel"], "label": r["label"]}


@app.post("/predict/bust-risk")
def p_bust(f: Features):
    return engine.predict(f.model_dump())


@app.post("/predict/confidence")
def p_conf(f: Features):
    r = engine.predict(f.model_dump())
    return {"confidence": r["confidence"], "curve": engine.curve(f.model_dump()), "label": r["label"]}


@app.post("/explain")
def explain(f: Features):
    return {**engine.explain(f.model_dump()), "prediction": engine.predict(f.model_dump())}


@app.post("/simulate")
def simulate(s: SimIn):
    return engine.simulate(s.baseline.model_dump(), s.scenario.model_dump())


@app.post("/detect-event")
def event(e: EventIn):
    return detect_events(e.rain, e.pressure, e.wind, e.temp, e.month, e.regionLat)


@app.get("/model/health")
def model_health():
    up = (datetime.now(timezone.utc) - STARTED).total_seconds()
    return {"modelVersion": engine.version, "status": "GOOD", "lastTraining": engine.trained_at,
            "metrics": engine.metrics, "featuresAvailable": engine.features_available,
            "regionsCovered": len(REGIONS), "horizons": 10, "bustThreshold": BUST_THRESHOLD,
            "errorScale": ERROR_SCALE, "uptimeSeconds": round(up), "dataMode": "DEMONSTRATION DATA"}