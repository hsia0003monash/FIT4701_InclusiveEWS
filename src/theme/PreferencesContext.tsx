import { Ionicons } from '@expo/vector-icons';
import { createContext, useContext, ReactNode } from 'react';
import { usePersistentState } from '../data/persistence';
import type { TravelMode } from '../data/travel';

export type ThemeMode = 'system' | 'light' | 'dark';
export type TextScale = 'standard' | 'large' | 'xlarge';
export type MapMarkerSize = 'small' | 'medium' | 'large';
export type MapButtonSize = 'small' | 'medium' | 'large';
export type MapButtonPosition = 'center' | 'side-right';

// Multipliers applied to the base marker/button dimensions on the Map
// screen — 'medium' matches the screen's original, un-scaled sizing.
export const MAP_MARKER_SIZE_SCALE: Record<MapMarkerSize, number> = { small: 0.8, medium: 1, large: 1.3 };
export const MAP_BUTTON_SIZE_SCALE: Record<MapButtonSize, number> = { small: 0.85, medium: 1, large: 1.25 };

// Shared option-list metadata for the Map screen's own settings overlay
// (and, previously, the global Settings screen — kept here so both could
// reference the same labels/icons without duplicating them).
export const MAP_MARKER_SIZE_OPTIONS: { value: MapMarkerSize; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { value: 'small', label: 'Small', icon: 'location-outline' },
  { value: 'medium', label: 'Medium', icon: 'location-outline' },
  { value: 'large', label: 'Large', icon: 'location-outline' },
];

export const MAP_BUTTON_SIZE_OPTIONS: { value: MapButtonSize; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { value: 'small', label: 'Small', icon: 'ellipse-outline' },
  { value: 'medium', label: 'Medium', icon: 'ellipse-outline' },
  { value: 'large', label: 'Large', icon: 'ellipse-outline' },
];

export const MAP_BUTTON_POSITION_OPTIONS: { value: MapButtonPosition; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { value: 'center', label: 'Bottom middle', icon: 'remove-outline' },
  { value: 'side-right', label: 'Right edge', icon: 'swap-vertical-outline' },
];

export interface Preferences {
  themeMode: ThemeMode;
  highContrast: boolean;
  textScale: TextScale;
  autoReadAlerts: boolean;
  /** Renders every active hazard on the map identically (one colour, one
   * icon) instead of distinguishing by type — for anyone who finds a
   * multi-type legend more confusing than helpful. */
  simpleMap: boolean;
  /** Applied as the starting travel mode whenever directions are requested. */
  defaultTravelMode: TravelMode;
  /** Modes the user can't use at all (e.g. no car) — hidden entirely from
   * the travel mode picker on the Map screen, not just deprioritised. */
  disabledTravelModes: TravelMode[];
  /** Scales hazard/destination/user-location markers on the Map screen. */
  mapMarkerSize: MapMarkerSize;
  /** Scales the locate/zoom/legend buttons and other on-map controls. */
  mapButtonSize: MapButtonSize;
  /** Horizontal position of the on-map control cluster. */
  mapButtonPosition: MapButtonPosition;
  /** Slow (safe, non-seizure-triggering rate) screen flash while a
   * full-screen alert is showing. On by default — a real requirement for
   * the hard-of-hearing persona this feature is built for — but can be
   * turned off for anyone sensitive to flashing screens. */
  flashOnAlert: boolean;
  /** Repeating vibration while a full-screen alert is showing. */
  vibrateOnAlert: boolean;
}

export const DEFAULT_PREFERENCES: Preferences = {
  themeMode: 'system',
  highContrast: false,
  textScale: 'standard',
  autoReadAlerts: false,
  simpleMap: false,
  defaultTravelMode: 'driving',
  disabledTravelModes: [],
  mapMarkerSize: 'medium',
  mapButtonSize: 'medium',
  mapButtonPosition: 'center',
  flashOnAlert: false,
  vibrateOnAlert: true,
};

interface PreferencesContextValue {
  preferences: Preferences;
  setPreferences: (value: Preferences | ((prev: Preferences) => Preferences)) => void;
  isLoaded: boolean;
}

const PreferencesContext = createContext<PreferencesContextValue | null>(null);

export function PreferencesProvider({ children }: { children: ReactNode }) {
  const [rawPreferences, setRawPreferences, isLoaded] = usePersistentState<Preferences>(
    'preferences.json',
    DEFAULT_PREFERENCES
  );

  // A preferences.json saved before a new field existed (e.g. travel mode
  // preferences, added after this file was already on disk) won't have that
  // key at all — merging with DEFAULT_PREFERENCES backfills it so consuming
  // code never sees `undefined`. Applied on write too (not just read) so a
  // save also fills in the gap on disk, self-healing the file going forward.
  const preferences: Preferences = { ...DEFAULT_PREFERENCES, ...rawPreferences };

  const setPreferences = (value: Preferences | ((prev: Preferences) => Preferences)) => {
    setRawPreferences((prevRaw) => {
      const prevMerged: Preferences = { ...DEFAULT_PREFERENCES, ...prevRaw };
      return typeof value === 'function' ? (value as (prev: Preferences) => Preferences)(prevMerged) : value;
    });
  };

  return (
    <PreferencesContext.Provider value={{ preferences, setPreferences, isLoaded }}>
      {children}
    </PreferencesContext.Provider>
  );
}

export function usePreferences() {
  const ctx = useContext(PreferencesContext);
  if (!ctx) {
    throw new Error('usePreferences must be called within a PreferencesProvider (wrap the app root in App.tsx).');
  }
  return ctx;
}
