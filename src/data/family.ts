import { Ionicons } from '@expo/vector-icons';
import type { SeverityTone } from '../theme/tokens';

// ---------------------------------------------------------------------------
// Family data model
// ---------------------------------------------------------------------------
// Lives here (not in App.tsx directly) to avoid a circular import: App.tsx
// renders HomeScreen/FamilyScreen, and both of those need these types/values,
// so the shared definitions live in their own module. App.tsx still owns the
// live state (via useState), sourced from INITIAL_FAMILY below — this file
// only holds the shape and the starting seed data.

export type FamilyStatus = 'safe' | 'checkIn' | 'help';

export interface FamilyMember {
  id: string;
  name: string;
  relationship: string;
  location: string;
  status: FamilyStatus;
  updated: string;
  /** Marks the current user's own entry in the list. Exactly one member should have this set. */
  isSelf?: boolean;
}

export const FAMILY_STATUS_META: Record<
  FamilyStatus,
  { label: string; icon: keyof typeof Ionicons.glyphMap; tone: SeverityTone }
> = {
  safe: { label: 'Safe', icon: 'checkmark-circle', tone: 'safe' },
  checkIn: { label: 'Check in', icon: 'help-circle', tone: 'watch' },
  help: { label: 'Needs help', icon: 'alert-circle', tone: 'emergency' },
};

export const INITIAL_FAMILY: FamilyMember[] = [
  {
    id: 'self',
    name: 'You',
    relationship: 'You',
    location: 'Melbourne CBD · Home',
    status: 'safe',
    updated: 'Just now',
    isSelf: true,
  },
  {
    id: 'mum',
    name: 'Mum',
    relationship: 'Mother',
    location: 'Apt 12B · Same building',
    status: 'safe',
    updated: '12 min ago',
  },
  {
    id: 'dad',
    name: 'Dad',
    relationship: 'Father',
    location: 'Apt 12B · Same building',
    status: 'safe',
    updated: '12 min ago',
  },
  {
    id: 'kai',
    name: 'Kai (8)',
    relationship: 'Son',
    location: 'School · Kew',
    status: 'checkIn',
    updated: 'Not replied',
  },
  {
    id: 'husband',
    name: 'Husband',
    relationship: 'Husband',
    location: 'Work · Southbank',
    status: 'safe',
    updated: '1h ago',
  },
];
