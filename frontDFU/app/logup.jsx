import React from 'react';
import {
  View,
  Alert,
  StyleSheet,
  KeyboardAvoidingView,
  ScrollView,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { auth } from '../config/firebase';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { traduzErroLogup } from '../utils/firebaseErros';
import { ModernTextInput, SelectInput } from '../components/Inputs';
import { PrimaryButton, SecondaryButton } from '../components/Buttons';
import RNPickerSelect from 'react-native-picker-select';
import API_CONFIG, { makeAuthenticatedRequest, buildURL } from '../config/api';

// 1. Importa os hooks necessários do react-hook-form
import { useForm, Controller } from 'react-hook-form';

export default function Logup() {
  // 2. Inicializa o hook useForm, substituindo todos os hooks useState
  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
    watch, // O 'watch' permite observar o valor de um campo em tempo real
  } = useForm();

  const router = useRouter();

  // 3. A função watch é usada para saber o valor do campo 'tipoProfissional' em tempo real
  const tipoProfissionalValor = watch('tipoProfissional');

  // 4. A função de submissão recebe os dados validados como argumento
  const handleSignup = async (data) => {
    // Note que as validações manuais não são mais necessárias aqui
    // Elas são tratadas pelas regras no Controller

    // Lógica para criar o usuário no Firebase
    try {
      // Cria no Firebase
      const userCred = await createUserWithEmailAndPassword(auth, data.email, data.senha);
      const token = await userCred.user.getIdToken();

      // Envia à sua API
      const res = await makeAuthenticatedRequest(
        buildURL(API_CONFIG.ENDPOINTS.SIGNUP),
        {
          method: 'POST',
          body: JSON.stringify({
            nome: data.nome,
            email: data.email,
            telefone: data.telefone,
            cpf: data.cpf,
            tipoProfissional: data.tipoProfissional,
            crm: data.crm || null,
          })
        },
        token
      );
      if (!res.ok) throw new Error('Falha ao salvar no servidor');

      Alert.alert('Sucesso', 'Cadastro realizado com sucesso!');
      router.replace('/(tabs)home');

    } catch (err) {
      console.log(err.code || err.message);
      Alert.alert('Erro no cadastro', traduzErroLogup(err.code || err.message));
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
    >
      <ScrollView
        padding={20}
        marginBottom={25}
        marginTop={25}
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
      >
        {/* Usando Controller para cada campo */}
        <Controller
          control={control}
          name="nome"
          rules={{ required: 'Nome é obrigatório' }}
          render={({ field: { onChange, value } }) => (
            <ModernTextInput
              label="Nome Completo"
              placeholder="Digite seu nome"
              value={value}
              onChangeText={onChange}
              error={errors.nome?.message}
            />
          )}
        />
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
              placeholder="Digite seu CPF"
              value={value}
              onChangeText={onChange}
              keyboardType="numeric"
              error={errors.cpf?.message}
            />
          )}
        />
        <Controller
          control={control}
          name="email"
          rules={{
            required: 'E-mail é obrigatório',
            pattern: {
              value: /^\S+@\S+$/i,
              message: 'E-mail inválido'
            }
          }}
          render={({ field: { onChange, value } }) => (
            <ModernTextInput
              label="E-mail"
              placeholder="Digite seu e-mail"
              value={value}
              onChangeText={onChange}
              keyboardType="email-address"
              error={errors.email?.message}
            />
          )}
        />
        <Controller
          control={control}
          name="senha"
          rules={{
            required: 'Senha é obrigatória',
            minLength: {
              value: 6,
              message: 'A senha deve ter no mínimo 6 caracteres'
            }
          }}
          render={({ field: { onChange, value } }) => (
            <ModernTextInput
              label="Senha"
              placeholder="Digite sua senha"
              value={value}
              onChangeText={onChange}
              secureTextEntry
              error={errors.senha?.message}
            />
          )}
        />

        {/* Controller para o SelectInput / RNPickerSelect */}
        <Controller
          control={control}
          name="tipoProfissional"
          rules={{ required: 'O tipo de profissional é obrigatório' }}
          render={({ field: { onChange, value } }) => (
            <SelectInput
              label="Tipo de profissional"
              value={value}
              onValueChange={onChange} // onValueChange recebe a função do Controller
              items={[
                { label: 'Médico', value: 'medico' },
                { label: 'Enfermeiro', value: 'enfermeiro' },
                { label: 'Outro', value: 'outro' },
              ]}
              error={errors.tipoProfissional?.message}
            />
          )}
        />

        {/* Renderiza o campo CRM/COREN condicionalmente com base no valor de 'tipoProfissional' */}
        {(tipoProfissionalValor === 'medico' || tipoProfissionalValor === 'enfermeiro') && (
          <Controller
            control={control}
            name="crm"
            rules={{ required: 'O registro profissional é obrigatório' }}
            render={({ field: { onChange, value } }) => (
              <ModernTextInput
                label={tipoProfissionalValor === 'medico' ? 'CRM' : 'COREN'}
                placeholder={`Digite seu ${tipoProfissionalValor === 'medico' ? 'CRM' : 'COREN'}`}
                value={value}
                onChangeText={onChange}
                keyboardType="numeric"
                error={errors.crm?.message}
              />
            )}
          />
        )}
        <Controller
          control={control}
          name="telefone"
          rules={{
            required: 'Telefone é obrigatório',
            pattern: {
              value: /^\d{10,11}$/,
              message: 'Telefone inválido'
            }
          }}
          render={({ field: { onChange, value } }) => (
            <ModernTextInput
              label="Telefone"
              placeholder="Digite seu telefone"
              value={value}
              onChangeText={onChange}
              keyboardType="phone-pad"
              error={errors.telefone?.message}
            />
          )}
        />

        <PrimaryButton
          title="Cadastrar"
          onPress={handleSubmit(handleSignup)} // Conecta ao handleSubmit do hook
          loading={isSubmitting} // isSubmitting substitui o 'loading' do useState
          disabled={isSubmitting}
          size="large"
          style={{ marginTop: 20 }}
        />

        <SecondaryButton
          title="Já tenho conta"
          onPress={() => router.replace('/login')}
          style={{ marginTop: 12 }}
        />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  container: {
    paddingVertical: 20,
    paddingHorizontal: 10,
  },
  pickerWrapper: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 10,
    backgroundColor: '#fff',
    marginBottom: 15,
  },
});
