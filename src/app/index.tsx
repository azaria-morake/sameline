import React from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { Redirect, useRootNavigationState } from 'expo-router';
import { useAuthStore } from '../stores/authStore';
import { COLORS } from '../constants/theme';

export default function IndexDispatcher() {
  const rootNavigationState = useRootNavigationState();
  const { isAuthenticated, isGuest, isLoading } = useAuthStore();

  if (!rootNavigationState?.key || isLoading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  if (isAuthenticated || isGuest) {
    return <Redirect href="/(tabs)" />;
  }

  return <Redirect href="/(auth)/welcome" />;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.kasiNavy,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
