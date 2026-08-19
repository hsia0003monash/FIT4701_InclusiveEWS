import { StyleSheet, Switch, View } from 'react-native';
import type { Theme } from '../theme/useTheme';
import { RText } from './RText';

interface RToggleRowProps {
  label: string;
  description?: string;
  value: boolean;
  onChange: (value: boolean) => void;
  theme: Theme;
}

export function RToggleRow({ label, description, value, onChange, theme }: RToggleRowProps) {
  const { colors, spacing } = theme;

  return (
    <View style={[styles.toggleRow, { gap: spacing.scale[3] }]}>
      <View style={{ flex: 1, gap: spacing.scale[1] }}>
        <RText variant="bodyEmphasis" color={colors.ink}>
          {label}
        </RText>
        {description && (
          <RText variant="caption" color={colors.ink3}>
            {description}
          </RText>
        )}
      </View>
      <Switch
        value={value}
        onValueChange={onChange}
        trackColor={{ false: colors.hairline, true: colors.accent }}
        thumbColor={colors.surface}
        accessibilityLabel={label}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
});
