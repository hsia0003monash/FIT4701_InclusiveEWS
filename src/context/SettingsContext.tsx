import { createContext, ReactNode, useContext, useMemo, useState } from 'react';

interface SettingsContextValue {
  darkMode: boolean;
  setDarkMode: (value: boolean) => void;
  highContrast: boolean;
  setHighContrast: (value: boolean) => void;
  largeText: boolean;
  setLargeText: (value: boolean) => void;
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
  const [mapTextOnly, setMapTextOnly] = useState(false);

  const value = useMemo(
    () => ({
      darkMode,
      setDarkMode,
      highContrast,
      setHighContrast,
      largeText,
      setLargeText,
      mapTextOnly,
      setMapTextOnly,
    }),
    [darkMode, highContrast, largeText, mapTextOnly],
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
