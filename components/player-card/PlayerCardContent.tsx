import React, { useState } from 'react';
import { StyleSheet, TouchableOpacity } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';

import { usePlayerLinks } from '@/hooks/usePlayerLinks';
import type { Player } from '@/types';
import { PlayerCardBack } from './PlayerCardBack';
import { PlayerCardFront } from './PlayerCardFront';

type PlayerCardContentProps = {
  player: Player;
};

export function PlayerCardContent({ player }: PlayerCardContentProps) {
  const [isFlipped, setIsFlipped] = useState(false);
  const rotateY = useSharedValue(0);

  const {
    getLinksForPlayer,
    addLink,
    updateLink,
    deleteLink,
    reorderLinks,
    isAtLimit,
  } = usePlayerLinks();

  const playerLinks = getLinksForPlayer(player.id);

  const handleFlip = () => {
    setIsFlipped(!isFlipped);
    rotateY.value = withTiming(isFlipped ? 0 : 180, { duration: 600 });
  };

  const handleAddLink = (url: string, title: string): boolean => {
    return addLink(player.id, url, title);
  };

  const handleReorderLinks = (newOrder: typeof playerLinks) => {
    reorderLinks(player.id, newOrder);
  };

  const frontAnimatedStyle = useAnimatedStyle(() => {
    const rotate = rotateY.value;
    const isVisible = rotate < 90;
    return {
      transform: [{ perspective: 1000 }, { rotateY: `${rotate}deg` }],
      opacity: isVisible ? 1 : 0,
      pointerEvents: isVisible ? 'auto' : 'none',
    };
  });

  const backAnimatedStyle = useAnimatedStyle(() => {
    const rotate = rotateY.value;
    const backRotate = rotate + 180;
    const isVisible = rotate >= 90;
    return {
      transform: [{ perspective: 1000 }, { rotateY: `${backRotate}deg` }],
      opacity: isVisible ? 1 : 0,
      pointerEvents: isVisible ? 'auto' : 'none',
    };
  });

  return (
    <TouchableOpacity activeOpacity={1} onPress={handleFlip} style={styles.container}>
      <Animated.View style={[styles.card, styles.frontCard, frontAnimatedStyle]}>
        <PlayerCardFront player={player} />
      </Animated.View>

      <Animated.View style={[styles.card, styles.backCard, backAnimatedStyle]}>
        <PlayerCardBack
          player={player}
          links={playerLinks}
          isAtLimit={isAtLimit(player.id)}
          onAddLink={handleAddLink}
          onUpdateLink={updateLink}
          onDeleteLink={deleteLink}
          onReorderLinks={handleReorderLinks}
        />
      </Animated.View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: '100%',
  },
  card: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    backfaceVisibility: 'hidden',
  },
  frontCard: {
    zIndex: 2,
  },
  backCard: {
    zIndex: 1,
  },
});
