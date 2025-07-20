import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { useState } from 'react';
import { getFirebaseToken } from '../../config/firebase';
import { useRouter } from 'expo-router';

export default function CadastrarPaciente() {
  const [nome, setNome] = useState('');
  const [cpf, setCpf] = useState('');
  const [dataNascimento, setDataNascimento] = useState('');
  const [genero, setGenero] = useState('');
  const [telefone, setTelefone] = useState('');
  const [email, setEmail] = useState('');
  const [planoSaude, setPlanoSaude] = useState('');
  const [endereco, setEndereco] = useState('');
  const router = useRouter();


  const handleCadastro = async () => {
    // Validar campos obrigatórios
    if (!nome || !cpf || !dataNascimento || !telefone) {
      Alert.alert('Erro', 'Preencha todos os campos obrigatórios!');
      return;
    }

    try {

      // se n tivesse a funçao getFirebaseToken, teria que importar o auth do firebase.js


      const token = await getFirebaseToken();
      if (!token) {
        Alert.alert('Erro', 'Usuário não autenticado. Faça login novamente.');
        return;
      }


      const response = fetch('http://10.13.30.172:3000/pacientes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` // Enviando o token de autenticação
        },
        body: JSON.stringify({
          nome,
          cpf,
          dataNascimento,
          genero,
          telefone,
          email,
          planoSaude: planoSaude || null, // Se não tiver plano de saúde, enviar null
          endereco: endereco || null // Se não tiver endereço, enviar null 

        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Erro ao cadastrar paciente.' + ' Tente novamente mais tarde.');
      }

      alert(`Cadastro bem sucedido!`,`Paciente ${nome} (CPF: ${cpf}) cadastrado com sucesso!`);
      router.back(); // Volta para a tela anterior após o cadastro
    }
    catch (error) {
      console.error('Erro ao cadastrar paciente:', error);
      Alert.alert('Erro', `Não foi possível cadastrar o paciente: ${error.message}`);
      return;
    }

  };

  return (
    <View style={styles.container}>
      <Text style={styles.titulo}>Cadastrar Novo Paciente</Text>

      {/* Nome completo */}
      <TextInput
        style={styles.input}
        placeholder="Nome Completo"
        value={nome}
        onChangeText={setNome}
      />

      {/* CPF */}
      <TextInput
        style={styles.input}
        placeholder="CPF"
        value={cpf}
        onChangeText={setCpf}
        keyboardType="numeric"
      />

      {/* Data de nascimento */}
      <TextInput
        style={styles.input}
        placeholder="Data de Nascimento (dd/mm/aaaa)"
        value={dataNascimento}
        onChangeText={setDataNascimento}
        keyboardType="numeric"
      />

      {/* Gênero */}
      <Picker
        selectedValue={genero}
        style={styles.picker}
        onValueChange={(itemValue) => setGenero(itemValue)}
      >
        <Picker.Item label="Selecione o Gênero" value="" />
        <Picker.Item label="Masculino" value="masculino" />
        <Picker.Item label="Feminino" value="feminino" />
        <Picker.Item label="Outro" value="outro" />
      </Picker>

      {/* Telefone */}
      <TextInput
        style={styles.input}
        placeholder="Telefone"
        value={telefone}
        onChangeText={setTelefone}
        keyboardType="phone-pad"
      />

      {/* Email */}
      <TextInput
        style={styles.input}
        placeholder="E-mail"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
      />

      {/* Endereço */}
      <TextInput
        style={styles.input}
        placeholder="Endereço (opcional)"
        value={endereco}
        onChangeText={setEndereco}
      />

      {/* Plano de saúde */}
      <TextInput
        style={styles.input}
        placeholder="Plano de Saúde (opcional)"
        value={planoSaude}
        onChangeText={setPlanoSaude}
      />

      {/* Botão de cadastro */}
      <TouchableOpacity style={styles.botao} onPress={handleCadastro}>
        <Text style={styles.textoBotao}>Cadastrar</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5', // Cor de fundo clara
  },
  titulo: {
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
  botao: {
    backgroundColor: '#007AFF',
    padding: 15,
    borderRadius: 10,
    width: '100%',
    alignItems: 'center',
    marginTop: 10,
  },
  textoBotao: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 18,
  },
});