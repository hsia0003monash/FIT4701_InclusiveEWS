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
import { useState, useCallback } from 'react';
import { View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { HomeScreen } from './src/screens/HomeScreen';
import { MapScreen } from './src/screens/MapScreen';
import { FamilyScreen } from './src/screens/FamilyScreen';
import { PlansScreen } from './src/screens/PlansScreen';
import { SettingsScreen } from './src/screens/SettingsScreen';
import { RTabBar, TabKey } from './src/components/RTabBar';
import { PreferencesProvider } from './src/theme/PreferencesContext';
import { useTheme } from './src/theme/useTheme';
import { usePersistentState } from './src/data/persistence';
import { INITIAL_FAMILY, FamilyMember } from './src/data/family';
import { INITIAL_HAZARDS, Hazard } from './src/data/hazards';
import { INITIAL_PLANS, INITIAL_SAFE_LOCATIONS, EvacuationPlan, SafeLocation, MapDestination } from './src/data/plans';

SplashScreen.preventAutoHideAsync();

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

  const onLayout = useCallback(async () => {
    if (fontsLoaded && dataLoaded) {
      await SplashScreen.hideAsync();
    }
  }, [fontsLoaded, dataLoaded]);

  if (!fontsLoaded || !dataLoaded) {
    return null;
  }

  return (
    <PreferencesProvider>
      <SafeAreaProvider>
        <View style={{ flex: 1 }} onLayout={onLayout}>
          <View style={{ flex: 1 }}>
            {activeTab === 'Home' && (
              <HomeScreen family={family} hazards={hazards} onSeeAllFamily={() => setActiveTab('Family')} />
            )}
            {activeTab === 'Map' && (
              <MapScreen hazards={hazards} destination={mapDestination} onClearDestination={() => setMapDestination(null)} />
            )}
            {activeTab === 'Family' && <FamilyScreen family={family} onUpdateFamily={setFamily} />}
            {activeTab === 'Plans' && (
              <PlansScreen
                plans={plans}
                onUpdatePlans={setPlans}
                safeLocations={safeLocations}
                onUpdateSafeLocations={setSafeLocations}
                onNavigateToLocation={handleNavigateToLocation}
              />
            )}
            {activeTab === 'Settings' && (
              <SettingsScreen
                onResetFamily={setFamily}
                onResetPlans={setPlans}
                onResetSafeLocations={setSafeLocations}
              />
            )}
          </View>
          <RTabBar active={activeTab} onSelect={setActiveTab} />
          <ThemedStatusBar />
        </View>
      </SafeAreaProvider>
    </PreferencesProvider>
  );
}
