import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  Alert,
  StyleSheet,
  ScrollView,
  Dimensions,
  PanResponder,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Svg, { Rect } from 'react-native-svg';

const { width: screenWidth } = Dimensions.get('window');

export default function EditRegionsScreen() {
  const params = useLocalSearchParams();
  const pacienteId = params.id;
  const detectedImageBase64 = params.imageBase64;
  const initialBoxes = JSON.parse(params.boxes);
  const imageInfo = JSON.parse(params.imageInfo);
  const originalUri = params.originalUri;

  // Estados
  const [boxes, setBoxes] = useState(initialBoxes.map((box, index) => ({ ...box, id: index })));
  const [imageLayout, setImageLayout] = useState({ width: 0, height: 0, x: 0, y: 0 });
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedBoxId, setSelectedBoxId] = useState(null);
  const [subimagens, setSubimagens] = useState([]);

  // Refs
  const imageRef = useRef(null);

  useEffect(() => {
    // Gerar subimagens quando boxes mudarem
    generateSubImages();
  }, [boxes, imageLayout]);

  const generateSubImages = () => {
    if (!imageLayout.width || !imageLayout.height) return;

    const newSubimagens = boxes.map((box, index) => ({
      id: box.id || index,
      box: box,
      // Em uma implementação real, você usaria uma biblioteca como react-native-image-crop-picker
      // ou faria o crop da imagem base64 usando canvas
      preview: detectedImageBase64, // Placeholder - seria a subimagem cropada
    }));

    setSubimagens(newSubimagens);
  };

  const handleImageLayout = (event) => {
    const { x, y, width, height } = event.nativeEvent.layout;
    setImageLayout({ x, y, width, height });
  };

  const handleAddBox = () => {
    const newBox = {
      id: Date.now(),
      xmin: imageLayout.width * 0.2,
      ymin: imageLayout.height * 0.2,
      xmax: imageLayout.width * 0.6,
      ymax: imageLayout.height * 0.6,
      classe: 'nova_regiao',
      confianca: 1.0,
      isNew: true,
    };

    setBoxes([...boxes, newBox]);
    setSelectedBoxId(newBox.id);
  };

  const handleRemoveBox = (boxId) => {
    Alert.alert(
      'Remover Região',
      'Tem certeza que deseja remover esta região?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Remover',
          style: 'destructive',
          onPress: () => {
            setBoxes(boxes.filter(box => box.id !== boxId));
            if (selectedBoxId === boxId) {
              setSelectedBoxId(null);
            }
          }
        }
      ]
    );
  };

  const createPanResponder = (boxId) => {
    return PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      
      onPanResponderGrant: () => {
        setSelectedBoxId(boxId);
      },

      onPanResponderMove: (event, gestureState) => {
        const { dx, dy } = gestureState;
        
        setBoxes(prevBoxes => 
          prevBoxes.map(box => {
            if (box.id === boxId) {
              const boxWidth = box.xmax - box.xmin;
              const boxHeight = box.ymax - box.ymin;
              
              let newXmin = box.xmin + dx;
              let newYmin = box.ymin + dy;
              
              // Limitar dentro da imagem
              newXmin = Math.max(0, Math.min(newXmin, imageLayout.width - boxWidth));
              newYmin = Math.max(0, Math.min(newYmin, imageLayout.height - boxHeight));
              
              return {
                ...box,
                xmin: newXmin,
                ymin: newYmin,
                xmax: newXmin + boxWidth,
                ymax: newYmin + boxHeight,
              };
            }
            return box;
          })
        );
      },

      onPanResponderRelease: () => {
        // Finalizar movimento
      },
    });
  };

  const handleProceedToClassification = () => {
    if (boxes.length === 0) {
      Alert.alert('Atenção', 'Adicione pelo menos uma região para análise.');
      return;
    }

    setIsProcessing(true);

    // Navegar para a próxima etapa
    router.push({
      pathname: `/paciente/${pacienteId}/nova-analise/results`,
      params: {
        id: pacienteId,
        imageBase64: detectedImageBase64,
        boxes: JSON.stringify(boxes),
        imageInfo: JSON.stringify(imageInfo),
        originalUri: originalUri,
      },
    });
  };

  const getBoxColor = (box) => {
    if (box.isNew) return '#FF9800'; // Laranja para novas boxes
    if (selectedBoxId === box.id) return '#2196F3'; // Azul para selecionada
    return '#4CAF50'; // Verde para detectadas
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Editar Regiões</Text>
        <TouchableOpacity onPress={handleAddBox} style={styles.addButton}>
          <Ionicons name="add" size={24} color="#2196F3" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        {/* Imagem com Boxes */}
        <View style={styles.imageSection}>
          <Text style={styles.sectionTitle}>Imagem com Regiões Detectadas</Text>
          <View style={styles.imageContainer}>
            <Image
              ref={imageRef}
              source={{ uri: `data:image/jpeg;base64,${detectedImageBase64}` }}
              style={styles.mainImage}
              onLayout={handleImageLayout}
              resizeMode="contain"
            />
            
            {/* Overlay com Boxes */}
            {imageLayout.width > 0 && (
              <View style={[styles.boxOverlay, { width: imageLayout.width, height: imageLayout.height }]}>
                <Svg
                  width={imageLayout.width}
                  height={imageLayout.height}
                  style={StyleSheet.absoluteFillObject}
                >
                  {boxes.map((box, index) => (
                    <Rect
                      key={box.id || index}
                      x={box.xmin}
                      y={box.ymin}
                      width={box.xmax - box.xmin}
                      height={box.ymax - box.ymin}
                      stroke={getBoxColor(box)}
                      strokeWidth={selectedBoxId === box.id ? 3 : 2}
                      fill="transparent"
                    />
                  ))}
                </Svg>
                
                {/* Handles interativos para as boxes */}
                {boxes.map((box, index) => {
                  const panResponder = createPanResponder(box.id || index);
                  return (
                    <View
                      key={`handle-${box.id || index}`}
                      {...panResponder.panHandlers}
                      style={[
                        styles.boxHandle,
                        {
                          left: box.xmin,
                          top: box.ymin,
                          width: box.xmax - box.xmin,
                          height: box.ymax - box.ymin,
                          borderColor: getBoxColor(box),
                          borderWidth: selectedBoxId === (box.id || index) ? 3 : 2,
                        }
                      ]}
                    >
                      {/* Botão de remoção */}
                      <TouchableOpacity
                        style={styles.removeButton}
                        onPress={() => handleRemoveBox(box.id || index)}
                      >
                        <Ionicons name="close" size={16} color="#fff" />
                      </TouchableOpacity>
                    </View>
                  );
                })}
              </View>
            )}
          </View>
        </View>

        {/* Lista de Regiões */}
        <View style={styles.regionsSection}>
          <Text style={styles.sectionTitle}>Regiões Identificadas ({boxes.length})</Text>
          {boxes.map((box, index) => (
            <TouchableOpacity
              key={box.id || index}
              style={[
                styles.regionItem,
                selectedBoxId === (box.id || index) && styles.regionItemSelected
              ]}
              onPress={() => setSelectedBoxId(box.id || index)}
            >
              <View style={styles.regionInfo}>
                <View style={[styles.colorIndicator, { backgroundColor: getBoxColor(box) }]} />
                <View style={styles.regionDetails}>
                  <Text style={styles.regionTitle}>
                    {box.isNew ? 'Nova Região' : `Região ${index + 1}`}
                  </Text>
                  <Text style={styles.regionCoords}>
                    Coordenadas: ({Math.round(box.xmin)}, {Math.round(box.ymin)}) - 
                    ({Math.round(box.xmax)}, {Math.round(box.ymax)})
                  </Text>
                  {box.confianca && (
                    <Text style={styles.regionConfidence}>
                      Confiança: {(box.confianca * 100).toFixed(1)}%
                    </Text>
                  )}
                </View>
              </View>
              <TouchableOpacity
                style={styles.deleteButton}
                onPress={() => handleRemoveBox(box.id || index)}
              >
                <Ionicons name="trash-outline" size={20} color="#f44336" />
              </TouchableOpacity>
            </TouchableOpacity>
          ))}
        </View>

        {/* Instruções */}
        <View style={styles.instructionsSection}>
          <Text style={styles.instructionsTitle}>Como Editar:</Text>
          <Text style={styles.instructionText}>• Toque e arraste uma região para movê-la</Text>
          <Text style={styles.instructionText}>• Use o botão + para adicionar nova região</Text>
          <Text style={styles.instructionText}>• Toque no X para remover uma região</Text>
          <Text style={styles.instructionText}>• Regiões em laranja são novas adições</Text>
        </View>
      </ScrollView>

      {/* Botão de Continuar */}
      <View style={styles.bottomSection}>
        <TouchableOpacity
          style={[styles.continueButton, isProcessing && styles.continueButtonDisabled]}
          onPress={handleProceedToClassification}
          disabled={isProcessing}
        >
          <Ionicons name="arrow-forward" size={20} color="#fff" style={{ marginRight: 8 }} />
          <Text style={styles.continueButtonText}>Continuar para Classificação</Text>
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
  addButton: {
    padding: 8,
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
    position: 'relative',
    alignItems: 'center',
  },
  mainImage: {
    width: screenWidth - 64,
    height: (screenWidth - 64) * 0.75,
    borderRadius: 8,
  },
  boxOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
  },
  boxHandle: {
    position: 'absolute',
    borderStyle: 'dashed',
  },
  removeButton: {
    position: 'absolute',
    top: -8,
    right: -8,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#f44336',
    alignItems: 'center',
    justifyContent: 'center',
  },
  regionsSection: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 12,
    padding: 16,
  },
  regionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 8,
    marginBottom: 8,
  },
  regionItemSelected: {
    backgroundColor: '#e3f2fd',
  },
  regionInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  colorIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 12,
  },
  regionDetails: {
    flex: 1,
  },
  regionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 2,
  },
  regionCoords: {
    fontSize: 12,
    color: '#666',
    marginBottom: 2,
  },
  regionConfidence: {
    fontSize: 12,
    color: '#4CAF50',
  },
  deleteButton: {
    padding: 8,
  },
  instructionsSection: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 12,
    padding: 16,
  },
  instructionsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  instructionText: {
    fontSize: 13,
    color: '#666',
    marginBottom: 4,
  },
  bottomSection: {
    backgroundColor: '#fff',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  continueButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2196F3',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
  },
  continueButtonDisabled: {
    backgroundColor: '#999',
  },
  continueButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});