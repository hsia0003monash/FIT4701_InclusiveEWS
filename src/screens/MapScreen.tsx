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

import { RText } from '../components/RText';
import { useTheme } from '../theme/useTheme';

// ---------------------------------------------------------------------------
// Hazard data model
// ---------------------------------------------------------------------------

type HazardType =
  | 'Fire'
  | 'Chemical'
  | 'Thunderstorm'
  | 'Hailstorm'
  | 'Storm'
  | 'Cyclone'
  | 'Tornado'
  | 'Extreme winds'
  | 'Earthquake'
  | 'Misc';

type HazardStatus = 'active' | 'inactive';

interface Hazard {
  id: string;
  effectRadius: number;
  lat: number;
  long: number;
  type: HazardType;
  status: HazardStatus;
  description: string;
}

interface HazardColour {
  id: HazardType;
  r: number;
  g: number;
  b: number;
  a: number;
}

const HAZARD_STYLES: Record<
  HazardType,
  { icon: keyof typeof MaterialCommunityIcons.glyphMap; theme: HazardColour }
> = {
  Fire: {
    icon: 'fire',
    theme: { id: 'Fire', r: 234, g: 88, b: 12, a: 1 }, // burnt orange
  },
  Chemical: {
    icon: 'flask-outline',
    theme: { id: 'Chemical', r: 132, g: 204, b: 22, a: 1 }, // toxic green
  },
  Thunderstorm: {
    icon: 'weather-lightning',
    theme: { id: 'Thunderstorm', r: 99, g: 102, b: 241, a: 1 }, // indigo-violet
  },
  Hailstorm: {
    icon: 'weather-hail',
    theme: { id: 'Hailstorm', r: 56, g: 189, b: 248, a: 1 }, // icy blue
  },
  Storm: {
    icon: 'weather-pouring',
    theme: { id: 'Storm', r: 71, g: 85, b: 105, a: 1 }, // slate grey-blue
  },
  Cyclone: {
    icon: 'weather-hurricane',
    theme: { id: 'Cyclone', r: 168, g: 85, b: 247, a: 1 }, // deep purple
  },
  Tornado: {
    icon: 'weather-tornado',
    theme: { id: 'Tornado', r: 100, g: 116, b: 139, a: 1 }, // dark slate
  },
  'Extreme winds': {
    icon: 'weather-windy',
    theme: { id: 'Extreme winds', r: 20, g: 184, b: 166, a: 1 }, // teal
  },
  Earthquake: {
    icon: 'waveform',
    theme: { id: 'Earthquake', r: 146, g: 64, b: 14, a: 1 }, // earthy brown
  },
  Misc: {
    icon: 'alert-circle-outline',
    theme: { id: 'Misc', r: 107, g: 114, b: 128, a: 1 }, // neutral grey
  },
};

const toRgba = (c: HazardColour, alpha?: number) =>
  `rgba(${c.r}, ${c.g}, ${c.b}, ${alpha ?? c.a})`;

const HAZARDS: Hazard[] = [
  // --- Active: one per type ---
  {
    id: 'haz-001',
    type: 'Fire',
    status: 'active',
    effectRadius: 8000,
    lat: -37.8757,
    long: 145.3527,
    description:
      'Bushfire burning in the Dandenong Ranges, uncontrolled. Residents in affected areas should leave immediately if the path to do so is clear.',
  },
  {
    id: 'haz-002',
    type: 'Chemical',
    status: 'active',
    effectRadius: 3000,
    lat: -38.2333,
    long: 146.4167,
    description:
      'Chemical leak reported at an industrial facility in the Latrobe Valley. Nearby residents advised to stay indoors and close windows.',
  },
  {
    id: 'haz-003',
    type: 'Thunderstorm',
    status: 'active',
    effectRadius: 15000,
    lat: -37.6667,
    long: 145.4,
    description:
      'Severe thunderstorm warning for the Yarra Valley, with damaging winds and heavy rainfall expected to continue through the evening.',
  },
  {
    id: 'haz-004',
    type: 'Hailstorm',
    status: 'active',
    effectRadius: 9000,
    lat: -37.5622,
    long: 143.8503,
    description:
      'Hailstorm moving through Ballarat, with hailstones up to 2cm reported. Motorists advised to seek shelter and avoid driving.',
  },
  {
    id: 'haz-005',
    type: 'Storm',
    status: 'active',
    effectRadius: 12000,
    lat: -38.3667,
    long: 145.0333,
    description:
      'Storm system moving across the Mornington Peninsula, bringing coastal flooding and strong winds to low-lying areas.',
  },
  {
    id: 'haz-006',
    type: 'Cyclone',
    status: 'active',
    effectRadius: 40000,
    lat: -37.95,
    long: 147.6167,
    description:
      'Ex-tropical cyclone system tracking toward Gippsland, expected to bring destructive winds and heavy rainfall over the next 24 hours.',
  },
  {
    id: 'haz-007',
    type: 'Tornado',
    status: 'active',
    effectRadius: 5000,
    lat: -36.1219,
    long: 146.8887,
    description:
      'Tornado warning issued for areas near Wodonga following confirmed funnel cloud sightings. Seek shelter immediately.',
  },
  {
    id: 'haz-008',
    type: 'Extreme winds',
    status: 'active',
    effectRadius: 20000,
    lat: -35.25,
    long: 142.6667,
    description:
      'Extreme wind warning across the Mallee region, with gusts exceeding 100km/h expected to continue overnight.',
  },
  {
    id: 'haz-009',
    type: 'Earthquake',
    status: 'active',
    effectRadius: 25000,
    lat: -36.757,
    long: 144.2794,
    description:
      'A moderate earthquake has been recorded near Bendigo. Aftershocks are possible; residents advised to check for structural damage before re-entering buildings.',
  },
  {
    id: 'haz-010',
    type: 'Misc',
    status: 'active',
    effectRadius: 6000,
    lat: -38.1499,
    long: 144.3617,
    description:
      'Major road closures and localised flooding reported near Geelong following heavy overnight rainfall.',
  },

  // --- Inactive: 3 additional ---
  {
    id: 'haz-011',
    type: 'Fire',
    status: 'inactive',
    effectRadius: 7000,
    lat: -37.0167,
    long: 144.0,
    description: 'Grassfire near Bendigo has been contained and extinguished. No further threat to the area.',
  },
  {
    id: 'haz-012',
    type: 'Storm',
    status: 'inactive',
    effectRadius: 10000,
    lat: -38.15,
    long: 141.6167,
    description: 'Storm system that passed through Warrnambool overnight has cleared. Coastal flood warnings have been lifted.',
  },
  {
    id: 'haz-013',
    type: 'Hailstorm',
    status: 'inactive',
    effectRadius: 8500,
    lat: -36.7581,
    long: 141.618,
    description:
      'Hailstorm that affected Horsham earlier today has passed. Minor crop and property damage reported in surrounding areas.',
  },

  // --- Overlapping-radius examples ---
  {
    id: 'haz-014',
    type: 'Thunderstorm',
    status: 'active',
    effectRadius: 10000,
    lat: -37.8136, // Melbourne CBD
    long: 144.9631,
    description:
      'Severe thunderstorm cell tracking over central Melbourne, bringing heavy rain and lightning strikes.',
  },
  {
    id: 'haz-015',
    type: 'Extreme winds',
    status: 'active',
    effectRadius: 9000,
    lat: -37.85, // close to haz-014 — radii overlap
    long: 144.99,
    description:
      'Damaging wind gusts affecting inner south-eastern suburbs, with fallen trees and power outages reported.',
  },
  {
    id: 'haz-016',
    type: 'Fire',
    status: 'active',
    effectRadius: 6000,
    lat: -37.7, // close to haz-003 — radii overlap
    long: 145.38,
    description: 'Fast-moving grassfire near Lilydale, spreading toward nearby residential areas.',
  },
];

const ACTIVE_HAZARDS = HAZARDS.filter((h) => h.status === 'active');

// ---------------------------------------------------------------------------
// Layout constants
// ---------------------------------------------------------------------------

const BUTTON_SIZE = 70;
const BUTTON_GAP = 20;
const BASE_BOTTOM = 25;

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function MapScreen() {
  const { colors, severity, spacing, radius, sizing } = useTheme();
  const { height } = useWindowDimensions();
  const [placeLabel, setPlaceLabel] = useState<string | null>(null);
  const [selectedHazard, setSelectedHazard] = useState<Hazard | null>(null);

  const mapRef = useRef<MapView>(null);

  const [region, setRegion] = useState<{
    latitude: number;
    longitude: number;
    latitudeDelta: number;
    longitudeDelta: number;
  } | null>(null);
  const [currentRegion, setCurrentRegion] = useState(region);

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

  // -------------------------------------------------------------------------
  // Loading state — no region yet
  // -------------------------------------------------------------------------
  if (!region) {
    return (
      <View style={[styles.screen, { backgroundColor: colors.bg }]}>
        <SafeAreaView edges={['top']} style={styles.flex}>
          <ScrollView contentContainerStyle={styles.content}>
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
                style={[styles.avatar, { backgroundColor: colors.ink, borderColor: colors.hairline }]}
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
        <ScrollView contentContainerStyle={styles.content}>
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
              style={[styles.avatar, { backgroundColor: colors.ink, borderColor: colors.hairline }]}
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
              showsUserLocation
            >
              {ACTIVE_HAZARDS.map((hazard) => {
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
                      onPress={() => setSelectedHazard(hazard)}
                    >
                      <View
                        style={[
                          styles.hazardMarker,
                          {
                            width: sizing.avatar.medium,
                            height: sizing.avatar.medium,
                            borderRadius: sizing.avatar.medium / 2,
                            backgroundColor: toRgba(style.theme, 1),
                          },
                        ]}
                      >
                        <MaterialCommunityIcons name={style.icon} size={sizing.icon.medium} color="white" />
                      </View>
                    </Marker>
                  </Fragment>
                );
              })}
            </MapView>

            {/* Hazard detail card */}
            {selectedHazard && (
  <View style={styles.hazardCardOverlay} pointerEvents="box-none">
    {/* Dimming scrim behind the card */}
    <Pressable
      style={StyleSheet.absoluteFillObject}
      onPress={() => setSelectedHazard(null)}
      accessibilityLabel="Dismiss hazard details"
    >
      <View style={[StyleSheet.absoluteFillObject, styles.scrim]} />
    </Pressable>

    <View
      style={[
        styles.hazardCard,
        {
          backgroundColor: colors.surface,
          borderColor: colors.hairline,
          borderRadius: radius.card,
          padding: spacing.cardPadding,
          gap: spacing.scale[4],
        },
      ]}
    >
      <View style={styles.hazardCardHeader}>
        <View style={[styles.hazardCardTitleRow, { gap: spacing.scale[3] }]}>
          <View
            style={[
              styles.hazardCardIcon,
              {
                width: sizing.icon.hero,
                height: sizing.icon.hero,
                borderRadius: sizing.icon.hero / 2,
                backgroundColor: toRgba(HAZARD_STYLES[selectedHazard.type].theme, 1),
              },
            ]}
          >
            <MaterialCommunityIcons
              name={HAZARD_STYLES[selectedHazard.type].icon}
              size={sizing.icon.small}
              color="white"
            />
          </View>
          <RText variant="bodyEmphasis" color={colors.ink}>
            {selectedHazard.type}
          </RText>
        </View>
        <Pressable
  style={[styles.closeButton, { width: sizing.touchTarget.preferredPrimary, height: sizing.touchTarget.preferredPrimary }]}
  onPress={() => setSelectedHazard(null)}
  accessibilityLabel="Close"
>
  <Ionicons name="close" size={sizing.icon.medium} color={colors.ink3} />
</Pressable>
      </View>

      <View
        style={[
          styles.statusBadge,
          {
            borderRadius: radius.pill,
            paddingHorizontal: spacing.scale[4],
            paddingVertical: spacing.scale[1],
            backgroundColor: selectedHazard.status === 'active' ? severity.emergency.bg : severity.safe.bg,
            borderColor: selectedHazard.status === 'active' ? severity.emergency.border : severity.safe.border,
          },
        ]}
      >
        <RText variant="caption" color={selectedHazard.status === 'active' ? severity.emergency.fg : severity.safe.fg}>
          {selectedHazard.status === 'active' ? 'Active' : 'Inactive'}
        </RText>
      </View>

      <RText variant="body" color={colors.ink2}>
        {selectedHazard.description}
      </RText>
    </View>
  </View>
)}

            <Pressable style={styles.locationButton} onPress={recenter}>
              <Ionicons name="locate" size={28} color={colors.ink} />
            </Pressable>

            <View style={styles.zoomControls}>
              <Pressable style={styles.zoomButton} onPress={zoomIn}>
                <Ionicons name="add" size={28} color={colors.ink} />
              </Pressable>
              <Pressable style={styles.zoomButton} onPress={zoomOut}>
                <Ionicons name="remove" size={28} color={colors.ink} />
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
  hazardCardOverlay: {
  ...StyleSheet.absoluteFillObject, // fills the mapContainer exactly
  alignItems: 'center',
  justifyContent: 'center',
  padding: 24, // keeps card off the very edges on small screens
},
hazardCard: {
  width: '100%',
  maxWidth: 340, // keeps the card from stretching edge-to-edge on tablets/landscape
  borderWidth: 1,
  elevation: 6,
  shadowColor: '#000',
  shadowOpacity: 0.15,
  shadowRadius: 6,
},
  hazardCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  hazardCardTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  hazardCardIcon: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusBadge: {
    alignSelf: 'flex-start',
    borderWidth: 1,
  },
  locationButton: {
    position: 'absolute',
    bottom: BASE_BOTTOM,
    right: 20,
    width: BUTTON_SIZE,
    height: BUTTON_SIZE,
    borderRadius: 24,
    backgroundColor: 'white',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  zoomControls: {
    position: 'absolute',
    bottom: BASE_BOTTOM + BUTTON_SIZE + BUTTON_GAP,
    right: 20,
    gap: BUTTON_GAP,
  },
  zoomButton: {
    width: BUTTON_SIZE,
    height: BUTTON_SIZE,
    borderRadius: 24,
    backgroundColor: 'white',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  scrim: {
  backgroundColor: 'rgba(0,0,0,0.35)',
},
closeButton: {
  alignItems: 'center',
  justifyContent: 'center',
},
});
 