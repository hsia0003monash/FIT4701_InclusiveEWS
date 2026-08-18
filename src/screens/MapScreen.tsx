import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { Fragment, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
  useWindowDimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Location from 'expo-location';
import MapView, { Circle, Marker } from 'react-native-maps';

import { RCenteredOverlay } from '../components/RCenteredOverlay';
import { RText } from '../components/RText';
import { useTheme } from '../theme/useTheme';
import { Hazard, HazardType, HAZARD_STYLES, toRgba } from '../data/hazards';

// ---------------------------------------------------------------------------
// Layout constants
// ---------------------------------------------------------------------------

const BUTTON_GAP = 20;
const BASE_BOTTOM = 25;

interface MapScreenProps {
  hazards: Hazard[];
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function MapScreen({ hazards }: MapScreenProps) {
  const { colors, severity, spacing, radius, sizing } = useTheme();
  const { height } = useWindowDimensions();
  const [placeLabel, setPlaceLabel] = useState<string | null>(null);
  const [selectedHazard, setSelectedHazard] = useState<Hazard | null>(null);
  const [legendOpen, setLegendOpen] = useState(false);
  const [iconsReady, setIconsReady] = useState(false);

  const activeHazards = hazards.filter((h) => h.status === 'active');

  const mapRef = useRef<MapView>(null);

  const [region, setRegion] = useState<{
    latitude: number;
    longitude: number;
    latitudeDelta: number;
    longitudeDelta: number;
  } | null>(null);
  const [currentRegion, setCurrentRegion] = useState(region);
  const [heading, setHeading] = useState<number | null>(null);

  // Give markers one extra tick to paint before freezing tracksViewChanges
  useEffect(() => {
    const timeout = setTimeout(() => setIconsReady(true), 500);
    return () => clearTimeout(timeout);
  }, []);

  // Track the user's live position
  useEffect(() => {
    let subscription: Location.LocationSubscription;

    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') return;

      // 1. Try to get last-known location instantly (near-zero latency)
      const last = await Location.getLastKnownPositionAsync({});
      if (last) {
        setRegion({
          latitude: last.coords.latitude,
          longitude: last.coords.longitude,
          latitudeDelta: 0.05,
          longitudeDelta: 0.05,
        });
      }

      // 2. Then start watching for a precise, live-updating fix
      subscription = await Location.watchPositionAsync(
        { accuracy: Location.Accuracy.Balanced, timeInterval: 5000, distanceInterval: 10 },
        (location) => {
          setRegion((prev) => ({
            ...location.coords,
            latitudeDelta: prev?.latitudeDelta ?? 0.05,
            longitudeDelta: prev?.longitudeDelta ?? 0.05,
          }));
        }
      );
    })();

    return () => subscription?.remove();
  }, []);

  // Track device heading (compass direction) for the user location marker's
  // direction cone. Throttled to a 5° threshold to avoid excessive re-renders
  // from raw compass jitter.
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

  // Resolve a human-readable place label for the header
  useEffect(() => {
    if (!region) return;

    (async () => {
      try {
        const results = await Location.reverseGeocodeAsync({
          latitude: region.latitude,
          longitude: region.longitude,
        });
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
      latitudeDelta: currentRegion?.latitudeDelta ?? 0.05,
      longitudeDelta: currentRegion?.longitudeDelta ?? 0.05,
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

  // Only one centered overlay (hazard card or legend) should ever be open at once —
  // opening one always closes the other, which matters especially for the
  // restricted-field-of-view persona this screen is designed around.
  const openHazard = (hazard: Hazard) => {
    setLegendOpen(false);
    setSelectedHazard(hazard);
  };

  const toggleLegend = () => {
    setSelectedHazard(null);
    setLegendOpen((prev) => !prev);
  };

  // -------------------------------------------------------------------------
  // Loading state — no region yet
  // -------------------------------------------------------------------------
  if (!region) {
    return (
      <View style={[styles.screen, { backgroundColor: colors.bg }]}>
        <SafeAreaView edges={['top']} style={styles.flex}>
          <ScrollView contentContainerStyle={[styles.content, { padding: spacing.screenPadding, gap: spacing.screenPadding }]}>
            <View style={styles.headerRow}>
              <View style={styles.headerText}>
                <RText variant="eyebrowLabel" color={colors.ink3}>
                  MAP
                </RText>
                <View style={styles.locationRow}>
                  <Ionicons name="location" size={16} color={colors.ink} />
                  <ActivityIndicator size="small" color={colors.ink} />
                </View>
              </View>
              <View
                style={[
                  styles.avatar,
                  {
                    width: sizing.avatar.medium,
                    height: sizing.avatar.medium,
                    borderRadius: sizing.avatar.medium / 2,
                    backgroundColor: colors.ink,
                    borderColor: colors.hairline,
                  },
                ]}
                accessibilityRole="button"
                accessibilityLabel="Your profile"
              >
                <RText variant="secondary" color={colors.bg}>
                  SL
                </RText>
              </View>
            </View>
            <View style={[styles.mapContainer, { height: height * 0.75 }]}>
              <MapView style={styles.map} />
            </View>
          </ScrollView>
        </SafeAreaView>
      </View>
    );
  }

  // -------------------------------------------------------------------------
  // Main render
  // -------------------------------------------------------------------------
  return (
    <View style={[styles.screen, { backgroundColor: colors.bg }]}>
      <SafeAreaView edges={['top']} style={styles.flex}>
        <ScrollView contentContainerStyle={[styles.content, { padding: spacing.screenPadding, gap: spacing.screenPadding }]}>
          <View style={styles.headerRow}>
            <View style={styles.headerText}>
              <RText variant="eyebrowLabel" color={colors.ink3}>
                MAP
              </RText>
              <View style={styles.locationRow}>
                <Ionicons name="location" size={16} color={colors.ink} />
                <RText variant="bodyEmphasis" color={colors.ink}>
                  {placeLabel ?? 'Locating…'}
                </RText>
              </View>
            </View>
            <View
              style={[
                styles.avatar,
                {
                  width: sizing.avatar.medium,
                  height: sizing.avatar.medium,
                  borderRadius: sizing.avatar.medium / 2,
                  backgroundColor: colors.ink,
                  borderColor: colors.hairline,
                },
              ]}
              accessibilityRole="button"
              accessibilityLabel="Your profile"
            >
              <RText variant="secondary" color={colors.bg}>
                SL
              </RText>
            </View>
          </View>

          <View style={[styles.mapContainer, { height: height * 0.75 }]}>
            <MapView
              style={styles.map}
              region={region}
              ref={mapRef}
              onRegionChangeComplete={setCurrentRegion}
              showsMyLocationButton={false}
              showsUserLocation={false}
            >
              <Marker
                coordinate={{ latitude: region.latitude, longitude: region.longitude }}
                anchor={{ x: 0.5, y: 0.78 }}
                tracksViewChanges
                flat
              >
                <View style={styles.userLocationWrapper}>
                  <View
                    style={{
                      transform: [{ rotate: `${heading ?? 0}deg` }],
                      alignItems: 'center',
                      opacity: heading !== null ? 1 : 0,
                    }}
                  >
                    <View style={[styles.headingCone, { borderBottomColor: colors.accent }]} />
                    <View
                      style={[
                        styles.userLocationDot,
                        {
                          width: sizing.icon.large,
                          height: sizing.icon.large,
                          borderRadius: sizing.icon.large / 2,
                          backgroundColor: colors.accent,
                          borderColor: colors.surface,
                        },
                      ]}
                    />
                  </View>
                </View>
              </Marker>

              {activeHazards.map((hazard) => {
                const style = HAZARD_STYLES[hazard.type];
                return (
                  <Fragment key={hazard.id}>
                    <Circle
                      center={{ latitude: hazard.lat, longitude: hazard.long }}
                      radius={hazard.effectRadius}
                      strokeColor={toRgba(style.theme, 0.8)}
                      fillColor={toRgba(style.theme, 0.15)}
                      strokeWidth={2}
                    />
                    <Marker
                      coordinate={{ latitude: hazard.lat, longitude: hazard.long }}
                      onPress={() => openHazard(hazard)}
                      tracksViewChanges={!iconsReady}
                    >
                      <View
                        style={[
                          styles.hazardMarker,
                          {
                            width: sizing.avatar.large,
                            height: sizing.avatar.large,
                            borderRadius: sizing.avatar.large / 2,
                            backgroundColor: toRgba(style.theme, 1),
                          },
                        ]}
                      >
                        <MaterialCommunityIcons name={style.icon} size={sizing.icon.large} color="white" />
                      </View>
                    </Marker>
                  </Fragment>
                );
              })}
            </MapView>

            {/* Hazard legend overlay */}
            {legendOpen && (
              <RCenteredOverlay title="Hazard types" onDismiss={() => setLegendOpen(false)} maxWidth={340}>
                <ScrollView style={styles.legendScroll} showsVerticalScrollIndicator={false}>
                  {(Object.keys(HAZARD_STYLES) as HazardType[]).map((type) => {
                    const style = HAZARD_STYLES[type];
                    return (
                      <View key={type} style={[styles.legendRow, { gap: spacing.scale[3] }]}>
                        <View
                          style={[
                            styles.legendSwatch,
                            {
                              width: sizing.icon.hero,
                              height: sizing.icon.hero,
                              borderRadius: sizing.icon.hero / 2,
                              backgroundColor: toRgba(style.theme, 1),
                            },
                          ]}
                        >
                          <MaterialCommunityIcons name={style.icon} size={sizing.icon.small} color="white" />
                        </View>
                        <RText variant="secondary" color={colors.ink}>
                          {type}
                        </RText>
                      </View>
                    );
                  })}
                </ScrollView>
              </RCenteredOverlay>
            )}

            {/* Hazard detail overlay */}
            {selectedHazard && (
              <RCenteredOverlay title={selectedHazard.type} onDismiss={() => setSelectedHazard(null)}>
                <View style={[styles.hazardCardIcon, { width: sizing.icon.hero, height: sizing.icon.hero, borderRadius: sizing.icon.hero / 2, backgroundColor: toRgba(HAZARD_STYLES[selectedHazard.type].theme, 1) }]}>
                  <MaterialCommunityIcons
                    name={HAZARD_STYLES[selectedHazard.type].icon}
                    size={sizing.icon.small}
                    color="white"
                  />
                </View>

                <View
                  style={[
                    styles.statusBadge,
                    {
                      borderRadius: radius.pill,
                      paddingHorizontal: spacing.scale[4],
                      paddingVertical: spacing.scale[1],
                      backgroundColor:
                        selectedHazard.status === 'active' ? severity.emergency.bg : severity.safe.bg,
                      borderColor:
                        selectedHazard.status === 'active' ? severity.emergency.border : severity.safe.border,
                    },
                  ]}
                >
                  <RText
                    variant="caption"
                    color={selectedHazard.status === 'active' ? severity.emergency.fg : severity.safe.fg}
                  >
                    {selectedHazard.status === 'active' ? 'Active' : 'Inactive'}
                  </RText>
                </View>

                <RText variant="body" color={colors.ink2}>
                  {selectedHazard.description}
                </RText>
              </RCenteredOverlay>
            )}

            {/* Centralized control cluster — legend, zoom out/in, locate */}
            <View style={styles.controlCluster}>
              <Pressable
                style={[
                  styles.controlButton,
                  {
                    width: sizing.touchTarget.preferredPrimary,
                    height: sizing.touchTarget.preferredPrimary,
                    borderRadius: sizing.touchTarget.preferredPrimary / 2,
                    backgroundColor: colors.surface,
                  },
                ]}
                onPress={toggleLegend}
                accessibilityLabel={legendOpen ? 'Hide hazard legend' : 'Show hazard legend'}
              >
                <Ionicons name="list" size={24} color={colors.ink} />
              </Pressable>
              <Pressable
                style={[
                  styles.controlButton,
                  {
                    width: sizing.touchTarget.preferredPrimary,
                    height: sizing.touchTarget.preferredPrimary,
                    borderRadius: sizing.touchTarget.preferredPrimary / 2,
                    backgroundColor: colors.surface,
                  },
                ]}
                onPress={zoomOut}
                accessibilityLabel="Zoom out"
              >
                <Ionicons name="remove" size={28} color={colors.ink} />
              </Pressable>
              <Pressable
                style={[
                  styles.controlButton,
                  {
                    width: sizing.touchTarget.preferredPrimary,
                    height: sizing.touchTarget.preferredPrimary,
                    borderRadius: sizing.touchTarget.preferredPrimary / 2,
                    backgroundColor: colors.surface,
                  },
                ]}
                onPress={zoomIn}
                accessibilityLabel="Zoom in"
              >
                <Ionicons name="add" size={28} color={colors.ink} />
              </Pressable>
              <Pressable
                style={[
                  styles.controlButton,
                  {
                    width: sizing.touchTarget.preferredPrimary,
                    height: sizing.touchTarget.preferredPrimary,
                    borderRadius: sizing.touchTarget.preferredPrimary / 2,
                    backgroundColor: colors.surface,
                  },
                ]}
                onPress={recenter}
                accessibilityLabel="Center on my location"
              >
                <Ionicons name="locate" size={28} color={colors.ink} />
              </Pressable>
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  flex: {
    flex: 1,
  },
  content: {},
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
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mapContainer: {
    borderRadius: 0,
    overflow: 'hidden',
    marginTop: 16,
  },
  map: {
    flex: 1,
  },
  hazardMarker: {
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
  userLocationWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
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
  hazardCardIcon: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusBadge: {
    alignSelf: 'flex-start',
    borderWidth: 1,
  },
  controlCluster: {
    position: 'absolute',
    bottom: BASE_BOTTOM,
    left: 0,
    right: 0,
    flexDirection: 'row',
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
  legendScroll: {
    flexGrow: 0,
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
