import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useEffect, useRef, useState } from 'react';
import { Animated, Linking, Pressable, ScrollView, StyleSheet, Vibration, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as Speech from 'expo-speech';
import { RButton } from '../components/RButton';
import { RText } from '../components/RText';
import { useTheme } from '../theme/useTheme';
import { FAMILY_STATUS_META, FamilyStatus, SELECTABLE_FAMILY_STATUSES } from '../data/family';
import { Hazard, HAZARD_STYLES, toRgba } from '../data/hazards';
import { EvacuationPlan } from '../data/plans';

interface AlertScreenProps {
  hazard: Hazard;
  plan: EvacuationPlan | null;
  /** User picked a status — acknowledges the alert and updates their own status to it. */
  onRespond: (status: FamilyStatus) => void;
  /** Only shown when a resolved destination exists for the plan. Steps aside
   * from the full-screen block to show the route — does NOT acknowledge the
   * alert, since the user hasn't confirmed their status yet. */
  onShowRoute?: () => void;
}

// Kept well under ~3 flashes/second (the commonly cited photosensitive-seizure
// threshold) — this is a slow, deliberate pulse, not a rapid strobe.
const FLASH_PERIOD_MS = 900;

export function AlertScreen({ hazard, plan, onRespond, onShowRoute }: AlertScreenProps) {
  const { colors, severity, spacing, radius, sizing, preferences } = useTheme();
  const insets = useSafeAreaInsets();
  const flashAnim = useRef(new Animated.Value(0)).current;

  const tone = hazard.severityTone ?? 'emergency';
  const hazardStyle = HAZARD_STYLES[hazard.type];

  // Lets someone mute flash/vibration for THIS alert without acknowledging
  // it (picking a status) — e.g. while actually trying to concentrate on
  // reading the plan, where a pulsing screen/buzzing phone is more
  // distraction than help. Purely local to this screen instance; doesn't
  // touch the app-wide preference, so the next alert behaves normally again.
  const [sensoryPaused, setSensoryPaused] = useState(false);

  useEffect(() => {
    if (!preferences.vibrateOnAlert || sensoryPaused) return;
    // Pattern: wait 0ms, vibrate 500ms, pause 400ms — repeats (the `true` arg).
    Vibration.vibrate([0, 500, 400], true);
    return () => Vibration.cancel();
  }, [preferences.vibrateOnAlert, sensoryPaused]);

  useEffect(() => {
    if (!preferences.flashOnAlert || sensoryPaused) {
      flashAnim.setValue(0);
      return;
    }
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(flashAnim, { toValue: 1, duration: FLASH_PERIOD_MS / 2, useNativeDriver: false }),
        Animated.timing(flashAnim, { toValue: 0, duration: FLASH_PERIOD_MS / 2, useNativeDriver: false }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [preferences.flashOnAlert, sensoryPaused]);

  const flashColor = flashAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [severity[tone].bg, severity[tone].border],
  });

  // Torch strobe — same "Flash screen on alert" preference drives this too,
  // so it reads as one feature to the user even though it's two separate
  // mechanisms under the hood. Permission is requested quietly in the
  // background; the alert screen itself never waits on it, and if it's
  // denied or still pending, the screen-colour flash above still carries
  // the visual alert on its own.
  const [permission, requestPermission] = useCameraPermissions();
  const [torchOn, setTorchOn] = useState(false);

  useEffect(() => {
    if (!preferences.flashOnAlert) return;
    if (!permission?.granted) {
      requestPermission();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [preferences.flashOnAlert]);

  useEffect(() => {
    if (!preferences.flashOnAlert || !permission?.granted || sensoryPaused) {
      setTorchOn(false);
      return;
    }
    const interval = setInterval(() => {
      setTorchOn((prev) => !prev);
    }, FLASH_PERIOD_MS / 2);
    return () => clearInterval(interval);
  }, [preferences.flashOnAlert, permission?.granted, sensoryPaused]);

  const showPauseButton = preferences.flashOnAlert || preferences.vibrateOnAlert;
  // Reserve room for the floating pause pill (top offset + its height + a
  // gap) so it doesn't overlap the banner underneath it — only needed when
  // the button actually renders.
  const contentTopPadding = insets.top + (showPauseButton ? 12 + sizing.touchTarget.minimum + 16 : 20);

  const handleCallForHelp = () => {
    Linking.openURL('tel:000');
  };

  // Reads the hazard and, if there is one, the response plan's steps aloud —
  // directly requested by both personas ("optional spoken alerts" / a way
  // to get the information without relying on hearing or reading closely).
  const [isSpeaking, setIsSpeaking] = useState(false);

  const buildUtterance = () => {
    const parts = [hazard.headline ?? hazard.description, hazard.description].filter(
      (part, index, arr) => arr.indexOf(part) === index // drop an exact duplicate if headline === description
    );
    if (plan) {
      parts.push(`Your plan: ${plan.title}.`);
      plan.steps.forEach((step, i) => parts.push(`Step ${i + 1}: ${step}`));
    }
    return parts.join('. ');
  };

  const handleReadAloud = () => {
    if (isSpeaking) {
      Speech.stop();
      setIsSpeaking(false);
      return;
    }
    setIsSpeaking(true);
    Speech.speak(buildUtterance(), {
      onDone: () => setIsSpeaking(false),
      onStopped: () => setIsSpeaking(false),
      onError: () => setIsSpeaking(false),
    });
  };

  // Auto-read once when the alert first appears, if the preference is on —
  // guarded so it only fires once per hazard, not on every re-render.
  const autoReadHazardIdRef = useRef<string | null>(null);
  useEffect(() => {
    if (!preferences.autoReadAlerts) return;
    if (autoReadHazardIdRef.current === hazard.id) return;
    autoReadHazardIdRef.current = hazard.id;
    handleReadAloud();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [preferences.autoReadAlerts, hazard.id]);

  // Stop any in-progress speech if the alert is dismissed/minimized/unmounted.
  useEffect(() => {
    return () => {
      Speech.stop();
    };
  }, []);

  return (
    <View style={[styles.screen, { backgroundColor: colors.bg }]}>
      {preferences.flashOnAlert && permission?.granted && (
        <CameraView style={styles.hiddenCamera} enableTorch={torchOn && !sensoryPaused} facing="back" />
      )}

      {showPauseButton && (
        <Pressable
          onPress={() => setSensoryPaused((prev) => !prev)}
          accessibilityRole="button"
          accessibilityLabel={sensoryPaused ? 'Resume flash and vibration' : 'Pause flash and vibration'}
          style={[
            styles.pauseButton,
            {
              top: insets.top + 12,
              backgroundColor: colors.surface,
              borderColor: colors.hairline,
              borderRadius: radius.pill,
              paddingHorizontal: spacing.scale[4],
              minHeight: sizing.touchTarget.minimum,
              gap: spacing.scale[2],
            },
          ]}
        >
          <Ionicons name={sensoryPaused ? 'flash-outline' : 'flash-off-outline'} size={sizing.icon.small} color={colors.ink2} />
          <RText variant="secondary" color={colors.ink2}>
            {sensoryPaused ? 'Resume flash & vibration' : 'Pause flash & vibration'}
          </RText>
        </Pressable>
      )}

      <ScrollView contentContainerStyle={[styles.content, { paddingTop: contentTopPadding, paddingBottom: insets.bottom + 20 }]}>
        <Animated.View
          style={[
            styles.banner,
            {
              backgroundColor: flashColor,
              borderRadius: radius.card,
              padding: spacing.cardPadding,
              gap: spacing.scale[3],
            },
          ]}
        >
          <View
            style={[
              styles.bannerIcon,
              {
                width: sizing.icon.hero * 1.6,
                height: sizing.icon.hero * 1.6,
                borderRadius: (sizing.icon.hero * 1.6) / 2,
                backgroundColor: toRgba(hazardStyle.theme, 1),
              },
            ]}
          >
            <MaterialCommunityIcons name={hazardStyle.icon} size={sizing.icon.hero} color="white" />
          </View>
          <RText variant="eyebrowLabel" color={severity[tone].fg}>
            {tone.toUpperCase()} · {hazard.type}
          </RText>
          <RText variant="largeTitle" color={severity[tone].fg} style={{ textAlign: 'center' }}>
            {hazard.headline ?? hazard.description}
          </RText>
        </Animated.View>

        <View style={{ gap: spacing.scale[2] }}>
          <RText variant="body" color={colors.ink2}>
            {hazard.description}
          </RText>
        </View>

        <RButton
          label={isSpeaking ? 'Stop reading' : 'Read aloud'}
          variant="secondary"
          size="m"
          icon={isSpeaking ? 'stop-circle-outline' : 'volume-high-outline'}
          iconPosition="leading"
          onPress={handleReadAloud}
          accessibilityHint={isSpeaking ? 'Stops reading this alert and plan aloud' : 'Reads this alert and your plan aloud'}
        />

        {plan && (
          <View
            style={[
              styles.planCard,
              { backgroundColor: colors.surface, borderColor: colors.hairline, borderRadius: radius.card, padding: spacing.cardPadding, gap: spacing.scale[3] },
            ]}
          >
            <RText variant="sectionHeading" color={colors.ink}>
              {plan.title}
            </RText>
            <View style={{ gap: spacing.scale[2] }}>
              {plan.steps.map((step, i) => (
                <View key={i} style={{ flexDirection: 'row', gap: spacing.scale[2] }}>
                  <RText variant="bodyEmphasis" color={colors.ink3}>
                    {i + 1}.
                  </RText>
                  <RText variant="body" color={colors.ink2} style={{ flex: 1 }}>
                    {step}
                  </RText>
                </View>
              ))}
            </View>

            {onShowRoute && (
              <RButton
                label="Show safest route"
                variant="secondary"
                size="m"
                icon="navigate-outline"
                iconPosition="leading"
                onPress={onShowRoute}
              />
            )}
          </View>
        )}

        <RButton
          label="Call for help — 000"
          variant="danger"
          size="l"
          icon="call-outline"
          iconPosition="leading"
          onPress={handleCallForHelp}
        />

        <View style={{ gap: spacing.scale[3] }}>
          <RText variant="sectionHeading" color={colors.ink}>
            How are you?
          </RText>
          <RText variant="secondary" color={colors.ink3}>
            Choose one — this updates your status for your family to see.
          </RText>

          <View style={{ gap: spacing.scale[3] }}>
            {SELECTABLE_FAMILY_STATUSES.map((status) => {
              const meta = FAMILY_STATUS_META[status];
              const statusTone = severity[meta.tone];
              return (
                <Pressable
                  key={status}
                  onPress={() => onRespond(status)}
                  accessibilityRole="button"
                  accessibilityLabel={meta.label}
                  style={[
                    styles.statusOption,
                    {
                      minHeight: sizing.touchTarget.preferredPrimary,
                      borderRadius: radius.lg,
                      paddingHorizontal: spacing.cardPadding,
                      gap: spacing.scale[3],
                      backgroundColor: statusTone.bg,
                      borderColor: statusTone.border,
                    },
                  ]}
                >
                  <Ionicons name={meta.icon} size={sizing.icon.large} color={statusTone.fg} />
                  <RText variant="bodyEmphasis" color={statusTone.fg}>
                    {meta.label}
                  </RText>
                </Pressable>
              );
            })}
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  hiddenCamera: {
    position: 'absolute',
    width: 1,
    height: 1,
    opacity: 0,
  },
  pauseButton: {
    position: 'absolute',
    left: 16,
    right: 16,
    zIndex: 10,
    elevation: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 6,
  },
  content: {
    paddingHorizontal: 20,
    gap: 20,
  },
  banner: {
    alignItems: 'center',
  },
  bannerIcon: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  planCard: {
    borderWidth: 1,
  },
  statusOption: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
  },
});
