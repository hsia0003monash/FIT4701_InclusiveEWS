import { createContext, ReactNode, useContext, useMemo, useState } from 'react';

interface SettingsContextValue {
  darkMode: boolean;
  setDarkMode: (value: boolean) => void;
}

const SettingsContext = createContext<SettingsContextValue | null>(null);

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [darkMode, setDarkMode] = useState(false);

  const value = useMemo(() => ({ darkMode, setDarkMode }), [darkMode]);

  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
}

export function useSettings() {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
}
