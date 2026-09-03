import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { Fragment, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Platform, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import MapView, { Circle, Marker, Region } from 'react-native-maps';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AlertDetailModal } from '../components/AlertDetailModal';
import { RCenteredOverlay } from '../components/RCenteredOverlay';
import { ROptionSelector } from '../components/ROptionSelector';
import { RToggleRow } from '../components/RToggleRow';
import { RText } from '../components/RText';
import { HOME_IN_DANGER, HOME_LOCATION, MAP_ALERTS, MapAlert, withAlpha } from '../data/alerts';
import { severityLevels } from '../theme/tokens';
import { useTheme } from '../theme/useTheme';

interface FullMapScreenProps {
  onClose: () => void;
}

type MarkerSize = 'small' | 'medium' | 'large';
type ButtonSize = 'small' | 'medium' | 'large';
type ButtonPosition = 'center' | 'side-right';

// Multipliers applied to marker/button dimensions - 'medium' matches this
// screen's original, un-scaled sizing.
const MARKER_SIZE_SCALE: Record<MarkerSize, number> = { small: 0.8, medium: 1, large: 1.3 };
const BUTTON_SIZE_SCALE: Record<ButtonSize, number> = { small: 0.85, medium: 1, large: 1.25 };

const MARKER_SIZE_OPTIONS: { value: MarkerSize; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { value: 'small', label: 'Small', icon: 'location-outline' },
  { value: 'medium', label: 'Medium', icon: 'location-outline' },
  { value: 'large', label: 'Large', icon: 'location-outline' },
];

const BUTTON_SIZE_OPTIONS: { value: ButtonSize; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { value: 'small', label: 'Small', icon: 'ellipse-outline' },
  { value: 'medium', label: 'Medium', icon: 'ellipse-outline' },
  { value: 'large', label: 'Large', icon: 'ellipse-outline' },
];

const BUTTON_POSITION_OPTIONS: { value: ButtonPosition; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { value: 'center', label: 'Bottom middle', icon: 'remove-outline' },
  { value: 'side-right', label: 'Right edge', icon: 'swap-vertical-outline' },
];

const SEVERITY_LEGEND_ORDER: MapAlert['tone'][] = ['advice', 'watch', 'emergency'];

// Used for every alert when "Simple map" is on - one unambiguous "something is
// wrong here" treatment instead of a different icon per hazard, for anyone who
// finds a multi-icon map more confusing than helpful.
const SIMPLE_ALERT_ICON: keyof typeof Ionicons.glyphMap = 'alert-circle';

// Standard Google Maps "dark mode" style JSON - only takes effect when the map
// provider is actually Google (Android by default; iOS uses Apple Maps and
// ignores this prop, so mapType="mutedStandard" covers dark mode there instead).
const DARK_MAP_STYLE = [
  { elementType: 'geometry', stylers: [{ color: '#212121' }] },
  { elementType: 'labels.icon', stylers: [{ visibility: 'off' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#757575' }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: '#212121' }] },
  { featureType: 'administrative', elementType: 'geometry', stylers: [{ color: '#757575' }] },
  { featureType: 'administrative.country', elementType: 'labels.text.fill', stylers: [{ color: '#9e9e9e' }] },
  { featureType: 'administrative.land_parcel', stylers: [{ visibility: 'off' }] },
  { featureType: 'administrative.locality', elementType: 'labels.text.fill', stylers: [{ color: '#bdbdbd' }] },
  { featureType: 'poi', elementType: 'labels.text.fill', stylers: [{ color: '#757575' }] },
  { featureType: 'poi.park', elementType: 'geometry', stylers: [{ color: '#181818' }] },
  { featureType: 'poi.park', elementType: 'labels.text.fill', stylers: [{ color: '#616161' }] },
  { featureType: 'poi.park', elementType: 'labels.text.stroke', stylers: [{ color: '#1b1b1b' }] },
  { featureType: 'road', elementType: 'geometry.fill', stylers: [{ color: '#2c2c2c' }] },
  { featureType: 'road', elementType: 'labels.text.fill', stylers: [{ color: '#8a8a8a' }] },
  { featureType: 'road.arterial', elementType: 'geometry', stylers: [{ color: '#373737' }] },
  { featureType: 'road.highway', elementType: 'geometry', stylers: [{ color: '#3c3c3c' }] },
  { featureType: 'road.highway.controlled_access', elementType: 'geometry', stylers: [{ color: '#4e4e4e' }] },
  { featureType: 'road.local', elementType: 'labels.text.fill', stylers: [{ color: '#616161' }] },
  { featureType: 'transit', elementType: 'labels.text.fill', stylers: [{ color: '#757575' }] },
  { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#000000' }] },
  { featureType: 'water', elementType: 'labels.text.fill', stylers: [{ color: '#3d3d3d' }] },
];

const BASE_BOTTOM = 25;
const BUTTON_GAP = 20;

export function FullMapScreen({ onClose }: FullMapScreenProps) {
  const theme = useTheme();
  const { colors, severity, spacing, radius, sizing, scheme } = theme;
  const insets = useSafeAreaInsets();

  const [placeLabel, setPlaceLabel] = useState<string | null>(null);
  const [selectedAlert, setSelectedAlert] = useState<MapAlert | null>(null);
  const [legendOpen, setLegendOpen] = useState(false);
  const [mapSettingsOpen, setMapSettingsOpen] = useState(false);
  const [iconsReady, setIconsReady] = useState(false);

  const [markerSize, setMarkerSize] = useState<MarkerSize>('medium');
  const [buttonSizePref, setButtonSizePref] = useState<ButtonSize>('medium');
  const [buttonPosition, setButtonPosition] = useState<ButtonPosition>('center');
  const [simpleMap, setSimpleMap] = useState(false);

  const markerScale = MARKER_SIZE_SCALE[markerSize];
  const buttonScale = BUTTON_SIZE_SCALE[buttonSizePref];
  const controlButtonSize = sizing.touchTarget.preferredPrimary * buttonScale;
  const isSideLayout = buttonPosition === 'side-right';

  const mapRef = useRef<MapView>(null);
  const [region, setRegion] = useState<Region | null>(null);
  const [currentRegion, setCurrentRegion] = useState(region);
  const [heading, setHeading] = useState<number | null>(null);

  // Give markers one extra tick to paint before freezing tracksViewChanges.
  useEffect(() => {
    const timeout = setTimeout(() => setIconsReady(true), 500);
    return () => clearTimeout(timeout);
  }, []);

  // Track the user's live position - falls back to the app's fixed home
  // location if permission is denied, so the map isn't stuck loading forever.
  useEffect(() => {
    let subscription: Location.LocationSubscription;

    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setRegion({ ...HOME_LOCATION, latitudeDelta: 0.2, longitudeDelta: 0.2 });
        return;
      }

      const last = await Location.getLastKnownPositionAsync({});
      if (last) {
        setRegion({
          latitude: last.coords.latitude,
          longitude: last.coords.longitude,
          latitudeDelta: 0.2,
          longitudeDelta: 0.2,
        });
      }

      subscription = await Location.watchPositionAsync(
        { accuracy: Location.Accuracy.Balanced, timeInterval: 5000, distanceInterval: 10 },
        (location) => {
          setRegion((prev) => ({
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
            latitudeDelta: prev?.latitudeDelta ?? 0.2,
            longitudeDelta: prev?.longitudeDelta ?? 0.2,
          }));
        }
      );
    })();

    return () => subscription?.remove();
  }, []);

  // Track device heading (compass direction) for the user location marker's
  // direction cone. Throttled to a 5° threshold to avoid re-rendering on jitter.
  useEffect(() => {
    let subscription: Location.LocationSubscription;

    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') return;

      subscription = await Location.watchHeadingAsync((headingData) => {
        const newHeading = headingData.trueHeading >= 0 ? headingData.trueHeading : headingData.magHeading;
        setHeading((prev) => (prev === null || Math.abs(prev - newHeading) > 5 ? newHeading : prev));
      });
    })();

    return () => subscription?.remove();
  }, []);

  // Resolve a human-readable place label for the header.
  useEffect(() => {
    if (!region) return;

    (async () => {
      try {
        const results = await Location.reverseGeocodeAsync({ latitude: region.latitude, longitude: region.longitude });
        const place = results[0];
        if (place) {
          const label = [place.district ?? place.subregion, place.city].filter(Boolean).join(', ');
          setPlaceLabel(label || place.city || null);
        }
      } catch (err) {
        console.error('Reverse geocode failed:', err);
      }
    })();
  }, [region?.latitude, region?.longitude]);

  const recenter = () => {
    if (!region) return;
    mapRef.current?.animateToRegion({
      latitude: region.latitude,
      longitude: region.longitude,
      latitudeDelta: currentRegion?.latitudeDelta ?? 0.2,
      longitudeDelta: currentRegion?.longitudeDelta ?? 0.2,
    });
  };

  const zoomIn = () => {
    if (!currentRegion) return;
    mapRef.current?.animateToRegion({
      ...currentRegion,
      latitudeDelta: currentRegion.latitudeDelta / 1.5,
      longitudeDelta: currentRegion.longitudeDelta / 1.5,
    });
  };

  const zoomOut = () => {
    if (!currentRegion) return;
    mapRef.current?.animateToRegion({
      ...currentRegion,
      latitudeDelta: currentRegion.latitudeDelta * 1.5,
      longitudeDelta: currentRegion.longitudeDelta * 1.5,
    });
  };

  // Only one overlay (alert detail, legend, or map settings) should ever be
  // open at once - opening one always closes the others.
  const openAlert = (alert: MapAlert) => {
    setLegendOpen(false);
    setMapSettingsOpen(false);
    setSelectedAlert(alert);
  };

  const toggleLegend = () => {
    setSelectedAlert(null);
    setMapSettingsOpen(false);
    setLegendOpen((prev) => !prev);
  };

  const toggleMapSettings = () => {
    setSelectedAlert(null);
    setLegendOpen(false);
    setMapSettingsOpen((prev) => !prev);
  };

  const header = (
    <View style={[styles.topStack, { top: insets.top + 12 }]}>
      <View
        style={[
          styles.headerRow,
          { backgroundColor: colors.surface, borderColor: colors.hairline, borderRadius: radius.card, padding: spacing.cardPadding },
        ]}
      >
        <Pressable
          style={[styles.headerIconButton, { width: sizing.touchTarget.minimum, height: sizing.touchTarget.minimum }]}
          onPress={onClose}
          accessibilityLabel="Close full map"
        >
          <Ionicons name="chevron-back" size={20} color={colors.ink} />
        </Pressable>

        <View style={styles.headerText}>
          <RText variant="eyebrowLabel" color={colors.ink3}>
            MAP
          </RText>
          <View style={styles.locationRow}>
            <Ionicons name="location" size={16} color={colors.ink} />
            {placeLabel ? (
              <RText variant="bodyEmphasis" color={colors.ink}>
                {placeLabel}
              </RText>
            ) : (
              <ActivityIndicator size="small" color={colors.ink} />
            )}
          </View>
        </View>

        <Pressable
          style={[styles.headerIconButton, { width: sizing.touchTarget.minimum, height: sizing.touchTarget.minimum }]}
          onPress={toggleMapSettings}
          accessibilityLabel="Map settings"
        >
          <Ionicons name="options-outline" size={20} color={colors.ink2} />
        </Pressable>
      </View>
    </View>
  );

  if (!region) {
    return (
      <View style={[styles.screen, { backgroundColor: colors.bg }]}>
        <MapView
          style={StyleSheet.absoluteFillObject}
          customMapStyle={scheme === 'dark' ? DARK_MAP_STYLE : []}
          mapType={Platform.OS === 'ios' && scheme === 'dark' ? 'mutedStandard' : 'standard'}
        />
        {header}
      </View>
    );
  }

  return (
    <View style={[styles.screen, { backgroundColor: colors.bg }]}>
      <MapView
        style={StyleSheet.absoluteFillObject}
        region={region}
        ref={mapRef}
        onRegionChangeComplete={setCurrentRegion}
        showsMyLocationButton={false}
        showsUserLocation={false}
        customMapStyle={scheme === 'dark' ? DARK_MAP_STYLE : []}
        mapType={Platform.OS === 'ios' && scheme === 'dark' ? 'mutedStandard' : 'standard'}
      >
        <Marker coordinate={{ latitude: region.latitude, longitude: region.longitude }} anchor={{ x: 0.5, y: 0.78 }} tracksViewChanges flat>
          <View style={styles.userLocationWrapper}>
            <View style={{ transform: [{ rotate: `${heading ?? 0}deg` }], alignItems: 'center', opacity: heading !== null ? 1 : 0 }}>
              <View style={[styles.headingCone, { borderBottomColor: colors.accent }]} />
              <View
                style={[
                  styles.userLocationDot,
                  {
                    width: sizing.icon.large * markerScale,
                    height: sizing.icon.large * markerScale,
                    borderRadius: (sizing.icon.large * markerScale) / 2,
                    backgroundColor: colors.accent,
                    borderColor: colors.surface,
                  },
                ]}
              />
            </View>
          </View>
        </Marker>

        <Marker
          coordinate={HOME_LOCATION}
          title={HOME_IN_DANGER ? 'Your home - Danger' : 'Your home - Safe'}
          description={HOME_IN_DANGER ? 'Leave the area if possible.' : 'No action needed.'}
          pinColor={HOME_IN_DANGER ? severity.emergency.fg : severity.safe.fg}
        />

        {MAP_ALERTS.map((alert) => {
          const tone = severity[alert.tone];
          return (
            <Fragment key={alert.id}>
              <Circle
                center={alert.coordinate}
                radius={alert.radius}
                strokeColor={withAlpha(tone.fg, 0.7)}
                fillColor={withAlpha(tone.fg, 0.18)}
                strokeWidth={3}
              />
              <Marker coordinate={alert.coordinate} onPress={() => openAlert(alert)} tracksViewChanges={!iconsReady}>
                <View
                  style={[
                    styles.alertMarker,
                    {
                      width: sizing.avatar.large * markerScale,
                      height: sizing.avatar.large * markerScale,
                      borderRadius: (sizing.avatar.large * markerScale) / 2,
                      backgroundColor: tone.fg,
                    },
                  ]}
                >
                  <Ionicons
                    name={simpleMap ? SIMPLE_ALERT_ICON : alert.icon}
                    size={sizing.icon.large * markerScale}
                    color="white"
                  />
                </View>
              </Marker>
            </Fragment>
          );
        })}
      </MapView>

      {header}

      {/* Floating control cluster: legend, zoom out/in, locate. */}
      <View
        style={[
          isSideLayout ? styles.sideCluster : styles.controlCluster,
          isSideLayout
            ? { top: insets.top + 90, bottom: BASE_BOTTOM + insets.bottom, right: 16 }
            : { bottom: BASE_BOTTOM + insets.bottom, justifyContent: 'center' },
        ]}
      >
        {!simpleMap && (
          <Pressable
            style={[
              styles.controlButton,
              { width: controlButtonSize, height: controlButtonSize, borderRadius: controlButtonSize / 2, backgroundColor: colors.surface },
            ]}
            onPress={toggleLegend}
            accessibilityLabel={legendOpen ? 'Hide alert legend' : 'Show alert legend'}
          >
            <Ionicons name="list" size={24 * buttonScale} color={colors.ink} />
          </Pressable>
        )}
        <Pressable
          style={[
            styles.controlButton,
            { width: controlButtonSize, height: controlButtonSize, borderRadius: controlButtonSize / 2, backgroundColor: colors.surface },
          ]}
          onPress={zoomOut}
          accessibilityLabel="Zoom out"
        >
          <Ionicons name="remove" size={28 * buttonScale} color={colors.ink} />
        </Pressable>
        <Pressable
          style={[
            styles.controlButton,
            { width: controlButtonSize, height: controlButtonSize, borderRadius: controlButtonSize / 2, backgroundColor: colors.surface },
          ]}
          onPress={zoomIn}
          accessibilityLabel="Zoom in"
        >
          <Ionicons name="add" size={28 * buttonScale} color={colors.ink} />
        </Pressable>
        <Pressable
          style={[
            styles.controlButton,
            { width: controlButtonSize, height: controlButtonSize, borderRadius: controlButtonSize / 2, backgroundColor: colors.surface },
          ]}
          onPress={recenter}
          accessibilityLabel="Center on my location"
        >
          <Ionicons name="locate" size={28 * buttonScale} color={colors.ink} />
        </Pressable>
      </View>

      {/* Legend overlay - severity tones, skipped in simple-map mode since every alert looks the same */}
      {legendOpen && !simpleMap && (
        <RCenteredOverlay title="Alert severity" onDismiss={() => setLegendOpen(false)} maxWidth={340}>
          {SEVERITY_LEGEND_ORDER.map((tone) => {
            const level = severityLevels[tone];
            return (
              <View key={tone} style={[styles.legendRow, { gap: spacing.scale[3] }]}>
                <View
                  style={[
                    styles.legendSwatch,
                    { width: sizing.avatar.medium, height: sizing.avatar.medium, borderRadius: sizing.avatar.medium / 2, backgroundColor: severity[tone].fg },
                  ]}
                >
                  <Ionicons name={level.icon} size={sizing.icon.small} color="white" />
                </View>
                <RText variant="secondary" color={colors.ink}>
                  {level.label}
                </RText>
              </View>
            );
          })}
        </RCenteredOverlay>
      )}

      {/* Map settings overlay - marker/button size & position, simple map */}
      {mapSettingsOpen && (
        <RCenteredOverlay title="Map settings" onDismiss={() => setMapSettingsOpen(false)}>
          <ScrollView showsVerticalScrollIndicator={false} nestedScrollEnabled>
            <View style={{ gap: spacing.scale[4] }}>
              <View style={{ gap: spacing.scale[2] }}>
                <RText variant="caption" color={colors.ink3}>
                  Marker size
                </RText>
                <ROptionSelector options={MARKER_SIZE_OPTIONS} value={markerSize} onChange={setMarkerSize} theme={{ colors, severity, spacing, radius, sizing, scheme, typography: undefined as never }} />
              </View>

              <View style={{ gap: spacing.scale[2] }}>
                <RText variant="caption" color={colors.ink3}>
                  Button size
                </RText>
                <ROptionSelector options={BUTTON_SIZE_OPTIONS} value={buttonSizePref} onChange={setButtonSizePref} theme={{ colors, severity, spacing, radius, sizing, scheme, typography: undefined as never }} />
              </View>

              <View style={{ gap: spacing.scale[2] }}>
                <RText variant="caption" color={colors.ink3}>
                  Button position
                </RText>
                <ROptionSelector options={BUTTON_POSITION_OPTIONS} value={buttonPosition} onChange={setButtonPosition} theme={{ colors, severity, spacing, radius, sizing, scheme, typography: undefined as never }} />
              </View>

              <RToggleRow
                label="Simple map"
                description="Shows every alert the same way, instead of a different icon per hazard type"
                value={simpleMap}
                onChange={setSimpleMap}
                theme={{ colors, severity, spacing, radius, sizing, scheme, typography: undefined as never }}
              />
            </View>
          </ScrollView>
        </RCenteredOverlay>
      )}

      <AlertDetailModal alert={selectedAlert} onClose={() => setSelectedAlert(null)} />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  topStack: {
    position: 'absolute',
    left: 16,
    right: 16,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderWidth: 1,
    elevation: 6,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 6,
  },
  headerIconButton: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerText: {
    flex: 1,
    gap: 6,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  userLocationWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  userLocationDot: {
    borderWidth: 3,
    elevation: 4,
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 3,
  },
  headingCone: {
    width: 0,
    height: 0,
    borderLeftWidth: 8,
    borderRightWidth: 8,
    borderBottomWidth: 14,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    marginBottom: 2,
  },
  alertMarker: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  controlCluster: {
    position: 'absolute',
    bottom: BASE_BOTTOM,
    left: 0,
    right: 0,
    paddingHorizontal: 16,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: BUTTON_GAP,
  },
  sideCluster: {
    position: 'absolute',
    flexDirection: 'column',
    justifyContent: 'center',
    gap: BUTTON_GAP,
  },
  controlButton: {
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  legendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
  },
  legendSwatch: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
