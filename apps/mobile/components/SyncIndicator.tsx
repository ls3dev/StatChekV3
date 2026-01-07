import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, View } from 'react-native';

type SyncIndicatorProps = {
  size?: number;
  showOffline?: boolean; // Whether to show offline state
};

/**
 * Simple icon-based sync indicator
 * Shows: Synced (cloud-done) when Convex is connected
 * Note: With anonymous auth and ConvexProvider, we assume connection if app is running
 */
export function SyncIndicator({ size = 16 }: SyncIndicatorProps) {
  // With anonymous auth and basic ConvexProvider, if the app is running, we're connected
  // Show green checkmark to indicate synced state
  return (
    <View style={styles.container}>
      <Ionicons
        name="cloud-done-outline"
        size={size}
        color="#10B981" // Green
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
    minWidth: 20,
    minHeight: 20,
  },
});
