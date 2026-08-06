import { StyleSheet, View, ViewProps } from 'react-native';
import { useTheme } from '../theme/useTheme';

interface RCardProps extends ViewProps {
  padded?: boolean;
}

export function RCard({ style, padded = true, children, ...rest }: RCardProps) {
  const { colors, radius, spacing } = useTheme();

  return (
    <View
      style={[
        styles.base,
        {
          backgroundColor: colors.surface,
          borderColor: colors.hairline,
          borderRadius: radius.card,
          padding: padded ? spacing.cardPadding : 0,
        },
        style,
      ]}
      {...rest}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    borderWidth: 1,
  },
});
