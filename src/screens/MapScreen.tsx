import { Ionicons } from '@expo/vector-icons';
import { ScrollView, StyleSheet, View, ActivityIndicator, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { RText } from '../components/RText';
import { useTheme } from '../theme/useTheme';
import MapView, { Marker, Circle }from 'react-native-maps';

import { useEffect, useState, useRef, Fragment } from 'react'

import { useWindowDimensions } from 'react-native';
import * as Location from 'expo-location';

import { MaterialCommunityIcons } from '@expo/vector-icons';

type HazardType = 'Fire' | 'Chemical' | 'Thunderstorm' | 'Hailstorm' | 'Storm' | 'Cyclone' | 'Tornado' | 'Extreme winds' | 'Earthquake' | 'Misc';
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

interface HazardColour{
    id: HazardType;
    r: number;
    g: number;
    b: number;
    a: number;
}

const HAZARD_STYLES: Record<HazardType, { icon: keyof typeof MaterialCommunityIcons.glyphMap; theme: HazardColour }> = {
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
    icon: 'waveform', // seismic-wave-style icon
    theme: { id: 'Earthquake', r: 146, g: 64, b: 14, a: 1 }, // earthy brown
  },
  Misc: {
    icon: 'alert-circle-outline',
    theme: { id: 'Misc', r: 107, g: 114, b: 128, a: 1 }, // neutral grey
  },
};

const toRgba = (c: HazardColour, alpha?: number) =>
  `rgba(${c.r}, ${c.g}, ${c.b}, ${alpha ?? c.a})`;

const BUTTON_SIZE = 70;
const BUTTON_GAP = 20;
const BASE_BOTTOM = 25;

const HAZARDS: Hazard[] = [
  {
    id: 'haz-001',
    type: 'Fire',
    status: 'active',
    effectRadius: 8000,
    lat: -37.8757,
    long: 145.3527,
    description: 'Bushfire burning in the Dandenong Ranges, uncontrolled. Residents in affected areas should leave immediately if the path to do so is clear.',
  },
  {
    id: 'haz-002',
    type: 'Chemical',
    status: 'active',
    effectRadius: 3000,
    lat: -38.2333,
    long: 146.4167,
    description: 'Chemical leak reported at an industrial facility in the Latrobe Valley. Nearby residents advised to stay indoors and close windows.',
  },
  {
    id: 'haz-003',
    type: 'Thunderstorm',
    status: 'active',
    effectRadius: 15000,
    lat: -37.6667,
    long: 145.4000,
    description: 'Severe thunderstorm warning for the Yarra Valley, with damaging winds and heavy rainfall expected to continue through the evening.',
  },
  {
    id: 'haz-004',
    type: 'Hailstorm',
    status: 'active',
    effectRadius: 9000,
    lat: -37.5622,
    long: 143.8503,
    description: 'Hailstorm moving through Ballarat, with hailstones up to 2cm reported. Motorists advised to seek shelter and avoid driving.',
  },
  {
    id: 'haz-005',
    type: 'Storm',
    status: 'active',
    effectRadius: 12000,
    lat: -38.3667,
    long: 145.0333,
    description: 'Storm system moving across the Mornington Peninsula, bringing coastal flooding and strong winds to low-lying areas.',
  },
  {
    id: 'haz-006',
    type: 'Cyclone',
    status: 'active',
    effectRadius: 40000,
    lat: -37.9500,
    long: 147.6167,
    description: 'Ex-tropical cyclone system tracking toward Gippsland, expected to bring destructive winds and heavy rainfall over the next 24 hours.',
  },
  {
    id: 'haz-007',
    type: 'Tornado',
    status: 'active',
    effectRadius: 5000,
    lat: -36.1219,
    long: 146.8887,
    description: 'Tornado warning issued for areas near Wodonga following confirmed funnel cloud sightings. Seek shelter immediately.',
  },
  {
    id: 'haz-008',
    type: 'Extreme winds',
    status: 'active',
    effectRadius: 20000,
    lat: -35.2500,
    long: 142.6667,
    description: 'Extreme wind warning across the Mallee region, with gusts exceeding 100km/h expected to continue overnight.',
  },
  {
    id: 'haz-009',
    type: 'Earthquake',
    status: 'active',
    effectRadius: 25000,
    lat: -36.7570,
    long: 144.2794,
    description: 'A moderate earthquake has been recorded near Bendigo. Aftershocks are possible; residents advised to check for structural damage before re-entering buildings.',
  },
  {
    id: 'haz-010',
    type: 'Misc',
    status: 'active',
    effectRadius: 6000,
    lat: -38.1499,
    long: 144.3617,
    description: 'Major road closures and localised flooding reported near Geelong following heavy overnight rainfall.',
  },
  {
    id: 'haz-011',
    type: 'Fire',
    status: 'inactive',
    effectRadius: 7000,
    lat: -37.0167,
    long: 144.0000,
    description: 'Grassfire near Bendigo has been contained and extinguished. No further threat to the area.',
  },
  {
    id: 'haz-012',
    type: 'Storm',
    status: 'inactive',
    effectRadius: 10000,
    lat: -38.1500,
    long: 141.6167,
    description: 'Storm system that passed through Warrnambool overnight has cleared. Coastal flood warnings have been lifted.',
  },
  {
    id: 'haz-013',
    type: 'Hailstorm',
    status: 'inactive',
    effectRadius: 8500,
    lat: -36.7581,
    long: 141.6180,
    description: 'Hailstorm that affected Horsham earlier today has passed. Minor crop and property damage reported in surrounding areas.',
  },
];


export function MapScreen() {
  const { colors, severity } = useTheme();
  const { height } = useWindowDimensions();
  const [placeLabel, setPlaceLabel] = useState<string | null>(null);
  const ACTIVE_HAZARDS = HAZARDS.filter((h) => h.status === 'active');
  const mapRef = useRef<MapView>(null);

  const [region, setRegion] = useState<{
    latitude: number;
    longitude: number;
    latitudeDelta: number;
    longitudeDelta: number;
  } | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>("error");
  const [currentRegion, setCurrentRegion] = useState(region)
  //get user location
  useEffect(() => {
  let subscription: Location.LocationSubscription;
    
  (async () => {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') return;

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

//find user region
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
            const label = [place.district ?? place.subregion, place.city]
            .filter(Boolean)
            .join(', ');
            setPlaceLabel(label || place.city || null);
        }
        } catch (err) {
        console.error('Reverse geocode failed:', err);
        }
    })();
    }, [region?.latitude, region?.longitude]);

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
                <RText variant="bodyEmphasis" color={colors.ink}>
                  <ActivityIndicator />
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
          <View style={[styles.mapContainer, { height: height * 0.75 }] }>
            <MapView style={styles.map} />
        </View>
        </ScrollView>
      </SafeAreaView>
    </View>
    );
    }

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
          <View style={styles.mapContainer, { height: height * 0.75 }}>
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
                    <Marker coordinate={{ latitude: hazard.lat, longitude: hazard.long }}>
                      <View
                        style={[
                          styles.hazardMarker,
                          { backgroundColor: toRgba(style.theme, 1) },
                        ]}
                      >
                        <MaterialCommunityIcons name={style.icon} size={18} color="white" />
                      </View>
                    </Marker>
                  </Fragment>
                );
              })}
            </MapView>
                    <Pressable
                        style={styles.locationButton}
                        onPress={() => {
                        mapRef.current?.animateToRegion({
                            latitude: region.latitude,
                            longitude: region.longitude,
                            latitudeDelta: currentRegion.latitudeDelta,
                            longitudeDelta: currentRegion.longitudeDelta,
                        });
                        }}
                        >
                        <Ionicons name="locate" size={28} color={colors.ink} />
                    </Pressable>
                    <View style={styles.zoomControls}>
                    <Pressable
                        style={styles.zoomButton}
                        onPress={() => {
                        mapRef.current?.animateToRegion({
                            latitude: currentRegion.latitude,
                            longitude: currentRegion.longitude,
                            latitudeDelta: currentRegion.latitudeDelta/1.5,
                            longitudeDelta: currentRegion.longitudeDelta/1.5,
                        });
                    }}
                >
                <Ionicons name="add" size={28} color={colors.ink} />
            </Pressable>
            <Pressable
                        style={styles.zoomButton}
                        onPress={() => {
                        mapRef.current?.animateToRegion({
                            latitude: currentRegion.latitude,
                            longitude: currentRegion.longitude,
                            latitudeDelta: currentRegion.latitudeDelta*1.5,
                            longitudeDelta: currentRegion.longitudeDelta*1.5,
                        });
                    }}
                >
                <Ionicons name="remove" size={28} color={colors.ink} />
            </Pressable>
            </View>
        </View>
        </ScrollView>
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
  mapContainer: {
  height: 300, // or whatever fits your layout
  borderRadius: 0,
  overflow: 'hidden',
  marginTop: 16,
  },
  map: {
  flex: 1,
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
  elevation: 4,       // Android shadow
  shadowColor: '#000', // iOS shadow
  shadowOpacity: 0.2,
  shadowRadius: 4,
},
zoomControls: {
  position: 'absolute',
  bottom: BASE_BOTTOM + BUTTON_SIZE + BUTTON_GAP, // stacks directly above locationButton
  right: 20,          // same horizontal position — stacked, not side-by-side
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
hazardMarker: {
  width: 36,
  height: 36,
  borderRadius: 18,
  alignItems: 'center',
  justifyContent: 'center',
},
});
