import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  Alert,
  StyleSheet,
  ActivityIndicator
} from 'react-native';
import { Camera } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import { useLocalSearchParams, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import API_CONFIG, { buildURL } from '../../../../config/api';

export default function NovaAnaliseIndex() {
  const { id: pacienteId } = useLocalSearchParams();

  // Estados
  const [originalImageUri, setOriginalImageUri] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [hasPermission, setHasPermission] = useState(null);

  useEffect(() => {
    requestCameraPermission();
    // Abre câmera automaticamente quando a página carrega
    setTimeout(() => {
      if (hasPermission) {
        abrirCameraAutomaticamente();
      }
    }, 500);
  }, [hasPermission]);

  const requestCameraPermission = async () => {
    const { status } = await Camera.requestCameraPermissionsAsync();
    setHasPermission(status === 'granted');
  };

  const abrirCameraAutomaticamente = async () => {
    try {
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: false,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setOriginalImageUri(result.assets[0].uri);
      } else {
        // Se usuário cancelar, volta para tela anterior
        router.back();
      }
    } catch (error) {
      console.error('Erro ao abrir câmera:', error);
      Alert.alert('Erro', 'Não foi possível abrir a câmera');
      router.back();
    }
  };

  const handleDetectUlcers = async () => {
    if (!originalImageUri) {
      Alert.alert('Erro', 'Nenhuma imagem capturada');
      return;
    }

    setIsProcessing(true);

    try {
      // ⭐ PREPARAR FORMDATA CORRETAMENTE
      const formData = new FormData();
      formData.append('file', {
        uri: originalImageUri,
        type: 'image/jpeg',
        name: 'ulcera_original.jpg',
      });

      const response = await fetch(
        buildURL(API_CONFIG.ENDPOINTS.DETECT_ULCERS),
        {
          method: 'POST',
          body: formData,
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      // ⭐ VERIFICAR ESTRUTURA CORRETA
      if (data.success && data.imagem_redimensionada && data.boxes) {
        console.log(`✅ Detectadas ${data.boxes.length} regiões`);

        router.push({
          pathname: `/paciente/${pacienteId}/nova-analise/edit-regions`,
          params: {
            id: pacienteId,
            imageBase64: data.imagem_redimensionada,
            boxes: JSON.stringify(data.boxes),
            imageInfo: JSON.stringify(data.dimensoes),
            originalUri: originalImageUri,
          },
        });
      } else {
        throw new Error(data.message || 'Falha na detecção de úlceras');
      }

    } catch (error) {
      console.error('Erro na detecção:', error);
      Alert.alert(
        'Erro na Detecção',
        'Não foi possível detectar úlceras na imagem. Tente novamente.',
        [
          { text: 'Tentar Novamente', onPress: () => setOriginalImageUri(null) },
          { text: 'Cancelar', onPress: () => router.back() }
        ]
      );
    } finally {
      setIsProcessing(false);
    }
  };

  const retakePhoto = () => {
    setOriginalImageUri(null);
    abrirCameraAutomaticamente();
  };

  if (hasPermission === null) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#2196F3" />
        <Text style={styles.loadingText}>Solicitando permissão da câmera...</Text>
      </View>
    );
  }

  if (hasPermission === false) {
    return (
      <View style={styles.container}>
        <Ionicons name="camera-off" size={64} color="#999" />
        <Text style={styles.errorText}>Sem acesso à câmera</Text>
        <Text style={styles.errorSubtext}>
          Por favor, conceda permissão para usar a câmera nas configurações do dispositivo.
        </Text>
        <TouchableOpacity style={styles.button} onPress={requestCameraPermission}>
          <Text style={styles.buttonText}>Tentar Novamente</Text>
        </TouchableOpacity>
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
        <Text style={styles.headerTitle}>Nova Análise</Text>
        <View style={styles.placeholder} />
      </View>

      {/* Conteúdo Principal */}
      <View style={styles.content}>
        {originalImageUri ? (
          <>
            {/* Imagem Capturada */}
            <View style={styles.imageContainer}>
              <Image source={{ uri: originalImageUri }} style={styles.capturedImage} />
              <TouchableOpacity style={styles.retakeButton} onPress={retakePhoto}>
                <Ionicons name="camera" size={20} color="#fff" />
                <Text style={styles.retakeText}>Tirar Nova Foto</Text>
              </TouchableOpacity>
            </View>

            {/* Instruções */}
            <View style={styles.instructionsContainer}>
              <Text style={styles.instructionsTitle}>Imagem Capturada!</Text>
              <Text style={styles.instructionsText}>
                Clique em Segmentar Úlceras para iniciar a análise automática da imagem.
              </Text>
            </View>

            {/* Botão de Segmentação */}
            <TouchableOpacity
              style={[styles.segmentButton, isProcessing && styles.segmentButtonDisabled]}
              onPress={handleDetectUlcers}
              disabled={isProcessing}
            >
              {isProcessing ? (
                <>
                  <ActivityIndicator size="small" color="#fff" style={{ marginRight: 8 }} />
                  <Text style={styles.segmentButtonText}>Analisando...</Text>
                </>
              ) : (
                <>
                  <Ionicons name="scan" size={20} color="#fff" style={{ marginRight: 8 }} />
                  <Text style={styles.segmentButtonText}>Segmentar Úlceras</Text>
                </>
              )}
            </TouchableOpacity>
          </>
        ) : (
          /* Estado Inicial - Aguardando Foto */
          <View style={styles.waitingContainer}>
            <Ionicons name="camera" size={80} color="#2196F3" />
            <Text style={styles.waitingTitle}>Capturando Imagem...</Text>
            <Text style={styles.waitingText}>
              A câmera será aberta automaticamente para capturar a imagem da úlcera.
            </Text>
            <TouchableOpacity style={styles.button} onPress={abrirCameraAutomaticamente}>
              <Ionicons name="camera" size={20} color="#fff" style={{ marginRight: 8 }} />
              <Text style={styles.buttonText}>Abrir Câmera</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Loading Overlay */}
      {isProcessing && (
        <View style={styles.loadingOverlay}>
          <View style={styles.loadingContent}>
            <ActivityIndicator size="large" color="#2196F3" />
            <Text style={styles.loadingTitle}>Detectando Úlceras...</Text>
            <Text style={styles.loadingSubtext}>
              Nossa IA está analisando a imagem para identificar regiões de interesse.
            </Text>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
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
    padding: 16,
  },
  imageContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  capturedImage: {
    width: '100%',
    height: 300,
    borderRadius: 8,
    marginBottom: 12,
  },
  retakeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#666',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 6,
    alignSelf: 'center',
  },
  retakeText: {
    color: '#fff',
    fontSize: 14,
    marginLeft: 4,
  },
  instructionsContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  instructionsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  instructionsText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  segmentButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2196F3',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    marginTop: 'auto',
  },
  segmentButtonDisabled: {
    backgroundColor: '#999',
  },
  segmentButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  waitingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  waitingTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
    marginTop: 16,
    marginBottom: 8,
  },
  waitingText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2196F3',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  errorText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginTop: 16,
    marginBottom: 8,
  },
  errorSubtext: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 24,
    paddingHorizontal: 32,
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingContent: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
    marginHorizontal: 32,
  },
  loadingTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginTop: 12,
    marginBottom: 8,
  },
  loadingSubtext: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
});