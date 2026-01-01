import React from 'react';
import { Modal, Platform, Pressable, StyleSheet, View } from 'react-native';
import Animated, { FadeIn, FadeOut, SlideInDown, SlideOutDown } from 'react-native-reanimated';

import { DesignTokens } from '@/constants/theme';
import { useTheme } from '@/context/ThemeContext';
import type { Player } from '@/types';

import { PlayerCardContent } from './PlayerCardContent';

type PlayerCardBottomSheetProps = {
  player: Player | null;
  isVisible: boolean;
  onDismiss: () => void;
};

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export function PlayerCardBottomSheet({ player, isVisible, onDismiss }: PlayerCardBottomSheetProps) {
  const { isDark } = useTheme();

  if (!player || !isVisible) return null;

  return (
    <Modal visible={isVisible} transparent animationType="none" onRequestClose={onDismiss} statusBarTranslucent>
      <View style={styles.overlay}>
        {/* Backdrop */}
        <AnimatedPressable
          entering={FadeIn.duration(200)}
          exiting={FadeOut.duration(150)}
          style={styles.backdrop}
          onPress={onDismiss}
        />

        {/* Sheet container */}
        <Animated.View
          entering={SlideInDown.springify().damping(20).stiffness(150)}
          exiting={SlideOutDown.duration(200)}
          style={[
            styles.sheetContainer,
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
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
  },
  sheetContainer: {
    borderTopLeftRadius: DesignTokens.radius.xl,
    borderTopRightRadius: DesignTokens.radius.xl,
    height: '75%',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.15,
        shadowRadius: 20,
      },
      android: {
        elevation: 24,
      },
    }),
  },
  handleContainer: {
    alignItems: 'center',
    paddingVertical: DesignTokens.spacing.md,
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    opacity: 0.4,
  },
  cardWrapper: {
    flex: 1,
    paddingHorizontal: DesignTokens.spacing.md,
    paddingBottom: DesignTokens.spacing.md,
  },
});
