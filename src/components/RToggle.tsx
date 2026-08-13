import { Switch } from 'react-native';
import { useTheme } from '../theme/useTheme';

interface RToggleProps {
  value: boolean;
  onValueChange: (value: boolean) => void;
  accessibilityLabel: string;
}

export function RToggle({ value, onValueChange, accessibilityLabel }: RToggleProps) {
  const { colors } = useTheme();

  return (
    <Switch
      value={value}
      onValueChange={onValueChange}
      accessibilityLabel={accessibilityLabel}
      trackColor={{ false: colors.surface2, true: colors.ink }}
      ios_backgroundColor={colors.surface2}
    />
  );
}
