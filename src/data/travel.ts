import { Ionicons } from '@expo/vector-icons';

export type TravelMode = 'driving' | 'walking' | 'transit';

export const ALL_TRAVEL_MODES: TravelMode[] = ['driving', 'walking', 'transit'];

export const TRAVEL_MODE_META: Record<
  TravelMode,
  { label: string; icon: keyof typeof Ionicons.glyphMap; durationSuffix: string }
> = {
  driving: { label: 'Drive', icon: 'car-outline', durationSuffix: 'min drive' },
  walking: { label: 'Walk', icon: 'walk-outline', durationSuffix: 'min walk' },
  transit: { label: 'Transit', icon: 'bus-outline', durationSuffix: 'min transit' },
};
