import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { PlanDetailModal } from '../components/PlanDetailModal';
import { RCard } from '../components/RCard';
import { RTabBar, TabKey } from '../components/RTabBar';
import { RText } from '../components/RText';
import { getPlanStats, getProgressFillColor, getProgressFillWidth, Plan, PLANS, PlanStatus } from '../data/plans';
import { useTheme } from '../theme/useTheme';

interface PlansScreenProps {
  onNavigate: (tab: TabKey) => void;
}

const STATUS_LABEL: Record<PlanStatus, string> = {
  ready: 'READY',
  ongoing: 'ONGOING',
  start: 'START',
};

function PlanTile({ plan, onPress }: { plan: Plan; onPress: () => void }) {
  const { colors, severity } = useTheme();
  const { total, done, percent } = getPlanStats(plan);

  const statusColor =
    plan.status === 'ready' ? severity.safe.fg : plan.status === 'ongoing' ? severity.watch.fg : colors.ink2;
  const fillColor = getProgressFillColor(percent);

  return (
    <Pressable onPress={onPress} accessibilityRole="button" accessibilityLabel={`${plan.name} plan, ${done} of ${total} complete`} style={styles.tileWrap}>
      <RCard style={styles.tile}>
        <RText variant="bodyEmphasis" color={colors.ink}>
          {plan.name}
        </RText>
        <RText variant="caption" color={colors.ink3}>
          Reviewed {plan.reviewed}
        </RText>
        <View style={[styles.progressTrack, { backgroundColor: colors.surface2 }]}>
          <View style={[styles.progressFill, { backgroundColor: fillColor, width: `${getProgressFillWidth(percent)}%` }]} />
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
    </Pressable>
  );
}

export function PlansScreen({ onNavigate }: PlansScreenProps) {
  const { colors } = useTheme();
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);
  const selectedPlan = PLANS.find((p) => p.id === selectedPlanId) ?? null;

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
              <PlanTile key={plan.id} plan={plan} onPress={() => setSelectedPlanId(plan.id)} />
            ))}
          </View>
        </ScrollView>
      </SafeAreaView>
      <RTabBar active="Plans" onSelect={onNavigate} />
      <PlanDetailModal plan={selectedPlan} onClose={() => setSelectedPlanId(null)} />
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
  tileWrap: {
    flexBasis: '47%',
    flexGrow: 1,
  },
  tile: {
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
});
