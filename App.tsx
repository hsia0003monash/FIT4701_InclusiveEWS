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
import { RTabBar, TabKey } from './src/components/RTabBar';

SplashScreen.preventAutoHideAsync();
const Screens: Record<TabKey, React.ComponentType> = {
  Home: HomeScreen,
  Map: MapScreen,

}
export default function App() {
  const [fontsLoaded] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
    Inter_800ExtraBold,
  });

  const [activeTab, setActiveTab] = useState<TabKey>('Home')

  const onLayout = useCallback(async () => {
    if (fontsLoaded) {
      await SplashScreen.hideAsync();
    }
  }, [fontsLoaded]);

  if (!fontsLoaded) {
    return null;
  }

  const ActiveScreen = Screens[activeTab]

  return (
    <SafeAreaProvider>
      <View style={{ flex: 1 }} onLayout={onLayout}>
        <View style={{ flex: 1 }}>
          <ActiveScreen />
        </View>
        <RTabBar active={activeTab} onSelect={setActiveTab} />
        <StatusBar style="auto" />
      </View>
    </SafeAreaProvider>
  );
}
