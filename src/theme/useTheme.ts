import { useSettings } from '../context/SettingsContext';
import { color, radius, sizing, spacing, typography } from './tokens';

export function useTheme() {
  const { darkMode, highContrast } = useSettings();
  const scheme = darkMode ? 'dark' : 'light';
  const colors = highContrast ? { ...color[scheme], ...color.highContrastOverrides[scheme] } : color[scheme];
  const severity = color.severity[scheme];

  return {
    scheme,
    colors,
    severity,
    typography,
    spacing,
    radius,
    sizing,
  };
}

export type Theme = ReturnType<typeof useTheme>;
