import RiskMapView from '../components/RiskMapView.jsx';

export default function ConfidenceMap() {
  return (
    <RiskMapView
      title="India Forecast Confidence Map"
      subtitle="Confidence bands from Very High (90–100) to Very Low (0–29). Switch the metric or the forecast day."
      defaultMetric="confidence"
    />
  );
}