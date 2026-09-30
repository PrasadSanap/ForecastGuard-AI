import {
  LayoutDashboard, Radar, Map as MapIcon, LineChart, MapPinned, Brain,
  SlidersHorizontal, Bell, BarChart3, HeartPulse, FileText,
} from 'lucide-react';

export const NAV = [
  { path: '/', label: 'Overview', icon: LayoutDashboard, enabled: true },
  { path: '/bust-radar', label: 'Forecast Bust Radar', icon: Radar, enabled: true },
  { path: '/confidence-map', label: 'Confidence Map', icon: MapIcon, enabled: true },
  { path: '/forecast-replay', label: 'Forecast Replay', icon: LineChart, enabled: true },
  { path: '/regions', label: 'Regional Analysis', icon: MapPinned, enabled: true },
  { path: '/explanations', label: 'AI Explanations', icon: Brain, enabled: true },
  { path: '/simulator', label: 'What-If Simulator', icon: SlidersHorizontal, enabled: true },
  { path: '/alerts', label: 'Alerts', icon: Bell, enabled: true },
  { path: '/analytics', label: 'Historical Analytics', icon: BarChart3, enabled: true },
  { path: '/model-health', label: 'Model & Data Health', icon: HeartPulse, enabled: true },
  { path: '/reports', label: 'Reports', icon: FileText, enabled: true },
];