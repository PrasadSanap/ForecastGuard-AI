"""Prototype Event Detection: rule-based 'potential event indicators'.
Not an official meteorological classification."""

def detect_events(rain=0.0, pressure=0.0, wind=0.0, temp=0.0, month=7, region_lat=20.0) -> dict:
    ev = []
    if rain > 1.5 and pressure < -1.0 and abs(wind) > 1.0:
        ev.append(("Rapid Weather Change", "Rapid rainfall increase + pressure drop + wind shift"))
    if rain > 1.8:
        ev.append(("Heavy Rainfall", "Strong positive rainfall anomaly"))
    if rain > 1.2 and pressure < -1.5 and 6 <= month <= 9:
        ev.append(("Monsoon Depression", "Rainfall surge with deep pressure drop in monsoon season"))
    if pressure < -2.0 and abs(wind) > 1.8:
        ev.append(("Cyclone-like Pattern", "Deep pressure fall with strong wind anomaly"))
    if region_lat > 28 and pressure < -0.8 and month in (11, 12, 1, 2, 3):
        ev.append(("Western Disturbance", "Northern region pressure fall in cool season"))
    if temp > 1.8 and rain < -0.3 and 3 <= month <= 6:
        ev.append(("Heat Wave", "Strong temperature anomaly with suppressed rainfall"))
    if 6 <= month <= 9 and rain > 0.8:
        ev.append(("Active Monsoon", "Positive rainfall anomaly in monsoon season"))
    if 6 <= month <= 9 and rain < -1.0:
        ev.append(("Break Monsoon", "Persistent negative rainfall anomaly in monsoon season"))
    return {"events": [{"event": e, "basis": b} for e, b in ev],
            "riskUplift": min(0.05 * len(ev) * 2, 0.3),
            "label": "Prototype Event Detection — potential event indicator"}