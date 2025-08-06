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
import { auth } from '../../../../config/firebase'

const { width: screenWidth } = Dimensions.get('window');

export default function ResultsScreen() {
  const params = useLocalSearchParams();
  const pacienteId = params.id;
  const detectedImageBase64 = params.imageBase64;
  const boxes = JSON.parse(params.boxes);
  const imageInfo = JSON.parse(params.imageInfo);
  const originalUri = params.originalUri;

  // Estados
  const [isProcessing, setIsProcessing] = useState(true);
  const [classificacoes, setClassificacoes] = useState([]);
  const [subimagens, setSubimagens] = useState([]);
  const [isSaving, setIsSaving] = useState(false);

  // Form
  const { control, handleSubmit, getValues, formState: { errors } } = useForm({
    defaultValues: {
      diagnosticoGeral: '',
      observacoes: {},
    }
  });

  useEffect(() => {
    // Iniciar classificação automaticamente quando a tela carrega
    handleProceedToClassification();
  }, []);

  const handleProceedToClassification = async () => {
    setIsProcessing(true);

    try {
      // ⭐ ESTRUTURA CORRETA DOS DADOS
      const classificacaoData = {
        imagem_redimensionada: detectedImageBase64,
        boxes_finais: boxes,
        medico_id: 'current_medico_id', // ⭐ PEGAR DO AUTH
        paciente_id: pacienteId,
      };

      // ⭐ ENDPOINT CORRETO
      const response = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/api/classify-regions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(classificacaoData),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      if (data.success && data.resultados_classificacao) {
        setClassificacoes(data.resultados_classificacao);

        // ⭐ PROCESSAR SUBIMAGENS
        const subimagensGeradas = data.resultados_classificacao.map((resultado, index) => ({
          id: index,
          base64: resultado.subimagem,
          classificacao: resultado.classe_classificacao,
          confianca: resultado.confianca_classificacao,
          coordenadas: {
            xmin: resultado.xmin,
            ymin: resultado.ymin,
            xmax: resultado.xmax,
            ymax: resultado.ymax,
          }
        }));

        setSubimagens(subimagensGeradas);
      } else {
        throw new Error(data.message || 'Falha na classificação das regiões');
      }

    } catch (error) {
      console.error('Erro na classificação:', error);
      Alert.alert(
        'Erro na Classificação',
        'Não foi possível classificar as regiões. Tente novamente.',
        [
          { text: 'Tentar Novamente', onPress: handleProceedToClassification },
          { text: 'Voltar', onPress: () => router.back() }
        ]
      );
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSaveAnalysis = async (formData) => {
    setIsProcessing(true);

    try {
      // ⭐ ESTRUTURA CORRETA PARA O BACKEND
      const analiseData = {
        medico_id: auth.currentUser?.uid, // UID do Firebase
        paciente_id: pacienteId,
        imagem_original: detectedImageBase64,
        regioes_analisadas: classificacoes.map(regiao => ({
          coordenadas: {
            xmin: regiao.xmin,
            ymin: regiao.ymin,
            xmax: regiao.xmax,
            ymax: regiao.ymax
          },
          classificacao_ia: {
            classe: regiao.classe_classificacao,
            confianca: regiao.confianca_classificacao
          },
          diagnostico_medico: getValues(`observacoes.${classificacoes.indexOf(regiao)}`) || ''
        })),
        diagnostico_geral: getValues('diagnosticoGeral')
      };

      // ⭐ ENDPOINT CORRETO
      const response = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/api/save-analysis`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(analiseData),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      if (data.success) {
        Alert.alert(
          'Sucesso!',
          'Análise salva com sucesso',
          [
            {
              text: 'OK',
              onPress: () => router.push(`/paciente/${pacienteId}`)
            }
          ]
        );
      } else {
        throw new Error(data.message || 'Erro ao salvar análise');
      }

    } catch (error) {
      console.error('Erro ao salvar análise:', error);
      Alert.alert('Erro', 'Não foi possível salvar a análise. Tente novamente.');
    } finally {
      setIsProcessing(false);
    }
  };

  const getClassificationColor = (confianca) => {
    if (confianca >= 0.8) return '#4CAF50'; // Verde - Alta confiança
    if (confianca >= 0.6) return '#FF9800'; // Laranja - Média confiança
    return '#f44336'; // Vermelho - Baixa confiança
  };

  const getClassificationText = (confianca) => {
    if (confianca >= 0.8) return 'Alta';
    if (confianca >= 0.6) return 'Média';
    return 'Baixa';
  };

  if (isProcessing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2196F3" />
        <Text style={styles.loadingTitle}>Classificando Regiões...</Text>
        <Text style={styles.loadingText}>
          Nossa IA está analisando cada região identificada para fornecer classificações precisas.
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Resultados da Análise</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content}>
        {/* Imagem Original com Boxes */}
        <View style={styles.imageSection}>
          <Text style={styles.sectionTitle}>Imagem Analisada</Text>
          <View style={styles.imageContainer}>
            <Image
              source={{ uri: `data:image/jpeg;base64,${detectedImageBase64}` }}
              style={styles.mainImage}
              resizeMode="contain"
            />
            {/* Aqui você pode adicionar as boxes sobrepostas se necessário */}
          </View>
          <Text style={styles.imageInfo}>
            Dimensões: {imageInfo.width} x {imageInfo.height} pixels
          </Text>
          <Text style={styles.imageInfo}>
            Regiões analisadas: {classificacoes.length}
          </Text>
        </View>

        {/* Resultados das Classificações */}
        <View style={styles.resultsSection}>
          <Text style={styles.sectionTitle}>Classificações da IA</Text>
          {subimagens.map((subimagem, index) => (
            <View key={subimagem.id} style={styles.resultItem}>
              <View style={styles.resultHeader}>
                <Text style={styles.resultTitle}>Região {index + 1}</Text>
                <View style={[
                  styles.confidenceBadge,
                  { backgroundColor: getClassificationColor(subimagem.confianca) }
                ]}>
                  <Text style={styles.confidenceText}>
                    {getClassificationText(subimagem.confianca)}
                  </Text>
                </View>
              </View>

              <View style={styles.resultContent}>
                {/* Subimagem */}
                <View style={styles.subImageContainer}>
                  <Image
                    source={{ uri: `data:image/jpeg;base64,${subimagem.base64}` }}
                    style={styles.subImage}
                    resizeMode="cover"
                  />
                </View>

                {/* Informações da Classificação */}
                <View style={styles.classificationInfo}>
                  <Text style={styles.classificationLabel}>Classificação:</Text>
                  <Text style={styles.classificationType}>{subimagem.classificacao}</Text>

                  <Text style={styles.classificationLabel}>Confiança:</Text>
                  <Text style={styles.classificationConfidence}>
                    {(subimagem.confianca * 100).toFixed(1)}%
                  </Text>

                  <Text style={styles.classificationLabel}>Coordenadas:</Text>
                  <Text style={styles.classificationCoords}>
                    ({Math.round(subimagem.coordenadas.xmin)}, {Math.round(subimagem.coordenadas.ymin)}) -
                    ({Math.round(subimagem.coordenadas.xmax)}, {Math.round(subimagem.coordenadas.ymax)})
                  </Text>
                </View>
              </View>

              {/* Campo de Observação do Médico */}
              <View style={styles.observationSection}>
                <Text style={styles.observationLabel}>Observação do Médico (Opcional):</Text>
                <Controller
                  control={control}
                  name={`observacoes.${index}`}
                  render={({ field: { onChange, onBlur, value } }) => (
                    <TextInput
                      style={styles.observationInput}
                      placeholder="Adicione suas observações sobre esta região..."
                      multiline
                      numberOfLines={3}
                      value={value}
                      onBlur={onBlur}
                      onChangeText={onChange}
                    />
                  )}
                />
              </View>
            </View>
          ))}
        </View>

        {/* Diagnóstico Geral */}
        <View style={styles.diagnosisSection}>
          <Text style={styles.sectionTitle}>Diagnóstico Geral*</Text>
          <Controller
            control={control}
            name="diagnosticoGeral"
            rules={{ required: 'Diagnóstico geral é obrigatório' }}
            render={({ field: { onChange, onBlur, value } }) => (
              <TextInput
                style={[
                  styles.diagnosisInput,
                  errors.diagnosticoGeral && styles.inputError
                ]}
                placeholder="Digite o diagnóstico geral da análise..."
                multiline
                numberOfLines={4}
                value={value}
                onBlur={onBlur}
                onChangeText={onChange}
              />
            )}
          />
          {errors.diagnosticoGeral && (
            <Text style={styles.errorText}>{errors.diagnosticoGeral.message}</Text>
          )}
        </View>

        {/* Resumo da Análise */}
        <View style={styles.summarySection}>
          <Text style={styles.sectionTitle}>Resumo da Análise</Text>
          <View style={styles.summaryItem}>
            <Ionicons name="image-outline" size={20} color="#666" />
            <Text style={styles.summaryText}>
              {classificacoes.length} região(ões) analisada(s)
            </Text>
          </View>
          <View style={styles.summaryItem}>
            <Ionicons name="checkmark-circle-outline" size={20} color="#4CAF50" />
            <Text style={styles.summaryText}>
              {classificacoes.filter(c => c.confianca_classificacao >= 0.8).length} classificação(ões) com alta confiança
            </Text>
          </View>
          <View style={styles.summaryItem}>
            <Ionicons name="time-outline" size={20} color="#666" />
            <Text style={styles.summaryText}>
              Análise realizada em {new Date().toLocaleDateString('pt-BR')}
            </Text>
          </View>
        </View>
      </ScrollView>

      {/* Botão de Salvar */}
      <View style={styles.bottomSection}>
        <TouchableOpacity
          style={[styles.saveButton, isSaving && styles.saveButtonDisabled]}
          onPress={handleSubmit(handleSaveAnalysis)}
          disabled={isSaving}
        >
          {isSaving ? (
            <>
              <ActivityIndicator size="small" color="#fff" style={{ marginRight: 8 }} />
              <Text style={styles.saveButtonText}>Salvando...</Text>
            </>
          ) : (
            <>
              <Ionicons name="save-outline" size={20} color="#fff" style={{ marginRight: 8 }} />
              <Text style={styles.saveButtonText}>Salvar Análise</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f5f5f5',
    paddingHorizontal: 32,
  },
  loadingTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginTop: 16,
    marginBottom: 8,
  },
  loadingText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    lineHeight: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 60,
    paddingBottom: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
  },
  imageSection: {
    backgroundColor: '#fff',
    margin: 16,
    borderRadius: 12,
    padding: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  imageContainer: {
    alignItems: 'center',
    marginBottom: 8,
  },
  mainImage: {
    width: screenWidth - 64,
    height: (screenWidth - 64) * 0.75,
    borderRadius: 8,
  },
  imageInfo: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    marginBottom: 4,
  },
  resultsSection: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 12,
    padding: 16,
  },
  resultItem: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  resultHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  resultTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  confidenceBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  confidenceText: {
    fontSize: 12,
    color: '#fff',
    fontWeight: '500',
  },
  resultContent: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  subImageContainer: {
    marginRight: 12,
  },
  subImage: {
    width: 80,
    height: 80,
    borderRadius: 6,
  },
  classificationInfo: {
    flex: 1,
  },
  classificationLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 2,
  },
  classificationType: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 6,
  },
  classificationConfidence: {
    fontSize: 13,
    color: '#4CAF50',
    marginBottom: 6,
  },
  classificationCoords: {
    fontSize: 11,
    color: '#666',
  },
  observationSection: {
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    paddingTop: 12,
  },
  observationLabel: {
    fontSize: 13,
    color: '#333',
    marginBottom: 8,
  },
  observationInput: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 6,
    padding: 8,
    fontSize: 14,
    textAlignVertical: 'top',
    minHeight: 60,
  },
  diagnosisSection: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 12,
    padding: 16,
  },
  diagnosisInput: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 6,
    padding: 12,
    fontSize: 14,
    textAlignVertical: 'top',
    minHeight: 80,
  },
  inputError: {
    borderColor: '#f44336',
  },
  errorText: {
    fontSize: 12,
    color: '#f44336',
    marginTop: 4,
  },
  summarySection: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 12,
    padding: 16,
  },
  summaryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  summaryText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 8,
  },
  bottomSection: {
    backgroundColor: '#fff',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#4CAF50',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
  },
  saveButtonDisabled: {
    backgroundColor: '#999',
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});