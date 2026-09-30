"""Reliability engine: error regressor, bust classifier, anomaly detector,
confidence score, and importance-weighted explanations (not SHAP)."""
import time
from datetime import datetime, timezone
import numpy as np
from sklearn.ensemble import RandomForestRegressor, RandomForestClassifier, IsolationForest
from sklearn.model_selection import train_test_split
from sklearn.metrics import mean_absolute_error, roc_auc_score
from .data_generator import generate_dataset, FEATURES, BUST_THRESHOLD, ERROR_SCALE

LABELS = {"horizon": "Forecast horizon", "rainfallAnomaly": "Rainfall anomaly",
          "pressureChange": "Pressure variation", "windChange": "Wind-pattern change",
          "temperatureAnomaly": "Temperature anomaly", "historicalMAE": "Historical error",
          "humidityInstability": "Humidity instability"}


class ReliabilityEngine:
    def __init__(self):
        self.version = "fg-proto-0.1.0"
        self.train()

    def train(self):
        df = generate_dataset()
        X, y_err, y_bust = df[FEATURES], df["normError"], df["bust"]
        Xtr, Xte, etr, ete, btr, bte = train_test_split(X, y_err, y_bust, test_size=0.2, random_state=1)
        self.reg = RandomForestRegressor(n_estimators=120, max_depth=10, random_state=1, n_jobs=-1).fit(Xtr, etr)
        self.clf = RandomForestClassifier(n_estimators=120, max_depth=10, random_state=1, n_jobs=-1).fit(Xtr, btr)
        self.iso = IsolationForest(n_estimators=100, contamination=0.05, random_state=1).fit(X)
        self.mean, self.std = X.mean(), X.std().replace(0, 1)
        imp = (self.reg.feature_importances_ + self.clf.feature_importances_) / 2
        self.importance = dict(zip(FEATURES, imp))
        self.metrics = {
            "maeNormalised": round(float(mean_absolute_error(ete, self.reg.predict(Xte))), 4),
            "aucBust": round(float(roc_auc_score(bte, self.clf.predict_proba(Xte)[:, 1])), 4),
            "trainingSamples": int(len(Xtr)),
            "bustRate": round(float(y_bust.mean()), 3),
        }
        self.trained_at = datetime.now(timezone.utc).isoformat()
        self.features_available = list(FEATURES)

    def _vec(self, inp: dict):
        import pandas as pd
        return pd.DataFrame([{f: float(inp.get(f, 0.0)) for f in FEATURES}])

    def predict(self, inp: dict) -> dict:
        t0 = time.perf_counter()
        x = self._vec(inp)
        norm_err = float(np.clip(self.reg.predict(x)[0], 0, 1.5))
        p_bust = float(self.clf.predict_proba(x)[0, 1])
        anomaly = float(-self.iso.score_samples(x)[0])           # higher = more unusual
        # CONFIDENCE = 100 * (1 - clip(0.5*predErrNorm/BUST_THRESHOLD*0.5 + 0.4*P(bust) + 0.1*anomaly))
        penalty = 0.5 * min(norm_err / (2 * BUST_THRESHOLD), 1) + 0.4 * p_bust + 0.1 * min(anomaly, 1)
        confidence = round(100 * (1 - float(np.clip(penalty, 0, 1))), 1)
        level = "LOW" if p_bust < 0.25 else "MODERATE" if p_bust < 0.5 else "HIGH" if p_bust < 0.75 else "CRITICAL"
        return {"confidence": confidence, "bustProbability": round(p_bust * 100, 1),
                "expectedError": round(norm_err * ERROR_SCALE, 2),
                "expectedErrorLevel": "Low" if norm_err < .3 else "Moderate" if norm_err < .55 else "High",
                "riskLevel": level, "anomalyScore": round(anomaly, 3),
                "modelVersion": self.version, "label": "MODEL ESTIMATE",
                "latencyMs": round((time.perf_counter() - t0) * 1000, 1)}

    def explain(self, inp: dict) -> dict:
        """Global importance x local standardised deviation (horizon is signed vs. mean).
        Transparent approximation, NOT SHAP."""
        raw = {}
        for f in FEATURES:
            v = float(inp.get(f, 0.0))
            z = abs(v - self.mean[f]) / self.std[f]
            raw[f] = (self.importance[f] * z, v - self.mean[f])
        total = sum(r[0] for r in raw.values()) or 1.0
        out = [{"feature": LABELS[f], "key": f, "contribution": round(100 * r[0] / total, 1),
                "direction": "increases risk" if r[0] > 0 else "neutral"}
               for f, r in raw.items()]
        out.sort(key=lambda c: -c["contribution"])
        return {"contributors": out, "method": "importance-weighted deviation", "label": "Model-generated explanation"}

    def simulate(self, baseline: dict, scenario: dict) -> dict:
        b, s = self.predict(baseline), self.predict(scenario)
        impacts = []
        for f in FEATURES:
            if scenario.get(f) != baseline.get(f):
                only = {**baseline, f: scenario.get(f, baseline.get(f, 0))}
                impacts.append({"factor": LABELS[f],
                                "deltaBustProbability": round(self.predict(only)["bustProbability"] - b["bustProbability"], 1)})
        impacts.sort(key=lambda i: -abs(i["deltaBustProbability"]))
        return {"before": b, "after": s, "mostInfluentialFactor": impacts[0] if impacts else None,
                "factorImpacts": impacts,
                "changeInBustProbability": round(s["bustProbability"] - b["bustProbability"], 1),
                "label": "SIMULATION — NOT AN OFFICIAL WEATHER FORECAST"}

    def curve(self, inp: dict) -> list:
        return [{"day": h, **{k: v for k, v in self.predict({**inp, "horizon": h}).items()
                if k in ("confidence", "bustProbability", "expectedError", "riskLevel")}}
                for h in range(1, 11)]


engine = ReliabilityEngine()