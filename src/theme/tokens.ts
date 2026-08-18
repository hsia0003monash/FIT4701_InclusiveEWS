export const typography = {
  weights: { regular: '400', medium: '500', semibold: '600', bold: '700', heavy: '700', black: '800' } as const,
  scale: {
    largeTitle: { fontSize: 32, fontWeight: '800' as const, letterSpacing: -0.8, lineHeight: 32 * 1.15 },
    heroHeadline: { fontSize: 26, fontWeight: '700' as const, letterSpacing: -0.6, lineHeight: 26 * 1.2 },
    title: { fontSize: 22, fontWeight: '700' as const, letterSpacing: -0.4, lineHeight: 22 * 1.2 },
    sectionHeading: { fontSize: 17, fontWeight: '700' as const, letterSpacing: 0, lineHeight: 17 * 1.2 },
    body: { fontSize: 16, fontWeight: '500' as const, letterSpacing: 0, lineHeight: 16 * 1.3 },
    bodyEmphasis: { fontSize: 17, fontWeight: '600' as const, letterSpacing: 0, lineHeight: 17 * 1.3 },
    secondary: { fontSize: 14, fontWeight: '500' as const, letterSpacing: 0, lineHeight: 14 * 1.3 },
    caption: { fontSize: 13, fontWeight: '500' as const, letterSpacing: 0, lineHeight: 13 * 1.3 },
    micro: { fontSize: 12, fontWeight: '600' as const, letterSpacing: 0, lineHeight: 12 * 1.3 },
    eyebrowLabel: { fontSize: 12, fontWeight: '700' as const, letterSpacing: 1.0, lineHeight: 12 * 1.3, textTransform: 'uppercase' as const },
  },
};

export const spacing = {
  scale: [2, 4, 6, 8, 10, 12, 14, 16, 18, 20, 22, 24, 28, 32],
  screenPadding: 20,
  cardPadding: 18,
  listRowMinHeight: 52,
};

export const radius = {
  sm: 6, md: 10, lg: 12, xl: 14, xxl: 16, pill: 9999,
  card: 16, sheet: 24,
};

export const sizing = {
  touchTarget: { minimum: 44, preferredPrimary: 56 },
  button: {
    l: { height: 56, fontSize: 18, radius: 14 },
    m: { height: 48, fontSize: 16, radius: 12 },
    s: { height: 40, fontSize: 14, radius: 10 },
  },
  avatar: { small: 36, medium: 40, large: 44 },
  icon: { small: 14, medium: 18, large: 22, hero: 28 },
};

const lightColor = {
  bg: '#F7F5F2', surface: '#FFFFFF', surface2: '#EFECE6',
  ink: '#15161A', ink2: '#4A4D55', ink3: '#7B7F88',
  hairline: 'rgba(21,22,26,0.09)', accent: '#2B3A4E',
};

const darkColor = {
  bg: '#0E0F12', surface: '#1A1C21', surface2: '#22252B',
  ink: '#F2F2F0', ink2: '#B4B8C0', ink3: '#7B7F88',
  hairline: 'rgba(255,255,255,0.12)', accent: '#BBD0EC',
};

const severityLight = {
  advice: { fg: '#2B3A4E', bg: '#E6ECF3', border: '#B8C5D4' },
  watch: { fg: '#8A3F00', bg: '#FBEEDC', border: '#E8C79B' },
  emergency: { fg: '#7A0E12', bg: '#F9DDDD', border: '#E69E9E' },
  safe: { fg: '#124A2B', bg: '#DDEFE1', border: '#9FC8AB' },
};

const severityDark = {
  advice: { fg: '#BBD0EC', bg: '#1F2A3A', border: '#3B4C66' },
  watch: { fg: '#F5C680', bg: '#3A2810', border: '#6B4820' },
  emergency: { fg: '#F2A0A0', bg: '#3A1414', border: '#6E2525' },
  safe: { fg: '#9FD8B0', bg: '#12301F', border: '#2C5A3E' },
};

// Higher-contrast severity variants — stronger saturation and a wider
// fg/bg contrast ratio than the default severity palette above. Used when
// the user enables High contrast in Settings, since the default severity
// colors (soft tinted backgrounds) don't meet the same contrast bar as the
// rest of high-contrast mode otherwise does.
const severityHighContrastLight = {
  advice: { fg: '#FFFFFF', bg: '#0B3D91', border: '#0B3D91' },
  watch: { fg: '#000000', bg: '#FFB300', border: '#7A4B00' },
  emergency: { fg: '#FFFFFF', bg: '#C40000', border: '#7A0000' },
  safe: { fg: '#FFFFFF', bg: '#067A3D', border: '#04532A' },
};

const severityHighContrastDark = {
  advice: { fg: '#000000', bg: '#6FA8FF', border: '#FFFFFF' },
  watch: { fg: '#000000', bg: '#FFC94D', border: '#FFFFFF' },
  emergency: { fg: '#FFFFFF', bg: '#FF4040', border: '#FFFFFF' },
  safe: { fg: '#000000', bg: '#4CD787', border: '#FFFFFF' },
};

export const color = {
  light: lightColor,
  dark: darkColor,
  highContrastOverrides: {
    light: {
      bg: '#FFFFFF', surface: '#FFFFFF', surface2: '#E0E0E0',
      ink: '#000000', ink2: '#000000', ink3: '#000000',
      hairline: 'rgba(0,0,0,0.6)', accent: '#0B3D91',
    },
    dark: {
      bg: '#000000', surface: '#000000', surface2: '#1A1A1A',
      ink: '#FFFFFF', ink2: '#FFFFFF', ink3: '#FFFFFF',
      hairline: 'rgba(255,255,255,0.7)', accent: '#6FA8FF',
    },
  },
  severity: { light: severityLight, dark: severityDark },
  severityHighContrast: { light: severityHighContrastLight, dark: severityHighContrastDark },
};

export type SeverityTone = keyof typeof severityLight;

export const severityLevels = {
  order: ['calm', 'advice', 'watch', 'emergency'] as const,
  calm: { label: 'All clear', icon: 'checkmark-circle' as const, tone: 'safe' as SeverityTone },
  advice: { label: 'Advice', icon: 'information-circle' as const, tone: 'advice' as SeverityTone },
  watch: { label: 'Watch and act', icon: 'triangle' as const, tone: 'watch' as SeverityTone },
  emergency: { label: 'Emergency', icon: 'square' as const, tone: 'emergency' as SeverityTone },
};

export type SeverityLevel = keyof typeof severityLevels extends infer K
  ? K extends 'order' ? never : K
  : never;
