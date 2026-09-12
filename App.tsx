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
import { useCallback, useState } from 'react';
import { View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { IncomingAlertOverlay } from './src/components/IncomingAlertOverlay';
import { SimulateThreatButton } from './src/components/SimulateThreatButton';
import { TabKey } from './src/components/RTabBar';
import { SettingsProvider, useSettings } from './src/context/SettingsContext';
import { MapAlert } from './src/data/alerts';
import { FamilyScreen } from './src/screens/FamilyScreen';
import { HomeScreen } from './src/screens/HomeScreen';
import { MapScreen } from './src/screens/MapScreen';
import { PlansScreen } from './src/screens/PlansScreen';
import { SettingsScreen } from './src/screens/SettingsScreen';

SplashScreen.preventAutoHideAsync();

// All five tabs now have real screens.
const ROUTABLE_TABS: TabKey[] = ['Home', 'Family', 'Map', 'Plans', 'Settings'];

function AppContent({ onLayout }: { onLayout: () => void }) {
  const [activeTab, setActiveTab] = useState<TabKey>('Home');
  const [incomingThreat, setIncomingThreat] = useState<MapAlert | null>(null);
  const { darkMode } = useSettings();

  const handleNavigate = useCallback((tab: TabKey) => {
    if (ROUTABLE_TABS.includes(tab)) {
      setActiveTab(tab);
    }
  }, []);

  const handleSeeOnMap = useCallback(() => {
    setIncomingThreat(null);
    setActiveTab('Map');
  }, []);

  return (
    <View style={{ flex: 1 }} onLayout={onLayout}>
      {activeTab === 'Family' && <FamilyScreen onNavigate={handleNavigate} />}
      {activeTab === 'Map' && <MapScreen onNavigate={handleNavigate} />}
      {activeTab === 'Plans' && <PlansScreen onNavigate={handleNavigate} />}
      {activeTab === 'Settings' && <SettingsScreen onNavigate={handleNavigate} />}
      {activeTab === 'Home' && <HomeScreen onNavigate={handleNavigate} />}

      {/* Facilitator control: mock an incoming threat on demand during user testing. */}
      <SimulateThreatButton onTrigger={setIncomingThreat} />

      {/* Full-screen unavoidable alert that appears when a threat is pushed. */}
      <IncomingAlertOverlay
        alert={incomingThreat}
        onDismiss={() => setIncomingThreat(null)}
        onSeeOnMap={handleSeeOnMap}
      />

      <StatusBar style={darkMode ? 'light' : 'dark'} />
    </View>
  );
}

export default function App() {
  const [fontsLoaded] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
    Inter_800ExtraBold,
  });

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
      <SettingsProvider>
        <AppContent onLayout={onLayout} />
      </SettingsProvider>
    </SafeAreaProvider>
  );
}
