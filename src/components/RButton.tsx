import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import { useTheme } from '../theme/useTheme';
import { RText } from './RText';

type Variant = 'primary' | 'secondary' | 'danger' | 'watch' | 'ghost';
type Size = 'l' | 'm' | 's';

interface RButtonProps {
  label: string;
  onPress?: () => void;
  variant?: Variant;
  size?: Size;
  icon?: keyof typeof Ionicons.glyphMap;
  iconPosition?: 'leading' | 'trailing';
  accessibilityHint?: string;
  fullWidth?: boolean;
  style?: StyleProp<ViewStyle>;
}

export function RButton({
  label,
  onPress,
  variant = 'primary',
  size = 'm',
  icon,
  iconPosition = 'trailing',
  accessibilityHint,
  fullWidth = false,
  style,
}: RButtonProps) {
  const { colors, severity, sizing } = useTheme();
  const dims = sizing.button[size];

  const variantStyle = {
    primary: { backgroundColor: colors.ink, borderColor: colors.ink, textColor: colors.bg },
    secondary: { backgroundColor: colors.surface, borderColor: colors.hairline, textColor: colors.ink },
    ghost: { backgroundColor: 'transparent', borderColor: 'transparent', textColor: colors.ink },
    danger: { backgroundColor: severity.emergency.fg, borderColor: severity.emergency.fg, textColor: colors.bg },
    watch: { backgroundColor: severity.watch.fg, borderColor: severity.watch.fg, textColor: colors.bg },
  }[variant];

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityHint={accessibilityHint}
      style={({ pressed }) => [
        styles.base,
        {
          height: dims.height,
          borderRadius: dims.radius,
          backgroundColor: variantStyle.backgroundColor,
          borderColor: variantStyle.borderColor,
          opacity: pressed ? 0.8 : 1,
          alignSelf: fullWidth ? 'stretch' : 'auto',
        },
        style,
      ]}
    >
      {icon && iconPosition === 'leading' && (
        <Ionicons name={icon} size={dims.fontSize} color={variantStyle.textColor} />
      )}
      <RText
        variant={size === 'l' ? 'bodyEmphasis' : 'body'}
        color={variantStyle.textColor}
        style={{ fontSize: dims.fontSize }}
      >
        {label}
      </RText>
      {icon && iconPosition === 'trailing' && (
        <View style={styles.trailingIcon}>
          <Ionicons name={icon} size={dims.fontSize} color={variantStyle.textColor} />
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderWidth: 1,
    paddingHorizontal: 20,
  },
  trailingIcon: {
    marginLeft: 2,
  },
});
