import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Share,
  Linking,
  Alert,
} from 'react-native';
import { Image } from 'expo-image';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, TYPOGRAPHY } from '../../../constants/theme';
import { SEED_TOURNAMENTS, NearbyTournamentItem } from '../../../hooks/useNearbyTournaments';
import { TeamRow, TeamData } from '../../../components/common/TeamCard';
import { FixtureRow, FixtureData } from '../../../components/common/FixtureRow';
import { useAuthStore } from '../../../stores/authStore';
import { useTokenStore } from '../../../stores/tokenStore';
import { analytics } from '../../../services/analytics';

const PARTICIPATING_TEAMS: TeamData[] = [
  {
    id: 'team-dk-xi',
    name: 'DK XI',
    location_text: 'Katlehong',
    logo_url: 'https://images.unsplash.com/photo-1511193311914-0346f16efe90?w=200',
    stats: { played: 12, wins: 8, finals: 1, titles: 0 },
  },
  {
    id: 'team-real-kings',
    name: 'Real Kings',
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

const FIXTURES_DATA: FixtureData[] = [
  {
    id: 'fix-1',
    round: 'Group Stage • Match 3',
    team_a: { name: 'DK XI', logo_url: 'https://images.unsplash.com/photo-1511193311914-0346f16efe90?w=100' },
    team_b: { name: 'Real Kings', logo_url: 'https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?w=100' },
    team_a_score: 2,
    team_b_score: 1,
    status: 'live',
    match_minute: "58'",
  },
  {
    id: 'fix-2',
    round: 'Group Stage • Match 4',
    team_a: { name: 'Young Stars', logo_url: 'https://images.unsplash.com/photo-1579952363873-27f3bade9f55?w=100' },
    team_b: { name: 'FC Blizzards', logo_url: 'https://images.unsplash.com/photo-1522778119026-d647f0596c20?w=100' },
    team_a_score: 0,
    team_b_score: 0,
    status: 'scheduled',
    kickoff_time: '14:20',
    pitch_number: 1,
  },
  {
    id: 'fix-3',
    round: 'Quarter Finals • Match 9',
    team_a: { name: 'Vosloorus FC', logo_url: 'https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?w=100' },
    team_b: { name: 'Thokoza United', logo_url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100' },
    team_a_score: null,
    team_b_score: null,
    status: 'scheduled',
    kickoff_time: '16:00',
    pitch_number: 2,
  },
];

export default function TournamentDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user, isAuthenticated } = useAuthStore();

  const [activeTab, setActiveTab] = useState<'teams' | 'fixtures' | 'info'>('teams');
  const [hasRequested, setHasRequested] = useState(false);
  const [paidWithTokens, setPaidWithTokens] = useState(false);

  const { getTeamBalance, payTournamentEntryWithTokens } = useTokenStore();
  const teamId = user?.team_id || 'dk-xi';
  const teamWalletTokens = getTeamBalance(teamId);

  // Match tournament by ID or use default
  const tournament =
    SEED_TOURNAMENTS.find((t) => t.id === id) || SEED_TOURNAMENTS[0];

  const isOrganizer = user?.id === tournament.organizer_id || tournament.organizer_name.includes('Zulu');

  const handleShare = async () => {
    try {
      const shareUrl = `sameline://tournament/${tournament.id}`;
      const message = `⚽ ${tournament.title} — ${tournament.location_text} — ${tournament.start_date} — R${tournament.entry_fee} entry — ${tournament.max_teams - tournament.team_count} slots left — Join on SameLine: ${shareUrl}`;
      await Share.share({ message });
    } catch (e) {
      console.warn('Share error:', e);
    }
  };

  const handleWhatsAppContact = () => {
    const cleanPhone = tournament.contact_whatsapp.replace(/[^0-9]/g, '');
    Linking.openURL(`https://wa.me/${cleanPhone}?text=Hi,%20I'm%20interested%20in%20joining%20${encodeURIComponent(tournament.title)}`);
  };

  const handlePayWithTokens = () => {
    if (!isAuthenticated) {
      router.push('/(auth)/login');
      return;
    }

    if (teamWalletTokens < tournament.entry_fee) {
      Alert.alert(
        'Insufficient Team Tokens',
        `Team bank has ${teamWalletTokens} tokens, but entry fee requires ${tournament.entry_fee} tokens.\n\nGo to Team Profile -> Support tab to ask the community for contributions!`,
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Go to Team Profile', onPress: () => router.push(`/team/${teamId}`) },
        ]
      );
      return;
    }

    const res = payTournamentEntryWithTokens(
      teamId,
      tournament.id,
      tournament.title,
      tournament.entry_fee
    );

    if (res.success) {
      setPaidWithTokens(true);
      setHasRequested(true);
      analytics.logEvent('entry_paid_with_tokens', {
        tournament_id: tournament.id,
        tokens: tournament.entry_fee,
        team_id: teamId,
      });
      Alert.alert(
        'Entry Paid with Tokens! 🪙',
        `Successfully used ${tournament.entry_fee} tokens from Team Bank.\n\nTournament status set to 'paid_tokens'. Spot guaranteed!`
      );
    } else {
      Alert.alert('Error', res.error || 'Could not process token payment');
    }
  };

  const handleJoinRequest = () => {
    if (!isAuthenticated) {
      router.push('/(auth)/login');
      return;
    }

    analytics.logEvent('join_requested', { tournament_id: tournament.id });
    setHasRequested(true);
    Alert.alert(
      'Request Sent! 🏆',
      `Your request to join ${tournament.title} has been sent to the organizer. You will be notified once approved.`
    );
  };

  return (
    <View style={styles.container}>
      {/* Sticky Hero Header */}
      <View style={styles.heroWrap}>
        <Image
          source={{
            uri:
              tournament.banner_image_url ||
              'https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=800',
          }}
          style={styles.heroImage}
          contentFit="cover"
        />
        <View style={styles.heroOverlay} />

        <SafeAreaView style={styles.heroHeaderRow}>
          <TouchableOpacity
            style={styles.circleBtn}
            onPress={() => router.back()}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="arrow-back" size={22} color={COLORS.textWhite} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.circleBtn}
            onPress={handleShare}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="share-social-outline" size={22} color={COLORS.textWhite} />
          </TouchableOpacity>
        </SafeAreaView>

        {tournament.is_featured && (
          <View style={styles.boostedPill}>
            <Ionicons name="flash" size={12} color="#78350F" />
            <Text style={styles.boostedText}>Boosted</Text>
          </View>
        )}
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Title & Status */}
        <View style={styles.titleSection}>
          <View style={styles.titleRow}>
            <Text style={styles.title}>{tournament.title}</Text>
            <View style={styles.statusPill}>
              <Text style={styles.statusText}>{tournament.status.toUpperCase()}</Text>
            </View>
          </View>

          <View style={styles.locationRow}>
            <Ionicons name="location" size={14} color={COLORS.primary} />
            <Text style={styles.locationText}>
              {tournament.location_text} • 2.3km away
            </Text>
          </View>
        </View>

        {/* Organizer Section */}
        <View style={styles.organizerCard}>
          <Image
            source={{
              uri:
                tournament.organizer_avatar ||
                'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200',
            }}
            style={styles.organizerAvatar}
          />
          <View style={styles.organizerInfo}>
            <View style={styles.organizerNameRow}>
              <Text style={styles.organizerName}>{tournament.organizer_name}</Text>
              <View style={styles.proPill}>
                <Ionicons name="star" size={10} color={COLORS.textWhite} />
                <Text style={styles.proText}>Pro</Text>
              </View>
            </View>
            <Text style={styles.organizerRole}>Organizer</Text>
          </View>

          {isOrganizer && (
            <TouchableOpacity
              style={styles.manageBtn}
              onPress={() => router.push(`/tournament/${tournament.id}/manage`)}
            >
              <Text style={styles.manageBtnText}>Manage</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* 3-Column Info Grid */}
        <View style={styles.infoGrid}>
          <View style={styles.gridItem}>
            <Ionicons name="cash-outline" size={20} color={COLORS.primary} />
            <Text style={styles.gridValue}>R{tournament.entry_fee}</Text>
            <Text style={styles.gridLabel}>Entry Fee</Text>
          </View>

          <View style={styles.gridItem}>
            <Ionicons name="calendar-outline" size={20} color={COLORS.primary} />
            <Text style={styles.gridValue}>{tournament.start_date}</Text>
            <Text style={styles.gridLabel}>Start Date</Text>
          </View>

          <View style={styles.gridItem}>
            <Ionicons name="people-outline" size={20} color={COLORS.primary} />
            <Text style={styles.gridValue}>
              {tournament.team_count}/{tournament.max_teams}
            </Text>
            <Text style={styles.gridLabel}>Teams</Text>
          </View>
        </View>

        {/* Prize Pool & WhatsApp Contacts */}
        <View style={styles.detailRowCards}>
          <View style={styles.detailCard}>
            <Ionicons name="trophy-outline" size={20} color={COLORS.warning} />
            <View>
              <Text style={styles.detailCardTitle}>{tournament.prize_pool_text || 'R10,000'}</Text>
              <Text style={styles.detailCardSub}>Prize Pool</Text>
            </View>
          </View>

          <TouchableOpacity style={styles.detailCard} onPress={handleWhatsAppContact}>
            <Ionicons name="logo-whatsapp" size={20} color="#25D366" />
            <View>
              <Text style={styles.detailCardTitle}>{tournament.contact_whatsapp}</Text>
              <Text style={styles.detailCardSub}>Contact WhatsApp</Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Tabs: Teams | Fixtures | Info */}
        <View style={styles.tabsHeader}>
          <TouchableOpacity
            style={[styles.tabButton, activeTab === 'teams' && styles.tabButtonActive]}
            onPress={() => setActiveTab('teams')}
          >
            <Text style={[styles.tabText, activeTab === 'teams' && styles.tabTextActive]}>
              Teams ({tournament.team_count})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tabButton, activeTab === 'fixtures' && styles.tabButtonActive]}
            onPress={() => setActiveTab('fixtures')}
          >
            <Text style={[styles.tabText, activeTab === 'fixtures' && styles.tabTextActive]}>
              Fixtures
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tabButton, activeTab === 'info' && styles.tabButtonActive]}
            onPress={() => setActiveTab('info')}
          >
            <Text style={[styles.tabText, activeTab === 'info' && styles.tabTextActive]}>
              Info
            </Text>
          </TouchableOpacity>
        </View>

        {/* TAB CONTENTS */}
        {activeTab === 'teams' && (
          <View style={styles.tabContent}>
            {PARTICIPATING_TEAMS.map((team) => (
              <TeamRow key={team.id} team={team} />
            ))}
          </View>
        )}

        {activeTab === 'fixtures' && (
          <View style={styles.tabContent}>
            {FIXTURES_DATA.map((fix) => (
              <FixtureRow key={fix.id} fixture={fix} />
            ))}
          </View>
        )}

        {activeTab === 'info' && (
          <View style={styles.infoContentCard}>
            <Text style={styles.infoHeading}>Rules & Tournament Format</Text>
            <Text style={styles.infoBody}>
              {tournament.description ||
                'Standard township 11-aside knockout format. 45 minutes per half. No extra time — straight to penalties if tied at full-time.'}
            </Text>

            <Text style={[styles.infoHeading, { marginTop: SPACING.md }]}>Pitch Ground</Text>
            <Text style={styles.infoBody}>
              📍 {tournament.location_text} Main Sports Complex. Parking and security provided.
            </Text>
          </View>
        )}
      </ScrollView>

      {/* Sticky Bottom Action Bar */}
      <View style={styles.bottomBar}>
        {paidWithTokens ? (
          <View style={styles.paidTokensBanner}>
            <Ionicons name="checkmark-circle" size={20} color="#059669" />
            <Text style={styles.paidTokensBannerText}>
              Entered with Tokens • Status: paid_tokens
            </Text>
          </View>
        ) : hasRequested ? (
          <View style={[styles.joinBtn, styles.joinBtnPending]}>
            <Ionicons name="hourglass-outline" size={20} color={COLORS.textWhite} />
            <Text style={styles.joinBtnText}>Request Pending Approval</Text>
          </View>
        ) : tournament.entry_fee > 0 ? (
          <View style={styles.actionColumn}>
            <TouchableOpacity
              style={styles.payTokensBtn}
              onPress={handlePayWithTokens}
              activeOpacity={0.88}
            >
              <Ionicons name="sparkles" size={18} color="#78350F" />
              <Text style={styles.payTokensBtnText}>
                Use Team Tokens ({tournament.entry_fee} tokens)
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.joinCashBtn}
              onPress={handleJoinRequest}
              activeOpacity={0.88}
            >
              <Text style={styles.joinCashBtnText}>
                Or Request to Pay Cash (R{tournament.entry_fee})
              </Text>
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity
            style={styles.joinBtn}
            onPress={handleJoinRequest}
            activeOpacity={0.88}
          >
            <Ionicons name="shield-checkmark-outline" size={20} color={COLORS.textWhite} />
            <Text style={styles.joinBtnText}>Select Team & Request to Join</Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity style={styles.whatsappBtn} onPress={handleWhatsAppContact}>
          <Ionicons name="logo-whatsapp" size={20} color="#25D366" />
          <Text style={styles.whatsappBtnText}>Contact on WhatsApp</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  heroWrap: {
    height: 220,
    position: 'relative',
  },
  heroImage: {
    width: '100%',
    height: '100%',
  },
  heroOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  heroHeaderRow: {
    position: 'absolute',
    top: 40,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.lg,
    zIndex: 10,
  },
  circleBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  boostedPill: {
    position: 'absolute',
    bottom: SPACING.md,
    right: SPACING.lg,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: COLORS.accentYellow,
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: SPACING.pillRadius,
  },
  boostedText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#78350F',
    textTransform: 'uppercase',
  },
  scrollContent: {
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.md,
    paddingBottom: 160,
  },
  titleSection: {
    marginBottom: SPACING.md,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  title: {
    ...TYPOGRAPHY.h2,
    color: COLORS.textPrimary,
    flex: 1,
  },
  statusPill: {
    backgroundColor: COLORS.successLight,
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: SPACING.pillRadius,
  },
  statusText: {
    ...TYPOGRAPHY.micro,
    color: COLORS.success,
    fontWeight: '700',
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  locationText: {
    ...TYPOGRAPHY.body,
    color: COLORS.textSecondary,
  },
  organizerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.card,
    borderRadius: SPACING.cardRadius,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: SPACING.md,
  },
  organizerAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.cardMuted,
    marginRight: SPACING.md,
  },
  organizerInfo: {
    flex: 1,
  },
  organizerNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  organizerName: {
    ...TYPOGRAPHY.bodyBold,
    color: COLORS.textPrimary,
  },
  proPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    backgroundColor: COLORS.primary,
    paddingVertical: 1,
    paddingHorizontal: 6,
    borderRadius: SPACING.pillRadius,
  },
  proText: {
    fontSize: 9,
    fontWeight: '700',
    color: COLORS.textWhite,
  },
  organizerRole: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textSecondary,
  },
  manageBtn: {
    backgroundColor: COLORS.cardMuted,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: SPACING.pillRadius,
  },
  manageBtnText: {
    ...TYPOGRAPHY.captionBold,
    color: COLORS.primary,
  },
  infoGrid: {
    flexDirection: 'row',
    backgroundColor: COLORS.card,
    borderRadius: SPACING.cardRadius,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingVertical: SPACING.md,
    marginBottom: SPACING.md,
  },
  gridItem: {
    flex: 1,
    alignItems: 'center',
    borderRightWidth: 1,
    borderRightColor: COLORS.border,
    gap: 2,
  },
  gridValue: {
    ...TYPOGRAPHY.bodyBold,
    color: COLORS.textPrimary,
    marginTop: 4,
  },
  gridLabel: {
    ...TYPOGRAPHY.micro,
    color: COLORS.textSecondary,
  },
  detailRowCards: {
    flexDirection: 'row',
    gap: SPACING.md,
    marginBottom: SPACING.lg,
  },
  detailCard: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: COLORS.card,
    borderRadius: SPACING.cardRadius,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  detailCardTitle: {
    ...TYPOGRAPHY.captionBold,
    color: COLORS.textPrimary,
  },
  detailCardSub: {
    ...TYPOGRAPHY.micro,
    color: COLORS.textSecondary,
  },
  tabsHeader: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    marginBottom: SPACING.md,
  },
  tabButton: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    marginRight: SPACING.sm,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabButtonActive: {
    borderBottomColor: COLORS.primary,
  },
  tabText: {
    ...TYPOGRAPHY.bodyBold,
    color: COLORS.textSecondary,
  },
  tabTextActive: {
    color: COLORS.primary,
  },
  tabContent: {
    gap: SPACING.xs,
  },
  infoContentCard: {
    backgroundColor: COLORS.card,
    borderRadius: SPACING.cardRadius,
    padding: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  infoHeading: {
    ...TYPOGRAPHY.bodyBold,
    color: COLORS.textPrimary,
    marginBottom: 4,
  },
  infoBody: {
    ...TYPOGRAPHY.body,
    color: COLORS.textSecondary,
    lineHeight: 22,
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: COLORS.card,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.md,
    paddingBottom: SPACING.xxl,
    gap: SPACING.sm,
  },
  joinBtn: {
    height: 50,
    backgroundColor: COLORS.primary,
    borderRadius: SPACING.buttonRadius,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  joinBtnPending: {
    backgroundColor: COLORS.textMuted,
  },
  joinBtnText: {
    ...TYPOGRAPHY.bodyBold,
    color: COLORS.textWhite,
  },
  whatsappBtn: {
    height: 44,
    backgroundColor: COLORS.cardMuted,
    borderRadius: SPACING.buttonRadius,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  whatsappBtnText: {
    ...TYPOGRAPHY.captionBold,
    color: COLORS.textPrimary,
  },
  paidTokensBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: 'rgba(5, 150, 105, 0.15)',
    borderWidth: 1,
    borderColor: '#059669',
    height: 48,
    borderRadius: SPACING.buttonRadius,
  },
  paidTokensBannerText: {
    ...TYPOGRAPHY.bodySmallBold,
    color: '#059669',
  },
  actionColumn: {
    gap: 6,
  },
  payTokensBtn: {
    height: 48,
    backgroundColor: COLORS.accentYellow,
    borderRadius: SPACING.buttonRadius,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  payTokensBtnText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#78350F',
  },
  joinCashBtn: {
    height: 38,
    alignItems: 'center',
    justifyContent: 'center',
  },
  joinCashBtnText: {
    ...TYPOGRAPHY.captionBold,
    color: COLORS.primary,
  },
});
