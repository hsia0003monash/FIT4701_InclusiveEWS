import { Text, TextProps } from 'react-native';
import { fontFamilyForWeight } from '../theme/fonts';
import { typography as baseTypography } from '../theme/tokens';
import { useTheme } from '../theme/useTheme';

// Kept as a static import purely for the ScaleKey type — the same key set
// exists whether or not text scaling is applied, since useTheme() rebuilds
// typography.scale with identical keys, just scaled fontSize/lineHeight.
type ScaleKey = keyof typeof baseTypography.scale;

interface RTextProps extends TextProps {
  variant: ScaleKey;
  color?: string;
}

export function RText({ variant, color, style, ...rest }: RTextProps) {
  // Pulling typography from useTheme() (rather than the static tokens
  // import) is what makes the Settings screen's text-size preference
  // actually take effect — useTheme() returns a scaled copy when the user
  // has chosen Large/Extra large, identical to the base tokens otherwise.
  const { typography } = useTheme();
  const scale = typography.scale[variant];

  return (
    <Text
      style={[
        {
          fontFamily: fontFamilyForWeight(scale.fontWeight),
          fontSize: scale.fontSize,
          letterSpacing: scale.letterSpacing,
          lineHeight: scale.lineHeight,
          textTransform: 'textTransform' in scale ? scale.textTransform : undefined,
          color,
        },
        style,
      ]}
      {...rest}
    />
  );
}
