import { Ionicons } from '@expo/vector-icons';
import * as Speech from 'expo-speech';
import { Fragment, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSettings } from '../context/SettingsContext';
import { MapAlert } from '../data/alerts';
import { severityLevels } from '../theme/tokens';
import { useTheme } from '../theme/useTheme';
import { RBottomSheet } from './RBottomSheet';
import { RButton } from './RButton';
import { RText } from './RText';
import { SeverityBadge } from './SeverityBadge';
import { ShareSheet } from './ShareSheet';

interface AlertDetailModalProps {
  alert: MapAlert | null;
  onClose: () => void;
}

export function AlertDetailModal({ alert, onClose }: AlertDetailModalProps) {
  const { colors } = useTheme();
  const { audioFirst } = useSettings();
  const [shareOpen, setShareOpen] = useState(false);

  const handleReadAloud = () => {
    if (!alert) return;
    Speech.stop();
    const steps = alert.instructions.map((s, i) => `${i + 1}. ${s}.`).join(' ');
    const spoken = `${severityLevels[alert.tone].label} alert. ${alert.title}. ${alert.detail} What to do: ${steps}`;
    Speech.speak(spoken, { rate: 0.9, pitch: 1.0 });
  };

  const handleClose = () => {
    Speech.stop();
    onClose();
  };

  return (
    <Fragment>
      {/* Hidden while the share sheet is open - two simultaneously-visible native Modals is unreliable in RN
          (touches can route to the wrong layer), so only one of the two is ever visible at once. */}
      <RBottomSheet visible={!!alert && !shareOpen} onClose={handleClose} accessibilityLabel="Close alert details">
        {alert && (
          <ScrollView contentContainerStyle={styles.content}>
            <View style={styles.headerRow}>
              <SeverityBadge
                tone={alert.tone}
                label={severityLevels[alert.tone].label}
                icon={severityLevels[alert.tone].icon}
                pill={false}
              />
              <Pressable
                onPress={handleClose}
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

            <View style={styles.actionsRow}>
              <RButton
                label="Read aloud"
                variant={audioFirst ? 'primary' : 'secondary'}
                size="m"
                icon="volume-high-outline"
                iconPosition="leading"
                onPress={handleReadAloud}
                style={styles.actionButton}
              />
              <RButton
                label="Share"
                variant="secondary"
                size="m"
                icon="share-outline"
                iconPosition="leading"
                onPress={() => setShareOpen(true)}
                style={styles.actionButton}
              />
            </View>
          </ScrollView>
        )}
      </RBottomSheet>

      {/* Closing the share sheet closes the alert too, rather than revealing it again behind the
          share sheet - the user asked to share from the alert, not to come back to it. */}
      <ShareSheet
        alert={shareOpen ? alert : null}
        onClose={() => {
          setShareOpen(false);
          handleClose();
        }}
      />
    </Fragment>
  );
}

const styles = StyleSheet.create({
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
  actionsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    flex: 1,
  },
});
