// app/(tabs)/home.jsx
import React, { useState, useEffect } from 'react';
import {
  SafeAreaView,
  View,
  StyleSheet,
  FlatList,
  RefreshControl
} from 'react-native';
import { useRouter } from 'expo-router';
import { auth, getFirebaseToken } from '../../config/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { COLORS, SPACING } from '../../constants/Colors';
import API_CONFIG, { buildURL } from '../../config/api';

// ⭐ IMPORTAR COMPONENTES MODERNOS
import { SearchBar } from '../../components/Inputs';
import { PatientCard } from '../../components/Cards';
import { EmptyPatients } from '../../components/EmptyStates';
import { PageHeader, SectionHeader } from '../../components/Headers';
import { LoadingInit } from '../../components/LoadingStates';
import { FloatingActionButton } from '../../components/Buttons';

export default function Home() {
  const [busca, setBusca] = useState('');
  const [pacientesTotais, setPacientesTotais] = useState([]);
  const [pacientesFiltrados, setPacientesFiltrados] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const router = useRouter();

  const buscarPacientes = async () => {
    try {
      const token = await getFirebaseToken();
      const res = await fetch(
        buildURL(API_CONFIG.ENDPOINTS.PACIENTES),
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      if (!res.ok) throw new Error(`Status ${res.status}`);
      const data = await res.json();
      setPacientesTotais(data);
      setPacientesFiltrados(data);
    } catch (error) {
      console.error('Erro ao buscar pacientes:', error);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await buscarPacientes();
    setRefreshing(false);
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        await buscarPacientes();
      }
      setCarregando(false);
    });
    return () => unsubscribe();
  }, []);

  const filtrarPacientes = (texto) => {
    const termo = texto.toLowerCase();
    return pacientesTotais.filter(p =>
      (p.nome || '').toLowerCase().includes(termo) ||
      (p.cpf || '').includes(texto)
    );
  };

  const handleBusca = (texto) => {
    setBusca(texto);
    if (texto.trim()) {
      setPacientesFiltrados(filtrarPacientes(texto));
    } else {
      setPacientesFiltrados(pacientesTotais);
    }
  };

  const navegarPerfil = (paciente) => {
    const id = paciente._id ?? paciente.id;
    router.push(`/paciente/${id}`);
  };

  const navegarCadastro = () => {
    router.push('/(tabs)/cadastrar');
  };

  // ⭐ LOADING STATE MODERNO
  if (carregando) {
    return <LoadingInit />;
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* ⭐ HEADER MODERNO */}
      <PageHeader
        title="Meus Pacientes"
        actions={[
          {
            icon: 'refresh',
            onPress: handleRefresh
          }
        ]}
      />

      <View style={styles.content}>
        {/* ⭐ BUSCA MODERNA */}
        <SearchBar
          value={busca}
          onChangeText={handleBusca}
          placeholder="Buscar por nome ou CPF..."
        />

        {/* ⭐ SEÇÃO COM CONTADOR */}
        <SectionHeader
          title="Pacientes"
          count={pacientesFiltrados.length}
        />

        {/* ⭐ LISTA COM CARDS MODERNOS */}
        {pacientesFiltrados.length > 0 ? (
          <FlatList
            data={pacientesFiltrados}
            keyExtractor={item => item._id ?? item.id}
            renderItem={({ item }) => (
              <PatientCard
                patient={item}
                onPress={() => navegarPerfil(item)}
                showAnalysisCount={true}
              />
            )}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.listContent}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={handleRefresh}
                colors={[COLORS.primary]}
                tintColor={COLORS.primary}
              />
            }
          />
        ) : (
          /* ⭐ ESTADO VAZIO MODERNO */
          <EmptyPatients onAddPatient={navegarCadastro} />
        )}
      </View>
      {/* ⭐ BOTÃO FLUTUANTE MODERNO */}
      <FloatingActionButton
        onPress={navegarCadastro}
        icon="person-add"
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  content: {
    flex: 1,
    paddingHorizontal: SPACING.lg,
  },
  listContent: {
    paddingBottom: SPACING.xxl,
  },
});