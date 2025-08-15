// --- Início do arquivo: components/BoxEditor.jsx (CORRIGIDO) ---

import React, { useState, useRef, useLayoutEffect, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  StyleSheet,
  Dimensions,
  PanResponder,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

const MIN_BOX_SIZE = 30;
const HANDLE_SIZE = 30;

export default function BoxEditor({ visible, box, imageBase64, onSave, onCancel }) {
  // 1. CHAMAR TODOS OS HOOKS PRIMEIRO, INCONDICIONALMENTE
  const [editorBox, setEditorBox] = useState(box);
  const gestureStartState = useRef({ box: null }).current;
  const editorBoxRef = useRef(editorBox);

  useEffect(() => {
    // Sincroniza o estado interno se a prop 'box' mudar
    if (box) {
      setEditorBox(box);
    }
  }, [box]);

  useLayoutEffect(() => {
    editorBoxRef.current = editorBox;
  }, [editorBox]);
  
  // 2. AGORA FAZEMOS A VERIFICAÇÃO CONDICIONAL
  if (!visible || !box) {
    return null;
  }
  
  // O restante da lógica do componente permanece o mesmo...
  const createPanResponder = (type, handlePosition) => PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onPanResponderGrant: () => {
      gestureStartState.box = { ...editorBoxRef.current };
    },
    onPanResponderMove: (_, gestureState) => {
      const { dx, dy } = gestureState;
      const startBox = gestureStartState.box;
      if (!startBox) return;

      let { xmin, ymin, xmax, ymax } = startBox;

      if (type === 'move') {
        const boxWidth = xmax - xmin;
        const boxHeight = ymax - ymin;
        xmin += dx;
        ymin += dy;
        xmin = Math.max(0, Math.min(xmin, screenWidth - boxWidth));
        ymin = Math.max(0, Math.min(ymin, screenHeight - boxHeight));
        xmax = xmin + boxWidth;
        ymax = ymin + boxHeight;
      } else { // resize
        if (handlePosition.includes('bottom')) ymax += dy;
        if (handlePosition.includes('top')) ymin += dy;
        if (handlePosition.includes('right')) xmax += dx;
        if (handlePosition.includes('left')) xmin += dx;

        if (xmin > xmax) [xmin, xmax] = [xmax, xmin];
        if (ymin > ymax) [ymin, ymax] = [ymax, ymin];

        if (xmax - xmin < MIN_BOX_SIZE) xmax = xmin + MIN_BOX_SIZE;
        if (ymax - ymin < MIN_BOX_SIZE) ymax = ymin + MIN_BOX_SIZE;

        xmin = Math.max(0, xmin); ymin = Math.max(0, ymin);
        xmax = Math.min(screenWidth, xmax); ymax = Math.min(screenHeight, ymax);
      }
      setEditorBox({ ...editorBox, xmin, ymin, xmax, ymax });
    },
    onPanResponderRelease: () => {
      gestureStartState.box = null;
    },
  });

  const moveResponder = createPanResponder('move');
  const resizeResponders = {
    'top-left': createPanResponder('resize', 'top-left'),
    'top-right': createPanResponder('resize', 'top-right'),
    'bottom-left': createPanResponder('resize', 'bottom-left'),
    'bottom-right': createPanResponder('resize', 'bottom-right'),
  };

  return (
    <Modal visible={visible} transparent={true} animationType="fade">
      <View style={styles.editorContainer}>
        <Image
          source={{ uri: `data:image/jpeg;base64,${imageBase64}` }}
          style={styles.editorImage}
          resizeMode="contain"
        />
        <View style={styles.editorBoxOverlay}>
          {editorBox && (
            <View
              style={[styles.editorBox, {
                left: editorBox.xmin, top: editorBox.ymin,
                width: editorBox.xmax - editorBox.xmin,
                height: editorBox.ymax - editorBox.ymin,
              }]}
              {...moveResponder.panHandlers}
            >
              <View {...resizeResponders['top-left'].panHandlers} style={[styles.resizeHandle, styles.topLeftHandle]}><View style={styles.handleInner} /></View>
              <View {...resizeResponders['top-right'].panHandlers} style={[styles.resizeHandle, styles.topRightHandle]}><View style={styles.handleInner} /></View>
              <View {...resizeResponders['bottom-left'].panHandlers} style={[styles.resizeHandle, styles.bottomLeftHandle]}><View style={styles.handleInner} /></View>
              <View {...resizeResponders['bottom-right'].panHandlers} style={[styles.resizeHandle, styles.bottomRightHandle]}><View style={styles.handleInner} /></View>
            </View>
          )}
        </View>

        <View style={styles.editorControls}>
          <TouchableOpacity style={[styles.editorButton, styles.cancelButton]} onPress={onCancel}>
            <Ionicons name="close" size={24} color="#fff" />
            <Text style={styles.editorButtonText}>Cancelar</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.editorButton, styles.saveButton]} onPress={() => onSave(editorBox)}>
            <Ionicons name="checkmark" size={24} color="#fff" />
            <Text style={styles.editorButtonText}>Salvar Região</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  editorContainer: { flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'center', alignItems: 'center' },
  editorImage: { position: 'absolute', width: screenWidth, height: screenHeight },
  editorBoxOverlay: { position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' },
  editorBox: { position: 'absolute', borderWidth: 2, borderColor: '#FF9800' },
  resizeHandle: { position: 'absolute', width: HANDLE_SIZE, height: HANDLE_SIZE, justifyContent: 'center', alignItems: 'center', zIndex: 10 },
  handleInner: { width: 12, height: 12, backgroundColor: '#FF9800', borderColor: '#fff', borderWidth: 2, borderRadius: 6 },
  topLeftHandle: { top: -HANDLE_SIZE / 2, left: -HANDLE_SIZE / 2 },
  topRightHandle: { top: -HANDLE_SIZE / 2, right: -HANDLE_SIZE / 2 },
  bottomLeftHandle: { bottom: -HANDLE_SIZE / 2, left: -HANDLE_SIZE / 2 },
  bottomRightHandle: { bottom: -HANDLE_SIZE / 2, right: -HANDLE_SIZE / 2 },
  editorControls: { position: 'absolute', bottom: 40, left: 20, right: 20, flexDirection: 'row', justifyContent: 'space-around' },
  editorButton: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, paddingHorizontal: 24, borderRadius: 30 },
  editorButtonText: { color: '#fff', fontSize: 16, fontWeight: '600', marginLeft: 8 },
  cancelButton: { backgroundColor: '#f44336' },
  saveButton: { backgroundColor: '#4CAF50' },
});