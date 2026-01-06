import { Image } from 'expo-image';
import { openBrowserAsync, WebBrowserPresentationStyle } from 'expo-web-browser';
import React, { useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';

import type { Player } from '@/types';
import { ThemedText } from './themed-text';
import { ThemedView } from './themed-view';

type Props = {
  player: Player;
};

export function PlayerCard({ player }: Props) {
  const [imageError, setImageError] = useState(false);
  const [isFlipped, setIsFlipped] = useState(false);
  const rotateY = useSharedValue(0);

  const handlePress = () => {
    setIsFlipped(!isFlipped);
    rotateY.value = withTiming(isFlipped ? 0 : 180, { duration: 600 });
  };

  const frontAnimatedStyle = useAnimatedStyle(() => {
    const rotate = rotateY.value;
    const isVisible = rotate < 90;
    return {
      transform: [{ perspective: 1000 }, { rotateY: `${rotate}deg` }],
      opacity: isVisible ? 1 : 0,
    };
  });

  const backAnimatedStyle = useAnimatedStyle(() => {
    const rotate = rotateY.value;
    const backRotate = rotate + 180; // Start from 180deg and rotate to 360deg
    const isVisible = rotate >= 90;
    return {
      transform: [{ perspective: 1000 }, { rotateY: `${backRotate}deg` }],
      opacity: isVisible ? 1 : 0,
      pointerEvents: isVisible ? 'auto' : 'none',
    };
  });

  const handleAdd = () => {
    // TODO: Implement add to list functionality
    console.log('Add player:', player.id);
  };

  const handleStats = async () => {
    if (!player.sportsReferenceUrl) return;
    
    try {
      await openBrowserAsync(player.sportsReferenceUrl, {
        presentationStyle: WebBrowserPresentationStyle.AUTOMATIC,
      });
    } catch (error) {
      console.error('Failed to open browser:', error);
    }
  };

  return (
    <TouchableOpacity activeOpacity={0.9} onPress={handlePress} style={styles.container}>
      <Animated.View style={[styles.card, styles.frontCard, frontAnimatedStyle]}>
        <ThemedView style={styles.cardContent}>
          <View style={styles.header}>
            {player.photoUrl && !imageError ? (
              <Image
                source={{ uri: player.photoUrl }}
                style={styles.photo}
                contentFit="cover"
                onError={() => setImageError(true)}
                transition={200}
              />
            ) : (
              <View style={styles.photoPlaceholder}>
                <ThemedText type="defaultSemiBold" style={styles.placeholderText}>
                  {player.name
                    .split(' ')
                    .map((n) => n[0])
                    .join('')
                    .slice(0, 2)
                    .toUpperCase()}
                </ThemedText>
              </View>
            )}
            <View style={styles.headerText}>
              <ThemedText type="title">{player.name}</ThemedText>
              {player.position !== 'N/A' && (
                <ThemedText type="defaultSemiBold">{player.position}</ThemedText>
              )}
            </View>
          </View>

          {player.team !== 'N/A' && <ThemedText type="default">{player.team}</ThemedText>}

          {player.stats && (
            <View style={styles.statsRow}>
              {Object.entries(player.stats).map(([key, value]) => (
                <View key={key} style={styles.stat}>
                  <ThemedText type="defaultSemiBold">{value}</ThemedText>
                  <ThemedText type="default">{key}</ThemedText>
                </View>
              ))}
            </View>
          )}
        </ThemedView>
      </Animated.View>

      <Animated.View style={[styles.card, styles.backCard, backAnimatedStyle]}>
        <View style={styles.backCardContent}>
          <View style={styles.backHeader}>
            <Text style={[styles.backTitle, styles.backText]}>
              {player.name}
            </Text>
            {player.team !== 'N/A' && (
              <Text style={styles.backText}>
                {player.team}
              </Text>
            )}
          </View>

          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={[styles.button, styles.addButton]}
              onPress={(e) => {
                e.stopPropagation();
                handleAdd();
              }}
              activeOpacity={0.7}>
              <Text style={styles.buttonText}>
                Add
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.button,
                styles.statsButton,
                !player.sportsReferenceUrl && styles.buttonDisabled,
              ]}
              onPress={(e) => {
                e.stopPropagation();
                handleStats();
              }}
              disabled={!player.sportsReferenceUrl}
              activeOpacity={0.7}>
              <Text style={[
                styles.buttonText,
                !player.sportsReferenceUrl && styles.buttonTextDisabled,
              ]}>
                Stats
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Animated.View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    height: 200,
    overflow: 'hidden',
  },
  card: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    backfaceVisibility: 'hidden',
    overflow: 'hidden',
  },
  frontCard: {
    zIndex: 2,
  },
  backCard: {
    zIndex: 1,
  },
  cardContent: {
    borderRadius: 12,
    padding: 24,
    gap: 8,
    backgroundColor: 'rgba(255,255,255,0.05)',
    height: '100%',
    justifyContent: 'space-between',
  },
  backCardContent: {
    borderRadius: 12,
    padding: 24,
    gap: 8,
    backgroundColor: '#ffffff',
    height: '100%',
    width: '100%',
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 4,
  },
  photo: {
    width: 60,
    height: 60,
    borderRadius: 30,
  },
  photoPlaceholder: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderText: {
    fontSize: 16,
  },
  headerText: {
    flex: 1,
    gap: 4,
  },
  statsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginTop: 8,
  },
  stat: {
    minWidth: 60,
  },
  backHeader: {
    alignItems: 'center',
    marginBottom: 20,
  },
  backTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#000000',
  },
  backText: {
    fontSize: 16,
    color: '#000000',
  },
  buttonContainer: {
    gap: 12,
    marginTop: 'auto',
  },
  button: {
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addButton: {
    backgroundColor: '#4CAF50',
    borderWidth: 1,
    borderColor: '#4CAF50',
  },
  statsButton: {
    backgroundColor: '#2196F3',
    borderWidth: 1,
    borderColor: '#2196F3',
  },
  buttonDisabled: {
    opacity: 0.5,
    backgroundColor: '#cccccc',
    borderColor: '#cccccc',
  },
  buttonText: {
    fontSize: 16,
    color: '#ffffff',
  },
  buttonTextDisabled: {
    color: '#666666',
  },
});


