import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  Alert,
  StyleSheet,
  ScrollView,
  TextInput,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useForm, Controller } from 'react-hook-form';
import { auth } from '../../../../config/firebase';
import API_CONFIG, { buildURL } from '../../../../config/api';
import * as FileSystem from 'expo-file-system'; // <-- IMPORTAR O FILE SYSTEM

const { width: screenWidth } = Dimensions.get('window');

export default function ResultsScreen() {
  const params = useLocalSearchParams();
  const pacienteId = params.id;
  const detectedImageBase64 = params.imageBase64;
  const boxes = JSON.parse(params.boxes);
  const imageInfo = JSON.parse(params.imageInfo);
  const originalUri = params.originalUri;

  const [isProcessing, setIsProcessing] = useState(true);
  const [classificacoes, setClassificacoes] = useState([]);
  const [subimagens, setSubimagens] = useState([]);
  const [isSaving, setIsSaving] = useState(false);

  const { control, handleSubmit, getValues, formState: { errors } } = useForm({
    defaultValues: {
      diagnosticoGeral: '',
      observacoes: {},
    }
  });

  useEffect(() => {
    handleProceedToClassification();
  }, []);

  const handleProceedToClassification = async () => {
    setIsProcessing(true);
    try {
      const classificacaoData = {
        imagem_redimensionada: detectedImageBase64,
        boxes_finais: boxes,
        medico_id: auth.currentUser?.uid,
        paciente_id: pacienteId,
      };

      const response = await fetch(buildURL(API_CONFIG.ENDPOINTS.CLASSIFY_REGIONS), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(classificacaoData),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
      }

      const data = await response.json();

      if (data.success && data.resultados_classificacao) {
        setClassificacoes(data.resultados_classificacao);
        const subimagensGeradas = data.resultados_classificacao.map((resultado, index) => ({
          id: index,
          base64: resultado.subimagem,
          classificacao: resultado.classe_classificacao,
          confianca: resultado.confianca_classificacao,
          coordenadas: {
            xmin: resultado.xmin, ymin: resultado.ymin,
            xmax: resultado.xmax, ymax: resultado.ymax,
          }
        }));
        setSubimagens(subimagensGeradas);
      } else {
        throw new Error(data.message || 'Falha na classificação das regiões');
      }
    } catch (error) {
      console.error('Erro na classificação:', error);
      Alert.alert('Erro na Classificação', 'Não foi possível classificar as regiões. Tente novamente.',
        [{ text: 'Tentar Novamente', onPress: handleProceedToClassification }, { text: 'Voltar', onPress: () => router.back() }]
      );
    } finally {
      setIsProcessing(false);
    }
  };

  // <-- FUNÇÃO CORRIGIDA -->
const handleSaveAnalysis = async (formData) => {
  setIsSaving(true);

  try {
    // ⭐ LOGS DE DEBUG
    console.log('🔍 Iniciando salvamento da análise...');
    console.log('📱 API_CONFIG.BASE_URL:', API_CONFIG.BASE_URL);
    console.log('🌐 SAVE_ANALYSIS endpoint:', API_CONFIG.ENDPOINTS.SAVE_ANALYSIS);
    
    // ⭐ VERIFICAR SE ENDPOINT EXISTE
    if (!API_CONFIG.ENDPOINTS.SAVE_ANALYSIS) {
      throw new Error('SAVE_ANALYSIS endpoint não configurado');
    }

    const url = buildURL(API_CONFIG.ENDPOINTS.SAVE_ANALYSIS);
    console.log('🔗 URL final:', url);

    // ⭐ TESTAR CONECTIVIDADE PRIMEIRO
    console.log('🧪 Testando conectividade...');
    try {
      const testResponse = await fetch(API_CONFIG.BASE_URL);
      console.log('🧪 Conectividade:', testResponse.status);
    } catch (testError) {
      throw new Error(`Backend indisponível: ${testError.message}`);
    }

    // 1. Ler a imagem original da URI e converter para base64
    let originalImageBase64 = '';
    if (originalUri) {
      console.log('📁 Lendo imagem original de:', originalUri);
      originalImageBase64 = await FileSystem.readAsStringAsync(originalUri, {
        encoding: FileSystem.EncodingType.Base64,
      });
      console.log('✅ Imagem original lida e convertida para base64.');
    } else {
      console.warn('⚠️ URI da imagem original não encontrada. Usando fallback.');
      originalImageBase64 = detectedImageBase64;
    }

    // 2. Montar o corpo da requisição
    const analiseData = {
      medico_id: auth.currentUser?.uid,
      paciente_id: pacienteId,
      imagem_original: originalImageBase64,
      regioes_analisadas: classificacoes.map((regiao, index) => ({
        coordenadas: {
          xmin: regiao.xmin, ymin: regiao.ymin,
          xmax: regiao.xmax, ymax: regiao.ymax
        },
        classificacao_ia: {
          classe: regiao.classe_classificacao,
          confianca: regiao.confianca_classificacao
        },
        diagnostico_medico: formData.observacoes?.[index] || ''
      })),
      diagnostico_geral: formData.diagnosticoGeral
    };

    console.log('📤 Enviando dados da análise...');
    console.log('👤 medico_id:', analiseData.medico_id);
    console.log('🏥 paciente_id:', analiseData.paciente_id);
    console.log('📊 regioes_analisadas:', analiseData.regioes_analisadas.length);

    const response = await fetch(url, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        // ⭐ ADICIONAR TOKEN SE NECESSÁRIO
        ...(auth.currentUser && { 'Authorization': `Bearer ${await auth.currentUser.getIdToken()}` })
      },
      body: JSON.stringify(analiseData),
    });
    
    console.log('📊 Resposta do servidor recebida. Status:', response.status);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Erro HTTP:', errorText);
      throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
    }

    const data = await response.json();
    console.log('✅ Dados da resposta:', data);

    if (data.success) {
      Alert.alert('Sucesso!', 'Análise salva com sucesso',
        [{ text: 'OK', onPress: () => router.replace(`/paciente/${pacienteId}`) }]
      );
    } else {
      throw new Error(data.message || 'Erro ao salvar análise');
    }
  } catch (error) {
    console.error('❌ Erro detalhado ao salvar análise:', {
      message: error.message,
      name: error.name,
      stack: error.stack
    });

    // ⭐ MENSAGENS DE ERRO ESPECÍFICAS
    let errorMessage = 'Erro desconhecido';
    
    if (error.message.includes('Network request failed')) {
      errorMessage = 'Sem conexão com a internet ou servidor indisponível';
    } else if (error.message.includes('SAVE_ANALYSIS endpoint não configurado')) {
      errorMessage = 'Configuração de endpoint ausente';
    } else if (error.message.includes('Backend indisponível')) {
      errorMessage = 'Servidor principal não está respondendo';
    } else {
      errorMessage = error.message;
    }

    Alert.alert('Erro', `Não foi possível salvar a análise.\n\n${errorMessage}`);
  } finally {
    setIsSaving(false);
  }
};

  // O resto do seu componente (JSX e estilos) permanece o mesmo...
  const getClassificationColor = (confianca) => {
    if (confianca >= 0.8) return '#4CAF50';
    if (confianca >= 0.6) return '#FF9800';
    return '#f44336';
  };

  const getClassificationText = (confianca) => {
    if (confianca >= 0.8) return 'Alta';
    if (confianca >= 0.6) return 'Média';
    return 'Baixa';
  };

  if (isProcessing && classificacoes.length === 0) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2196F3" />
        <Text style={styles.loadingTitle}>Classificando Regiões...</Text>
        <Text style={styles.loadingText}>Nossa IA está analisando cada região identificada...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header, ScrollView, etc. */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}><Ionicons name="arrow-back" size={24} color="#333" /></TouchableOpacity>
        <Text style={styles.headerTitle}>Resultados da Análise</Text>
        <View style={styles.placeholder} />
      </View>
      <ScrollView style={styles.content}>
        <View style={styles.imageSection}>
          <Text style={styles.sectionTitle}>Imagem Analisada</Text>
          <View style={styles.imageContainer}>
            <Image source={{ uri: `data:image/jpeg;base64,${detectedImageBase64}` }} style={styles.mainImage} resizeMode="contain" />
          </View>
          <Text style={styles.imageInfo}>Regiões analisadas: {classificacoes.length}</Text>
        </View>

        <View style={styles.resultsSection}>
          <Text style={styles.sectionTitle}>Classificações da IA</Text>
          {subimagens.map((subimagem, index) => (
            <View key={subimagem.id} style={styles.resultItem}>
              <View style={styles.resultHeader}>
                <Text style={styles.resultTitle}>Região {index + 1}</Text>
                <View style={[styles.confidenceBadge, { backgroundColor: getClassificationColor(subimagem.confianca) }]}>
                  <Text style={styles.confidenceText}>{getClassificationText(subimagem.confianca)}</Text>
                </View>
              </View>
              <View style={styles.resultContent}>
                <View style={styles.subImageContainer}>
                  <Image source={{ uri: `data:image/jpeg;base64,${subimagem.base64}` }} style={styles.subImage} resizeMode="cover" />
                </View>
                <View style={styles.classificationInfo}>
                  <Text style={styles.classificationLabel}>Classificação:</Text>
                  <Text style={styles.classificationType}>{subimagem.classificacao}</Text>
                  <Text style={styles.classificationLabel}>Confiança:</Text>
                  <Text style={styles.classificationConfidence}>{(subimagem.confianca * 100).toFixed(1)}%</Text>
                </View>
              </View>
              <View style={styles.observationSection}>
                <Text style={styles.observationLabel}>Observação do Médico:</Text>
                <Controller
                  control={control}
                  name={`observacoes.${index}`}
                  render={({ field: { onChange, onBlur, value } }) => (
                    <TextInput style={styles.observationInput} placeholder="Adicione suas observações..." multiline value={value} onBlur={onBlur} onChangeText={onChange} />
                  )}
                />
              </View>
            </View>
          ))}
        </View>

        <View style={styles.diagnosisSection}>
          <Text style={styles.sectionTitle}>Diagnóstico Geral*</Text>
          <Controller
            control={control}
            name="diagnosticoGeral"
            rules={{ required: 'Diagnóstico geral é obrigatório' }}
            render={({ field: { onChange, onBlur, value } }) => (
              <TextInput style={[styles.diagnosisInput, errors.diagnosticoGeral && styles.inputError]} placeholder="Digite o diagnóstico geral da análise..." multiline value={value} onBlur={onBlur} onChangeText={onChange} />
            )}
          />
          {errors.diagnosticoGeral && (<Text style={styles.errorText}>{errors.diagnosticoGeral.message}</Text>)}
        </View>
      </ScrollView>

      <View style={styles.bottomSection}>
        <TouchableOpacity style={[styles.saveButton, isSaving && styles.saveButtonDisabled]} onPress={handleSubmit(handleSaveAnalysis)} disabled={isSaving}>
          {isSaving ? (
            <><ActivityIndicator size="small" color="#fff" style={{ marginRight: 8 }} /><Text style={styles.saveButtonText}>Salvando...</Text></>
          ) : (
            <><Ionicons name="save-outline" size={20} color="#fff" style={{ marginRight: 8 }} /><Text style={styles.saveButtonText}>Salvar Análise</Text></>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  loadingContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#f5f5f5', paddingHorizontal: 32 },
  loadingTitle: { fontSize: 18, fontWeight: '600', color: '#333', marginTop: 16, marginBottom: 8 },
  loadingText: { fontSize: 14, color: '#666', textAlign: 'center', lineHeight: 20 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: 60, paddingBottom: 16, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#e0e0e0' },
  backButton: { padding: 8 },
  headerTitle: { fontSize: 18, fontWeight: '600', color: '#333' },
  placeholder: { width: 40 },
  content: { flex: 1 },
  imageSection: { backgroundColor: '#fff', margin: 16, borderRadius: 12, padding: 16 },
  sectionTitle: { fontSize: 16, fontWeight: '600', color: '#333', marginBottom: 12 },
  imageContainer: { alignItems: 'center', marginBottom: 8 },
  mainImage: { width: screenWidth - 64, height: (screenWidth - 64) * 0.75, borderRadius: 8 },
  imageInfo: { fontSize: 12, color: '#666', textAlign: 'center', marginBottom: 4 },
  resultsSection: { backgroundColor: '#fff', marginHorizontal: 16, marginBottom: 16, borderRadius: 12, padding: 16 },
  resultItem: { borderWidth: 1, borderColor: '#e0e0e0', borderRadius: 8, padding: 12, marginBottom: 16 },
  resultHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  resultTitle: { fontSize: 14, fontWeight: '600', color: '#333' },
  confidenceBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12 },
  confidenceText: { fontSize: 12, color: '#fff', fontWeight: '500' },
  resultContent: { flexDirection: 'row', marginBottom: 12 },
  subImageContainer: { marginRight: 12 },
  subImage: { width: 80, height: 80, borderRadius: 6 },
  classificationInfo: { flex: 1 },
  classificationLabel: { fontSize: 12, color: '#666', marginBottom: 2 },
  classificationType: { fontSize: 14, fontWeight: '600', color: '#333', marginBottom: 6 },
  classificationConfidence: { fontSize: 13, color: '#4CAF50', marginBottom: 6 },
  observationSection: { borderTopWidth: 1, borderTopColor: '#f0f0f0', paddingTop: 12 },
  observationLabel: { fontSize: 13, color: '#333', marginBottom: 8 },
  observationInput: { borderWidth: 1, borderColor: '#e0e0e0', borderRadius: 6, padding: 8, fontSize: 14, textAlignVertical: 'top', minHeight: 60 },
  diagnosisSection: { backgroundColor: '#fff', marginHorizontal: 16, marginBottom: 16, borderRadius: 12, padding: 16 },
  diagnosisInput: { borderWidth: 1, borderColor: '#e0e0e0', borderRadius: 6, padding: 12, fontSize: 14, textAlignVertical: 'top', minHeight: 80 },
  inputError: { borderColor: '#f44336' },
  errorText: { fontSize: 12, color: '#f44336', marginTop: 4 },
  bottomSection: { backgroundColor: '#fff', padding: 16, borderTopWidth: 1, borderTopColor: '#e0e0e0' },
  saveButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#4CAF50', paddingVertical: 16, borderRadius: 12 },
  saveButtonDisabled: { backgroundColor: '#999' },
  saveButtonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
});