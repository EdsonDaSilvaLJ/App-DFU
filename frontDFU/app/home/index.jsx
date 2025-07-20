import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, FlatList, StyleSheet, Image, ActivityIndicator, TouchableOpacity } from 'react-native';
import { auth, getFirebaseToken } from "../../config/firebase";
import { onAuthStateChanged } from 'firebase/auth';
import { useRouter } from 'expo-router';

export default function Home() {
  const [busca, setBusca] = useState('');
  const [pacientesTotais, setPacientesTotais] = useState([]);
  const [pacientesFiltrados, setPacientesFiltrados] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const router = useRouter();

  // Função para buscar pacientes do backend
  const buscarPacientes = async () => {
    try {
      const token = await getFirebaseToken(auth);
      const res = await fetch('http://192.168.0.18:3000/pacientes', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Erro na requisição: ' + res.status);
      const data = await res.json();
      setPacientesTotais(data);
      setPacientesFiltrados(data); // inicializa com todos
    } catch (error) {
      console.error('Erro ao buscar pacientes:', error);
    }
  };

  useEffect(() => {
    // Espera o Firebase carregar o usuário antes de buscar pacientes
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      //O onAuthStateChanged só executa o callback quando o usuário for detectado (ou quando o estado de autenticação mudar).
      if (user) {
        await buscarPacientes();
      }
      setCarregando(false);
    });
    return unsubscribe;
  }, []);


  // Função para filtrar pacientes (pura, pode testar isolado)
  const filtrarPacientes = (texto) => {
    const termo = texto.toLowerCase();
    return pacientesTotais.filter(
      p => (p.nome && p.nome.toLowerCase().includes(termo)) ||
        (p.cpf && p.cpf.includes(texto))
    );
  };

  // Chamada sempre que muda o texto de busca
  const handleBusca = (texto) => {
    setBusca(texto);
    setPacientesFiltrados(filtrarPacientes(texto));
  };

  // Navega para o perfil do paciente
  const navegarPerfil = (paciente) => {
    router.push(`/home/paciente/${paciente._id || paciente.id}`);
  };


  if (carregando) {
    return (
      <View style={styles.containerCarregando}>
        <ActivityIndicator size="large" color="#333" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.titulo}>Meus Pacientes</Text>
      <TextInput
        style={styles.input}
        placeholder="Buscar paciente"
        value={busca}
        onChangeText={handleBusca}
      />
      <FlatList
        data={pacientesFiltrados}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
            <TouchableOpacity 
            style={styles.itemPaciente} 
            onPress={() => navegarPerfil(item)}
          >
            {item.imagem && <Image source={{ uri: item.imagem }} style={styles.imagem} />}
            <View style={styles.infoContainer}>
              <Text style={styles.nome}>{item.nome}</Text>
              <Text style={styles.cpf}>{item.cpf}</Text>
            </View>
          </TouchableOpacity>
        )}
      />
    </View>
  );
}


const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 50,
    paddingHorizontal: 16,
    backgroundColor: '#fff',
  },
  containerCarregando: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  titulo: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  input: {
    height: 40,
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 10,
    marginBottom: 16,
  },
  itemPaciente: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f2f2f2',
    padding: 12,
    borderRadius: 8,
    marginBottom: 10,
  },
  imagem: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 12,
  },
  nome: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  cpf: {
    fontSize: 14,
    color: '#555',
  },
});
