import React, { useEffect } from 'react';
import { Dimensions, Modal, Pressable, StyleSheet, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

import { DesignTokens } from '@/constants/theme';
import { useTheme } from '@/context/ThemeContext';
import type { Player } from '@/types';

import { PlayerCardContent } from './PlayerCardContent';

type PlayerCardBottomSheetProps = {
  player: Player | null;
  isVisible: boolean;
  onDismiss: () => void;
};

const { height: SCREEN_HEIGHT } = Dimensions.get('window');
const SHEET_HEIGHT = SCREEN_HEIGHT * 0.85;
const DISMISS_THRESHOLD = 150;

export function PlayerCardBottomSheet({ player, isVisible, onDismiss }: PlayerCardBottomSheetProps) {
  const { isDark } = useTheme();
  const translateY = useSharedValue(SHEET_HEIGHT);
  const backdropOpacity = useSharedValue(0);

  // Animate in/out based on visibility
  useEffect(() => {
    if (isVisible) {
      // Animate in
      translateY.value = withTiming(0, { duration: 300 });
      backdropOpacity.value = withTiming(0.6, { duration: 300 });
    } else {
      // Reset to hidden state
      translateY.value = SHEET_HEIGHT;
      backdropOpacity.value = 0;
    }
  }, [isVisible, translateY, backdropOpacity]);

  const panGesture = Gesture.Pan()
    .activeOffsetY(10)
    .onUpdate((event) => {
      // Only allow dragging down (positive translateY)
      if (event.translationY > 0) {
        translateY.value = event.translationY;
        // Fade backdrop as we drag
        backdropOpacity.value = 0.6 * (1 - event.translationY / SHEET_HEIGHT);
      }
    })
    .onEnd((event) => {
      // If dragged past threshold or with enough velocity, dismiss
      if (translateY.value > DISMISS_THRESHOLD || event.velocityY > 500) {
        translateY.value = withTiming(SHEET_HEIGHT, { duration: 200 });
        backdropOpacity.value = withTiming(0, { duration: 200 });
        runOnJS(onDismiss)();
      } else {
        // Snap back to original position
        translateY.value = withSpring(0, {
          damping: 20,
          stiffness: 150,
        });
        backdropOpacity.value = withTiming(0.6, { duration: 150 });
      }
    });

  const sheetAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  const backdropAnimatedStyle = useAnimatedStyle(() => ({
    opacity: backdropOpacity.value,
  }));

  if (!player) return null;

  return (
    <Modal visible={isVisible} transparent animationType="none" onRequestClose={onDismiss} statusBarTranslucent>
      <View style={styles.overlay}>
        {/* Backdrop */}
        <Animated.View style={[styles.backdrop, backdropAnimatedStyle]}>
          <Pressable style={StyleSheet.absoluteFill} onPress={onDismiss} />
        </Animated.View>

        {/* Sheet container with gesture */}
        <GestureDetector gesture={panGesture}>
          <Animated.View
            style={[
              styles.sheetContainer,
              sheetAnimatedStyle,
              {
                backgroundColor: isDark ? DesignTokens.backgroundSecondaryDark : DesignTokens.backgroundSecondary,
              },
            ]}>
            {/* Drag handle */}
            <View style={styles.handleContainer}>
              <View
                style={[
                  styles.handle,
                  {
                    backgroundColor: isDark ? DesignTokens.textMutedDark : DesignTokens.textMuted,
                  },
                ]}
              />
            </View>

            {/* Player card content */}
            <View style={styles.cardWrapper}>
              <PlayerCardContent player={player} />
            </View>
          </Animated.View>
        </GestureDetector>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#000',
  },
  sheetContainer: {
    borderTopLeftRadius: DesignTokens.radius.xl,
    borderTopRightRadius: DesignTokens.radius.xl,
    height: SHEET_HEIGHT,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 24,
  },
  handleContainer: {
    alignItems: 'center',
    paddingVertical: DesignTokens.spacing.md,
  },
  handle: {
    width: 36,
    height: 5,
    borderRadius: 3,
    opacity: 0.5,
  },
  cardWrapper: {
    flex: 1,
    paddingHorizontal: DesignTokens.spacing.md,
    paddingBottom: DesignTokens.spacing.md,
  },
});
