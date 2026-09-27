import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { MAP_ALERTS, MapAlert } from '../data/alerts';
import { severityLevels } from '../theme/tokens';
import { useTheme } from '../theme/useTheme';
import { RBottomSheet } from './RBottomSheet';
import { RText } from './RText';
import { SeverityBadge } from './SeverityBadge';

interface SimulateThreatButtonProps {
  /** Fire the chosen threat as an incoming push alert. */
  onTrigger: (alert: MapAlert) => void;
}

/**
 * Facilitator-only control for user-testing sessions.
 *
 * A small floating button that opens a picker of the available threats. Tapping one
 * fires it as a full-screen incoming alert, letting the facilitator mock "a threat just
 * happened" on demand (Option B — manual trigger, no surprises).
 */
export function SimulateThreatButton({ onTrigger }: SimulateThreatButtonProps) {
  const { colors, severity } = useTheme();
  const [pickerOpen, setPickerOpen] = useState(false);

  const handlePick = (alert: MapAlert) => {
    setPickerOpen(false);
    onTrigger(alert);
  };

  return (
    <>
      <Pressable
        onPress={() => setPickerOpen(true)}
        accessibilityRole="button"
        accessibilityLabel="Simulate a threat (facilitator)"
        style={[styles.fab, { backgroundColor: severity.emergency.fg, borderColor: colors.bg }]}
      >
        <Ionicons name="flash" size={22} color={colors.bg} />
      </Pressable>

      <RBottomSheet visible={pickerOpen} onClose={() => setPickerOpen(false)}>
        <View style={styles.sheetContent}>
          <RText variant="title" color={colors.ink} style={styles.sheetTitle} accessibilityRole="header">
            Simulate a threat
          </RText>
          <RText variant="secondary" color={colors.ink3} style={styles.sheetSub}>
            Facilitator control · pick a threat to push to the user
          </RText>

          {MAP_ALERTS.map((alert) => {
            const tone = severity[alert.tone];
            const level = severityLevels[alert.tone];
            return (
              <Pressable
                key={alert.id}
                onPress={() => handlePick(alert)}
                accessibilityRole="button"
                accessibilityLabel={`Simulate ${alert.title}`}
                style={[styles.row, { borderColor: colors.hairline }]}
              >
                <View style={[styles.rowIcon, { backgroundColor: tone.bg }]}>
                  <Ionicons name={alert.icon} size={24} color={tone.fg} />
                </View>
                <View style={styles.rowText}>
                  <SeverityBadge tone={alert.tone} label={level.label} icon={level.icon} pill={false} size="s" />
                  <RText variant="bodyEmphasis" color={colors.ink}>
                    {alert.title}
                  </RText>
                </View>
                <Ionicons name="chevron-forward" size={20} color={colors.ink3} />
              </Pressable>
            );
          })}
        </View>
      </RBottomSheet>
    </>
  );
}

const styles = StyleSheet.create({
  fab: {
    position: 'absolute',
    right: 16,
    bottom: 96,
    width: 52,
    height: 52,
    borderRadius: 26,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 6,
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    zIndex: 50,
  },
  sheetContent: {
    padding: 20,
    gap: 12,
  },
  sheetTitle: {
    marginTop: 4,
  },
  sheetSub: {
    marginTop: -6,
    marginBottom: 6,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    padding: 14,
    borderWidth: 1,
    borderRadius: 14,
  },
  rowIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowText: {
    flex: 1,
    gap: 6,
  },
});
