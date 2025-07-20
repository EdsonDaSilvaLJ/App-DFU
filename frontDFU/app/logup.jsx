import { useState } from 'react';
import { View, TextInput, Button, Alert, StyleSheet, Text, TouchableOpacity } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../config/firebase';
import { useRouter } from 'expo-router';
import { traduzErroLogup } from '../utils/firebaseErros';


// Componente de cadastro para profissionais de saúde
// Permite que médicos, enfermeiros e outros profissionais se cadastrem com informações específicas
export default function Logup() {
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [telefone, setTelefone] = useState('');
  const [cpf, setCpf] = useState(''); // Estado para CPF (opcional)
  const [tipoProfissional, setTipoProfissional] = useState('');
  const [crm, setCrm] = useState(''); // Estado para CRM ou COREN

  const router = useRouter();

  const handleSingUp = async () => {
    if (!nome || !email || !senha || !telefone || !tipoProfissional || !cpf) {
      Alert.alert('Erro', 'Preencha todos os campos obrigatórios');
      return;
    }

    // Validar CRM para médicos e enfermeiros
    if ((tipoProfissional === 'medico' || tipoProfissional === 'enfermeiro') && !crm) {
      Alert.alert('Erro', 'Preencha o registro profissional');
      return;
    }

    try {
      // Criar usuário no Firebase
      const userCredential = await createUserWithEmailAndPassword(auth, email, senha); //funcao CreateUserWithEmailAndPassword retorna a credential ja

      //qual diferenca de credential e token? A credential é o objeto que contém informações sobre o usuário autenticado, enquanto o token é uma string que representa a sessão do usuário e pode ser usada para autenticação em outras partes do sistema.

      // Obter token do usuário criado
      const token = await userCredential.user.getIdToken();

      //salvar no banco de dados faço um request para o servidor com as infos
      const response = await fetch('http://10.13.30.172:3000/logup', {
      method: 'POST',
      headers: {
        'Content-Type' : 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({
        nome,
        email,
        telefone,
        cpf,
        tipoProfissional,
        crm: crm || null // Se não tiver CRM, enviar null
      })
    });

    // se n der erro mas n for OK exibe
    // se for ok beleza, segue
    // se for erro é capturado pois está num try e ai gera interrupção e é capturado pelo catch

    if (!response.ok) {
      throw new Error('Erro ao salvar dados no servidor');
    }
      Alert.alert('Cadastro feito com sucesso!');
      router.replace('/home');
    } catch (error) {
      console.log(error.code);
      Alert.alert('Erro no cadastro', traduzErroLogup(error.code));
    }
  };



  return (
    <View style={styles.container}>
      <Text style={styles.title}>Cadastro Profissional de Saúde</Text>

      {/* Nome Completo */}
      <TextInput
        style={styles.input}
        placeholder="Nome Completo"
        value={nome}
        onChangeText={setNome}
      />

      {/* CPF (opcional) */}
      <TextInput
        style={styles.input}
        placeholder="CPF (opcional)"
        value={cpf}
        onChangeText={setCpf}
        keyboardType="numeric"
      />

      {/* E-mail */}
      <TextInput
        style={styles.input}
        placeholder="E-mail"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
      />

      {/* Senha */}
      <TextInput
        style={styles.input}
        placeholder="Senha"
        value={senha}
        onChangeText={setSenha}
        secureTextEntry={true}
      />

      {/* Tipo de Profissional */}
      <Picker
        selectedValue={tipoProfissional}
        style={styles.picker}
        onValueChange={(itemValue) => setTipoProfissional(itemValue)}>
        <Picker.Item label="Selecione o tipo de profissional" value="" />
        <Picker.Item label="Médico" value="medico" />
        <Picker.Item label="Enfermeiro" value="enfermeiro" />
        <Picker.Item label="Outro" value="outro" />
      </Picker>

      {/* Campo de CRM ou COREN */}
      {(tipoProfissional === 'medico' || tipoProfissional === 'enfermeiro') && (
        <TextInput
          style={styles.input}
          placeholder={tipoProfissional === 'medico' ? 'CRM' : 'COREN'}
          value={crm}
          onChangeText={setCrm}
          keyboardType="numeric"
        />
      )}

      {/* Telefone */}
      <TextInput
        style={styles.input}
        placeholder="Telefone"
        value={telefone}
        onChangeText={setTelefone}
        keyboardType="phone-pad"
      />

      {/* Botão de Cadastro */}
      <TouchableOpacity style={styles.button} onPress={handleSingUp}>
        <Text style={styles.buttonText}>Cadastrar</Text>
      </TouchableOpacity>

      {/* Link para Login */}
      <TouchableOpacity style={styles.loginLink} onPress={() => router.replace('/login')}>
        <Text style={styles.loginText}>Já tem uma conta? Faça login</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5', // Cor de fundo clara
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 30,
  },
  input: {
    width: '100%',
    padding: 15,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 10,
    fontSize: 16,
    backgroundColor: '#fff',
  },
  picker: {
    width: '100%',
    padding: 15,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 10,
    backgroundColor: '#fff',
  },
  button: {
    backgroundColor: '#007AFF',
    padding: 15,
    borderRadius: 10,
    width: '100%',
    alignItems: 'center',
    marginTop: 10,
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 18,
  },
  loginLink: {
    marginTop: 20,
    alignItems: 'center',
  },
  loginText: {
    color: '#007AFF',
    fontWeight: 'bold',
    fontSize: 16,
  },
});
