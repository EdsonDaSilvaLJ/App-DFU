// app/login.jsx
import React, { useState } from 'react';
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
import { useForm, Controller } from 'react-hook-form';
import { auth } from '../config/firebase';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { traduzErroLogin } from '../utils/firebaseErros';
import { ModernTextInput } from '../components/Inputs';
import { PrimaryButton, SecondaryButton } from '../components/Buttons';

export default function Login() {
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
    mode: 'onChange', // Validação em tempo real
    defaultValues: {
      email: '',
      senha: ''
    }
  });

  // ⭐ OBSERVAR VALORES PARA DESABILITAR BOTÃO
  const watchEmail = watch('email');
  const watchSenha = watch('senha');

  // ⭐ REGRAS DE VALIDAÇÃO
  const emailRules = {
    required: {
      value: true,
      message: 'E-mail é obrigatório'
    },
    pattern: {
      value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
      message: 'E-mail inválido'
    }
  };

  const senhaRules = {
    required: {
      value: true,
      message: 'Senha é obrigatória'
    },
    minLength: {
      value: 6,
      message: 'Senha deve ter pelo menos 6 caracteres'
    }
  };

  // ⭐ FUNÇÃO DE LOGIN (chamada pelo handleSubmit)
  const onSubmit = async (data) => {
    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, data.email, data.senha);
      reset(); // Limpar formulário após sucesso
      router.replace('/(tabs)/home');
    } catch (err) {
      Alert.alert('Erro no Login', traduzErroLogin(err.code));
    } finally {
      setLoading(false);
    }
  };

  const goToSignUp = () => router.replace('/logup');

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      style={{ justifyContent: 'center', flex: 1 }}
    >
      <ScrollView
        keyboardShouldPersistTaps="always"
        bounces={false}
        contentContainerStyle={{ padding: 30, flexGrow: 1, justifyContent: 'center' }}
      >
        <View style={{
          marginVertical: 10, justifyContent: 'space-around' }}>
          {/* ⭐ CAMPO E-MAIL COM CONTROLLER */}
          <Controller
            control={control}
            name="email"
            rules={emailRules}
            render={({ field: { onChange, onBlur, value } }) => (
              <ModernTextInput
                label="E-mail"
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                placeholder="Digite seu e-mail"
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                error={errors.email?.message}
                returnKeyType="next"
              />
            )}
          />

          {/* ⭐ CAMPO SENHA COM CONTROLLER */}
          <Controller
            control={control}
            name="senha"
            rules={senhaRules}
            render={({ field: { onChange, onBlur, value } }) => (
              <ModernTextInput
                label="Senha"
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                placeholder="Digite sua senha"
                secureTextEntry
                error={errors.senha?.message}
                returnKeyType="done"
                onSubmitEditing={handleSubmit(onSubmit)} // ⭐ ENTER FAZ LOGIN
              />
            )}
          />
        </View>

        <View style={{ marginVertical: 10 , justifyContent: 'center'}}>
          {/* ⭐ BOTÃO USA handleSubmit */}
          <PrimaryButton
            style={{ marginVertical: 20 }}
            title="Login"
            onPress={handleSubmit(onSubmit)}
            loading={loading}
            disabled={!watchEmail?.trim() || !watchSenha || loading}
            icon="login"
            size="large"
          />

          <SecondaryButton
            style={{ marginVertical: 10 }}
            title="Criar conta"
            onPress={goToSignUp}
            disabled={loading}
          />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
