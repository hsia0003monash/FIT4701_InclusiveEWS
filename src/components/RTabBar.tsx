import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../theme/useTheme';
import { RText } from './RText';

export type TabKey = 'Home' | 'Map' | 'Family' | 'Plans' | 'Settings';

const TABS: { key: TabKey; activeIcon: keyof typeof Ionicons.glyphMap; icon: keyof typeof Ionicons.glyphMap }[] = [
  { key: 'Home', activeIcon: 'home', icon: 'home-outline' },
  { key: 'Map', activeIcon: 'map', icon: 'map-outline' },
  { key: 'Family', activeIcon: 'people', icon: 'people-outline' },
  { key: 'Plans', activeIcon: 'document-text', icon: 'document-text-outline' },
  { key: 'Settings', activeIcon: 'settings', icon: 'settings-outline' },
];

interface RTabBarProps {
  active: TabKey;
  onSelect?: (tab: TabKey) => void;
}

export function RTabBar({ active, onSelect }: RTabBarProps) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: colors.surface, borderTopColor: colors.hairline, paddingBottom: Math.max(insets.bottom, 10) },
      ]}
    >
      {TABS.map((tab) => {
        const isActive = tab.key === active;
        const tint = isActive ? colors.ink : colors.ink3;

        return (
          <Pressable
            key={tab.key}
            onPress={() => onSelect?.(tab.key)}
            accessibilityRole="tab"
            accessibilityState={{ selected: isActive }}
            accessibilityLabel={tab.key}
            style={styles.tab}
          >
            <Ionicons name={isActive ? tab.activeIcon : tab.icon} size={24} color={tint} />
            <RText variant="micro" color={tint} style={styles.label}>
              {tab.key}
            </RText>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    borderTopWidth: 1,
    paddingTop: 10,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    minHeight: 44,
  },
  label: {
    fontSize: 11,
  },
});
