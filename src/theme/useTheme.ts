import { useColorScheme } from 'react-native';
import { color, radius, sizing, spacing, typography as baseTypography } from './tokens';
import { usePreferences } from './PreferencesContext';
import type { TextScale } from './PreferencesContext';

const TEXT_SCALE_FACTORS: Record<TextScale, number> = {
  standard: 1,
  large: 1.15,
  xlarge: 1.3,
};

export function useTheme() {
  const systemScheme = useColorScheme() ?? 'light';
  const { preferences } = usePreferences();

  // A manually chosen Light/Dark overrides the OS setting; 'system' defers to it.
  const scheme = preferences.themeMode === 'system' ? systemScheme : preferences.themeMode;

  const baseColors = color[scheme];
  const colors = preferences.highContrast ? { ...baseColors, ...color.highContrastOverrides[scheme] } : baseColors;

  const severity = color.severity[scheme];

  const scaleFactor = TEXT_SCALE_FACTORS[preferences.textScale];
  const typography =
    scaleFactor === 1
      ? baseTypography
      : {
          ...baseTypography,
          scale: Object.fromEntries(
            Object.entries(baseTypography.scale).map(([key, value]) => [
              key,
              { ...value, fontSize: value.fontSize * scaleFactor, lineHeight: value.lineHeight * scaleFactor },
            ])
          ) as typeof baseTypography.scale,
        };

  return {
    scheme,
    colors,
    severity,
    typography,
    spacing,
    radius,
    sizing,
    preferences,
  };
}

export type Theme = ReturnType<typeof useTheme>;
