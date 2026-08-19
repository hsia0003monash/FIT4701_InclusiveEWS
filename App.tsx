import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
  Inter_800ExtraBold,
  useFonts,
} from '@expo-google-fonts/inter';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useCallback, useEffect, useState } from 'react';
import { Linking, Pressable, StyleSheet, View } from 'react-native';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import { HomeScreen } from './src/screens/HomeScreen';
import { MapScreen } from './src/screens/MapScreen';
import { FamilyScreen } from './src/screens/FamilyScreen';
import { PlansScreen } from './src/screens/PlansScreen';
import { SettingsScreen } from './src/screens/SettingsScreen';
import { AlertScreen } from './src/screens/AlertScreen';
import { RTabBar, TabKey } from './src/components/RTabBar';
import { RText } from './src/components/RText';
import { PreferencesProvider } from './src/theme/PreferencesContext';
import { useTheme } from './src/theme/useTheme';
import { usePersistentState } from './src/data/persistence';
import { INITIAL_FAMILY, FamilyMember, FamilyStatus } from './src/data/family';
import { INITIAL_HAZARDS, Hazard } from './src/data/hazards';
import {
  INITIAL_PLANS,
  INITIAL_SAFE_LOCATIONS,
  EvacuationPlan,
  SafeLocation,
  MapDestination,
  resolvePlanForHazardType,
  resolvePlanDestination,
} from './src/data/plans';

SplashScreen.preventAutoHideAsync();

// Extracts ?hazardId=... from an incoming deep link without relying on the
// URL/URLSearchParams globals, whose support varies across JS engines.
function parseHazardIdFromUrl(url: string): string | null {
  const match = url.match(/[?&]hazardId=([^&]+)/);
  return match ? decodeURIComponent(match[1]) : null;
}

// StatusBar's "auto" style only tracks the *device's* OS-level appearance,
// not this app's in-app theme override — so picking "Dark" here while the
// phone itself is set to light mode left dark status bar icons on a dark
// background (invisible battery/clock). This derives the style from the
// app's actual resolved scheme instead. Needs to be its own component,
// rendered inside PreferencesProvider, since useTheme() can't be called
// from App's own body before the Provider exists as its ancestor.
function ThemedStatusBar() {
  const { scheme } = useTheme();
  return <StatusBar style={scheme === 'dark' ? 'light' : 'dark'} />;
}

// Slim persistent reminder shown across every tab whenever there's an
// unacknowledged alert that's been minimized (via "Show safest route"), so
// stepping away to check the map doesn't mean losing track of it entirely.
function ActiveAlertBanner({ hazard, onPress }: { hazard: Hazard; onPress: () => void }) {
  const { colors, severity, spacing, radius, sizing } = useTheme();
  const insets = useSafeAreaInsets();
  const tone = hazard.severityTone ?? 'emergency';

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`Unacknowledged alert: ${hazard.headline ?? hazard.description}. Tap to respond.`}
      style={[
        bannerStyles.banner,
        {
          top: insets.top + 8,
          backgroundColor: severity[tone].bg,
          borderColor: severity[tone].border,
          borderRadius: radius.card,
          paddingHorizontal: spacing.cardPadding,
          minHeight: sizing.touchTarget.minimum,
          gap: spacing.scale[2],
        },
      ]}
    >
      <RText variant="bodyEmphasis" color={severity[tone].fg} style={{ flex: 1 }}>
        Active alert — tap to respond
      </RText>
    </Pressable>
  );
}

const bannerStyles = StyleSheet.create({
  banner: {
    position: 'absolute',
    left: 16,
    right: 16,
    zIndex: 50,
    elevation: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 6,
  },
});

export default function App() {
  const [fontsLoaded] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
    Inter_800ExtraBold,
  });

  const [activeTab, setActiveTab] = useState<TabKey>('Home');

  // Family, plans, and safe locations persist to on-device JSON files (see
  // src/data/persistence.ts) so edits survive app reloads. Hazards stay
  // in-memory only — not requested to persist, and re-seeding them fresh
  // each run keeps the map's example hazards consistent for demos.
  const [family, setFamily, familyLoaded] = usePersistentState<FamilyMember[]>('family.json', INITIAL_FAMILY);
  const [hazards, setHazards] = useState<Hazard[]>(INITIAL_HAZARDS);
  const [plans, setPlans, plansLoaded] = usePersistentState<EvacuationPlan[]>('plans.json', INITIAL_PLANS);
  const [safeLocations, setSafeLocations, safeLocationsLoaded] = usePersistentState<SafeLocation[]>(
    'safeLocations.json',
    INITIAL_SAFE_LOCATIONS
  );

  const dataLoaded = familyLoaded && plansLoaded && safeLocationsLoaded;

  // Set when the user taps "Show directions" on a plan — switches to the Map
  // tab and draws a route preview there. Persists across tab switches until
  // explicitly cleared, so navigating away and back keeps the route visible.
  const [mapDestination, setMapDestination] = useState<MapDestination | null>(null);

  const handleNavigateToLocation = (destination: MapDestination) => {
    setMapDestination(destination);
    setActiveTab('Map');
  };

  // Set when the user taps "View plan" for a hazard on Home/Map — switches
  // to the Plans tab and opens the matching plan (or the General fallback)
  // directly, rather than leaving the user to find it in the list themselves.
  const [targetPlanId, setTargetPlanId] = useState<string | null>(null);

  const handleViewPlanForHazard = (hazard: Hazard) => {
    const plan = resolvePlanForHazardType(plans, hazard.type);
    if (plan) {
      setTargetPlanId(plan.id);
      setActiveTab('Plans');
    }
  };

  // Set when the user taps "Customize map appearance" on Settings —
  // switches to the Map tab and opens its own settings overlay directly.
  const [openMapSettings, setOpenMapSettings] = useState(false);

  const handleOpenMapSettings = () => {
    setOpenMapSettings(true);
    setActiveTab('Map');
  };

  // --- Emergency alert -------------------------------------------------
  // activeAlertHazard: set the moment an alert is triggered (deep link, or
  // the test button in Settings), cleared only once the user picks a status.
  // alertScreenVisible: whether the full-screen block is currently showing,
  // vs minimized to the slim banner (e.g. while looking at the map for
  // directions) — the alert stays *unacknowledged* either way.
  const [activeAlertHazard, setActiveAlertHazard] = useState<Hazard | null>(null);
  const [alertScreenVisible, setAlertScreenVisible] = useState(false);

  const triggerAlert = useCallback(
    (hazard: Hazard) => {
      setActiveAlertHazard(hazard);
      setAlertScreenVisible(true);
      // Per spec: the moment an alert is triggered, the user's own status is
      // set to "awaiting check-in" until they actually respond.
      setFamily((prev) => prev.map((m) => (m.isSelf ? { ...m, status: 'checkIn' as FamilyStatus, updated: 'Just now' } : m)));
    },
    [setFamily]
  );

  // Deep link handling — e.g. yourscheme://alert?hazardId=haz-001 — is the
  // realistic "trigger from outside the app" mechanism without a push
  // notification backend/server. Handles both a cold start (app opened via
  // the link) and the app already running in the background.
  useEffect(() => {
    const handleUrl = (url: string) => {
      const hazardId = parseHazardIdFromUrl(url);
      if (!hazardId) return;
      const hazard = hazards.find((h) => h.id === hazardId);
      if (hazard) triggerAlert(hazard);
    };

    Linking.getInitialURL().then((url) => {
      if (url) handleUrl(url);
    });
    const subscription = Linking.addEventListener('url', ({ url }) => handleUrl(url));
    return () => subscription.remove();
  }, [hazards, triggerAlert]);

  const handleAlertRespond = (status: FamilyStatus) => {
    setFamily((prev) => prev.map((m) => (m.isSelf ? { ...m, status, updated: 'Just now' } : m)));
    setActiveAlertHazard(null);
    setAlertScreenVisible(false);
  };

  const handleAlertShowRoute = () => {
    if (!activeAlertHazard) return;
    const plan = resolvePlanForHazardType(plans, activeAlertHazard.type);
    const destination = plan ? resolvePlanDestination(plan, safeLocations) : null;
    if (destination) {
      setMapDestination(destination);
      setActiveTab('Map');
    }
    // Step aside from the full-screen block so the map is usable — the
    // alert remains unacknowledged (activeAlertHazard stays set), so the
    // slim banner picks up where the full screen left off.
    setAlertScreenVisible(false);
  };

  const onLayout = useCallback(async () => {
    if (fontsLoaded && dataLoaded) {
      await SplashScreen.hideAsync();
    }
  }, [fontsLoaded, dataLoaded]);

  if (!fontsLoaded || !dataLoaded) {
    return null;
  }

  const showFullAlert = alertScreenVisible && activeAlertHazard;
  const activeAlertPlan = activeAlertHazard ? resolvePlanForHazardType(plans, activeAlertHazard.type) : null;
  const activeAlertDestination = activeAlertPlan ? resolvePlanDestination(activeAlertPlan, safeLocations) : null;

  return (
    <PreferencesProvider>
      <SafeAreaProvider>
        <View style={{ flex: 1 }} onLayout={onLayout}>
          {showFullAlert ? (
            <AlertScreen
              hazard={activeAlertHazard}
              plan={activeAlertPlan}
              onRespond={handleAlertRespond}
              onShowRoute={activeAlertDestination ? handleAlertShowRoute : undefined}
            />
          ) : (
            <>
              <View style={{ flex: 1 }}>
                {activeTab === 'Home' && (
                  <HomeScreen
                    family={family}
                    hazards={hazards}
                    plans={plans}
                    onSeeAllFamily={() => setActiveTab('Family')}
                    onViewPlanForHazard={handleViewPlanForHazard}
                  />
                )}
                {activeTab === 'Map' && (
                  <MapScreen
                    hazards={hazards}
                    plans={plans}
                    onViewPlanForHazard={handleViewPlanForHazard}
                    destination={mapDestination}
                    onClearDestination={() => setMapDestination(null)}
                    openSettingsOnMount={openMapSettings}
                    onSettingsOnMountHandled={() => setOpenMapSettings(false)}
                  />
                )}
                {activeTab === 'Family' && <FamilyScreen family={family} onUpdateFamily={setFamily} />}
                {activeTab === 'Plans' && (
                  <PlansScreen
                    plans={plans}
                    onUpdatePlans={setPlans}
                    safeLocations={safeLocations}
                    onUpdateSafeLocations={setSafeLocations}
                    onNavigateToLocation={handleNavigateToLocation}
                    initialPlanId={targetPlanId}
                    onInitialPlanHandled={() => setTargetPlanId(null)}
                  />
                )}
                {activeTab === 'Settings' && (
                  <SettingsScreen
                    onResetFamily={setFamily}
                    onResetPlans={setPlans}
                    onResetSafeLocations={setSafeLocations}
                    onOpenMapSettings={handleOpenMapSettings}
                    onTriggerTestAlert={() => {
                      const testHazard = hazards.find((h) => h.status === 'active') ?? hazards[0];
                      if (testHazard) triggerAlert(testHazard);
                    }}
                  />
                )}
              </View>
              <RTabBar active={activeTab} onSelect={setActiveTab} />
              {activeAlertHazard && !alertScreenVisible && (
                <ActiveAlertBanner hazard={activeAlertHazard} onPress={() => setAlertScreenVisible(true)} />
              )}
            </>
          )}
          <ThemedStatusBar />
        </View>
      </SafeAreaProvider>
    </PreferencesProvider>
  );
}
