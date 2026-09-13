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
import { useCallback, useEffect, useRef, useState } from 'react';
import { View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { IncomingAlertOverlay } from './src/components/IncomingAlertOverlay';
import { SimulateThreatButton } from './src/components/SimulateThreatButton';
import { TabKey } from './src/components/RTabBar';
import { SettingsProvider, useSettings } from './src/context/SettingsContext';
import { MapAlert, PRIMARY_ALERT } from './src/data/alerts';
import { FamilyScreen } from './src/screens/FamilyScreen';
import { HomeScreen } from './src/screens/HomeScreen';
import { MapScreen } from './src/screens/MapScreen';
import { PlansScreen } from './src/screens/PlansScreen';
import { SettingsScreen } from './src/screens/SettingsScreen';

SplashScreen.preventAutoHideAsync();

// All five tabs now have real screens.
const ROUTABLE_TABS: TabKey[] = ['Home', 'Family', 'Map', 'Plans', 'Settings'];

// How long after launch the first threat auto-appears (ms). Gives the tester a moment
// to get oriented before the alert takes over the screen.
const AUTO_ALERT_DELAY_MS = 8000;

function AppContent({ onLayout }: { onLayout: () => void }) {
  const [activeTab, setActiveTab] = useState<TabKey>('Home');
  const [incomingThreat, setIncomingThreat] = useState<MapAlert | null>(null);
  const [focusAlertId, setFocusAlertId] = useState<string | null>(null);
  const { darkMode } = useSettings();
  // Ensures the auto-alert fires only once per app session.
  const autoAlertFired = useRef(false);

  const handleNavigate = useCallback((tab: TabKey) => {
    if (ROUTABLE_TABS.includes(tab)) {
      setActiveTab(tab);
    }
  }, []);

  const handleSeeOnMap = useCallback((alert: MapAlert) => {
    setIncomingThreat(null);
    setFocusAlertId(alert.id);
    setActiveTab('Map');
  }, []);

  // On first launch, automatically surface the main threat after a short timer.
  // The manual simulate button still works independently for facilitator control.
  useEffect(() => {
    if (autoAlertFired.current) return;
    const timer = setTimeout(() => {
      autoAlertFired.current = true;
      // Don't override a threat the facilitator may have already triggered manually.
      setIncomingThreat((current) => current ?? PRIMARY_ALERT);
    }, AUTO_ALERT_DELAY_MS);
    return () => clearTimeout(timer);
  }, []);

  return (
    <View style={{ flex: 1 }} onLayout={onLayout}>
      {activeTab === 'Family' && <FamilyScreen onNavigate={handleNavigate} />}
      {activeTab === 'Map' && (
        <MapScreen
          onNavigate={handleNavigate}
          focusAlertId={focusAlertId}
          onFocusHandled={() => setFocusAlertId(null)}
        />
      )}
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
