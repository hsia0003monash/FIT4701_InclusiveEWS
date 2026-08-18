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
import { RTabBar, TabKey } from './src/components/RTabBar';
import { INITIAL_FAMILY, FamilyMember } from './src/data/family';

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
            <HomeScreen family={family} onSeeAllFamily={() => setActiveTab('Family')} />
          )}
          {activeTab === 'Map' && <MapScreen />}
          {activeTab === 'Family' && <FamilyScreen family={family} onUpdateFamily={setFamily} />}
        </View>
        <RTabBar active={activeTab} onSelect={setActiveTab} />
        <StatusBar style="auto" />
      </View>
    </SafeAreaProvider>
  );
}
