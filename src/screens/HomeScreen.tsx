import { Ionicons } from '@expo/vector-icons';
import * as Speech from 'expo-speech';
import { useState } from 'react';
import { Alert, Linking, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { RButton } from '../components/RButton';
import { RCard } from '../components/RCard';
import { RText } from '../components/RText';
import { SeverityBadge } from '../components/SeverityBadge';
import { useAlerts, severityToTone } from '../context/AlertsContext';
import { useLanguage } from '../context/LanguageContext';
import { useTheme } from '../theme/useTheme';

type FamilyStatus = 'safe' | 'checkIn';

interface FamilyMember {
  id: string;
  name: string;
  location: string;
  status: FamilyStatus;
  updated: string;
}

const INITIAL_FAMILY: FamilyMember[] = [
  { id: 'mum', name: 'Mum', location: 'Apt 12B · Same building', status: 'safe', updated: '12 min ago' },
  { id: 'dad', name: 'Dad', location: 'Apt 12B · Same building', status: 'safe', updated: '12 min ago' },
  { id: 'kai', name: 'Kai (8)', location: 'School · Kew', status: 'checkIn', updated: 'Not replied' },
  { id: 'husband', name: 'Husband', location: 'Work · Southbank', status: 'safe', updated: '1h ago' },
];

export function HomeScreen() {
  const { colors, severity } = useTheme();
  const { t, alt, speechLang } = useLanguage();
  const { primaryAlert, alerts, homeInDanger } = useAlerts();
  const [family] = useState(INITIAL_FAMILY);
  const [isSpeaking, setIsSpeaking] = useState(false);

  const safeCount = family.filter((m) => m.status === 'safe').length;

  const alertTone = primaryAlert ? severityToTone(primaryAlert.severity) : 'advice';
  const alertColors = severity[alertTone];

  const severityLabel = (sev: string) => {
    switch (sev) {
      case 'emergency': return t.danger;
      case 'watch': return t.warning;
      case 'advice': return t.advice;
      default: return sev;
    }
  };

  const handleReadAloud = async () => {
    if (isSpeaking) {
      Speech.stop();
      setIsSpeaking(false);
      return;
    }
    if (!primaryAlert) return;

    setIsSpeaking(true);
    const primaryText = t[primaryAlert.detailKey];
    const secondaryText = alt[primaryAlert.detailKey];
    const secondarySpeechLang = speechLang === 'hi-IN' ? 'en-AU' : 'hi-IN';

    Speech.speak(primaryText, {
      language: speechLang,
      rate: 0.85,
      onDone: () => {
        Speech.speak(secondaryText, {
          language: secondarySpeechLang,
          rate: 0.85,
          onDone: () => setIsSpeaking(false),
          onStopped: () => setIsSpeaking(false),
        });
      },
      onStopped: () => setIsSpeaking(false),
    });
  };

  const handleReadDetails = () => {
    if (!primaryAlert) return;

    const steps = primaryAlert.instructionKeys
      .map((key, i) => `${i + 1}. ${t[key]}`)
      .join('\n');
    const stepsAlt = primaryAlert.instructionKeys
      .map((key, i) => `${i + 1}. ${alt[key]}`)
      .join('\n');

    Alert.alert(
      t[primaryAlert.headlineKey],
      `${t[primaryAlert.detailKey]}\n\n${alt[primaryAlert.detailKey]}\n\n${t.alertWhatToDo}\n${steps}\n\n${alt.alertWhatToDo}\n${stepsAlt}`,
      [{ text: t.ok }],
    );
  };

  const handleCallMember = (member: FamilyMember) => {
    Alert.alert(
      `${t.call} ${member.name}?`,
      '',
      [
        { text: t.cancel, style: 'cancel' },
        { text: t.call, onPress: () => Linking.openURL('tel:0412345678') },
      ],
    );
  };

  const handleSeeAll = () => {
    Alert.alert(
      t.familySafe.replace('{count}', String(safeCount)),
      `${safeCount} / ${family.length} ${t.safe}`,
      [{ text: t.ok }],
    );
  };

  return (
    <View style={[styles.screen, { backgroundColor: colors.bg }]}>
      <SafeAreaView edges={['top']} style={styles.flex}>
        <ScrollView contentContainerStyle={styles.content}>
          <View style={styles.headerRow}>
            <View style={styles.headerText}>
              <RText variant="eyebrowLabel" color={colors.ink3}>
                {t.monitoring}
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
                AM
              </RText>
            </View>
          </View>

          {/* Home danger warning */}
          {homeInDanger && (
            <RCard style={[styles.dangerBanner, { backgroundColor: severity.emergency.bg, borderColor: severity.emergency.border }]}>
              <View style={styles.dangerRow}>
                <Ionicons name="alert-circle" size={28} color={severity.emergency.fg} />
                <View style={styles.dangerText}>
                  <RText variant="bodyEmphasis" color={severity.emergency.fg}>
                    {t.danger}: Your home is in a danger zone
                  </RText>
                  <RText variant="secondary" color={severity.emergency.fg}>
                    {alt.danger}: {alt.leaveArea}
                  </RText>
                </View>
              </View>
            </RCard>
          )}

          {/* Active alerts summary */}
          {alerts.length > 1 && (
            <RText variant="caption" color={colors.ink3}>
              {alerts.length} active alerts nearby · {alerts.length} सक्रिय अलर्ट
            </RText>
          )}

          {/* Primary alert card */}
          {primaryAlert && (
            <RCard
              style={[styles.alertCard, { borderLeftColor: alertColors.border, borderLeftWidth: 6 }]}
              accessibilityRole="alert"
              accessibilityLabel={t[primaryAlert.headlineKey]}
            >
              <View style={styles.alertHeaderRow}>
                <SeverityBadge tone={alertTone} label={severityLabel(primaryAlert.severity)} icon={primaryAlert.icon} pill={false} />
                <View style={styles.updatedRow}>
                  <Ionicons name="time-outline" size={14} color={colors.ink3} />
                  <RText variant="caption" color={colors.ink3}>
                    {primaryAlert.updatedMinAgo} min · {primaryAlert.distanceKm} km
                  </RText>
                </View>
              </View>

              <RText variant="heroHeadline" color={colors.ink} style={styles.alertHeadline} accessibilityRole="header">
                {t[primaryAlert.headlineKey]}
              </RText>
              <RText variant="body" color={colors.ink2}>
                {alt[primaryAlert.headlineKey]}
              </RText>

              <View style={styles.alertActions}>
                <RButton label={t.readDetails} variant="primary" size="m" icon="chevron-forward" onPress={handleReadDetails} />
                <RButton
                  label={isSpeaking ? t.stop : t.readAloud}
                  variant="secondary"
                  size="m"
                  icon={isSpeaking ? 'stop-circle' : 'volume-high-outline'}
                  iconPosition="leading"
                  onPress={handleReadAloud}
                  accessibilityHint="Reads this alert aloud"
                />
              </View>
            </RCard>
          )}

          {/* Other active alerts (non-primary) */}
          {alerts.slice(1).map((alert) => {
            const tone = severityToTone(alert.severity);
            const toneColors = severity[tone];
            return (
              <Pressable
                key={alert.id}
                onPress={() => {
                  Alert.alert(
                    t[alert.headlineKey],
                    `${t[alert.detailKey]}\n${alt[alert.detailKey]}\n\n📍 ${alert.distanceKm} km`,
                    [{ text: t.ok }],
                  );
                }}
              >
                <RCard
                  style={[styles.secondaryAlert, { borderLeftColor: toneColors.border, borderLeftWidth: 4 }]}
                >
                  <View style={styles.secondaryAlertRow}>
                    <View style={[styles.secondaryIcon, { backgroundColor: toneColors.bg }]}>
                      <Ionicons name={alert.icon} size={22} color={toneColors.fg} />
                    </View>
                    <View style={styles.secondaryInfo}>
                      <RText variant="bodyEmphasis" color={colors.ink}>
                        {t[alert.headlineKey]}
                      </RText>
                      <RText variant="caption" color={colors.ink3}>
                        {alert.distanceKm} km · {alert.updatedMinAgo} min ago
                      </RText>
                    </View>
                    <SeverityBadge tone={tone} label={severityLabel(alert.severity)} icon={alert.icon} size="s" />
                  </View>
                </RCard>
              </Pressable>
            );
          })}

          {/* Family section */}
          <View style={styles.sectionHeaderRow}>
            <RText variant="sectionHeading" color={colors.ink}>
              {t.familySafe.replace('{count}', String(safeCount))}
            </RText>
            <RText
              variant="body"
              color={colors.ink2}
              accessibilityRole="button"
              onPress={handleSeeAll}
            >
              {t.seeAll}
            </RText>
          </View>

          <RCard padded={false}>
            {family.map((member, index) => (
              <View
                key={member.id}
                style={[
                  styles.familyRow,
                  index < family.length - 1 && { borderBottomWidth: 1, borderBottomColor: colors.hairline },
                ]}
              >
                <View style={[styles.familyAvatar, { backgroundColor: colors.surface2 }]}>
                  <RText variant="bodyEmphasis" color={colors.ink2}>
                    {member.name.charAt(0)}
                  </RText>
                </View>
                <View style={styles.familyInfo}>
                  <RText variant="bodyEmphasis" color={colors.ink} onPress={() => handleCallMember(member)}>
                    {member.name}
                  </RText>
                  <RText variant="secondary" color={colors.ink3}>
                    {member.location}
                  </RText>
                </View>
                <View style={styles.familyStatus}>
                  <SeverityBadge
                    tone={member.status === 'safe' ? 'safe' : 'watch'}
                    label={member.status === 'safe' ? t.safe : t.checkIn}
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
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  flex: { flex: 1 },
  content: { padding: 20, gap: 16 },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  headerText: { gap: 6 },
  locationRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dangerBanner: { borderWidth: 2 },
  dangerRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  dangerText: { flex: 1, gap: 2 },
  alertCard: { gap: 12 },
  alertHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  updatedRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  alertHeadline: { marginTop: -4 },
  alertActions: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  secondaryAlert: { paddingVertical: 4 },
  secondaryAlertRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  secondaryIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryInfo: { flex: 1, gap: 2 },
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
  familyInfo: { flex: 1, gap: 2 },
  familyStatus: { alignItems: 'flex-end', gap: 4 },
});
