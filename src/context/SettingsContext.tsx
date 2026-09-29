import { createContext, ReactNode, useCallback, useContext, useMemo, useState } from 'react';

/** The individual accessibility settings that a profile preset can switch on. */
export interface AccessibilitySettings {
  highContrast: boolean;
  largeText: boolean;
  colourBlindPalette: boolean;
  /** Make read-aloud/audio prominent and auto-read incoming alerts. */
  audioFirst: boolean;
  /** Stronger, longer vibration on alerts (for hard-of-hearing users). */
  strongHaptics: boolean;
}

interface SettingsContextValue extends AccessibilitySettings {
  darkMode: boolean;
  setDarkMode: (value: boolean) => void;
  setHighContrast: (value: boolean) => void;
  setLargeText: (value: boolean) => void;
  setColourBlindPalette: (value: boolean) => void;
  setAudioFirst: (value: boolean) => void;
  setStrongHaptics: (value: boolean) => void;
  /** Which accessibility preset is currently applied, if any. */
  activeProfileId: string | null;
  /** Apply a bundle of accessibility settings from a preset. */
  applyAccessibilityProfile: (id: string, settings: Partial<AccessibilitySettings>) => void;
  /** Clear the active preset and turn all accessibility settings off. */
  clearAccessibilityProfile: () => void;
  /** Whether the Map tab is showing its text-only alert list instead of the map. Lives here
   * (not local component state) so it survives the screen unmounting on tab switches. */
  mapTextOnly: boolean;
  setMapTextOnly: (value: boolean) => void;
}

const SettingsContext = createContext<SettingsContextValue | null>(null);

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [darkMode, setDarkMode] = useState(false);
  const [highContrast, setHighContrast] = useState(false);
  const [largeText, setLargeText] = useState(false);
  const [colourBlindPalette, setColourBlindPalette] = useState(false);
  const [audioFirst, setAudioFirst] = useState(false);
  const [strongHaptics, setStrongHaptics] = useState(false);
  const [activeProfileId, setActiveProfileId] = useState<string | null>(null);
  const [mapTextOnly, setMapTextOnly] = useState(false);

  // Changing a setting by hand means it no longer matches a named profile.
  const clearProfileOnManualChange = useCallback(
    <T,>(setter: (value: T) => void) =>
      (value: T) => {
        setActiveProfileId(null);
        setter(value);
      },
    [],
  );

  const applyAccessibilityProfile = useCallback(
    (id: string, settings: Partial<AccessibilitySettings>) => {
      // Presets set the full accessibility picture: anything not in the bundle is turned off.
      setHighContrast(settings.highContrast ?? false);
      setLargeText(settings.largeText ?? false);
      setColourBlindPalette(settings.colourBlindPalette ?? false);
      setAudioFirst(settings.audioFirst ?? false);
      setStrongHaptics(settings.strongHaptics ?? false);
      setActiveProfileId(id);
    },
    [],
  );

  const clearAccessibilityProfile = useCallback(() => {
    setHighContrast(false);
    setLargeText(false);
    setColourBlindPalette(false);
    setAudioFirst(false);
    setStrongHaptics(false);
    setActiveProfileId(null);
  }, []);

  const value = useMemo(
    () => ({
      darkMode,
      setDarkMode,
      highContrast,
      setHighContrast: clearProfileOnManualChange(setHighContrast),
      largeText,
      setLargeText: clearProfileOnManualChange(setLargeText),
      colourBlindPalette,
      setColourBlindPalette: clearProfileOnManualChange(setColourBlindPalette),
      audioFirst,
      setAudioFirst: clearProfileOnManualChange(setAudioFirst),
      strongHaptics,
      setStrongHaptics: clearProfileOnManualChange(setStrongHaptics),
      activeProfileId,
      applyAccessibilityProfile,
      clearAccessibilityProfile,
      mapTextOnly,
      setMapTextOnly,
    }),
    [
      darkMode,
      highContrast,
      largeText,
      colourBlindPalette,
      audioFirst,
      strongHaptics,
      activeProfileId,
      mapTextOnly,
      clearProfileOnManualChange,
      applyAccessibilityProfile,
      clearAccessibilityProfile,
    ],
  );

  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
}

export function useSettings() {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
}
