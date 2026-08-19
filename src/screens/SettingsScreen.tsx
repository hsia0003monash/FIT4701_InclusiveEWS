import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { Linking, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { RButton } from '../components/RButton';
import { RCard } from '../components/RCard';
import { ROptionSelector } from '../components/ROptionSelector';
import { RText } from '../components/RText';
import { RToggleRow } from '../components/RToggleRow';
import { useTheme } from '../theme/useTheme';
import { DEFAULT_PREFERENCES, TextScale, ThemeMode, usePreferences } from '../theme/PreferencesContext';
import { INITIAL_FAMILY, FamilyMember } from '../data/family';
import { INITIAL_PLANS, INITIAL_SAFE_LOCATIONS, EvacuationPlan, SafeLocation } from '../data/plans';

interface SettingsScreenProps {
  onResetFamily: (family: FamilyMember[]) => void;
  onResetPlans: (plans: EvacuationPlan[]) => void;
  onResetSafeLocations: (locations: SafeLocation[]) => void;
  /** Switches to the Map tab and opens its own settings overlay directly —
   * marker/button size/position, simple map, and travel mode preferences all
   * live there now, not duplicated here, since they're only meaningful while
   * looking at the actual map. */
  onOpenMapSettings: () => void;
}

const THEME_MODE_OPTIONS: { value: ThemeMode; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { value: 'system', label: 'Match device setting', icon: 'phone-portrait-outline' },
  { value: 'light', label: 'Light', icon: 'sunny-outline' },
  { value: 'dark', label: 'Dark', icon: 'moon-outline' },
];

const TEXT_SCALE_OPTIONS: { value: TextScale; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { value: 'standard', label: 'Standard', icon: 'text-outline' },
  { value: 'large', label: 'Large', icon: 'text-outline' },
  { value: 'xlarge', label: 'Extra large', icon: 'text-outline' },
];

export function SettingsScreen({ onResetFamily, onResetPlans, onResetSafeLocations, onOpenMapSettings }: SettingsScreenProps) {
  const theme = useTheme();
  const { colors, spacing, radius, sizing } = theme;
  const { preferences, setPreferences } = usePreferences();

  const [confirmingResetData, setConfirmingResetData] = useState(false);
  const [confirmingResetSettings, setConfirmingResetSettings] = useState(false);

  const updatePreferences = (partial: Partial<typeof preferences>) => {
    setPreferences((prev) => ({ ...prev, ...partial }));
  };

  const handleResetData = () => {
    if (!confirmingResetData) {
      setConfirmingResetData(true);
      return;
    }
    onResetFamily(INITIAL_FAMILY);
    onResetPlans(INITIAL_PLANS);
    onResetSafeLocations(INITIAL_SAFE_LOCATIONS);
    setConfirmingResetData(false);
  };

  const handleResetSettings = () => {
    if (!confirmingResetSettings) {
      setConfirmingResetSettings(true);
      return;
    }
    setPreferences(DEFAULT_PREFERENCES);
    setConfirmingResetSettings(false);
  };

  return (
    <View style={[styles.screen, { backgroundColor: colors.bg }]}>
      <SafeAreaView edges={['top']} style={styles.flex}>
        <ScrollView contentContainerStyle={styles.content}>
          <View style={styles.headerRow}>
            <View style={styles.headerText}>
              <RText variant="eyebrowLabel" color={colors.ink3}>
                SETTINGS
              </RText>
              <View style={styles.headerIconRow}>
                <Ionicons name="settings-outline" size={16} color={colors.ink} />
                <RText variant="bodyEmphasis" color={colors.ink}>
                  App preferences
                </RText>
              </View>
            </View>
            <View
              style={[styles.avatar, { backgroundColor: colors.ink, borderColor: colors.hairline }]}
              accessibilityRole="button"
              accessibilityLabel="Your profile"
            >
              <RText variant="secondary" color={colors.bg}>
                SL
              </RText>
            </View>
          </View>

          <RCard style={{ gap: spacing.scale[4] }}>
            <RText variant="sectionHeading" color={colors.ink}>
              Appearance
            </RText>

            <View style={{ gap: spacing.scale[2] }}>
              <RText variant="caption" color={colors.ink3}>
                Theme
              </RText>
              <ROptionSelector
                options={THEME_MODE_OPTIONS}
                value={preferences.themeMode}
                onChange={(themeMode) => updatePreferences({ themeMode })}
                theme={theme}
              />
            </View>

            <RToggleRow
              label="High contrast"
              description="Stronger colour contrast throughout the app"
              value={preferences.highContrast}
              onChange={(highContrast) => updatePreferences({ highContrast })}
              theme={theme}
            />
          </RCard>

          <RCard style={{ gap: spacing.scale[4] }}>
            <RText variant="sectionHeading" color={colors.ink}>
              Text size
            </RText>
            <ROptionSelector
              options={TEXT_SCALE_OPTIONS}
              value={preferences.textScale}
              onChange={(textScale) => updatePreferences({ textScale })}
              theme={theme}
            />
            <View style={{ gap: spacing.scale[1] }}>
              <RText variant="caption" color={colors.ink3}>
                Preview
              </RText>
              <RText variant="sectionHeading" color={colors.ink}>
                Thunderstorm moving in from the west.
              </RText>
            </View>
          </RCard>

          <RCard style={{ gap: spacing.scale[4] }}>
            <RText variant="sectionHeading" color={colors.ink}>
              Map
            </RText>
            <RText variant="body" color={colors.ink2}>
              Marker and button appearance, simple map mode, and which travel modes to offer for directions all live
              on the Map screen itself, since they're easiest to judge while actually looking at the map.
            </RText>

            <RButton
              label="Customize map & travel settings"
              variant="secondary"
              size="m"
              icon="options-outline"
              iconPosition="leading"
              onPress={onOpenMapSettings}
              accessibilityHint="Opens the Map screen with marker size, button size, position, simple map, and travel mode controls"
            />
          </RCard>

          <RCard style={{ gap: spacing.scale[4] }}>
            <RText variant="sectionHeading" color={colors.ink}>
              Alerts & voice
            </RText>

            <RToggleRow
              label="Read alerts aloud automatically"
              description="Speaks the active alert on the Home screen as soon as it appears"
              value={preferences.autoReadAlerts}
              onChange={(autoReadAlerts) => updatePreferences({ autoReadAlerts })}
              theme={theme}
            />

            <RButton
              label="Open notification settings"
              variant="secondary"
              size="m"
              icon="notifications-outline"
              iconPosition="leading"
              onPress={() => Linking.openSettings()}
              accessibilityHint="Opens your device's system settings for this app's notifications"
            />
          </RCard>

          <RCard style={{ gap: spacing.scale[4] }}>
            <RText variant="sectionHeading" color={colors.ink}>
              Data
            </RText>

            <RButton
              label={confirmingResetData ? 'Tap again to confirm' : 'Reset family, plans & locations'}
              variant="danger"
              size="m"
              icon="refresh"
              iconPosition="leading"
              onPress={handleResetData}
              accessibilityHint="Restores family members, evacuation plans, and safe locations to their starting examples"
            />

            <RButton
              label={confirmingResetSettings ? 'Tap again to confirm' : 'Reset settings to default'}
              variant="secondary"
              size="m"
              icon="refresh-outline"
              iconPosition="leading"
              onPress={handleResetSettings}
            />
          </RCard>

          <RCard style={{ gap: spacing.scale[2] }}>
            <RText variant="sectionHeading" color={colors.ink}>
              About
            </RText>
            <RText variant="body" color={colors.ink2}>
              This app is a prototype emergency warning system, designed with attention to accessibility —
              including support for restricted vision, hearing loss, and low technology familiarity.
            </RText>
            <RText variant="caption" color={colors.ink3}>
              Version 1.0 · Prototype
            </RText>
          </RCard>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  flex: {
    flex: 1,
  },
  content: {
    padding: 20,
    gap: 20,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  headerText: {
    gap: 6,
  },
  headerIconRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
