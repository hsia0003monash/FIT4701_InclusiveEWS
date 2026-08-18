import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, View } from 'react-native';
import { useTheme } from '../theme/useTheme';
import { RText } from './RText';

interface RCenteredOverlayProps {
  title: string;
  onDismiss: () => void;
  children: React.ReactNode;
  maxWidth?: number;
}

export function RCenteredOverlay({ title, onDismiss, children, maxWidth = 380 }: RCenteredOverlayProps) {
  const { colors, spacing, radius, sizing } = useTheme();

  return (
    <View style={styles.overlay} pointerEvents="box-none">
      <Pressable style={StyleSheet.absoluteFillObject} onPress={onDismiss} accessibilityLabel="Dismiss">
        <View style={[StyleSheet.absoluteFillObject, styles.scrim]} />
      </Pressable>

      <View
        style={[
          styles.panel,
          {
            maxWidth,
            backgroundColor: colors.surface,
            borderColor: colors.hairline,
            borderRadius: radius.card,
            padding: spacing.cardPadding,
            gap: spacing.scale[4],
          },
        ]}
      >
        <View style={styles.header}>
          <RText variant="bodyEmphasis" color={colors.ink}>
            {title}
          </RText>
          <Pressable
            style={[
              styles.closeButton,
              { width: sizing.touchTarget.preferredPrimary, height: sizing.touchTarget.preferredPrimary },
            ]}
            onPress={onDismiss}
            accessibilityLabel="Close"
          >
            <Ionicons name="close" size={sizing.icon.medium} color={colors.ink3} />
          </Pressable>
        </View>

        {children}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  panel: {
    width: '100%',
    maxHeight: '85%',
    borderWidth: 1,
    elevation: 6,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 6,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  closeButton: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrim: {
    backgroundColor: 'rgba(0,0,0,0.35)',
  },
});
