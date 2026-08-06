import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, View } from 'react-native';
import { useTheme } from '../theme/useTheme';
import { SeverityTone } from '../theme/tokens';
import { RText } from './RText';

interface SeverityBadgeProps {
  tone: SeverityTone;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  /** Filled pill (family/status rows) vs. bare icon+label (alert card eyebrow). */
  pill?: boolean;
  size?: 's' | 'm';
}

export function SeverityBadge({ tone, label, icon, pill = true, size = 'm' }: SeverityBadgeProps) {
  const { severity, radius } = useTheme();
  const tones = severity[tone];
  const iconSize = size === 's' ? 14 : 16;

  if (!pill) {
    return (
      <View style={styles.labelRow}>
        <Ionicons name={icon} size={iconSize + 2} color={tones.fg} />
        <RText variant="eyebrowLabel" color={tones.fg}>
          {label}
        </RText>
      </View>
    );
  }

  return (
    <View
      style={[
        styles.pill,
        {
          backgroundColor: tones.bg,
          borderColor: tones.border,
          borderRadius: radius.pill,
          paddingHorizontal: 12,
          paddingVertical: 4,
        },
      ]}
    >
      <Ionicons name={icon} size={iconSize} color={tones.fg} />
      <RText variant="caption" color={tones.fg} style={styles.pillLabel}>
        {label}
      </RText>
    </View>
  );
}

const styles = StyleSheet.create({
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderWidth: 1,
    alignSelf: 'flex-start',
  },
  pillLabel: {
    fontWeight: '700',
  },
});
