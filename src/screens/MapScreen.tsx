import { Ionicons } from '@expo/vector-icons';
import { ScrollView, StyleSheet, View, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { RText } from '../components/RText';
import { useTheme } from '../theme/useTheme';
import MapView, { Marker } from 'react-native-maps';

import { useEffect, useState } from 'react';

import { useWindowDimensions } from 'react-native';
import * as Location from 'expo-location';

export function MapScreen() {
  const { colors, severity } = useTheme();
  const { height } = useWindowDimensions();

  const [region, setRegion] = useState<{
    latitude: number;
    longitude: number;
    latitudeDelta: number;
    longitudeDelta: number;
  } | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>("error");

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
                SL
              </RText>
            </View>
          </View>
          <View style={[styles.mapContainer, { height: height * 0.75 }] }>
            <View style={styles.center}>
                <MapView style={styles.map} />
            </View>
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
                SL
              </RText>
            </View>
          </View>
          <View style={styles.mapContainer, { height: height * 0.75 }}>
            <MapView style={styles.map}
                    region={region}
                    showsUserLocation />
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
});
