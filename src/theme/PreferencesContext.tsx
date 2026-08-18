import { createContext, useContext, ReactNode } from 'react';
import { usePersistentState } from '../data/persistence';

export type ThemeMode = 'system' | 'light' | 'dark';
export type TextScale = 'standard' | 'large' | 'xlarge';

export interface Preferences {
  themeMode: ThemeMode;
  highContrast: boolean;
  textScale: TextScale;
  autoReadAlerts: boolean;
}

export const DEFAULT_PREFERENCES: Preferences = {
  themeMode: 'system',
  highContrast: false,
  textScale: 'standard',
  autoReadAlerts: false,
};

interface PreferencesContextValue {
  preferences: Preferences;
  setPreferences: (value: Preferences | ((prev: Preferences) => Preferences)) => void;
  isLoaded: boolean;
}

const PreferencesContext = createContext<PreferencesContextValue | null>(null);

export function PreferencesProvider({ children }: { children: ReactNode }) {
  const [preferences, setPreferences, isLoaded] = usePersistentState<Preferences>(
    'preferences.json',
    DEFAULT_PREFERENCES
  );

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
