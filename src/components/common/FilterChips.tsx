import React from 'react';
import { ScrollView, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { COLORS, SPACING, TYPOGRAPHY } from '../../constants/theme';
import { FilterId, useFilterStore } from '../../stores/filterStore';

interface ChipOption {
  id: FilterId;
  label: string;
}

const CHIPS: ChipOption[] = [
  { id: 'all', label: 'All Games' },
  { id: 'this_weekend', label: 'This Weekend' },
  { id: 'open', label: 'Open' },
  { id: 'under_R500', label: '< R500' },
  { id: 'top8', label: 'Top 8' },
];

export const FilterChips: React.FC = () => {
  const { activeFilter, setActiveFilter } = useFilterStore();

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={styles.scrollView}
      contentContainerStyle={styles.container}
    >
      {CHIPS.map((chip) => {
        const isActive = activeFilter === chip.id;
        return (
          <TouchableOpacity
            key={chip.id}
            style={[styles.chip, isActive && styles.activeChip]}
            onPress={() => setActiveFilter(chip.id)}
            activeOpacity={0.8}
            accessibilityRole="button"
            accessibilityState={{ selected: isActive }}
          >
            <Text style={[styles.chipText, isActive && styles.activeChipText]}>
              {chip.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  scrollView: {
    flexGrow: 0,
    backgroundColor: COLORS.card,
  },
  container: {
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
    gap: SPACING.sm,
    alignItems: 'center',
    backgroundColor: COLORS.card,
  },
  chip: {
    paddingVertical: 7,
    paddingHorizontal: 16,
    borderRadius: SPACING.pillRadius,
    backgroundColor: COLORS.cardMuted,
    borderWidth: 1,
    borderColor: COLORS.border,
    minHeight: 36,
    justifyContent: 'center',
  },
  activeChip: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  chipText: {
    ...TYPOGRAPHY.bodyBold,
    fontSize: 13,
    color: COLORS.textSecondary,
  },
  activeChipText: {
    color: COLORS.textWhite,
  },
});
