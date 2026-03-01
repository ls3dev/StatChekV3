import React, { useState } from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

import { DesignTokens } from '@/constants/theme';
import { useTheme } from '@/context/ThemeContext';
import { useSport, Sport } from '@/context/SportContext';

const SPORTS: { id: Sport; label: string; icon: string; available: boolean }[] = [
  { id: 'NBA', label: 'NBA', icon: '🏀', available: true },
  { id: 'NFL', label: 'NFL', icon: '🏈', available: false },
  { id: 'MLB', label: 'MLB', icon: '⚾', available: false },
];

interface SportSelectorProps {
  compact?: boolean;
}

export function SportSelector({ compact = false }: SportSelectorProps) {
  const { isDark } = useTheme();
  const { selectedSport, setSelectedSport } = useSport();
  const [isOpen, setIsOpen] = useState(false);

  const selectedSportData = SPORTS.find((s) => s.id === selectedSport) || SPORTS[0];

  const handleSelect = (sport: (typeof SPORTS)[number]) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedSport(sport.id);
    setIsOpen(false);
  };

  const textColor = isDark ? '#FFFFFF' : '#1F2937';
  const mutedTextColor = isDark ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.4)';

  return (
    <>
      {/* Dropdown Trigger Button */}
      <Pressable
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          setIsOpen(true);
        }}
        style={[
          styles.dropdownTrigger,
          compact && styles.dropdownTriggerCompact,
          {
            backgroundColor: isDark ? 'rgba(31, 41, 55, 0.8)' : 'rgba(255, 255, 255, 0.95)',
          },
        ]}
      >
        <Text style={styles.icon}>{selectedSportData.icon}</Text>
        <Text style={[styles.label, { color: textColor }]}>{selectedSportData.label}</Text>
        <Ionicons name="chevron-down" size={16} color={mutedTextColor} />
      </Pressable>

      {/* Bottom Sheet Modal */}
      <Modal visible={isOpen} transparent animationType="slide" onRequestClose={() => setIsOpen(false)}>
        <Pressable style={styles.backdrop} onPress={() => setIsOpen(false)} />
        <View
          style={[
            styles.sheet,
            {
              backgroundColor: isDark ? '#1F2937' : '#FFFFFF',
            },
          ]}
        >
          <View style={[styles.handle, { backgroundColor: isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.2)' }]} />
          <Text style={[styles.sheetTitle, { color: textColor }]}>Select Sport</Text>

          {SPORTS.map((sport) => {
            const isSelected = sport.id === selectedSport;
            return (
              <Pressable
                key={sport.id}
                style={[
                  styles.option,
                  {
                    backgroundColor: isSelected
                      ? isDark
                        ? 'rgba(249, 115, 22, 0.15)'
                        : 'rgba(249, 115, 22, 0.1)'
                      : 'transparent',
                  },
                ]}
                onPress={() => handleSelect(sport)}
              >
                <Text style={styles.optionIcon}>{sport.icon}</Text>
                <Text
                  style={[
                    styles.optionLabel,
                    {
                      color: textColor,
                      fontWeight: isSelected ? '600' : '400',
                    },
                  ]}
                >
                  {sport.label}
                </Text>
                {!sport.available && <Text style={[styles.comingSoon, { color: mutedTextColor }]}>Coming Soon</Text>}
                {isSelected && <Ionicons name="checkmark" size={20} color="#F97316" style={styles.checkmark} />}
              </Pressable>
            );
          })}
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  dropdownTrigger: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'center',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: DesignTokens.radius.xl,
    gap: 6,
    marginVertical: DesignTokens.spacing.sm,
  },
  dropdownTriggerCompact: {
    marginVertical: DesignTokens.spacing.xs,
  },
  icon: {
    fontSize: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  sheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    borderTopLeftRadius: DesignTokens.radius.xl,
    borderTopRightRadius: DesignTokens.radius.xl,
    paddingTop: 12,
    paddingBottom: 40,
    paddingHorizontal: 16,
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 16,
  },
  sheetTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 16,
    textAlign: 'center',
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderRadius: DesignTokens.radius.lg,
    marginBottom: 4,
  },
  optionIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  optionLabel: {
    fontSize: 16,
    flex: 1,
  },
  comingSoon: {
    fontSize: 12,
    fontWeight: '500',
    marginRight: 8,
  },
  checkmark: {
    marginLeft: 'auto',
  },
});
