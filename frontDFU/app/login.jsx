import { useState } from 'react';
import { View, Text, Alert, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { auth } from '../config/firebase'
import { signInWithEmailAndPassword } from 'firebase/auth';
import { traduzErroLogin } from '../utils/firebaseErros';

export default function Login() {

  //var
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const router = useRouter(); //criado para ajudar



  const handleLogin = async () => {
    if (!email) {
      Alert.alert('Erro', 'Preencha com seu e-mail');
    }

    if (!senha) {
      Alert.alert('Erro', 'Digite sua senha')
    }

    try {
      await signInWithEmailAndPassword(auth, email, senha) // Funçao que tenta logar de acordo com firebase
      router.replace('/home');
    } catch (error) {
      console.log(error.code)
      Alert.alert('Erro no Login', traduzErroLogin(error.code))
    }
  };

  
  const goToSingUp = () => {
    router.replace('/logup')
  }


  return (
    <View style={styles.container}>
      <Text style={styles.title}>Login</Text>

      {/* Campo de e-mail */}
      <TextInput
        style={styles.input}
        placeholder="E-mail"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
      />

      {/* Campo de senha */}
      <TextInput
        style={styles.input}
        placeholder="Senha"
        value={senha}
        onChangeText={setSenha}
        secureTextEntry
      />

      {/* Botão de login */}
      <TouchableOpacity style={styles.button} onPress={handleLogin}>
        <Text style={styles.buttonText}>Entrar</Text>
      </TouchableOpacity>

      {/* Botão de cadastro */}
      <TouchableOpacity style={styles.registerButton} onPress={goToSingUp}>
        <Text style={styles.registerText}>Realizar cadastro</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    padding: 20,
  },
  title: {
    fontSize: 30,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 40,
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
  button: {
    width: '100%',
    padding: 15,
    backgroundColor: '#007AFF',
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 10,
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 18,
  },
  registerButton: {
    marginTop: 20,
    alignItems: 'center',
  },
  registerText: {
    color: '#007AFF',
    fontWeight: 'bold',
    fontSize: 16,
  },
});