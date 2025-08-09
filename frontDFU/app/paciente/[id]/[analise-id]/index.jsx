// app/paciente/[id]/[analise-id]/index.jsx
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
  SafeAreaView,
  Dimensions
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { getFirebaseToken, auth } from '../../../../config/firebase';
import { COLORS, SPACING, TYPOGRAPHY, BORDER_RADIUS } from '../../../../constants/Colors';
import API_CONFIG, { buildURL } from '../../../../config/api';

// ⭐ COMPONENTES MODERNOS
import { LoadingInit } from '../../../../components/LoadingStates';
import { PrimaryButton } from '../../../../components/Buttons';

const { width } = Dimensions.get('window');

export default function DetalhesAnalise() {
  const { id: pacienteId, 'analise-id': analiseId } = useLocalSearchParams();
  const [analise, setAnalise] = useState(null);
  const [paciente, setPaciente] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const router = useRouter();

  useEffect(() => {
    buscarDetalhesAnalise();
  }, [analiseId]);

  const buscarDetalhesAnalise = async () => {
    try {
      const token = await getFirebaseToken();
      
      // ⭐ BUSCAR ANÁLISE PELA ROTA CORRETA
       const responseAnalise = await fetch(
        buildURL(API_CONFIG.ENDPOINTS.ANALISE_BY_ID(analiseId)),
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

      // Buscar dados do paciente
        const responsePaciente = await fetch(
        buildURL(API_CONFIG.ENDPOINTS.PACIENTE_BY_ID(pacienteId)),
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

      if (!responseAnalise.ok || !responsePaciente.ok) {
        throw new Error('Erro ao buscar dados');
      }

      const dataAnalise = await responseAnalise.json();
      const dataPaciente = await responsePaciente.json();
      
      setAnalise(dataAnalise.data);
      setPaciente(dataPaciente);
    } catch (error) {
      console.error('Erro ao buscar análise:', error);
      Alert.alert('Erro', 'Não foi possível carregar os dados da análise');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await buscarDetalhesAnalise();
    setRefreshing(false);
  };

  const formatarData = (data) => {
    return new Date(data).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const formatarHora = (data) => {
    return new Date(data).toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatarDataCompleta = (data) => {
    return new Date(data).toLocaleDateString('pt-BR', {
      weekday: 'long',
      day: '2-digit',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // ⭐ CALCULAR ESTATÍSTICAS REAIS DOS BOXES
  const calcularEstatisticas = () => {
    if (!analise.boxes || analise.boxes.length === 0) {
      return { totalDeteccoes: 0, mediaConfianca: 0, classificacoes: {} };
    }

    const totalDeteccoes = analise.boxes.length;
    const somaConfianca = analise.boxes.reduce((soma, box) => soma + (box.classification?.confidence || 0), 0);
    const mediaConfianca = somaConfianca / totalDeteccoes;

    // Contar classificações
    const classificacoes = {};
    analise.boxes.forEach(box => {
      const label = box.classification?.label || 'Não classificado';
      classificacoes[label] = (classificacoes[label] || 0) + 1;
    });

    return { totalDeteccoes, mediaConfianca, classificacoes };
  };

  // ⭐ LOADING
  if (loading) {
    return <LoadingInit />;
  }

  if (!analise || !paciente) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <MaterialIcons name="error-outline" size={64} color={COLORS.error} />
          <Text style={styles.errorText}>Análise não encontrada</Text>
          <PrimaryButton
            title="Voltar"
            onPress={() => router.back()}
            style={styles.errorButton}
          />
        </View>
      </SafeAreaView>
    );
  }

  const { totalDeteccoes, mediaConfianca, classificacoes } = calcularEstatisticas();

  return (
    <SafeAreaView style={styles.container}>
      {/* ⭐ HEADER */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <MaterialIcons name="arrow-back" size={24} color={COLORS.text.primary} />
        </TouchableOpacity>
        <View style={styles.headerInfo}>
          <Text style={styles.headerTitle}>Análise Detalhada</Text>
          <Text style={styles.headerSubtitle}>{paciente.nome}</Text>
        </View>
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
        {/* ⭐ IMAGEM PRINCIPAL */}
        <View style={styles.imageCard}>
          <Image
            source={{ uri: analise.originalImageUrl }}
            style={styles.mainImage}
            resizeMode="contain"
          />
          <Text style={styles.imageCaption}>
            Analisada em {formatarDataCompleta(analise.createdAt)}
          </Text>
        </View>

        {/* ⭐ RESUMO DA ANÁLISE */}
        <View style={styles.summaryCard}>
          <View style={styles.summaryHeader}>
            <MaterialIcons name="analytics" size={24} color={COLORS.primary} />
            <Text style={styles.cardTitle}>Resumo da Análise</Text>
          </View>
          
          <View style={styles.summaryContent}>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Total de Detecções:</Text>
              <Text style={styles.summaryValue}>{totalDeteccoes}</Text>
            </View>
            
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Confiança Média:</Text>
              <Text style={styles.summaryValue}>
                {Math.round(mediaConfianca * 100)}%
              </Text>
            </View>

            {/* ⭐ CLASSIFICAÇÕES ENCONTRADAS */}
            <View style={styles.classificationsContainer}>
              <Text style={styles.classificationsTitle}>Classificações:</Text>
              {Object.entries(classificacoes).map(([tipo, quantidade]) => (
                <View key={tipo} style={styles.classificationItem}>
                  <View style={styles.classificationDot} />
                  <Text style={styles.classificationType}>{tipo}</Text>
                  <Text style={styles.classificationCount}>({quantidade})</Text>
                </View>
              ))}
            </View>
          </View>
        </View>

        {/* ⭐ DETECÇÕES INDIVIDUAIS */}
        <View style={styles.detectionsCard}>
          <View style={styles.detectionsHeader}>
            <MaterialIcons name="crop-free" size={24} color={COLORS.info} />
            <Text style={styles.cardTitle}>Detecções da IA</Text>
          </View>
          
          {analise.boxes && analise.boxes.length > 0 ? (
            <View style={styles.detectionsList}>
              {analise.boxes.map((box, index) => (
                <View key={index} style={styles.detectionItem}>
                  <View style={styles.detectionHeader}>
                    <Text style={styles.detectionTitle}>Região {index + 1}</Text>
                    <Text style={styles.detectionConfidence}>
                      {Math.round((box.classification?.confidence || 0) * 100)}%
                    </Text>
                  </View>
                  
                  <Text style={styles.detectionClass}>
                    {box.classification?.label || 'Não classificado'}
                  </Text>
                  
                  <Text style={styles.detectionCoords}>
                    Coordenadas: ({box.xMin}, {box.yMin}) - ({box.xMax}, {box.yMax})
                  </Text>
                  
                  {box.diagnosis && (
                    <View style={styles.diagnosisContainer}>
                      <Text style={styles.diagnosisLabel}>Diagnóstico Médico:</Text>
                      <Text style={styles.diagnosisText}>{box.diagnosis}</Text>
                    </View>
                  )}
                </View>
              ))}
            </View>
          ) : (
            <Text style={styles.noDetections}>Nenhuma detecção encontrada</Text>
          )}
        </View>

        {/* ⭐ DIAGNÓSTICO GERAL */}
        <View style={styles.diagnosisCard}>
          <View style={styles.diagnosisCardHeader}>
            <MaterialIcons name="local-hospital" size={24} color={COLORS.success} />
            <Text style={styles.cardTitle}>Diagnóstico Geral</Text>
          </View>
          
          <Text style={styles.generalDiagnosis}>
            {analise.imageDiagnosis}
          </Text>
        </View>

        {/* ⭐ INFORMAÇÕES TÉCNICAS */}
        <View style={styles.technicalCard}>
          <Text style={styles.cardTitle}>Informações Técnicas</Text>
          
          <View style={styles.technicalRow}>
            <Text style={styles.technicalLabel}>ID da Análise:</Text>
            <Text style={styles.technicalValue}>{analise._id}</Text>
          </View>
          
          <View style={styles.technicalRow}>
            <Text style={styles.technicalLabel}>Data de Criação:</Text>
            <Text style={styles.technicalValue}>
              {formatarData(analise.createdAt)} às {formatarHora(analise.createdAt)}
            </Text>
          </View>
          
          <View style={styles.technicalRow}>
            <Text style={styles.technicalLabel}>Última Atualização:</Text>
            <Text style={styles.technicalValue}>
              {formatarData(analise.updatedAt)} às {formatarHora(analise.updatedAt)}
            </Text>
          </View>
          
          <View style={styles.technicalRow}>
            <Text style={styles.technicalLabel}>Status:</Text>
            <Text style={[styles.technicalValue, { color: COLORS.success }]}>
              Concluída
            </Text>
          </View>
        </View>

        <View style={styles.bottomSpacer} />
      </ScrollView>
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
  headerInfo: {
    flex: 1,
    marginHorizontal: SPACING.md,
  },
  headerTitle: {
    ...TYPOGRAPHY.heading3,
    fontWeight: '600',
    color: COLORS.text.primary,
    textAlign: 'center',
  },
  headerSubtitle: {
    ...TYPOGRAPHY.caption,
    color: COLORS.text.secondary,
    textAlign: 'center',
    marginTop: 2,
  },
  refreshButton: {
    padding: SPACING.sm,
  },

  // ⭐ CONTEÚDO
  content: {
    flex: 1,
    paddingHorizontal: SPACING.lg,
  },

  // ⭐ IMAGEM PRINCIPAL
  imageCard: {
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.large,
    padding: SPACING.lg,
    marginTop: SPACING.lg,
    alignItems: 'center',
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  mainImage: {
    width: width - (SPACING.lg * 4),
    height: 300,
    borderRadius: BORDER_RADIUS.medium,
  },
  imageCaption: {
    ...TYPOGRAPHY.caption,
    color: COLORS.text.secondary,
    textAlign: 'center',
    marginTop: SPACING.md,
  },

  // ⭐ CARDS GERAIS
  summaryCard: {
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
  detectionsCard: {
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
  diagnosisCard: {
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
  technicalCard: {
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

  // ⭐ HEADERS DOS CARDS
  summaryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  detectionsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  diagnosisCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  cardTitle: {
    ...TYPOGRAPHY.heading3,
    fontWeight: '600',
    color: COLORS.text.primary,
    marginLeft: SPACING.sm,
    flex: 1,
  },

  // ⭐ RESUMO
  summaryContent: {
    gap: SPACING.md,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  summaryLabel: {
    ...TYPOGRAPHY.body,
    color: COLORS.text.secondary,
  },
  summaryValue: {
    ...TYPOGRAPHY.body,
    fontWeight: '600',
    color: COLORS.primary,
  },
  classificationsContainer: {
    marginTop: SPACING.sm,
  },
  classificationsTitle: {
    ...TYPOGRAPHY.body,
    color: COLORS.text.secondary,
    marginBottom: SPACING.sm,
  },
  classificationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.xs,
  },
  classificationDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.primary,
    marginRight: SPACING.sm,
  },
  classificationType: {
    ...TYPOGRAPHY.body,
    color: COLORS.text.primary,
    flex: 1,
  },
  classificationCount: {
    ...TYPOGRAPHY.caption,
    color: COLORS.text.secondary,
  },

  // ⭐ DETECÇÕES
  detectionsList: {
    gap: SPACING.md,
  },
  detectionItem: {
    backgroundColor: COLORS.background,
    borderRadius: BORDER_RADIUS.medium,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  detectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  detectionTitle: {
    ...TYPOGRAPHY.body,
    fontWeight: '600',
    color: COLORS.text.primary,
  },
  detectionConfidence: {
    ...TYPOGRAPHY.caption,
    color: COLORS.primary,
    fontWeight: '600',
  },
  detectionClass: {
    ...TYPOGRAPHY.body,
    color: COLORS.info,
    marginBottom: SPACING.xs,
  },
  detectionCoords: {
    ...TYPOGRAPHY.caption,
    color: COLORS.text.secondary,
  },
  diagnosisContainer: {
    marginTop: SPACING.sm,
    paddingTop: SPACING.sm,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  diagnosisLabel: {
    ...TYPOGRAPHY.caption,
    color: COLORS.text.secondary,
    marginBottom: SPACING.xs,
  },
  diagnosisText: {
    ...TYPOGRAPHY.body,
    color: COLORS.text.primary,
    lineHeight: 20,
  },
  noDetections: {
    ...TYPOGRAPHY.body,
    color: COLORS.text.secondary,
    textAlign: 'center',
    fontStyle: 'italic',
  },

  // ⭐ DIAGNÓSTICO GERAL
  generalDiagnosis: {
    ...TYPOGRAPHY.body,
    color: COLORS.text.primary,
    lineHeight: 22,
  },

  // ⭐ INFORMAÇÕES TÉCNICAS
  technicalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  technicalLabel: {
    ...TYPOGRAPHY.caption,
    color: COLORS.text.secondary,
  },
  technicalValue: {
    ...TYPOGRAPHY.caption,
    color: COLORS.text.primary,
    fontWeight: '500',
    flex: 1,
    textAlign: 'right',
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
    marginBottom: SPACING.xl,
    textAlign: 'center',
  },
  errorButton: {
    minWidth: 120,
  },

  bottomSpacer: {
    height: SPACING.xl,
  },
});