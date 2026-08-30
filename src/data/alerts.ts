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

export const MAP_ALERTS: MapAlert[] = [
  {
    id: 'yarra-flood',
    hazard: 'flood',
    icon: 'water',
    tone: 'advice',
    title: 'Flash flooding expected along the Yarra River',
    detail: 'Flash flooding expected along the Yarra River. Avoid low-lying paths and underpasses near the river.',
    instructions: [
      'Avoid riverside paths and underpasses',
      "Don't walk or drive through floodwater",
      'Keep your phone charged',
      'Listen for updates',
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
    tone: 'emergency',
    title: 'Bushfire emergency near the Dandenong Ranges',
    detail: 'A fast-moving bushfire is threatening properties near the Dandenong Ranges. Leave now if you are in the area.',
    instructions: ['Leave the area now', 'Take your emergency kit', 'Go to your meeting point', 'Call 000 if trapped'],
    coordinate: { latitude: -37.87, longitude: 145.35 },
    radius: 800,
    distanceKm: 32,
    updatedMinAgo: 5,
  },
];

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
