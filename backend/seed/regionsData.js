// Same 20 regions as ml-service/app/data_generator.py (state-level DEMONSTRATION grid).
const REGIONS = [
  ['Maharashtra', 19.7, 75.7, 'West'], ['Gujarat', 22.3, 71.2, 'West'],
  ['Rajasthan', 27.0, 74.2, 'North'], ['Kerala', 10.5, 76.3, 'South'],
  ['Karnataka', 15.3, 75.7, 'South'], ['Tamil Nadu', 11.1, 78.7, 'South'],
  ['Andhra Pradesh', 15.9, 79.7, 'South'], ['Telangana', 18.1, 79.0, 'South'],
  ['Odisha', 20.9, 85.1, 'East'], ['West Bengal', 22.9, 87.9, 'East'],
  ['Bihar', 25.1, 85.3, 'East'], ['Uttar Pradesh', 26.8, 80.9, 'North'],
  ['Madhya Pradesh', 23.5, 78.6, 'Central'], ['Chhattisgarh', 21.3, 81.9, 'Central'],
  ['Jharkhand', 23.6, 85.3, 'East'], ['Assam', 26.2, 92.9, 'Northeast'],
  ['Punjab', 31.1, 75.3, 'North'], ['Haryana', 29.1, 76.1, 'North'],
  ['Uttarakhand', 30.1, 79.0, 'North'], ['Himachal Pradesh', 31.9, 77.2, 'North'],
].map(([name, lat, lon, zone]) => ({ name, code: name.toLowerCase().replace(/\s+/g, '-'), lat, lon, zone }));

// Scripted demonstration scenarios: anomalies (in standard-deviation units) for selected regions.
const HOTSPOTS = {
  Maharashtra: { rain: 2.2, pres: -1.7, wind: 1.4, temp: 0.3, hum: 1.5 },
  Gujarat: { rain: 1.6, pres: -1.2, wind: 1.1, hum: 1.2 },
  Odisha: { rain: 1.9, pres: -1.8, wind: 1.7, hum: 1.4 },
  'West Bengal': { rain: 1.5, pres: -1.4, wind: 1.3, hum: 1.2 },
  Kerala: { rain: 1.3, pres: -0.6, wind: 0.8, hum: 1.0 },
  Assam: { rain: 1.4, pres: -0.7, wind: 0.6, hum: 1.1 },
  Rajasthan: { rain: -0.4, pres: -0.3, wind: 0.6, temp: 2.1, hum: 0.3 },
  Punjab: { rain: 0.4, pres: -1.0, wind: 0.9, hum: 0.6 },
  'Tamil Nadu': { rain: 0.1, pres: 0.1, wind: 0.2, temp: 0.2, hum: 0.2 },
  Karnataka: { rain: 0.2, pres: -0.1, wind: 0.1, temp: 0.1, hum: 0.3 },
};

module.exports = { REGIONS, HOTSPOTS };