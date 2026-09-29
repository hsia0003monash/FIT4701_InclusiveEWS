import { AccessibilitySettings } from '../context/SettingsContext';

/** A ready-made accessibility profile: a named bundle of settings for a common need. */
export interface AccessibilityProfile {
  id: string;
  name: string;
  /** Ionicons name shown on the profile card. */
  icon: string;
  /** Plain-language description of who this suits and what it changes. */
  description: string;
  /** The settings this profile switches on. Anything omitted is turned off when applied. */
  settings: Partial<AccessibilitySettings>;
}

/**
 * Preset accessibility profiles, inferred from the project's user-testing personas.
 * Users pick the one closest to their needs and the app applies the whole bundle at once,
 * rather than making them find and toggle each setting individually.
 */
export const ACCESSIBILITY_PROFILES: AccessibilityProfile[] = [
  {
    id: 'low-vision',
    name: 'Low vision',
    icon: 'eye-outline',
    description: 'Bigger text, stronger contrast, and read-aloud made easy to find.',
    settings: { largeText: true, highContrast: true, audioFirst: true },
  },
  {
    id: 'blind',
    name: 'Blind / screen reader',
    icon: 'volume-high-outline',
    description: 'Audio-first: alerts are read aloud automatically, with strong vibration.',
    settings: { audioFirst: true, strongHaptics: true, highContrast: true, largeText: true },
  },
  {
    id: 'colour-blind',
    name: 'Colour blind',
    icon: 'color-palette-outline',
    description: 'Uses blue/amber instead of red/green, with shape-coded severity icons.',
    settings: { colourBlindPalette: true },
  },
  {
    id: 'low-peripheral',
    name: 'Reduced side vision',
    icon: 'scan-outline',
    description: 'Larger central text and high contrast so key info is easy to catch.',
    settings: { largeText: true, highContrast: true },
  },
  {
    id: 'hard-of-hearing',
    name: 'Deaf / hard of hearing',
    icon: 'ear-outline',
    description: 'Visual-first alerts with strong vibration instead of relying on sound.',
    settings: { strongHaptics: true, highContrast: true },
  },
  {
    id: 'simple',
    name: 'Simple mode',
    icon: 'happy-outline',
    description: 'Bigger text and clearer buttons — good if you are new to apps.',
    settings: { largeText: true },
  },
  {
    id: 'language-support',
    name: 'Language support',
    icon: 'language-outline',
    description: 'Read-aloud made prominent and bigger text, for extra reading help.',
    settings: { audioFirst: true, largeText: true },
  },
];
