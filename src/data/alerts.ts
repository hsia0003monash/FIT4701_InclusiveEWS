import { Ionicons } from '@expo/vector-icons';

export interface Coordinate {
  latitude: number;
  longitude: number;
}

export type HazardType = 'flood' | 'storm' | 'fire' | 'tree' | 'hydrant';

export interface MapAlert {
  id: string;
  hazard: HazardType;
  /** Icon shown on the marker and alert card — identifies the hazard type. */
  icon: keyof typeof Ionicons.glyphMap;
  /** Severity tone — drives colour, matching the rest of the app (never colour alone: paired with the label below). */
  tone: 'advice' | 'watch' | 'emergency';
  title: string;
  detail: string;
  instructions: string[];
  coordinate: Coordinate;
  /** Danger-zone radius in metres. */
  radius: number;
  distanceKm: number;
  updatedMinAgo: number;
}

export const HOME_LOCATION: Coordinate = { latitude: -37.8136, longitude: 144.9631 };

// Priority order for sorting: highest severity first.
const TONE_PRIORITY: Record<MapAlert['tone'], number> = {
  emergency: 3,
  watch: 2,
  advice: 1,
};

// Alerts listed with the most serious threat first. The flash flood is the main threat;
// the storm (watch) and the advice-tier alerts (bushfire, fallen tree, damaged hydrant)
// sit below it in priority order.
const UNSORTED_ALERTS: MapAlert[] = [
  {
    id: 'yarra-flood',
    hazard: 'flood',
    icon: 'water',
    tone: 'emergency',
    title: 'Flash flooding emergency along the Yarra River',
    detail: 'Dangerous flash flooding is hitting the Yarra River area now. Move to higher ground immediately if you are near the river.',
    instructions: [
      'Move to higher ground now',
      "Don't walk or drive through floodwater",
      'Take your emergency kit',
      'Call 000 if trapped',
    ],
    coordinate: { latitude: -37.8183, longitude: 144.9669 },
    radius: 1200,
    distanceKm: 1.2,
    updatedMinAgo: 2,
  },
  {
    id: 'west-storm',
    hazard: 'storm',
    icon: 'thunderstorm',
    tone: 'watch',
    title: 'Severe thunderstorm approaching from the west',
    detail: 'A severe thunderstorm is approaching from the west, with damaging winds and heavy rain possible across central Melbourne.',
    instructions: ['Stay inside', 'Stay away from windows', 'Keep a torch ready', 'Secure loose outdoor items'],
    coordinate: { latitude: -37.805, longitude: 144.945 },
    radius: 6000,
    distanceKm: 1.9,
    updatedMinAgo: 8,
  },
  {
    id: 'dandenong-bushfire',
    hazard: 'fire',
    icon: 'flame',
    tone: 'advice',
    title: 'Bushfire advice near the Dandenong Ranges',
    detail: 'A bushfire is burning near the Dandenong Ranges. Stay informed and be ready to act if the situation changes.',
    instructions: ['Stay informed', 'Prepare your emergency kit', 'Know your meeting point', 'Listen for updates'],
    coordinate: { latitude: -37.87, longitude: 145.35 },
    radius: 2500,
    distanceKm: 32,
    updatedMinAgo: 5,
  },
  {
    id: 'st-kilda-tree',
    hazard: 'tree',
    icon: 'leaf',
    tone: 'advice',
    title: 'Fallen tree blocking the road in St Kilda',
    detail: 'A tree has fallen across the road in St Kilda following recent winds. The road is partially blocked and traffic delays are possible.',
    instructions: [
      'Avoid the affected street if possible',
      'Drive carefully around the area',
      'Report it to the council if not already cleared',
      'No further action needed',
    ],
    coordinate: { latitude: -37.8678, longitude: 144.9799 },
    radius: 0,
    distanceKm: 6.2,
    updatedMinAgo: 15,
  },
  {
    id: 'brunswick-hydrant',
    hazard: 'hydrant',
    icon: 'construct',
    tone: 'advice',
    title: 'Damaged fire hydrant reported in Brunswick',
    detail: 'A fire hydrant has been damaged in Brunswick and is leaking water onto the street. Repair crews have been notified.',
    instructions: [
      'Avoid parking near the hydrant',
      'Watch for wet or slippery road surfaces',
      'Report any further damage to the council',
      'No further action needed',
    ],
    coordinate: { latitude: -37.7663, longitude: 144.9598 },
    radius: 0,
    distanceKm: 5.3,
    updatedMinAgo: 25,
  },
];

export const MAP_ALERTS: MapAlert[] = [...UNSORTED_ALERTS].sort(
  (a, b) => TONE_PRIORITY[b.tone] - TONE_PRIORITY[a.tone] || a.distanceKm - b.distanceKm,
);

// The single most important threat (highest severity, then nearest). Drives the
// featured alert card on the Home screen.
export const PRIMARY_ALERT: MapAlert = MAP_ALERTS[0];

function isHomeInDanger(): boolean {
  return MAP_ALERTS.some((alert) => {
    if (alert.radius === 0) return false;
    const dLat = (alert.coordinate.latitude - HOME_LOCATION.latitude) * 111000;
    const dLng =
      (alert.coordinate.longitude - HOME_LOCATION.longitude) * 111000 * Math.cos((HOME_LOCATION.latitude * Math.PI) / 180);
    const distance = Math.sqrt(dLat * dLat + dLng * dLng);
    return distance < alert.radius;
  });
}

export const HOME_IN_DANGER = isHomeInDanger();

/** '#RRGGBB' -> 'rgba(r, g, b, alpha)', for the map's danger-zone circle fills. */
export function withAlpha(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}
