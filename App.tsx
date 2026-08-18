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
import { RTabBar, TabKey } from './src/components/RTabBar';
import { INITIAL_FAMILY, FamilyMember } from './src/data/family';
import { INITIAL_HAZARDS, Hazard } from './src/data/hazards';
import { INITIAL_PLANS, INITIAL_SAFE_LOCATIONS, EvacuationPlan, SafeLocation, MapDestination } from './src/data/plans';

SplashScreen.preventAutoHideAsync();

export default function App() {
  const [fontsLoaded] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
    Inter_800ExtraBold,
  });

  const [activeTab, setActiveTab] = useState<TabKey>('Home');

  // Single source of truth for the family list — both HomeScreen (read-only
  // summary) and FamilyScreen (full add/edit/remove/status control) act on
  // this same state, so they can never drift out of sync with each other.
  const [family, setFamily] = useState<FamilyMember[]>(INITIAL_FAMILY);

  // Same pattern for hazards — MapScreen (full map display) and HomeScreen
  // (featured alert card) both read from this single app-level list.
  const [hazards, setHazards] = useState<Hazard[]>(INITIAL_HAZARDS);

  // Same pattern again for plans and safe locations — both owned by
  // PlansScreen, but lifted to app scope in case other screens need them later.
  const [plans, setPlans] = useState<EvacuationPlan[]>(INITIAL_PLANS);
  const [safeLocations, setSafeLocations] = useState<SafeLocation[]>(INITIAL_SAFE_LOCATIONS);

  // Set when the user taps "Show directions" on a plan — switches to the Map
  // tab and draws a route preview there. Persists across tab switches until
  // explicitly cleared, so navigating away and back keeps the route visible.
  const [mapDestination, setMapDestination] = useState<MapDestination | null>(null);

  const handleNavigateToLocation = (destination: MapDestination) => {
    setMapDestination(destination);
    setActiveTab('Map');
  };

  const onLayout = useCallback(async () => {
    if (fontsLoaded) {
      await SplashScreen.hideAsync();
    }
  }, [fontsLoaded]);

  if (!fontsLoaded) {
    return null;
  }

  return (
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
        </View>
        <RTabBar active={activeTab} onSelect={setActiveTab} />
        <StatusBar style="auto" />
      </View>
    </SafeAreaProvider>
  );
}
