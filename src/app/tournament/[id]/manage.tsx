import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, TYPOGRAPHY } from '../../../constants/theme';
import { analytics } from '../../../services/analytics';

interface TeamRequest {
  id: string;
  name: string;
  location: string;
  logo: string;
  timeAgo: string;
  status: 'pending' | 'approved' | 'rejected';
}

const INITIAL_REQUESTS: TeamRequest[] = [
  {
    id: 'req-1',
    name: 'DK XI',
    location: 'Katlehong',
    logo: 'https://images.unsplash.com/photo-1511193311914-0346f16efe90?w=100',
    timeAgo: '2 days ago',
    status: 'pending',
  },
  {
    id: 'req-2',
    name: 'Real Kings',
    location: 'Vosloorus',
    logo: 'https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?w=100',
    timeAgo: '3 days ago',
    status: 'pending',
  },
  {
    id: 'req-3',
    name: 'Young Stars',
    location: 'Thokoza',
    logo: 'https://images.unsplash.com/photo-1579952363873-27f3bade9f55?w=100',
    timeAgo: '3 days ago',
    status: 'pending',
  },
  {
    id: 'req-4',
    name: 'FC Blizzards',
    location: 'Katlehong',
    logo: 'https://images.unsplash.com/photo-1522778119026-d647f0596c20?w=100',
    timeAgo: '4 days ago',
    status: 'pending',
  },
];

export default function ManageTournamentScreen() {
  const router = useRouter();
  const [selectedTab, setSelectedTab] = useState<'requests' | 'fixtures'>('requests');
  const [requests, setRequests] = useState<TeamRequest[]>(INITIAL_REQUESTS);

  // Fixture creation form state
  const [teamA, setTeamA] = useState('DK XI');
  const [teamB, setTeamB] = useState('Real Kings');
  const [round, setRound] = useState('Group Stage');
  const [kickoffTime, setKickoffTime] = useState('15:00');
  const [pitchNumber, setPitchNumber] = useState('1');

  // Interactive Live Scoring
  const [teamAScore, setTeamAScore] = useState(2);
  const [teamBScore, setTeamBScore] = useState(1);

  const pendingRequests = requests.filter((r) => r.status === 'pending');

  const handleApprove = (id: string, name: string) => {
    Alert.alert('Approve Team', `Approve ${name} into the tournament?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Approve',
        onPress: () => {
          setRequests((prev) =>
            prev.map((r) => (r.id === id ? { ...r, status: 'approved' } : r))
          );
          analytics.logEvent('join_approved', { team_id: id });
          Alert.alert('Approved! ⚽', `${name} has been added to the team roster.`);
        },
      },
    ]);
  };

  const handleReject = (id: string, name: string) => {
    setRequests((prev) =>
      prev.map((r) => (r.id === id ? { ...r, status: 'rejected' } : r))
    );
  };

  const handleAddFixture = () => {
    analytics.logEvent('fixture_created', { teamA, teamB, round });
    Alert.alert('Fixture Created', `${teamA} vs ${teamB} (${round}) scheduled for ${kickoffTime}.`);
  };

  const handleSaveScore = () => {
    analytics.logEvent('score_posted', { teamAScore, teamBScore });
    Alert.alert('Score Updated! ⚽', `Live score updated to ${teamAScore} - ${teamBScore}. Viewers will receive real-time updates.`);
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      {/* Top Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <Ionicons name="arrow-back" size={24} color={COLORS.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Manage Tournament</Text>
        <View style={{ width: 24 }} />
      </View>

      {/* Segmented Control */}
      <View style={styles.segmentedContainer}>
        <TouchableOpacity
          style={[styles.segmentBtn, selectedTab === 'requests' && styles.segmentBtnActive]}
          onPress={() => setSelectedTab('requests')}
        >
          <Text
            style={[styles.segmentText, selectedTab === 'requests' && styles.segmentTextActive]}
          >
            Requests ({pendingRequests.length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.segmentBtn, selectedTab === 'fixtures' && styles.segmentBtnActive]}
          onPress={() => setSelectedTab('fixtures')}
        >
          <Text
            style={[styles.segmentText, selectedTab === 'fixtures' && styles.segmentTextActive]}
          >
            Fixtures & Scoring
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {selectedTab === 'requests' && (
          <View style={styles.requestsSection}>
            <Text style={styles.sectionHeader}>Team Requests</Text>

            {pendingRequests.map((req) => (
              <View key={req.id} style={styles.requestCard}>
                <Image source={{ uri: req.logo }} style={styles.teamLogo} />
                <View style={styles.reqInfo}>
                  <Text style={styles.teamName}>{req.name}</Text>
                  <Text style={styles.locationText}>{req.location}</Text>
                </View>

                <View style={styles.actionCol}>
                  <Text style={styles.timeAgo}>{req.timeAgo}</Text>
                  <View style={styles.btnRow}>
                    <TouchableOpacity
                      style={styles.approveBtn}
                      onPress={() => handleApprove(req.id, req.name)}
                    >
                      <Text style={styles.approveText}>Approve</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.rejectBtn}
                      onPress={() => handleReject(req.id, req.name)}
                    >
                      <Text style={styles.rejectText}>Reject</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            ))}

            {pendingRequests.length === 0 && (
              <View style={styles.emptyRequests}>
                <Ionicons name="checkmark-circle-outline" size={48} color={COLORS.success} />
                <Text style={styles.emptyTitle}>All requests managed</Text>
                <Text style={styles.emptySubtitle}>New team join requests will appear here in real time.</Text>
              </View>
            )}
          </View>
        )}

        {selectedTab === 'fixtures' && (
          <View style={styles.fixturesSection}>
            {/* Live Score Stepper Module */}
            <View style={styles.scoreModule}>
              <View style={styles.scoreModuleHeader}>
                <View style={styles.livePulse} />
                <Text style={styles.scoreModuleTitle}>Live Match Score Updater</Text>
              </View>

              <View style={styles.scoreBoardRow}>
                {/* Team A */}
                <View style={styles.scoreTeamCol}>
                  <Text style={styles.scoreTeamName}>DK XI</Text>
                  <View style={styles.stepperWrap}>
                    <TouchableOpacity
                      style={styles.stepperBtn}
                      onPress={() => setTeamAScore((s) => Math.max(0, s - 1))}
                    >
                      <Ionicons name="remove" size={18} color={COLORS.textPrimary} />
                    </TouchableOpacity>
                    <Text style={styles.stepperNum}>{teamAScore}</Text>
                    <TouchableOpacity
                      style={styles.stepperBtn}
                      onPress={() => setTeamAScore((s) => s + 1)}
                    >
                      <Ionicons name="add" size={18} color={COLORS.textPrimary} />
                    </TouchableOpacity>
                  </View>
                </View>

                <Text style={styles.scoreSeparator}>:</Text>

                {/* Team B */}
                <View style={styles.scoreTeamCol}>
                  <Text style={styles.scoreTeamName}>Real Kings</Text>
                  <View style={styles.stepperWrap}>
                    <TouchableOpacity
                      style={styles.stepperBtn}
                      onPress={() => setTeamBScore((s) => Math.max(0, s - 1))}
                    >
                      <Ionicons name="remove" size={18} color={COLORS.textPrimary} />
                    </TouchableOpacity>
                    <Text style={styles.stepperNum}>{teamBScore}</Text>
                    <TouchableOpacity
                      style={styles.stepperBtn}
                      onPress={() => setTeamBScore((s) => s + 1)}
                    >
                      <Ionicons name="add" size={18} color={COLORS.textPrimary} />
                    </TouchableOpacity>
                  </View>
                </View>
              </View>

              <TouchableOpacity style={styles.saveScoreBtn} onPress={handleSaveScore}>
                <Text style={styles.saveScoreText}>Post Live Score</Text>
              </TouchableOpacity>
            </View>

            {/* Create Fixture Form */}
            <Text style={[styles.sectionHeader, { marginTop: SPACING.lg }]}>Create Fixture</Text>
            <View style={styles.fixtureFormCard}>
              <View style={styles.formRow}>
                <View style={styles.formCol}>
                  <Text style={styles.formLabel}>Select Team A</Text>
                  <TextInput
                    style={styles.formInput}
                    value={teamA}
                    onChangeText={setTeamA}
                    placeholder="Team A"
                  />
                </View>

                <View style={styles.formCol}>
                  <Text style={styles.formLabel}>Select Team B</Text>
                  <TextInput
                    style={styles.formInput}
                    value={teamB}
                    onChangeText={setTeamB}
                    placeholder="Team B"
                  />
                </View>
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Round</Text>
                <TextInput
                  style={styles.formInput}
                  value={round}
                  onChangeText={setRound}
                  placeholder="e.g. Quarter Final"
                />
              </View>

              <View style={styles.formRow}>
                <View style={styles.formCol}>
                  <Text style={styles.formLabel}>Kickoff Time</Text>
                  <TextInput
                    style={styles.formInput}
                    value={kickoffTime}
                    onChangeText={setKickoffTime}
                    placeholder="15:00"
                  />
                </View>

                <View style={styles.formCol}>
                  <Text style={styles.formLabel}>Pitch Number</Text>
                  <TextInput
                    style={styles.formInput}
                    value={pitchNumber}
                    onChangeText={setPitchNumber}
                    keyboardType="numeric"
                    placeholder="1"
                  />
                </View>
              </View>

              <TouchableOpacity style={styles.addFixtureBtn} onPress={handleAddFixture}>
                <Ionicons name="add" size={18} color={COLORS.textWhite} />
                <Text style={styles.addFixtureText}>Add Fixture</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    backgroundColor: COLORS.card,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  headerTitle: {
    ...TYPOGRAPHY.h3,
    color: COLORS.textPrimary,
  },
  segmentedContainer: {
    flexDirection: 'row',
    backgroundColor: COLORS.cardMuted,
    marginHorizontal: SPACING.lg,
    marginVertical: SPACING.md,
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
  scrollContent: {
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.xxl,
  },
  requestsSection: {
    gap: SPACING.sm,
  },
  sectionHeader: {
    ...TYPOGRAPHY.captionBold,
    color: COLORS.textSecondary,
    textTransform: 'uppercase',
    marginBottom: SPACING.xs,
  },
  requestCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.card,
    borderRadius: SPACING.cardRadius,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  teamLogo: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.cardMuted,
    marginRight: SPACING.md,
  },
  reqInfo: {
    flex: 1,
  },
  teamName: {
    ...TYPOGRAPHY.bodyBold,
    color: COLORS.textPrimary,
  },
  locationText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textSecondary,
  },
  actionCol: {
    alignItems: 'flex-end',
    gap: 6,
  },
  timeAgo: {
    ...TYPOGRAPHY.micro,
    color: COLORS.textMuted,
  },
  btnRow: {
    flexDirection: 'row',
    gap: 6,
  },
  approveBtn: {
    backgroundColor: COLORS.success,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: SPACING.pillRadius,
  },
  approveText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.textWhite,
  },
  rejectBtn: {
    borderWidth: 1,
    borderColor: COLORS.danger,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: SPACING.pillRadius,
  },
  rejectText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.danger,
  },
  emptyRequests: {
    padding: SPACING.xxl,
    alignItems: 'center',
    justifyContent: 'center',
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
  fixturesSection: {
    gap: SPACING.sm,
  },
  scoreModule: {
    backgroundColor: COLORS.card,
    borderRadius: SPACING.cardRadius,
    padding: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  scoreModuleHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: SPACING.md,
  },
  livePulse: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.danger,
  },
  scoreModuleTitle: {
    ...TYPOGRAPHY.bodyBold,
    color: COLORS.textPrimary,
  },
  scoreBoardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    marginBottom: SPACING.md,
  },
  scoreTeamCol: {
    alignItems: 'center',
    gap: 8,
  },
  scoreTeamName: {
    ...TYPOGRAPHY.bodyBold,
    color: COLORS.textPrimary,
  },
  stepperWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.cardMuted,
    borderRadius: SPACING.pillRadius,
    paddingHorizontal: 8,
    paddingVertical: 4,
    gap: 8,
  },
  stepperBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: COLORS.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepperNum: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.textPrimary,
    minWidth: 20,
    textAlign: 'center',
  },
  scoreSeparator: {
    fontSize: 24,
    fontWeight: '800',
    color: COLORS.textMuted,
  },
  saveScoreBtn: {
    backgroundColor: COLORS.primary,
    height: 44,
    borderRadius: SPACING.buttonRadius,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveScoreText: {
    ...TYPOGRAPHY.captionBold,
    color: COLORS.textWhite,
  },
  fixtureFormCard: {
    backgroundColor: COLORS.card,
    borderRadius: SPACING.cardRadius,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    gap: SPACING.md,
  },
  formRow: {
    flexDirection: 'row',
    gap: SPACING.md,
  },
  formCol: {
    flex: 1,
    gap: 4,
  },
  formGroup: {
    gap: 4,
  },
  formLabel: {
    ...TYPOGRAPHY.micro,
    color: COLORS.textSecondary,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  formInput: {
    backgroundColor: COLORS.cardMuted,
    borderRadius: 8,
    paddingHorizontal: SPACING.md,
    height: 42,
    ...TYPOGRAPHY.body,
    color: COLORS.textPrimary,
  },
  addFixtureBtn: {
    backgroundColor: COLORS.primary,
    height: 46,
    borderRadius: SPACING.buttonRadius,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 4,
  },
  addFixtureText: {
    ...TYPOGRAPHY.bodyBold,
    color: COLORS.textWhite,
  },
});
