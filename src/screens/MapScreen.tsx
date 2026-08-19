import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { Fragment, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Platform, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Location from 'expo-location';
import MapView, { Circle, Marker, Polyline } from 'react-native-maps';

import { RButton } from '../components/RButton';
import { RToggleRow } from '../components/RToggleRow';
import { RCenteredOverlay } from '../components/RCenteredOverlay';
import { ROptionSelector } from '../components/ROptionSelector';
import { RText } from '../components/RText';
import { useTheme } from '../theme/useTheme';
import { Hazard, HazardType, HAZARD_STYLES, toRgba } from '../data/hazards';
import type { EvacuationPlan, MapDestination } from '../data/plans';
import { ALL_TRAVEL_MODES, TRAVEL_MODE_META, TravelMode } from '../data/travel';
import {
  MAP_BUTTON_POSITION_OPTIONS,
  MAP_BUTTON_SIZE_OPTIONS,
  MAP_BUTTON_SIZE_SCALE,
  MAP_MARKER_SIZE_OPTIONS,
  MAP_MARKER_SIZE_SCALE,
  usePreferences,
} from '../theme/PreferencesContext';
import { resolvePlanForHazardType } from '../data/plans';

// Set in .env — see .env.example. Falls back to a straight-line preview
// (no real routing) when unset, so the app still works without a key.
const GOOGLE_DIRECTIONS_KEY = process.env.EXPO_PUBLIC_GOOGLE_MAPS_KEY;

// Used for every active hazard when "Simple map" is enabled — a single,
// unambiguous "something is wrong here" treatment instead of distinguishing
// by type, for anyone who finds a multi-colour/icon legend more confusing
// than helpful.
const SIMPLE_HAZARD_THEME = { r: 196, g: 0, b: 0, a: 1 };
const SIMPLE_HAZARD_ICON: keyof typeof MaterialCommunityIcons.glyphMap = 'alert';

// ---------------------------------------------------------------------------
// Layout constants
// ---------------------------------------------------------------------------

const BUTTON_GAP = 20;
const BASE_BOTTOM = 25;

interface MapScreenProps {
  hazards: Hazard[];
  plans: EvacuationPlan[];
  onViewPlanForHazard: (hazard: Hazard) => void;
  /** Set when the user taps "Show directions" on a plan. Draws a real
   * road-following route via a single Google Directions API request when
   * EXPO_PUBLIC_GOOGLE_MAPS_KEY is set, or a straight-line preview otherwise. */
  destination?: MapDestination | null;
  onClearDestination?: () => void;
  /** Set by App.tsx when the user taps "Customize map appearance" on
   * Settings — opens the map settings overlay immediately on arrival. */
  openSettingsOnMount?: boolean;
  onSettingsOnMountHandled?: () => void;
}

// Standard Google Maps "dark mode" style JSON — only takes effect when the
// map provider is actually Google (Android by default; iOS uses Apple Maps
// and ignores this prop entirely, so mapType="mutedStandard" covers dark
// mode there instead — see the render below).
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

interface RouteInfo {
  distanceKm: number;
  durationMin: number;
}

// Straight-line (haversine) distance in km — used as a fallback for the
// directions banner when no Directions API key is configured.
function distanceKm(a: { latitude: number; longitude: number }, b: { latitude: number; longitude: number }) {
  const R = 6371;
  const dLat = ((b.latitude - a.latitude) * Math.PI) / 180;
  const dLon = ((b.longitude - a.longitude) * Math.PI) / 180;
  const lat1 = (a.latitude * Math.PI) / 180;
  const lat2 = (b.latitude * Math.PI) / 180;
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

interface DirectionStep {
  instruction: string;
  distance: string;
  duration: string;
}

// Google's step instructions come as small HTML fragments (e.g. "<b>Turn left</b>
// onto <b>High St</b>") — strip tags down to plain text for display.
function stripHtml(html: string) {
  return html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
}

// Decodes Google's encoded polyline format (the standard algorithm used by
// the Directions API's overview_polyline.points) into a list of coordinates.
// This is what lets us draw the real route from a single API response
// without a separate rendering library doing the fetch for us.
function decodePolyline(encoded: string): { latitude: number; longitude: number }[] {
  const points: { latitude: number; longitude: number }[] = [];
  let index = 0;
  let lat = 0;
  let lng = 0;

  while (index < encoded.length) {
    let shift = 0;
    let result = 0;
    let byte: number;
    do {
      byte = encoded.charCodeAt(index++) - 63;
      result |= (byte & 0x1f) << shift;
      shift += 5;
    } while (byte >= 0x20);
    lat += result & 1 ? ~(result >> 1) : result >> 1;

    shift = 0;
    result = 0;
    do {
      byte = encoded.charCodeAt(index++) - 63;
      result |= (byte & 0x1f) << shift;
      shift += 5;
    } while (byte >= 0x20);
    lng += result & 1 ? ~(result >> 1) : result >> 1;

    points.push({ latitude: lat / 1e5, longitude: lng / 1e5 });
  }

  return points;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function MapScreen({
  hazards,
  plans,
  onViewPlanForHazard,
  destination,
  onClearDestination,
  openSettingsOnMount,
  onSettingsOnMountHandled,
}: MapScreenProps) {
  const theme = useTheme();
  const { colors, severity, spacing, radius, sizing, scheme, preferences } = theme;
  const { setPreferences } = usePreferences();
  const insets = useSafeAreaInsets();
  const [placeLabel, setPlaceLabel] = useState<string | null>(null);
  const [selectedHazard, setSelectedHazard] = useState<Hazard | null>(null);
  const [legendOpen, setLegendOpen] = useState(false);
  const [iconsReady, setIconsReady] = useState(false);
  const [routeInfo, setRouteInfo] = useState<RouteInfo | null>(null);
  const [directionsFailed, setDirectionsFailed] = useState(false);
  const [directionSteps, setDirectionSteps] = useState<DirectionStep[]>([]);
  const [stepsOpen, setStepsOpen] = useState(false);
  const [routeCoordinates, setRouteCoordinates] = useState<{ latitude: number; longitude: number }[]>([]);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [stepSheetDismissed, setStepSheetDismissed] = useState(false);
  const [mapSettingsOpen, setMapSettingsOpen] = useState(false);
  // Modes the user has marked as usable (Map settings overlay below). Always
  // at least one — handleToggleModeUsable refuses to disable every mode.
  const availableTravelModes = ALL_TRAVEL_MODES.filter((m) => !preferences.disabledTravelModes.includes(m));
  const markerScale = MAP_MARKER_SIZE_SCALE[preferences.mapMarkerSize];
  const buttonScale = MAP_BUTTON_SIZE_SCALE[preferences.mapButtonSize];
  const buttonSize = sizing.touchTarget.preferredPrimary * buttonScale;
  const isSideLayout = preferences.mapButtonPosition === 'side-right';

  // Toggling a mode off marks it as unusable (e.g. no car). Always leaves at
  // least one mode enabled, and reassigns the default automatically if the
  // mode being disabled was the current default.
  const handleToggleModeUsable = (mode: TravelMode, usable: boolean) => {
    setPreferences((prev) => {
      const disabledTravelModes = usable
        ? prev.disabledTravelModes.filter((m) => m !== mode)
        : [...prev.disabledTravelModes, mode];

      if (disabledTravelModes.length === ALL_TRAVEL_MODES.length) {
        return prev; // refuse to disable every mode
      }

      const defaultTravelMode = disabledTravelModes.includes(prev.defaultTravelMode)
        ? ALL_TRAVEL_MODES.find((m) => !disabledTravelModes.includes(m))!
        : prev.defaultTravelMode;

      return { ...prev, disabledTravelModes, defaultTravelMode };
    });
  };

  // Kept across different destinations deliberately (not reset when
  // `destination` changes) — if someone always walks, they shouldn't have to
  // re-pick that every time they ask for directions somewhere new. Starts
  // from the user's chosen default, falling back to the first available
  // mode if that default has since become disabled.
  const [travelMode, setTravelMode] = useState<TravelMode>(
    availableTravelModes.includes(preferences.defaultTravelMode) ? preferences.defaultTravelMode : availableTravelModes[0] ?? 'driving'
  );

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

  // Only one centered overlay (hazard card, legend, turn-by-turn steps, or
  // map settings) should ever be open at once — opening one always closes
  // the others, which matters especially for the restricted-field-of-view
  // persona this screen is designed around.
  const openHazard = (hazard: Hazard) => {
    setLegendOpen(false);
    setStepsOpen(false);
    setMapSettingsOpen(false);
    setSelectedHazard(hazard);
  };

  const toggleLegend = () => {
    setSelectedHazard(null);
    setStepsOpen(false);
    setMapSettingsOpen(false);
    setLegendOpen((prev) => !prev);
  };

  const openSteps = () => {
    setSelectedHazard(null);
    setLegendOpen(false);
    setMapSettingsOpen(false);
    setStepsOpen(true);
  };

  const toggleMapSettings = () => {
    setSelectedHazard(null);
    setLegendOpen(false);
    setStepsOpen(false);
    setMapSettingsOpen((prev) => !prev);
  };

  // Arriving here from "Customize map appearance" on Settings — open the
  // overlay immediately rather than leaving the user to find the gear icon.
  useEffect(() => {
    if (!openSettingsOnMount) return;
    setMapSettingsOpen(true);
    onSettingsOnMountHandled?.();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [openSettingsOnMount]);

  // Reset everything route-related as soon as the destination or travel mode
  // changes (or directions are dismissed) — a mode switch needs a fresh route.
  useEffect(() => {
    setRouteInfo(null);
    setDirectionSteps([]);
    setStepsOpen(false);
    setRouteCoordinates([]);
    setDirectionsFailed(false);
    setCurrentStepIndex(0);
    setStepSheetDismissed(false);
  }, [destination, travelMode]);

  // Single Directions API request per route: the response already contains
  // the route geometry (an encoded polyline), total distance/duration, and
  // per-step turn instructions — decodePolyline() unpacks the geometry, so
  // there's no need for a second call or a separate rendering library.
  //
  // Depends on `region` as well as `destination` because MapScreen unmounts
  // on every tab switch, so `region` is briefly null right after navigating
  // here from a "Show directions" tap — this effect needs to retry once the
  // location fix actually resolves, not just on the initial (region-less) fire.
  // The routeCoordinates/directionsFailed checks stop it from re-fetching on
  // every subsequent location tick once a route has already been resolved.
  useEffect(() => {
    if (!destination) return;

    if (!GOOGLE_DIRECTIONS_KEY) {
      // No key: just frame a straight line between the two points once we have one.
      if (region && mapRef.current) {
        mapRef.current.fitToCoordinates(
          [
            { latitude: region.latitude, longitude: region.longitude },
            { latitude: destination.latitude, longitude: destination.longitude },
          ],
          { edgePadding: { top: 120, right: 60, bottom: 220, left: 60 }, animated: true }
        );
      }
      return;
    }

    if (!region) return; // waiting for a location fix
    if (routeCoordinates.length > 0 || directionsFailed) return; // already resolved for this destination

    let cancelled = false;

    (async () => {
      try {
        const url = `https://maps.googleapis.com/maps/api/directions/json?origin=${region.latitude},${region.longitude}&destination=${destination.latitude},${destination.longitude}&mode=${travelMode}&key=${GOOGLE_DIRECTIONS_KEY}`;
        const response = await fetch(url);
        const data = await response.json();
        if (cancelled) return;

        const route = data.routes?.[0];
        const leg = route?.legs?.[0];
        if (!route || !leg) {
          console.error('Directions request returned no route. status:', data.status, 'error_message:', data.error_message);
          setDirectionsFailed(true);
          if (mapRef.current) {
            mapRef.current.fitToCoordinates(
              [
                { latitude: region.latitude, longitude: region.longitude },
                { latitude: destination.latitude, longitude: destination.longitude },
              ],
              { edgePadding: { top: 120, right: 60, bottom: 220, left: 60 }, animated: true }
            );
          }
          return;
        }

        const coordinates = decodePolyline(route.overview_polyline.points);
        setRouteCoordinates(coordinates);
        setRouteInfo({
          distanceKm: leg.distance.value / 1000,
          durationMin: leg.duration.value / 60,
        });
        setDirectionSteps(
          (leg.steps ?? []).map((step: any) => ({
            instruction: stripHtml(step.html_instructions ?? ''),
            distance: step.distance?.text ?? '',
            duration: step.duration?.text ?? '',
          }))
        );

        if (mapRef.current) {
          mapRef.current.fitToCoordinates(coordinates, {
            edgePadding: { top: 120, right: 60, bottom: 220, left: 60 },
            animated: true,
          });
        }
      } catch (err) {
        console.error('Directions request failed:', err);
        setDirectionsFailed(true);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [destination, region, routeCoordinates.length, directionsFailed, travelMode]);

  const handleClearDirections = () => {
    onClearDestination?.();
  };

  // -------------------------------------------------------------------------
  // Loading state — no region yet
  // -------------------------------------------------------------------------
  if (!region) {
    return (
      <View style={[styles.screen, { backgroundColor: colors.bg }]}>
        <MapView
          style={StyleSheet.absoluteFillObject}
          customMapStyle={scheme === 'dark' ? DARK_MAP_STYLE : []}
          mapType={Platform.OS === 'ios' && scheme === 'dark' ? 'mutedStandard' : 'standard'}
        />

        <View style={[styles.topStack, { top: insets.top + 12 }]}>
          <View
            style={[
              styles.headerRow,
              { backgroundColor: colors.surface, borderColor: colors.hairline, borderRadius: radius.card, padding: spacing.cardPadding },
            ]}
          >
            <View style={styles.headerText}>
              <RText variant="eyebrowLabel" color={colors.ink3}>
                MAP
              </RText>
              <View style={styles.locationRow}>
                <Ionicons name="location" size={16} color={colors.ink} />
                <ActivityIndicator size="small" color={colors.ink} />
              </View>
            </View>
            <View style={styles.headerRightControls}>
              <Pressable
                style={[
                  styles.headerIconButton,
                  { width: sizing.touchTarget.minimum, height: sizing.touchTarget.minimum },
                ]}
                onPress={toggleMapSettings}
                accessibilityLabel="Map settings"
              >
                <Ionicons name="options-outline" size={20} color={colors.ink2} />
              </Pressable>
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
          </View>
        </View>
      </View>
    );
  }

  // -------------------------------------------------------------------------
  // Main render
  // -------------------------------------------------------------------------
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

        {destination && (
          <>
            {(() => {
              const routePoints =
                routeCoordinates.length > 0
                  ? routeCoordinates
                  : [
                      { latitude: region.latitude, longitude: region.longitude },
                      { latitude: destination.latitude, longitude: destination.longitude },
                    ];
              return (
                <>
                  {/* White casing underneath so the route reads clearly against busy map detail */}
                  <Polyline coordinates={routePoints} strokeColor="#FFFFFF" strokeWidth={8} />
                  <Polyline coordinates={routePoints} strokeColor={colors.accent} strokeWidth={4} />
                </>
              );
            })()}
            <Marker coordinate={{ latitude: destination.latitude, longitude: destination.longitude }}>
              <View
                style={[
                  styles.destinationMarker,
                  {
                    width: 40 * markerScale,
                    height: 40 * markerScale,
                    borderRadius: (40 * markerScale) / 2,
                    backgroundColor: colors.accent,
                  },
                ]}
              >
                <Ionicons name="flag" size={sizing.icon.medium * markerScale} color="white" />
              </View>
            </Marker>
          </>
        )}

        {activeHazards.map((hazard) => {
          const style = HAZARD_STYLES[hazard.type];
          // Simple map: every hazard looks the same at a glance —
          // still identified precisely once opened via the detail panel.
          const displayTheme = preferences.simpleMap ? SIMPLE_HAZARD_THEME : style.theme;
          const displayIcon = preferences.simpleMap ? SIMPLE_HAZARD_ICON : style.icon;
          return (
            <Fragment key={hazard.id}>
              <Circle
                center={{ latitude: hazard.lat, longitude: hazard.long }}
                radius={hazard.effectRadius}
                strokeColor={toRgba(displayTheme, 0.9)}
                fillColor={toRgba(displayTheme, 0.18)}
                strokeWidth={4}
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
                      width: sizing.avatar.large * markerScale,
                      height: sizing.avatar.large * markerScale,
                      borderRadius: (sizing.avatar.large * markerScale) / 2,
                      backgroundColor: toRgba(displayTheme, 1),
                    },
                  ]}
                >
                  <MaterialCommunityIcons name={displayIcon} size={sizing.icon.large * markerScale} color="white" />
                </View>
              </Marker>
            </Fragment>
          );
        })}
      </MapView>

      {/* Floating top stack: header, then directions banner below it — stacked
          via normal flow inside one positioned container, so there's no
          fragile pixel math for where the banner sits under the header. */}
      <View style={[styles.topStack, { top: insets.top + 12 }]}>
        <View
          style={[
            styles.headerRow,
            { backgroundColor: colors.surface, borderColor: colors.hairline, borderRadius: radius.card, padding: spacing.cardPadding },
          ]}
        >
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
          <View style={styles.headerRightControls}>
            <Pressable
              style={[
                styles.headerIconButton,
                { width: sizing.touchTarget.minimum, height: sizing.touchTarget.minimum },
              ]}
              onPress={toggleMapSettings}
              accessibilityLabel="Map settings"
            >
              <Ionicons name="options-outline" size={20} color={colors.ink2} />
            </Pressable>
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
        </View>

        {/* Directions banner — persistent strip, not a blocking overlay, so the route stays visible underneath it */}
        {destination && (
          <View
            style={[
              styles.directionsBanner,
              { backgroundColor: colors.surface, borderColor: colors.hairline, borderRadius: radius.card, padding: spacing.cardPadding },
            ]}
          >
            <View style={styles.directionsBannerTopRow}>
              <View style={[styles.directionsBannerText, { gap: spacing.scale[3] }]}>
                <Ionicons name="navigate" size={sizing.icon.medium} color={colors.accent} />
                <View style={{ flex: 1 }}>
                  <RText variant="bodyEmphasis" color={colors.ink}>
                    Directions to {destination.name}
                  </RText>
                  <RText variant="caption" color={colors.ink3}>
                    {routeInfo
                      ? `${routeInfo.distanceKm.toFixed(1)} km · ${Math.round(routeInfo.durationMin)} ${TRAVEL_MODE_META[travelMode].durationSuffix}`
                      : directionsFailed
                      ? `Couldn't get a route — ${distanceKm(region, destination).toFixed(1)} km away, straight line`
                      : GOOGLE_DIRECTIONS_KEY
                      ? 'Finding route…'
                      : `${distanceKm(region, destination).toFixed(1)} km away, straight line`}
                  </RText>
                </View>
              </View>
              {directionSteps.length > 0 && (
                <Pressable
                  style={[
                    styles.directionsCloseButton,
                    { width: buttonSize, height: buttonSize },
                  ]}
                  onPress={() => setStepSheetDismissed((prev) => !prev)}
                  accessibilityLabel={stepSheetDismissed ? 'Show step-by-step directions' : 'Hide step-by-step directions'}
                >
                  <Ionicons name="list" size={sizing.icon.medium * buttonScale} color={colors.ink2} />
                </Pressable>
              )}
              <Pressable
                style={[
                  styles.directionsCloseButton,
                  { width: buttonSize, height: buttonSize },
                ]}
                onPress={handleClearDirections}
                accessibilityLabel="Clear directions"
              >
                <Ionicons name="close" size={sizing.icon.medium * buttonScale} color={colors.ink3} />
              </Pressable>
            </View>

            {GOOGLE_DIRECTIONS_KEY && availableTravelModes.length > 1 && (
              <View style={[styles.travelModeRow, { gap: spacing.scale[2] }]}>
                {availableTravelModes.map((mode) => {
                  const meta = TRAVEL_MODE_META[mode];
                  const selected = travelMode === mode;
                  return (
                    <Pressable
                      key={mode}
                      onPress={() => setTravelMode(mode)}
                      accessibilityRole="button"
                      accessibilityState={{ selected }}
                      accessibilityLabel={meta.label}
                      style={[
                        styles.travelModeButton,
                        {
                          minHeight: sizing.touchTarget.minimum * buttonScale,
                          borderRadius: radius.lg,
                          backgroundColor: selected ? colors.ink : colors.surface2,
                          gap: spacing.scale[1],
                        },
                      ]}
                    >
                      <Ionicons name={meta.icon} size={sizing.icon.small * buttonScale} color={selected ? colors.bg : colors.ink2} />
                      <RText variant="caption" color={selected ? colors.bg : colors.ink2}>
                        {meta.label}
                      </RText>
                    </Pressable>
                  );
                })}
              </View>
            )}
          </View>
        )}
      </View>

      {/* Current-step bottom sheet — docked above the map, not a blocking
          overlay, so both personas can keep seeing the map and their
          position while reading the next instruction. */}
      {destination && directionSteps.length > 0 && !stepSheetDismissed && (
        <View
          style={[
            styles.stepSheet,
            {
              bottom: BASE_BOTTOM + insets.bottom + buttonSize + BUTTON_GAP,
              backgroundColor: colors.surface,
              borderColor: colors.hairline,
              borderRadius: radius.card,
              padding: spacing.cardPadding,
              gap: spacing.scale[3],
            },
          ]}
        >
          <View style={styles.stepSheetHeader}>
            <RText variant="caption" color={colors.ink3}>
              Step {currentStepIndex + 1} of {directionSteps.length}
            </RText>
            <Pressable
              style={[
                styles.stepSheetCloseButton,
                { width: buttonSize, height: buttonSize },
              ]}
              onPress={() => setStepSheetDismissed(true)}
              accessibilityLabel="Hide step-by-step panel"
            >
              <Ionicons name="chevron-down" size={sizing.icon.medium * buttonScale} color={colors.ink3} />
            </Pressable>
          </View>

          <RText variant="bodyEmphasis" color={colors.ink}>
            {directionSteps[currentStepIndex].instruction}
          </RText>
          <RText variant="secondary" color={colors.ink3}>
            {directionSteps[currentStepIndex].distance}
            {directionSteps[currentStepIndex].distance && directionSteps[currentStepIndex].duration ? ' · ' : ''}
            {directionSteps[currentStepIndex].duration}
          </RText>

          <View style={[styles.stepSheetNav, { gap: spacing.scale[3] }]}>
            <Pressable
              style={[
                styles.stepNavButton,
                {
                  minHeight: buttonSize,
                  borderRadius: radius.lg,
                  backgroundColor: colors.surface2,
                  opacity: currentStepIndex === 0 ? 0.4 : 1,
                },
              ]}
              onPress={() => setCurrentStepIndex((i) => Math.max(0, i - 1))}
              disabled={currentStepIndex === 0}
              accessibilityLabel="Previous step"
            >
              <Ionicons name="chevron-back" size={sizing.icon.medium * buttonScale} color={colors.ink} />
            </Pressable>
            <Pressable
              style={[
                styles.stepNavButton,
                {
                  flex: 1,
                  minHeight: buttonSize,
                  borderRadius: radius.lg,
                  backgroundColor: colors.ink,
                  opacity: currentStepIndex === directionSteps.length - 1 ? 0.4 : 1,
                },
              ]}
              onPress={() => setCurrentStepIndex((i) => Math.min(directionSteps.length - 1, i + 1))}
              disabled={currentStepIndex === directionSteps.length - 1}
              accessibilityLabel="Next step"
            >
              <RText variant="bodyEmphasis" color={colors.bg}>
                {currentStepIndex === directionSteps.length - 1 ? "You've arrived" : 'Next step'}
              </RText>
              {currentStepIndex < directionSteps.length - 1 && (
                <Ionicons name="chevron-forward" size={sizing.icon.medium * buttonScale} color={colors.bg} />
              )}
            </Pressable>
          </View>

          <Pressable onPress={openSteps} accessibilityRole="button" accessibilityLabel="View full step list">
            <RText variant="caption" color={colors.ink2} style={{ textAlign: 'center' }}>
              View full list
            </RText>
          </Pressable>
        </View>
      )}

      {/* Centralized control cluster — legend, zoom out/in, locate. Rendered
          before the overlays below so they always paint on top of it,
          rather than the buttons poking through an open overlay. */}
      <View
        style={[
          isSideLayout ? styles.sideCluster : styles.controlCluster,
          isSideLayout
            ? {
                top: insets.top + 90,
                bottom: BASE_BOTTOM + insets.bottom,
                right: 16,
              }
            : {
                bottom: BASE_BOTTOM + insets.bottom,
                justifyContent: 'center',
              },
        ]}
      >
        {!preferences.simpleMap && (
          <Pressable
            style={[
              styles.controlButton,
              {
                width: buttonSize,
                height: buttonSize,
                borderRadius: buttonSize / 2,
                backgroundColor: colors.surface,
              },
            ]}
            onPress={toggleLegend}
            accessibilityLabel={legendOpen ? 'Hide hazard legend' : 'Show hazard legend'}
          >
            <Ionicons name="list" size={24 * buttonScale} color={colors.ink} />
          </Pressable>
        )}
        <Pressable
          style={[
            styles.controlButton,
            {
              width: buttonSize,
              height: buttonSize,
              borderRadius: buttonSize / 2,
              backgroundColor: colors.surface,
            },
          ]}
          onPress={zoomOut}
          accessibilityLabel="Zoom out"
        >
          <Ionicons name="remove" size={28 * buttonScale} color={colors.ink} />
        </Pressable>
        <Pressable
          style={[
            styles.controlButton,
            {
              width: buttonSize,
              height: buttonSize,
              borderRadius: buttonSize / 2,
              backgroundColor: colors.surface,
            },
          ]}
          onPress={zoomIn}
          accessibilityLabel="Zoom in"
        >
          <Ionicons name="add" size={28 * buttonScale} color={colors.ink} />
        </Pressable>
        <Pressable
          style={[
            styles.controlButton,
            {
              width: buttonSize,
              height: buttonSize,
              borderRadius: buttonSize / 2,
              backgroundColor: colors.surface,
            },
          ]}
          onPress={recenter}
          accessibilityLabel="Center on my location"
        >
          <Ionicons name="locate" size={28 * buttonScale} color={colors.ink} />
        </Pressable>
      </View>

      {/* Turn-by-turn steps overlay */}
      {stepsOpen && directionSteps.length > 0 && destination && (
              <RCenteredOverlay title={`Directions to ${destination.name}`} onDismiss={() => setStepsOpen(false)}>
                <ScrollView showsVerticalScrollIndicator={false} nestedScrollEnabled>
                  <View style={{ gap: spacing.scale[4] }}>
                    {directionSteps.map((step, i) => (
                      <View key={i} style={{ flexDirection: 'row', gap: spacing.scale[3] }}>
                        <RText variant="bodyEmphasis" color={colors.ink3}>
                          {i + 1}.
                        </RText>
                        <View style={{ flex: 1, gap: spacing.scale[1] }}>
                          <RText variant="body" color={colors.ink2}>
                            {step.instruction}
                          </RText>
                          <RText variant="caption" color={colors.ink3}>
                            {step.distance}
                            {step.distance && step.duration ? ' · ' : ''}
                            {step.duration}
                          </RText>
                        </View>
                      </View>
                    ))}
                  </View>
                </ScrollView>
              </RCenteredOverlay>
            )}

            {/* Hazard legend overlay — no legend needed in simple map mode, since every hazard looks the same */}
            {legendOpen && !preferences.simpleMap && (
              <RCenteredOverlay title="Hazard types" onDismiss={() => setLegendOpen(false)} maxWidth={340}>
                <ScrollView style={styles.legendScroll} showsVerticalScrollIndicator={false} nestedScrollEnabled>
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

                {resolvePlanForHazardType(plans, selectedHazard.type) && (
                  <RButton
                    label="View response plan"
                    variant="primary"
                    size="m"
                    icon="document-text-outline"
                    iconPosition="leading"
                    onPress={() => {
                      onViewPlanForHazard(selectedHazard);
                      setSelectedHazard(null);
                    }}
                  />
                )}
              </RCenteredOverlay>
            )}

      {/* Map settings overlay — marker/button size & position, simple map,
          and travel mode preferences. Lives here (not just in the global
          Settings screen) since these are only meaningful while actually
          looking at the map. */}
      {mapSettingsOpen && (
        <RCenteredOverlay title="Map settings" onDismiss={() => setMapSettingsOpen(false)}>
          <ScrollView showsVerticalScrollIndicator={false} nestedScrollEnabled>
            <View style={{ gap: spacing.scale[4] }}>
              <View style={{ gap: spacing.scale[2] }}>
                <RText variant="caption" color={colors.ink3}>
                  Marker size
                </RText>
                <ROptionSelector
                  options={MAP_MARKER_SIZE_OPTIONS}
                  value={preferences.mapMarkerSize}
                  onChange={(mapMarkerSize) => setPreferences((prev) => ({ ...prev, mapMarkerSize }))}
                  theme={theme}
                />
              </View>

              <View style={{ gap: spacing.scale[2] }}>
                <RText variant="caption" color={colors.ink3}>
                  Button size
                </RText>
                <ROptionSelector
                  options={MAP_BUTTON_SIZE_OPTIONS}
                  value={preferences.mapButtonSize}
                  onChange={(mapButtonSize) => setPreferences((prev) => ({ ...prev, mapButtonSize }))}
                  theme={theme}
                />
              </View>

              <View style={{ gap: spacing.scale[2] }}>
                <RText variant="caption" color={colors.ink3}>
                  Button position
                </RText>
                <ROptionSelector
                  options={MAP_BUTTON_POSITION_OPTIONS}
                  value={preferences.mapButtonPosition}
                  onChange={(mapButtonPosition) => setPreferences((prev) => ({ ...prev, mapButtonPosition }))}
                  theme={theme}
                />
              </View>

              <RToggleRow
                label="Simple map"
                description="Shows every active hazard the same way, instead of a different colour and icon per type"
                value={preferences.simpleMap}
                onChange={(simpleMap) => setPreferences((prev) => ({ ...prev, simpleMap }))}
                theme={theme}
              />

              <View style={{ gap: spacing.scale[2] }}>
                <RText variant="caption" color={colors.ink3}>
                  Travel modes you can use
                </RText>
                {ALL_TRAVEL_MODES.map((mode) => {
                  const meta = TRAVEL_MODE_META[mode];
                  const usable = !preferences.disabledTravelModes.includes(mode);
                  return (
                    <RToggleRow
                      key={mode}
                      label={meta.label}
                      value={usable}
                      onChange={(value) => handleToggleModeUsable(mode, value)}
                      theme={theme}
                    />
                  );
                })}
              </View>

              <View style={{ gap: spacing.scale[2] }}>
                <RText variant="caption" color={colors.ink3}>
                  Default travel mode
                </RText>
                <ROptionSelector
                  options={availableTravelModes.map((mode) => ({
                    value: mode,
                    label: TRAVEL_MODE_META[mode].label,
                    icon: TRAVEL_MODE_META[mode].icon,
                  }))}
                  value={preferences.defaultTravelMode}
                  onChange={(defaultTravelMode) => setPreferences((prev) => ({ ...prev, defaultTravelMode }))}
                  theme={theme}
                />
              </View>
            </View>
          </ScrollView>
        </RCenteredOverlay>
      )}

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
  topStack: {
    position: 'absolute',
    left: 16,
    right: 16,
    gap: 12,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    borderWidth: 1,
    elevation: 6,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 6,
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
  headerRightControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerIconButton: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  hazardMarker: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  destinationMarker: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: 'white',
  },
  directionsBanner: {
    gap: 12,
    borderWidth: 1,
    elevation: 6,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 6,
  },
  directionsBannerTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  travelModeRow: {
    flexDirection: 'row',
  },
  travelModeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  directionsBannerText: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  directionsCloseButton: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepSheet: {
    position: 'absolute',
    left: 16,
    right: 16,
    borderWidth: 1,
    elevation: 8,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  stepSheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  stepSheetCloseButton: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepSheetNav: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  stepNavButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingHorizontal: 16,
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
  legendScroll: {
    maxHeight: 420,
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
