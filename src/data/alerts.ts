import { Ionicons } from '@expo/vector-icons';

export interface Coordinate {
  latitude: number;
  longitude: number;
}

export type HazardType = 'flood' | 'storm' | 'fire';

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
// the storm (watch) and bushfire (advice) sit below it in priority order.
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
    detail: 'A severe thunderstorm is approaching from the west, with damaging winds and heavy rain possible.',
    instructions: ['Stay inside', 'Stay away from windows', 'Keep a torch ready', 'Secure loose outdoor items'],
    coordinate: { latitude: -37.79, longitude: 144.9 },
    radius: 2000,
    distanceKm: 4.6,
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
    radius: 800,
    distanceKm: 32,
    updatedMinAgo: 5,
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
