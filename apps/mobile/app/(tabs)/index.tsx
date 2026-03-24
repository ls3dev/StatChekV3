import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { GradientHeader } from '@/components/GradientHeader';
import { HeroSearchCard } from '@/components/HeroSearchCard';
import { LeagueLeadersSection } from '@/components/LeagueLeadersSection';
import { RecentPlayersSection } from '@/components/RecentPlayersSection';
import { PlayerCardBottomSheet } from '@/components/player-card';
import { TeamsGrid } from '@/components/nba';
import { DesignTokens, Typography } from '@/constants/theme';
import { useRecentPlayers } from '@/context/RecentPlayersContext';
import { useTheme } from '@/context/ThemeContext';
import { useSport } from '@/context/SportContext';
import type { Player } from '@/types';

export default function HomeScreen() {
  const { isDark } = useTheme();
  const { selectedSport } = useSport();
  const router = useRouter();
  const { recentPlayers, addRecentPlayer, clearRecentPlayers } = useRecentPlayers();
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);
  const [showCreateChooser, setShowCreateChooser] = useState(false);

  const isNBA = selectedSport === 'NBA';

  const handlePlayerSelect = async (player: Player) => {
    setSelectedPlayer(player);
    try {
      await addRecentPlayer(player);
    } catch (e) {
      console.warn('Failed to save recent player:', e);
    }
  };

  const handleClearRecentPlayers = async () => {
    await clearRecentPlayers();
  };

  const handleDismiss = () => {
    setSelectedPlayer(null);
  };

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: isDark ? DesignTokens.backgroundPrimaryDark : DesignTokens.backgroundPrimary,
        },
      ]}>
      {/* Gradient header with app title */}
      <GradientHeader title="StatCheck" overlapPadding={50} />

      {/* Floating search card with dropdown */}
      <HeroSearchCard onPlayerSelect={handlePlayerSelect} />

      {/* Content below search */}
      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}>
        {/* Create Your List CTA */}
        <View style={styles.ctaContainer}>
          <View style={styles.ctaRow}>
            <Pressable
              onPress={() => router.push('/(tabs)/lists')}
              style={({ pressed }) => [
                styles.secondaryCtaButton,
                { opacity: pressed ? 0.9 : 1 },
              ]}>
              <Ionicons name="list-outline" size={20} color={isDark ? '#FFFFFF' : '#111827'} />
              <Text style={[styles.secondaryCtaText, { color: isDark ? '#FFFFFF' : '#111827' }]}>Your Lists</Text>
            </Pressable>
            <Pressable
              onPress={() => setShowCreateChooser(true)}
              style={({ pressed }) => [{ opacity: pressed ? 0.9 : 1, transform: [{ scale: pressed ? 0.98 : 1 }] }]}>
              <LinearGradient
                colors={['#8B5CF6', '#7C3AED']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.ctaButton}>
                <Ionicons name="add-circle-outline" size={22} color="#FFFFFF" />
                <Text style={styles.ctaText}>Create Something</Text>
              </LinearGradient>
            </Pressable>
          </View>
        </View>

        {/* Recent players section */}
        <RecentPlayersSection
          players={recentPlayers}
          onPlayerSelect={handlePlayerSelect}
          onClear={handleClearRecentPlayers}
        />

        {isNBA ? (
          <>
            {/* League Leaders */}
            <LeagueLeadersSection onPlayerSelect={handlePlayerSelect} />

            {/* NBA Teams Grid */}
            <TeamsGrid />
          </>
        ) : (
          /* Coming Soon for NFL/MLB */
          <View style={styles.comingSoonContainer}>
            <Text style={[styles.comingSoonEmoji]}>
              {selectedSport === 'NFL' ? '🏈' : '⚾'}
            </Text>
            <Text style={[styles.comingSoonTitle, { color: isDark ? '#FFFFFF' : '#1F2937' }]}>
              {selectedSport} Coming Soon
            </Text>
            <Text style={[styles.comingSoonSubtitle, { color: isDark ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.5)' }]}>
              You can still search for your favorite player using the search above
            </Text>
          </View>
        )}
      </ScrollView>

      {/* Bottom sheet for player details */}
      <PlayerCardBottomSheet player={selectedPlayer} isVisible={!!selectedPlayer} onDismiss={handleDismiss} />

      <Modal visible={showCreateChooser} transparent animationType="fade" onRequestClose={() => setShowCreateChooser(false)}>
        <View style={styles.chooserOverlay}>
          <Pressable style={styles.chooserBackdrop} onPress={() => setShowCreateChooser(false)} />
          <View style={[styles.chooserCard, { backgroundColor: isDark ? DesignTokens.cardBackgroundDark : DesignTokens.cardBackground }]}>
            <Text style={[styles.chooserTitle, { color: isDark ? DesignTokens.textPrimaryDark : DesignTokens.textPrimary }]}>
              Create
            </Text>
            <Text style={[styles.chooserSectionLabel, { color: isDark ? DesignTokens.textMutedDark : DesignTokens.textMuted }]}>
              LISTS
            </Text>
            {[
              { label: 'Create Ranking', path: '/(tabs)/lists?createType=ranking' },
              { label: 'Create Agenda', path: '/(tabs)/lists?createType=agenda' },
              { label: 'Create VS', path: '/(tabs)/lists?createType=vs' },
            ].map((item) => (
              <Pressable key={item.path} onPress={() => router.push(item.path as any)} style={styles.chooserItem}>
                <Text style={[styles.chooserItemText, { color: isDark ? DesignTokens.textPrimaryDark : DesignTokens.textPrimary }]}>
                  {item.label}
                </Text>
              </Pressable>
            ))}
            <Text style={[styles.chooserSectionLabel, { color: isDark ? DesignTokens.textMutedDark : DesignTokens.textMuted }]}>
              PROFILE SAVES
            </Text>
            {[
              { label: 'Add Receipt', path: '/(tabs)/profile?createSave=receipt' },
              { label: 'Save Player Stats', path: '/(tabs)/profile?createSave=playerStatSnapshot' },
            ].map((item) => (
              <Pressable key={item.path} onPress={() => router.push(item.path as any)} style={styles.chooserItem}>
                <Text style={[styles.chooserItemText, { color: isDark ? DesignTokens.textPrimaryDark : DesignTokens.textPrimary }]}>
                  {item.label}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    paddingTop: DesignTokens.spacing.lg,
    paddingBottom: DesignTokens.spacing.xxl,
  },
  ctaContainer: {
    paddingHorizontal: DesignTokens.spacing.lg,
    marginBottom: DesignTokens.spacing.lg,
  },
  ctaRow: {
    flexDirection: 'row',
    gap: DesignTokens.spacing.sm,
  },
  secondaryCtaButton: {
    flex: 1,
    minHeight: 52,
    borderRadius: DesignTokens.radius.lg,
    paddingHorizontal: DesignTokens.spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: DesignTokens.spacing.xs,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
  },
  secondaryCtaText: {
    ...Typography.headline,
    fontSize: 15,
  },
  ctaButton: {
    minWidth: 190,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: DesignTokens.spacing.sm,
    paddingVertical: 14,
    borderRadius: DesignTokens.radius.lg,
    shadowColor: '#8B5CF6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
  },
  ctaText: {
    ...Typography.headline,
    color: '#FFFFFF',
    fontSize: 16,
  },
  chooserOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: DesignTokens.spacing.lg,
  },
  chooserBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  chooserCard: {
    width: '100%',
    borderRadius: DesignTokens.radius.xl,
    padding: DesignTokens.spacing.lg,
    gap: DesignTokens.spacing.sm,
  },
  chooserTitle: {
    ...Typography.displaySmall,
    marginBottom: DesignTokens.spacing.sm,
  },
  chooserSectionLabel: {
    ...Typography.captionSmall,
    letterSpacing: 0.6,
    marginTop: DesignTokens.spacing.sm,
  },
  chooserItem: {
    borderRadius: DesignTokens.radius.md,
    paddingVertical: DesignTokens.spacing.md,
    paddingHorizontal: DesignTokens.spacing.md,
    backgroundColor: 'rgba(255,255,255,0.04)',
  },
  chooserItemText: {
    ...Typography.body,
    fontWeight: '600',
  },
  comingSoonContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: DesignTokens.spacing.xxl * 2,
    paddingHorizontal: DesignTokens.spacing.xl,
  },
  comingSoonEmoji: {
    fontSize: 64,
    marginBottom: DesignTokens.spacing.lg,
  },
  comingSoonTitle: {
    ...Typography.headline,
    fontWeight: '700',
    marginBottom: DesignTokens.spacing.sm,
    textAlign: 'center',
  },
  comingSoonSubtitle: {
    ...Typography.body,
    textAlign: 'center',
    lineHeight: 22,
  },
});
