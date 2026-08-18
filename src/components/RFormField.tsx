import { StyleSheet, TextInput, View } from 'react-native';
import { useTheme } from '../theme/useTheme';
import { RText } from './RText';

interface RFormFieldProps {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  multiline?: boolean;
}

export function RFormField({ label, value, onChangeText, placeholder, multiline }: RFormFieldProps) {
  const { colors, spacing, radius } = useTheme();

  return (
    <View style={{ gap: spacing.scale[1] }}>
      <RText variant="caption" color={colors.ink3}>
        {label}
      </RText>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.ink3}
        accessibilityLabel={label}
        multiline={multiline}
        style={[
          styles.textInput,
          multiline && styles.textInputMultiline,
          {
            borderRadius: radius.md,
            borderColor: colors.hairline,
            backgroundColor: colors.surface2,
            color: colors.ink,
            paddingHorizontal: spacing.scale[5],
          },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  textInput: {
    minHeight: 48,
    borderWidth: 1,
    fontSize: 16,
    paddingVertical: 12,
  },
  textInputMultiline: {
    minHeight: 120,
    textAlignVertical: 'top',
    paddingTop: 12,
  },
});
