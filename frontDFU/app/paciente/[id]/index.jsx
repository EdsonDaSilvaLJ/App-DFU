// app/paciente/[id]/index.jsx
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  Alert,
  Image,
  TouchableOpacity,
  SafeAreaView
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { getFirebaseToken, auth } from '../../../config/firebase';
import { COLORS, SPACING, TYPOGRAPHY, BORDER_RADIUS } from '../../../constants/Colors';
import API_CONFIG, { buildURL } from '../../../config/api';

// ⭐ COMPONENTES MODERNOS
import { LoadingInit } from '../../../components/LoadingStates';
import { FloatingActionButton } from '../../../components/Buttons';

export default function PerfilPaciente() {
  const { id } = useLocalSearchParams();
  const [paciente, setPaciente] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const router = useRouter();

  useEffect(() => {
    buscarPaciente();
  }, [id]);

  const buscarPaciente = async () => {
    try {
      const token = await getFirebaseToken(auth);
      const response = await fetch(
        buildURL(API_CONFIG.ENDPOINTS.PACIENTE_BY_ID(id)),
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

      if (!response.ok) throw new Error('Erro ao buscar paciente');

      const data = await response.json();
      setPaciente(data);
    } catch (error) {
      console.error('Erro ao buscar paciente:', error);
      Alert.alert('Erro', 'Não foi possível carregar os dados do paciente');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await buscarPaciente();
    setRefreshing(false);
  };

  const calcularIdade = (dataNascimento) => {
    const hoje = new Date();
    const nascimento = new Date(dataNascimento);
    let idade = hoje.getFullYear() - nascimento.getFullYear();
    const mes = hoje.getMonth() - nascimento.getMonth();

    if (mes < 0 || (mes === 0 && hoje.getDate() < nascimento.getDate())) {
      idade--;
    }
    return idade;
  };

  const formatarData = (data) => {
    return new Date(data).toLocaleDateString('pt-BR');
  };

  const formatarCPF = (cpf) => {
    return cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
  };

  const formatarTelefone = (telefone) => {
    return telefone.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
  };

  // ⭐ LOADING
  if (loading) {
    return <LoadingInit />;
  }

  if (!paciente) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <MaterialIcons name="error-outline" size={64} color={COLORS.error} />
          <Text style={styles.errorText}>Paciente não encontrado</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* ⭐ HEADER SIMPLES */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <MaterialIcons name="arrow-back" size={24} color={COLORS.text.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{paciente.nome}</Text>
        <TouchableOpacity onPress={handleRefresh} style={styles.refreshButton}>
          <MaterialIcons name="refresh" size={24} color={COLORS.text.primary} />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={[COLORS.primary]}
            tintColor={COLORS.primary}
          />
        }
      >
        {/* ⭐ INFORMAÇÕES BÁSICAS */}
        <View style={styles.infoCard}>
          <Text style={styles.sectionTitle}>Informações do Paciente</Text>

          <View style={styles.infoRow}>
            <MaterialIcons name="person" size={20} color={COLORS.primary} />
            <Text style={styles.infoText}>{paciente.nome}</Text>
          </View>

          <View style={styles.infoRow}>
            <MaterialIcons name="cake" size={20} color={COLORS.primary} />
            <Text style={styles.infoText}>{calcularIdade(paciente.dataNascimento)} anos</Text>
          </View>

          <View style={styles.infoRow}>
            <MaterialIcons name="wc" size={20} color={COLORS.primary} />
            <Text style={styles.infoText}>
              {paciente.genero.charAt(0).toUpperCase() + paciente.genero.slice(1)}
            </Text>
          </View>

          <View style={styles.infoRow}>
            <MaterialIcons name="badge" size={20} color={COLORS.primary} />
            <Text style={styles.infoText}>{formatarCPF(paciente.cpf)}</Text>
          </View>

          <View style={styles.infoRow}>
            <MaterialIcons name="phone" size={20} color={COLORS.primary} />
            <Text style={styles.infoText}>{formatarTelefone(paciente.telefone)}</Text>
          </View>

          {paciente.email && (
            <View style={styles.infoRow}>
              <MaterialIcons name="email" size={20} color={COLORS.primary} />
              <Text style={styles.infoText}>{paciente.email}</Text>
            </View>
          )}
        </View>

        {/* ⭐ ANÁLISES */}
        <View style={styles.analysisSection}>
          <View style={styles.analysisSectionHeader}>
            <Text style={styles.sectionTitle}>Análises</Text>
            <View style={styles.countBadge}>
              <Text style={styles.countText}>{paciente.analises?.length || 0}</Text>
            </View>
          </View>

          {paciente.analises && paciente.analises.length > 0 ? (
            <View style={styles.analysisList}>
              {paciente.analises.slice().reverse().map((analise, index) => (
                <TouchableOpacity
                  key={analise._id || index}
                  style={styles.analysisCard}
                  onPress={() => router.push(`/paciente/${id}/${analise._id}`)}
                >
                  {/* ⭐ CORRIGIR URL DA IMAGEM */}
                  <Image
                    source={{ uri: analise.originalImageUrl }}
                    style={styles.analysisImage}
                  />

                  <View style={styles.analysisInfo}>
                    {/* ⭐ CORRIGIR DATA */}
                    <Text style={styles.analysisDate}>
                      {formatarData(analise.createdAt)}
                    </Text>

                    {/* ⭐ MOSTRAR DIAGNÓSTICO GERAL */}
                    <Text style={styles.analysisResult}>
                      {analise.imageDiagnosis}
                    </Text>

                    {/* ⭐ MOSTRAR RESUMO DAS DETECÇÕES */}
                    <Text style={styles.analysisConfidence}>
                      {analise.boxes?.length || 0} detecção(ões)
                    </Text>
                  </View>

                  <MaterialIcons name="chevron-right" size={20} color={COLORS.text.disabled} />
                </TouchableOpacity>
              ))}
            </View>
          ) : (
            <View style={styles.emptyState}>
              <MaterialIcons name="photo-camera" size={48} color={COLORS.text.placeholder} />
              <Text style={styles.emptyTitle}>Nenhuma análise</Text>
              <Text style={styles.emptySubtitle}>
                Comece enviando uma foto da lesão
              </Text>
            </View>
          )}
        </View>

        <View style={styles.bottomSpacer} />
      </ScrollView>

      {/* ⭐ BOTÃO FLUTUANTE */}
      <FloatingActionButton
        onPress={() => router.push(`/paciente/${id}/nova-analise`)}
        icon="add-a-photo"
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },

  // ⭐ HEADER
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    backgroundColor: COLORS.surface,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  backButton: {
    padding: SPACING.sm,
  },
  headerTitle: {
    flex: 1,
    ...TYPOGRAPHY.heading3,
    fontWeight: '600',
    color: COLORS.text.primary,
    textAlign: 'center',
    marginHorizontal: SPACING.md,
  },
  refreshButton: {
    padding: SPACING.sm,
  },

  // ⭐ CONTEÚDO
  content: {
    flex: 1,
    paddingHorizontal: SPACING.lg,
  },

  // ⭐ INFORMAÇÕES BÁSICAS
  infoCard: {
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.large,
    padding: SPACING.xl,
    marginTop: SPACING.lg,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  sectionTitle: {
    ...TYPOGRAPHY.heading3,
    fontWeight: '600',
    color: COLORS.text.primary,
    marginBottom: SPACING.lg,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  infoText: {
    ...TYPOGRAPHY.body,
    color: COLORS.text.primary,
    marginLeft: SPACING.md,
    flex: 1,
  },

  // ⭐ ANÁLISES
  analysisSection: {
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.large,
    padding: SPACING.xl,
    marginTop: SPACING.lg,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  analysisSectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  countBadge: {
    backgroundColor: COLORS.primary + '15',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderRadius: BORDER_RADIUS.medium,
  },
  countText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.primary,
    fontWeight: '600',
  },

  // ⭐ LISTA DE ANÁLISES
  analysisList: {
    gap: SPACING.md,
  },
  analysisCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.background,
    borderRadius: BORDER_RADIUS.medium,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  analysisImage: {
    width: 50,
    height: 50,
    borderRadius: BORDER_RADIUS.medium,
    marginRight: SPACING.md,
  },
  analysisInfo: {
    flex: 1,
  },
  analysisDate: {
    ...TYPOGRAPHY.body,
    fontWeight: '500',
    color: COLORS.text.primary,
    marginBottom: 4,
  },
  analysisResult: {
    ...TYPOGRAPHY.caption,
    color: COLORS.primary,
    fontWeight: '500',
  },
  analysisProcessing: {
    ...TYPOGRAPHY.caption,
    color: COLORS.text.secondary,
    fontStyle: 'italic',
  },

  // ⭐ ESTADO VAZIO
  emptyState: {
    alignItems: 'center',
    paddingVertical: SPACING.xxl,
  },
  emptyTitle: {
    ...TYPOGRAPHY.body,
    fontWeight: '600',
    color: COLORS.text.primary,
    marginTop: SPACING.md,
    marginBottom: SPACING.xs,
  },
  emptySubtitle: {
    ...TYPOGRAPHY.caption,
    color: COLORS.text.secondary,
    textAlign: 'center',
  },

  // ⭐ ERRO
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.xl,
  },
  errorText: {
    ...TYPOGRAPHY.heading3,
    color: COLORS.error,
    marginTop: SPACING.lg,
    textAlign: 'center',
  },

  bottomSpacer: {
    height: SPACING.xxl * 2,
  },
});