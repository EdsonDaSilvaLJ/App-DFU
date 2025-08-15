import React, { useState, useRef } from 'react';
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

// <-- NOVO: Constantes para melhor controle
const MIN_BOX_SIZE = 20; // Tamanho mínimo da caixa em pixels
const HANDLE_SIZE = 24;  // Tamanho da área de toque das alças de redimensionamento

export default function EditRegionsScreen() {
  const params = useLocalSearchParams();
  const pacienteId = params.id;
  const detectedImageBase64 = params.imageBase64;
  const initialBoxes = JSON.parse(params.boxes);
  const imageInfo = JSON.parse(params.imageInfo);
  const originalUri = params.originalUri;

  // Estados
  const [boxes, setBoxes] = useState(
    initialBoxes.map((box, index) => ({ ...box, id: index }))
  );
  const [imageLayout, setImageLayout] = useState({ width: 0, height: 0 });
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedBoxId, setSelectedBoxId] = useState(null);
  
  // <-- NOVO: Estado para resolver o conflito de scroll (Problema 3)
  const [isInteractingWithBox, setIsInteractingWithBox] = useState(false);

  // Refs
  const lastBoxesState = useRef(boxes);
  lastBoxesState.current = boxes;

  const handleImageLayout = (event) => {
    const { width, height } = event.nativeEvent.layout;
    setImageLayout({ width, height });
  };

  const handleAddBox = () => {
    if (!imageLayout.width) return;
    const newBox = {
      id: Date.now(),
      xmin: imageLayout.width * 0.25,
      ymin: imageLayout.height * 0.25,
      xmax: imageLayout.width * 0.75,
      ymax: imageLayout.height * 0.75,
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
            setBoxes(boxes.filter((box) => box.id !== boxId));
            if (selectedBoxId === boxId) setSelectedBoxId(null);
          },
        },
      ]
    );
  };

  // <-- MODIFICADO: PanResponder para Mover a Caixa (Problema 3)
  const createMovePanResponder = (boxId) =>
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {
        setSelectedBoxId(boxId);
        setIsInteractingWithBox(true); // Desabilita o scroll da tela
      },
      onPanResponderMove: (_, gestureState) => {
        const { dx, dy } = gestureState;
        const originalBox = lastBoxesState.current.find((b) => b.id === boxId);
        if (!originalBox) return;

        const newXmin = originalBox.xmin + dx;
        const newYmin = originalBox.ymin + dy;
        const newXmax = originalBox.xmax + dx;
        const newYmax = originalBox.ymax + dy;

        // Limitar dentro da imagem
        if (newXmin < 0 || newXmax > imageLayout.width || newYmin < 0 || newYmax > imageLayout.height) {
          return;
        }

        setBoxes((prevBoxes) =>
          prevBoxes.map((box) =>
            box.id === boxId ? { ...box, xmin: newXmin, ymin: newYmin, xmax: newXmax, ymax: newYmax } : box
          )
        );
      },
      onPanResponderRelease: () => {
        setIsInteractingWithBox(false); // Reabilita o scroll da tela
      },
    });

  // <-- NOVO: PanResponder para Redimensionar a Caixa (Problema 2)
  const createResizePanResponder = (boxId, handlePosition) =>
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {
        setSelectedBoxId(boxId);
        setIsInteractingWithBox(true); // Desabilita o scroll da tela
      },
      onPanResponderMove: (_, gestureState) => {
        const { dx, dy } = gestureState;
        const originalBox = lastBoxesState.current.find((b) => b.id === boxId);
        if (!originalBox) return;

        let { xmin, ymin, xmax, ymax } = originalBox;

        if (handlePosition.includes('bottom')) ymax += dy;
        if (handlePosition.includes('top')) ymin += dy;
        if (handlePosition.includes('right')) xmax += dx;
        if (handlePosition.includes('left')) xmin += dx;

        // Garantir tamanho mínimo
        if (xmax - xmin < MIN_BOX_SIZE) {
          if (handlePosition.includes('right')) xmax = xmin + MIN_BOX_SIZE; else xmin = xmax - MIN_BOX_SIZE;
        }
        if (ymax - ymin < MIN_BOX_SIZE) {
          if (handlePosition.includes('bottom')) ymax = ymin + MIN_BOX_SIZE; else ymin = ymax - MIN_BOX_SIZE;
        }

        // Limitar dentro da imagem
        xmin = Math.max(0, xmin);
        ymin = Math.max(0, ymin);
        xmax = Math.min(imageLayout.width, xmax);
        ymax = Math.min(imageLayout.height, ymax);

        setBoxes((prevBoxes) =>
          prevBoxes.map((box) => (box.id === boxId ? { ...box, xmin, ymin, xmax, ymax } : box))
        );
      },
      onPanResponderRelease: () => {
        setIsInteractingWithBox(false); // Reabilita o scroll da tela
      },
    });

  const handleProceedToClassification = () => {
    if (boxes.length === 0) {
      Alert.alert('Atenção', 'Adicione pelo menos uma região para análise.');
      return;
    }
    setIsProcessing(true);
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
    if (selectedBoxId === box.id) return '#2196F3'; // Azul para selecionada
    if (box.isNew) return '#FF9800'; // Laranja para novas boxes
    return '#4CAF50'; // Verde para detectadas
  };

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

      {/* <-- MODIFICADO: Adicionado scrollEnabled (Problema 3) --> */}
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
                  const moveResponder = createMovePanResponder(box.id);
                  const color = getBoxColor(box);

                  // <-- MODIFICADO: Lógica de renderização das caixas (Problema 1 e 2) -->
                  return (
                    <View
                      key={box.id}
                      style={{
                        position: 'absolute',
                        left: box.xmin,
                        top: box.ymin,
                        width: boxWidth,
                        height: boxHeight,
                      }}
                      {...moveResponder.panHandlers}
                    >
                      {/* Borda Visível da Caixa */}
                      <View style={[StyleSheet.absoluteFill, { borderColor: color, borderWidth: 2, borderStyle: 'solid' }]} />
                      
                      {/* Alças de Redimensionamento, só aparecem se a caixa estiver selecionada */}
                      {selectedBoxId === box.id && (
                        <>
                          <View {...createResizePanResponder(box.id, 'top-left').panHandlers} style={[styles.resizeHandle, styles.topLeftHandle]}><View style={styles.handleInner} /></View>
                          <View {...createResizePanResponder(box.id, 'top-right').panHandlers} style={[styles.resizeHandle, styles.topRightHandle]}><View style={styles.handleInner} /></View>
                          <View {...createResizePanResponder(box.id, 'bottom-left').panHandlers} style={[styles.resizeHandle, styles.bottomLeftHandle]}><View style={styles.handleInner} /></View>
                          <View {...createResizePanResponder(box.id, 'bottom-right').panHandlers} style={[styles.resizeHandle, styles.bottomRightHandle]}><View style={styles.handleInner} /></View>
                        </>
                      )}

                      {/* Botão de remoção */}
                      <TouchableOpacity
                        style={[styles.removeButton, { backgroundColor: color }]}
                        onPress={() => handleRemoveBox(box.id)}
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

        <View style={styles.regionsSection}>
          <Text style={styles.sectionTitle}>Regiões Identificadas ({boxes.length})</Text>
          {boxes.map((box, index) => (
            <TouchableOpacity
              key={box.id || index}
              style={[styles.regionItem, selectedBoxId === box.id && styles.regionItemSelected]}
              onPress={() => setSelectedBoxId(box.id)}
            >
              <View style={styles.regionInfo}>
                <View style={[styles.colorIndicator, { backgroundColor: getBoxColor(box) }]} />
                <View>
                  <Text style={styles.regionTitle}>{box.isNew ? 'Nova Região' : `Região ${index + 1}`}</Text>
                  {box.confianca && <Text style={styles.regionConfidence}>Confiança IA: {(box.confianca * 100).toFixed(1)}%</Text>}
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


// <-- MODIFICADO E ADICIONADO: Novos estilos para as caixas e alças
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
  backButton: { padding: 8 },
  headerTitle: { fontSize: 18, fontWeight: '600', color: '#333' },
  addButton: { padding: 8 },
  content: { flex: 1 },
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
  imageContainer: { position: 'relative', alignItems: 'center' },
  mainImage: {
    width: screenWidth - 64,
    height: (screenWidth - 64) * 0.75,
    borderRadius: 8,
  },
  boxOverlay: { position: 'absolute', top: 0, left: 0 },
  removeButton: {
    position: 'absolute',
    top: -12,
    right: -12,
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  // Estilos para as alças de redimensionamento
  resizeHandle: {
    position: 'absolute',
    width: HANDLE_SIZE,
    height: HANDLE_SIZE,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  handleInner: {
    width: 10,
    height: 10,
    backgroundColor: '#2196F3',
    borderColor: '#fff',
    borderWidth: 1.5,
    borderRadius: 5,
  },
  topLeftHandle: { top: -HANDLE_SIZE / 2, left: -HANDLE_SIZE / 2 },
  topRightHandle: { top: -HANDLE_SIZE / 2, right: -HANDLE_SIZE / 2 },
  bottomLeftHandle: { bottom: -HANDLE_SIZE / 2, left: -HANDLE_SIZE / 2 },
  bottomRightHandle: { bottom: -HANDLE_SIZE / 2, right: -HANDLE_SIZE / 2 },
  // Fim dos estilos das alças
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
  regionItemSelected: { backgroundColor: '#e3f2fd' },
  regionInfo: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  colorIndicator: { width: 12, height: 12, borderRadius: 6, marginRight: 12 },
  regionTitle: { fontSize: 14, fontWeight: '600', color: '#333' },
  regionConfidence: { fontSize: 12, color: '#666' },
  deleteButton: { padding: 8 },
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
  instructionText: { fontSize: 13, color: '#666', marginBottom: 4 },
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
    borderRadius: 12,
  },
  continueButtonDisabled: { backgroundColor: '#999' },
  continueButtonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
});