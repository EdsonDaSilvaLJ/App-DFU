// components/Inputs.jsx
import React, { useState } from 'react';
import { View, TextInput, Text, TouchableOpacity, StyleSheet, useWindowDimensions, Platform, Modal, Pressable, FlatList } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { COLORS, SPACING, TYPOGRAPHY, BORDER_RADIUS } from '../constants/Colors';
import RNPickerSelect from 'react-native-picker-select';

export function ModernTextInput({
  label,
  value,
  onChangeText,
  placeholder,
  error = null,
  icon = null,
  secureTextEntry = false,
  keyboardType = 'default',
  multiline = false,
  ...props
}) {
  const [isFocused, setIsFocused] = useState(false);
  const [showPassword, setShowPassword] = useState(!secureTextEntry);

  const iconSize = useWindowDimensions().width * 0.06;

  return (
    <View style={stylesModernTextInput.inputContainer}>
      {label && <Text style={stylesModernTextInput.inputLabel}>{label}</Text>}

      <View style={[
        stylesModernTextInput.inputWrapper,
        isFocused && stylesModernTextInput.inputFocused,
        error && stylesModernTextInput.inputError
      ]}>
        {icon && (
          <MaterialIcons
            name={icon}
            size={20}
            color={isFocused ? COLORS.primary : COLORS.text.disabled}
            style={stylesModernTextInput.inputIcon}
          />
        )}

        <TextInput
          style={[stylesModernTextInput.textInput, multiline && stylesModernTextInput.multilineInput]}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={COLORS.text.placeholder}
          secureTextEntry={secureTextEntry && !showPassword}
          keyboardType={keyboardType}
          multiline={multiline}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          {...props}
        />

        {secureTextEntry && (
          <TouchableOpacity
            onPress={() => setShowPassword(!showPassword)}
            style={stylesModernTextInput.passwordToggle}
          >
            <MaterialIcons
              name={showPassword ? "visibility-off" : "visibility"}
              size={20}
              color={COLORS.text.disabled}
            />
          </TouchableOpacity>
        )}
      </View>

      {error && <Text style={stylesModernTextInput.errorText}>{error}</Text>}
    </View>
  );
}

const stylesModernTextInput = StyleSheet.create({
  inputContainer: {
    marginBottom: SPACING.lg,
  },
  inputLabel: {
    ...TYPOGRAPHY.caption,
    fontWeight: '600',
    marginBottom: SPACING.sm,
    color: COLORS.text.primary,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: BORDER_RADIUS.medium,
    paddingHorizontal: SPACING.md,
  },
  inputFocused: {
    borderColor: COLORS.primary,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  inputError: {
    borderColor: COLORS.error,
  },
  inputIcon: {
    marginRight: SPACING.sm,
  },
  textInput: {
    flex: 1,
    ...TYPOGRAPHY.body,
    paddingVertical: SPACING.md,
    color: COLORS.text.primary,
  },
  multilineInput: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  passwordToggle: {
    padding: SPACING.sm,
  },
  errorText: {
    ...TYPOGRAPHY.small,
    color: COLORS.error,
    marginTop: SPACING.xs,
  },
});




export function SearchBar({ value, onChangeText, placeholder = "Buscar..." }) {
  return (
    <View style={stylesSearchBar.searchContainer}>
      <MaterialIcons name="search" size={20} color={COLORS.text.disabled} />
      <TextInput
        style={stylesSearchBar.searchInput}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={COLORS.text.placeholder}
      />
      {value.length > 0 && (
        <TouchableOpacity onPress={() => onChangeText('')}>
          <MaterialIcons name="clear" size={20} color={COLORS.text.disabled} />
        </TouchableOpacity>
      )}
    </View>
  );
}

const stylesSearchBar = StyleSheet.create({
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.background,
    borderRadius: BORDER_RADIUS.large,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    gap: SPACING.sm,
  },
  searchInput: {
    flex: 1,
    ...TYPOGRAPHY.body,
    color: COLORS.text.primary,
  },
});



// ⭐ SELECT INPUT CUSTOMIZADO (sua versão melhorada)
export function SelectInput({
  label,
  value,
  onValueChange,
  items,
  placeholder = { label: 'Selecione…', value: null },
  error = null,
  style,
  ...props
}) {
  const [isModalVisible, setIsModalVisible] = useState(false);

  // Encontra o item selecionado para exibir o label correto
  const selectedItemLabel = items.find(item => item.value === value)?.label || placeholder.label;

  const handleSelect = (itemValue) => {
    onValueChange(itemValue);
    setIsModalVisible(false);
  };

  const renderItem = ({ item }) => (
    <Pressable
      style={({ pressed }) => [
        pickerStyles.optionItem,
        pressed && pickerStyles.optionItemPressed
      ]}
      onPress={() => handleSelect(item.value)}
    >
      <Text style={pickerStyles.optionText}>{item.label}</Text>
      {value === item.value && (
        <MaterialIcons
          name="check"
          size={20}
          color={COLORS.primary}
        />
      )}
    </Pressable>
  );

  return (
    <View style={[stylesInputLabel.wrapper, style]} {...props}>
      {label && <Text style={stylesInputLabel.label}>{label}</Text>}

      {/* ⭐ CAMPO CLICÁVEL */}
      <Pressable
        onPress={() => setIsModalVisible(true)}
        style={[
          pickerStyles.input,
          error && pickerStyles.inputError
        ]}
      >
        <Text style={[
          pickerStyles.inputTextStyle,
          { color: value ? COLORS.text.primary : COLORS.text.placeholder }
        ]}>
          {selectedItemLabel}
        </Text>
        <MaterialIcons
          name="keyboard-arrow-down"
          size={22}
          color={COLORS.text.disabled}
        />
      </Pressable>

      {/* ⭐ ERRO */}
      {error && <Text style={stylesInputLabel.errorText}>{error}</Text>}

      {/* ⭐ MODAL BOTTOM SHEET */}
      <Modal
        visible={isModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setIsModalVisible(false)}
      >
        <Pressable
          style={pickerStyles.modalOverlay}
          onPress={() => setIsModalVisible(false)}
        >
          <View style={pickerStyles.bottomSheetContainer}>
            {/* ⭐ HANDLE */}
            <View style={pickerStyles.bottomSheetHandle} />

            {/* ⭐ TÍTULO */}
            <Text style={pickerStyles.modalTitle}>
              {label || 'Selecione uma opção'}
            </Text>

            {/* ⭐ LISTA DE OPÇÕES */}
            <FlatList
              data={items}
              renderItem={renderItem}
              keyExtractor={item => item.value.toString()}
              style={pickerStyles.optionsList}
              showsVerticalScrollIndicator={false}
            />

            {/* ⭐ BOTÃO FECHAR */}
            <Pressable
              style={pickerStyles.closeButton}
              onPress={() => setIsModalVisible(false)}
            >
              <Text style={pickerStyles.closeButtonText}>Fechar</Text>
            </Pressable>
          </View>
        </Pressable>
      </Modal>
    </View>
  );
}


const stylesInputLabel = StyleSheet.create({
  wrapper: {
    marginBottom: SPACING.lg,
  },
  label: {
    ...TYPOGRAPHY.caption,
    fontWeight: '600',
    marginBottom: SPACING.sm,
    color: COLORS.text.primary,
  },
  errorText: {
    ...TYPOGRAPHY.small,
    color: COLORS.error,
    marginTop: SPACING.xs,
  },
});

const pickerStyles = StyleSheet.create({
  input: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: BORDER_RADIUS.medium,
    backgroundColor: COLORS.surface,
    minHeight: 48,
  },
  inputError: {
    borderColor: COLORS.error,
  },
  inputTextStyle: {
    ...TYPOGRAPHY.body,
    flex: 1,
    color: COLORS.text.primary,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  bottomSheetContainer: {
    backgroundColor: COLORS.surface,
    borderTopLeftRadius: BORDER_RADIUS.large,
    borderTopRightRadius: BORDER_RADIUS.large,
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.lg,
    maxHeight: '70%',
  },
  bottomSheetHandle: {
    width: 40,
    height: 4,
    backgroundColor: COLORS.border,
    borderRadius: BORDER_RADIUS.small,
    alignSelf: 'center',
    marginTop: SPACING.md,
    marginBottom: SPACING.lg,
  },
  modalTitle: {
    ...TYPOGRAPHY.heading3,
    fontWeight: '600',
    marginBottom: SPACING.lg,
    textAlign: 'center',
    color: COLORS.text.primary,
  },
  optionsList: {
    maxHeight: 300,
  },
  optionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.lg,
    borderRadius: BORDER_RADIUS.medium,
    marginBottom: SPACING.xs,
  },
  optionItemPressed: {
    backgroundColor: COLORS.background,
  },
  optionText: {
    ...TYPOGRAPHY.body,
    color: COLORS.text.primary,
    flex: 1,
  },
  closeButton: {
    backgroundColor: COLORS.primary,
    borderRadius: BORDER_RADIUS.medium,
    paddingVertical: SPACING.md,
    alignItems: 'center',
    marginTop: SPACING.lg,
  },
  closeButtonText: {
    ...TYPOGRAPHY.body,
    color: COLORS.surface,
    fontWeight: '600',
  },
});