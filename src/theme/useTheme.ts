import { useSettings } from '../context/SettingsContext';
import { color, radius, sizing, spacing, typography } from './tokens';

// Matches the original design spec's largeTextMode multiplier.
const LARGE_TEXT_SCALE = 1.2;

export function useTheme() {
  const { darkMode, highContrast, largeText } = useSettings();
  const scheme = darkMode ? 'dark' : 'light';
  const colors = highContrast ? { ...color[scheme], ...color.highContrastOverrides[scheme] } : color[scheme];
  const severity = color.severity[scheme];
  const textScale = largeText ? LARGE_TEXT_SCALE : 1;

  return {
    scheme,
    colors,
    severity,
    typography,
    spacing,
    radius,
    sizing,
    textScale,
  };
}

export type Theme = ReturnType<typeof useTheme>;
