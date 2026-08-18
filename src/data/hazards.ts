import { MaterialCommunityIcons } from '@expo/vector-icons';
import type { SeverityTone } from '../theme/tokens';

// ---------------------------------------------------------------------------
// Hazard data model
// -------------------------------------------------------------------------

export type HazardType =
  | 'Fire'
  | 'Chemical'
  | 'Thunderstorm'
  | 'Storm'
  | 'Cyclone'
  | 'Extreme winds'
  | 'Earthquake'
  | 'Flooding'
  | 'Tsunami'
  | 'Landslide'
  | 'Heatwave'
  | 'Gas leak'
  | 'Air quality'
  | 'Misc';

export type HazardStatus = 'active' | 'inactive';

export interface Hazard {
  id: string;
  effectRadius: number;
  lat: number;
  long: number;
  type: HazardType;
  status: HazardStatus;
  description: string;
  /** Short, punchy summary used for the Home screen's alert headline. Falls back to `description` if omitted. */
  headline?: string;
  /** Explicit severity tier (advice/watch/emergency/safe) for hazards shown in alert-style contexts. */
  severityTone?: SeverityTone;
  updated?: string;
  featured?: boolean;
}

export interface HazardColour {
  id: HazardType;
  r: number;
  g: number;
  b: number;
  a: number;
}

export const HAZARD_STYLES: Record<
  HazardType,
  { icon: keyof typeof MaterialCommunityIcons.glyphMap; theme: HazardColour }
> = {
  Fire: {
    icon: 'fire',
    theme: { id: 'Fire', r: 234, g: 88, b: 12, a: 1 },
  },
  Chemical: {
    icon: 'flask-outline',
    theme: { id: 'Chemical', r: 132, g: 204, b: 22, a: 1 },
  },
  Thunderstorm: {
    icon: 'weather-lightning',
    theme: { id: 'Thunderstorm', r: 99, g: 102, b: 241, a: 1 },
  },
  Storm: {
    icon: 'weather-pouring',
    theme: { id: 'Storm', r: 71, g: 85, b: 105, a: 1 },
  },
  Cyclone: {
    icon: 'weather-hurricane',
    theme: { id: 'Cyclone', r: 168, g: 85, b: 247, a: 1 },
  },
  'Extreme winds': {
    icon: 'weather-windy',
    theme: { id: 'Extreme winds', r: 20, g: 184, b: 166, a: 1 },
  },
  Earthquake: {
    icon: 'waveform',
    theme: { id: 'Earthquake', r: 146, g: 64, b: 14, a: 1 },
  },
  Flooding: {
    icon: 'home-flood',
    theme: { id: 'Flooding', r: 37, g: 99, b: 235, a: 1 },
  },
  Tsunami: {
    icon: 'waves',
    theme: { id: 'Tsunami', r: 8, g: 47, b: 73, a: 1 }, // deep navy — darker/more severe than Flooding's blue
  },
  Landslide: {
    icon: 'terrain',
    theme: { id: 'Landslide', r: 120, g: 53, b: 15, a: 1 },
  },
  Heatwave: {
    icon: 'thermometer-high',
    theme: { id: 'Heatwave', r: 220, g: 38, b: 38, a: 1 },
  },
  'Gas leak': {
    icon: 'gas-cylinder',
    theme: { id: 'Gas leak', r: 202, g: 138, b: 4, a: 1 },
  },
  'Air quality': {
    icon: 'weather-hazy',
    theme: { id: 'Air quality', r: 156, g: 163, b: 175, a: 1 },
  },
  Misc: {
    icon: 'alert-circle-outline',
    theme: { id: 'Misc', r: 107, g: 114, b: 128, a: 1 },
  },
};

export const toRgba = (c: HazardColour, alpha?: number) =>
  `rgba(${c.r}, ${c.g}, ${c.b}, ${alpha ?? c.a})`;

export const INITIAL_HAZARDS: Hazard[] = [
  // --- Active: one per type ---
  {
    id: 'haz-001',
    type: 'Fire',
    status: 'active',
    effectRadius: 8000,
    lat: -37.8757,
    long: 145.3527,
    description:
      'Bushfire burning in the Dandenong Ranges, uncontrolled. Residents in affected areas should leave immediately if the path to do so is clear.',
  },
  {
    id: 'haz-002',
    type: 'Chemical',
    status: 'active',
    effectRadius: 3000,
    lat: -38.2333,
    long: 146.4167,
    description:
      'Chemical leak reported at an industrial facility in the Latrobe Valley. Nearby residents advised to stay indoors and close windows.',
  },
  {
    id: 'haz-003',
    type: 'Thunderstorm',
    status: 'active',
    effectRadius: 15000,
    lat: -37.6667,
    long: 145.4,
    description:
      'Severe thunderstorm warning for the Yarra Valley, with damaging winds and heavy rainfall expected to continue through the evening.',
  },
  {
    id: 'haz-005',
    type: 'Storm',
    status: 'active',
    effectRadius: 12000,
    lat: -38.3667,
    long: 145.0333,
    description:
      'Storm system moving across the Mornington Peninsula, bringing coastal flooding and strong winds to low-lying areas.',
  },
  {
    id: 'haz-006',
    type: 'Cyclone',
    status: 'active',
    effectRadius: 40000,
    lat: -37.95,
    long: 147.6167,
    description:
      'Ex-tropical cyclone system tracking toward Gippsland, expected to bring destructive winds and heavy rainfall over the next 24 hours.',
  },
  {
    id: 'haz-008',
    type: 'Extreme winds',
    status: 'active',
    effectRadius: 20000,
    lat: -35.25,
    long: 142.6667,
    description:
      'Extreme wind warning across the Mallee region, with gusts exceeding 100km/h expected to continue overnight.',
  },
  {
    id: 'haz-009',
    type: 'Earthquake',
    status: 'active',
    effectRadius: 25000,
    lat: -36.757,
    long: 144.2794,
    description:
      'A moderate earthquake has been recorded near Bendigo. Aftershocks are possible; residents advised to check for structural damage before re-entering buildings.',
  },
  {
    id: 'haz-010',
    type: 'Misc',
    status: 'active',
    effectRadius: 6000,
    lat: -38.1499,
    long: 144.3617,
    description:
      'Major road closures and localised flooding reported near Geelong following heavy overnight rainfall.',
  },
  {
    id: 'haz-011',
    type: 'Fire',
    status: 'inactive',
    effectRadius: 7000,
    lat: -37.0167,
    long: 144.0,
    description: 'Grassfire near Bendigo has been contained and extinguished. No further threat to the area.',
  },
  {
    id: 'haz-012',
    type: 'Storm',
    status: 'inactive',
    effectRadius: 10000,
    lat: -38.15,
    long: 141.6167,
    description:
      'Storm system that passed through Warrnambool overnight has cleared. Coastal flood warnings have been lifted.',
  },
  {
    id: 'haz-017',
    type: 'Flooding',
    status: 'active',
    effectRadius: 7000,
    lat: -38.16, // Barwon River area near Geelong — flood-prone
    long: 144.37,
    description:
      'Major flooding along the Barwon River following sustained heavy rainfall. Residents in low-lying areas urged to move to higher ground.',
  },
  {
    id: 'haz-018',
    type: 'Flooding',
    status: 'inactive',
    effectRadius: 9000,
    lat: -36.3667, // Shepparton/Goulburn River area — flood-prone
    long: 145.4,
    description: 'Flooding along the Goulburn River near Shepparton has receded. Some roads remain closed for cleanup.',
  },

  // --- Overlapping-radius examples ---
  {
    id: 'haz-014',
    type: 'Thunderstorm',
    status: 'active',
    effectRadius: 10000,
    lat: -37.8136, // Melbourne CBD
    long: 144.9631,
    description:
      'Severe thunderstorm cell tracking over central Melbourne, bringing heavy rain and lightning strikes.',
  },
  {
    id: 'haz-015',
    type: 'Extreme winds',
    status: 'active',
    effectRadius: 9000,
    lat: -37.85, // close to haz-014 — radii overlap
    long: 144.99,
    description:
      'Damaging wind gusts affecting inner south-eastern suburbs, with fallen trees and power outages reported.',
  },
  {
    id: 'haz-016',
    type: 'Fire',
    status: 'active',
    effectRadius: 6000,
    lat: -37.7, // close to haz-003 — radii overlap
    long: 145.38,
    description: 'Fast-moving grassfire near Lilydale, spreading toward nearby residential areas.',
  },
  {
    id: 'haz-019',
    type: 'Tsunami',
    status: 'active',
    effectRadius: 15000,
    lat: -38.6167, // Phillip Island — coastal
    long: 145.2333,
    description:
      'Tsunami warning issued for the Victorian coastline following offshore seismic activity. Coastal residents advised to move away from the shoreline and low-lying areas immediately.',
  },
  {
    id: 'haz-020',
    type: 'Landslide',
    status: 'active',
    effectRadius: 4000,
    lat: -37.7833, // Dandenong Ranges — landslide-prone after heavy rain
    long: 145.3667,
    description:
      'Landslide risk in the Dandenong Ranges following prolonged heavy rainfall. Residents on hillside properties advised to be alert for signs of ground movement.',
  },
  {
    id: 'haz-021',
    type: 'Heatwave',
    status: 'active',
    effectRadius: 60000,
    lat: -36.757, // Bendigo/central Victoria — broad regional coverage
    long: 144.2794,
    description:
      'Severe heatwave conditions across central Victoria, with temperatures forecast to exceed 42°C for three consecutive days. Vulnerable people advised to stay hydrated and avoid outdoor activity during peak heat.',
  },
  {
    id: 'haz-022',
    type: 'Gas leak',
    status: 'active',
    effectRadius: 1500,
    lat: -37.81, // inner Melbourne suburb — localized incident
    long: 144.99,
    description:
      'Gas leak reported at a residential property in Richmond. Nearby residents advised to avoid the area and refrain from using open flames.',
  },
  {
    id: 'haz-023',
    type: 'Air quality',
    status: 'active',
    effectRadius: 25000,
    lat: -37.8136, // Melbourne CBD and surrounds — smoke haze coverage
    long: 144.9631,
    description:
      'Poor air quality across Melbourne due to smoke haze from regional bushfires. People with respiratory conditions advised to stay indoors and keep windows closed.',
  },
  {
    id: 'haz-024',
    type: 'Tsunami',
    status: 'inactive',
    effectRadius: 12000,
    lat: -38.35, // Torquay/surf coast
    long: 144.3167,
    description:
      'Tsunami warning for the Surf Coast has been cancelled following further analysis of offshore seismic data. No further threat identified.',
  },
  {
    id: 'haz-025',
    type: 'Heatwave',
    status: 'inactive',
    effectRadius: 40000,
    lat: -35.25, // Mallee region
    long: 142.6667,
    description: 'Heatwave conditions across the Mallee region have eased following a cool change overnight.',
  },
  {
    id: 'haz-026',
    type: 'Air quality',
    status: 'inactive',
    effectRadius: 20000,
    lat: -38.1499, // Geelong
    long: 144.3617,
    description: 'Air quality in Geelong has returned to normal levels following the dispersal of earlier smoke haze.',
  },
  {
    id: 'haz-027',
    type: 'Thunderstorm',
    status: 'active',
    effectRadius: 6000,
    lat: -37.8917, // centred across Clayton / Mount Waverley / Wheelers Hill
    long: 145.1367,
    description:
      "Severe thunderstorm moving across Melbourne's south-eastern suburbs, affecting Clayton, Mount Waverley and Wheelers Hill. Damaging winds and heavy rainfall are expected, with localised flash flooding possible near low-lying areas and creek lines.",
    headline: 'Thunderstorm moving through Clayton, Mount Waverley and Wheelers Hill.',
    severityTone: 'advice',
    updated: '2 min ago',
    featured: true,
  },
];
