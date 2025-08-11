import React, { useState, useEffect } from 'react';
import { Redirect } from 'expo-router';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../config/firebase';
import { LoadingInit } from '../components/LoadingStates';
import { useUserSync } from '../hooks/useUserSync';

export default function Index() {
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const { syncStatus, loading: syncLoading } = useUserSync();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setAuthLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // ⭐ AINDA CARREGANDO
  if (authLoading || (user && syncLoading)) {
    return <LoadingInit />;
  }

  // ⭐ NÃO LOGADO
  if (!user) {
    return <Redirect href="/login" />;
  }

  // ⭐ LOGADO MAS DADOS NÃO SINCRONIZADOS
  if (syncStatus === 'needs_sync') {
    return <Redirect href="/sync-profile" />;
  }

  // ⭐ ERRO NA SINCRONIZAÇÃO
  if (syncStatus === 'error') {
    return <Redirect href="/sync-error" />;
  }

  // ⭐ TUDO OK - IR PARA HOME
  if (syncStatus === 'synced') {
    return <Redirect href="/(tabs)/home" />;
  }

  // ⭐ FALLBACK
  return <LoadingInit />;
}