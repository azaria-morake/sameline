import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Share,
  Modal,
  TextInput,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, TYPOGRAPHY } from '../../constants/theme';
import { useAuthStore } from '../../stores/authStore';
import { useTokenStore, TeamNeed } from '../../stores/tokenStore';
import { TokenStoreModal } from '../../components/common/TokenStoreModal';
import { NeedCategory } from '../../types/supabase';

interface HistoryItem {
  id: string;
  tournamentTitle: string;
  date: string;
  result: 'Champion' | 'Finalist' | 'Group Stage';
}

const PAST_HISTORY: HistoryItem[] = [
  { id: '1', tournamentTitle: 'Katlehong Top 8 Cash Cup', date: '12 Oct 2024', result: 'Finalist' },
  { id: '2', tournamentTitle: 'Vosloorus Street Cup', date: '5 Oct 2024', result: 'Champion' },
  { id: '3', tournamentTitle: 'Ekurhuleni Community Cup', date: '28 Sep 2024', result: 'Group Stage' },
];

const SQUAD_PLAYERS = [
  { id: 'p1', name: 'Sipho Zulu', position: 'Goalkeeper' },
  { id: 'p2', name: 'Kagiso Molefe', position: 'Centre Back' },
  { id: 'p3', name: 'Thabo Mokoena (C)', position: 'Midfielder' },
  { id: 'p4', name: 'Bafana Khumalo', position: 'Forward' },
];

export default function TeamDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user, isTeamPro } = useAuthStore();
  const {
    getTeamBalance,
    getUserBalance,
    teamNeeds,
    fundraisingPosts,
    supportNeed,
    createNeed,
    markNeedFulfilled,
  } = useTokenStore();

  const [activeTab, setActiveTab] = useState<'history' | 'squad' | 'fixtures' | 'support'>('support');
  const [isFollowing, setIsFollowing] = useState(false);
  const [tokenStoreVisible, setTokenStoreVisible] = useState(false);

  // Support Sheet state
  const [selectedNeed, setSelectedNeed] = useState<TeamNeed | null>(null);
  const [supportAmount, setSupportAmount] = useState<number>(20);
  const [supportModalVisible, setSupportModalVisible] = useState(false);

  // Create Need Modal state
  const [createNeedVisible, setCreateNeedVisible] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newTarget, setNewTarget] = useState('');
  const [newCategory, setNewCategory] = useState<NeedCategory>('gear');
  const [newDesc, setNewDesc] = useState('');

  const teamId = id || 'dk-xi';
  const teamName = id?.includes('vosloorus') ? 'Vosloorus FC' : 'DK XI';
  const isTeamProActive = teamId === 'dk-xi' ? true : isTeamPro;
  const isCaptain = user?.team_id === teamId || user?.id === 'demo-captain-sipho';

  const teamTokens = getTeamBalance(teamId);
  const userTokens = user?.id ? getUserBalance(user.id) : 0;

  // Filter needs and posts for this team
  const filteredNeeds = teamNeeds.filter((n) => n.team_id === teamId || teamId === 'dk-xi');
  const filteredPosts = fundraisingPosts.filter((p) => p.team_id === teamId || teamId === 'dk-xi');

  const handleShare = async () => {
    try {
      await Share.share({
        message: `Check out ${teamName} on SameLine — Stats, Squad, and Community Needs: sameline://team/${id}`,
      });
    } catch (e) {
      console.warn('Share error:', e);
    }
  };

  const handleOpenSupport = (need: TeamNeed) => {
    setSelectedNeed(need);
    setSupportAmount(20);
    setSupportModalVisible(true);
  };

  const handleConfirmSupport = () => {
    if (!selectedNeed || !user?.id) return;

    if (userTokens < supportAmount) {
      Alert.alert(
        'Insufficient Tokens',
        `You have ${userTokens} tokens, but you need ${supportAmount} tokens. Would you like to buy more?`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Buy Tokens',
            onPress: () => {
              setSupportModalVisible(false);
              setTokenStoreVisible(true);
            },
          },
        ]
      );
      return;
    }

    const res = supportNeed(
      user.id,
      user.display_name || 'Supporter',
      selectedNeed.id,
      supportAmount
    );

    if (res.success) {
      setSupportModalVisible(false);
      Alert.alert(
        'Thank You! ⚽',
        `You sent ${supportAmount} tokens to ${selectedNeed.title}. ${teamName} received your support!`
      );
    } else {
      Alert.alert('Error', res.error || 'Could not complete support.');
    }
  };

  const handleCreateNeedSubmit = () => {
    const target = parseInt(newTarget, 10);
    if (!newTitle.trim() || isNaN(target) || target <= 0) {
      Alert.alert('Invalid Input', 'Please enter a valid title and token target amount.');
      return;
    }

    const res = createNeed(teamId, {
      title: newTitle.trim(),
      target_tokens: target,
      category: newCategory,
      description: newDesc.trim(),
    });

    if (res.success) {
      setCreateNeedVisible(false);
      setNewTitle('');
      setNewTarget('');
      setNewDesc('');
      Alert.alert('Need Published! 🎯', 'Your community need is now live and can receive tokens.');
    }
  };

  return (
    <View style={styles.container}>
      {/* Hero Banner */}
      <View style={styles.heroWrap}>
        <Image
          source={{
            uri: 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?w=800',
          }}
          style={styles.heroImage}
          contentFit="cover"
        />
        <View style={styles.heroOverlay} />

        <SafeAreaView style={styles.topNavRow}>
          <TouchableOpacity
            style={styles.circleBtn}
            onPress={() => router.back()}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="arrow-back" size={22} color={COLORS.textWhite} />
          </TouchableOpacity>

          <View style={styles.topRightBtns}>
            {/* Team Wallet Badge in Header */}
            {isTeamProActive && (
              <View style={styles.headerWalletPill}>
                <Ionicons name="wallet-outline" size={14} color={COLORS.accentYellow} />
                <Text style={styles.headerWalletText}>{teamTokens} Tokens in bank</Text>
              </View>
            )}

            <TouchableOpacity
              style={styles.circleBtn}
              onPress={handleShare}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Ionicons name="share-social-outline" size={22} color={COLORS.textWhite} />
            </TouchableOpacity>
          </View>
        </SafeAreaView>

        {/* Crest */}
        <View style={styles.crestWrap}>
          <Image
            source={{
              uri: 'https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?w=200',
            }}
            style={styles.crest}
          />
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Team Identity */}
        <View style={styles.identitySection}>
          <View style={styles.nameRow}>
            <Text style={styles.teamTitle}>{teamName}</Text>
            <Ionicons name="checkmark-circle" size={20} color={COLORS.primary} />
            {isTeamProActive && (
              <View style={styles.proTeamPill}>
                <Text style={styles.proTeamPillText}>TEAM PRO</Text>
              </View>
            )}
          </View>

          <Text style={styles.metaSubtitle}>Katlehong / Vosloorus • 2.3km away</Text>

          <View style={styles.captainRow}>
            <Ionicons name="ribbon-outline" size={16} color={COLORS.accentYellow} />
            <Text style={styles.captainText}>Captain: Sipho Zulu</Text>
          </View>

          <Text style={styles.bioText}>
            Built in the kasi. For the kasi. We play with heart, not just skill.
          </Text>
        </View>

        {/* 4-Stat Box */}
        <View style={styles.statsCard}>
          <View style={styles.statCol}>
            <Text style={styles.statNumber}>10</Text>
            <Text style={styles.statLabel}>Played</Text>
          </View>
          <View style={styles.statCol}>
            <Text style={styles.statNumber}>6</Text>
            <Text style={styles.statLabel}>Wins</Text>
          </View>
          <View style={styles.statCol}>
            <Text style={styles.statNumber}>1</Text>
            <Text style={styles.statLabel}>Finals</Text>
          </View>
          <View style={styles.statCol}>
            <Text style={styles.statNumber}>0</Text>
            <Text style={styles.statLabel}>Titles</Text>
          </View>
        </View>

        {/* 4 Tabs: Support (Highlighted), History, Squad, Fixtures */}
        <View style={styles.tabsHeader}>
          <TouchableOpacity
            style={[styles.tabBtn, activeTab === 'support' && styles.tabBtnActive]}
            onPress={() => setActiveTab('support')}
          >
            <Ionicons
              name="sparkles"
              size={13}
              color={activeTab === 'support' ? COLORS.accentYellow : COLORS.textMuted}
            />
            <Text style={[styles.tabText, activeTab === 'support' && styles.tabTextActive]}>
              Support
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tabBtn, activeTab === 'history' && styles.tabBtnActive]}
            onPress={() => setActiveTab('history')}
          >
            <Text style={[styles.tabText, activeTab === 'history' && styles.tabTextActive]}>
              History
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tabBtn, activeTab === 'squad' && styles.tabBtnActive]}
            onPress={() => setActiveTab('squad')}
          >
            <Text style={[styles.tabText, activeTab === 'squad' && styles.tabTextActive]}>
              Squad
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tabBtn, activeTab === 'fixtures' && styles.tabBtnActive]}
            onPress={() => setActiveTab('fixtures')}
          >
            <Text style={[styles.tabText, activeTab === 'fixtures' && styles.tabTextActive]}>
              Fixtures
            </Text>
          </TouchableOpacity>
        </View>

        {/* Tab 4: Support & Community Bank */}
        {activeTab === 'support' && (
          <View style={styles.supportContainer}>
            {!isTeamProActive ? (
              /* Locked State if not Team Pro */
              <View style={styles.lockedBankCard}>
                <View style={styles.lockedIconCircle}>
                  <Ionicons name="lock-closed" size={26} color={COLORS.accentYellow} />
                </View>
                <Text style={styles.lockedTitle}>Community Bank Locked</Text>
                <Text style={styles.lockedDesc}>
                  Upgrade to Team Pro (R99/mo) to unlock community token receiving, list team needs,
                  and pay tournament entry fees directly with team tokens.
                </Text>
                <TouchableOpacity
                  style={styles.lockedUpgradeBtn}
                  onPress={() => router.push('/paywall')}
                  activeOpacity={0.88}
                >
                  <Text style={styles.lockedUpgradeBtnText}>Upgrade to Team Pro</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <>
                {/* Team Bank Header Banner */}
                <View style={styles.bankBanner}>
                  <View style={styles.bankBannerTop}>
                    <View>
                      <Text style={styles.bankBannerLabel}>TEAM COMMUNITY BANK</Text>
                      <View style={styles.bankBalanceRow}>
                        <Text style={styles.bankBalanceVal}>{teamTokens}</Text>
                        <Text style={styles.bankBalanceUnit}>Tokens in bank</Text>
                      </View>
                    </View>

                    {isCaptain && (
                      <TouchableOpacity
                        style={styles.createNeedBtn}
                        onPress={() => setCreateNeedVisible(true)}
                        activeOpacity={0.88}
                      >
                        <Ionicons name="add" size={16} color={COLORS.textWhite} />
                        <Text style={styles.createNeedBtnText}>Create Need</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                  <Text style={styles.bankBannerSub}>
                    100% closed-loop. Tokens are redeemed directly for gear and tournament entry fees.
                  </Text>
                </View>

                {/* Team Needs Section */}
                <View style={styles.needsSection}>
                  <View style={styles.sectionHeaderRow}>
                    <Text style={styles.sectionTitle}>Active Needs</Text>
                    <Text style={styles.needsCountBadge}>{filteredNeeds.length} asks</Text>
                  </View>

                  {filteredNeeds.map((need) => {
                    const percent = Math.min(100, Math.round((need.current_tokens / need.target_tokens) * 100));
                    const isFunded = need.status === 'funded' || need.current_tokens >= need.target_tokens;

                    return (
                      <View key={need.id} style={styles.needCard}>
                        <View style={styles.needHeaderRow}>
                          <View style={styles.categoryPill}>
                            <Text style={styles.categoryPillText}>
                              {need.category.toUpperCase()}
                            </Text>
                          </View>
                          <View
                            style={[
                              styles.needStatusPill,
                              isFunded && styles.needStatusFunded,
                            ]}
                          >
                            <Text
                              style={[
                                styles.needStatusText,
                                isFunded && styles.needStatusFundedText,
                              ]}
                            >
                              {isFunded ? 'FUNDED 🎉' : `${percent}% FUNDED`}
                            </Text>
                          </View>
                        </View>

                        <Text style={styles.needTitle}>{need.title}</Text>
                        {need.description ? (
                          <Text style={styles.needDescription}>{need.description}</Text>
                        ) : null}

                        {/* Progress Bar */}
                        <View style={styles.progressWrap}>
                          <View style={styles.progressBarBg}>
                            <View style={[styles.progressBarFill, { width: `${percent}%` }]} />
                          </View>
                          <View style={styles.progressNumbersRow}>
                            <Text style={styles.progressTokensText}>
                              <Text style={styles.boldTokenNum}>{need.current_tokens}</Text> /{' '}
                              {need.target_tokens} tokens
                            </Text>
                            <Text style={styles.supportersText}>
                              {need.supporters_count} supporter{need.supporters_count === 1 ? '' : 's'}
                            </Text>
                          </View>
                        </View>

                        {/* Actions */}
                        <View style={styles.needActionRow}>
                          {!isFunded ? (
                            <TouchableOpacity
                              style={styles.supportNeedBtn}
                              onPress={() => handleOpenSupport(need)}
                              activeOpacity={0.88}
                            >
                              <Ionicons name="heart" size={16} color={COLORS.textWhite} />
                              <Text style={styles.supportNeedBtnText}>Support Need</Text>
                            </TouchableOpacity>
                          ) : isCaptain ? (
                            <TouchableOpacity
                              style={styles.fulfilledBtn}
                              onPress={() => markNeedFulfilled(need.id)}
                            >
                              <Ionicons name="checkmark-done" size={16} color="#059669" />
                              <Text style={styles.fulfilledBtnText}>Mark As Fulfilled</Text>
                            </TouchableOpacity>
                          ) : (
                            <View style={styles.fullyFundedBanner}>
                              <Ionicons name="checkmark-circle" size={16} color="#059669" />
                              <Text style={styles.fullyFundedBannerText}>Goal Achieved!</Text>
                            </View>
                          )}
                        </View>
                      </View>
                    );
                  })}
                </View>

                {/* Fundraising Timeline */}
                <View style={styles.timelineSection}>
                  <Text style={styles.sectionTitle}>Fundraising Timeline</Text>
                  <View style={styles.timelineList}>
                    {filteredPosts.map((post) => (
                      <View key={post.id} style={styles.timelineItem}>
                        <View style={styles.timelineLeft}>
                          <View
                            style={[
                              styles.timelineDot,
                              post.type === 'milestone' && styles.timelineDotMilestone,
                            ]}
                          >
                            <Ionicons
                              name={
                                post.type === 'milestone'
                                  ? 'trophy'
                                  : post.type === 'need_created'
                                  ? 'flag'
                                  : 'heart'
                              }
                              size={12}
                              color={post.type === 'milestone' ? '#78350F' : COLORS.textWhite}
                            />
                          </View>
                          <View style={styles.timelineLine} />
                        </View>

                        <View
                          style={[
                            styles.timelineCard,
                            post.type === 'milestone' && styles.timelineCardMilestone,
                          ]}
                        >
                          <Text style={styles.timelineMessage}>{post.message}</Text>
                          <Text style={styles.timelineTime}>
                            {new Date(post.created_at).toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </Text>
                        </View>
                      </View>
                    ))}
                  </View>
                </View>
              </>
            )}
          </View>
        )}

        {/* Tab 1: Tournament History */}
        {activeTab === 'history' && (
          <View style={styles.historyList}>
            {PAST_HISTORY.map((item) => (
              <View key={item.id} style={styles.historyCard}>
                <Ionicons name="trophy" size={24} color={COLORS.primary} style={{ marginRight: 12 }} />
                <View style={styles.historyInfo}>
                  <Text style={styles.historyTitle}>{item.tournamentTitle}</Text>
                  <Text style={styles.historyDate}>{item.date}</Text>
                </View>
                <View
                  style={[
                    styles.resultBadge,
                    item.result === 'Champion' && styles.championBadge,
                    item.result === 'Finalist' && styles.finalistBadge,
                  ]}
                >
                  <Text
                    style={[
                      styles.resultText,
                      item.result === 'Champion' && styles.championText,
                      item.result === 'Finalist' && styles.finalistText,
                    ]}
                  >
                    {item.result}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Tab 2: Squad */}
        {activeTab === 'squad' && (
          <View style={styles.squadList}>
            {SQUAD_PLAYERS.map((player) => (
              <View key={player.id} style={styles.playerCard}>
                <View style={styles.playerNum}>
                  <Ionicons name="person" size={18} color={COLORS.primary} />
                </View>
                <View style={styles.playerInfo}>
                  <Text style={styles.playerName}>{player.name}</Text>
                  <Text style={styles.playerPosition}>{player.position}</Text>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Tab 3: Fixtures */}
        {activeTab === 'fixtures' && (
          <View style={styles.emptyFixtures}>
            <Ionicons name="calendar-outline" size={40} color={COLORS.textMuted} />
            <Text style={styles.emptyFixturesTitle}>Upcoming Matches</Text>
            <Text style={styles.emptyFixturesSub}>Next scheduled game in Katlehong Top 8 Cash Cup.</Text>
          </View>
        )}
      </ScrollView>

      {/* Follow Button */}
      <View style={styles.bottomBar}>
        <TouchableOpacity
          style={[styles.followBtn, isFollowing && styles.followBtnActive]}
          onPress={() => setIsFollowing(!isFollowing)}
          activeOpacity={0.88}
        >
          <Ionicons
            name={isFollowing ? 'checkmark' : 'person-add-outline'}
            size={20}
            color={COLORS.textWhite}
          />
          <Text style={styles.followBtnText}>
            {isFollowing ? 'Following Team' : 'Follow Team'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Support Need Bottom Sheet Modal */}
      <Modal
        visible={supportModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setSupportModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.supportSheet}>
            <View style={styles.sheetTopRow}>
              <View>
                <Text style={styles.sheetHeaderTitle}>Support Need</Text>
                <Text style={styles.sheetHeaderSub}>{selectedNeed?.title}</Text>
              </View>
              <TouchableOpacity onPress={() => setSupportModalVisible(false)}>
                <Ionicons name="close" size={22} color={COLORS.textSecondary} />
              </TouchableOpacity>
            </View>

            <View style={styles.balanceReminderRow}>
              <Ionicons name="wallet-outline" size={16} color={COLORS.primary} />
              <Text style={styles.balanceReminderText}>
                Your Balance: <Text style={styles.boldText}>{userTokens} Tokens</Text>
              </Text>
            </View>

            <Text style={styles.amountPrompt}>Select tokens to contribute:</Text>
            <View style={styles.chipRow}>
              {[10, 20, 50, 100].map((amt) => {
                const isSelected = supportAmount === amt;
                return (
                  <TouchableOpacity
                    key={amt}
                    style={[styles.tokenChip, isSelected && styles.tokenChipActive]}
                    onPress={() => setSupportAmount(amt)}
                  >
                    <Text style={[styles.tokenChipText, isSelected && styles.tokenChipTextActive]}>
                      {amt} Tokens (R{amt})
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <TouchableOpacity
              style={styles.confirmSupportBtn}
              onPress={handleConfirmSupport}
              activeOpacity={0.88}
            >
              <Text style={styles.confirmSupportBtnText}>
                Send {supportAmount} Tokens (R{supportAmount})
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Create Need Modal */}
      <Modal
        visible={createNeedVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setCreateNeedVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.createModalCard}>
            <View style={styles.sheetTopRow}>
              <Text style={styles.sheetHeaderTitle}>Create Team Need</Text>
              <TouchableOpacity onPress={() => setCreateNeedVisible(false)}>
                <Ionicons name="close" size={22} color={COLORS.textSecondary} />
              </TouchableOpacity>
            </View>

            <Text style={styles.inputLabel}>Need Title *</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. Training Balls (5x) or Top 8 Entry"
              placeholderTextColor={COLORS.textMuted}
              value={newTitle}
              onChangeText={setNewTitle}
            />

            <Text style={styles.inputLabel}>Target Tokens (1 Token = R1) *</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. 500"
              placeholderTextColor={COLORS.textMuted}
              keyboardType="numeric"
              value={newTarget}
              onChangeText={setNewTarget}
            />

            <Text style={styles.inputLabel}>Category</Text>
            <View style={styles.chipRow}>
              {(['gear', 'entry_fee', 'transport', 'other'] as NeedCategory[]).map((cat) => (
                <TouchableOpacity
                  key={cat}
                  style={[styles.catChip, newCategory === cat && styles.catChipActive]}
                  onPress={() => setNewCategory(cat)}
                >
                  <Text style={[styles.catChipText, newCategory === cat && styles.catChipTextActive]}>
                    {cat.replace('_', ' ').toUpperCase()}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.inputLabel}>Description (optional)</Text>
            <TextInput
              style={[styles.input, { height: 70 }]}
              placeholder="Why this matters to the squad..."
              placeholderTextColor={COLORS.textMuted}
              multiline
              value={newDesc}
              onChangeText={setNewDesc}
            />

            <TouchableOpacity
              style={styles.confirmSupportBtn}
              onPress={handleCreateNeedSubmit}
              activeOpacity={0.88}
            >
              <Text style={styles.confirmSupportBtnText}>Publish Need to Community</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Token Store Modal */}
      <TokenStoreModal
        visible={tokenStoreVisible}
        onClose={() => setTokenStoreVisible(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  heroWrap: {
    height: 190,
    position: 'relative',
  },
  heroImage: {
    ...StyleSheet.absoluteFillObject,
  },
  heroOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(10, 25, 47, 0.65)',
  },
  topNavRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingTop: SPACING.xs,
  },
  topRightBtns: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  circleBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(0,0,0,0.4)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerWalletPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(10, 25, 47, 0.85)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(234, 179, 8, 0.4)',
  },
  headerWalletText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.accentYellow,
  },
  crestWrap: {
    position: 'absolute',
    bottom: -28,
    left: SPACING.md,
    borderRadius: 40,
    borderWidth: 3,
    borderColor: COLORS.background,
    overflow: 'hidden',
    backgroundColor: COLORS.card,
  },
  crest: {
    width: 72,
    height: 72,
  },
  scrollContent: {
    paddingTop: 36,
    paddingHorizontal: SPACING.md,
    paddingBottom: 90,
  },
  identitySection: {
    marginBottom: SPACING.md,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  teamTitle: {
    ...TYPOGRAPHY.h2,
    color: COLORS.textPrimary,
  },
  proTeamPill: {
    backgroundColor: COLORS.accentYellow,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  proTeamPillText: {
    fontSize: 8,
    fontWeight: '800',
    color: '#78350F',
  },
  metaSubtitle: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  captainRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  captainText: {
    ...TYPOGRAPHY.bodySmallBold,
    color: COLORS.textPrimary,
  },
  bioText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textSecondary,
    marginTop: 6,
    lineHeight: 16,
  },
  statsCard: {
    flexDirection: 'row',
    backgroundColor: COLORS.card,
    borderRadius: SPACING.cardRadius,
    paddingVertical: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: SPACING.md,
  },
  statCol: {
    flex: 1,
    alignItems: 'center',
    borderRightWidth: 1,
    borderRightColor: COLORS.border,
  },
  statNumber: {
    ...TYPOGRAPHY.h3,
    color: COLORS.primary,
  },
  statLabel: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textSecondary,
  },
  tabsHeader: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    marginBottom: SPACING.md,
  },
  tabBtn: {
    flex: 1,
    paddingVertical: SPACING.sm,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 4,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabBtnActive: {
    borderBottomColor: COLORS.primary,
  },
  tabText: {
    ...TYPOGRAPHY.bodySmall,
    color: COLORS.textSecondary,
  },
  tabTextActive: {
    color: COLORS.primary,
    fontWeight: '700',
  },
  supportContainer: {
    gap: SPACING.md,
  },
  lockedBankCard: {
    backgroundColor: COLORS.card,
    borderRadius: SPACING.cardRadius,
    padding: SPACING.lg,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(234, 179, 8, 0.4)',
  },
  lockedIconCircle: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(234, 179, 8, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.sm,
  },
  lockedTitle: {
    ...TYPOGRAPHY.h3,
    color: COLORS.textPrimary,
  },
  lockedDesc: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginTop: 6,
    marginBottom: SPACING.md,
    lineHeight: 18,
  },
  lockedUpgradeBtn: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
    borderRadius: SPACING.cardRadius,
  },
  lockedUpgradeBtnText: {
    ...TYPOGRAPHY.bodyBold,
    color: COLORS.textWhite,
  },
  bankBanner: {
    backgroundColor: COLORS.kasiNavy,
    borderRadius: SPACING.cardRadius,
    padding: SPACING.md,
  },
  bankBannerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  bankBannerLabel: {
    fontSize: 9,
    fontWeight: '800',
    color: COLORS.accentYellow,
    letterSpacing: 0.5,
  },
  bankBalanceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 6,
  },
  bankBalanceVal: {
    fontSize: 26,
    fontWeight: '800',
    color: COLORS.textWhite,
  },
  bankBalanceUnit: {
    ...TYPOGRAPHY.caption,
    color: 'rgba(255,255,255,0.7)',
  },
  createNeedBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: COLORS.primary,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  createNeedBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.textWhite,
  },
  bankBannerSub: {
    ...TYPOGRAPHY.caption,
    color: 'rgba(255,255,255,0.6)',
    marginTop: 4,
  },
  needsSection: {
    gap: SPACING.sm,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sectionTitle: {
    ...TYPOGRAPHY.bodyBold,
    color: COLORS.textPrimary,
  },
  needsCountBadge: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textSecondary,
  },
  needCard: {
    backgroundColor: COLORS.card,
    borderRadius: SPACING.cardRadius,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  needHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.xs,
  },
  categoryPill: {
    backgroundColor: 'rgba(2, 132, 199, 0.1)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  categoryPillText: {
    fontSize: 9,
    fontWeight: '800',
    color: COLORS.primary,
  },
  needStatusPill: {
    backgroundColor: 'rgba(255,255,255,0.06)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  needStatusFunded: {
    backgroundColor: 'rgba(5, 150, 105, 0.15)',
  },
  needStatusText: {
    fontSize: 9,
    fontWeight: '700',
    color: COLORS.textSecondary,
  },
  needStatusFundedText: {
    color: '#059669',
  },
  needTitle: {
    ...TYPOGRAPHY.bodyBold,
    color: COLORS.textPrimary,
  },
  needDescription: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  progressWrap: {
    marginTop: SPACING.sm,
  },
  progressBarBg: {
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.background,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: COLORS.accentYellow,
    borderRadius: 4,
  },
  progressNumbersRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  progressTokensText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textSecondary,
  },
  boldTokenNum: {
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  supportersText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textMuted,
  },
  needActionRow: {
    marginTop: SPACING.sm,
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  supportNeedBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: COLORS.primary,
    paddingHorizontal: SPACING.md,
    paddingVertical: 6,
    borderRadius: 8,
  },
  supportNeedBtnText: {
    ...TYPOGRAPHY.bodySmallBold,
    color: COLORS.textWhite,
  },
  fulfilledBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
  },
  fulfilledBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#059669',
  },
  fullyFundedBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  fullyFundedBannerText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#059669',
  },
  timelineSection: {
    marginTop: SPACING.sm,
  },
  timelineList: {
    marginTop: SPACING.sm,
  },
  timelineItem: {
    flexDirection: 'row',
  },
  timelineLeft: {
    alignItems: 'center',
    width: 24,
  },
  timelineDot: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  timelineDotMilestone: {
    backgroundColor: COLORS.accentYellow,
  },
  timelineLine: {
    flex: 1,
    width: 2,
    backgroundColor: COLORS.border,
    marginVertical: 2,
  },
  timelineCard: {
    flex: 1,
    backgroundColor: COLORS.card,
    borderRadius: 8,
    padding: SPACING.sm,
    marginBottom: SPACING.sm,
    marginLeft: SPACING.xs,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  timelineCardMilestone: {
    borderColor: COLORS.accentYellow,
    backgroundColor: 'rgba(234, 179, 8, 0.08)',
  },
  timelineMessage: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textPrimary,
    fontWeight: '600',
  },
  timelineTime: {
    fontSize: 10,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  historyList: {
    gap: SPACING.sm,
  },
  historyCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.card,
    borderRadius: SPACING.cardRadius,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  historyInfo: {
    flex: 1,
  },
  historyTitle: {
    ...TYPOGRAPHY.bodyBold,
    color: COLORS.textPrimary,
  },
  historyDate: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  resultBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    backgroundColor: COLORS.background,
  },
  championBadge: {
    backgroundColor: 'rgba(234, 179, 8, 0.15)',
  },
  finalistBadge: {
    backgroundColor: 'rgba(2, 132, 199, 0.15)',
  },
  resultText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.textSecondary,
  },
  championText: {
    color: COLORS.accentYellow,
  },
  finalistText: {
    color: COLORS.primary,
  },
  squadList: {
    gap: SPACING.sm,
  },
  playerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.card,
    borderRadius: SPACING.cardRadius,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  playerNum: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(2, 132, 199, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.md,
  },
  playerInfo: {
    flex: 1,
  },
  playerName: {
    ...TYPOGRAPHY.bodyBold,
    color: COLORS.textPrimary,
  },
  playerPosition: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textSecondary,
  },
  emptyFixtures: {
    alignItems: 'center',
    paddingVertical: SPACING.xxl,
  },
  emptyFixturesTitle: {
    ...TYPOGRAPHY.h3,
    color: COLORS.textPrimary,
    marginTop: SPACING.sm,
  },
  emptyFixturesSub: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textSecondary,
    marginTop: 4,
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: COLORS.card,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  followBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: COLORS.primary,
    height: 46,
    borderRadius: SPACING.cardRadius,
  },
  followBtnActive: {
    backgroundColor: '#059669',
  },
  followBtnText: {
    ...TYPOGRAPHY.bodyBold,
    color: COLORS.textWhite,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.65)',
    justifyContent: 'flex-end',
  },
  supportSheet: {
    backgroundColor: COLORS.card,
    borderTopLeftRadius: SPACING.cardRadius * 1.5,
    borderTopRightRadius: SPACING.cardRadius * 1.5,
    padding: SPACING.lg,
    paddingBottom: SPACING.xxl,
  },
  createModalCard: {
    backgroundColor: COLORS.card,
    borderTopLeftRadius: SPACING.cardRadius * 1.5,
    borderTopRightRadius: SPACING.cardRadius * 1.5,
    padding: SPACING.lg,
    paddingBottom: SPACING.xxl,
    gap: SPACING.xs,
  },
  sheetTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: SPACING.sm,
  },
  sheetHeaderTitle: {
    ...TYPOGRAPHY.h3,
    color: COLORS.textPrimary,
  },
  sheetHeaderSub: {
    ...TYPOGRAPHY.caption,
    color: COLORS.primary,
    marginTop: 2,
    fontWeight: '700',
  },
  balanceReminderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: COLORS.background,
    padding: SPACING.sm,
    borderRadius: 8,
    marginBottom: SPACING.md,
  },
  balanceReminderText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textSecondary,
  },
  boldText: {
    color: COLORS.textPrimary,
    fontWeight: '700',
  },
  amountPrompt: {
    ...TYPOGRAPHY.bodySmallBold,
    color: COLORS.textPrimary,
    marginBottom: SPACING.xs,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: SPACING.lg,
  },
  tokenChip: {
    backgroundColor: COLORS.background,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  tokenChipActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  tokenChipText: {
    ...TYPOGRAPHY.bodySmallBold,
    color: COLORS.textPrimary,
  },
  tokenChipTextActive: {
    color: COLORS.textWhite,
  },
  confirmSupportBtn: {
    backgroundColor: COLORS.primary,
    borderRadius: SPACING.cardRadius,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmSupportBtnText: {
    ...TYPOGRAPHY.bodyBold,
    color: COLORS.textWhite,
  },
  inputLabel: {
    ...TYPOGRAPHY.caption,
    fontWeight: '700',
    color: COLORS.textSecondary,
    marginTop: SPACING.xs,
  },
  input: {
    backgroundColor: COLORS.background,
    borderRadius: 8,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 8,
    color: COLORS.textPrimary,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  catChip: {
    backgroundColor: COLORS.background,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  catChipActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  catChipText: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.textSecondary,
  },
  catChipTextActive: {
    color: COLORS.textWhite,
  },
});
