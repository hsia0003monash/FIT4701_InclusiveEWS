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
import { FamilyScreen } from './src/screens/FamilyScreen';
import { HomeScreen } from './src/screens/HomeScreen';

SplashScreen.preventAutoHideAsync();

// Only Home and Family have real screens so far; the other tabs are visual placeholders.
const ROUTABLE_TABS: TabKey[] = ['Home', 'Family'];

export default function App() {
  const [activeTab, setActiveTab] = useState<TabKey>('Home');

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

  const handleNavigate = useCallback((tab: TabKey) => {
    if (ROUTABLE_TABS.includes(tab)) {
      setActiveTab(tab);
    }
  }, []);

  if (!fontsLoaded) {
    return null;
  }

  return (
    <SafeAreaProvider>
      <View style={{ flex: 1 }} onLayout={onLayout}>
        {activeTab === 'Family' ? (
          <FamilyScreen onNavigate={handleNavigate} />
        ) : (
          <HomeScreen onNavigate={handleNavigate} />
        )}
        <StatusBar style="auto" />
      </View>
    </SafeAreaProvider>
  );
}
