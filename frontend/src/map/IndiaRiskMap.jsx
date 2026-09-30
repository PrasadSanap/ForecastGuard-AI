import { CircleMarker, MapContainer, TileLayer, Tooltip } from 'react-leaflet';
import { LEGENDS, METRICS, colorFor, metricValue } from '../utils/risk.js';

const radiusFor = (it) => 9 + (it.bustProbability / 100) * 13;

/**
 * Interactive India map (Leaflet + OpenStreetMap, no paid API).
 * Markers sit on state centroids of the DEMONSTRATION grid; they are not official gridded data.
 */
export default function IndiaRiskMap({ items = [], metric = 'bust', selectedCode, onSelect, height = 480, showLegend = true }) {
  return (
    <div className="dark-tiles border-line relative overflow-hidden rounded-xl border" style={{ height }}>
      <MapContainer center={[22.5, 80]} zoom={5} minZoom={4} maxZoom={8} scrollWheelZoom={false}
        style={{ height: '100%', width: '100%', background: '#0a1220' }}>
        <TileLayer attribution="&copy; OpenStreetMap contributors" url="https://tile.openstreetmap.org/{z}/{x}/{y}.png" />
        {items.map((it) => {
          const selected = it.region.code === selectedCode;
          const color = colorFor(metric, it);
          return (
            <CircleMarker key={it.id} center={[it.region.lat, it.region.lon]}
              radius={radiusFor(it) + (selected ? 3 : 0)}
              pathOptions={{ color: selected ? '#ffffff' : color, weight: selected ? 3 : 1.5, fillColor: color, fillOpacity: 0.6 }}
              eventHandlers={{
                click: () => onSelect && onSelect(it.region.code),
                mouseover: (e) => e.target.setStyle({ fillOpacity: 0.9 }),
                mouseout: (e) => e.target.setStyle({ fillOpacity: 0.6 }),
              }}>
              <Tooltip className="fg-tip" direction="top" sticky>
                <div className="text-xs">
                  <div className="mb-1 text-sm font-semibold">{it.region.name} · D{it.horizon}</div>
                  <div>Confidence: <b>{it.confidence}%</b></div>
                  <div>Bust probability: <b>{it.bustProbability}%</b></div>
                  <div>Expected error: <b>{it.expectedErrorLevel}</b></div>
                  <div>Risk: <b style={{ color: colorFor('bust', it) }}>{it.riskLevel}</b></div>
                  <div className="mt-1 text-slate-400">Click for details · {METRICS[metric].label}: {metricValue(metric, it)}</div>
                </div>
              </Tooltip>
            </CircleMarker>
          );
        })}
      </MapContainer>

      <div className="bg-bg/80 pointer-events-none absolute left-3 top-3 z-[1000] rounded-md border border-amber-500/40 px-2 py-1 text-[10px] font-semibold tracking-wide text-amber-300">
        DEMONSTRATION DATA · state-centroid grid · MODEL ESTIMATE
      </div>

      {showLegend && (
        <div className="border-line bg-bg/85 absolute bottom-6 left-3 z-[1000] rounded-lg border p-2.5 text-[11px] backdrop-blur">
          <div className="label mb-1.5">{METRICS[metric].label}</div>
          {LEGENDS[metric].map((l) => (
            <div key={l.label} className="flex items-center gap-2 py-0.5">
              <span className="h-2.5 w-2.5 rounded-full" style={{ background: l.color }} />
              <span className="whitespace-pre text-slate-300">{l.label}</span>
            </div>
          ))}
          <div className="mt-1.5 text-slate-500">Marker size = bust probability</div>
        </div>
      )}
    </div>
  );
}