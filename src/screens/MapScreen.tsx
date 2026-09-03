import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Vibration, View } from 'react-native';
import MapView, { Circle, Marker, PROVIDER_DEFAULT } from 'react-native-maps';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AlertDetailModal } from '../components/AlertDetailModal';
import { RButton } from '../components/RButton';
import { RCard } from '../components/RCard';
import { RTabBar, TabKey } from '../components/RTabBar';
import { RText } from '../components/RText';
import { SeverityBadge } from '../components/SeverityBadge';
import { HOME_IN_DANGER, HOME_LOCATION, MAP_ALERTS, MapAlert, withAlpha } from '../data/alerts';
import { FullMapScreen } from './FullMapScreen';
import { severityLevels } from '../theme/tokens';
import { useTheme } from '../theme/useTheme';

interface MapScreenProps {
  onNavigate: (tab: TabKey) => void;
}

export function MapScreen({ onNavigate }: MapScreenProps) {
  const { colors, severity } = useTheme();
  const [selectedAlert, setSelectedAlert] = useState<MapAlert | null>(null);
  const [safeSent, setSafeSent] = useState(false);
  const [expanded, setExpanded] = useState(false);

  const handleImSafe = () => {
    Vibration.vibrate(200);
    setSafeSent(true);
    setTimeout(() => setSafeSent(false), 5000);
  };

  return (
    <View style={[styles.screen, { backgroundColor: colors.bg }]}>
      <SafeAreaView edges={['top']} style={styles.flex}>
        <ScrollView contentContainerStyle={styles.content}>
          <View style={styles.headerRow}>
            <Pressable
              onPress={() => onNavigate('Home')}
              accessibilityRole="button"
              accessibilityLabel="Back to Home"
              style={[styles.backButton, { backgroundColor: colors.surface, borderColor: colors.hairline }]}
            >
              <Ionicons name="chevron-back" size={18} color={colors.ink} />
            </Pressable>
            <RText variant="eyebrowLabel" color={colors.ink3}>
              MAP
            </RText>
          </View>

          <View style={styles.titleBlock}>
            <RText variant="largeTitle" color={colors.ink} accessibilityRole="header">
              Danger near you
            </RText>
            <RText variant="body" color={colors.ink2}>
              {MAP_ALERTS.length} active alerts near Melbourne CBD
            </RText>
          </View>

          <View style={[styles.mapContainer, { borderColor: colors.hairline }]}>
            <MapView
              provider={PROVIDER_DEFAULT}
              style={styles.map}
              initialRegion={{
                latitude: HOME_LOCATION.latitude,
                longitude: HOME_LOCATION.longitude,
                latitudeDelta: 0.35,
                longitudeDelta: 0.35,
              }}
              accessibilityLabel="Map showing danger zones near your home"
            >
              <Marker
                coordinate={HOME_LOCATION}
                title={HOME_IN_DANGER ? 'Your home - Danger' : 'Your home - Safe'}
                description={HOME_IN_DANGER ? 'Leave the area if possible.' : 'No action needed.'}
                pinColor={HOME_IN_DANGER ? severity.emergency.fg : severity.safe.fg}
              />

              {MAP_ALERTS.map((alert) => (
                <Circle
                  key={`zone-${alert.id}`}
                  center={alert.coordinate}
                  radius={alert.radius}
                  fillColor={withAlpha(severity[alert.tone].fg, 0.15)}
                  strokeColor={withAlpha(severity[alert.tone].fg, 0.6)}
                  strokeWidth={2}
                />
              ))}

              {MAP_ALERTS.map((alert) => (
                <Marker
                  key={`pin-${alert.id}`}
                  coordinate={alert.coordinate}
                  title={alert.title}
                  description={`${alert.distanceKm} km away`}
                  pinColor={severity[alert.tone].fg}
                  onPress={() => setSelectedAlert(alert)}
                />
              ))}
            </MapView>

            <Pressable
              onPress={() => setExpanded(true)}
              accessibilityRole="button"
              accessibilityLabel="Expand map"
              style={[styles.expandButton, { backgroundColor: colors.surface, borderColor: colors.hairline }]}
            >
              <Ionicons name="expand" size={18} color={colors.ink} />
            </Pressable>
          </View>

          <RText variant="sectionHeading" color={colors.ink} accessibilityRole="header">
            What's nearby
          </RText>

          {MAP_ALERTS.map((alert) => {
            const tone = severity[alert.tone];
            return (
              <Pressable
                key={alert.id}
                onPress={() => setSelectedAlert(alert)}
                accessibilityRole="button"
                accessibilityLabel={`${severityLevels[alert.tone].label}. ${alert.title}. ${alert.distanceKm} kilometres away`}
              >
                <RCard style={[styles.alertCard, { borderLeftColor: tone.border, borderLeftWidth: 6 }]}>
                  <View style={styles.alertRow}>
                    <View style={[styles.alertIcon, { backgroundColor: tone.bg }]}>
                      <Ionicons name={alert.icon} size={26} color={tone.fg} />
                    </View>
                    <View style={styles.alertInfo}>
                      <SeverityBadge
                        tone={alert.tone}
                        label={severityLevels[alert.tone].label}
                        icon={severityLevels[alert.tone].icon}
                        pill={false}
                        size="s"
                      />
                      <RText variant="bodyEmphasis" color={colors.ink}>
                        {alert.title}
                      </RText>
                      <RText variant="caption" color={colors.ink3}>
                        {alert.distanceKm} km away · Updated {alert.updatedMinAgo} min ago
                      </RText>
                    </View>
                    <Ionicons name="chevron-forward" size={20} color={colors.ink3} />
                  </View>
                </RCard>
              </Pressable>
            );
          })}

          <RCard
            style={[
              styles.homeCard,
              { borderLeftColor: HOME_IN_DANGER ? severity.emergency.border : severity.safe.border, borderLeftWidth: 6 },
            ]}
          >
            <View style={styles.alertRow}>
              <View
                style={[
                  styles.alertIcon,
                  { backgroundColor: HOME_IN_DANGER ? severity.emergency.bg : severity.safe.bg },
                ]}
              >
                <Ionicons name="home" size={26} color={HOME_IN_DANGER ? severity.emergency.fg : severity.safe.fg} />
              </View>
              <View style={styles.alertInfo}>
                <RText variant="bodyEmphasis" color={colors.ink}>
                  {HOME_IN_DANGER ? 'Your home - Danger' : 'Your home - Safe'}
                </RText>
                <RText variant="secondary" color={colors.ink2}>
                  {HOME_IN_DANGER ? 'Leave the area if possible.' : 'No action needed.'}
                </RText>
              </View>
            </View>
          </RCard>

          <RButton
            label={safeSent ? 'Sent!' : "I'm Safe"}
            variant="primary"
            size="l"
            icon={safeSent ? 'checkmark-done-circle' : 'checkmark-circle'}
            iconPosition="leading"
            onPress={handleImSafe}
            accessibilityHint="Lets your family know you are safe"
            fullWidth
          />
        </ScrollView>
      </SafeAreaView>
      <RTabBar active="Map" onSelect={onNavigate} />
      <AlertDetailModal alert={selectedAlert} onClose={() => setSelectedAlert(null)} />

      <Modal visible={expanded} animationType="slide" presentationStyle="fullScreen" onRequestClose={() => setExpanded(false)}>
        <FullMapScreen onClose={() => setExpanded(false)} />
      </Modal>
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
    gap: 16,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleBlock: {
    gap: 6,
  },
  mapContainer: {
    height: 280,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
  },
  map: {
    flex: 1,
  },
  expandButton: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  alertCard: {
    gap: 8,
  },
  alertRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  alertIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  alertInfo: {
    flex: 1,
    gap: 4,
  },
  homeCard: {
    gap: 8,
  },
});
