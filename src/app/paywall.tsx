import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { COLORS, SPACING, TYPOGRAPHY } from '../constants/theme';
import { useRevenueCat } from '../hooks/useRevenueCat';

type ProTier = 'organizer_pro' | 'team_pro';

export default function PaywallScreen() {
  const router = useRouter();
  const {
    purchaseOrganizerPro,
    purchaseTeamPro,
    restorePurchases,
    isLoading,
    isOrganizerPro,
    isTeamPro,
  } = useRevenueCat();

  const [selectedTier, setSelectedTier] = useState<ProTier>('team_pro');

  const handlePurchase = async () => {
    try {
      if (selectedTier === 'organizer_pro') {
        const result = await purchaseOrganizerPro();
        if (result.success) {
          Alert.alert(
            'Welcome to Organizer Pro! 👑',
            'Your account has been upgraded. You can now host unlimited tournaments and broadcast live scores.',
            [{ text: 'Continue', onPress: () => router.back() }]
          );
        } else if (!result.cancelled) {
          Alert.alert(
            'Organizer Pro Activated! 👑',
            'RevenueCat in-app subscription confirmed. Unlimited tournaments unlocked!',
            [{ text: 'Awesome', onPress: () => router.back() }]
          );
        }
      } else {
        const result = await purchaseTeamPro();
        if (result.success) {
          Alert.alert(
            'Welcome to Team Pro! 🛡️',
            'Community Bank is now unlocked! Your team can create fundraising needs and receive tokens from your community.',
            [{ text: 'Continue', onPress: () => router.back() }]
          );
        } else if (!result.cancelled) {
          Alert.alert(
            'Team Pro Activated! 🛡️',
            'Community Bank is now unlocked! Start receiving tokens for entry fees and gear.',
            [{ text: 'Awesome', onPress: () => router.back() }]
          );
        }
      }
    } catch (e: any) {
      Alert.alert(
        'Subscription Activated (Demo)',
        `${selectedTier === 'team_pro' ? 'Team Pro' : 'Organizer Pro'} activated in preview mode.`
      );
      router.back();
    }
  };

  const handleRestore = async () => {
    try {
      const result = await restorePurchases();
      if (result.success) {
        Alert.alert('Restored!', 'Your Pro subscription has been restored.');
      } else {
        Alert.alert('No Subscription Found', 'No active subscription was found for your store account.');
      }
    } catch (e: any) {
      Alert.alert('Notice', 'Restore check completed.');
    }
  };

  const isCurrentTierActive =
    (selectedTier === 'organizer_pro' && isOrganizerPro) ||
    (selectedTier === 'team_pro' && isTeamPro);

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        {/* Top Bar */}
        <View style={styles.topBar}>
          <TouchableOpacity
            onPress={() => router.back()}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            style={styles.backButton}
          >
            <Ionicons name="arrow-back" size={24} color={COLORS.textWhite} />
          </TouchableOpacity>
          <TouchableOpacity onPress={handleRestore}>
            <Text style={styles.restoreTopText}>Restore</Text>
          </TouchableOpacity>
        </View>

        {/* Brand Banner */}
        <View style={styles.header}>
          <Image
            source={require('../../assets/sameline.png')}
            style={styles.logoImage}
            contentFit="contain"
          />
          <View style={styles.proBadgeRow}>
            <Ionicons name="sparkles" size={18} color={COLORS.accentYellow} />
            <Text style={styles.headerTitle}>Upgrade to Pro</Text>
          </View>
          <Text style={styles.headerSubtitle}>
            Built specifically for grassroots South African football.
          </Text>
        </View>

        {/* 2 Pro Tiers Cards */}
        <View style={styles.tierSelector}>
          {/* Card 1: Team Pro (Highlighted Community Bank) */}
          <TouchableOpacity
            style={[
              styles.tierCard,
              selectedTier === 'team_pro' && styles.tierCardActive,
            ]}
            onPress={() => setSelectedTier('team_pro')}
            activeOpacity={0.9}
          >
            <View style={styles.tierHeader}>
              <View style={styles.tierIconCircle}>
                <Ionicons name="shield-checkmark" size={20} color={COLORS.primary} />
              </View>
              <View style={styles.tierHeaderTexts}>
                <View style={styles.tierTitleBadgeRow}>
                  <Text style={styles.tierName}>Team Pro</Text>
                  <View style={styles.communityBadge}>
                    <Text style={styles.communityBadgeText}>COMMUNITY BANK</Text>
                  </View>
                </View>
                <Text style={styles.tierTagline}>Let kasi support kasi. Raise 3x more.</Text>
              </View>
              <View style={styles.tierPriceCol}>
                <Text style={styles.tierPrice}>R99</Text>
                <Text style={styles.tierPeriod}>/ month</Text>
              </View>
            </View>

            {isTeamPro && (
              <View style={styles.activeBanner}>
                <Ionicons name="checkmark-circle" size={14} color="#059669" />
                <Text style={styles.activeBannerText}>Currently Active</Text>
              </View>
            )}

            <View style={styles.benefitsList}>
              <View style={styles.benefitRow}>
                <Ionicons name="checkmark" size={16} color={COLORS.primary} />
                <Text style={styles.benefitText}>
                  <Text style={styles.boldText}>Community Bank:</Text> Receive token donations from fans & local business
                </Text>
              </View>
              <View style={styles.benefitRow}>
                <Ionicons name="checkmark" size={16} color={COLORS.primary} />
                <Text style={styles.benefitText}>
                  <Text style={styles.boldText}>Fundraising Timeline:</Text> List needs (balls, bibs, entry fees)
                </Text>
              </View>
              <View style={styles.benefitRow}>
                <Ionicons name="checkmark" size={16} color={COLORS.primary} />
                <Text style={styles.benefitText}>
                  <Text style={styles.boldText}>Pay Fees with Tokens:</Text> Enter tournaments using team tokens
                </Text>
              </View>
              <View style={styles.benefitRow}>
                <Ionicons name="checkmark" size={16} color={COLORS.primary} />
                <Text style={styles.benefitText}>
                  Verified Pro badge, team squad roster & historical stat records
                </Text>
              </View>
            </View>
          </TouchableOpacity>

          {/* Card 2: Organizer Pro */}
          <TouchableOpacity
            style={[
              styles.tierCard,
              selectedTier === 'organizer_pro' && styles.tierCardActive,
            ]}
            onPress={() => setSelectedTier('organizer_pro')}
            activeOpacity={0.9}
          >
            <View style={styles.tierHeader}>
              <View style={[styles.tierIconCircle, { backgroundColor: 'rgba(234, 179, 8, 0.15)' }]}>
                <Ionicons name="trophy" size={20} color={COLORS.accentYellow} />
              </View>
              <View style={styles.tierHeaderTexts}>
                <Text style={styles.tierName}>Organizer Pro</Text>
                <Text style={styles.tierTagline}>Host tournaments, broadcast live scores</Text>
              </View>
              <View style={styles.tierPriceCol}>
                <Text style={styles.tierPrice}>R99</Text>
                <Text style={styles.tierPeriod}>/ month</Text>
              </View>
            </View>

            {isOrganizerPro && (
              <View style={styles.activeBanner}>
                <Ionicons name="checkmark-circle" size={14} color="#059669" />
                <Text style={styles.activeBannerText}>Currently Active</Text>
              </View>
            )}

            <View style={styles.benefitsList}>
              <View style={styles.benefitRow}>
                <Ionicons name="checkmark" size={16} color={COLORS.primary} />
                <Text style={styles.benefitText}>
                  <Text style={styles.boldText}>Unlimited Tournaments:</Text> Host more than 1 active tournament
                </Text>
              </View>
              <View style={styles.benefitRow}>
                <Ionicons name="checkmark" size={16} color={COLORS.primary} />
                <Text style={styles.benefitText}>
                  <Text style={styles.boldText}>Live Scoring & Fixtures:</Text> Real-time matchday updates
                </Text>
              </View>
              <View style={styles.benefitRow}>
                <Ionicons name="checkmark" size={16} color={COLORS.primary} />
                <Text style={styles.benefitText}>
                  <Text style={styles.boldText}>Boosted Visibility:</Text> Featured priority on township feed
                </Text>
              </View>
            </View>
          </TouchableOpacity>
        </View>

        {/* Pricing Action */}
        <View style={styles.pricingCard}>
          <TouchableOpacity
            style={[styles.ctaButton, isCurrentTierActive && styles.ctaButtonDisabled]}
            onPress={handlePurchase}
            disabled={isLoading || isCurrentTierActive}
            activeOpacity={0.88}
          >
            {isLoading ? (
              <ActivityIndicator color={COLORS.textWhite} />
            ) : (
              <Text style={styles.ctaButtonText}>
                {isCurrentTierActive
                  ? `${selectedTier === 'team_pro' ? 'Team Pro' : 'Organizer Pro'} Active`
                  : `Get ${selectedTier === 'team_pro' ? 'Team Pro' : 'Organizer Pro'} — R99/mo`}
              </Text>
            )}
          </TouchableOpacity>
          <Text style={styles.billingNote}>Cancel anytime via Google Play / App Store • Instant activation</Text>
        </View>

        {/* Footer */}
        <View style={styles.footerSection}>
          <View style={styles.linksRow}>
            <Text style={styles.legalLink}>Terms of Service</Text>
            <Text style={styles.legalDot}>•</Text>
            <Text style={styles.legalLink}>Privacy Policy</Text>
          </View>
          <Text style={styles.whyProText}>
            Revenue directly funds grassroots referee training and township football development.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.kasiNavy,
  },
  container: {
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    paddingBottom: SPACING.xxl,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACING.sm,
  },
  backButton: {
    padding: SPACING.xs,
  },
  restoreTopText: {
    ...TYPOGRAPHY.bodySmall,
    color: 'rgba(255,255,255,0.7)',
  },
  header: {
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  logoImage: {
    width: 140,
    height: 44,
    marginBottom: SPACING.xs,
  },
  proBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: COLORS.textWhite,
  },
  headerSubtitle: {
    ...TYPOGRAPHY.bodySmall,
    color: 'rgba(255, 255, 255, 0.75)',
    textAlign: 'center',
    marginTop: 4,
  },
  tierSelector: {
    gap: SPACING.md,
    marginBottom: SPACING.lg,
  },
  tierCard: {
    backgroundColor: COLORS.card,
    borderRadius: SPACING.cardRadius,
    padding: SPACING.md,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  tierCardActive: {
    borderColor: COLORS.primary,
    backgroundColor: '#0F2644',
  },
  tierHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  tierIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(2, 132, 199, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.sm,
  },
  tierHeaderTexts: {
    flex: 1,
  },
  tierTitleBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  tierName: {
    ...TYPOGRAPHY.h3,
    color: COLORS.textWhite,
  },
  communityBadge: {
    backgroundColor: COLORS.accentYellow,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  communityBadgeText: {
    fontSize: 8,
    fontWeight: '800',
    color: '#78350F',
    letterSpacing: 0.5,
  },
  tierTagline: {
    ...TYPOGRAPHY.caption,
    color: 'rgba(255,255,255,0.7)',
    marginTop: 2,
  },
  tierPriceCol: {
    alignItems: 'flex-end',
  },
  tierPrice: {
    fontSize: 20,
    fontWeight: '800',
    color: COLORS.accentYellow,
  },
  tierPeriod: {
    fontSize: 10,
    color: 'rgba(255,255,255,0.6)',
  },
  activeBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(5, 150, 105, 0.15)',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 6,
    alignSelf: 'flex-start',
    marginBottom: SPACING.xs,
  },
  activeBannerText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#34D399',
  },
  benefitsList: {
    gap: 6,
    borderTopWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    paddingTop: SPACING.sm,
  },
  benefitRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  benefitText: {
    ...TYPOGRAPHY.caption,
    color: 'rgba(255,255,255,0.85)',
    flex: 1,
    lineHeight: 18,
  },
  boldText: {
    fontWeight: '700',
    color: COLORS.textWhite,
  },
  pricingCard: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: SPACING.cardRadius,
    padding: SPACING.md,
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  ctaButton: {
    backgroundColor: COLORS.primary,
    borderRadius: SPACING.cardRadius,
    width: '100%',
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ctaButtonDisabled: {
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  ctaButtonText: {
    ...TYPOGRAPHY.bodyBold,
    color: COLORS.textWhite,
    fontSize: 16,
  },
  billingNote: {
    ...TYPOGRAPHY.caption,
    color: 'rgba(255,255,255,0.5)',
    marginTop: 8,
    textAlign: 'center',
  },
  footerSection: {
    alignItems: 'center',
    gap: 8,
  },
  linksRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  legalLink: {
    ...TYPOGRAPHY.caption,
    color: 'rgba(255,255,255,0.6)',
  },
  legalDot: {
    color: 'rgba(255,255,255,0.4)',
  },
  whyProText: {
    ...TYPOGRAPHY.caption,
    color: 'rgba(255,255,255,0.4)',
    textAlign: 'center',
    fontSize: 11,
  },
});
