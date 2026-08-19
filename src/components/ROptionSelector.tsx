import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, View } from 'react-native';
import type { Theme } from '../theme/useTheme';
import { RText } from './RText';

interface ROptionSelectorProps<T extends string> {
  options: { value: T; label: string; icon: keyof typeof Ionicons.glyphMap }[];
  value: T;
  onChange: (value: T) => void;
  theme: Theme;
}

export function ROptionSelector<T extends string>({ options, value, onChange, theme }: ROptionSelectorProps<T>) {
  const { colors, spacing, radius, sizing } = theme;

  return (
    <View style={{ gap: spacing.scale[3] }}>
      {options.map((option) => {
        const selected = option.value === value;
        return (
          <Pressable
            key={option.value}
            onPress={() => onChange(option.value)}
            accessibilityRole="button"
            accessibilityState={{ selected }}
            style={[
              styles.optionRow,
              {
                minHeight: sizing.touchTarget.preferredPrimary,
                borderRadius: radius.lg,
                paddingHorizontal: spacing.cardPadding,
                gap: spacing.scale[3],
                backgroundColor: selected ? colors.surface2 : colors.surface,
                borderColor: selected ? colors.ink : colors.hairline,
              },
            ]}
          >
            <Ionicons name={option.icon} size={sizing.icon.medium} color={selected ? colors.ink : colors.ink3} />
            <RText variant="bodyEmphasis" color={selected ? colors.ink : colors.ink2} style={{ flex: 1 }}>
              {option.label}
            </RText>
            {selected && <Ionicons name="checkmark" size={sizing.icon.medium} color={colors.ink} />}
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
  },
});
