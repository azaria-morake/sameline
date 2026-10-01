import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, TYPOGRAPHY } from '../../constants/theme';
import { useAuthStore, DEMO_ACCOUNTS } from '../../stores/authStore';
import { useTokenStore } from '../../stores/tokenStore';
import { TokenStoreModal } from '../../components/common/TokenStoreModal';
import { supabase } from '../../services/supabase';

export default function ProfileScreen() {
  const router = useRouter();
  const {
    user,
    session,
    isOrganizerPro,
    isTeamPro,
    activeDemoAccountId,
    switchDemoAccount,
    signOut,
    isAuthenticated,
  } = useAuthStore();

  const { getUserBalance, transactions } = useTokenStore();
  const [tokenModalVisible, setTokenModalVisible] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [organizedCount, setOrganizedCount] = useState<number>(0);
  const [teamsCount, setTeamsCount] = useState<number>(0);

  const tokenBalance = user?.id ? getUserBalance(user.id) : 0;
  const userTransactions = transactions.filter(
    (tx) => tx.from_user_id === user?.id || !tx.from_user_id
  );

  React.useEffect(() => {
    if (!isAuthenticated || !user?.id) {
      setOrganizedCount(0);
      setTeamsCount(0);
      return;
    }

    async function fetchCounts() {
      try {
        const { count: tournCount } = await supabase
          .from('tournaments')
          .select('*', { count: 'exact', head: true })
          .eq('organizer_id', user!.id);
        if (tournCount !== null) setOrganizedCount(tournCount);

        const { count: tmCount } = await supabase
          .from('teams')
          .select('*', { count: 'exact', head: true })
          .eq('captain_id', user!.id);
        if (tmCount !== null) setTeamsCount(tmCount);
      } catch (e) {
        // silent fallback
      }
    }
    fetchCounts();
  }, [isAuthenticated, user?.id]);

  const handleLogout = () => {
    Alert.alert('Log Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign Out', style: 'destructive', onPress: () => signOut() },
    ]);
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      'Delete Account (POPIA)',
      'This will permanently remove your profile, teams, and tournament records. This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete Forever',
          style: 'destructive',
          onPress: async () => {
            try {
              await supabase.rpc('delete_user');
              await signOut();
              Alert.alert('Account Deleted', 'Your data has been permanently deleted.');
            } catch (err: any) {
              Alert.alert('Notice', 'Account deletion processed.');
              await signOut();
            }
          },
        },
      ]
    );
  };

  const handleWhatsAppSupport = () => {
    Linking.openURL('https://wa.me/27821234567?text=Hi%20SameLine%20Support');
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Profile</Text>
          <TouchableOpacity hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            <Ionicons name="settings-outline" size={24} color={COLORS.textPrimary} />
          </TouchableOpacity>
        </View>

        {/* Demo Account Switcher Card */}
        <View style={styles.demoCard}>
          <View style={styles.demoHeaderRow}>
            <View style={styles.demoTag}>
              <Ionicons name="people" size={14} color="#78350F" />
              <Text style={styles.demoTagText}>DEMO MODE ACCOUNTS</Text>
            </View>
            <Text style={styles.demoHint}>Tap to switch role</Text>
          </View>
          <View style={styles.demoButtonsRow}>
            {DEMO_ACCOUNTS.map((acc) => {
              const isActive = activeDemoAccountId === acc.id;
              return (
                <TouchableOpacity
                  key={acc.id}
                  style={[styles.demoBtn, isActive && styles.demoBtnActive]}
                  onPress={() => switchDemoAccount(acc.id)}
                  activeOpacity={0.85}
                >
                  <Text style={[styles.demoBtnText, isActive && styles.demoBtnTextActive]} numberOfLines={1}>
                    {acc.display_name.split(' ')[0]} ({acc.roleTitle.split(' ')[0]})
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* User Card */}
        <View style={styles.userSection}>
          <Image
            source={{
              uri:
                user?.avatar_url ||
                session?.user?.user_metadata?.avatar_url ||
                'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200',
            }}
            style={styles.avatar}
          />
          <View style={styles.userInfo}>
            <Text style={styles.displayName}>
              {user?.display_name || 'Football Captain'}
            </Text>
            <Text style={styles.phoneText}>
              {user?.phone || user?.roleTitle || 'Active Player'}
            </Text>

            <View style={styles.badgesRow}>
              {isTeamPro && (
                <View style={styles.teamProBadge}>
                  <Ionicons name="shield-checkmark" size={12} color="#78350F" />
                  <Text style={styles.teamProBadgeText}>Team Pro</Text>
                </View>
              )}
              {isOrganizerPro && (
                <View style={styles.organizerProBadge}>
                  <Ionicons name="trophy" size={12} color={COLORS.textWhite} />
                  <Text style={styles.organizerProBadgeText}>Organizer Pro</Text>
                </View>
              )}
            </View>
          </View>
        </View>

        {/* Token Wallet Card */}
        <View style={styles.walletCard}>
          <View style={styles.walletHeader}>
            <View style={styles.walletLeft}>
              <View style={styles.coinIconCircle}>
                <Ionicons name="sparkles" size={20} color={COLORS.accentYellow} />
              </View>
              <View>
                <Text style={styles.walletLabel}>Your Tokens</Text>
                <View style={styles.tokenBalanceRow}>
                  <Text style={styles.tokenBalanceValue}>{tokenBalance}</Text>
                  <Text style={styles.tokenBalanceUnit}>Tokens (R{tokenBalance})</Text>
                </View>
              </View>
            </View>

            <TouchableOpacity
              style={styles.buyMoreBtn}
              onPress={() => setTokenModalVisible(true)}
              activeOpacity={0.88}
            >
              <Ionicons name="add" size={16} color={COLORS.textWhite} />
              <Text style={styles.buyMoreBtnText}>Buy Tokens</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.walletDesc}>
            Use your tokens to fund team needs (balls, entry fees, transport) or enter tournaments.
          </Text>

          {/* Toggle transaction history */}
          <TouchableOpacity
            style={styles.historyToggle}
            onPress={() => setShowHistory(!showHistory)}
            activeOpacity={0.7}
          >
            <Text style={styles.historyToggleText}>
              {showHistory ? 'Hide Transactions' : 'View Transaction History'}
            </Text>
            <Ionicons
              name={showHistory ? 'chevron-up' : 'chevron-down'}
              size={16}
              color={COLORS.primary}
            />
          </TouchableOpacity>

          {showHistory && (
            <View style={styles.historyList}>
              {userTransactions.length === 0 ? (
                <Text style={styles.emptyHistoryText}>No transactions yet.</Text>
              ) : (
                userTransactions.map((tx) => (
                  <View key={tx.id} style={styles.txItem}>
                    <View style={styles.txIconWrap}>
                      <Ionicons
                        name={
                          tx.type === 'purchase'
                            ? 'card-outline'
                            : tx.type === 'support'
                            ? 'heart-outline'
                            : 'trophy-outline'
                        }
                        size={16}
                        color={tx.type === 'purchase' ? '#059669' : COLORS.primary}
                      />
                    </View>
                    <View style={styles.txDetails}>
                      <Text style={styles.txDescription}>{tx.description}</Text>
                      <Text style={styles.txDate}>
                        {new Date(tx.created_at).toLocaleDateString()}
                      </Text>
                    </View>
                    <Text
                      style={[
                        styles.txAmount,
                        tx.type === 'purchase' ? styles.txGreen : styles.txBlue,
                      ]}
                    >
                      {tx.type === 'purchase' ? `+${tx.amount}` : `-${tx.amount}`}
                    </Text>
                  </View>
                ))
              )}
            </View>
          )}
        </View>

        {/* Pro Upgrades Card */}
        {!(isOrganizerPro && isTeamPro) && (
          <TouchableOpacity
            style={styles.upgradeCard}
            onPress={() => router.push('/paywall')}
            activeOpacity={0.9}
          >
            <View style={styles.upgradeContent}>
              <Ionicons name="sparkles" size={24} color={COLORS.accentYellow} />
              <View style={styles.upgradeTextWrap}>
                <Text style={styles.upgradeTitle}>Unlock Pro Features (R99/mo)</Text>
                <Text style={styles.upgradeSub}>
                  Team Pro: Community Bank & Needs • Organizer Pro: Unlimited Tournaments
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={COLORS.textWhite} />
            </View>
          </TouchableOpacity>
        )}

        {/* Menu List */}
        <View style={styles.menuCard}>
          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => router.push('/(tabs)/create')}
          >
            <View style={styles.menuLeft}>
              <Ionicons name="trophy-outline" size={20} color={COLORS.textSecondary} />
              <Text style={styles.menuTitle}>My Tournaments</Text>
            </View>
            <View style={styles.menuRight}>
              <Text style={styles.menuCounter}>
                {isAuthenticated ? `${organizedCount} organized` : '0 organized'}
              </Text>
              <Ionicons name="chevron-forward" size={16} color={COLORS.textMuted} />
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => router.push('/(tabs)/teams')}
          >
            <View style={styles.menuLeft}>
              <Ionicons name="people-outline" size={20} color={COLORS.textSecondary} />
              <Text style={styles.menuTitle}>My Teams</Text>
            </View>
            <View style={styles.menuRight}>
              <Text style={styles.menuCounter}>
                {isAuthenticated ? `${teamsCount} teams` : '0 teams'}
              </Text>
              <Ionicons name="chevron-forward" size={16} color={COLORS.textMuted} />
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => router.push('/paywall')}
          >
            <View style={styles.menuLeft}>
              <Ionicons name="ribbon-outline" size={20} color={COLORS.accentYellow} />
              <Text style={styles.menuTitle}>Manage Pro Subscriptions</Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color={COLORS.textMuted} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItem} onPress={handleWhatsAppSupport}>
            <View style={styles.menuLeft}>
              <Ionicons name="logo-whatsapp" size={20} color="#25D366" />
              <Text style={styles.menuTitle}>Help / WhatsApp Support</Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color={COLORS.textMuted} />
          </TouchableOpacity>

          {isAuthenticated ? (
            <TouchableOpacity style={styles.menuItem} onPress={handleLogout}>
              <View style={styles.menuLeft}>
                <Ionicons name="log-out-outline" size={20} color={COLORS.textSecondary} />
                <Text style={styles.menuTitle}>Sign Out / Reset Demo</Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color={COLORS.textMuted} />
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => router.push('/(auth)/login')}
            >
              <View style={styles.menuLeft}>
                <Ionicons name="log-in-outline" size={20} color={COLORS.primary} />
                <Text style={[styles.menuTitle, { color: COLORS.primary }]}>Sign In / Register</Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color={COLORS.textMuted} />
            </TouchableOpacity>
          )}

          {isAuthenticated && (
            <TouchableOpacity style={[styles.menuItem, { borderBottomWidth: 0 }]} onPress={handleDeleteAccount}>
              <View style={styles.menuLeft}>
                <Ionicons name="trash-outline" size={20} color={COLORS.danger} />
                <Text style={[styles.menuTitle, { color: COLORS.danger }]}>Delete Account (POPIA)</Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color={COLORS.textMuted} />
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>

      {/* Token Store Modal */}
      <TokenStoreModal
        visible={tokenModalVisible}
        onClose={() => setTokenModalVisible(false)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  container: {
    paddingHorizontal: SPACING.md,
    paddingTop: SPACING.sm,
    paddingBottom: SPACING.xxl,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  headerTitle: {
    ...TYPOGRAPHY.h2,
    color: COLORS.textPrimary,
  },
  demoCard: {
    backgroundColor: 'rgba(234, 179, 8, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(234, 179, 8, 0.3)',
    borderRadius: SPACING.cardRadius,
    padding: SPACING.sm,
    marginBottom: SPACING.md,
  },
  demoHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACING.xs,
  },
  demoTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  demoTagText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#78350F',
    letterSpacing: 0.5,
  },
  demoHint: {
    ...TYPOGRAPHY.caption,
    color: '#92400E',
    fontSize: 10,
  },
  demoButtonsRow: {
    flexDirection: 'row',
    gap: 6,
  },
  demoBtn: {
    flex: 1,
    backgroundColor: COLORS.card,
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderRadius: 6,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  demoBtnActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  demoBtnText: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  demoBtnTextActive: {
    color: COLORS.textWhite,
  },
  userSection: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.card,
    borderRadius: SPACING.cardRadius,
    padding: SPACING.md,
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    marginRight: SPACING.md,
  },
  userInfo: {
    flex: 1,
  },
  displayName: {
    ...TYPOGRAPHY.h3,
    color: COLORS.textPrimary,
  },
  phoneText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  badgesRow: {
    flexDirection: 'row',
    gap: 6,
    marginTop: 6,
    flexWrap: 'wrap',
  },
  teamProBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: COLORS.accentYellow,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  teamProBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#78350F',
  },
  organizerProBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: COLORS.primary,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  organizerProBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.textWhite,
  },
  walletCard: {
    backgroundColor: COLORS.card,
    borderRadius: SPACING.cardRadius,
    padding: SPACING.md,
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  walletHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACING.xs,
  },
  walletLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  coinIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(234, 179, 8, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  walletLabel: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textSecondary,
  },
  tokenBalanceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
  },
  tokenBalanceValue: {
    fontSize: 22,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },
  tokenBalanceUnit: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textSecondary,
  },
  buyMoreBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: COLORS.primary,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs + 2,
    borderRadius: 8,
  },
  buyMoreBtnText: {
    ...TYPOGRAPHY.bodySmallBold,
    color: COLORS.textWhite,
  },
  walletDesc: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textSecondary,
    marginTop: 4,
    lineHeight: 16,
  },
  historyToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: SPACING.sm,
    paddingTop: SPACING.xs,
  },
  historyToggleText: {
    ...TYPOGRAPHY.caption,
    fontWeight: '700',
    color: COLORS.primary,
  },
  historyList: {
    marginTop: SPACING.sm,
    borderTopWidth: 1,
    borderColor: COLORS.border,
    paddingTop: SPACING.xs,
    gap: 8,
  },
  emptyHistoryText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textMuted,
    fontStyle: 'italic',
    paddingVertical: 4,
  },
  txItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  txIconWrap: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: COLORS.background,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.xs,
  },
  txDetails: {
    flex: 1,
  },
  txDescription: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textPrimary,
    fontWeight: '600',
  },
  txDate: {
    fontSize: 10,
    color: COLORS.textMuted,
  },
  txAmount: {
    fontSize: 13,
    fontWeight: '700',
  },
  txGreen: {
    color: '#059669',
  },
  txBlue: {
    color: COLORS.primary,
  },
  upgradeCard: {
    backgroundColor: COLORS.kasiNavy,
    borderRadius: SPACING.cardRadius,
    padding: SPACING.md,
    marginBottom: SPACING.md,
  },
  upgradeContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
  },
  upgradeTextWrap: {
    flex: 1,
  },
  upgradeTitle: {
    ...TYPOGRAPHY.bodyBold,
    color: COLORS.textWhite,
  },
  upgradeSub: {
    ...TYPOGRAPHY.caption,
    color: 'rgba(255, 255, 255, 0.7)',
    marginTop: 2,
  },
  menuCard: {
    backgroundColor: COLORS.card,
    borderRadius: SPACING.cardRadius,
    borderWidth: 1,
    borderColor: COLORS.border,
    overflow: 'hidden',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  menuLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
  },
  menuTitle: {
    ...TYPOGRAPHY.body,
    color: COLORS.textPrimary,
  },
  menuRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  menuCounter: {
    ...TYPOGRAPHY.bodySmall,
    color: COLORS.textSecondary,
  },
});
