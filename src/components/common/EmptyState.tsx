import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, TYPOGRAPHY } from '../../constants/theme';

interface EmptyStateProps {
  townshipName: string;
  onPostPress: () => void;
  onExpandRadiusPress: () => void;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  townshipName,
  onPostPress,
  onExpandRadiusPress,
}) => {
  return (
    <View style={styles.container}>
      <View style={styles.iconCircle}>
        <Ionicons name="football-outline" size={44} color={COLORS.primary} />
      </View>

      <Text style={styles.title}>No games in 20km this weekend</Text>
      <Text style={styles.subtitle}>
        Be the first to post a cash tournament or Top 8 in {townshipName} and rally the kasi teams.
      </Text>

      <View style={styles.actions}>
        <TouchableOpacity style={styles.primaryButton} onPress={onPostPress} activeOpacity={0.88}>
          <Ionicons name="add-circle-outline" size={20} color={COLORS.textWhite} />
          <Text style={styles.primaryText}>Post Tournament</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.secondaryButton} onPress={onExpandRadiusPress} activeOpacity={0.88}>
          <Ionicons name="scan-outline" size={18} color={COLORS.textPrimary} />
          <Text style={styles.secondaryText}>Expand to 50km</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.card,
    borderRadius: SPACING.cardRadius,
    padding: SPACING.xxl,
    marginHorizontal: SPACING.lg,
    marginVertical: SPACING.xl,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: COLORS.cardMuted,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.lg,
  },
  title: {
    ...TYPOGRAPHY.h3,
    color: COLORS.textPrimary,
    textAlign: 'center',
    marginBottom: SPACING.xs,
  },
  subtitle: {
    ...TYPOGRAPHY.body,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: SPACING.xl,
  },
  actions: {
    width: '100%',
    gap: SPACING.sm,
  },
  primaryButton: {
    height: 48,
    backgroundColor: COLORS.primary,
    borderRadius: SPACING.buttonRadius,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  primaryText: {
    ...TYPOGRAPHY.bodyBold,
    color: COLORS.textWhite,
  },
  secondaryButton: {
    height: 48,
    borderRadius: SPACING.buttonRadius,
    backgroundColor: COLORS.cardMuted,
    borderWidth: 1,
    borderColor: COLORS.border,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  secondaryText: {
    ...TYPOGRAPHY.bodyBold,
    color: COLORS.textPrimary,
  },
});
