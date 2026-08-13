import { Ionicons } from '@expo/vector-icons';
import { Modal, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ChecklistItem, getPlanStats, getProgressFillColor, getProgressFillWidth, Plan, PlanStatus } from '../data/plans';
import { useTheme } from '../theme/useTheme';
import { RCard } from './RCard';
import { RText } from './RText';

interface PlanDetailModalProps {
  plan: Plan | null;
  onClose: () => void;
}

const STATUS_LABEL: Record<PlanStatus, string> = {
  ready: 'READY',
  ongoing: 'ONGOING',
  start: 'START',
};

function ChecklistRow({
  item,
  colors,
  isLast,
}: {
  item: ChecklistItem;
  colors: ReturnType<typeof useTheme>['colors'];
  isLast: boolean;
}) {
  return (
    <View style={[styles.checklistRow, !isLast && { borderBottomWidth: 1, borderBottomColor: colors.hairline }]}>
      <View
        style={[
          styles.checkbox,
          item.done
            ? { backgroundColor: colors.ink, borderColor: colors.ink }
            : { backgroundColor: 'transparent', borderColor: colors.hairline },
        ]}
      >
        {item.done && <Ionicons name="checkmark" size={14} color={colors.bg} />}
      </View>
      <View style={styles.checklistText}>
        <RText
          variant="bodyEmphasis"
          color={item.done ? colors.ink3 : colors.ink}
          style={item.done ? styles.strikethrough : undefined}
        >
          {item.label}
        </RText>
        {item.detail && (
          <RText variant="secondary" color={colors.ink3}>
            {item.detail}
          </RText>
        )}
      </View>
      {item.expandable && <Ionicons name="chevron-forward" size={18} color={colors.ink3} />}
    </View>
  );
}

export function PlanDetailModal({ plan, onClose }: PlanDetailModalProps) {
  const { colors, severity, radius } = useTheme();

  return (
    <Modal visible={!!plan} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <Pressable
          style={StyleSheet.absoluteFill}
          onPress={onClose}
          accessibilityRole="button"
          accessibilityLabel="Close plan details"
        />
        {plan && (
          <SafeAreaView
            edges={['bottom']}
            style={[
              styles.sheet,
              { backgroundColor: colors.bg, borderTopLeftRadius: radius.sheet, borderTopRightRadius: radius.sheet },
            ]}
          >
            <View style={[styles.grabber, { backgroundColor: colors.hairline }]} />

            <ScrollView contentContainerStyle={styles.content}>
              {(() => {
                const { total, done, percent } = getPlanStats(plan);
                const statusColor =
                  plan.status === 'ready' ? severity.safe.fg : plan.status === 'ongoing' ? severity.watch.fg : colors.ink2;
                const fillColor = getProgressFillColor(percent);

                return (
                  <>
                    <View style={styles.headerRow}>
                      <RText variant="title" color={colors.ink} accessibilityRole="header" style={styles.headerTitle}>
                        {plan.name}
                      </RText>
                      <Pressable
                        onPress={onClose}
                        accessibilityRole="button"
                        accessibilityLabel="Close"
                        style={[styles.closeButton, { backgroundColor: colors.surface, borderColor: colors.hairline }]}
                      >
                        <Ionicons name="close" size={18} color={colors.ink} />
                      </Pressable>
                    </View>

                    <RText variant="secondary" color={colors.ink3}>
                      Created by {plan.createdBy} · Reviewed {plan.reviewed}
                    </RText>

                    <View style={[styles.progressTrack, { backgroundColor: colors.surface2 }]}>
                      <View
                        style={[styles.progressFill, { backgroundColor: fillColor, width: `${getProgressFillWidth(percent)}%` }]}
                      />
                    </View>
                    <View style={styles.statsRow}>
                      <RText variant="bodyEmphasis" color={colors.ink}>
                        {done}/{total} · {percent}%
                      </RText>
                      <RText variant="micro" color={statusColor}>
                        {STATUS_LABEL[plan.status]}
                      </RText>
                    </View>

                    <View style={styles.section}>
                      <RText variant="sectionHeading" color={colors.ink}>
                        Household
                      </RText>
                      <View style={styles.chipRow}>
                        {plan.participants.map((p) => (
                          <View key={p.name} style={[styles.chip, { backgroundColor: colors.surface2 }]}>
                            <View style={[styles.chipAvatar, { backgroundColor: colors.surface }]}>
                              <RText variant="micro" color={colors.ink2}>
                                {p.name.charAt(0)}
                              </RText>
                            </View>
                            <RText variant="secondary" color={colors.ink}>
                              {p.name}
                            </RText>
                          </View>
                        ))}
                      </View>
                    </View>

                    <View style={styles.section}>
                      <RText variant="sectionHeading" color={colors.ink}>
                        Preparedness
                      </RText>
                      <RCard padded={false}>
                        {plan.participants.map((p, index) => {
                          const pPercent = Math.round((p.stepsDone / total) * 100);
                          return (
                            <View
                              key={p.name}
                              style={[
                                styles.preparednessRow,
                                index < plan.participants.length - 1 && {
                                  borderBottomWidth: 1,
                                  borderBottomColor: colors.hairline,
                                },
                              ]}
                            >
                              <View style={[styles.chipAvatar, { backgroundColor: colors.surface2 }]}>
                                <RText variant="micro" color={colors.ink2}>
                                  {p.name.charAt(0)}
                                </RText>
                              </View>
                              <RText variant="body" color={colors.ink} style={styles.preparednessName}>
                                {p.name}
                              </RText>
                              <View style={[styles.miniTrack, { backgroundColor: colors.surface2 }]}>
                                <View style={[styles.miniFill, { backgroundColor: colors.ink3, width: `${pPercent}%` }]} />
                              </View>
                              <RText variant="caption" color={colors.ink3} style={styles.preparednessFraction}>
                                {p.stepsDone}/{total}
                              </RText>
                            </View>
                          );
                        })}
                      </RCard>
                    </View>

                    <View style={styles.section}>
                      <RText variant="sectionHeading" color={colors.ink}>
                        Checklist
                      </RText>
                      <RCard padded={false}>
                        {plan.checklist.map((item, index) => (
                          <ChecklistRow
                            key={item.label}
                            item={item}
                            colors={colors}
                            isLast={index === plan.checklist.length - 1}
                          />
                        ))}
                      </RCard>
                    </View>
                  </>
                );
              })()}
            </ScrollView>
          </SafeAreaView>
        )}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  sheet: {
    height: '92%',
    overflow: 'hidden',
  },
  grabber: {
    width: 36,
    height: 4,
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: 10,
  },
  content: {
    padding: 20,
    gap: 20,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 12,
  },
  headerTitle: {
    flex: 1,
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressTrack: {
    height: 12,
    borderRadius: 6,
    overflow: 'hidden',
  },
  progressFill: {
    height: 12,
    borderRadius: 6,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: -8,
  },
  section: {
    gap: 12,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 20,
  },
  chipAvatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  preparednessRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 18,
    paddingVertical: 12,
  },
  preparednessName: {
    flex: 1,
  },
  miniTrack: {
    width: 64,
    height: 4,
    borderRadius: 2,
    overflow: 'hidden',
  },
  miniFill: {
    height: 4,
    borderRadius: 2,
  },
  preparednessFraction: {
    width: 32,
    textAlign: 'right',
  },
  checklistRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    paddingHorizontal: 18,
    paddingVertical: 14,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  checklistText: {
    flex: 1,
    gap: 2,
  },
  strikethrough: {
    textDecorationLine: 'line-through',
  },
});
