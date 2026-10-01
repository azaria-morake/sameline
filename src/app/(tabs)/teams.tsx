import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, TYPOGRAPHY } from '../../constants/theme';
import { TeamCard, TeamData } from '../../components/common/TeamCard';

const SAMPLE_TEAMS: TeamData[] = [
  {
    id: 'team-dk-xi',
    name: 'DK XI',
    location_text: 'Katlehong',
    logo_url: 'https://images.unsplash.com/photo-1511193311914-0346f16efe90?w=200',
    stats: { played: 12, wins: 8, finals: 1, titles: 0 },
  },
  {
    id: 'team-vosloorus-fc',
    name: 'Vosloorus FC',
    location_text: 'Vosloorus',
    logo_url: 'https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?w=200',
    stats: { played: 10, wins: 6, finals: 1, titles: 0 },
  },
  {
    id: 'team-young-stars',
    name: 'Young Stars',
    location_text: 'Thokoza',
    logo_url: 'https://images.unsplash.com/photo-1579952363873-27f3bade9f55?w=200',
    stats: { played: 8, wins: 4, finals: 0, titles: 0 },
  },
  {
    id: 'team-fc-blizzards',
    name: 'FC Blizzards',
    location_text: 'Katlehong',
    logo_url: 'https://images.unsplash.com/photo-1522778119026-d647f0596c20?w=200',
    stats: { played: 6, wins: 3, finals: 0, titles: 0 },
  },
];

export default function MyTeamsScreen() {
  const router = useRouter();
  const [selectedTab, setSelectedTab] = useState<'my' | 'joined'>('my');

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      {/* Brand Header */}
      <View style={styles.headerBar}>
        <Image
          source={require('../../../assets/sameline.png')}
          style={styles.logoImage}
          contentFit="contain"
        />
        <TouchableOpacity
          style={styles.bellButton}
          onPress={() => router.push('/notifications')}
        >
          <Ionicons name="notifications-outline" size={24} color={COLORS.textPrimary} />
          <View style={styles.badge}>
            <Text style={styles.badgeText}>3</Text>
          </View>
        </TouchableOpacity>
      </View>

      {/* Title & Create CTA Row */}
      <View style={styles.titleRow}>
        <View>
          <Text style={styles.title}>My Teams</Text>
          <Text style={styles.subtitle}>Your teams, your journey.</Text>
        </View>

        <TouchableOpacity
          style={styles.createButton}
          onPress={() => router.push('/team/create')}
          activeOpacity={0.88}
        >
          <Ionicons name="add" size={18} color={COLORS.textWhite} />
          <Text style={styles.createButtonText}>Create Team</Text>
        </TouchableOpacity>
      </View>

      {/* Segmented Control */}
      <View style={styles.segmentedContainer}>
        <TouchableOpacity
          style={[styles.segmentBtn, selectedTab === 'my' && styles.segmentBtnActive]}
          onPress={() => setSelectedTab('my')}
        >
          <Text
            style={[styles.segmentText, selectedTab === 'my' && styles.segmentTextActive]}
          >
            My Teams
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.segmentBtn, selectedTab === 'joined' && styles.segmentBtnActive]}
          onPress={() => setSelectedTab('joined')}
        >
          <Text
            style={[styles.segmentText, selectedTab === 'joined' && styles.segmentTextActive]}
          >
            Joined Teams
          </Text>
        </TouchableOpacity>
      </View>

      {/* 2-Column Grid */}
      <FlatList
        data={selectedTab === 'my' ? SAMPLE_TEAMS : []}
        keyExtractor={(item) => item.id}
        numColumns={2}
        renderItem={({ item }) => <TeamCard team={item} />}
        contentContainerStyle={styles.gridContent}
        ListEmptyComponent={
          <View style={styles.emptyWrap}>
            <Ionicons name="shield-outline" size={48} color={COLORS.textMuted} />
            <Text style={styles.emptyTitle}>No joined teams yet</Text>
            <Text style={styles.emptySubtitle}>
              Request to join nearby teams or get invited by a team captain.
            </Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.card,
  },
  headerBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  logoImage: {
    width: 140,
    height: 44,
  },
  bellButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
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
  },
  badgeText: {
    color: COLORS.textWhite,
    fontSize: 10,
    fontWeight: '700',
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.md,
    paddingBottom: SPACING.sm,
  },
  title: {
    ...TYPOGRAPHY.h2,
    color: COLORS.textPrimary,
  },
  subtitle: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  createButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: COLORS.primary,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: SPACING.pillRadius,
  },
  createButtonText: {
    ...TYPOGRAPHY.captionBold,
    color: COLORS.textWhite,
  },
  segmentedContainer: {
    flexDirection: 'row',
    backgroundColor: COLORS.cardMuted,
    marginHorizontal: SPACING.lg,
    marginVertical: SPACING.sm,
    borderRadius: SPACING.pillRadius,
    padding: 3,
  },
  segmentBtn: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: SPACING.pillRadius,
  },
  segmentBtnActive: {
    backgroundColor: COLORS.primary,
  },
  segmentText: {
    ...TYPOGRAPHY.captionBold,
    color: COLORS.textSecondary,
  },
  segmentTextActive: {
    color: COLORS.textWhite,
  },
  gridContent: {
    paddingHorizontal: SPACING.md,
    paddingTop: SPACING.sm,
    paddingBottom: SPACING.xxl,
  },
  emptyWrap: {
    padding: SPACING.xxl,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: SPACING.xl,
  },
  emptyTitle: {
    ...TYPOGRAPHY.bodyBold,
    color: COLORS.textPrimary,
    marginTop: SPACING.md,
  },
  emptySubtitle: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginTop: 4,
  },
});
