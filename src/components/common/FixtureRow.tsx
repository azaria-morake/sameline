import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, TYPOGRAPHY } from '../../constants/theme';

export interface FixtureData {
  id: string;
  round: string;
  team_a: {
    id?: string;
    name: string;
    logo_url?: string | null;
  };
  team_b: {
    id?: string;
    name: string;
    logo_url?: string | null;
  };
  team_a_score: number | null;
  team_b_score: number | null;
  status: 'scheduled' | 'live' | 'completed';
  kickoff_time?: string | null;
  pitch_number?: number | null;
  match_minute?: string;
}

export const FixtureRow: React.FC<{ fixture: FixtureData }> = ({ fixture }) => {
  const isLive = fixture.status === 'live';
  const isCompleted = fixture.status === 'completed';

  return (
    <View style={styles.container}>
      {/* Header Row: Match metadata / live status */}
      <View style={styles.headerRow}>
        <View style={styles.roundTag}>
          <Text style={styles.roundText}>{fixture.round}</Text>
        </View>

        {isLive && (
          <View style={styles.liveBadge}>
            <View style={styles.livePulse} />
            <Text style={styles.liveText}>Live • {fixture.match_minute || '58\''}</Text>
          </View>
        )}

        {fixture.status === 'scheduled' && fixture.kickoff_time && (
          <Text style={styles.scheduledText}>{fixture.kickoff_time}</Text>
        )}

        {isCompleted && (
          <Text style={styles.completedText}>FT</Text>
        )}
      </View>

      {/* Teams and Score Row */}
      <View style={styles.matchRow}>
        {/* Team A */}
        <View style={styles.teamColLeft}>
          <View style={styles.teamLogoWrap}>
            {fixture.team_a.logo_url ? (
              <Image source={{ uri: fixture.team_a.logo_url }} style={styles.teamLogo} />
            ) : (
              <Ionicons name="shield" size={20} color={COLORS.primary} />
            )}
          </View>
          <Text style={styles.teamNameLeft} numberOfLines={1}>
            {fixture.team_a.name}
          </Text>
        </View>

        {/* Score / VS Center */}
        <View style={styles.centerScoreWrap}>
          {isLive || isCompleted ? (
            <View style={styles.scoreBox}>
              <Text style={styles.scoreText}>{fixture.team_a_score ?? 0}</Text>
              <Text style={styles.scoreDivider}>-</Text>
              <Text style={styles.scoreText}>{fixture.team_b_score ?? 0}</Text>
            </View>
          ) : (
            <View style={styles.vsBox}>
              <Text style={styles.vsText}>VS</Text>
            </View>
          )}
        </View>

        {/* Team B */}
        <View style={styles.teamColRight}>
          <Text style={styles.teamNameRight} numberOfLines={1}>
            {fixture.team_b.name}
          </Text>
          <View style={styles.teamLogoWrap}>
            {fixture.team_b.logo_url ? (
              <Image source={{ uri: fixture.team_b.logo_url }} style={styles.teamLogo} />
            ) : (
              <Ionicons name="shield" size={20} color={COLORS.primary} />
            )}
          </View>
        </View>
      </View>

      {fixture.pitch_number && (
        <Text style={styles.pitchText}>Pitch {fixture.pitch_number}</Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.card,
    borderRadius: SPACING.buttonRadius,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  roundTag: {
    backgroundColor: COLORS.cardMuted,
    paddingVertical: 2,
    paddingHorizontal: 8,
    borderRadius: 4,
  },
  roundText: {
    ...TYPOGRAPHY.micro,
    color: COLORS.textSecondary,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  liveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: COLORS.dangerLight,
    paddingVertical: 2,
    paddingHorizontal: 8,
    borderRadius: SPACING.pillRadius,
  },
  livePulse: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.danger,
  },
  liveText: {
    ...TYPOGRAPHY.micro,
    color: COLORS.danger,
    fontWeight: '700',
  },
  scheduledText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textMuted,
  },
  completedText: {
    ...TYPOGRAPHY.micro,
    color: COLORS.textSecondary,
    fontWeight: '700',
  },
  matchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  teamColLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  teamColRight: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 8,
  },
  teamLogoWrap: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: COLORS.cardMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  teamLogo: {
    width: 24,
    height: 24,
    borderRadius: 12,
  },
  teamNameLeft: {
    ...TYPOGRAPHY.bodyBold,
    color: COLORS.textPrimary,
    flex: 1,
  },
  teamNameRight: {
    ...TYPOGRAPHY.bodyBold,
    color: COLORS.textPrimary,
    textAlign: 'right',
    flex: 1,
  },
  centerScoreWrap: {
    paddingHorizontal: 12,
  },
  scoreBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.cardMuted,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 4,
  },
  scoreText: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },
  scoreDivider: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.textMuted,
  },
  vsBox: {
    backgroundColor: COLORS.cardMuted,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  vsText: {
    ...TYPOGRAPHY.captionBold,
    color: COLORS.textMuted,
  },
  pitchText: {
    ...TYPOGRAPHY.micro,
    color: COLORS.textMuted,
    textAlign: 'center',
    marginTop: 4,
  },
});
