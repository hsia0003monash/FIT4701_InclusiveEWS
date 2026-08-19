import { Ionicons } from '@expo/vector-icons';
import * as Speech from 'expo-speech';
import { useState } from 'react';
import { Alert, Linking, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { RButton } from '../components/RButton';
import { RCard } from '../components/RCard';
import { RText } from '../components/RText';
import { useLanguage } from '../context/LanguageContext';
import { useTheme } from '../theme/useTheme';
import { Translations } from '../i18n/translations';

interface ActionStep {
  id: string;
  icon: keyof typeof Ionicons.glyphMap;
  labelKey: keyof Translations;
}

interface ActionPlan {
  id: string;
  titleKey: keyof Translations;
  icon: keyof typeof Ionicons.glyphMap;
  tone: 'emergency' | 'watch' | 'advice';
  steps: ActionStep[];
}

const PLANS: ActionPlan[] = [
  {
    id: 'fire',
    titleKey: 'ifFire',
    icon: 'flame',
    tone: 'emergency',
    steps: [
      { id: 'f1', icon: 'exit-outline', labelKey: 'leaveHouseNow' },
      { id: 'f2', icon: 'people', labelKey: 'takeChildren' },
      { id: 'f3', icon: 'car', labelKey: 'goMeetingPoint' },
      { id: 'f4', icon: 'call', labelKey: 'call000' },
    ],
  },
  {
    id: 'flood',
    titleKey: 'ifFlood',
    icon: 'water',
    tone: 'watch',
    steps: [
      { id: 'fl1', icon: 'arrow-up', labelKey: 'goUpstairs' },
      { id: 'fl2', icon: 'close-circle', labelKey: 'dontWalkWater' },
      { id: 'fl3', icon: 'call', labelKey: 'callSES' },
      { id: 'fl4', icon: 'radio', labelKey: 'listenForUpdates' },
    ],
  },
  {
    id: 'storm',
    titleKey: 'ifStorm',
    icon: 'thunderstorm',
    tone: 'advice',
    steps: [
      { id: 's1', icon: 'home', labelKey: 'stayInside' },
      { id: 's2', icon: 'close-circle', labelKey: 'awayFromWindows' },
      { id: 's3', icon: 'flashlight', labelKey: 'keepTorchReady' },
      { id: 's4', icon: 'radio', labelKey: 'listenForUpdates' },
    ],
  },
];

export function PlansScreen() {
  const { colors, severity } = useTheme();
  const { t, alt, speechLang } = useLanguage();
  const [speakingPlanId, setSpeakingPlanId] = useState<string | null>(null);

  const handleReadPlan = (plan: ActionPlan) => {
    if (speakingPlanId === plan.id) {
      Speech.stop();
      setSpeakingPlanId(null);
      return;
    }

    setSpeakingPlanId(plan.id);

    const primaryText = `${t[plan.titleKey]}. ${plan.steps.map((s, i) => `${i + 1}. ${t[s.labelKey]}`).join('. ')}`;
    const secondaryText = `${alt[plan.titleKey]}. ${plan.steps.map((s, i) => `${i + 1}. ${alt[s.labelKey]}`).join('. ')}`;
    const secondarySpeechLang = speechLang === 'hi-IN' ? 'en-AU' : 'hi-IN';

    Speech.speak(primaryText, {
      language: speechLang,
      rate: 0.85,
      onDone: () => {
        Speech.speak(secondaryText, {
          language: secondarySpeechLang,
          rate: 0.85,
          onDone: () => setSpeakingPlanId(null),
          onStopped: () => setSpeakingPlanId(null),
        });
      },
      onStopped: () => setSpeakingPlanId(null),
    });
  };

  const handleEmergencyCall = () => {
    Alert.alert(
      `${t.callEmergency}?`,
      `${alt.callEmergency}?`,
      [
        { text: t.cancel, style: 'cancel' },
        { text: `${t.call} 000`, style: 'destructive', onPress: () => Linking.openURL('tel:000') },
      ],
    );
  };

  return (
    <View style={[styles.screen, { backgroundColor: colors.bg }]}>
      <SafeAreaView edges={['top']} style={styles.flex}>
        <ScrollView contentContainerStyle={styles.content}>
          {/* Header */}
          <RText variant="title" color={colors.ink} accessibilityRole="header">
            {t.whatToDo}
          </RText>
          <RText variant="body" color={colors.ink2}>
            {alt.whatToDo}
          </RText>
          <RText variant="secondary" color={colors.ink3}>
            {t.simpleSteps}
          </RText>

          {/* Action plan cards */}
          {PLANS.map((plan) => {
            const toneColors = severity[plan.tone];
            const isSpeaking = speakingPlanId === plan.id;

            return (
              <RCard
                key={plan.id}
                style={[styles.planCard, { borderLeftColor: toneColors.border, borderLeftWidth: 6 }]}
              >
                {/* Plan header */}
                <View style={styles.planHeader}>
                  <View style={[styles.planIcon, { backgroundColor: toneColors.bg }]}>
                    <Ionicons name={plan.icon} size={28} color={toneColors.fg} />
                  </View>
                  <View style={styles.planTitle}>
                    <RText variant="sectionHeading" color={colors.ink}>
                      {t[plan.titleKey]}
                    </RText>
                    <RText variant="secondary" color={colors.ink2}>
                      {alt[plan.titleKey]}
                    </RText>
                  </View>
                </View>

                {/* Steps */}
                <View style={styles.stepsContainer}>
                  {plan.steps.map((step, index) => (
                    <View key={step.id} style={styles.stepRow}>
                      <View style={[styles.stepNumber, { backgroundColor: toneColors.bg }]}>
                        <RText variant="bodyEmphasis" color={toneColors.fg}>
                          {index + 1}
                        </RText>
                      </View>
                      <Ionicons name={step.icon} size={24} color={toneColors.fg} />
                      <View style={styles.stepText}>
                        <RText variant="bodyEmphasis" color={colors.ink}>
                          {t[step.labelKey]}
                        </RText>
                        <RText variant="secondary" color={colors.ink2}>
                          {alt[step.labelKey]}
                        </RText>
                      </View>
                    </View>
                  ))}
                </View>

                {/* Read aloud button */}
                <RButton
                  label={isSpeaking ? t.stop : t.readAloud}
                  variant="secondary"
                  size="m"
                  icon={isSpeaking ? 'stop-circle' : 'volume-high-outline'}
                  iconPosition="leading"
                  onPress={() => handleReadPlan(plan)}
                  accessibilityHint={`Reads the ${alt[plan.titleKey]} plan aloud`}
                />
              </RCard>
            );
          })}

          {/* Emergency number */}
          <RCard style={[styles.emergencyCard, { backgroundColor: severity.emergency.bg, borderColor: severity.emergency.border }]}>
            <View style={styles.emergencyRow}>
              <Ionicons name="call" size={32} color={severity.emergency.fg} />
              <View style={styles.emergencyText}>
                <RText variant="title" color={severity.emergency.fg}>
                  {t.emergency000}
                </RText>
                <RText variant="body" color={severity.emergency.fg}>
                  {alt.emergency000}
                </RText>
              </View>
            </View>
            <RButton
              label={t.callEmergency}
              variant="danger"
              size="l"
              icon="call"
              iconPosition="leading"
              onPress={handleEmergencyCall}
              accessibilityHint="Calls emergency services at triple zero"
            />
          </RCard>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  flex: { flex: 1 },
  content: { padding: 20, gap: 20 },
  planCard: { gap: 16 },
  planHeader: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  planIcon: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
  },
  planTitle: { flex: 1, gap: 2 },
  stepsContainer: { gap: 14 },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    minHeight: 48,
  },
  stepNumber: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepText: { flex: 1, gap: 2 },
  emergencyCard: { borderWidth: 2, gap: 16 },
  emergencyRow: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  emergencyText: { flex: 1, gap: 4 },
});
