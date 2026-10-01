import React from 'react';
import { View, StyleSheet } from 'react-native';
import { COLORS, SPACING } from '../../constants/theme';

export const TournamentCardSkeleton: React.FC = () => {
  return (
    <View style={styles.card}>
      <View style={styles.row}>
        {/* Thumbnail box */}
        <View style={styles.thumbSkeleton} />

        <View style={styles.infoCol}>
          <View style={[styles.shimmerLine, { width: '40%', height: 16 }]} />
          <View style={[styles.shimmerLine, { width: '85%', height: 18, marginTop: 8 }]} />
          <View style={[styles.shimmerLine, { width: '60%', height: 14, marginTop: 8 }]} />
          <View style={[styles.shimmerLine, { width: '50%', height: 14, marginTop: 8 }]} />
          <View style={[styles.shimmerLine, { width: '100%', height: 8, marginTop: 12 }]} />
        </View>
      </View>
    </View>
  );
};

export const EmptyFeedState: React.FC<{
  townshipName: string;
  onPostTournament: () => void;
  onExpandRadius: () => void;
}> = ({ townshipName, onPostTournament, onExpandRadius }) => {
  return (
    <View style={styles.emptyContainer}>
      <View style={styles.emptyIconCircle}>
        <View style={styles.innerBall} />
      </View>
      <View style={styles.textWrap}>
        <View style={styles.emptyTitle}>
          {/* Main message */}
        </View>
      </View>
    </View>
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
  },
  row: {
    flexDirection: 'row',
    gap: SPACING.md,
  },
  thumbSkeleton: {
    width: 104,
    height: 120,
    borderRadius: 12,
    backgroundColor: COLORS.cardMuted,
  },
  infoCol: {
    flex: 1,
  },
  shimmerLine: {
    backgroundColor: COLORS.cardMuted,
    borderRadius: 4,
  },
  emptyContainer: {
    padding: SPACING.xxl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: COLORS.cardMuted,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.md,
  },
  innerBall: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.borderStrong,
  },
  textWrap: {
    alignItems: 'center',
  },
  emptyTitle: {
    height: 20,
  },
});
