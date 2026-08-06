import { useColorScheme } from 'react-native';
import { color, radius, sizing, spacing, typography } from './tokens';

export function useTheme() {
  const scheme = useColorScheme() ?? 'light';
  const colors = color[scheme];
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
