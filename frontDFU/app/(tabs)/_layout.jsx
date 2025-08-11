// app/(tabs)/_layout.jsx - GUARD COM TOKEN
import React, { useState, useEffect } from 'react';
import { Tabs, useRouter } from 'expo-router';
import { Alert } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../../config/firebase';
import { LoadingInit } from '../../components/LoadingStates';
import { COLORS } from '../../constants/Colors';
import API_CONFIG, { buildURL, makeAuthenticatedRequest } from '../../config/api';

export default function TabLayout() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [syncStatus, setSyncStatus] = useState('checking'); // checking, synced, needs_sync, error
  const [loading, setLoading] = useState(true);

  // ⭐ VERIFICAR SINCRONIZAÇÃO COM TOKEN VÁLIDO
  const checkSyncStatus = async (firebaseUser) => {
    try {
      console.log('🔍 Verificando sincronização com token...');
      
      // ⭐ OBTER TOKEN VÁLIDO
      const token = await firebaseUser.getIdToken();
      console.log('🔑 Token obtido:', token ? 'OK' : 'ERRO');
      
      const response = await makeAuthenticatedRequest(
        buildURL(API_CONFIG.ENDPOINTS.PROFISSIONAL_PROFILE),
        { method: 'GET' },
        token
      );

      console.log('📊 Status verificação:', response.status);

      if (response.ok) {
        const userData = await response.json();
        console.log('✅ Usuário sincronizado:', userData.nome);
        setSyncStatus('synced');
      } else if (response.status === 404) {
        console.log('⚠️ Profissional não encontrado - precisa completar cadastro');
        setSyncStatus('needs_sync');
      } else if (response.status === 403) {
        console.log('⚠️ Token inválido ou expirado');
        setSyncStatus('error');
      } else {
        console.log('❌ Erro na verificação:', response.status);
        setSyncStatus('needs_sync'); // Tentar completar cadastro
      }
    } catch (error) {
      console.error('❌ Erro na verificação:', error);
      setSyncStatus('needs_sync'); // Em caso de erro, tentar sync
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        console.log('🔑 Usuário autenticado - verificando sincronização...');
        setUser(currentUser);
        await checkSyncStatus(currentUser);
      } else {
        console.log('❌ Usuário não autenticado - redirecionando para login');
        router.replace('/login');
        return;
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // ⭐ LOADING
  if (loading || syncStatus === 'checking') {
    return <LoadingInit />;
  }

  // ⭐ ERRO DE AUTENTICAÇÃO
  if (syncStatus === 'error') {
    Alert.alert(
      'Sessão Expirada',
      'Sua sessão expirou. Faça login novamente.',
      [
        {
          text: 'OK',
          onPress: () => {
            auth.signOut();
            router.replace('/login');
          }
        }
      ]
    );
    return <LoadingInit />;
  }

  // ⭐ PRECISA COMPLETAR CADASTRO
  if (syncStatus === 'needs_sync') {
    console.log('➡️ Redirecionando para completar cadastro');
    router.replace('/sync-profile');
    return <LoadingInit />;
  }

  // ⭐ TUDO OK - MOSTRAR TABS
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: COLORS.primary,
        tabBarInactiveTintColor: COLORS.text.secondary,
        tabBarStyle: {
          backgroundColor: COLORS.surface,
          borderTopColor: COLORS.border,
        },
        headerShown: false,
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          title: 'Início',
          tabBarIcon: ({ color, size }) => (
            <MaterialIcons name="home" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="cadastrar"
        options={{
          title: 'Cadastrar',
          tabBarIcon: ({ color, size }) => (
            <MaterialIcons name="person-add" size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}