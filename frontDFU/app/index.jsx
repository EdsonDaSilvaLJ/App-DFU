// app/index.jsx - VERSÃO SIMPLES
import React, { useState, useEffect } from 'react';
import { Redirect } from 'expo-router';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../config/firebase';
import { LoadingInit } from '../components/LoadingStates';

export default function Index() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      console.log('🔥 Firebase Auth Estado:', currentUser ? `Logado: ${currentUser.email}` : 'Não logado');
      setUser(currentUser);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  if (loading) {
    return <LoadingInit />;
  }

  // ⭐ SÓ VERIFICA FIREBASE - NÃO FAZ SYNC
  if (user) {
    console.log('➡️ Usuário logado - redirecionando para tabs');
    return <Redirect href="/(tabs)/home" />;
  } else {
    console.log('➡️ Usuário não logado - redirecionando para login');
    return <Redirect href="/login" />;
  }
}