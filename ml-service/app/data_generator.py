"""DEMONSTRATION DATA generator. Relationships are prototype assumptions,
NOT properties of any official NCMRWF model."""
import numpy as np
import pandas as pd

REGIONS = [
    ("Maharashtra", 19.7, 75.7), ("Gujarat", 22.3, 71.2), ("Rajasthan", 27.0, 74.2),
    ("Kerala", 10.5, 76.3), ("Karnataka", 15.3, 75.7), ("Tamil Nadu", 11.1, 78.7),
    ("Andhra Pradesh", 15.9, 79.7), ("Telangana", 18.1, 79.0), ("Odisha", 20.9, 85.1),
    ("West Bengal", 22.9, 87.9), ("Bihar", 25.1, 85.3), ("Uttar Pradesh", 26.8, 80.9),
    ("Madhya Pradesh", 23.5, 78.6), ("Chhattisgarh", 21.3, 81.9), ("Jharkhand", 23.6, 85.3),
    ("Assam", 26.2, 92.9), ("Punjab", 31.1, 75.3), ("Haryana", 29.1, 76.1),
    ("Uttarakhand", 30.1, 79.0), ("Himachal Pradesh", 31.9, 77.2),
]

FEATURES = ["horizon", "rainfallAnomaly", "pressureChange", "windChange",
            "temperatureAnomaly", "historicalMAE", "humidityInstability"]

ERROR_SCALE = 12.0        # normalises absolute error to ~0..1
BUST_THRESHOLD = 0.55     # configurable PROTOTYPE assumption, not an official definition


def generate_dataset(days: int = 60, seed: int = 42) -> pd.DataFrame:
    rng = np.random.default_rng(seed)
    rows = []
    for name, lat, lon in REGIONS:
        volatility = rng.uniform(0.8, 1.4)
        base_mae = rng.uniform(1.0, 2.2)
        for d in range(days):
            for h in range(1, 11):
                f = {
                    "rainfallAnomaly": rng.normal(0, 1),
                    "pressureChange": rng.normal(0, 1),
                    "windChange": rng.normal(0, 1),
                    "temperatureAnomaly": rng.normal(0, 1),
                    "humidityInstability": abs(rng.normal(0, 1)),
                }
                hist = base_mae + 0.1 * h + rng.normal(0, 0.15)
                err = volatility * (0.35 * h + 1.2 * abs(f["rainfallAnomaly"])
                                    + 0.8 * abs(f["pressureChange"]) + 0.6 * abs(f["windChange"])
                                    + 0.4 * abs(f["temperatureAnomaly"])
                                    + 0.3 * f["humidityInstability"] + 0.5 * hist)
                err = max(0.0, err + rng.normal(0, 0.8))
                norm = min(err / ERROR_SCALE, 1.5)
                rows.append({"region": name, "lat": lat, "lon": lon, "dayIndex": d,
                             "horizon": h, **f, "historicalMAE": hist,
                             "absoluteError": err, "normError": norm,
                             "bust": int(norm >= BUST_THRESHOLD)})
    return pd.DataFrame(rows)