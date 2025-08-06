import { useEffect, useState } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../config/firebase'; // Sua configuração do Firebase
import { ActivityIndicator, View, StyleSheet, Image, Text} from 'react-native';
import { Redirect } from 'expo-router';
import {LoadingInit} from '../components/LoadingStates'; // Componente de loading

export default function Index() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser); // Atualiza o estado com o usuário autenticado ou null
      setLoading(false); // Alterando o estado de loading para false após a verificação
    });

    // Limpa a inscrição quando o componente for desmontado
    return () => unsubscribe();
  }, []);


if (loading) {
  return (
    <View style={{flex:1,justifyContent:'center',alignItems:'center'}}>
      <Text>LOADING...</Text>
    </View>
  );
}

  if (user) {
    return <Redirect href="/home" />;
  } else {
    return <Redirect href="/login" />;
  }
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },

  logo: {
    width: 150,
    height: 150,
    marginBottom: 40,
  },
});
