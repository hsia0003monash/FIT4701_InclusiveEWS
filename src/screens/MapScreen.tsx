import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Vibration, View } from 'react-native';
import MapView, { Circle, Marker, PROVIDER_DEFAULT } from 'react-native-maps';
import { SafeAreaView } from 'react-native-safe-area-context';
import { RButton } from '../components/RButton';
import { RCard } from '../components/RCard';
import { RText } from '../components/RText';
import { useAlerts, severityToTone, ActiveAlert } from '../context/AlertsContext';
import { useLanguage } from '../context/LanguageContext';
import { useTheme } from '../theme/useTheme';

const ZONE_COLORS: Record<string, { fill: string; stroke: string; pin: string }> = {
  emergency: { fill: 'rgba(122, 14, 18, 0.2)', stroke: 'rgba(122, 14, 18, 0.7)', pin: 'red' },
  watch: { fill: 'rgba(138, 63, 0, 0.15)', stroke: 'rgba(138, 63, 0, 0.6)', pin: 'orange' },
  advice: { fill: 'rgba(43, 58, 78, 0.12)', stroke: 'rgba(43, 58, 78, 0.5)', pin: 'blue' },
};

export function MapScreen() {
  const { colors, severity } = useTheme();
  const { t, alt } = useLanguage();
  const { alerts, homeLocation, homeInDanger } = useAlerts();
  const [safeSent, setSafeSent] = useState(false);

  const handleImSafe = () => {
    Vibration.vibrate(200);
    setSafeSent(true);
    Alert.alert(
      t.sent,
      `${t.sentConfirmation}\n${alt.sentConfirmation}`,
      [{ text: t.ok }],
    );
    setTimeout(() => setSafeSent(false), 5000);
  };

  const handleAlertTap = (alert: ActiveAlert) => {
    const toneLabel = t[alert.severity as keyof typeof t] ?? alert.severity;
    const instructions = alert.instructionKeys
      .map((key, i) => `${i + 1}. ${t[key]}`)
      .join('\n');
    const instructionsAlt = alert.instructionKeys
      .map((key, i) => `${i + 1}. ${alt[key]}`)
      .join('\n');

    Alert.alert(
      `${toneLabel} · ${t[alert.headlineKey]}`,
      `${t[alert.detailKey]}\n${alt[alert.detailKey]}\n\n📍 ${alert.distanceKm} km\n\n${t.alertWhatToDo}\n${instructions}\n\n${alt.alertWhatToDo}\n${instructionsAlt}`,
      [{ text: t.ok }],
    );
  };

  return (
    <View style={[styles.screen, { backgroundColor: colors.bg }]}>
      <SafeAreaView edges={['top']} style={styles.flex}>
        <ScrollView contentContainerStyle={styles.content}>
          {/* Header */}
          <RText variant="title" color={colors.ink} accessibilityRole="header">
            {t.dangerNearYou}
          </RText>
          <RText variant="body" color={colors.ink2}>
            {alt.dangerNearYou}
          </RText>

          {/* Map */}
          <View style={styles.mapContainer}>
            <MapView
              provider={PROVIDER_DEFAULT}
              style={styles.map}
              initialRegion={{
                latitude: homeLocation.latitude,
                longitude: homeLocation.longitude,
                latitudeDelta: 0.08,
                longitudeDelta: 0.08,
              }}
              accessibilityLabel="Map showing danger zones near your home"
            >
              {/* Home marker */}
              <Marker
                coordinate={homeLocation}
                title={t.yourHomeSafe}
                description={homeInDanger ? t.leaveArea : alt.yourHomeSafe}
                pinColor={homeInDanger ? 'purple' : 'green'}
              />

              {/* Alert circles and markers from shared context */}
              {alerts.map((alert) => (
                <Circle
                  key={`circle-${alert.id}`}
                  center={alert.coordinate}
                  radius={alert.radius}
                  fillColor={ZONE_COLORS[alert.severity]?.fill ?? 'transparent'}
                  strokeColor={ZONE_COLORS[alert.severity]?.stroke ?? 'gray'}
                  strokeWidth={2}
                />
              ))}

              {alerts.map((alert) => (
                <Marker
                  key={`marker-${alert.id}`}
                  coordinate={alert.coordinate}
                  title={t[alert.headlineKey]}
                  description={`${alt[alert.headlineKey]} · ${alert.distanceKm} km`}
                  pinColor={ZONE_COLORS[alert.severity]?.pin ?? 'red'}
                  onCalloutPress={() => handleAlertTap(alert)}
                />
              ))}
            </MapView>
          </View>

          {/* Alert count */}
          <RText variant="caption" color={colors.ink3}>
            {alerts.length} active alerts · {alerts.length} सक्रिय अलर्ट
          </RText>

          {/* Legend — alerts listed as cards */}
          <RText variant="sectionHeading" color={colors.ink} accessibilityRole="header">
            {t.whatIsNearby}
          </RText>
          <RText variant="secondary" color={colors.ink2}>
            {alt.whatIsNearby}
          </RText>

          {alerts.map((alert) => {
            const tone = severityToTone(alert.severity);
            const toneColors = severity[tone];
            return (
              <Pressable
                key={alert.id}
                onPress={() => handleAlertTap(alert)}
                accessibilityRole="button"
                accessibilityLabel={`${t[alert.headlineKey]}. ${alert.distanceKm} km`}
              >
                <RCard
                  style={[styles.zoneCard, { borderLeftColor: toneColors.border, borderLeftWidth: 6 }]}
                >
                  <View style={styles.zoneRow}>
                    <View style={[styles.zoneIcon, { backgroundColor: toneColors.bg }]}>
                      <Ionicons name={alert.icon} size={28} color={toneColors.fg} />
                    </View>
                    <View style={styles.zoneInfo}>
                      <RText variant="bodyEmphasis" color={colors.ink}>
                        {t[alert.headlineKey]}
                      </RText>
                      <RText variant="secondary" color={colors.ink2}>
                        {alt[alert.headlineKey]}
                      </RText>
                      <RText variant="caption" color={colors.ink3}>
                        📍 {alert.distanceKm} km · {alert.updatedMinAgo} min ago
                      </RText>
                    </View>
                    <Ionicons name="chevron-forward" size={20} color={colors.ink3} />
                  </View>
                </RCard>
              </Pressable>
            );
          })}

          {/* Home status card */}
          <RCard style={[styles.homeCard, { borderLeftColor: homeInDanger ? severity.emergency.border : severity.safe.border, borderLeftWidth: 6 }]}>
            <View style={styles.zoneRow}>
              <View style={[styles.zoneIcon, { backgroundColor: homeInDanger ? severity.emergency.bg : severity.safe.bg }]}>
                <Ionicons name="home" size={28} color={homeInDanger ? severity.emergency.fg : severity.safe.fg} />
              </View>
              <View style={styles.zoneInfo}>
                <RText variant="bodyEmphasis" color={colors.ink}>
                  {homeInDanger ? t.danger : t.yourHomeSafe}
                </RText>
                <RText variant="secondary" color={colors.ink2}>
                  {homeInDanger ? alt.leaveArea : alt.yourHomeSafe}
                </RText>
              </View>
            </View>
          </RCard>

          {/* I'm Safe button */}
          <View style={styles.actionArea}>
            <RButton
              label={safeSent ? t.sent : t.imSafe}
              variant="primary"
              size="l"
              icon={safeSent ? 'checkmark-done-circle' : 'checkmark-circle'}
              iconPosition="leading"
              onPress={handleImSafe}
              accessibilityHint={alt.imSafe}
            />
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  flex: { flex: 1 },
  content: { padding: 20, gap: 16 },
  mapContainer: {
    height: 280,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.09)',
  },
  map: { flex: 1 },
  zoneCard: { gap: 8 },
  zoneRow: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  zoneIcon: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
  },
  zoneInfo: { flex: 1, gap: 2 },
  homeCard: { gap: 8 },
  actionArea: { marginTop: 8 },
});
