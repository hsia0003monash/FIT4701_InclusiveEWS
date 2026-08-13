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
import { TabKey } from './src/components/RTabBar';
import { SettingsProvider, useSettings } from './src/context/SettingsContext';
import { FamilyScreen } from './src/screens/FamilyScreen';
import { HomeScreen } from './src/screens/HomeScreen';
import { SettingsScreen } from './src/screens/SettingsScreen';

SplashScreen.preventAutoHideAsync();

// Only Home, Family, and Settings have real screens so far; Map/Plans are visual placeholders.
const ROUTABLE_TABS: TabKey[] = ['Home', 'Family', 'Settings'];

function AppContent({ onLayout }: { onLayout: () => void }) {
  const [activeTab, setActiveTab] = useState<TabKey>('Home');
  const { darkMode } = useSettings();

  const handleNavigate = useCallback((tab: TabKey) => {
    if (ROUTABLE_TABS.includes(tab)) {
      setActiveTab(tab);
    }
  }, []);

  return (
    <View style={{ flex: 1 }} onLayout={onLayout}>
      {activeTab === 'Family' && <FamilyScreen onNavigate={handleNavigate} />}
      {activeTab === 'Settings' && <SettingsScreen onNavigate={handleNavigate} />}
      {activeTab === 'Home' && <HomeScreen onNavigate={handleNavigate} />}
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
