import React, { useState, useEffect } from 'react';
import {
  View,
  FlatList,
  StyleSheet,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { COLORS, SPACING } from '../../constants/theme';
import { HeaderBar } from '../../components/common/HeaderBar';
import { FilterChips } from '../../components/common/FilterChips';
import { TournamentCard } from '../../components/common/TournamentCard';
import { TournamentCardSkeleton } from '../../components/common/Skeleton';
import { EmptyState } from '../../components/common/EmptyState';
import { FilterModal } from '../../components/common/FilterModal';
import { useNearbyTournaments, NearbyTournamentItem } from '../../hooks/useNearbyTournaments';
import { useLocationStore } from '../../stores/locationStore';
import { analytics } from '../../services/analytics';

export default function FeedScreen() {
  const router = useRouter();
  const { townshipName, setRadiusKm } = useLocationStore();
  const [filterModalVisible, setFilterModalVisible] = useState(false);

  const {
    tournaments,
    isLoading,
    isRefetching,
    refetch,
  } = useNearbyTournaments();

  useEffect(() => {
    analytics.logEvent('feed_viewed', { count: tournaments.length });
  }, [tournaments.length]);

  const handlePostTournament = () => {
    router.push('/(tabs)/create');
  };

  const handleExpandRadius = () => {
    setRadiusKm(50);
    refetch();
  };

  const renderItem = ({ item }: { item: NearbyTournamentItem }) => (
    <TournamentCard tournament={item} />
  );

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      {/* Top Header */}
      <HeaderBar
        townshipName={townshipName}
        notificationCount={3}
        onOpenFilter={() => setFilterModalVisible(true)}
      />

      {/* Filter Chips Bar */}
      <FilterChips />

      {/* Main List */}
      <View style={styles.listContainer}>
        {isLoading ? (
          <View style={styles.skeletonWrap}>
            <TournamentCardSkeleton />
            <TournamentCardSkeleton />
            <TournamentCardSkeleton />
          </View>
        ) : (
          <FlatList
            data={tournaments}
            keyExtractor={(item) => item.id}
            renderItem={renderItem}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={isRefetching}
                onRefresh={refetch}
                tintColor={COLORS.primary}
                colors={[COLORS.primary]}
              />
            }
            ListEmptyComponent={
              <EmptyState
                townshipName={townshipName}
                onPostPress={handlePostTournament}
                onExpandRadiusPress={handleExpandRadius}
              />
            }
            initialNumToRender={6}
            maxToRenderPerBatch={8}
            windowSize={5}
          />
        )}
      </View>

      {/* Filter Bottom Sheet Modal */}
      <FilterModal
        visible={filterModalVisible}
        onClose={() => setFilterModalVisible(false)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.card,
  },
  listContainer: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  listContent: {
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.md,
    paddingBottom: SPACING.xxl,
  },
  skeletonWrap: {
    padding: SPACING.lg,
  },
});
