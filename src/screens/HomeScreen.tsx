import { Ionicons } from '@expo/vector-icons';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { RButton } from '../components/RButton';
import { RCard } from '../components/RCard';
import { RTabBar, TabKey } from '../components/RTabBar';
import { RText } from '../components/RText';
import { SeverityBadge } from '../components/SeverityBadge';
import { FAMILY } from '../data/family';
import { useTheme } from '../theme/useTheme';

interface HomeScreenProps {
  onNavigate: (tab: TabKey) => void;
}

export function HomeScreen({ onNavigate }: HomeScreenProps) {
  const { colors, severity } = useTheme();
  const safeCount = FAMILY.filter((m) => m.status === 'safe').length;

  return (
    <View style={[styles.screen, { backgroundColor: colors.bg }]}>
      <SafeAreaView edges={['top']} style={styles.flex}>
        <ScrollView contentContainerStyle={styles.content}>
          <View style={styles.headerRow}>
            <View style={styles.headerText}>
              <RText variant="eyebrowLabel" color={colors.ink3}>
                MONITORING
              </RText>
              <View style={styles.locationRow}>
                <Ionicons name="location" size={16} color={colors.ink} />
                <RText variant="bodyEmphasis" color={colors.ink}>
                  Melbourne CBD · Home
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

          <RCard
            style={[styles.alertCard, { borderLeftColor: severity.advice.border, borderLeftWidth: 6 }]}
            accessibilityRole="alert"
            accessibilityLabel="Advice alert. Thunderstorm moving in from the west. Updated 2 minutes ago."
          >
            <View style={styles.alertHeaderRow}>
              <SeverityBadge tone="advice" label="ADVICE" icon="information-circle" pill={false} />
              <View style={styles.updatedRow}>
                <Ionicons name="time-outline" size={14} color={colors.ink3} />
                <RText variant="caption" color={colors.ink3}>
                  Updated 2 min ago
                </RText>
              </View>
            </View>

            <RText variant="heroHeadline" color={colors.ink} style={styles.alertHeadline} accessibilityRole="header">
              Thunderstorm moving in from the west.
            </RText>

            <View style={styles.alertActions}>
              <RButton label="Read details" variant="primary" size="m" icon="chevron-forward" />
              <RButton
                label="Read aloud"
                variant="secondary"
                size="m"
                icon="volume-high-outline"
                iconPosition="leading"
                accessibilityHint="Reads this alert aloud"
              />
            </View>
          </RCard>

          <View style={styles.sectionHeaderRow}>
            <RText variant="sectionHeading" color={colors.ink}>
              Family · {safeCount} safe
            </RText>
            <Pressable onPress={() => onNavigate('Family')} accessibilityRole="button" accessibilityLabel="See all family">
              <RText variant="body" color={colors.ink2}>
                See all
              </RText>
            </Pressable>
          </View>

          <RCard padded={false}>
            {FAMILY.map((member, index) => (
              <View
                key={member.id}
                style={[
                  styles.familyRow,
                  index < FAMILY.length - 1 && { borderBottomWidth: 1, borderBottomColor: colors.hairline },
                ]}
              >
                <View style={[styles.familyAvatar, { backgroundColor: colors.surface2 }]}>
                  <RText variant="bodyEmphasis" color={colors.ink2}>
                    {member.name.charAt(0)}
                  </RText>
                </View>
                <View style={styles.familyInfo}>
                  <RText variant="bodyEmphasis" color={colors.ink}>
                    {member.age ? `${member.name} (${member.age})` : member.name}
                  </RText>
                  <RText variant="secondary" color={colors.ink3}>
                    {member.location}
                  </RText>
                </View>
                <View style={styles.familyStatus}>
                  <SeverityBadge
                    tone={member.status === 'safe' ? 'safe' : 'watch'}
                    label={member.status === 'safe' ? 'Safe' : 'Check in'}
                    icon={member.status === 'safe' ? 'checkmark-circle' : 'warning'}
                    size="s"
                  />
                  <RText variant="caption" color={colors.ink3}>
                    {member.updated}
                  </RText>
                </View>
              </View>
            ))}
          </RCard>
        </ScrollView>
      </SafeAreaView>
      <RTabBar active="Home" onSelect={onNavigate} />
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
  locationRow: {
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
  alertCard: {
    gap: 16,
  },
  alertHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  updatedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  alertHeadline: {
    marginTop: -4,
  },
  alertActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  familyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 18,
    paddingVertical: 14,
    minHeight: 52,
  },
  familyAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  familyInfo: {
    flex: 1,
    gap: 2,
  },
  familyStatus: {
    alignItems: 'flex-end',
    gap: 4,
  },
});
