import { Ionicons } from '@expo/vector-icons';
import { useEffect, useRef, useState } from 'react';
import { Animated, Pressable, ScrollView, StyleSheet, Vibration, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { RButton } from '../components/RButton';
import { RCard } from '../components/RCard';
import { RTabBar, TabKey } from '../components/RTabBar';
import { RText } from '../components/RText';
import { SeverityBadge } from '../components/SeverityBadge';
import { FAMILY, FamilyMember } from '../data/family';
import { useTheme } from '../theme/useTheme';

interface FamilyScreenProps {
  onNavigate: (tab: TabKey) => void;
}

export function FamilyScreen({ onNavigate }: FamilyScreenProps) {
  const { colors, severity } = useTheme();
  const [selectedId, setSelectedId] = useState<string | null>('kai');
  // Local, editable copy so actions like "I know they're safe" visibly update the list.
  const [members, setMembers] = useState<FamilyMember[]>(FAMILY);
  const [toast, setToast] = useState<string | null>(null);
  const toastOpacity = useRef(new Animated.Value(0)).current;
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Show a short confirmation banner (with a tactile buzz) and fade it out.
  const showToast = (message: string) => {
    Vibration.vibrate(60);
    setToast(message);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    Animated.timing(toastOpacity, { toValue: 1, duration: 180, useNativeDriver: true }).start();
    toastTimer.current = setTimeout(() => {
      Animated.timing(toastOpacity, { toValue: 0, duration: 260, useNativeDriver: true }).start(
        () => setToast(null),
      );
    }, 2200);
  };

  useEffect(() => () => {
    if (toastTimer.current) clearTimeout(toastTimer.current);
  }, []);

  const handleUpdateStatus = () => showToast("Status updated — your family has been told you're safe.");
  const handleCall = (member: FamilyMember) => showToast(`Calling ${member.name}…`);
  const handleNudge = (member: FamilyMember) => showToast(`Nudge sent to ${member.name}.`);
  const handleMarkSafe = (member: FamilyMember) => {
    setMembers((prev) =>
      prev.map((m) =>
        m.id === member.id
          ? { ...m, status: 'safe', updated: 'Just now', message: 'Marked safe by you.' }
          : m,
      ),
    );
    showToast(`${member.name} marked as safe.`);
  };
  const handleAdd = () => showToast('Add a person — coming soon.');

  const safeCount = members.filter((m) => m.status === 'safe').length + 1; // +1 for the user
  const waitingCount = members.filter((m) => m.status === 'checkIn').length;
  const total = members.length + 1;

  return (
    <View style={[styles.screen, { backgroundColor: colors.bg }]}>
      <SafeAreaView edges={['top']} style={styles.flex}>
        <ScrollView contentContainerStyle={styles.content}>
          <View style={styles.headerRow}>
            <Pressable
              onPress={() => onNavigate('Home')}
              accessibilityRole="button"
              accessibilityLabel="Back to Home"
              style={[styles.backButton, { backgroundColor: colors.surface, borderColor: colors.hairline }]}
            >
              <Ionicons name="chevron-back" size={18} color={colors.ink} />
            </Pressable>
            <RText variant="eyebrowLabel" color={colors.ink3}>
              FAMILY
            </RText>
          </View>

          <View style={styles.titleBlock}>
            <RText variant="largeTitle" color={colors.ink} accessibilityRole="header">
              Check-in
            </RText>
            <RText variant="body" color={colors.ink2}>
              {safeCount} of {total} people are safe · {waitingCount} waiting
            </RText>
          </View>

          <RCard
            style={[
              styles.statusCard,
              { backgroundColor: severity.safe.bg, borderColor: severity.safe.border },
            ]}
          >
            <RText variant="eyebrowLabel" color={severity.safe.fg}>
              YOUR STATUS
            </RText>
            <RText variant="bodyEmphasis" color={severity.safe.fg} style={styles.statusHeadline}>
              You said you're safe
            </RText>
            <RButton
              label="Update"
              variant="secondary"
              size="l"
              icon="checkmark-circle-outline"
              iconPosition="leading"
              onPress={handleUpdateStatus}
              accessibilityHint="Sends an updated safe status to your family"
              fullWidth
            />
            <View style={styles.statusFooterRow}>
              <Ionicons name="time-outline" size={14} color={severity.safe.fg} />
              <RText variant="caption" color={severity.safe.fg}>
                Sent to {members.length} people · updates every 15 min
              </RText>
            </View>
          </RCard>

          <View style={styles.sectionHeaderRow}>
            <RText variant="sectionHeading" color={colors.ink}>
              Your people
            </RText>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Add a person"
              onPress={handleAdd}
              style={styles.addRow}
            >
              <Ionicons name="add" size={16} color={colors.ink2} />
              <RText variant="body" color={colors.ink2}>
                Add
              </RText>
            </Pressable>
          </View>

          {members.map((member) => {
            const isWaiting = member.status === 'checkIn';
            const isSelected = member.id === selectedId;

            return (
              <Pressable
                key={member.id}
                onPress={() => setSelectedId((prev) => (prev === member.id ? null : member.id))}
                accessibilityRole="button"
                accessibilityLabel={`${member.name}, ${isWaiting ? 'waiting' : 'safe'}`}
                accessibilityState={{ expanded: isSelected }}
                accessibilityHint={isSelected ? 'Collapses quick actions' : 'Expands quick actions'}
              >
                <RCard
                  style={
                    isSelected
                      ? { borderColor: severity.watch.border, borderWidth: 1.5 }
                      : undefined
                  }
                >
                  <View style={styles.memberRow}>
                    <View style={[styles.avatar, { backgroundColor: colors.surface2 }]}>
                      <RText variant="bodyEmphasis" color={colors.ink2}>
                        {member.name.charAt(0)}
                      </RText>
                    </View>
                    <View style={styles.memberInfo}>
                      <RText variant="bodyEmphasis" color={colors.ink}>
                        {member.age ? `${member.name} · ${member.age}` : member.name}
                      </RText>
                      <View style={styles.locationRow}>
                        <Ionicons name="location-outline" size={13} color={colors.ink3} />
                        <RText variant="secondary" color={colors.ink3}>
                          {member.location}
                        </RText>
                      </View>
                    </View>
                    <SeverityBadge
                      tone={isWaiting ? 'watch' : 'safe'}
                      label={isWaiting ? 'Waiting' : 'Safe'}
                      icon={isWaiting ? 'warning' : 'checkmark-circle'}
                    />
                  </View>

                  <View style={[styles.messageBubble, { backgroundColor: colors.surface2 }]}>
                    <RText variant="body" color={colors.ink2}>
                      {member.message}
                    </RText>
                  </View>

                  {isSelected && (
                    <View style={styles.actionsRow}>
                      <RButton label="Call" variant="danger" size="s" icon="call" iconPosition="leading" onPress={() => handleCall(member)} style={styles.actionButton} />
                      <RButton label="Nudge" variant="secondary" size="s" onPress={() => handleNudge(member)} style={styles.actionButton} />
                      <RButton label="I know they're safe" variant="secondary" size="s" onPress={() => handleMarkSafe(member)} style={styles.actionButton} />
                    </View>
                  )}
                </RCard>
              </Pressable>
            );
          })}
        </ScrollView>
      </SafeAreaView>

      {toast && (
        <Animated.View
          pointerEvents="none"
          style={[styles.toast, { opacity: toastOpacity, backgroundColor: colors.ink, borderColor: colors.hairline }]}
          accessibilityLiveRegion="polite"
          accessibilityRole="alert"
        >
          <Ionicons name="checkmark-circle" size={18} color={colors.bg} />
          <RText variant="body" color={colors.bg} style={styles.toastText}>
            {toast}
          </RText>
        </Animated.View>
      )}

      <RTabBar active="Family" onSelect={onNavigate} />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  flex: {
    flex: 1,
  },
  content: {
    padding: 20,
    gap: 20,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleBlock: {
    gap: 6,
  },
  statusCard: {
    gap: 14,
    borderWidth: 1,
  },
  statusHeadline: {
    marginTop: -4,
  },
  statusFooterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  addRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  memberRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  memberInfo: {
    flex: 1,
    gap: 2,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  messageBubble: {
    borderRadius: 10,
    padding: 12,
    marginTop: 12,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
  },
  actionButton: {
    flex: 1,
  },
  toast: {
    position: 'absolute',
    left: 20,
    right: 20,
    bottom: 96,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
  toastText: {
    flex: 1,
  },
});
