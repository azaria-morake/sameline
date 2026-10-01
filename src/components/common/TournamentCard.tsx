import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, TYPOGRAPHY } from '../../constants/theme';
import { NearbyTournamentItem } from '../../hooks/useNearbyTournaments';
import { locationService } from '../../services/location';
import { useRouter } from 'expo-router';

interface TournamentCardProps {
  tournament: NearbyTournamentItem;
  onPress?: () => void;
}

export const TournamentCard: React.FC<TournamentCardProps> = ({
  tournament,
  onPress,
}) => {
  const router = useRouter();

  const handlePress = () => {
    if (onPress) {
      onPress();
    } else {
      router.push(`/tournament/${tournament.id}`);
    }
  };

  const progress = Math.min(
    1,
    tournament.team_count / Math.max(1, tournament.max_teams)
  );

  const formattedDistance = locationService.formatDistance(
    tournament.distance_m || 2300,
    true
  );

  return (
    <TouchableOpacity
      style={[
        styles.card,
        tournament.is_featured && styles.featuredBorder,
      ]}
      onPress={handlePress}
      activeOpacity={0.92}
      accessibilityRole="button"
      accessibilityLabel={`${tournament.title}, ${tournament.location_text}, ${formattedDistance}`}
    >
      <View style={styles.contentRow}>
        {/* Left: Thumbnail */}
        <View style={styles.thumbnailContainer}>
          <Image
            source={{
              uri:
                tournament.banner_image_url ||
                'https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=300',
            }}
            style={styles.thumbnail}
            contentFit="cover"
            transition={300}
          />
        </View>

        {/* Right: Info */}
        <View style={styles.infoCol}>
          <View style={styles.headerRow}>
            {tournament.is_featured ? (
              <View style={styles.boostedPill}>
                <Ionicons name="flash" size={10} color="#78350F" />
                <Text style={styles.boostedText}>Boosted</Text>
              </View>
            ) : (
              <View />
            )}
            <TouchableOpacity hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <Ionicons name="heart-outline" size={18} color={COLORS.textSecondary} />
            </TouchableOpacity>
          </View>

          <Text style={styles.title} numberOfLines={1}>
            {tournament.title}
          </Text>

          {/* Location & Distance */}
          <View style={styles.metaRow}>
            <Ionicons name="location" size={13} color={COLORS.primary} />
            <Text style={styles.metaText} numberOfLines={1}>
              {tournament.location_text} • {formattedDistance}
            </Text>
          </View>

          {/* Date, Fee, Prize */}
          <View style={styles.metaRow}>
            <Ionicons name="calendar-outline" size={13} color={COLORS.textSecondary} />
            <Text style={styles.metaText}>{tournament.start_date}</Text>
          </View>

          <View style={styles.priceRow}>
            <Text style={styles.feeText}>R{tournament.entry_fee}</Text>
            {tournament.prize_pool_text && (
              <Text style={styles.prizeText}>Prize: {tournament.prize_pool_text}</Text>
            )}
          </View>

          {tournament.entry_fee > 0 && (
            <View style={styles.tokenFundablePill}>
              <Ionicons name="sparkles" size={10} color="#78350F" />
              <Text style={styles.tokenFundableText}>Can be funded with tokens</Text>
            </View>
          )}

          {/* Slots Progress Bar */}
          <View style={styles.progressContainer}>
            <View style={styles.progressBarBackground}>
              <View style={[styles.progressBarFill, { width: `${progress * 100}%` }]} />
            </View>
            <Text style={styles.progressText}>
              {tournament.team_count}/{tournament.max_teams} teams
            </Text>
          </View>
        </View>
      </View>

      {/* Organizer Footer Row */}
      <View style={styles.footerRow}>
        <View style={styles.organizerRow}>
          <Image
            source={{
              uri:
                tournament.organizer_avatar ||
                'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100',
            }}
            style={styles.organizerAvatar}
          />
          <Text style={styles.organizerText} numberOfLines={1}>
            Organised by: <Text style={styles.organizerName}>{tournament.organizer_name}</Text>
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.card,
    borderRadius: SPACING.cardRadius,
    padding: SPACING.md,
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  featuredBorder: {
    borderColor: COLORS.accentYellow,
    borderWidth: 1.5,
  },
  contentRow: {
    flexDirection: 'row',
    gap: SPACING.md,
  },
  thumbnailContainer: {
    width: 104,
    height: 120,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: COLORS.cardMuted,
  },
  thumbnail: {
    width: '100%',
    height: '100%',
  },
  infoCol: {
    flex: 1,
    justifyContent: 'space-between',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  boostedPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: COLORS.accentYellow,
    paddingVertical: 2,
    paddingHorizontal: 8,
    borderRadius: SPACING.pillRadius,
  },
  boostedText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#78350F',
    textTransform: 'uppercase',
  },
  title: {
    ...TYPOGRAPHY.bodyBold,
    fontSize: 16,
    color: COLORS.textPrimary,
    marginTop: 2,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 3,
  },
  metaText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textSecondary,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 3,
  },
  feeText: {
    ...TYPOGRAPHY.bodyBold,
    fontSize: 14,
    color: COLORS.textPrimary,
  },
  prizeText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.success,
    fontWeight: '600',
  },
  tokenFundablePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: 'rgba(234, 179, 8, 0.15)',
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderRadius: 4,
    alignSelf: 'flex-start',
    marginTop: 3,
  },
  tokenFundableText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#78350F',
  },
  progressContainer: {
    marginTop: 6,
    gap: 3,
  },
  progressBarBackground: {
    height: 5,
    backgroundColor: COLORS.cardMuted,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: COLORS.primary,
    borderRadius: 3,
  },
  progressText: {
    ...TYPOGRAPHY.micro,
    color: COLORS.textMuted,
    textAlign: 'right',
  },
  footerRow: {
    marginTop: SPACING.sm,
    paddingTop: SPACING.xs,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  organizerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  organizerAvatar: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: COLORS.cardMuted,
  },
  organizerText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textSecondary,
    fontSize: 12,
  },
  organizerName: {
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
});
