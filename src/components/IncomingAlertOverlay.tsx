import { Ionicons } from '@expo/vector-icons';
import { useEffect, useRef } from 'react';
import {
  Animated,
  BackHandler,
  ScrollView,
  StyleSheet,
  Vibration,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MapAlert } from '../data/alerts';
import { severityLevels } from '../theme/tokens';
import { useTheme } from '../theme/useTheme';
import { RButton } from './RButton';
import { RText } from './RText';

interface IncomingAlertOverlayProps {
  /** The threat to announce. When null, the overlay is hidden. */
  alert: MapAlert | null;
  /** Dismiss the overlay (e.g. after "I'm Safe"). */
  onDismiss: () => void;
  /** Take the user to the map for this threat. */
  onSeeOnMap: (alert: MapAlert) => void;
}

/**
 * A full-screen, unavoidable "a threat just arrived" takeover.
 *
 * Designed for the Amid persona: push-based and impossible to miss, visual-first
 * (large hazard icon + severity colour), plain-language headline, numbered "what to do"
 * steps, and two large primary actions. The phone vibrates on arrival so the alert is
 * noticeable even if the user is not looking at the screen.
 *
 * Implemented as an absolutely-positioned, high-`zIndex` overlay rather than a native
 * `Modal`. This avoids a React Native / iOS bug where presenting a second `Modal` while
 * another (e.g. AlertDetailModal) is open or mid-animation could fail: the overlay would
 * vibrate but never appear, leaving a "ghost" screen that captured all touches and forced
 * an app restart. A plain View layered on top has no such presentation race.
 */
export function IncomingAlertOverlay({ alert, onDismiss, onSeeOnMap }: IncomingAlertOverlayProps) {
  const { colors, severity, radius } = useTheme();
  const opacity = useRef(new Animated.Value(0)).current;

  // Vibrate when a threat arrives. Emergencies get a stronger, repeating pattern.
  useEffect(() => {
    if (!alert) return;
    const pattern =
      alert.tone === 'emergency' ? [0, 500, 200, 500, 200, 500] : [0, 400, 200, 400];
    Vibration.vibrate(pattern);
    return () => Vibration.cancel();
  }, [alert]);

  // Fade the overlay in when a threat arrives (replaces the old Modal fade animation).
  useEffect(() => {
    opacity.setValue(0);
    if (alert) {
      Animated.timing(opacity, { toValue: 1, duration: 220, useNativeDriver: true }).start();
    }
  }, [alert, opacity]);

  // While visible, capture the Android hardware back button so it dismisses the alert
  // (the same behaviour the Modal's onRequestClose used to provide) instead of leaving
  // the app.
  useEffect(() => {
    if (!alert) return;
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      onDismiss();
      return true;
    });
    return () => sub.remove();
  }, [alert, onDismiss]);

  const tone = alert ? severity[alert.tone] : severity.advice;
  const level = alert ? severityLevels[alert.tone] : severityLevels.advice;

  // Render nothing at all when there is no threat, so the overlay never intercepts touches.
  if (!alert) return null;

  return (
    <Animated.View
      style={[StyleSheet.absoluteFill, styles.overlay, { backgroundColor: tone.bg, opacity }]}
      accessibilityViewIsModal
      accessibilityLiveRegion="assertive"
    >
      <View style={[styles.screen, { backgroundColor: tone.bg }]}>
        <SafeAreaView edges={['top', 'bottom']} style={styles.flex}>
          <ScrollView contentContainerStyle={styles.content}>
            {/* Pulsing severity banner */}
            <View style={[styles.banner, { backgroundColor: tone.fg }]}>
              <Ionicons name="warning" size={22} color={colors.bg} />
              <RText variant="eyebrowLabel" color={colors.bg}>
                {level.label}
              </RText>
            </View>

            {/* Big hazard icon */}
            <View style={[styles.iconCircle, { backgroundColor: colors.bg, borderColor: tone.border }]}>
              <Ionicons name={alert.icon} size={72} color={tone.fg} />
            </View>

            {/* Plain-language headline */}
            <RText variant="heroHeadline" color={colors.ink} style={styles.headline} accessibilityRole="header">
              {alert.title}
            </RText>

            <RText variant="body" color={colors.ink2} style={styles.detail}>
              {alert.detail}
            </RText>

            <View style={styles.metaRow}>
              <Ionicons name="location-outline" size={16} color={colors.ink2} />
              <RText variant="bodyEmphasis" color={colors.ink2}>
                {alert.distanceKm} km away · just now
              </RText>
            </View>

            {/* What to do */}
            <View style={[styles.stepsCard, { backgroundColor: colors.bg, borderColor: tone.border, borderRadius: radius.card }]}>
              <RText variant="sectionHeading" color={colors.ink}>
                What to do now
              </RText>
              {alert.instructions.map((instruction, index) => (
                <View key={instruction} style={styles.stepRow}>
                  <View style={[styles.stepNumber, { backgroundColor: tone.fg }]}>
                    <RText variant="caption" color={colors.bg}>
                      {index + 1}
                    </RText>
                  </View>
                  <RText variant="bodyEmphasis" color={colors.ink} style={styles.stepText}>
                    {instruction}
                  </RText>
                </View>
              ))}
            </View>
          </ScrollView>

          {/* Large, unmissable actions */}
          <View style={styles.actions}>
            <RButton
              label="I'm Safe"
              variant="primary"
              size="l"
              icon="checkmark-circle"
              iconPosition="leading"
              onPress={onDismiss}
              accessibilityHint="Marks you safe and dismisses this alert"
              fullWidth
            />
            <RButton
              label="See on map"
              variant="secondary"
              size="l"
              icon="map"
              iconPosition="leading"
              onPress={() => alert && onSeeOnMap(alert)}
              accessibilityHint="Opens the map to show where this threat is"
              fullWidth
            />
          </View>
        </SafeAreaView>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    // Sit above every screen and the tab bar so the takeover is truly unavoidable.
    zIndex: 1000,
    elevation: 1000,
  },
  screen: {
    flex: 1,
  },
  flex: {
    flex: 1,
  },
  content: {
    padding: 24,
    alignItems: 'center',
    gap: 16,
  },
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 9999,
  },
  iconCircle: {
    width: 140,
    height: 140,
    borderRadius: 70,
    borderWidth: 3,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  headline: {
    textAlign: 'center',
  },
  detail: {
    textAlign: 'center',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  stepsCard: {
    alignSelf: 'stretch',
    borderWidth: 1,
    padding: 18,
    gap: 14,
    marginTop: 8,
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  stepNumber: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  stepText: {
    flex: 1,
  },
  actions: {
    padding: 20,
    gap: 12,
  },
});
