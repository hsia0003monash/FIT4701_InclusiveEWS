import { ReactNode, useRef } from 'react';
import { Animated, Modal, PanResponder, Pressable, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../theme/useTheme';

interface RBottomSheetProps {
  visible: boolean;
  onClose: () => void;
  children: ReactNode;
  /** 'auto' caps height to content (up to 82%); 'tall' fixes it at 92%, for content-heavy sheets. */
  height?: 'auto' | 'tall';
  accessibilityLabel?: string;
}

// Drag-to-dismiss thresholds: either dragged far enough, or flicked fast enough.
const DISMISS_DISTANCE = 120;
const DISMISS_VELOCITY = 1.2;
const CLOSE_ANIMATION_TARGET = 700;

export function RBottomSheet({ visible, onClose, children, height = 'auto', accessibilityLabel = 'Close' }: RBottomSheetProps) {
  const { colors, radius } = useTheme();
  const translateY = useRef(new Animated.Value(0)).current;

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, gesture) => Math.abs(gesture.dy) > 2,
      onPanResponderMove: (_, gesture) => {
        if (gesture.dy > 0) translateY.setValue(gesture.dy);
      },
      onPanResponderRelease: (_, gesture) => {
        if (gesture.dy > DISMISS_DISTANCE || gesture.vy > DISMISS_VELOCITY) {
          Animated.timing(translateY, {
            toValue: CLOSE_ANIMATION_TARGET,
            duration: 200,
            useNativeDriver: true,
          }).start(() => {
            translateY.setValue(0);
            onClose();
          });
        } else {
          Animated.spring(translateY, { toValue: 0, useNativeDriver: true, bounciness: 4 }).start();
        }
      },
    }),
  ).current;

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} accessibilityRole="button" accessibilityLabel={accessibilityLabel} />

        {visible && (
          <Animated.View
            style={[
              height === 'tall' ? styles.sheetTall : styles.sheetAuto,
              {
                backgroundColor: colors.bg,
                borderTopLeftRadius: radius.sheet,
                borderTopRightRadius: radius.sheet,
                transform: [{ translateY }],
              },
            ]}
          >
            <SafeAreaView edges={['bottom']} style={styles.safeArea}>
              <View {...panResponder.panHandlers} style={styles.dragZone}>
                <View style={[styles.grabber, { backgroundColor: colors.hairline }]} />
              </View>
              {children}
            </SafeAreaView>
          </Animated.View>
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
  sheetAuto: {
    maxHeight: '82%',
    overflow: 'hidden',
  },
  sheetTall: {
    height: '92%',
    overflow: 'hidden',
  },
  safeArea: {
    flex: 1,
  },
  dragZone: {
    paddingTop: 10,
    paddingBottom: 14,
  },
  grabber: {
    width: 36,
    height: 4,
    borderRadius: 2,
    alignSelf: 'center',
  },
});
