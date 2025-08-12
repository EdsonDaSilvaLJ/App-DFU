// app/(tabs)/cadastrar.jsx
import React, { useState } from 'react';
import {
  View,
  Alert,
  StyleSheet,
  KeyboardAvoidingView,
  ScrollView,
  Platform,
  SafeAreaView,
  Text,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useForm, Controller } from 'react-hook-form';
import { getFirebaseToken } from '../../config/firebase';
import { COLORS, SPACING, TYPOGRAPHY } from '../../constants/Colors';
import API_CONFIG, { buildURL, makeAuthenticatedRequest } from '../../config/api'; // <-- Adicione esta linha (ajuste o caminho conforme necessário)


// ⭐ IMPORTAR COMPONENTES MODERNOS
import { ModernTextInput, SelectInput } from '../../components/Inputs';
import { PrimaryButton, SecondaryButton } from '../../components/Buttons';

export default function CadastrarPaciente() {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  // ⭐ CONFIGURAR useForm
  const {
    control,
    handleSubmit,
    formState: { errors, isValid },
    watch,
    reset
  } = useForm({
    mode: 'onChange',
    defaultValues: {
      nome: '',
      cpf: '',
      dataNascimento: '',
      genero: '',
      telefone: '',
      email: '',
      endereco: '',
      planoSaude: ''
    }
  });

  const watchAllFields = watch();

  // ⭐ FORMATAÇÃO AUTOMÁTICA
  const formatCPF = (text) => {
    const cleaned = text.replace(/\D/g, '');
    const match = cleaned.match(/^(\d{3})(\d{3})(\d{3})(\d{2})$/);
    if (match) {
      return `${match[1]}.${match[2]}.${match[3]}-${match[4]}`;
    }
    return cleaned;
  };

  const formatPhone = (text) => {
    const cleaned = text.replace(/\D/g, '');
    const match = cleaned.match(/^(\d{2})(\d{5})(\d{4})$/);
    if (match) {
      return `(${match[1]}) ${match[2]}-${match[3]}`;
    }
    return cleaned;
  };

  const formatDate = (text) => {
    const cleaned = text.replace(/\D/g, '');
    if (cleaned.length <= 2) return cleaned;
    if (cleaned.length <= 4) return `${cleaned.slice(0, 2)}/${cleaned.slice(2)}`;
    return `${cleaned.slice(0, 2)}/${cleaned.slice(2, 4)}/${cleaned.slice(4, 8)}`;
  };

  // ⭐ VALIDAÇÕES
  const validateNome = (nome) => {
    if (!nome?.trim()) return 'Nome é obrigatório';
    if (nome.length < 2) return 'Nome deve ter pelo menos 2 caracteres';
    return true;
  };

  const validateCPF = (cpf) => {
    const cleaned = cpf.replace(/\D/g, '');
    if (!cpf) return 'CPF é obrigatório';
    if (cleaned.length !== 11) return 'CPF deve ter 11 dígitos';
    return true;
  };

  const validateDate = (date) => {
    if (!date) return 'Data de nascimento é obrigatória';
    const dateRegex = /^\d{2}\/\d{2}\/\d{4}$/;
    if (!dateRegex.test(date)) return 'Data inválida (dd/mm/aaaa)';
    return true;
  };

  const validateGenero = (genero) => {
    if (!genero) return 'Gênero é obrigatório';
    return true;
  };

  const validateTelefone = (telefone) => {
    const cleaned = telefone.replace(/\D/g, '');
    if (!telefone) return 'Telefone é obrigatório';
    if (cleaned.length < 10) return 'Telefone inválido';
    return true;
  };

  const validateEmail = (email) => {
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return 'E-mail inválido';
    }
    return true;
  };

  // ⭐ OPÇÕES PARA GÊNERO
  const generoOptions = [
    { label: 'Masculino', value: 'masculino' },
    { label: 'Feminino', value: 'feminino' },
    { label: 'Outro', value: 'outro' },
  ];

  // ⭐ FUNÇÃO DE CADASTRO
  const onSubmit = async (data) => {
    try {
      setLoading(true);
      console.log('🔄 Iniciando cadastro de paciente...');

      // ⭐ VERIFICAR DADOS ANTES DE ENVIAR (usando data, não formData)
      console.log('📋 Dados do formulário:', {
        nome: data.nome,
        cpf: data.cpf,
        email: data.email || 'não informado',
        telefone: data.telefone,
        dataNascimento: data.dataNascimento
      });

      // ⭐ VERIFICAR TOKEN
      const token = await getFirebaseToken();
      console.log('🔑 Token obtido:', token ? 'OK' : 'ERRO');

      // ⭐ VERIFICAR URL
      const url = buildURL(API_CONFIG.ENDPOINTS.PACIENTES);
      console.log('🌐 URL para cadastro:', url);

      const response = await makeAuthenticatedRequest(
        url,
        {
          method: 'POST',
          body: JSON.stringify({
            nome: data.nome.trim(),
            cpf: data.cpf.replace(/\D/g, ''), // Só números
            dataNascimento: data.dataNascimento,
            genero: data.genero,              // ⭐ OBRIGATÓRIO
            telefone: data.telefone.replace(/\D/g, ''), // Só números
            email: data.email.trim() || null,
            endereco: data.endereco.trim() || null,
            planoSaude: data.planoSaude.trim() || null
          })
        },
        token
      );

      console.log('📊 Status da resposta:', response.status);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.log('❌ Erro do servidor:', errorData);
        throw new Error(errorData.message || `HTTP ${response.status}`);
      }


      Alert.alert(
        'Sucesso!',
        `Paciente ${data.nome} cadastrado com sucesso!`,
        [
          {
            text: 'OK',
            onPress: () => {
              reset();
              router.push('/(tabs)/home');
            }
          }
        ]
      );

    } catch (error) {
      console.error('Erro ao cadastrar paciente:', error);
      Alert.alert('Erro', `Não foi possível cadastrar o paciente: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // ⭐ VERIFICAR SE PODE CADASTRAR
  const canSubmit = watchAllFields.nome?.trim() &&
    watchAllFields.cpf &&
    watchAllFields.dataNascimento &&
    watchAllFields.genero &&
    watchAllFields.telefone &&
    isValid &&
    !loading;

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* ⭐ TÍTULO */}
          <View style={styles.titleSection}>
            <Text style={styles.title}>Novo Paciente</Text>
            <Text style={styles.subtitle}>Preencha os dados do paciente</Text>
          </View>

          {/* ⭐ SEÇÃO: DADOS PESSOAIS */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Dados Pessoais</Text>

            <Controller
              control={control}
              name="nome"
              rules={{ validate: validateNome }}
              render={({ field: { onChange, onBlur, value } }) => (
                <ModernTextInput
                  label="Nome Completo *"
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  placeholder="Digite o nome completo"
                  error={errors.nome?.message}
                  icon="person"
                  autoCapitalize="words"
                  returnKeyType="next"
                />
              )}
            />

            <Controller
              control={control}
              name="cpf"
              rules={{ validate: validateCPF }}
              render={({ field: { onChange, onBlur, value } }) => (
                <ModernTextInput
                  label="CPF *"
                  value={value}
                  onChangeText={(text) => onChange(formatCPF(text))}
                  onBlur={onBlur}
                  placeholder="000.000.000-00"
                  error={errors.cpf?.message}
                  icon="badge"
                  keyboardType="numeric"
                  maxLength={14}
                  returnKeyType="next"
                />
              )}
            />

            <Controller
              control={control}
              name="dataNascimento"
              rules={{ validate: validateDate }}
              render={({ field: { onChange, onBlur, value } }) => (
                <ModernTextInput
                  label="Data de Nascimento *"
                  value={value}
                  onChangeText={(text) => onChange(formatDate(text))}
                  onBlur={onBlur}
                  placeholder="dd/mm/aaaa"
                  error={errors.dataNascimento?.message}
                  icon="cake"
                  keyboardType="numeric"
                  maxLength={10}
                  returnKeyType="next"
                />
              )}
            />

            <Controller
              control={control}
              name="genero"
              rules={{ validate: validateGenero }}
              render={({ field: { onChange, value } }) => (
                <SelectInput
                  label="Gênero *"
                  value={value}
                  onValueChange={onChange}
                  items={generoOptions}
                  placeholder={{ label: 'Selecione o gênero', value: null }}
                  error={errors.genero?.message}
                />
              )}
            />
          </View>

          {/* ⭐ SEÇÃO: CONTATO */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Informações de Contato</Text>

            <Controller
              control={control}
              name="telefone"
              rules={{ validate: validateTelefone }}
              render={({ field: { onChange, onBlur, value } }) => (
                <ModernTextInput
                  label="Telefone *"
                  value={value}
                  onChangeText={(text) => onChange(formatPhone(text))}
                  onBlur={onBlur}
                  placeholder="(00) 00000-0000"
                  error={errors.telefone?.message}
                  icon="phone"
                  keyboardType="phone-pad"
                  maxLength={15}
                  returnKeyType="next"
                />
              )}
            />

            <Controller
              control={control}
              name="email"
              rules={{ validate: validateEmail }}
              render={({ field: { onChange, onBlur, value } }) => (
                <ModernTextInput
                  label="E-mail"
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  placeholder="exemplo@email.com"
                  error={errors.email?.message}
                  icon="email"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  returnKeyType="next"
                />
              )}
            />

            <Controller
              control={control}
              name="endereco"
              render={({ field: { onChange, onBlur, value } }) => (
                <ModernTextInput
                  label="Endereço"
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  placeholder="Rua, número, bairro, cidade"
                  icon="location-on"
                  multiline
                  returnKeyType="next"
                />
              )}
            />
          </View>

          {/* ⭐ SEÇÃO: INFORMAÇÕES ADICIONAIS */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Informações Adicionais</Text>

            <Controller
              control={control}
              name="planoSaude"
              render={({ field: { onChange, onBlur, value } }) => (
                <ModernTextInput
                  label="Plano de Saúde"
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  placeholder="Nome do plano de saúde"
                  icon="local-hospital"
                  returnKeyType="done"
                />
              )}
            />
          </View>

          {/* ⭐ BOTÕES */}
          <View style={styles.buttonSection}>
            <PrimaryButton
              title="Cadastrar Paciente"
              onPress={handleSubmit(onSubmit)}
              loading={loading}
              disabled={!canSubmit}
              icon="person-add"
              size="large"
            />

            <SecondaryButton
              title="Cancelar"
              onPress={() => router.replace('/(tabs)/home')}
              style={styles.cancelButton}
              disabled={loading}
            />
          </View>

          {/* ⭐ INDICADOR DE STATUS */}
          {Object.keys(errors).length > 0 && (
            <View style={styles.errorSummary}>
              <Text style={styles.errorSummaryText}>
                ❌ {Object.keys(errors).length} erro(s) encontrado(s)
              </Text>
            </View>
          )}

          {/* ⭐ ESPAÇADOR FINAL */}
          <View style={styles.bottomSpacer} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
  },
  titleSection: {
    marginBottom: SPACING.xl,
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: COLORS.text.primary,
    marginBottom: SPACING.xs,
  },
  subtitle: {
    fontSize: 16,
    color: COLORS.text.secondary,
    textAlign: 'center',
  },
  section: {
    marginBottom: SPACING.xl,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text.primary,
    marginBottom: SPACING.lg,
    paddingBottom: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  buttonSection: {
    marginTop: SPACING.lg,
    marginBottom: SPACING.xl,
  },
  cancelButton: {
    marginTop: SPACING.md,
  },
  errorSummary: {
    backgroundColor: COLORS.error + '10',
    padding: SPACING.md,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.error + '30',
    marginBottom: SPACING.lg,
  },
  errorSummaryText: {
    color: COLORS.error,
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
  },
  bottomSpacer: {
    height: SPACING.xxl,
  },
});