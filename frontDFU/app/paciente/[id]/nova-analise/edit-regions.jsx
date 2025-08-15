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

const { width: screenWidth } = Dimensions.get('window');

const MIN_BOX_SIZE = 20;
const HANDLE_SIZE = 24;
const SOURCE_IMAGE_DIM = 640; // A dimensão da imagem processada pela IA (640x640)

export default function EditRegionsScreen() {
  const params = useLocalSearchParams();
  const pacienteId = params.id;
  const detectedImageBase64 = params.imageBase64;
  const initialBoxes = JSON.parse(params.boxes);
  const imageInfo = JSON.parse(params.imageInfo);
  const originalUri = params.originalUri;

  // Estado para as caixas com coordenadas JÁ ESCALONADAS para a tela
  const [boxes, setBoxes] = useState([]);
  const [imageLayout, setImageLayout] = useState({ width: 0, height: 0 });
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedBoxId, setSelectedBoxId] = useState(null);
  const [isInteractingWithBox, setIsInteractingWithBox] = useState(false);

  const gestureStartState = useRef({ box: null }).current;

  // <-- CORREÇÃO PRINCIPAL: useEffect para escalonar as coordenadas iniciais -->
  useEffect(() => {
    // Roda apenas uma vez quando o layout da imagem é medido e as caixas ainda não foram processadas.
    if (imageLayout.width > 0 && initialBoxes.length > 0 && boxes.length === 0) {
      console.log('✅ Layout da imagem medido. Escalando coordenadas iniciais...');
      console.log(`Layout na tela: ${imageLayout.width.toFixed(2)} x ${imageLayout.height.toFixed(2)}`);
      
      const scaleX = imageLayout.width / SOURCE_IMAGE_DIM;
      const scaleY = imageLayout.height / SOURCE_IMAGE_DIM;

      console.log(`Fator de escala: X=${scaleX.toFixed(2)}, Y=${scaleY.toFixed(2)}`);

      const scaledBoxes = initialBoxes.map(box => {
        console.log(`Box Original (IA): xmin=${box.xmin}, ymin=${box.ymin}`);
        return {
          ...box,
          id: `ai_${Date.now()}_${Math.random()}`, // ID único e robusto
          xmin: box.xmin * scaleX,
          ymin: box.ymin * scaleY,
          xmax: box.xmax * scaleX,
          ymax: box.ymax * scaleY,
        };
      });
      
      console.log('📦 Caixas escalonadas para a tela:', scaledBoxes);
      setBoxes(scaledBoxes);
      // Seleciona a primeira caixa detectada automaticamente
      if (scaledBoxes.length > 0) {
        setSelectedBoxId(scaledBoxes[0].id);
      }
    }
  }, [imageLayout, initialBoxes]);


  const handleImageLayout = (event) => {
    const { width, height } = event.nativeEvent.layout;
    // Previne re-renders desnecessários se o layout não mudou
    if (width > 0 && (imageLayout.width !== width || imageLayout.height !== height)) {
      setImageLayout({ width, height });
    }
  };

  const handleAddBox = () => {
    if (!imageLayout.width) return;
    const newBox = {
      id: `manual_${Date.now()}`,
      // Coordenadas já estão no espaço da tela, não precisam de escala
      xmin: imageLayout.width * 0.25,
      ymin: imageLayout.height * 0.25,
      xmax: imageLayout.width * 0.75,
      ymax: imageLayout.height * 0.75,
      classe: 'nova_regiao',
      confianca: 1.0,
      isNew: true,
    };
    setBoxes(prev => [...prev, newBox]);
    setSelectedBoxId(newBox.id);
  };

  const handleRemoveBox = (boxId) => {
    Alert.alert('Remover Região', 'Tem certeza?',
      [ { text: 'Cancelar' }, { text: 'Remover', style: 'destructive', onPress: () => {
        setBoxes(prev => prev.filter((box) => box.id !== boxId));
        if (selectedBoxId === boxId) setSelectedBoxId(null);
      } } ]
    );
  };

  // Os PanResponders (mover e redimensionar) já operam no sistema de coordenadas da tela,
  // então eles continuam funcionando corretamente com as caixas escalonadas.
  // (Nenhuma mudança necessária neles)
  const createMovePanResponder = (boxId) =>
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {
        setSelectedBoxId(boxId);
        setIsInteractingWithBox(true);
        const currentBox = boxes.find(b => b.id === boxId);
        gestureStartState.box = { ...currentBox };
      },
      onPanResponderMove: (_, gestureState) => {
        const { dx, dy } = gestureState;
        const { box } = gestureStartState;
        if (!box) return;
        const boxWidth = box.xmax - box.xmin;
        const boxHeight = box.ymax - box.ymin;
        let newXmin = box.xmin + dx;
        let newYmin = box.ymin + dy;
        newXmin = Math.max(0, Math.min(newXmin, imageLayout.width - boxWidth));
        newYmin = Math.max(0, Math.min(newYmin, imageLayout.height - boxHeight));
        const newXmax = newXmin + boxWidth;
        const newYmax = newYmin + boxHeight;
        setBoxes(prev => prev.map(b => b.id === boxId ? { ...b, xmin: newXmin, ymin: newYmin, xmax: newXmax, ymax: newYmax } : b));
      },
      onPanResponderRelease: () => {
        setIsInteractingWithBox(false);
        gestureStartState.box = null;
      },
    });

  const createResizePanResponder = (boxId, handlePosition) =>
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {
        setSelectedBoxId(boxId);
        setIsInteractingWithBox(true);
        const currentBox = boxes.find(b => b.id === boxId);
        gestureStartState.box = { ...currentBox };
      },
      onPanResponderMove: (_, gestureState) => {
        const { dx, dy } = gestureState;
        const { box } = gestureStartState;
        if (!box) return;
        let { xmin, ymin, xmax, ymax } = box;
        if (handlePosition.includes('bottom')) ymax += dy;
        if (handlePosition.includes('top')) ymin += dy;
        if (handlePosition.includes('right')) xmax += dx;
        if (handlePosition.includes('left')) xmin += dx;
        if (xmin > xmax) [xmin, xmax] = [xmax, xmin];
        if (ymin > ymax) [ymin, ymax] = [ymax, ymin];
        if (xmax - xmin < MIN_BOX_SIZE) xmax = xmin + MIN_BOX_SIZE;
        if (ymax - ymin < MIN_BOX_SIZE) ymax = ymin + MIN_BOX_SIZE;
        xmin = Math.max(0, xmin);
        ymin = Math.max(0, ymin);
        xmax = Math.min(imageLayout.width, xmax);
        ymax = Math.min(imageLayout.height, ymax);
        setBoxes(prev => prev.map(b => b.id === boxId ? { ...b, xmin, ymin, xmax, ymax } : b));
      },
      onPanResponderRelease: () => {
        setIsInteractingWithBox(false);
        gestureStartState.box = null;
      },
    });


  const handleProceedToClassification = () => {
    if (boxes.length === 0) {
      Alert.alert('Atenção', 'Adicione pelo menos uma região para análise.');
      return;
    }
    setIsProcessing(true);

    // <-- IMPORTANTE: Desescalonar as coordenadas de volta para o espaço 640x640 antes de enviar -->
    const scaleX = imageLayout.width / SOURCE_IMAGE_DIM;
    const scaleY = imageLayout.height / SOURCE_IMAGE_DIM;

    const unscaledBoxes = boxes.map(box => ({
      ...box,
      xmin: Math.round(box.xmin / scaleX),
      ymin: Math.round(box.ymin / scaleY),
      xmax: Math.round(box.xmax / scaleX),
      ymax: Math.round(box.ymax / scaleY),
    }));
    
    console.log('📤 Enviando caixas desescalonadas para a próxima etapa:', unscaledBoxes);

    router.push({
      pathname: `/paciente/${pacienteId}/nova-analise/results`,
      params: {
        id: pacienteId,
        imageBase64: detectedImageBase64,
        boxes: JSON.stringify(unscaledBoxes), // Envia as caixas com as coordenadas corretas para a IA
        imageInfo: JSON.stringify(imageInfo),
        originalUri: originalUri,
      },
    });
  };

  const getBoxColor = (box) => {
    if (selectedBoxId === box.id) return '#2196F3';
    if (box.isNew) return '#FF9800';
    return '#4CAF50';
  };

  // O resto do componente (JSX) não precisa de grandes mudanças
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Editar Regiões</Text>
        <TouchableOpacity onPress={handleAddBox} style={styles.addButton}>
          <Ionicons name="add" size={24} color="#2196F3" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} scrollEnabled={!isInteractingWithBox}>
        <View style={styles.imageSection}>
          <Text style={styles.sectionTitle}>Imagem com Regiões Detectadas</Text>
          <View style={styles.imageContainer}>
            <Image
              source={{ uri: `data:image/jpeg;base64,${detectedImageBase64}` }}
              style={styles.mainImage}
              onLayout={handleImageLayout}
              resizeMode="contain"
            />
            {imageLayout.width > 0 && (
              <View style={[styles.boxOverlay, { width: imageLayout.width, height: imageLayout.height }]}>
                {boxes.map((box) => {
                  const boxWidth = box.xmax - box.xmin;
                  const boxHeight = box.ymax - box.ymin;
                  if (boxWidth <= 0 || boxHeight <= 0) return null;
                  const moveResponder = createMovePanResponder(box.id);
                  const color = getBoxColor(box);
                  return (
                    <View key={box.id} style={{ position: 'absolute', left: box.xmin, top: box.ymin, width: boxWidth, height: boxHeight }} {...moveResponder.panHandlers}>
                      <View style={[StyleSheet.absoluteFill, { borderColor: color, borderWidth: 2 }]} />
                      {selectedBoxId === box.id && (
                        <>
                          <View {...createResizePanResponder(box.id, 'top-left').panHandlers} style={[styles.resizeHandle, styles.topLeftHandle]}><View style={styles.handleInner} /></View>
                          <View {...createResizePanResponder(box.id, 'top-right').panHandlers} style={[styles.resizeHandle, styles.topRightHandle]}><View style={styles.handleInner} /></View>
                          <View {...createResizePanResponder(box.id, 'bottom-left').panHandlers} style={[styles.resizeHandle, styles.bottomLeftHandle]}><View style={styles.handleInner} /></View>
                          <View {...createResizePanResponder(box.id, 'bottom-right').panHandlers} style={[styles.resizeHandle, styles.bottomRightHandle]}><View style={styles.handleInner} /></View>
                        </>
                      )}
                      <TouchableOpacity style={[styles.removeButton, { backgroundColor: color }]} onPress={() => handleRemoveBox(box.id)}>
                        <Ionicons name="close" size={16} color="#fff" />
                      </TouchableOpacity>
                    </View>
                  );
                })}
              </View>
            )}
          </View>
        </View>

        <View style={styles.regionsSection}>
          <Text style={styles.sectionTitle}>Regiões Identificadas ({boxes.length})</Text>
          {boxes.map((box, index) => (
            <TouchableOpacity key={box.id} style={[styles.regionItem, selectedBoxId === box.id && styles.regionItemSelected]} onPress={() => setSelectedBoxId(box.id)}>
              <View style={styles.regionInfo}>
                <View style={[styles.colorIndicator, { backgroundColor: getBoxColor(box) }]} />
                <View>
                  <Text style={styles.regionTitle}>{box.isNew ? 'Nova Região' : `Região ${index + 1}`}</Text>
                  {box.confianca && !box.isNew && <Text style={styles.regionConfidence}>Confiança IA: {(box.confianca * 100).toFixed(1)}%</Text>}
                </View>
              </View>
              <TouchableOpacity style={styles.deleteButton} onPress={() => handleRemoveBox(box.id)}>
                <Ionicons name="trash-outline" size={20} color="#f44336" />
              </TouchableOpacity>
            </TouchableOpacity>
          ))}
        </View>
        <View style={styles.instructionsSection}>
          <Text style={styles.instructionsTitle}>Como Editar:</Text>
          <Text style={styles.instructionText}>• Toque e arraste o meio de uma região para movê-la.</Text>
          <Text style={styles.instructionText}>• Toque e arraste os cantos de uma região selecionada para redimensioná-la.</Text>
          <Text style={styles.instructionText}>• Use o botão + para adicionar nova região.</Text>
          <Text style={styles.instructionText}>• Toque no X para remover uma região.</Text>
        </View>
      </ScrollView>

      <View style={styles.bottomSection}>
        <TouchableOpacity style={[styles.continueButton, isProcessing && styles.continueButtonDisabled]} onPress={handleProceedToClassification} disabled={isProcessing}>
          <Ionicons name="arrow-forward" size={20} color="#fff" style={{ marginRight: 8 }} />
          <Text style={styles.continueButtonText}>Continuar para Classificação</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: 60, paddingBottom: 16, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#e0e0e0' },
  backButton: { padding: 8 },
  headerTitle: { fontSize: 18, fontWeight: '600', color: '#333' },
  addButton: { padding: 8 },
  content: { flex: 1 },
  imageSection: { backgroundColor: '#fff', margin: 16, borderRadius: 12, padding: 16 },
  sectionTitle: { fontSize: 16, fontWeight: '600', color: '#333', marginBottom: 12 },
  imageContainer: { position: 'relative', alignItems: 'center' },
  mainImage: { width: screenWidth - 64, height: (screenWidth - 64) * 0.75, borderRadius: 8 },
  boxOverlay: { position: 'absolute', top: 0, left: 0 },
  removeButton: { position: 'absolute', top: -12, right: -12, width: 24, height: 24, borderRadius: 12, alignItems: 'center', justifyContent: 'center', zIndex: 10 },
  resizeHandle: { position: 'absolute', width: HANDLE_SIZE, height: HANDLE_SIZE, justifyContent: 'center', alignItems: 'center', zIndex: 10 },
  handleInner: { width: 10, height: 10, backgroundColor: '#2196F3', borderColor: '#fff', borderWidth: 1.5, borderRadius: 5 },
  topLeftHandle: { top: -HANDLE_SIZE / 2, left: -HANDLE_SIZE / 2 },
  topRightHandle: { top: -HANDLE_SIZE / 2, right: -HANDLE_SIZE / 2 },
  bottomLeftHandle: { bottom: -HANDLE_SIZE / 2, left: -HANDLE_SIZE / 2 },
  bottomRightHandle: { bottom: -HANDLE_SIZE / 2, right: -HANDLE_SIZE / 2 },
  regionsSection: { backgroundColor: '#fff', marginHorizontal: 16, marginBottom: 16, borderRadius: 12, padding: 16 },
  regionItem: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 12, paddingHorizontal: 8, borderRadius: 8, marginBottom: 8 },
  regionItemSelected: { backgroundColor: '#e3f2fd' },
  regionInfo: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  colorIndicator: { width: 12, height: 12, borderRadius: 6, marginRight: 12 },
  regionTitle: { fontSize: 14, fontWeight: '600', color: '#333' },
  regionConfidence: { fontSize: 12, color: '#666' },
  deleteButton: { padding: 8 },
  instructionsSection: { backgroundColor: '#fff', marginHorizontal: 16, marginBottom: 16, borderRadius: 12, padding: 16 },
  instructionsTitle: { fontSize: 14, fontWeight: '600', color: '#333', marginBottom: 8 },
  instructionText: { fontSize: 13, color: '#666', marginBottom: 4 },
  bottomSection: { backgroundColor: '#fff', padding: 16, borderTopWidth: 1, borderTopColor: '#e0e0e0' },
  continueButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#2196F3', paddingVertical: 16, borderRadius: 12 },
  continueButtonDisabled: { backgroundColor: '#999' },
  continueButtonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
});