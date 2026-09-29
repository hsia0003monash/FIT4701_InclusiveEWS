import { Ionicons } from '@expo/vector-icons';
import { ReactNode, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AccessibilityProfileSheet } from '../components/AccessibilityProfileSheet';
import { RCard } from '../components/RCard';
import { RTabBar, TabKey } from '../components/RTabBar';
import { RText } from '../components/RText';
import { RToggle } from '../components/RToggle';
import { ACCESSIBILITY_PROFILES } from '../data/accessibility';
import { useSettings } from '../context/SettingsContext';
import { useTheme } from '../theme/useTheme';

interface SettingsScreenProps {
  onNavigate: (tab: TabKey) => void;
}

interface ToggleRowProps {
  icon: ReactNode;
  title: string;
  description: string;
  value: boolean;
  onValueChange: (value: boolean) => void;
  isLast?: boolean;
}

function ToggleRow({ icon, title, description, value, onValueChange, isLast }: ToggleRowProps) {
  const { colors } = useTheme();

  return (
    <View style={[styles.row, !isLast && { borderBottomWidth: 1, borderBottomColor: colors.hairline }]}>
      <View style={[styles.iconBox, { backgroundColor: colors.surface2 }]}>{icon}</View>
      <View style={styles.rowText}>
        <RText variant="bodyEmphasis" color={colors.ink}>
          {title}
        </RText>
        <RText variant="secondary" color={colors.ink3}>
          {description}
        </RText>
      </View>
      <RToggle value={value} onValueChange={onValueChange} accessibilityLabel={title} />
    </View>
  );
}

export function SettingsScreen({ onNavigate }: SettingsScreenProps) {
  const { colors } = useTheme();
  const {
    darkMode,
    setDarkMode,
    highContrast,
    setHighContrast,
    largeText,
    setLargeText,
    colourBlindPalette,
    setColourBlindPalette,
    audioFirst,
    setAudioFirst,
    strongHaptics,
    setStrongHaptics,
    activeProfileId,
    applyAccessibilityProfile,
    clearAccessibilityProfile,
  } = useSettings();

  const [profileSheetOpen, setProfileSheetOpen] = useState(false);
  const activeProfile = ACCESSIBILITY_PROFILES.find((p) => p.id === activeProfileId) ?? null;

  return (
    <View style={[styles.screen, { backgroundColor: colors.bg }]}>
      <SafeAreaView edges={['top']} style={styles.flex}>
        <ScrollView contentContainerStyle={styles.content}>
          <RText variant="eyebrowLabel" color={colors.ink3}>
            SETTINGS
          </RText>

          <View style={styles.titleBlock}>
            <RText variant="largeTitle" color={colors.ink} accessibilityRole="header">
              Make it yours
            </RText>
            <RText variant="body" color={colors.ink2}>
              Adjust how alerts look, sound, and feel. Changes apply instantly.
            </RText>
          </View>

          {/* Accessibility profile: one tap applies a whole bundle of settings. */}
          <RText variant="eyebrowLabel" color={colors.ink3}>
            ACCESSIBILITY PROFILE
          </RText>

          <Pressable
            onPress={() => setProfileSheetOpen(true)}
            accessibilityRole="button"
            accessibilityLabel="Choose an accessibility profile"
            accessibilityHint="Applies a set of accessibility settings that match your needs"
          >
            <RCard style={styles.profileRow}>
              <View style={[styles.iconBox, { backgroundColor: colors.surface2 }]}>
                <Ionicons name={(activeProfile?.icon ?? 'accessibility-outline') as keyof typeof Ionicons.glyphMap} size={20} color={colors.ink} />
              </View>
              <View style={styles.rowText}>
                <RText variant="bodyEmphasis" color={colors.ink}>
                  {activeProfile ? activeProfile.name : 'Set up your profile'}
                </RText>
                <RText variant="secondary" color={colors.ink3}>
                  {activeProfile ? activeProfile.description : 'Pick the option closest to your needs'}
                </RText>
              </View>
              <Ionicons name="chevron-forward" size={20} color={colors.ink3} />
            </RCard>
          </Pressable>

          <RText variant="eyebrowLabel" color={colors.ink3}>
            VISUAL
          </RText>

          <RCard padded={false}>
            <ToggleRow
              icon={<Ionicons name="eye-outline" size={20} color={colors.ink} />}
              title="Dark mode"
              description="Easier on the eyes at night"
              value={darkMode}
              onValueChange={setDarkMode}
            />
            <ToggleRow
              icon={<Ionicons name="contrast-outline" size={20} color={colors.ink} />}
              title="High contrast"
              description="Maximum text-to-background contrast (WCAG AAA)"
              value={highContrast}
              onValueChange={setHighContrast}
            />
            <ToggleRow
              icon={
                <RText variant="bodyEmphasis" color={colors.ink}>
                  Aa
                </RText>
              }
              title="Large text"
              description="Increases body text for easier reading"
              value={largeText}
              onValueChange={setLargeText}
            />
            <ToggleRow
              icon={
                <View style={styles.swatchPair}>
                  <View style={[styles.swatch, { backgroundColor: '#1D4E89' }]} />
                  <View style={[styles.swatch, { backgroundColor: '#8A5A00' }]} />
                </View>
              }
              title="Colour-blind palette"
              description="Uses blue/amber instead of red/green; icons are shape-coded"
              value={colourBlindPalette}
              onValueChange={setColourBlindPalette}
              isLast
            />
          </RCard>

          <RText variant="eyebrowLabel" color={colors.ink3}>
            SOUND & FEEDBACK
          </RText>

          <RCard padded={false}>
            <ToggleRow
              icon={<Ionicons name="volume-high-outline" size={20} color={colors.ink} />}
              title="Audio first"
              description="Read alerts aloud automatically and make Read aloud prominent"
              value={audioFirst}
              onValueChange={setAudioFirst}
            />
            <ToggleRow
              icon={<Ionicons name="phone-portrait-outline" size={20} color={colors.ink} />}
              title="Strong vibration"
              description="Longer, stronger buzz when an alert arrives"
              value={strongHaptics}
              onValueChange={setStrongHaptics}
              isLast
            />
          </RCard>
        </ScrollView>
      </SafeAreaView>
      <RTabBar active="Settings" onSelect={onNavigate} />

      <AccessibilityProfileSheet
        visible={profileSheetOpen}
        onClose={() => setProfileSheetOpen(false)}
        activeProfileId={activeProfileId}
        onSelect={(profile) => {
          applyAccessibilityProfile(profile.id, profile.settings);
          setProfileSheetOpen(false);
        }}
        onClear={() => {
          clearAccessibilityProfile();
          setProfileSheetOpen(false);
        }}
      />
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
  titleBlock: {
    gap: 6,
  },
  profileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 18,
    paddingVertical: 16,
  },
  iconBox: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowText: {
    flex: 1,
    gap: 2,
  },
  swatchPair: {
    flexDirection: 'row',
    gap: 3,
  },
  swatch: {
    width: 8,
    height: 20,
    borderRadius: 3,
  },
});
