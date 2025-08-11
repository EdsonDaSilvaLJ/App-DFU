import React from 'react';
import {
  View,
  Alert,
  StyleSheet,
  KeyboardAvoidingView,
  ScrollView,
  Platform,
  Text
} from 'react-native';
import { useRouter } from 'expo-router';
import { auth } from '../config/firebase';
import { signOut } from 'firebase/auth';
import { useUserSync } from '../hooks/useUserSync';
import { ModernTextInput, SelectInput } from '../components/Inputs';
import { PrimaryButton, SecondaryButton } from '../components/Buttons';
import { PageHeader } from '../components/Headers';
import { COLORS, SPACING } from '../constants/Colors';

// React Hook Form
import { useForm, Controller } from 'react-hook-form';

export default function SyncProfile() {
  const router = useRouter();
  const { syncUserData } = useUserSync();

  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
    watch,
  } = useForm({
    defaultValues: {
      nome: auth.currentUser?.displayName || '',
      email: auth.currentUser?.email || '',
      telefone: '',
      cpf: '',
      tipoProfissional: '',
      crm: '',
    }
  });

  const tipoProfissionalValor = watch('tipoProfissional');

  const onSubmit = async (data) => {
    try {
      console.log('🔄 Iniciando re-cadastro...');

      // ⭐ VALIDAÇÃO DE CPF
      const cpfLimpo = data.cpf.replace(/\D/g, '');
      if (cpfLimpo.length !== 11) {
        Alert.alert('Erro', 'CPF deve conter 11 dígitos');
        return;
      }

      // ⭐ VALIDAÇÃO DE CRM (se necessário)
      if ((data.tipoProfissional === 'medico' || data.tipoProfissional === 'enfermeiro') && !data.crm?.trim()) {
        const tipoCrm = data.tipoProfissional === 'medico' ? 'CRM' : 'COREN';
        Alert.alert('Erro', `${tipoCrm} é obrigatório para ${data.tipoProfissional}s`);
        return;
      }

      const dadosCompletos = {
        nome: data.nome.trim(),
        telefone: data.telefone.replace(/\D/g, ''),
        cpf: cpfLimpo,
        tipoProfissional: data.tipoProfissional,
        crm: data.crm?.trim() || null,
      };

      const result = await syncUserData(dadosCompletos);

      if (result.success) {
        Alert.alert(
          'Sucesso!',
          'Seu cadastro foi completado com sucesso!',
          [
            {
              text: 'Continuar',
              onPress: () => router.replace('/(tabs)/home')
            }
          ]
        );
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      console.error('❌ Erro no re-cadastro:', error);
      Alert.alert(
        'Erro no Cadastro',
        error.message || 'Não foi possível completar o cadastro. Tente novamente.',
        [
          { text: 'Tentar Novamente' },
          {
            text: 'Fazer Logout',
            style: 'destructive',
            onPress: handleLogout
          }
        ]
      );
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      router.replace('/login');
    } catch (error) {
      console.error('Erro no logout:', error);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <PageHeader
        title="Completar Cadastro"
        showBack={false}
      />

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.messageContainer}>
          <Text style={styles.messageTitle}>
            🔄 Complete seu Cadastro
          </Text>
          <Text style={styles.messageText}>
            Sua conta foi criada com sucesso, mas precisamos completar
            seus dados profissionais para continuar.
          </Text>
        </View>

        {/* ⭐ NOME */}
        <Controller
          control={control}
          name="nome"
          rules={{
            required: 'Nome é obrigatório',
            minLength: {
              value: 2,
              message: 'Nome deve ter pelo menos 2 caracteres'
            }
          }}
          render={({ field: { onChange, value } }) => (
            <ModernTextInput
              label="Nome Completo"
              placeholder="Digite seu nome completo"
              value={value}
              onChangeText={onChange}
              error={errors.nome?.message}
              autoCapitalize="words"
            />
          )}
        />

        {/* ⭐ EMAIL (READONLY - do Firebase) */}
        <Controller
          control={control}
          name="email"
          render={({ field: { value } }) => (
            <ModernTextInput
              label="E-mail"
              placeholder="E-mail do Firebase"
              value={value}
              editable={false}
              style={styles.readonlyInput}
            />
          )}
        />

        {/* ⭐ TELEFONE */}
        <Controller
          control={control}
          name="telefone"
          rules={{
            required: 'Telefone é obrigatório',
            pattern: {
              value: /^\d{10,11}$/,
              message: 'Telefone deve ter 10 ou 11 dígitos'
            }
          }}
          render={({ field: { onChange, value } }) => (
            <ModernTextInput
              label="Telefone"
              placeholder="(11) 99999-9999"
              value={value}
              onChangeText={onChange}
              keyboardType="phone-pad"
              error={errors.telefone?.message}
            />
          )}
        />

        {/* ⭐ CPF */}
        <Controller
          control={control}
          name="cpf"
          rules={{
            required: 'CPF é obrigatório',
            pattern: {
              value: /^\d{11}$/,
              message: 'CPF deve conter 11 dígitos'
            }
          }}
          render={({ field: { onChange, value } }) => (
            <ModernTextInput
              label="CPF"
              placeholder="000.000.000-00"
              value={value}
              onChangeText={onChange}
              keyboardType="numeric"
              error={errors.cpf?.message}
            />
          )}
        />

        {/* ⭐ TIPO PROFISSIONAL */}
        <Controller
          control={control}
          name="tipoProfissional"
          rules={{ required: 'Selecione o tipo de profissional' }}
          render={({ field: { onChange, value } }) => (
            <SelectInput
              label="Tipo de Profissional"
              value={value}
              onValueChange={onChange}
              items={[
                { label: 'Selecione...', value: '' },
                { label: 'Médico', value: 'medico' },
                { label: 'Enfermeiro', value: 'enfermeiro' },
                { label: 'Outro', value: 'outro' },
              ]}
              error={errors.tipoProfissional?.message}
            />
          )}
        />

        {/* ⭐ CRM/COREN (se necessário) */}
        {(tipoProfissionalValor === 'medico' || tipoProfissionalValor === 'enfermeiro') && (
          <Controller
            control={control}
            name="crm"
            rules={{
              required: `${tipoProfissionalValor === 'medico' ? 'CRM' : 'COREN'} é obrigatório`,
              minLength: {
                value: 4,
                message: 'Número de registro inválido'
              }
            }}
            render={({ field: { onChange, value } }) => (
              <ModernTextInput
                label={tipoProfissionalValor === 'medico' ? 'CRM' : 'COREN'}
                placeholder={`Digite seu ${tipoProfissionalValor === 'medico' ? 'CRM' : 'COREN'}`}
                value={value}
                onChangeText={onChange}
                error={errors.crm?.message}
              />
            )}
          />
        )}

        <PrimaryButton
          title="Completar Cadastro"
          onPress={handleSubmit(onSubmit)}
          loading={isSubmitting}
          disabled={isSubmitting}
          size="large"
          style={styles.submitButton}
        />

        <SecondaryButton
          title="Fazer Logout"
          onPress={handleLogout}
          style={styles.logoutButton}
        />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

// app/sync-profile.jsx - APENAS MUDAR OS ESTILOS:

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    padding: SPACING.lg,
    paddingBottom: SPACING.xxl,
  },
  messageContainer: {
    backgroundColor: '#E3F2FD',
    padding: SPACING.lg,
    borderRadius: 12,
    marginBottom: SPACING.xl,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.info,
  },
  messageTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1976D2',
    marginBottom: SPACING.sm,
  },
  messageText: {
    fontSize: 14,
    color: '#1976D2',
    lineHeight: 20,
  },
  readonlyInput: {
    backgroundColor: '#f5f5f5',
    opacity: 0.7,
  },
  submitButton: {
    marginTop: SPACING.xl,
  },
  logoutButton: {
    marginTop: SPACING.md,
  },
});