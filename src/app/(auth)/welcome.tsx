import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  StatusBar,
} from 'react-native';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS, SPACING, TYPOGRAPHY } from '../../constants/theme';
import { locationService } from '../../services/location';
import { useLocationStore } from '../../stores/locationStore';
import { useAuthStore } from '../../stores/authStore';
import { analytics } from '../../services/analytics';

export default function WelcomeScreen() {
  const router = useRouter();
  const { setCoords, setTownship, setHasPermission } = useLocationStore();
  const { setIsGuest, isAuthenticated, isLoading } = useAuthStore();

  useEffect(() => {
    analytics.logEvent('welcome_viewed');
    console.log('>>> [WELCOME MOUNTED]');
    if (!isLoading && isAuthenticated) {
      router.replace('/(tabs)');
    }
  }, [isAuthenticated, isLoading, router]);

  const handleFindTournaments = async () => {
    console.log('>>> [WELCOME] handleFindTournaments clicked');
    analytics.logEvent('welcome_find_tapped');
    setIsGuest(true);
    
    try {
      const granted = await locationService.requestPermission();
      setHasPermission(granted);

      if (granted) {
        const coords = await locationService.getCurrentCoords();
        if (coords) {
          setCoords(coords);
          const township = await locationService.reverseGeocodeTownship(coords);
          setTownship(township, coords);
        }
      }
    } catch (e) {
      console.warn('Location error:', e);
    }
    router.replace('/(tabs)');
  };

  const handleRunTournaments = () => {
    console.log('>>> [WELCOME] handleRunTournaments clicked');
    setIsGuest(true);
    router.push({
      pathname: '/(auth)/register',
      params: { role: 'organizer' },
    });
  };

  const handleSkipToFeed = () => {
    console.log('>>> [WELCOME] handleSkipToFeed clicked');
    setIsGuest(true);
    router.replace('/(tabs)');
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      {/* Background Hero Image */}
      <Image
        source={{
          uri: 'https://images.unsplash.com/photo-1517466787929-bc90951d0974?w=800',
        }}
        style={StyleSheet.absoluteFillObject}
        contentFit="cover"
        pointerEvents="none"
      />
      <View style={styles.gradientOverlay} pointerEvents="none" />

      <SafeAreaView style={styles.safeArea}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Header Brand */}
          <View style={styles.brandRow}>
            <Image
              source={require('../../../assets/sameline.png')}
              style={styles.logoImage}
              contentFit="contain"
            />
          </View>

          {/* Headline */}
          <View style={styles.headlineWrap}>
            <Text style={styles.headline}>Where Kasi Football Lives</Text>
          </View>

          {/* 3 Value Propositions */}
          <View style={styles.cardList}>
            <View style={styles.propCard}>
              <View style={[styles.iconCircle, { backgroundColor: '#0284C7' }]}>
                <Ionicons name="flash" size={20} color={COLORS.textWhite} />
              </View>
              <View style={styles.propTextWrap}>
                <Text style={styles.propTitle}>Post in 30s</Text>
                <Text style={styles.propSubtitle}>Get your tournament online in less than a minute.</Text>
              </View>
            </View>

            <View style={styles.propCard}>
              <View style={[styles.iconCircle, { backgroundColor: '#0284C7' }]}>
                <Ionicons name="location" size={20} color={COLORS.textWhite} />
              </View>
              <View style={styles.propTextWrap}>
                <Text style={styles.propTitle}>Find games nearby</Text>
                <Text style={styles.propSubtitle}>Discover tournaments in your area — within 20km.</Text>
              </View>
            </View>

            <View style={styles.propCard}>
              <View style={[styles.iconCircle, { backgroundColor: '#0284C7' }]}>
                <Ionicons name="trophy" size={20} color={COLORS.textWhite} />
              </View>
              <View style={styles.propTextWrap}>
                <Text style={styles.propTitle}>Build your rep</Text>
                <Text style={styles.propSubtitle}>Play. Compete. Get recognised in your community.</Text>
              </View>
            </View>
          </View>

          {/* Location Primer Pill */}
          <View style={styles.locationPrimer}>
            <Ionicons name="location-outline" size={16} color={COLORS.accentYellow} />
            <Text style={styles.primerText}>
              We use your location to show games in Katlehong, Vosloorus, etc. — within 20km.
            </Text>
          </View>

          {/* CTA Buttons */}
          <View style={styles.buttonStack}>
            <Pressable
              style={({ pressed }) => [
                styles.primaryButton,
                pressed && { opacity: 0.8 },
              ]}
              onPress={handleFindTournaments}
            >
              <Text style={styles.primaryButtonText}>Find Tournaments Near Me</Text>
            </Pressable>

            <Pressable
              style={({ pressed }) => [
                styles.secondaryButton,
                pressed && { opacity: 0.8 },
              ]}
              onPress={handleRunTournaments}
            >
              <Text style={styles.secondaryButtonText}>I Run Tournaments</Text>
            </Pressable>

            <Pressable
              style={({ pressed }) => [
                styles.skipButton,
                pressed && { opacity: 0.6 },
              ]}
              onPress={handleSkipToFeed}
            >
              <Text style={styles.skipButtonText}>Skip to Feed</Text>
            </Pressable>

            <View style={styles.loginRow}>
              <Text style={styles.loginText}>Already registered? </Text>
              <Pressable
                onPress={() => {
                  console.log('>>> [WELCOME] Sign In clicked');
                  router.push('/(auth)/login');
                }}
              >
                <Text style={styles.loginLink}>Sign In</Text>
              </Pressable>
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.kasiNavy,
  },
  gradientOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(10, 25, 47, 0.88)',
  },
  safeArea: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: SPACING.xl,
    paddingTop: SPACING.md,
    paddingBottom: SPACING.xxl,
    flexGrow: 1,
  },
  brandRow: {
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  logoImage: {
    width: 170,
    height: 54,
  },
  headlineWrap: {
    marginBottom: SPACING.lg,
  },
  headline: {
    fontSize: 32,
    fontWeight: '800',
    color: COLORS.textWhite,
    textAlign: 'center',
    lineHeight: 38,
  },
  cardList: {
    gap: SPACING.sm,
    marginBottom: SPACING.lg,
  },
  propCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: SPACING.cardRadius,
    padding: SPACING.md,
    gap: SPACING.md,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  propTextWrap: {
    flex: 1,
  },
  propTitle: {
    ...TYPOGRAPHY.bodyBold,
    color: COLORS.textWhite,
    fontSize: 16,
  },
  propSubtitle: {
    ...TYPOGRAPHY.caption,
    color: 'rgba(255, 255, 255, 0.75)',
    marginTop: 2,
  },
  locationPrimer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(255, 214, 10, 0.12)',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: SPACING.buttonRadius,
    borderWidth: 1,
    borderColor: 'rgba(255, 214, 10, 0.3)',
    marginBottom: SPACING.lg,
  },
  primerText: {
    ...TYPOGRAPHY.caption,
    color: '#FEF08A',
    flex: 1,
    lineHeight: 18,
  },
  buttonStack: {
    gap: SPACING.sm,
    marginTop: SPACING.md,
  },
  primaryButton: {
    height: 52,
    backgroundColor: COLORS.primary,
    borderRadius: SPACING.buttonRadius,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButtonText: {
    ...TYPOGRAPHY.bodyBold,
    color: COLORS.textWhite,
    fontSize: 16,
  },
  secondaryButton: {
    height: 52,
    backgroundColor: 'transparent',
    borderRadius: SPACING.buttonRadius,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.4)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryButtonText: {
    ...TYPOGRAPHY.bodyBold,
    color: COLORS.textWhite,
    fontSize: 16,
  },
  skipButton: {
    alignItems: 'center',
    paddingVertical: 6,
  },
  skipButtonText: {
    ...TYPOGRAPHY.captionBold,
    color: 'rgba(255, 255, 255, 0.6)',
  },
  loginRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: SPACING.xs,
  },
  loginText: {
    ...TYPOGRAPHY.caption,
    color: 'rgba(255, 255, 255, 0.7)',
  },
  loginLink: {
    ...TYPOGRAPHY.captionBold,
    color: COLORS.accentYellow,
  },
});
