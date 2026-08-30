import { Ionicons } from '@expo/vector-icons';
import { Modal, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MapAlert } from '../data/alerts';
import { severityLevels } from '../theme/tokens';
import { useTheme } from '../theme/useTheme';
import { RButton } from './RButton';
import { RText } from './RText';
import { SeverityBadge } from './SeverityBadge';

interface AlertDetailModalProps {
  alert: MapAlert | null;
  onClose: () => void;
}

export function AlertDetailModal({ alert, onClose }: AlertDetailModalProps) {
  const { colors, radius } = useTheme();

  return (
    <Modal visible={!!alert} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <Pressable
          style={StyleSheet.absoluteFill}
          onPress={onClose}
          accessibilityRole="button"
          accessibilityLabel="Close alert details"
        />
        {alert && (
          <SafeAreaView
            edges={['bottom']}
            style={[
              styles.sheet,
              { backgroundColor: colors.bg, borderTopLeftRadius: radius.sheet, borderTopRightRadius: radius.sheet },
            ]}
          >
            <View style={[styles.grabber, { backgroundColor: colors.hairline }]} />

            <ScrollView contentContainerStyle={styles.content}>
              <View style={styles.headerRow}>
                <SeverityBadge
                  tone={alert.tone}
                  label={severityLevels[alert.tone].label}
                  icon={severityLevels[alert.tone].icon}
                  pill={false}
                />
                <Pressable
                  onPress={onClose}
                  accessibilityRole="button"
                  accessibilityLabel="Close"
                  style={[styles.closeButton, { backgroundColor: colors.surface, borderColor: colors.hairline }]}
                >
                  <Ionicons name="close" size={18} color={colors.ink} />
                </Pressable>
              </View>

              <RText variant="title" color={colors.ink} accessibilityRole="header">
                {alert.title}
              </RText>

              <RText variant="body" color={colors.ink2}>
                {alert.detail}
              </RText>

              <View style={styles.metaRow}>
                <Ionicons name="location-outline" size={14} color={colors.ink3} />
                <RText variant="caption" color={colors.ink3}>
                  {alert.distanceKm} km away · Updated {alert.updatedMinAgo} min ago
                </RText>
              </View>

              <View style={styles.section}>
                <RText variant="sectionHeading" color={colors.ink}>
                  What to do
                </RText>
                {alert.instructions.map((instruction, index) => (
                  <View key={instruction} style={styles.instructionRow}>
                    <View style={[styles.instructionNumber, { backgroundColor: colors.surface2 }]}>
                      <RText variant="caption" color={colors.ink}>
                        {index + 1}
                      </RText>
                    </View>
                    <RText variant="body" color={colors.ink} style={styles.instructionText}>
                      {instruction}
                    </RText>
                  </View>
                ))}
              </View>

              <RButton label="Read aloud" variant="secondary" size="m" icon="volume-high-outline" iconPosition="leading" />
            </ScrollView>
          </SafeAreaView>
        )}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  sheet: {
    maxHeight: '80%',
    overflow: 'hidden',
  },
  grabber: {
    width: 36,
    height: 4,
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: 10,
  },
  content: {
    padding: 20,
    gap: 16,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: -8,
  },
  section: {
    gap: 10,
  },
  instructionRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  instructionNumber: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  instructionText: {
    flex: 1,
  },
});
