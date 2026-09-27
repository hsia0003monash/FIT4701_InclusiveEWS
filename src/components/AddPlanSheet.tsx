import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { PLAN_PRESETS, PlanPreset } from '../data/plans';
import { useTheme } from '../theme/useTheme';
import { RBottomSheet } from './RBottomSheet';
import { RButton } from './RButton';
import { RCard } from './RCard';
import { RText } from './RText';

interface AddPlanSheetProps {
  visible: boolean;
  onClose: () => void;
  /** Add a ready-made plan from a preset template. */
  onSelectPreset: (preset: PlanPreset) => void;
  /** Create a blank custom plan with the given name. */
  onCreateCustom: (name: string) => void;
}

/**
 * Lets the user add a plan either by choosing a ready-made preset for a common emergency
 * (recommended tasks pre-filled) or by starting their own blank plan. Presets help users
 * who are unsure what to do or do not want to build a plan from scratch.
 */
export function AddPlanSheet({ visible, onClose, onSelectPreset, onCreateCustom }: AddPlanSheetProps) {
  const { colors } = useTheme();
  const [customName, setCustomName] = useState('');

  const handleClose = () => {
    setCustomName('');
    onClose();
  };

  const handleCreateCustom = () => {
    onCreateCustom(customName);
    setCustomName('');
  };

  return (
    <RBottomSheet visible={visible} onClose={handleClose} height="tall" accessibilityLabel="Close add plan">
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <View style={styles.headerRow}>
          <RText variant="title" color={colors.ink} accessibilityRole="header" style={styles.headerTitle}>
            Add a plan
          </RText>
          <Pressable
            onPress={handleClose}
            accessibilityRole="button"
            accessibilityLabel="Close"
            style={[styles.closeButton, { backgroundColor: colors.surface, borderColor: colors.hairline }]}
          >
            <Ionicons name="close" size={18} color={colors.ink} />
          </Pressable>
        </View>

        <RText variant="body" color={colors.ink2}>
          Not sure where to start? Pick a ready-made plan for a common emergency — the
          recommended steps are already filled in. You can tick them off and edit later.
        </RText>

        <View style={styles.section}>
          <RText variant="sectionHeading" color={colors.ink}>
            Ready-made plans
          </RText>
          {PLAN_PRESETS.map((preset) => (
            <Pressable
              key={preset.id}
              onPress={() => onSelectPreset(preset)}
              accessibilityRole="button"
              accessibilityLabel={`Add the ${preset.name} plan`}
              accessibilityHint={`${preset.tasks.length} recommended steps. ${preset.description}`}
            >
              <RCard style={styles.presetCard}>
                <View style={[styles.presetIcon, { backgroundColor: colors.surface2 }]}>
                  <Ionicons name={preset.icon as keyof typeof Ionicons.glyphMap} size={22} color={colors.ink} />
                </View>
                <View style={styles.presetInfo}>
                  <RText variant="bodyEmphasis" color={colors.ink}>
                    {preset.name}
                  </RText>
                  <RText variant="secondary" color={colors.ink3}>
                    {preset.description}
                  </RText>
                  <RText variant="micro" color={colors.ink3}>
                    {preset.tasks.length} steps · {preset.source}
                  </RText>
                </View>
                <Ionicons name="add-circle" size={26} color={colors.ink} />
              </RCard>
            </Pressable>
          ))}
        </View>

        <View style={styles.section}>
          <RText variant="sectionHeading" color={colors.ink}>
            Make your own
          </RText>
          <RText variant="secondary" color={colors.ink3}>
            Start a blank plan and add your own steps.
          </RText>
          <TextInput
            value={customName}
            onChangeText={setCustomName}
            placeholder="Name your plan (e.g. Power outage)"
            placeholderTextColor={colors.ink3}
            style={[styles.input, { borderColor: colors.hairline, color: colors.ink, backgroundColor: colors.surface }]}
            accessibilityLabel="Plan name"
            returnKeyType="done"
            onSubmitEditing={handleCreateCustom}
          />
          <RButton
            label="Create blank plan"
            variant="secondary"
            size="m"
            icon="add"
            iconPosition="leading"
            onPress={handleCreateCustom}
            fullWidth
          />
        </View>
      </ScrollView>
    </RBottomSheet>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: 20,
    gap: 18,
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
  section: {
    gap: 12,
  },
  presetCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  presetIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  presetInfo: {
    flex: 1,
    gap: 2,
  },
  input: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
  },
});
