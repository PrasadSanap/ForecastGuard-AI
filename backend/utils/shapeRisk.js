// Primary driver skips "Forecast horizon" because it is a structural, not meteorological, factor.
const primaryDriver = (d) =>
  ((d.contributors || []).find((c) => c.key !== 'horizon') || {}).feature || 'Forecast horizon';

const regionBrief = (r) =>
  r && r.name ? { id: r._id, name: r.name, code: r.code, lat: r.lat, lon: r.lon, zone: r.zone } : r;

function shape(d) {
  return {
    id: d._id,
    region: regionBrief(d.region),
    date: d.date,
    horizon: d.horizon,
    confidence: d.confidence,
    bustProbability: d.bustProbability,
    expectedError: d.expectedError,
    expectedErrorLevel: d.expectedErrorLevel,
    riskLevel: d.riskLevel,
    primaryDriver: primaryDriver(d),
    eventUplift: d.eventUplift,
    events: d.events,
    contributors: d.contributors,
    inputs: d.inputs,
    modelVersion: d.modelVersion,
    label: 'MODEL ESTIMATE',
    dataMode: d.source,
  };
}

module.exports = { primaryDriver, regionBrief, shape };