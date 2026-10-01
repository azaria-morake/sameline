import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, TYPOGRAPHY } from '../../constants/theme';
import { useRouter } from 'expo-router';

export interface TeamData {
  id: string;
  name: string;
  location_text: string;
  logo_url: string | null;
  stats: {
    played: number;
    wins: number;
    finals: number;
    titles: number;
  };
}

export const TeamCard: React.FC<{ team: TeamData; onPress?: () => void }> = ({
  team,
  onPress,
}) => {
  const router = useRouter();

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={() => (onPress ? onPress() : router.push(`/team/${team.id}`))}
      activeOpacity={0.88}
    >
      <View style={styles.logoContainer}>
        {team.logo_url ? (
          <Image source={{ uri: team.logo_url }} style={styles.logo} contentFit="contain" />
        ) : (
          <View style={styles.logoFallback}>
            <Ionicons name="shield-outline" size={36} color={COLORS.primary} />
          </View>
        )}
      </View>

      <Text style={styles.name} numberOfLines={1}>
        {team.name}
      </Text>
      <Text style={styles.location}>{team.location_text}</Text>

      {/* 4 Stats Grid */}
      <View style={styles.statsRow}>
        <View style={styles.statCol}>
          <Text style={styles.statVal}>{team.stats.played}</Text>
          <Text style={styles.statLbl}>Played</Text>
        </View>
        <View style={styles.statCol}>
          <Text style={styles.statVal}>{team.stats.wins}</Text>
          <Text style={styles.statLbl}>Wins</Text>
        </View>
        <View style={styles.statCol}>
          <Text style={styles.statVal}>{team.stats.finals}</Text>
          <Text style={styles.statLbl}>Finals</Text>
        </View>
        <View style={styles.statCol}>
          <Text style={styles.statVal}>{team.stats.titles}</Text>
          <Text style={styles.statLbl}>Titles</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
};

export const TeamRow: React.FC<{ team: TeamData; onPress?: () => void }> = ({
  team,
  onPress,
}) => {
  const router = useRouter();

  return (
    <TouchableOpacity
      style={styles.row}
      onPress={() => (onPress ? onPress() : router.push(`/team/${team.id}`))}
      activeOpacity={0.8}
    >
      <View style={styles.rowLogoContainer}>
        {team.logo_url ? (
          <Image source={{ uri: team.logo_url }} style={styles.rowLogo} contentFit="contain" />
        ) : (
          <Ionicons name="shield" size={24} color={COLORS.primary} />
        )}
      </View>

      <View style={styles.rowInfo}>
        <Text style={styles.rowName}>{team.name}</Text>
        <Text style={styles.rowLocation}>{team.location_text}</Text>
      </View>

      <Ionicons name="chevron-forward" size={18} color={COLORS.textMuted} />
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    flex: 1,
    backgroundColor: COLORS.card,
    borderRadius: SPACING.cardRadius,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
    margin: SPACING.xs,
  },
  logoContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    marginBottom: SPACING.sm,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logo: {
    width: 60,
    height: 60,
    borderRadius: 30,
  },
  logoFallback: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: COLORS.cardMuted,
    justifyContent: 'center',
    alignItems: 'center',
  },
  name: {
    ...TYPOGRAPHY.bodyBold,
    color: COLORS.textPrimary,
    textAlign: 'center',
  },
  location: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textSecondary,
    marginBottom: SPACING.sm,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    paddingTop: SPACING.xs,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  statCol: {
    alignItems: 'center',
  },
  statVal: {
    ...TYPOGRAPHY.captionBold,
    color: COLORS.textPrimary,
  },
  statLbl: {
    fontSize: 9,
    color: COLORS.textMuted,
    textTransform: 'uppercase',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.md,
    backgroundColor: COLORS.card,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  rowLogoContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.cardMuted,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.md,
  },
  rowLogo: {
    width: 36,
    height: 36,
    borderRadius: 18,
  },
  rowInfo: {
    flex: 1,
  },
  rowName: {
    ...TYPOGRAPHY.bodyBold,
    color: COLORS.textPrimary,
  },
  rowLocation: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textSecondary,
  },
});
