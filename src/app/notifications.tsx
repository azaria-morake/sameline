import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, TYPOGRAPHY } from '../constants/theme';

interface NotificationItem {
  id: string;
  type: 'team_approved' | 'fixture_update' | 'new_tournament_nearby';
  title: string;
  body: string;
  timeAgo: string;
  read: boolean;
  targetId?: string;
}

const SAMPLE_NOTIFICATIONS: NotificationItem[] = [
  {
    id: 'n1',
    type: 'team_approved',
    title: 'Team Request Approved! ⚽',
    body: 'Zulu Sports approved DK XI for the Katlehong Top 8 Cash Cup.',
    timeAgo: '10m ago',
    read: false,
    targetId: 'seed-katlehong-top-8',
  },
  {
    id: 'n2',
    type: 'fixture_update',
    title: 'Live Score Update',
    body: 'DK XI 2 - 1 Real Kings (58\'). Match is heating up at Huntersfield Ground!',
    timeAgo: '25m ago',
    read: false,
    targetId: 'seed-katlehong-top-8',
  },
  {
    id: 'n3',
    type: 'new_tournament_nearby',
    title: 'New Tournament in Vosloorus',
    body: 'Vosloorus Street Cup is now open for registration. R5,000 prize pool.',
    timeAgo: '2h ago',
    read: true,
    targetId: 'seed-vosloorus-street-cup',
  },
];

export default function NotificationsScreen() {
  const router = useRouter();
  const [notifications, setNotifications] = useState<NotificationItem[]>(SAMPLE_NOTIFICATIONS);

  const handleNotificationPress = (item: NotificationItem) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === item.id ? { ...n, read: true } : n))
    );
    if (item.targetId) {
      router.push(`/tournament/${item.targetId}`);
    }
  };

  const renderIcon = (type: NotificationItem['type']) => {
    switch (type) {
      case 'team_approved':
        return <Ionicons name="checkmark-circle" size={24} color={COLORS.success} />;
      case 'fixture_update':
        return <Ionicons name="football" size={24} color={COLORS.primary} />;
      case 'new_tournament_nearby':
        return <Ionicons name="trophy" size={24} color={COLORS.accentYellow} />;
    }
  };

  return (
    <View style={styles.container}>
      <FlatList
        data={notifications}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[styles.itemCard, !item.read && styles.unreadCard]}
            onPress={() => handleNotificationPress(item)}
            activeOpacity={0.88}
          >
            <View style={styles.iconWrap}>{renderIcon(item.type)}</View>

            <View style={styles.textWrap}>
              <View style={styles.titleRow}>
                <Text style={styles.title}>{item.title}</Text>
                <Text style={styles.timeAgo}>{item.timeAgo}</Text>
              </View>
              <Text style={styles.body}>{item.body}</Text>
            </View>

            {!item.read && <View style={styles.unreadDot} />}
          </TouchableOpacity>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  listContent: {
    padding: SPACING.lg,
    gap: SPACING.sm,
  },
  itemCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.card,
    borderRadius: SPACING.cardRadius,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  unreadCard: {
    backgroundColor: '#F0F9FF',
    borderColor: '#BAE6FD',
  },
  iconWrap: {
    marginRight: SPACING.md,
  },
  textWrap: {
    flex: 1,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 2,
  },
  title: {
    ...TYPOGRAPHY.bodyBold,
    color: COLORS.textPrimary,
  },
  timeAgo: {
    ...TYPOGRAPHY.micro,
    color: COLORS.textMuted,
  },
  body: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textSecondary,
    lineHeight: 18,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.primary,
    marginLeft: SPACING.sm,
  },
});
