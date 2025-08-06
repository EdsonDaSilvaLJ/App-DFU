// components/Cards.jsx
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { COLORS, SPACING, TYPOGRAPHY, BORDER_RADIUS } from '../constants/Colors';

// components/Cards.jsx
function calculateAge(birthDate) {
  const today = new Date();
  const birth = new Date(birthDate);
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  
  return age;
}

// Card moderno para pacientes
export function PatientCard({ patient, onPress, showAnalysisCount = true }) {
  const analysisCount = patient.analises?.length || 0;
  
  return (
    <TouchableOpacity style={styles.patientCard} onPress={onPress}>
      {/* Header do card */}
      <View style={styles.cardHeader}>
        <View style={styles.avatarContainer}>
          <MaterialIcons name="person" size={24} color={COLORS.primary} />
        </View>
        <View style={styles.patientInfo}>
          <Text style={styles.patientName}>{patient.nome}</Text>
          <Text style={styles.patientCpf}>CPF: {patient.cpf}</Text>
        </View>
        <MaterialIcons name="chevron-right" size={20} color={COLORS.text.disabled} />
      </View>

      {/* Footer com informações extras */}
      <View style={styles.cardFooter}>
        <View style={styles.infoTag}>
          <MaterialIcons name="cake" size={14} color={COLORS.secondary} />
          <Text style={styles.infoTagText}>
            {calculateAge(patient.dataNascimento)} anos
          </Text>
        </View>
        
        {showAnalysisCount && (
          <View style={styles.infoTag}>
            <MaterialIcons name="analytics" size={14} color={COLORS.accent} />
            <Text style={styles.infoTagText}>
              {analysisCount} análise{analysisCount !== 1 ? 's' : ''}
            </Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
}


const styles = StyleSheet.create({
  patientCard: {
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.large,
    padding: SPACING.lg,
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  avatarContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.primary + '15',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.md,
  },
  patientInfo: {
    flex: 1,
  },
  patientName: {
    ...TYPOGRAPHY.body,
    fontWeight: '600',
    marginBottom: 2,
  },
  patientCpf: {
    ...TYPOGRAPHY.caption,
  },
  cardFooter: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  infoTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.background,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
    borderRadius: BORDER_RADIUS.medium,
  },
  infoTagText: {
    ...TYPOGRAPHY.small,
    marginLeft: 4,
    fontWeight: '500',
  },
});


