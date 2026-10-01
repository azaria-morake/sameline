import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, TYPOGRAPHY } from '../../constants/theme';
import { useRouter } from 'expo-router';

interface HeaderBarProps {
  townshipName: string;
  notificationCount?: number;
  onOpenFilter?: () => void;
}

export const HeaderBar: React.FC<HeaderBarProps> = ({
  townshipName,
  notificationCount = 3,
  onOpenFilter,
}) => {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={styles.locationPill}
        onPress={onOpenFilter}
        activeOpacity={0.8}
        accessibilityLabel={`Current location ${townshipName}, tap to change`}
      >
        <Ionicons name="location-sharp" size={18} color={COLORS.primary} />
        <Text style={styles.locationText}>{townshipName}</Text>
        <Ionicons name="chevron-down" size={16} color={COLORS.textPrimary} />
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.bellButton}
        onPress={() => router.push('/notifications')}
        activeOpacity={0.8}
        accessibilityLabel={`Notifications, ${notificationCount} unread`}
      >
        <Ionicons name="notifications-outline" size={24} color={COLORS.textPrimary} />
        {notificationCount > 0 && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{notificationCount}</Text>
          </View>
        )}
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    backgroundColor: COLORS.card,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  locationPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: COLORS.cardMuted,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: SPACING.pillRadius,
  },
  locationText: {
    ...TYPOGRAPHY.bodyBold,
    color: COLORS.textPrimary,
  },
  bellButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  badge: {
    position: 'absolute',
    top: 6,
    right: 6,
    backgroundColor: COLORS.danger,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  badgeText: {
    color: COLORS.textWhite,
    fontSize: 10,
    fontWeight: '700',
  },
});
