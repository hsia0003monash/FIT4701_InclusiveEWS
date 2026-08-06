export const interFontMap = {
  '400': 'Inter_400Regular',
  '500': 'Inter_500Medium',
  '600': 'Inter_600SemiBold',
  '700': 'Inter_700Bold',
  '800': 'Inter_800ExtraBold',
} as const;

export function fontFamilyForWeight(weight: keyof typeof interFontMap): string {
  return interFontMap[weight];
}
