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
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Image } from 'expo-image';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS, SPACING, TYPOGRAPHY } from '../../constants/theme';
import { supabase, signInWithGoogle } from '../../services/supabase';
import { useAuthStore } from '../../stores/authStore';
import { revenueCat } from '../../services/revenuecat';

export default function RegisterScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { setUser, setSession, syncUserProfile, isAuthenticated } = useAuthStore();

  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  React.useEffect(() => {
    if (isAuthenticated) {
      router.replace('/(tabs)');
    }
  }, [isAuthenticated, router]);

  const handleGoogleSignup = async () => {
    try {
      setIsGoogleLoading(true);
      const session = await signInWithGoogle();
      if (session?.user) {
        setSession(session);
        await syncUserProfile(session.user);
        await revenueCat.logIn(session.user.id);
        router.replace('/(tabs)');
      }
    } catch (err: any) {
      if (err?.message?.includes('cancel') || err?.message?.includes('dismiss')) return;
      Alert.alert('Google Sign-In Error', err.message || 'Could not complete Google Sign-In.');
    } finally {
      setIsGoogleLoading(false);
    }
  };

  const handleRegister = async () => {
    if (!displayName || !email || !password) {
      Alert.alert('Required Fields', 'Please fill in display name, email, and password.');
      return;
    }

    if (password.length < 6) {
      Alert.alert('Weak Password', 'Password must be at least 6 characters.');
      return;
    }

    try {
      setIsLoading(true);
      const formattedPhone = phone ? (phone.startsWith('+27') ? phone : `+27${phone.replace(/^0/, '')}`) : null;

      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          data: {
            display_name: displayName.trim(),
            phone: formattedPhone,
          },
        },
      });

      if (error) {
        Alert.alert('Registration Failed', error.message);
        return;
      }

      if (data.user) {
        // Upsert users table record
        const userProfile = {
          id: data.user.id,
          display_name: displayName.trim(),
          phone: formattedPhone,
          is_organizer_pro: false,
          created_at: new Date().toISOString(),
        };

        await supabase.from('users').upsert(userProfile);
        setUser(userProfile as any);
        if (data.session) setSession(data.session);

        // Immediate RevenueCat user link
        await revenueCat.logIn(data.user.id);

        if (params.role === 'organizer') {
          router.replace('/(tabs)/create');
        } else {
          router.replace('/(tabs)');
        }
      }
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Registration failed.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
          {/* Top Bar with Back Arrow */}
          <View style={styles.topBar}>
            <TouchableOpacity onPress={() => router.back()} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <Ionicons name="arrow-back" size={24} color={COLORS.textPrimary} />
            </TouchableOpacity>
          </View>

          {/* Logo Header */}
          <View style={styles.logoRow}>
            <Image
              source={require('../../../assets/sameline.png')}
              style={styles.logoImage}
              contentFit="contain"
            />
          </View>

          <View style={styles.titleSection}>
            <Text style={styles.title}>Create Your Account</Text>
            <Text style={styles.subtitle}>Join the Kasi football community</Text>
          </View>

          {/* Form */}
          <View style={styles.form}>
            {/* Display Name */}
            <View style={styles.inputWrapper}>
              <Ionicons name="person-outline" size={20} color={COLORS.textSecondary} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Display name"
                placeholderTextColor={COLORS.textMuted}
                value={displayName}
                onChangeText={setDisplayName}
              />
            </View>

            {/* Email Field */}
            <View style={styles.inputWrapper}>
              <Ionicons name="mail-outline" size={20} color={COLORS.textSecondary} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Email address"
                placeholderTextColor={COLORS.textMuted}
                keyboardType="email-address"
                autoCapitalize="none"
                value={email}
                onChangeText={setEmail}
              />
            </View>

            {/* Phone Number Field with +27 */}
            <View style={styles.phoneWrapper}>
              <View style={styles.countryCodeWrap}>
                <Ionicons name="call-outline" size={18} color={COLORS.textSecondary} />
                <Text style={styles.countryCodeText}>+27</Text>
                <Ionicons name="chevron-down" size={14} color={COLORS.textSecondary} />
              </View>
              <TextInput
                style={styles.phoneInput}
                placeholder="Phone number (optional)"
                placeholderTextColor={COLORS.textMuted}
                keyboardType="phone-pad"
                value={phone}
                onChangeText={setPhone}
              />
            </View>

            {/* Password Field */}
            <View style={styles.inputWrapper}>
              <Ionicons name="lock-closed-outline" size={20} color={COLORS.textSecondary} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Password"
                placeholderTextColor={COLORS.textMuted}
                secureTextEntry={!showPassword}
                value={password}
                onChangeText={setPassword}
              />
              <TouchableOpacity
                onPress={() => setShowPassword(!showPassword)}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Ionicons
                  name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                  size={20}
                  color={COLORS.textSecondary}
                />
              </TouchableOpacity>
            </View>

            {/* Submit Button */}
            <TouchableOpacity
              style={styles.registerButton}
              onPress={handleRegister}
              disabled={isLoading}
              activeOpacity={0.88}
            >
              {isLoading ? (
                <ActivityIndicator color={COLORS.textWhite} />
              ) : (
                <Text style={styles.registerButtonText}>Register</Text>
              )}
            </TouchableOpacity>

            {/* Divider */}
            <View style={styles.dividerRow}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>or continue with</Text>
              <View style={styles.dividerLine} />
            </View>

            {/* Social Logins */}
            <View style={styles.socialRow}>
              <TouchableOpacity
                style={styles.socialButton}
                activeOpacity={0.8}
                onPress={handleGoogleSignup}
                disabled={isGoogleLoading}
              >
                {isGoogleLoading ? (
                  <ActivityIndicator size="small" color="#EA4335" />
                ) : (
                  <>
                    <Ionicons name="logo-google" size={18} color="#EA4335" />
                    <Text style={styles.socialText}>Google</Text>
                  </>
                )}
              </TouchableOpacity>
              <TouchableOpacity style={styles.socialButton} activeOpacity={0.8}>
                <Ionicons name="logo-apple" size={18} color={COLORS.textPrimary} />
                <Text style={styles.socialText}>Apple</Text>
              </TouchableOpacity>
            </View>

            {/* Login Link */}
            <View style={styles.footerRow}>
              <Text style={styles.footerText}>Already have an account? </Text>
              <TouchableOpacity onPress={() => router.push('/(auth)/login')}>
                <Text style={styles.loginLink}>Log in</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Social Proof Badge */}
          <View style={styles.socialProofCard}>
            <Ionicons name="people" size={24} color={COLORS.primary} />
            <View style={styles.socialProofTextWrap}>
              <Text style={styles.socialProofTitle}>Join 200+ teams in Ekurhuleni</Text>
              <Text style={styles.socialProofSub}>Real people. Real football. Real Kasi.</Text>
            </View>
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
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.md,
    justifyContent: 'space-between',
    minHeight: '100%',
  },
  topBar: {
    height: 40,
    justifyContent: 'center',
  },
  logoRow: {
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  logoImage: {
    width: 150,
    height: 48,
  },
  titleSection: {
    marginBottom: SPACING.xl,
  },
  title: {
    ...TYPOGRAPHY.h1,
    color: COLORS.textPrimary,
  },
  subtitle: {
    ...TYPOGRAPHY.body,
    color: COLORS.textSecondary,
    marginTop: 4,
  },
  form: {
    gap: SPACING.md,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.card,
    borderRadius: SPACING.buttonRadius,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: SPACING.md,
    height: 52,
  },
  inputIcon: {
    marginRight: SPACING.sm,
  },
  input: {
    flex: 1,
    ...TYPOGRAPHY.body,
    color: COLORS.textPrimary,
  },
  phoneWrapper: {
    flexDirection: 'row',
    backgroundColor: COLORS.card,
    borderRadius: SPACING.buttonRadius,
    borderWidth: 1,
    borderColor: COLORS.border,
    height: 52,
    alignItems: 'center',
  },
  countryCodeWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    borderRightWidth: 1,
    borderRightColor: COLORS.border,
    height: '100%',
  },
  countryCodeText: {
    ...TYPOGRAPHY.bodyBold,
    color: COLORS.textPrimary,
  },
  phoneInput: {
    flex: 1,
    paddingHorizontal: SPACING.md,
    ...TYPOGRAPHY.body,
    color: COLORS.textPrimary,
  },
  registerButton: {
    height: 52,
    backgroundColor: COLORS.primary,
    borderRadius: SPACING.buttonRadius,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: SPACING.sm,
  },
  registerButtonText: {
    ...TYPOGRAPHY.bodyBold,
    color: COLORS.textWhite,
    fontSize: 16,
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: SPACING.md,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: COLORS.border,
  },
  dividerText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textMuted,
    marginHorizontal: SPACING.md,
  },
  socialRow: {
    flexDirection: 'row',
    gap: SPACING.md,
  },
  socialButton: {
    flex: 1,
    height: 48,
    borderRadius: SPACING.buttonRadius,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.card,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  socialText: {
    ...TYPOGRAPHY.bodyBold,
    fontSize: 14,
    color: COLORS.textPrimary,
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: SPACING.sm,
  },
  footerText: {
    ...TYPOGRAPHY.body,
    color: COLORS.textSecondary,
  },
  loginLink: {
    ...TYPOGRAPHY.bodyBold,
    color: COLORS.primary,
  },
  socialProofCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    backgroundColor: COLORS.cardMuted,
    borderRadius: SPACING.cardRadius,
    padding: SPACING.md,
    marginTop: SPACING.xl,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  socialProofTextWrap: {
    flex: 1,
  },
  socialProofTitle: {
    ...TYPOGRAPHY.captionBold,
    color: COLORS.textPrimary,
  },
  socialProofSub: {
    ...TYPOGRAPHY.micro,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
});
