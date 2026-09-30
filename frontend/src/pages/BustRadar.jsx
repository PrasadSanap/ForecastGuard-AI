import RiskMapView from '../components/RiskMapView.jsx';

export default function BustRadar() {
  return (
    <RiskMapView
      title="Forecast Bust Radar"
      subtitle="Where, when, how likely and why a medium-range forecast may fail. Pick a day, then click a region."
      defaultMetric="bust"
    />
  );
}