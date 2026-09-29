import { useSettings } from '../context/SettingsContext';
import { color, radius, sizing, spacing, typography } from './tokens';

// Matches the original design spec's largeTextMode multiplier.
const LARGE_TEXT_SCALE = 1.2;

// Colour-blind-safe severity palette (blue/amber/teal instead of red/green), so severity
// is distinguishable without relying on red-vs-green. Severity icons are already
// shape-coded (circle/triangle/square), which reinforces this. Applied over either scheme.
const colourBlindSeverity = {
  light: {
    advice: { fg: '#1D4E89', bg: '#E1ECF7', border: '#A9C6E8' },
    watch: { fg: '#8A5A00', bg: '#FBEFD6', border: '#E7C888' },
    emergency: { fg: '#8A3B00', bg: '#FBE2D0', border: '#EBA57A' },
    safe: { fg: '#0B6E6E', bg: '#D8EFEF', border: '#8FCFCF' },
  },
  dark: {
    advice: { fg: '#9CC3F0', bg: '#16273D', border: '#33507A' },
    watch: { fg: '#F3C77A', bg: '#3A2B0E', border: '#6B4E1C' },
    emergency: { fg: '#F0A46E', bg: '#3A2110', border: '#6E3F1E' },
    safe: { fg: '#7FD3D3', bg: '#0F2E2E', border: '#2C5757' },
  },
};

export function useTheme() {
  const { darkMode, highContrast, largeText, colourBlindPalette } = useSettings();
  const scheme = darkMode ? 'dark' : 'light';
  const colors = highContrast ? { ...color[scheme], ...color.highContrastOverrides[scheme] } : color[scheme];
  const severity = colourBlindPalette ? colourBlindSeverity[scheme] : color.severity[scheme];
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
