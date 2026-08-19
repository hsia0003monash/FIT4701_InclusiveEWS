import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { Alert, Linking, Pressable, ScrollView, StyleSheet, Vibration, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { RButton } from '../components/RButton';
import { RCard } from '../components/RCard';
import { RText } from '../components/RText';
import { SeverityBadge } from '../components/SeverityBadge';
import { useLanguage } from '../context/LanguageContext';
import { useTheme } from '../theme/useTheme';

type MemberStatus = 'safe' | 'unknown' | 'danger';

interface FamilyMember {
  id: string;
  name: string;
  phone: string;
  status: MemberStatus;
  lastSeen: string;
}

const INITIAL_FAMILY: FamilyMember[] = [
  { id: 'son', name: 'Rajesh', phone: '0412345678', status: 'safe', lastSeen: '5 min ago' },
  { id: 'daughter-in-law', name: 'Priya', phone: '0412345679', status: 'safe', lastSeen: '20 min ago' },
  { id: 'grandson1', name: 'Arjun (10)', phone: '0412345680', status: 'unknown', lastSeen: 'Not replied' },
  { id: 'granddaughter', name: 'Meera (7)', phone: '0412345681', status: 'unknown', lastSeen: 'Not replied' },
];

function statusToTone(status: MemberStatus) {
  switch (status) {
    case 'safe': return 'safe' as const;
    case 'danger': return 'emergency' as const;
    case 'unknown': return 'watch' as const;
  }
}

function statusIcon(status: MemberStatus): keyof typeof Ionicons.glyphMap {
  switch (status) {
    case 'safe': return 'checkmark-circle';
    case 'danger': return 'alert-circle';
    case 'unknown': return 'help-circle';
  }
}

export function FamilyScreen() {
  const { colors, severity } = useTheme();
  const { t, alt } = useLanguage();
  const [family, setFamily] = useState(INITIAL_FAMILY);
  const [broadcastSent, setBroadcastSent] = useState(false);

  const handleBroadcastSafe = () => {
    Vibration.vibrate(200);
    setBroadcastSent(true);
    Alert.alert(
      t.sent,
      `${t.sentConfirmation}\n${alt.sentConfirmation}`,
      [{ text: t.ok }],
    );
    setTimeout(() => setBroadcastSent(false), 5000);
  };

  const handleCall = (member: FamilyMember) => {
    Alert.alert(
      `${t.call} ${member.name}?`,
      '',
      [
        { text: t.cancel, style: 'cancel' },
        { text: t.call, onPress: () => Linking.openURL(`tel:${member.phone}`) },
      ],
    );
  };

  const handleCheckIn = (member: FamilyMember) => {
    Vibration.vibrate(100);
    Alert.alert(
      t.checkInSent,
      t.notificationSentTo.replace('{name}', member.name) + '\n' + alt.notificationSentTo.replace('{name}', member.name),
      [{ text: t.ok }],
    );
    setFamily((prev) =>
      prev.map((m) => m.id === member.id ? { ...m, lastSeen: 'Sent just now' } : m)
    );
  };

  const getStatusLabel = (status: MemberStatus) => {
    switch (status) {
      case 'safe': return t.safe;
      case 'unknown': return t.noReply;
      case 'danger': return t.danger;
    }
  };

  return (
    <View style={[styles.screen, { backgroundColor: colors.bg }]}>
      <SafeAreaView edges={['top']} style={styles.flex}>
        <ScrollView contentContainerStyle={styles.content}>
          {/* Header */}
          <RText variant="title" color={colors.ink} accessibilityRole="header">
            {t.familySafety}
          </RText>
          <RText variant="body" color={colors.ink2}>
            {alt.familySafety}
          </RText>

          {/* Big "I'm Safe" broadcast button */}
          <RCard style={[styles.broadcastCard, { backgroundColor: severity.safe.bg, borderColor: severity.safe.border }]}>
            <View style={styles.broadcastContent}>
              <Ionicons name={broadcastSent ? 'checkmark-done-circle' : 'shield-checkmark'} size={36} color={severity.safe.fg} />
              <View style={styles.broadcastText}>
                <RText variant="bodyEmphasis" color={severity.safe.fg}>
                  {broadcastSent ? t.sent : t.tellEveryoneSafe}
                </RText>
                <RText variant="secondary" color={severity.safe.fg}>
                  {broadcastSent ? alt.sent : alt.tellEveryoneSafe}
                </RText>
              </View>
            </View>
            {!broadcastSent && (
              <RButton
                label={t.imSafe}
                variant="primary"
                size="l"
                icon="checkmark-circle"
                iconPosition="leading"
                onPress={handleBroadcastSafe}
                accessibilityHint={alt.imSafe}
              />
            )}
          </RCard>

          {/* Family members */}
          <RText variant="sectionHeading" color={colors.ink} accessibilityRole="header">
            {t.familyMembers}
          </RText>
          <RText variant="secondary" color={colors.ink2}>
            {alt.familyMembers}
          </RText>

          {family.map((member) => {
            const tone = statusToTone(member.status);
            const toneColors = severity[tone];

            return (
              <RCard key={member.id} style={styles.memberCard}>
                <View style={styles.memberRow}>
                  <View style={[styles.avatar, { backgroundColor: toneColors.bg, borderColor: toneColors.border }]}>
                    <RText variant="title" color={toneColors.fg}>
                      {member.name.charAt(0)}
                    </RText>
                  </View>

                  <View style={styles.memberInfo}>
                    <RText variant="bodyEmphasis" color={colors.ink}>
                      {member.name}
                    </RText>
                  </View>

                  <View style={styles.statusCol}>
                    <SeverityBadge
                      tone={tone}
                      label={getStatusLabel(member.status)}
                      icon={statusIcon(member.status)}
                      size="s"
                    />
                    <RText variant="caption" color={colors.ink3}>
                      {member.lastSeen}
                    </RText>
                  </View>
                </View>

                {/* Action buttons */}
                <View style={styles.memberActions}>
                  <Pressable
                    style={[styles.actionBtn, { backgroundColor: colors.surface2 }]}
                    accessibilityRole="button"
                    accessibilityLabel={`${t.call} ${member.name}`}
                    onPress={() => handleCall(member)}
                  >
                    <Ionicons name="call" size={22} color={colors.ink} />
                    <RText variant="secondary" color={colors.ink}>
                      {t.call}
                    </RText>
                  </Pressable>

                  {member.status === 'unknown' && (
                    <Pressable
                      style={[styles.actionBtn, { backgroundColor: severity.watch.bg }]}
                      accessibilityRole="button"
                      accessibilityLabel={`${t.checkIn} ${member.name}`}
                      onPress={() => handleCheckIn(member)}
                    >
                      <Ionicons name="notifications" size={22} color={severity.watch.fg} />
                      <RText variant="secondary" color={severity.watch.fg}>
                        {t.checkIn}
                      </RText>
                    </Pressable>
                  )}
                </View>
              </RCard>
            );
          })}
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  flex: { flex: 1 },
  content: { padding: 20, gap: 16 },
  broadcastCard: { gap: 16, borderWidth: 2 },
  broadcastContent: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  broadcastText: { flex: 1, gap: 2 },
  memberCard: { gap: 14 },
  memberRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  memberInfo: { flex: 1, gap: 2 },
  statusCol: { alignItems: 'flex-end', gap: 4 },
  memberActions: { flexDirection: 'row', gap: 12 },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    minHeight: 48,
  },
});
