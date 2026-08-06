import { Text, TextProps } from 'react-native';
import { fontFamilyForWeight } from '../theme/fonts';
import { typography } from '../theme/tokens';

type ScaleKey = keyof typeof typography.scale;

interface RTextProps extends TextProps {
  variant: ScaleKey;
  color?: string;
}

export function RText({ variant, color, style, ...rest }: RTextProps) {
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
