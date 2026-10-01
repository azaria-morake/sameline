import React from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, TYPOGRAPHY } from '../../constants/theme';
import { FilterId, useFilterStore } from '../../stores/filterStore';
import { useLocationStore } from '../../stores/locationStore';
import { TOWNSHIP_PRESETS } from '../../services/location';

interface FilterModalProps {
  visible: boolean;
  onClose: () => void;
}

export const FilterModal: React.FC<FilterModalProps> = ({ visible, onClose }) => {
  const { activeFilter, setActiveFilter, resetFilters } = useFilterStore();
  const { townshipName, setTownship } = useLocationStore();

  const filterOptions: { id: FilterId; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
    { id: 'this_weekend', label: 'This Weekend', icon: 'calendar-outline' },
    { id: 'open', label: 'Open for Registration', icon: 'radio-button-on' },
    { id: 'under_R500', label: 'Entry Fee < R500', icon: 'cash-outline' },
    { id: 'top8', label: 'Top 8 Format', icon: 'trophy-outline' },
  ];

  const handleApply = () => {
    onClose();
  };

  const handleClear = () => {
    resetFilters();
  };

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.overlay}>
        <View style={styles.modalContent}>
          {/* Header Drag Handle */}
          <View style={styles.dragHandle} />

          <View style={styles.header}>
            <Text style={styles.title}>Filter Tournaments</Text>
            <TouchableOpacity onPress={onClose} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <Ionicons name="close" size={24} color={COLORS.textPrimary} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.body} showsVerticalScrollIndicator={false}>
            {/* Township Picker Section */}
            <Text style={styles.sectionHeader}>Township Location</Text>
            <View style={styles.townshipWrap}>
              {TOWNSHIP_PRESETS.map((t) => {
                const isSelected = townshipName.toLowerCase() === t.name.toLowerCase();
                return (
                  <TouchableOpacity
                    key={t.id}
                    style={[styles.townshipChip, isSelected && styles.selectedTownshipChip]}
                    onPress={() => setTownship(t.name, t.coords)}
                  >
                    <Ionicons
                      name="location"
                      size={14}
                      color={isSelected ? COLORS.textWhite : COLORS.textSecondary}
                    />
                    <Text style={[styles.townshipText, isSelected && styles.selectedTownshipText]}>
                      {t.name}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Filter Options */}
            <Text style={[styles.sectionHeader, { marginTop: SPACING.lg }]}>Tournament Filters</Text>
            {filterOptions.map((opt) => {
              const isSelected = activeFilter === opt.id;
              return (
                <TouchableOpacity
                  key={opt.id}
                  style={styles.optionRow}
                  onPress={() => setActiveFilter(isSelected ? 'all' : opt.id)}
                >
                  <View style={styles.optionLeft}>
                    <Ionicons name={opt.icon} size={20} color={COLORS.textSecondary} />
                    <Text style={styles.optionLabel}>{opt.label}</Text>
                  </View>
                  <View style={[styles.radioCircle, isSelected && styles.radioCircleActive]}>
                    {isSelected && <Ionicons name="checkmark" size={14} color={COLORS.textWhite} />}
                  </View>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          {/* Action Buttons */}
          <View style={styles.footer}>
            <TouchableOpacity style={styles.clearButton} onPress={handleClear}>
              <Text style={styles.clearText}>Clear All</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.applyButton} onPress={handleApply}>
              <Text style={styles.applyText}>Apply Filters</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: COLORS.card,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: SPACING.sm,
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.xxl,
    maxHeight: '80%',
  },
  dragHandle: {
    width: 40,
    height: 4,
    backgroundColor: COLORS.borderStrong,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: SPACING.md,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  title: {
    ...TYPOGRAPHY.h3,
    color: COLORS.textPrimary,
  },
  body: {
    marginBottom: SPACING.lg,
  },
  sectionHeader: {
    ...TYPOGRAPHY.captionBold,
    color: COLORS.textSecondary,
    textTransform: 'uppercase',
    marginBottom: SPACING.sm,
  },
  townshipWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  townshipChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: COLORS.cardMuted,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: SPACING.pillRadius,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  selectedTownshipChip: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  townshipText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textPrimary,
  },
  selectedTownshipText: {
    color: COLORS.textWhite,
    fontWeight: '700',
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  optionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  optionLabel: {
    ...TYPOGRAPHY.body,
    color: COLORS.textPrimary,
  },
  radioCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: COLORS.borderStrong,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioCircleActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  footer: {
    flexDirection: 'row',
    gap: SPACING.md,
  },
  clearButton: {
    flex: 1,
    height: 48,
    borderRadius: SPACING.buttonRadius,
    borderWidth: 1,
    borderColor: COLORS.borderStrong,
    alignItems: 'center',
    justifyContent: 'center',
  },
  clearText: {
    ...TYPOGRAPHY.bodyBold,
    color: COLORS.textSecondary,
  },
  applyButton: {
    flex: 1,
    height: 48,
    borderRadius: SPACING.buttonRadius,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  applyText: {
    ...TYPOGRAPHY.bodyBold,
    color: COLORS.textWhite,
  },
});
