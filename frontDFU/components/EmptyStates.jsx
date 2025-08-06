import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { COLORS } from '../constants/Colors';
import { PrimaryButton } from './Buttons';

// components/EmptyStates.jsx
export function EmptyPatients({ onAddPatient }) {
  return (
    <View style={styles.emptyContainer}>
      <MaterialIcons name="people-outline" size={80} color={COLORS.text.placeholder} />
      <Text style={styles.emptyTitle}>Nenhum paciente encontrado</Text>
      <Text style={styles.emptySubtitle}>
        Comece cadastrando seu primeiro paciente
      </Text>
      <PrimaryButton
        title="Cadastrar Primeiro Paciente"
        onPress={onAddPatient}
        icon="person-add"
        style={styles.emptyButton}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.text.primary,
    marginTop: 12,
  },
  emptySubtitle: {
    fontSize: 14,
    color: COLORS.text.secondary,
    textAlign: 'center',
    marginTop: 4,
  },
  emptyButton: {
    marginTop: 16,
  },
});