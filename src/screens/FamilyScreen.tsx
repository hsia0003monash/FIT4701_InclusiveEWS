import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { RButton } from '../components/RButton';
import { RCard } from '../components/RCard';
import { RCenteredOverlay } from '../components/RCenteredOverlay';
import { RFormField } from '../components/RFormField';
import { RText } from '../components/RText';
import { SeverityBadge } from '../components/SeverityBadge';
import { useTheme } from '../theme/useTheme';
import type { Theme } from '../theme/useTheme';
import { FAMILY_STATUS_META, FamilyMember, FamilyStatus, SELECTABLE_FAMILY_STATUSES } from '../data/family';

interface FamilyScreenProps {
  family: FamilyMember[];
  onUpdateFamily: (family: FamilyMember[]) => void;
}

type PanelState =
  | { mode: 'view'; member: FamilyMember }
  | { mode: 'edit'; member: FamilyMember }
  | { mode: 'add'; member: null }
  | null;

// ---------------------------------------------------------------------------
// Status selector — three large, icon+label options. Used both for the
// current user's own status and inside the add/edit form for other members.
// Deliberately vertical/full-width rather than a row of small buttons —
// large individual targets, never distinguished by colour alone.
// ---------------------------------------------------------------------------
function StatusSelector({
  value,
  onChange,
  theme,
}: {
  value: FamilyStatus;
  onChange: (status: FamilyStatus) => void;
  theme: Theme;
}) {
  const { colors, severity, spacing, radius, sizing } = theme;

  return (
    <View style={{ gap: spacing.scale[3] }}>
      {SELECTABLE_FAMILY_STATUSES.map((status) => {
        const meta = FAMILY_STATUS_META[status];
        const tone = severity[meta.tone];
        const selected = value === status;

        return (
          <Pressable
            key={status}
            onPress={() => onChange(status)}
            accessibilityRole="button"
            accessibilityState={{ selected }}
            accessibilityLabel={meta.label}
            style={[
              styles.statusOption,
              {
                minHeight: sizing.touchTarget.preferredPrimary,
                borderRadius: radius.lg,
                paddingHorizontal: spacing.cardPadding,
                gap: spacing.scale[3],
                backgroundColor: selected ? tone.bg : colors.surface2,
                borderColor: selected ? tone.border : colors.hairline,
              },
            ]}
          >
            <Ionicons name={meta.icon} size={sizing.icon.large} color={selected ? tone.fg : colors.ink3} />
            <RText variant="bodyEmphasis" color={selected ? tone.fg : colors.ink}>
              {meta.label}
            </RText>
          </Pressable>
        );
      })}
    </View>
  );
}

export function FamilyScreen({ family, onUpdateFamily }: FamilyScreenProps) {
  const theme = useTheme();
  const { colors, severity, spacing, radius, sizing } = theme;

  const self = family.find((m) => m.isSelf) ?? null;
  const others = family.filter((m) => !m.isSelf);
  const safeCount = others.filter((m) => m.status === 'safe').length;

  const [panel, setPanel] = useState<PanelState>(null);
  const [draftName, setDraftName] = useState('');
  const [draftRelationship, setDraftRelationship] = useState('');
  const [draftLocation, setDraftLocation] = useState('');
  const [draftStatus, setDraftStatus] = useState<FamilyStatus>('checkIn');
  const [confirmingRemove, setConfirmingRemove] = useState(false);

  const closePanel = () => {
    setPanel(null);
    setConfirmingRemove(false);
  };

  const openView = (member: FamilyMember) => {
    setConfirmingRemove(false);
    setPanel({ mode: 'view', member });
  };

  const openEdit = (member: FamilyMember) => {
    setConfirmingRemove(false);
    setDraftName(member.name);
    setDraftRelationship(member.relationship);
    setDraftLocation(member.location);
    setDraftStatus(member.status);
    setPanel({ mode: 'edit', member });
  };

  const openAdd = () => {
    setConfirmingRemove(false);
    setDraftName('');
    setDraftRelationship('');
    setDraftLocation('');
    setDraftStatus('safe');
    setPanel({ mode: 'add', member: null });
  };

  const handleSave = () => {
    const name = draftName.trim();
    if (!name) return;

    if (panel?.mode === 'add') {
      const newMember: FamilyMember = {
        id: `member-${Date.now()}`,
        name,
        relationship: draftRelationship.trim() || 'Family member',
        location: draftLocation.trim() || 'Location unknown',
        status: draftStatus,
        updated: 'Just now',
      };
      onUpdateFamily([...family, newMember]);
    } else if (panel?.mode === 'edit') {
      onUpdateFamily(
        family.map((m) =>
          m.id === panel.member.id
            ? {
                ...m,
                name,
                relationship: draftRelationship.trim() || 'Family member',
                location: draftLocation.trim() || 'Location unknown',
                status: draftStatus,
                updated: 'Just now',
              }
            : m
        )
      );
    }
    closePanel();
  };

  const handleRemove = (member: FamilyMember) => {
    if (!confirmingRemove) {
      setConfirmingRemove(true);
      return;
    }
    onUpdateFamily(family.filter((m) => m.id !== member.id));
    closePanel();
  };

  const handleSelfStatusChange = (status: FamilyStatus) => {
    if (!self) return;
    onUpdateFamily(family.map((m) => (m.isSelf ? { ...m, status, updated: 'Just now' } : m)));
  };

  const isFormMode = panel?.mode === 'add' || panel?.mode === 'edit';

  return (
    <View style={[styles.screen, { backgroundColor: colors.bg }]}>
      <SafeAreaView edges={['top']} style={styles.flex}>
        <ScrollView contentContainerStyle={styles.content}>
          <View style={styles.headerRow}>
            <View style={styles.headerText}>
              <RText variant="eyebrowLabel" color={colors.ink3}>
                FAMILY
              </RText>
              <View style={styles.locationRow}>
                <Ionicons name="people" size={16} color={colors.ink} />
                <RText variant="bodyEmphasis" color={colors.ink}>
                  {family.length} people
                </RText>
              </View>
            </View>
            <View
              style={[styles.avatar, { backgroundColor: colors.ink, borderColor: colors.hairline }]}
              accessibilityRole="button"
              accessibilityLabel="Your profile"
            >
              <RText variant="secondary" color={colors.bg}>
                SL
              </RText>
            </View>
          </View>

          {self && (
            <RCard style={{ gap: spacing.scale[4] }}>
              <RText variant="sectionHeading" color={colors.ink}>
                Your status
              </RText>
              <StatusSelector value={self.status} onChange={handleSelfStatusChange} theme={theme} />
              <RText variant="caption" color={colors.ink3}>
                Last updated {self.updated}
              </RText>
            </RCard>
          )}

          <View style={styles.sectionHeaderRow}>
            <RText variant="sectionHeading" color={colors.ink}>
              Family members · {safeCount} safe
            </RText>
          </View>

          <RCard padded={false}>
            {others.map((member, index) => {
              const meta = FAMILY_STATUS_META[member.status];
              return (
                <Pressable
                  key={member.id}
                  onPress={() => openView(member)}
                  accessibilityRole="button"
                  accessibilityLabel={`${member.name}, ${meta.label}`}
                  style={[
                    styles.familyRow,
                    index < others.length - 1 && { borderBottomWidth: 1, borderBottomColor: colors.hairline },
                  ]}
                >
                  <View style={[styles.familyAvatar, { backgroundColor: colors.surface2 }]}>
                    <RText variant="bodyEmphasis" color={colors.ink2}>
                      {member.name.charAt(0)}
                    </RText>
                  </View>
                  <View style={styles.familyInfo}>
                    <RText variant="bodyEmphasis" color={colors.ink}>
                      {member.name}
                    </RText>
                    <RText variant="secondary" color={colors.ink3}>
                      {member.relationship} · {member.location}
                    </RText>
                  </View>
                  <View style={styles.familyStatus}>
                    <SeverityBadge tone={meta.tone} label={meta.label} icon={meta.icon} size="s" />
                    <RText variant="caption" color={colors.ink3}>
                      {member.updated}
                    </RText>
                  </View>
                </Pressable>
              );
            })}
          </RCard>

          <RButton
            label="Add family member"
            variant="secondary"
            size="l"
            icon="person-add"
            iconPosition="leading"
            onPress={openAdd}
            accessibilityHint="Opens a form to add a new family member"
          />
        </ScrollView>

        {/* Member detail / add / edit overlay */}
        {panel && (
          <RCenteredOverlay
            title={panel.mode === 'add' ? 'Add family member' : panel.mode === 'edit' ? 'Edit member' : panel.member.name}
            onDismiss={closePanel}
          >
              {panel.mode === 'view' && (
                <>
                  <View style={{ gap: spacing.scale[2] }}>
                    <RText variant="secondary" color={colors.ink3}>
                      {panel.member.relationship}
                    </RText>
                    <RText variant="body" color={colors.ink2}>
                      {panel.member.location}
                    </RText>
                  </View>

                  <View
                    style={[
                      styles.statusBadgeLarge,
                      {
                        borderRadius: radius.pill,
                        paddingHorizontal: spacing.scale[4],
                        paddingVertical: spacing.scale[2],
                        backgroundColor: severity[FAMILY_STATUS_META[panel.member.status].tone].bg,
                        borderColor: severity[FAMILY_STATUS_META[panel.member.status].tone].border,
                      },
                    ]}
                  >
                    <Ionicons
                      name={FAMILY_STATUS_META[panel.member.status].icon}
                      size={sizing.icon.medium}
                      color={severity[FAMILY_STATUS_META[panel.member.status].tone].fg}
                    />
                    <RText variant="bodyEmphasis" color={severity[FAMILY_STATUS_META[panel.member.status].tone].fg}>
                      {FAMILY_STATUS_META[panel.member.status].label}
                    </RText>
                  </View>

                  <RText variant="caption" color={colors.ink3}>
                    Updated {panel.member.updated}
                  </RText>

                  <RButton
                    label="Edit"
                    variant="primary"
                    size="l"
                    icon="create-outline"
                    iconPosition="leading"
                    onPress={() => openEdit(panel.member)}
                  />

                  <RButton
                    label={confirmingRemove ? 'Tap again to confirm' : 'Remove family member'}
                    variant="danger"
                    size="l"
                    icon="trash-outline"
                    iconPosition="leading"
                    onPress={() => handleRemove(panel.member)}
                    accessibilityHint={
                      confirmingRemove ? 'Removes this family member permanently' : undefined
                    }
                  />
                </>
              )}

              {isFormMode && (
                <>
                  <RFormField label="Name" value={draftName} onChangeText={setDraftName} placeholder="Full name" />
                  <RFormField
                    label="Relationship"
                    value={draftRelationship}
                    onChangeText={setDraftRelationship}
                    placeholder="e.g. Mother, Son"
                  />
                  <RFormField
                    label="Home location"
                    value={draftLocation}
                    onChangeText={setDraftLocation}
                    placeholder="e.g. 12 Smith St, Brunswick"
                  />

                  {panel.mode === 'edit' && (
                    <View style={{ gap: spacing.scale[2] }}>
                      <RText variant="caption" color={colors.ink3}>
                        Status
                      </RText>
                      <StatusSelector value={draftStatus} onChange={setDraftStatus} theme={theme} />
                    </View>
                  )}

                  <RButton
                    label={panel.mode === 'add' ? 'Add member' : 'Save changes'}
                    variant="primary"
                    size="l"
                    icon="checkmark"
                    iconPosition="leading"
                    onPress={handleSave}
                  />

                  {panel.mode === 'edit' && (
                    <RButton
                      label={confirmingRemove ? 'Tap again to confirm' : 'Remove family member'}
                      variant="danger"
                      size="l"
                      icon="trash-outline"
                      iconPosition="leading"
                      onPress={() => handleRemove(panel.member)}
                      accessibilityHint={
                        confirmingRemove ? 'Removes this family member permanently' : undefined
                      }
                    />
                  )}
                </>
              )}
          </RCenteredOverlay>
        )}
      </SafeAreaView>
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
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  headerText: {
    gap: 6,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  familyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 18,
    paddingVertical: 14,
    minHeight: 52,
  },
  familyAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  familyInfo: {
    flex: 1,
    gap: 2,
  },
  familyStatus: {
    alignItems: 'flex-end',
    gap: 4,
  },
  statusOption: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
  },
  statusBadgeLarge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 8,
    borderWidth: 1,
  },
});
