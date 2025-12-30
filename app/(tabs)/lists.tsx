import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import {
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';

export default function PlayerDetails() {
  const router = useRouter();

  return (
    <ThemedView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable style={styles.iconButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={22} />
        </Pressable>

        <ThemedText type="defaultSemiBold">Player Profile</ThemedText>

        <Pressable style={styles.iconButton}>
          <Ionicons name="share-outline" size={22} />
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* Avatar */}
        <View style={styles.profile}>
          <View style={styles.avatarWrapper}>
           <View style={styles.avatarGradientFallback}>
  <Image
    source={{ uri: "https://cdn.nba.com/headshots/nba/latest/1040x760/1628369.png" }}
    style={styles.avatar}
  />
</View>


            <View style={styles.sportBadge}>
              <Ionicons name="basketball" size={22} color="#22c55e" />
            </View>
          </View>

          <ThemedText type="title">Jayson Tatum</ThemedText>

          <View style={styles.metaRow}>
            <View style={styles.positionBadge}>
              <ThemedText style={styles.positionText}>Forward</ThemedText>
            </View>
            <ThemedText style={styles.dot}>•</ThemedText>
            <ThemedText type="default">Boston Celtics #0</ThemedText>
          </View>
        </View>

        {/* Stats Grid */}
        <View style={styles.statsGrid}>
  <View style={styles.statCardWrapper}>
    <StatCard icon="star" label="PPG" value="26.9" sub="+1.2 from LY" />
  </View>
  <View style={styles.statCardWrapper}>
    <StatCard icon="flag" label="RPG" value="8.1" sub="Season Avg" />
  </View>
  <View style={styles.statCardWrapper}>
    <StatCard icon="trophy" label="APG" value="4.9" sub="Career High" />
  </View>
  <View style={styles.statCardWrapper}>
    <StatCard icon="flame" label="GP" value="74" sub="Games Played" />
  </View>
</View>


        {/* About */}
        <View style={styles.section}>
          <ThemedText type="defaultSemiBold">About Jayson</ThemedText>
          <ThemedText type="default" style={styles.aboutText}>
            Widely considered one of the best two-way wings in the league, Tatum
            has led the Celtics to multiple deep playoff runs. Known for his elite
            scoring ability and defensive versatility.
          </ThemedText>
        </View>
      </ScrollView>

      {/* Bottom Bar */}
      <View style={styles.bottomBar}>
        <Pressable style={styles.primaryButton}>
          <Ionicons name="stats-chart" size={18} color="white" />
          <ThemedText style={styles.primaryText}>
            View Detailed Stats
          </ThemedText>
        </Pressable>

        <Pressable style={styles.heartButton}>
          <Ionicons name="heart" size={22} />
        </Pressable>
      </View>
    </ThemedView>
  );
}

/* ----------------------- */
/* Components */
/* ----------------------- */

function StatCard({
  icon,
  label,
  value,
  sub,
}: {
  icon: any;
  label: string;
  value: string;
  sub: string;
}) {
  return (
    <View style={styles.statCard}>
      <View style={styles.statHeader}>
        <View style={styles.statIcon}>
          <Ionicons name={icon} size={18} />
        </View>
        <ThemedText type="default">{label}</ThemedText>
      </View>

      <ThemedText type="title">{value}</ThemedText>
      <ThemedText style={styles.subText}>{sub}</ThemedText>
    </View>
  );
}

/* ----------------------- */
/* Styles */
/* ----------------------- */

const styles = StyleSheet.create({
  container: { flex: 1 },

  header: {
    paddingTop: 48,
    paddingHorizontal: 16,
    paddingBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
avatarGradientFallback: {
  padding: 4,
  borderRadius: 999,
  backgroundColor: '#2563eb', // primary color
},

  iconButton: {
    padding: 8,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.05)',
  },

  content: {
    padding: 16,
    paddingBottom: 140,
    gap: 32,
  },

  profile: {
    alignItems: 'center',
    gap: 12,
  },

  avatarWrapper: {
    position: 'relative',
  },

  avatarGradient: {
    padding: 4,
    borderRadius: 999,
  },

  avatar: {
    width: 160,
    height: 160,
    borderRadius: 80,
  },

  sportBadge: {
    position: 'absolute',
    bottom: 8,
    right: 12,
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },

  positionBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: 'rgba(37,99,235,0.15)',
  },

  positionText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#2563eb',
  },

  dot: {
    opacity: 0.5,
  },

  statsGrid: {
   flexDirection: "row",
    flexWrap: "wrap",
    paddingHorizontal: 16,
    paddingTop: 12,
    gap: 12, // RN 0.71+ (Expo supported)
  },

  statCard: {
    width: '48%',
    padding: 16,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.05)',
    gap: 6,
  },

  statHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
statCardWrapper: {
    width: "25%", // 4 columns
    padding: 6,
  },
  statIcon: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  subText: {
    fontSize: 11,
    opacity: 0.6,
  },

  section: {
    gap: 8,
  },

  aboutText: {
    lineHeight: 20,
  },

  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
    flexDirection: 'row',
    gap: 12,
    backgroundColor: 'rgba(0,0,0,0.85)',
  },

  primaryButton: {
    flex: 1,
    height: 56,
    borderRadius: 16,
    backgroundColor: '#2563eb',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },

  primaryText: {
    color: 'white',
    fontWeight: '700',
  },

  heartButton: {
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.05)',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
