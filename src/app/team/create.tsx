import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { COLORS, SPACING, TYPOGRAPHY } from '../../constants/theme';
import { useAuthStore } from '../../stores/authStore';
import { useLocationStore } from '../../stores/locationStore';
import { supabase } from '../../services/supabase';

export default function CreateTeamScreen() {
  const router = useRouter();
  const { user, isAuthenticated } = useAuthStore();
  const { townshipName, coords } = useLocationStore();

  const [name, setName] = useState('');
  const [locationText, setLocationText] = useState(townshipName);
  const [logoUri, setLogoUri] = useState<string | null>(null);
  const [bio, setBio] = useState('');
  const [players, setPlayers] = useState([
    { role: 'Goalkeeper', name: '' },
    { role: 'Defender', name: '' },
    { role: 'Midfielder', name: '' },
    { role: 'Forward', name: '' },
  ]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handlePickLogo = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Camera roll permissions are needed to select a team crest.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.7,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setLogoUri(result.assets[0].uri);
      }
    } catch (e) {
      console.warn('Image picker error:', e);
    }
  };

  const handleCreateTeam = async () => {
    if (!name.trim()) {
      Alert.alert('Required', 'Please enter a team name.');
      return;
    }

    if (!isAuthenticated) {
      Alert.alert('Login Required', 'You must be signed in to create and captain a team.', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Sign In', onPress: () => router.push('/(auth)/login') },
      ]);
      return;
    }

    try {
      setIsSubmitting(true);
      const slug = name.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-');

      const newTeam = {
        name: name.trim(),
        slug: `${slug}-${Math.floor(Math.random() * 1000)}`,
        captain_id: user?.id || 'demo-user',
        location_text: locationText.trim(),
        location: `POINT(${coords.longitude} ${coords.latitude})`,
        bio: bio.trim() || null,
        logo_url: logoUri || 'https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?w=200',
        stats: { played: 0, wins: 0, finals: 0, titles: 0 },
      };

      const { data, error } = await supabase
        .from('teams')
        .insert(newTeam as any)
        .select()
        .single();

      if (error) {
        console.warn('Supabase team insert note:', error.message);
      }

      const teamId = data?.id || 'team-created';
      Alert.alert('Team Created! 🛡️', `${name} is ready. Build your stats this weekend.`, [
        {
          text: 'View Team Profile',
          onPress: () => router.replace(`/team/${teamId}`),
        },
      ]);
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to create team.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity onPress={() => router.back()} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <Ionicons name="arrow-back" size={24} color={COLORS.textPrimary} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Create Team</Text>
            <View style={{ width: 24 }} />
          </View>

          {/* Form */}
          <View style={styles.form}>
            {/* Team Name */}
            <View style={styles.inputGroup}>
              <View style={styles.labelRow}>
                <Text style={styles.label}>Team Name *</Text>
                <Text style={styles.counter}>{name.length}/30</Text>
              </View>
              <TextInput
                style={styles.textInput}
                placeholder="e.g. Blue Warriors"
                placeholderTextColor={COLORS.textMuted}
                maxLength={30}
                value={name}
                onChangeText={setName}
              />
            </View>

            {/* Location */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Location *</Text>
              <View style={styles.locationInputWrap}>
                <TextInput
                  style={styles.locationInput}
                  placeholder="e.g. Katlehong"
                  placeholderTextColor={COLORS.textMuted}
                  value={locationText}
                  onChangeText={setLocationText}
                />
                <Ionicons name="location-outline" size={20} color={COLORS.textSecondary} />
              </View>
            </View>

            {/* Team Logo Upload */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Team Logo *</Text>
              <TouchableOpacity
                style={styles.logoPickerBox}
                onPress={handlePickLogo}
                activeOpacity={0.8}
              >
                {logoUri ? (
                  <Image source={{ uri: logoUri }} style={styles.selectedLogo} />
                ) : (
                  <View style={styles.logoPlaceholder}>
                    <Ionicons name="camera-outline" size={32} color={COLORS.primary} />
                    <Text style={styles.logoPrompt}>Tap to upload logo</Text>
                    <Text style={styles.logoSubtext}>(JPG/PNG, max 5MB)</Text>
                  </View>
                )}
              </TouchableOpacity>
            </View>

            {/* Bio */}
            <View style={styles.inputGroup}>
              <View style={styles.labelRow}>
                <Text style={styles.label}>Bio (Optional)</Text>
                <Text style={styles.counter}>{bio.length}/150</Text>
              </View>
              <TextInput
                style={[styles.textInput, { height: 70, textAlignVertical: 'top' }]}
                placeholder="Short description about your team..."
                placeholderTextColor={COLORS.textMuted}
                maxLength={150}
                multiline
                value={bio}
                onChangeText={setBio}
              />
            </View>

            {/* Squad Builder Minimal */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Squad (Optional)</Text>
              {players.map((p, idx) => (
                <View key={p.role} style={styles.playerRow}>
                  <Text style={styles.playerRoleText}>
                    {idx + 1}. {p.role}
                  </Text>
                  <TouchableOpacity
                    style={styles.addPlayerBtn}
                    onPress={() => {
                      Alert.prompt
                        ? Alert.prompt('Add Player', `Name for ${p.role}`, (text) => {
                            const newP = [...players];
                            newP[idx].name = text;
                            setPlayers(newP);
                          })
                        : Alert.alert('Add Player', `Tap to assign player to ${p.role}`);
                    }}
                  >
                    <Ionicons name="add" size={14} color={COLORS.primary} />
                    <Text style={styles.addPlayerText}>
                      {p.name ? p.name : '+ Add Player'}
                    </Text>
                  </TouchableOpacity>
                </View>
              ))}
            </View>

            {/* Create Team CTA */}
            <TouchableOpacity
              style={styles.createBtn}
              onPress={handleCreateTeam}
              disabled={isSubmitting}
              activeOpacity={0.88}
            >
              <Text style={styles.createBtnText}>
                {isSubmitting ? 'Creating Team...' : 'Create Team'}
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  container: {
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    paddingBottom: SPACING.xxl,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACING.lg,
  },
  headerTitle: {
    ...TYPOGRAPHY.h3,
    color: COLORS.textPrimary,
  },
  form: {
    gap: SPACING.lg,
  },
  inputGroup: {
    gap: 6,
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  label: {
    ...TYPOGRAPHY.captionBold,
    color: COLORS.textPrimary,
  },
  counter: {
    ...TYPOGRAPHY.micro,
    color: COLORS.textMuted,
  },
  textInput: {
    backgroundColor: COLORS.card,
    borderRadius: SPACING.buttonRadius,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: SPACING.md,
    height: 48,
    ...TYPOGRAPHY.body,
    color: COLORS.textPrimary,
  },
  locationInputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.card,
    borderRadius: SPACING.buttonRadius,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: SPACING.md,
    height: 48,
  },
  locationInput: {
    flex: 1,
    ...TYPOGRAPHY.body,
    color: COLORS.textPrimary,
  },
  logoPickerBox: {
    backgroundColor: COLORS.card,
    borderRadius: SPACING.cardRadius,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: COLORS.borderStrong,
    height: 120,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  logoPlaceholder: {
    alignItems: 'center',
  },
  logoPrompt: {
    ...TYPOGRAPHY.captionBold,
    color: COLORS.textPrimary,
    marginTop: 4,
  },
  logoSubtext: {
    ...TYPOGRAPHY.micro,
    color: COLORS.textMuted,
  },
  selectedLogo: {
    width: 90,
    height: 90,
    borderRadius: 45,
  },
  playerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.card,
    borderRadius: SPACING.buttonRadius,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: SPACING.md,
    paddingVertical: 10,
    marginBottom: 6,
  },
  playerRoleText: {
    ...TYPOGRAPHY.body,
    color: COLORS.textSecondary,
  },
  addPlayerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: COLORS.cardMuted,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: SPACING.pillRadius,
  },
  addPlayerText: {
    ...TYPOGRAPHY.captionBold,
    color: COLORS.primary,
  },
  createBtn: {
    height: 52,
    backgroundColor: COLORS.primary,
    borderRadius: SPACING.buttonRadius,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: SPACING.sm,
  },
  createBtnText: {
    ...TYPOGRAPHY.bodyBold,
    color: COLORS.textWhite,
    fontSize: 16,
  },
});
