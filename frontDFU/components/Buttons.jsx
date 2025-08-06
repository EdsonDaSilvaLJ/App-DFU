// components/Buttons.jsx
import React from 'react';
import { TouchableOpacity, Text, View, ActivityIndicator, StyleSheet } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { COLORS, SPACING, TYPOGRAPHY, BORDER_RADIUS } from '../constants/Colors';

export function PrimaryButton({ 
  title, 
  onPress, 
  loading = false, 
  disabled = false, 
  icon = null,
  style = {},
  size = 'medium' // 'small', 'medium', 'large'
}) {
  const buttonStyle = [
    styles.primaryButton,
    styles[size],
    disabled && styles.disabled,
    style
  ];

  return (
    <TouchableOpacity 
      style={buttonStyle} 
      onPress={onPress} 
      disabled={disabled || loading}
      activeOpacity={0.8}
    >
      {loading ? (
        <ActivityIndicator size="small" color={COLORS.surface} />
      ) : (
        <View style={styles.buttonContent}>
          {icon && (
            <MaterialIcons 
              name={icon} 
              size={size === 'large' ? 24 : 20} 
              color={COLORS.surface} 
              style={styles.buttonIcon}
            />
          )}
          <Text style={[styles.primaryButtonText, styles[`${size}Text`]]}>
            {title}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

export function SecondaryButton({ title, onPress, icon, style = {} }) {
  return (
    <TouchableOpacity 
      style={[styles.secondaryButton, style]} 
      onPress={onPress}
      activeOpacity={0.8}
    >
      <View style={styles.buttonContent}>
        {icon && (
          <MaterialIcons 
            name={icon} 
            size={20} 
            color={COLORS.primary} 
            style={styles.buttonIcon}
          />
        )}
        <Text style={styles.secondaryButtonText}>{title}</Text>
      </View>
    </TouchableOpacity>
  );
}

export function FloatingActionButton({ onPress, icon = "add" }) {
  return (
    <TouchableOpacity style={styles.fab} onPress={onPress} activeOpacity={0.8}>
      <MaterialIcons name={icon} size={24} color={COLORS.surface} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  primaryButton: {
    backgroundColor: COLORS.primary,
    borderRadius: BORDER_RADIUS.medium,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  secondaryButton: {
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: COLORS.primary,
    borderRadius: BORDER_RADIUS.medium,
    justifyContent: 'center',
    alignItems: 'center',
  },
  small: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
  },
  medium: {
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
  },
  large: {
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.lg,
  },
  disabled: {
    backgroundColor: COLORS.text.disabled,
    shadowOpacity: 0,
    elevation: 0,
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  buttonIcon: {
    marginRight: SPACING.sm,
  },
  primaryButtonText: {
    color: COLORS.surface,
    fontWeight: '600',
  },
  secondaryButtonText: {
    color: COLORS.primary,
    fontWeight: '600',
  },
  smallText: {
    fontSize: 14,
  },
  mediumText: {
    fontSize: 16,
  },
  largeText: {
    fontSize: 18,
  },
  fab: {
    position: 'absolute',
    bottom: SPACING.xl,
    right: SPACING.lg,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
});