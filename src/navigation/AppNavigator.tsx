import { Ionicons } from '@expo/vector-icons';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useLanguage } from '../context/LanguageContext';
import { useTheme } from '../theme/useTheme';
import { FamilyScreen } from '../screens/FamilyScreen';
import { HomeScreen } from '../screens/HomeScreen';
import { MapScreen } from '../screens/MapScreen';
import { PlansScreen } from '../screens/PlansScreen';
import { SettingsScreen } from '../screens/SettingsScreen';
import { Translations } from '../i18n/translations';

const Tab = createBottomTabNavigator();

const TABS: {
  name: string;
  component: React.ComponentType;
  activeIcon: keyof typeof Ionicons.glyphMap;
  icon: keyof typeof Ionicons.glyphMap;
  labelKey: keyof Translations;
}[] = [
  { name: 'Home', component: HomeScreen, activeIcon: 'home', icon: 'home-outline', labelKey: 'tabHome' },
  { name: 'Map', component: MapScreen, activeIcon: 'map', icon: 'map-outline', labelKey: 'tabMap' },
  { name: 'Family', component: FamilyScreen, activeIcon: 'people', icon: 'people-outline', labelKey: 'tabFamily' },
  { name: 'Plans', component: PlansScreen, activeIcon: 'document-text', icon: 'document-text-outline', labelKey: 'tabPlans' },
  { name: 'Settings', component: SettingsScreen, activeIcon: 'settings', icon: 'settings-outline', labelKey: 'tabSettings' },
];

export function AppNavigator() {
  const { colors } = useTheme();
  const { t } = useLanguage();

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarIcon: ({ focused, color, size }) => {
          const tab = TABS.find((tabItem) => tabItem.name === route.name)!;
          const iconName = focused ? tab.activeIcon : tab.icon;
          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: colors.ink,
        tabBarInactiveTintColor: colors.ink3,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.hairline,
        },
        tabBarLabelStyle: {
          fontFamily: 'Inter_600SemiBold',
          fontSize: 11,
        },
      })}
    >
      {TABS.map((tab) => (
        <Tab.Screen
          key={tab.name}
          name={tab.name}
          component={tab.component}
          options={{ tabBarLabel: t[tab.labelKey] as string }}
        />
      ))}
    </Tab.Navigator>
  );
}
