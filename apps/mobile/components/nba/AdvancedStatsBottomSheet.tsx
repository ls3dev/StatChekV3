import React from 'react';
import {
  Dimensions,
  Modal,
  Pressable,
  StyleSheet,
  View,
  Text,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  runOnJS,
} from 'react-native-reanimated';
import { Gesture, GestureDetector, GestureHandlerRootView } from 'react-native-gesture-handler';

// Apple Sports-inspired dark colors
const COLORS = {
  background: '#1C1C1E',
  card: '#2C2C2E',
  cardAlt: '#3A3A3C',
  text: '#FFFFFF',
  textSecondary: '#8E8E93',
  textMuted: '#636366',
  divider: '#38383A',
  accent: '#30D158',
  positive: '#30D158',
  negative: '#FF3B30',
};

interface AdvancedStats {
  true_shooting_percentage?: number;
  usage_percentage?: number;
  net_rating?: number;
  offensive_rating?: number;
  defensive_rating?: number;
  pie?: number;
  pace?: number;
  effective_field_goal_percentage?: number;
  assist_percentage?: number;
  rebound_percentage?: number;
  offensive_rebound_percentage?: number;
  defensive_rebound_percentage?: number;
  turnover_ratio?: number;
  assist_ratio?: number;
  assist_to_turnover?: number;
}

interface AdvancedStatsBottomSheetProps {
  isVisible: boolean;
  onDismiss: () => void;
  stats: AdvancedStats | null;
  playerName: string;
  isLoading?: boolean;
}

const { height: SCREEN_HEIGHT } = Dimensions.get('window');
const SHEET_HEIGHT = SCREEN_HEIGHT * 0.85;
const DISMISS_THRESHOLD = 100;

export function AdvancedStatsBottomSheet({
  isVisible,
  onDismiss,
  stats,
  playerName,
  isLoading = false,
}: AdvancedStatsBottomSheetProps) {
  const translateY = useSharedValue(SHEET_HEIGHT);
  const backdropOpacity = useSharedValue(0);

  React.useEffect(() => {
    if (isVisible) {
      translateY.value = withTiming(0, { duration: 300 });
      backdropOpacity.value = withTiming(0.6, { duration: 300 });
    } else {
      translateY.value = SHEET_HEIGHT;
      backdropOpacity.value = 0;
    }
  }, [isVisible, translateY, backdropOpacity]);

  const panGesture = Gesture.Pan()
    .activeOffsetY(10)
    .onUpdate((event) => {
      if (event.translationY > 0) {
        translateY.value = event.translationY;
        backdropOpacity.value = 0.6 * (1 - event.translationY / SHEET_HEIGHT);
      }
    })
    .onEnd((event) => {
      if (translateY.value > DISMISS_THRESHOLD || event.velocityY > 500) {
        translateY.value = withTiming(SHEET_HEIGHT, { duration: 200 });
        backdropOpacity.value = withTiming(0, { duration: 200 });
        runOnJS(onDismiss)();
      } else {
        translateY.value = withTiming(0, { duration: 200 });
        backdropOpacity.value = withTiming(0.6, { duration: 150 });
      }
    });

  const sheetAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  const backdropAnimatedStyle = useAnimatedStyle(() => ({
    opacity: backdropOpacity.value,
  }));

  const formatPct = (value?: number) => {
    if (value === undefined || value === null) return '-';
    return (value * 100).toFixed(1) + '%';
  };

  const formatNumber = (value?: number, decimals = 1) => {
    if (value === undefined || value === null) return '-';
    return value.toFixed(decimals);
  };

  const formatRating = (value?: number) => {
    if (value === undefined || value === null) return '-';
    const prefix = value > 0 ? '+' : '';
    return prefix + value.toFixed(1);
  };

  const StatRow = ({
    label,
    value,
    description,
    isPositive,
    isNegative,
  }: {
    label: string;
    value: string;
    description?: string;
    isPositive?: boolean;
    isNegative?: boolean;
  }) => (
    <View style={styles.statRow}>
      <View style={styles.statInfo}>
        <Text style={styles.statLabel}>{label}</Text>
        {description && <Text style={styles.statDescription}>{description}</Text>}
      </View>
      <Text
        style={[
          styles.statValue,
          isPositive && styles.positiveValue,
          isNegative && styles.negativeValue,
        ]}
      >
        {value}
      </Text>
    </View>
  );

  const SectionHeader = ({ title }: { title: string }) => (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionTitle}>{title}</Text>
    </View>
  );

  return (
    <Modal visible={isVisible} transparent animationType="none" onRequestClose={onDismiss} statusBarTranslucent>
      <GestureHandlerRootView style={styles.overlay}>
        <Animated.View style={[styles.backdrop, backdropAnimatedStyle]}>
          <Pressable style={StyleSheet.absoluteFill} onPress={onDismiss} />
        </Animated.View>

        <GestureDetector gesture={panGesture}>
          <Animated.View style={[styles.sheetContainer, sheetAnimatedStyle]}>
            {/* Header */}
            <View style={styles.header}>
              <Pressable style={styles.backButton} onPress={onDismiss}>
                <Ionicons name="chevron-back" size={24} color={COLORS.accent} />
                <Text style={styles.backText}>Back</Text>
              </Pressable>
              <View style={styles.handle} />
              <View style={styles.headerSpacer} />
            </View>

            {/* Title */}
            <View style={styles.titleContainer}>
              <Text style={styles.title}>Advanced Stats</Text>
              <Text style={styles.subtitle}>{playerName}</Text>
            </View>

            {isLoading ? (
              <View style={styles.loadingContainer}>
                <Text style={styles.loadingText}>Loading advanced stats...</Text>
              </View>
            ) : !stats ? (
              <View style={styles.emptyContainer}>
                <Ionicons name="stats-chart-outline" size={48} color={COLORS.textMuted} />
                <Text style={styles.emptyText}>Advanced stats not available</Text>
              </View>
            ) : (
              <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                {/* Efficiency */}
                <SectionHeader title="Efficiency" />
                <View style={styles.section}>
                  <StatRow
                    label="TS%"
                    value={formatPct(stats.true_shooting_percentage)}
                    description="True Shooting Percentage"
                  />
                  <StatRow
                    label="eFG%"
                    value={formatPct(stats.effective_field_goal_percentage)}
                    description="Effective Field Goal %"
                  />
                  <StatRow
                    label="PIE"
                    value={formatPct(stats.pie)}
                    description="Player Impact Estimate"
                  />
                </View>

                {/* Usage & Pace */}
                <SectionHeader title="Usage & Pace" />
                <View style={styles.section}>
                  <StatRow
                    label="USG%"
                    value={formatPct(stats.usage_percentage)}
                    description="Usage Percentage"
                  />
                  <StatRow
                    label="PACE"
                    value={formatNumber(stats.pace)}
                    description="Possessions per 48 min"
                  />
                </View>

                {/* Ratings */}
                <SectionHeader title="Ratings" />
                <View style={styles.section}>
                  <StatRow
                    label="NET RTG"
                    value={formatRating(stats.net_rating)}
                    description="Net Rating (Off - Def)"
                    isPositive={(stats.net_rating ?? 0) > 0}
                    isNegative={(stats.net_rating ?? 0) < 0}
                  />
                  <StatRow
                    label="OFF RTG"
                    value={formatNumber(stats.offensive_rating)}
                    description="Offensive Rating"
                  />
                  <StatRow
                    label="DEF RTG"
                    value={formatNumber(stats.defensive_rating)}
                    description="Defensive Rating (lower is better)"
                  />
                </View>

                {/* Playmaking */}
                <SectionHeader title="Playmaking" />
                <View style={styles.section}>
                  <StatRow
                    label="AST%"
                    value={formatPct(stats.assist_percentage)}
                    description="Assist Percentage"
                  />
                  <StatRow
                    label="AST RATIO"
                    value={formatNumber(stats.assist_ratio)}
                    description="Assists per 100 possessions"
                  />
                  <StatRow
                    label="AST/TO"
                    value={formatNumber(stats.assist_to_turnover)}
                    description="Assist to Turnover Ratio"
                  />
                  <StatRow
                    label="TO RATIO"
                    value={formatNumber(stats.turnover_ratio)}
                    description="Turnovers per 100 possessions"
                  />
                </View>

                {/* Rebounding */}
                <SectionHeader title="Rebounding" />
                <View style={styles.section}>
                  <StatRow
                    label="REB%"
                    value={formatPct(stats.rebound_percentage)}
                    description="Total Rebound Percentage"
                  />
                  <StatRow
                    label="OREB%"
                    value={formatPct(stats.offensive_rebound_percentage)}
                    description="Offensive Rebound %"
                  />
                  <StatRow
                    label="DREB%"
                    value={formatPct(stats.defensive_rebound_percentage)}
                    description="Defensive Rebound %"
                  />
                </View>

                <View style={styles.bottomSpacer} />
              </ScrollView>
            )}
          </Animated.View>
        </GestureDetector>
      </GestureHandlerRootView>
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
    backgroundColor: COLORS.background,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    height: SHEET_HEIGHT,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 24,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    minWidth: 80,
  },
  backText: {
    fontSize: 17,
    color: COLORS.accent,
    marginLeft: 4,
  },
  handle: {
    width: 36,
    height: 5,
    borderRadius: 3,
    backgroundColor: COLORS.textMuted,
  },
  headerSpacer: {
    minWidth: 80,
  },
  titleContainer: {
    alignItems: 'center',
    paddingBottom: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: COLORS.divider,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.text,
  },
  subtitle: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginTop: 4,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    fontSize: 15,
    color: COLORS.textSecondary,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  emptyText: {
    fontSize: 15,
    color: COLORS.textSecondary,
  },
  content: {
    flex: 1,
  },
  sectionHeader: {
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 8,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  section: {
    backgroundColor: COLORS.card,
    marginHorizontal: 16,
    borderRadius: 12,
    overflow: 'hidden',
  },
  statRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: COLORS.divider,
  },
  statInfo: {
    flex: 1,
  },
  statLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.text,
  },
  statDescription: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  statValue: {
    fontSize: 17,
    fontWeight: '600',
    color: COLORS.text,
    fontVariant: ['tabular-nums'],
    marginLeft: 16,
  },
  positiveValue: {
    color: COLORS.positive,
  },
  negativeValue: {
    color: COLORS.negative,
  },
  bottomSpacer: {
    height: 40,
  },
});
