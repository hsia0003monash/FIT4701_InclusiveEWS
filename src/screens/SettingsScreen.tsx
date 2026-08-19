import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { Alert, Linking, Pressable, ScrollView, StyleSheet, Vibration, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { RCard } from '../components/RCard';
import { RText } from '../components/RText';
import { useLanguage } from '../context/LanguageContext';
import { LangCode } from '../i18n/translations';
import { useTheme } from '../theme/useTheme';

interface Language {
  code: LangCode;
  label: string;
  labelNative: string;
}

const LANGUAGES: Language[] = [
  { code: 'hi', label: 'Hindi', labelNative: 'हिन्दी' },
  { code: 'en', label: 'English', labelNative: 'English' },
  { code: 'pa', label: 'Punjabi', labelNative: 'ਪੰਜਾਬੀ' },
  { code: 'ta', label: 'Tamil', labelNative: 'தமிழ்' },
  { code: 'zh', label: 'Chinese', labelNative: '中文' },
  { code: 'vi', label: 'Vietnamese', labelNative: 'Tiếng Việt' },
];

interface SettingToggle {
  id: string;
  icon: keyof typeof Ionicons.glyphMap;
  labelKey: 'readAlertsAloud' | 'vibrateOnAlert' | 'highContrast';
  defaultOn: boolean;
}

const TOGGLE_SETTINGS: SettingToggle[] = [
  { id: 'audio', icon: 'volume-high', labelKey: 'readAlertsAloud', defaultOn: true },
  { id: 'vibrate', icon: 'phone-portrait', labelKey: 'vibrateOnAlert', defaultOn: true },
  { id: 'contrast', icon: 'contrast', labelKey: 'highContrast', defaultOn: false },
];

interface EmergencyContact {
  id: string;
  name: string;
  relation: string;
  phone: string;
}

const CONTACTS: EmergencyContact[] = [
  { id: 'son', name: 'Rajesh', relation: 'Son', phone: '0412345678' },
  { id: 'emergency', name: 'Emergency', relation: 'Triple Zero', phone: '000' },
  { id: 'ses', name: 'SES', relation: 'Floods/Storm', phone: '132500' },
];

export function SettingsScreen() {
  const { colors, severity } = useTheme();
  const { lang, setLang, t, alt } = useLanguage();
  const [toggles, setToggles] = useState<Record<string, boolean>>(
    Object.fromEntries(TOGGLE_SETTINGS.map((s) => [s.id, s.defaultOn]))
  );
  const [textSize, setTextSize] = useState<'normal' | 'large' | 'extra-large'>('large');

  const handleLanguageSelect = (code: LangCode) => {
    setLang(code);
    const selected = LANGUAGES.find((l) => l.code === code)!;
    Alert.alert(
      t.languageChanged,
      `${selected.labelNative} (${selected.label})`,
      [{ text: t.ok }],
    );
  };

  const handleToggle = (id: string) => {
    setToggles((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleTextSize = () => {
    const sizes: Array<'normal' | 'large' | 'extra-large'> = ['normal', 'large', 'extra-large'];
    const currentIndex = sizes.indexOf(textSize);
    const nextIndex = (currentIndex + 1) % sizes.length;
    setTextSize(sizes[nextIndex]);
    Alert.alert(
      t.textSize,
      sizes[nextIndex],
      [{ text: t.ok }],
    );
  };

  const handleCallContact = (contact: EmergencyContact) => {
    Alert.alert(
      `${t.call} ${contact.name}?`,
      contact.phone,
      [
        { text: t.cancel, style: 'cancel' },
        { text: t.call, onPress: () => Linking.openURL(`tel:${contact.phone}`) },
      ],
    );
  };

  const handleTestAlert = () => {
    Vibration.vibrate([0, 300, 200, 600]);
    Alert.alert(
      `⚠️ ${t.testAlert}`,
      `${t.testAlertMessage}\n\n${alt.testAlertMessage}`,
      [{ text: t.ok }],
    );
  };

  return (
    <View style={[styles.screen, { backgroundColor: colors.bg }]}>
      <SafeAreaView edges={['top']} style={styles.flex}>
        <ScrollView contentContainerStyle={styles.content}>
          {/* Header */}
          <RText variant="title" color={colors.ink} accessibilityRole="header">
            {t.settings}
          </RText>
          <RText variant="body" color={colors.ink2}>
            {alt.settings}
          </RText>

          {/* Language */}
          <RText variant="sectionHeading" color={colors.ink} accessibilityRole="header">
            {t.language} · {alt.language}
          </RText>

          <RCard padded={false}>
            {LANGUAGES.map((item, index) => {
              const isSelected = item.code === lang;
              return (
                <Pressable
                  key={item.code}
                  style={[
                    styles.langRow,
                    index < LANGUAGES.length - 1 && { borderBottomWidth: 1, borderBottomColor: colors.hairline },
                    isSelected && { backgroundColor: severity.safe.bg },
                  ]}
                  accessibilityRole="radio"
                  accessibilityState={{ checked: isSelected }}
                  accessibilityLabel={`${item.label} ${item.labelNative}`}
                  onPress={() => handleLanguageSelect(item.code)}
                >
                  <View style={styles.langInfo}>
                    <RText variant="bodyEmphasis" color={colors.ink}>
                      {item.labelNative}
                    </RText>
                    <RText variant="secondary" color={colors.ink2}>
                      {item.label}
                    </RText>
                  </View>
                  {isSelected && (
                    <Ionicons name="checkmark-circle" size={26} color={severity.safe.fg} />
                  )}
                </Pressable>
              );
            })}
          </RCard>

          {/* Accessibility */}
          <RText variant="sectionHeading" color={colors.ink} accessibilityRole="header">
            {t.accessibility} · {alt.accessibility}
          </RText>

          <RCard padded={false}>
            {/* Text size */}
            <Pressable
              style={[styles.settingRow, { borderBottomWidth: 1, borderBottomColor: colors.hairline }]}
              onPress={handleTextSize}
              accessibilityRole="button"
              accessibilityLabel={`${t.textSize}, ${textSize}`}
            >
              <Ionicons name="text" size={22} color={colors.ink2} />
              <View style={styles.settingInfo}>
                <RText variant="bodyEmphasis" color={colors.ink}>
                  {t.textSize}
                </RText>
                <RText variant="caption" color={colors.ink3}>
                  {alt.textSize}
                </RText>
              </View>
              <RText variant="secondary" color={colors.ink2}>
                {textSize.charAt(0).toUpperCase() + textSize.slice(1)}
              </RText>
            </Pressable>

            {/* Toggles */}
            {TOGGLE_SETTINGS.map((setting, index) => {
              const isOn = toggles[setting.id];
              return (
                <Pressable
                  key={setting.id}
                  style={[
                    styles.settingRow,
                    index < TOGGLE_SETTINGS.length - 1 && { borderBottomWidth: 1, borderBottomColor: colors.hairline },
                  ]}
                  onPress={() => handleToggle(setting.id)}
                  accessibilityRole="switch"
                  accessibilityState={{ checked: isOn }}
                  accessibilityLabel={`${t[setting.labelKey]}, ${isOn ? 'on' : 'off'}`}
                >
                  <Ionicons name={setting.icon} size={22} color={colors.ink2} />
                  <View style={styles.settingInfo}>
                    <RText variant="bodyEmphasis" color={colors.ink}>
                      {t[setting.labelKey]}
                    </RText>
                    <RText variant="caption" color={colors.ink3}>
                      {alt[setting.labelKey]}
                    </RText>
                  </View>
                  <View style={[styles.toggleTrack, { backgroundColor: isOn ? severity.safe.fg : colors.surface2 }]}>
                    <View style={[styles.toggleThumb, { left: isOn ? 22 : 2 }]} />
                  </View>
                </Pressable>
              );
            })}
          </RCard>

          {/* Emergency contacts */}
          <RText variant="sectionHeading" color={colors.ink} accessibilityRole="header">
            {t.emergencyContacts} · {alt.emergencyContacts}
          </RText>

          <RCard padded={false}>
            {CONTACTS.map((contact, index) => (
              <Pressable
                key={contact.id}
                style={[
                  styles.contactRow,
                  index < CONTACTS.length - 1 && { borderBottomWidth: 1, borderBottomColor: colors.hairline },
                ]}
                accessibilityRole="button"
                accessibilityLabel={`${t.call} ${contact.name}, ${contact.phone}`}
                onPress={() => handleCallContact(contact)}
              >
                <View style={[styles.contactAvatar, { backgroundColor: colors.surface2 }]}>
                  <Ionicons name="call" size={20} color={colors.ink2} />
                </View>
                <View style={styles.contactInfo}>
                  <RText variant="bodyEmphasis" color={colors.ink}>
                    {contact.name}
                  </RText>
                  <RText variant="caption" color={colors.ink3}>
                    {contact.relation}
                  </RText>
                </View>
                <RText variant="bodyEmphasis" color={colors.accent}>
                  {contact.phone}
                </RText>
              </Pressable>
            ))}
          </RCard>

          {/* Test alert */}
          <RCard style={[styles.testCard, { backgroundColor: severity.advice.bg, borderColor: severity.advice.border }]}>
            <Pressable
              style={styles.testRow}
              accessibilityRole="button"
              accessibilityLabel={t.testAlert}
              onPress={handleTestAlert}
            >
              <Ionicons name="notifications" size={28} color={severity.advice.fg} />
              <View style={styles.testText}>
                <RText variant="bodyEmphasis" color={severity.advice.fg}>
                  {t.testAlert}
                </RText>
                <RText variant="caption" color={severity.advice.fg}>
                  {t.testAlertDesc}
                </RText>
              </View>
              <Ionicons name="chevron-forward" size={22} color={severity.advice.fg} />
            </Pressable>
          </RCard>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  flex: { flex: 1 },
  content: { padding: 20, gap: 16 },
  langRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingVertical: 14,
    minHeight: 56,
  },
  langInfo: { gap: 2 },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 18,
    paddingVertical: 14,
    minHeight: 56,
  },
  settingInfo: { flex: 1, gap: 2 },
  toggleTrack: {
    width: 44,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    position: 'relative',
  },
  toggleThumb: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
    position: 'absolute',
    top: 2,
  },
  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 18,
    paddingVertical: 14,
    minHeight: 56,
  },
  contactAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  contactInfo: { flex: 1, gap: 2 },
  testCard: { borderWidth: 2 },
  testRow: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  testText: { flex: 1, gap: 2 },
});
