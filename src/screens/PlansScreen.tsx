import { Ionicons } from '@expo/vector-icons';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { RCard } from '../components/RCard';
import { RTabBar, TabKey } from '../components/RTabBar';
import { RText } from '../components/RText';
import { ChecklistItem, Plan, PLANS, PlanStatus } from '../data/plans';
import { useTheme } from '../theme/useTheme';

interface PlansScreenProps {
  onNavigate: (tab: TabKey) => void;
}

const STATUS_LABEL: Record<PlanStatus, string> = {
  ready: 'READY',
  ongoing: 'ONGOING',
  start: 'START',
};

function PlanTile({ plan }: { plan: Plan }) {
  const { colors, severity } = useTheme();
  const total = plan.checklist.length;
  const done = plan.checklist.filter((i) => i.done).length;
  const percent = Math.round((done / total) * 100);

  const statusColor =
    plan.status === 'ready' ? severity.safe.fg : plan.status === 'ongoing' ? severity.watch.fg : colors.ink2;
  const fillColor =
    plan.status === 'ready' ? severity.safe.fg : plan.status === 'ongoing' ? severity.watch.fg : colors.ink3;

  return (
    <RCard style={styles.tile}>
      <RText variant="bodyEmphasis" color={colors.ink}>
        {plan.name}
      </RText>
      <RText variant="caption" color={colors.ink3}>
        Reviewed {plan.reviewed}
      </RText>
      <View style={[styles.progressTrack, { backgroundColor: colors.surface2 }]}>
        <View style={[styles.progressFill, { backgroundColor: fillColor, width: `${percent}%` }]} />
      </View>
      <View style={styles.tileFooterRow}>
        <RText variant="caption" color={colors.ink} style={styles.tileRatio}>
          {done}/{total} · {percent}%
        </RText>
        <RText variant="micro" color={statusColor}>
          {STATUS_LABEL[plan.status]}
        </RText>
      </View>
    </RCard>
  );
}

function ChecklistRow({ item, colors, isLast }: { item: ChecklistItem; colors: ReturnType<typeof useTheme>['colors']; isLast: boolean }) {
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

export function PlansScreen({ onNavigate }: PlansScreenProps) {
  const { colors } = useTheme();

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
              PLAN AHEAD
            </RText>
          </View>

          <RText variant="largeTitle" color={colors.ink} accessibilityRole="header">
            Your plans
          </RText>

          <View style={styles.tileGrid}>
            {PLANS.map((plan) => (
              <PlanTile key={plan.id} plan={plan} />
            ))}
          </View>

          {PLANS.map((plan) => {
            const total = plan.checklist.length;
            const done = plan.checklist.filter((i) => i.done).length;

            return (
              <View key={plan.id} style={styles.planSection}>
                <View style={styles.sectionHeaderRow}>
                  <RText variant="sectionHeading" color={colors.ink}>
                    {plan.name} plan
                  </RText>
                  <RText variant="body" color={colors.ink2}>
                    {done} of {total}
                  </RText>
                </View>
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
            );
          })}
        </ScrollView>
      </SafeAreaView>
      <RTabBar active="Plans" onSelect={onNavigate} />
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
  tileGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  tile: {
    flexBasis: '47%',
    flexGrow: 1,
    gap: 8,
  },
  progressTrack: {
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: 6,
    borderRadius: 3,
  },
  tileFooterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  tileRatio: {
    fontWeight: '700',
  },
  planSection: {
    gap: 12,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
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
