import { Ionicons } from '@expo/vector-icons';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { ACCESSIBILITY_PROFILES, AccessibilityProfile } from '../data/accessibility';
import { useTheme } from '../theme/useTheme';
import { RBottomSheet } from './RBottomSheet';
import { RButton } from './RButton';
import { RCard } from './RCard';
import { RText } from './RText';

interface AccessibilityProfileSheetProps {
  visible: boolean;
  onClose: () => void;
  /** Currently applied profile id, so we can highlight it. */
  activeProfileId: string | null;
  /** Apply the chosen profile's settings bundle. */
  onSelect: (profile: AccessibilityProfile) => void;
  /** Turn all accessibility settings off. */
  onClear: () => void;
}

/**
 * Lets the user pick a ready-made accessibility profile that matches their needs. Choosing
 * one applies a whole bundle of settings at once (text size, contrast, colour palette,
 * read-aloud, vibration) so they don't have to find and toggle each one individually.
 */
export function AccessibilityProfileSheet({
  visible,
  onClose,
  activeProfileId,
  onSelect,
  onClear,
}: AccessibilityProfileSheetProps) {
  const { colors } = useTheme();

  return (
    <RBottomSheet visible={visible} onClose={onClose} height="tall" accessibilityLabel="Close accessibility profiles">
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <View style={styles.headerRow}>
          <RText variant="title" color={colors.ink} accessibilityRole="header" style={styles.headerTitle}>
            Accessibility profile
          </RText>
          <Pressable
            onPress={onClose}
            accessibilityRole="button"
            accessibilityLabel="Close"
            style={[styles.closeButton, { backgroundColor: colors.surface, borderColor: colors.hairline }]}
          >
            <Ionicons name="close" size={18} color={colors.ink} />
          </Pressable>
        </View>

        <RText variant="body" color={colors.ink2}>
          Pick the option closest to your needs. We'll set up text size, contrast, colours,
          read-aloud, and vibration for you. You can still change any setting yourself.
        </RText>

        {ACCESSIBILITY_PROFILES.map((profile) => {
          const isActive = profile.id === activeProfileId;
          return (
            <Pressable
              key={profile.id}
              onPress={() => onSelect(profile)}
              accessibilityRole="button"
              accessibilityState={{ selected: isActive }}
              accessibilityLabel={`${profile.name} profile`}
              accessibilityHint={profile.description}
            >
              <RCard
                style={[
                  styles.profileCard,
                  isActive && { borderColor: colors.ink, borderWidth: 2 },
                ]}
              >
                <View style={[styles.profileIcon, { backgroundColor: colors.surface2 }]}>
                  <Ionicons name={profile.icon as keyof typeof Ionicons.glyphMap} size={22} color={colors.ink} />
                </View>
                <View style={styles.profileInfo}>
                  <RText variant="bodyEmphasis" color={colors.ink}>
                    {profile.name}
                  </RText>
                  <RText variant="secondary" color={colors.ink3}>
                    {profile.description}
                  </RText>
                </View>
                <Ionicons
                  name={isActive ? 'checkmark-circle' : 'ellipse-outline'}
                  size={24}
                  color={isActive ? colors.ink : colors.ink3}
                />
              </RCard>
            </Pressable>
          );
        })}

        <RButton
          label="Turn all off"
          variant="ghost"
          size="m"
          icon="refresh"
          iconPosition="leading"
          onPress={onClear}
          fullWidth
        />
      </ScrollView>
    </RBottomSheet>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: 20,
    gap: 14,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 12,
  },
  headerTitle: {
    flex: 1,
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  profileIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileInfo: {
    flex: 1,
    gap: 2,
  },
});
