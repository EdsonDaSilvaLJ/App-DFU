import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { auth } from '../config/firebase';
import { signOut } from 'firebase/auth';
import { useUserSync } from '../hooks/useUserSync';
import { PrimaryButton, SecondaryButton } from '../components/Buttons';
import { COLORS, SPACING } from '../constants/Colors';

export default function SyncError() {
  const router = useRouter();
  const { recheckSync } = useUserSync();

  const handleRetry = async () => {
    try {
      await recheckSync();
    } catch (error) {
      console.error('Erro ao tentar novamente:', error);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      router.replace('/login');
    } catch (error) {
      console.error('Erro no logout:', error);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.icon}>⚠️</Text>
        <Text style={styles.title}>Erro de Sincronização</Text>
        <Text style={styles.message}>
          Não foi possível verificar seus dados. Verifique sua conexão e tente novamente.
        </Text>

        <PrimaryButton
          title="Tentar Novamente"
          onPress={handleRetry}
          style={styles.retryButton}
        />

        <SecondaryButton
          title="Fazer Logout"
          onPress={handleLogout}
          style={styles.logoutButton}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.xl,
  },
  content: {
    alignItems: 'center',
    maxWidth: 300,
  },
  icon: {
    fontSize: 64,
    marginBottom: SPACING.lg,
  },
  title: {
    fontSize: 24,
    fontWeight: '600',
    color: COLORS.text.primary,
    marginBottom: SPACING.md,
    textAlign: 'center',
  },
  message: {
    fontSize: 16,
    color: COLORS.text.secondary,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: SPACING.xl,
  },
  retryButton: {
    marginBottom: SPACING.md,
    width: '100%',
  },
  logoutButton: {
    width: '100%',
  },
});