import { Image } from 'expo-image';
import React, { useState, useEffect, useCallback } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useAction } from 'convex/react';
import { api } from '@statcheck/convex';

import { DesignTokens, Typography } from '@/constants/theme';
import { useTheme } from '@/context/ThemeContext';
import { getAllPlayers } from '@/services/playerData';
import type { Player } from '@/types';

// Strip accents: Dončić → Doncic, Jokić → Jokic
function normalize(str: string): string {
  return str.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
}

interface Leader {
  player: {
    id: number;
    first_name: string;
    last_name: string;
    position: string;
    team?: { abbreviation: string };
  };
  value: number;
  rank: number;
}

type LeaderCategory = 'pts' | 'reb' | 'ast' | 'stl' | 'blk' | 'fg_pct' | 'fg3_pct' | 'ft_pct';

const LEADER_LABELS: Record<LeaderCategory, string> = {
  pts: 'PTS',
  reb: 'REB',
  ast: 'AST',
  stl: 'STL',
  blk: 'BLK',
  fg_pct: 'FG%',
  fg3_pct: '3P%',
  ft_pct: 'FT%',
};

type Props = {
  onPlayerSelect: (player: Player) => void;
};

const LEADER_CATEGORIES: LeaderCategory[] = ['pts', 'reb', 'ast', 'stl', 'blk', 'fg_pct', 'fg3_pct', 'ft_pct'];

const STAT_PRECISION: Record<LeaderCategory, number> = {
  pts: 1,
  reb: 1,
  ast: 1,
  stl: 1,
  blk: 1,
  fg_pct: 1,
  fg3_pct: 1,
  ft_pct: 1,
};

export function LeagueLeadersSection({ onPlayerSelect }: Props) {
  const { isDark } = useTheme();
  const [leaders, setLeaders] = useState<Record<string, Leader[]>>({});
  const [playerLookup, setPlayerLookup] = useState<Record<string, Player>>({});
  const [selectedCategory, setSelectedCategory] = useState<LeaderCategory>('pts');
  const [isLoading, setIsLoading] = useState(true);

  const getLeaders = useAction(api.nba.getLeaders);

  const fetchLeaders = useCallback(async () => {
    setIsLoading(true);
    try {
      const categoryResults = await Promise.all(
        LEADER_CATEGORIES.map(async (category) => {
          const result = await getLeaders({ statType: category });
          return [category, (result.leaders as Leader[]).slice(0, 5)] as const;
        })
      );
      const allLeaders = Object.fromEntries(categoryResults) as Record<LeaderCategory, Leader[]>;
      setLeaders(allLeaders);

      // Build name → Player lookup from local data (normalized to handle accents)
      const allPlayers = getAllPlayers();
      const nameMap: Record<string, Player> = {};
      const normalizedLocalMap = new Map<string, Player>();
      for (const p of allPlayers) {
        if (p.sport === 'NBA') {
          normalizedLocalMap.set(normalize(p.name), p);
        }
      }
      Object.values(allLeaders).flat().forEach(l => {
        const fullName = `${l.player.first_name} ${l.player.last_name}`;
        const player = normalizedLocalMap.get(normalize(fullName));
        if (player) {
          nameMap[fullName] = player;
        }
      });
      setPlayerLookup(nameMap);
    } catch (err) {
      console.error('Failed to fetch leaders:', err);
    } finally {
      setIsLoading(false);
    }
  }, [getLeaders]);

  useEffect(() => {
    fetchLeaders();
  }, []);

  const handleLeaderPress = useCallback((leader: Leader) => {
    const name = `${leader.player.first_name} ${leader.player.last_name}`;
    const player = playerLookup[name];
    if (player) {
      onPlayerSelect(player);
    } else {
      onPlayerSelect({
        id: String(leader.player.id),
        name,
        sport: 'NBA',
        team: leader.player.team?.abbreviation ?? 'N/A',
        position: leader.player.position || 'N/A',
        number: '0',
      });
    }
  }, [playerLookup, onPlayerSelect]);

  const currentLeaders = leaders[selectedCategory] || [];
  const formatLeaderValue = (value: number, statType: LeaderCategory): string => {
    const precision = STAT_PRECISION[statType] ?? 1;
    if (statType.includes('pct')) {
      return `${(value * 100).toFixed(precision)}%`;
    }
    return value.toFixed(precision);
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={[styles.headerLabel, { color: isDark ? DesignTokens.textMutedDark : DesignTokens.textMuted }]}>
          NBA LEAGUE LEADERS
        </Text>
      </View>

      {/* Category Tabs */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabScrollContent}>
        <View style={[styles.tabBar, { backgroundColor: isDark ? DesignTokens.cardSurfaceDark : '#F3F4F6' }]}>
          {LEADER_CATEGORIES.map(cat => (
            <TouchableOpacity
              key={cat}
              onPress={() => setSelectedCategory(cat)}
              style={[
                styles.tab,
                selectedCategory === cat && [styles.tabActive, { backgroundColor: DesignTokens.accentPurple }],
              ]}
            >
              <Text
                style={[
                  styles.tabText,
                  { color: isDark ? DesignTokens.textSecondaryDark : DesignTokens.textSecondary },
                  selectedCategory === cat && styles.tabTextActive,
                ]}
              >
                {LEADER_LABELS[cat]}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

      {/* Leaders List */}
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator color={DesignTokens.accentPurple} />
        </View>
      ) : currentLeaders.length > 0 ? (
        <View style={[styles.card, { backgroundColor: isDark ? DesignTokens.cardBackgroundDark : DesignTokens.cardBackground }]}>
          {currentLeaders.map((leader, index) => {
            const fullName = `${leader.player.first_name} ${leader.player.last_name}`;
            const photoUrl = playerLookup[fullName]?.photoUrl;
            const initials = `${leader.player.first_name[0]}${leader.player.last_name[0]}`;

            return (
              <TouchableOpacity
                key={leader.player.id}
                onPress={() => handleLeaderPress(leader)}
                activeOpacity={0.6}
                style={[
                  styles.row,
                  index < currentLeaders.length - 1 && {
                    borderBottomWidth: StyleSheet.hairlineWidth,
                    borderBottomColor: isDark ? DesignTokens.borderDark : DesignTokens.border,
                  },
                ]}
              >
                {/* Rank */}
                <Text style={[
                  styles.rank,
                  { color: index === 0 ? DesignTokens.accentPurple : (isDark ? DesignTokens.textMutedDark : DesignTokens.textMuted) },
                ]}>
                  {index + 1}
                </Text>

                {/* Photo */}
                {photoUrl ? (
                  <Image
                    source={{ uri: photoUrl }}
                    style={styles.photo}
                    contentFit="cover"
                    transition={200}
                  />
                ) : (
                  <View style={[styles.photoPlaceholder, { backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.06)' }]}>
                    <Text style={[styles.initials, { color: isDark ? DesignTokens.textMutedDark : DesignTokens.textMuted }]}>
                      {initials}
                    </Text>
                  </View>
                )}

                {/* Name & Team */}
                <View style={styles.info}>
                  <Text
                    style={[styles.name, { color: isDark ? DesignTokens.textPrimaryDark : DesignTokens.textPrimary }]}
                    numberOfLines={1}
                  >
                    {fullName}
                  </Text>
                  <Text style={[styles.meta, { color: isDark ? DesignTokens.textMutedDark : DesignTokens.textMuted }]}>
                    {leader.player.team?.abbreviation ?? 'FA'} · {leader.player.position}
                  </Text>
                </View>

                {/* Stat Value */}
                <Text style={[styles.value, { color: isDark ? DesignTokens.textPrimaryDark : DesignTokens.textPrimary }]}>
                  {formatLeaderValue(leader.value, selectedCategory)}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      ) : (
        <View style={[styles.card, styles.emptyCard, { backgroundColor: isDark ? DesignTokens.cardBackgroundDark : DesignTokens.cardBackground }]}>
          <Text style={[styles.emptyText, { color: isDark ? DesignTokens.textMutedDark : DesignTokens.textMuted }]}>
            No leader data available
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: DesignTokens.spacing.md,
    marginBottom: DesignTokens.spacing.lg,
  },
  header: {
    marginBottom: DesignTokens.spacing.sm,
  },
  headerLabel: {
    ...Typography.captionSmall,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  tabBar: {
    flexDirection: 'row',
    borderRadius: DesignTokens.radius.md,
    padding: 3,
    marginBottom: DesignTokens.spacing.md,
    alignSelf: 'flex-start',
  },
  tabScrollContent: {
    paddingRight: DesignTokens.spacing.sm,
  },
  tab: {
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: DesignTokens.radius.sm,
  },
  tabActive: {
    backgroundColor: DesignTokens.accentPurple,
  },
  tabText: {
    ...Typography.caption,
    fontWeight: '600',
  },
  tabTextActive: {
    color: '#FFFFFF',
  },
  card: {
    borderRadius: DesignTokens.radius.lg,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 14,
    gap: 12,
  },
  rank: {
    width: 20,
    textAlign: 'center',
    ...Typography.label,
    fontWeight: '700',
  },
  photo: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  photoPlaceholder: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  initials: {
    ...Typography.caption,
    fontWeight: '600',
  },
  info: {
    flex: 1,
    minWidth: 0,
  },
  name: {
    ...Typography.label,
    fontWeight: '600',
  },
  meta: {
    ...Typography.captionSmall,
    marginTop: 1,
  },
  value: {
    ...Typography.headline,
    fontVariant: ['tabular-nums'],
  },
  loadingContainer: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  emptyCard: {
    padding: DesignTokens.spacing.lg,
    alignItems: 'center',
  },
  emptyText: {
    ...Typography.bodySmall,
  },
});
