import { Ionicons } from '@expo/vector-icons';
import { createContext, useContext, useState, ReactNode } from 'react';
import { SeverityTone } from '../theme/tokens';
import { Translations } from '../i18n/translations';

export interface Coordinate {
  latitude: number;
  longitude: number;
}

export type AlertSeverity = 'emergency' | 'watch' | 'advice';
export type DisasterType = 'fire' | 'flood' | 'storm' | 'earthquake' | 'heatwave';

export interface ActiveAlert {
  id: string;
  type: DisasterType;
  severity: AlertSeverity;
  /** Map display */
  coordinate: Coordinate;
  radius: number; // meters — 0 means point marker only
  /** Distance from user's home */
  distanceKm: number;
  /** Translation keys for UI text */
  headlineKey: keyof Translations;
  detailKey: keyof Translations;
  instructionKeys: (keyof Translations)[];
  /** Icon for markers and cards */
  icon: keyof typeof Ionicons.glyphMap;
  /** Minutes since last update */
  updatedMinAgo: number;
}

export const HOME_LOCATION: Coordinate = { latitude: -37.8136, longitude: 144.9631 };

// Simulated active alerts — in production this would come from an API
const INITIAL_ALERTS: ActiveAlert[] = [
  {
    id: 'storm-west',
    type: 'storm',
    severity: 'advice',
    coordinate: { latitude: -37.815, longitude: 144.92 },
    radius: 2000,
    distanceKm: 3.5,
    headlineKey: 'alertStormHeadline',
    detailKey: 'alertStormDetail',
    instructionKeys: ['stayInside', 'awayFromWindows', 'keepTorchReady', 'listenForUpdates'],
    icon: 'thunderstorm',
    updatedMinAgo: 2,
  },
  {
    id: 'fire-north',
    type: 'fire',
    severity: 'emergency',
    coordinate: { latitude: -37.785, longitude: 144.935 },
    radius: 800,
    distanceKm: 3.2,
    headlineKey: 'bushfireNearby',
    detailKey: 'leaveArea',
    instructionKeys: ['leaveHouseNow', 'takeChildren', 'goMeetingPoint', 'call000'],
    icon: 'flame',
    updatedMinAgo: 5,
  },
  {
    id: 'flood-east',
    type: 'flood',
    severity: 'watch',
    coordinate: { latitude: -37.83, longitude: 144.99 },
    radius: 1200,
    distanceKm: 5.0,
    headlineKey: 'floodRiskArea',
    detailKey: 'beReadyToLeave',
    instructionKeys: ['goUpstairs', 'dontWalkWater', 'callSES', 'listenForUpdates'],
    icon: 'water',
    updatedMinAgo: 10,
  },
];

interface AlertsContextType {
  alerts: ActiveAlert[];
  homeLocation: Coordinate;
  /** Returns the highest severity alert (emergency > watch > advice) */
  primaryAlert: ActiveAlert | null;
  /** Check if user's home is within any danger zone */
  homeInDanger: boolean;
}

const SEVERITY_PRIORITY: Record<AlertSeverity, number> = {
  emergency: 3,
  watch: 2,
  advice: 1,
};

const AlertsContext = createContext<AlertsContextType | null>(null);

export function AlertsProvider({ children }: { children: ReactNode }) {
  const [alerts] = useState<ActiveAlert[]>(INITIAL_ALERTS);

  // Sort by severity (highest first), then by distance (closest first)
  const sortedAlerts = [...alerts].sort((a, b) => {
    const sevDiff = SEVERITY_PRIORITY[b.severity] - SEVERITY_PRIORITY[a.severity];
    if (sevDiff !== 0) return sevDiff;
    return a.distanceKm - b.distanceKm;
  });

  const primaryAlert = sortedAlerts.length > 0 ? sortedAlerts[0] : null;

  // Check if home is within any alert radius
  const homeInDanger = alerts.some((alert) => {
    if (alert.radius === 0) return false;
    // Rough distance calculation (good enough for nearby alerts)
    const dLat = (alert.coordinate.latitude - HOME_LOCATION.latitude) * 111000;
    const dLng = (alert.coordinate.longitude - HOME_LOCATION.longitude) * 111000 * Math.cos(HOME_LOCATION.latitude * Math.PI / 180);
    const dist = Math.sqrt(dLat * dLat + dLng * dLng);
    return dist < alert.radius;
  });

  return (
    <AlertsContext.Provider value={{ alerts: sortedAlerts, homeLocation: HOME_LOCATION, primaryAlert, homeInDanger }}>
      {children}
    </AlertsContext.Provider>
  );
}

export function useAlerts(): AlertsContextType {
  const ctx = useContext(AlertsContext);
  if (!ctx) {
    throw new Error('useAlerts must be used within an AlertsProvider');
  }
  return ctx;
}

/** Map severity to theme tone */
export function severityToTone(severity: AlertSeverity): SeverityTone {
  switch (severity) {
    case 'emergency': return 'emergency';
    case 'watch': return 'watch';
    case 'advice': return 'advice';
  }
}
