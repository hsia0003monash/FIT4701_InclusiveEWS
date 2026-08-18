import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useEffect, useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Speech from 'expo-speech';
import { RButton } from '../components/RButton';
import { RCard } from '../components/RCard';
import { RCenteredOverlay } from '../components/RCenteredOverlay';
import { RText } from '../components/RText';
import { SeverityBadge } from '../components/SeverityBadge';
import { useTheme } from '../theme/useTheme';
import { FAMILY_STATUS_META, FamilyMember } from '../data/family';
import { Hazard, HAZARD_STYLES, toRgba } from '../data/hazards';
import type { EvacuationPlan } from '../data/plans';
import { resolvePlanForHazardType } from '../data/plans';

interface HomeScreenProps {
  family: FamilyMember[];
  hazards: Hazard[];
  plans: EvacuationPlan[];
  onSeeAllFamily?: () => void;
  onViewPlanForHazard: (hazard: Hazard) => void;
}

export function HomeScreen({ family, hazards, plans, onSeeAllFamily, onViewPlanForHazard }: HomeScreenProps) {
  const { colors, severity, spacing, radius, sizing, preferences } = useTheme();
  const [detailOpen, setDetailOpen] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const autoReadHazardIdRef = useRef<string | null>(null);

  // The self entry is shown/managed on the Family screen, not summarised here.
  const others = family.filter((m) => !m.isSelf);
  const safeCount = others.filter((m) => m.status === 'safe').length;

  // The hazard flagged `featured` drives the Home screen's alert card — set
  // on at most one hazard in the app-level hazards list.
  const featuredHazard = hazards.find((h) => h.featured) ?? null;

  // Stop any in-progress speech if the screen unmounts (e.g. user switches tabs)
  useEffect(() => {
    return () => {
      Speech.stop();
    };
  }, []);

  const handleReadAloud = () => {
    if (isSpeaking) {
      Speech.stop();
      setIsSpeaking(false);
      return;
    }
    if (!featuredHazard) return;

    const utterance = [featuredHazard.headline ?? featuredHazard.description, featuredHazard.description]
      .filter((part, index, arr) => arr.indexOf(part) === index) // drop an exact duplicate if headline === description
      .join('. ');

    setIsSpeaking(true);
    Speech.speak(utterance, {
      onDone: () => setIsSpeaking(false),
      onStopped: () => setIsSpeaking(false),
      onError: () => setIsSpeaking(false),
    });
  };

  // Auto-read the alert aloud when the "Read alerts aloud automatically"
  // setting is on — fires once per distinct featured hazard (via the ref
  // guard), not on every re-render or tab revisit.
  useEffect(() => {
    if (!preferences.autoReadAlerts) return;
    if (!featuredHazard) return;
    if (autoReadHazardIdRef.current === featuredHazard.id) return;
    autoReadHazardIdRef.current = featuredHazard.id;
    handleReadAloud();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [preferences.autoReadAlerts, featuredHazard?.id]);

  const tone = featuredHazard?.severityTone ?? 'advice';
  const hazardStyle = featuredHazard ? HAZARD_STYLES[featuredHazard.type] : null;

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

          {featuredHazard ? (
            <RCard
              style={[styles.alertCard, { borderLeftColor: severity[tone].border, borderLeftWidth: 6 }]}
              accessibilityRole="alert"
              accessibilityLabel={`${tone} alert. ${featuredHazard.headline ?? featuredHazard.description}${
                featuredHazard.updated ? ` Updated ${featuredHazard.updated}.` : ''
              }`}
            >
              <View style={styles.alertHeaderRow}>
                <SeverityBadge tone={tone} label={tone.toUpperCase()} icon="information-circle" pill={false} />
                {featuredHazard.updated && (
                  <View style={styles.updatedRow}>
                    <Ionicons name="time-outline" size={14} color={colors.ink3} />
                    <RText variant="caption" color={colors.ink3}>
                      Updated {featuredHazard.updated}
                    </RText>
                  </View>
                )}
              </View>

              <RText variant="heroHeadline" color={colors.ink} style={styles.alertHeadline} accessibilityRole="header">
                {featuredHazard.headline ?? featuredHazard.description}
              </RText>

              <View style={styles.alertActions}>
                <RButton
                  label="Read details"
                  variant="primary"
                  size="m"
                  icon="chevron-forward"
                  onPress={() => setDetailOpen(true)}
                />
                <RButton
                  label={isSpeaking ? 'Stop reading' : 'Read aloud'}
                  variant="secondary"
                  size="m"
                  icon={isSpeaking ? 'stop-circle-outline' : 'volume-high-outline'}
                  iconPosition="leading"
                  onPress={handleReadAloud}
                  accessibilityHint={isSpeaking ? 'Stops reading this alert aloud' : 'Reads this alert aloud'}
                />
                {resolvePlanForHazardType(plans, featuredHazard.type) && (
                  <RButton
                    label="View plan"
                    variant="secondary"
                    size="m"
                    icon="document-text-outline"
                    iconPosition="leading"
                    onPress={() => onViewPlanForHazard(featuredHazard)}
                  />
                )}
              </View>
            </RCard>
          ) : (
            <RCard
              style={[styles.alertCard, { borderLeftColor: severity.safe.border, borderLeftWidth: 6 }]}
              accessibilityRole="alert"
              accessibilityLabel="All clear. No active alerts for your area."
            >
              <SeverityBadge tone="safe" label="ALL CLEAR" icon="checkmark-circle" pill={false} />
              <RText variant="heroHeadline" color={colors.ink} style={styles.alertHeadline} accessibilityRole="header">
                No active alerts for your area.
              </RText>
            </RCard>
          )}

          <View style={styles.sectionHeaderRow}>
            <RText variant="sectionHeading" color={colors.ink}>
              Family · {safeCount} safe
            </RText>
            <Pressable onPress={onSeeAllFamily} accessibilityRole="button" accessibilityLabel="See all family members">
              <RText variant="body" color={colors.ink2}>
                See all
              </RText>
            </Pressable>
          </View>

          <RCard padded={false}>
            {others.map((member, index) => {
              const meta = FAMILY_STATUS_META[member.status];
              return (
                <View
                  key={member.id}
                  style={[
                    styles.familyRow,
                    index < others.length - 1 && { borderBottomWidth: 1, borderBottomColor: colors.hairline },
                  ]}
                >
                  <View style={[styles.familyAvatar, { backgroundColor: colors.surface2 }]}>
                    <RText variant="bodyEmphasis" color={colors.ink2}>
                      {member.name.charAt(0)}
                    </RText>
                  </View>
                  <View style={styles.familyInfo}>
                    <RText variant="bodyEmphasis" color={colors.ink}>
                      {member.name}
                    </RText>
                    <RText variant="secondary" color={colors.ink3}>
                      {member.location}
                    </RText>
                  </View>
                  <View style={styles.familyStatus}>
                    <SeverityBadge tone={meta.tone} label={meta.label} icon={meta.icon} size="s" />
                    <RText variant="caption" color={colors.ink3}>
                      {member.updated}
                    </RText>
                  </View>
                </View>
              );
            })}
          </RCard>
        </ScrollView>

        {/* Hazard detail overlay */}
        {detailOpen && featuredHazard && hazardStyle && (
          <RCenteredOverlay title={featuredHazard.type} onDismiss={() => setDetailOpen(false)}>
            <View
              style={[
                styles.panelIcon,
                {
                  width: sizing.icon.hero,
                  height: sizing.icon.hero,
                  borderRadius: sizing.icon.hero / 2,
                  backgroundColor: toRgba(hazardStyle.theme, 1),
                },
              ]}
            >
              <MaterialCommunityIcons name={hazardStyle.icon} size={sizing.icon.small} color="white" />
            </View>

            <View
              style={[
                styles.statusBadge,
                {
                  borderRadius: radius.pill,
                  paddingHorizontal: spacing.scale[4],
                  paddingVertical: spacing.scale[1],
                  backgroundColor: severity[tone].bg,
                  borderColor: severity[tone].border,
                },
              ]}
            >
              <RText variant="caption" color={severity[tone].fg}>
                {tone.toUpperCase()}
              </RText>
            </View>

            <RText variant="body" color={colors.ink2}>
              {featuredHazard.description}
            </RText>

            <View style={{ gap: spacing.scale[1] }}>
              <RText variant="caption" color={colors.ink3}>
                Effect radius: {(featuredHazard.effectRadius / 1000).toFixed(1)} km
              </RText>
              {featuredHazard.updated && (
                <RText variant="caption" color={colors.ink3}>
                  Updated {featuredHazard.updated}
                </RText>
              )}
            </View>
          </RCenteredOverlay>
        )}
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
  panelIcon: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusBadge: {
    alignSelf: 'flex-start',
    borderWidth: 1,
  },
});
