import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  Image, 
  Alert, 
  ActivityIndicator,
  ScrollView 
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { getFirebaseToken, auth } from '../../../../../config/firebase';

export default function DetalhesAnalise() {
  const { id, analiseId } = useLocalSearchParams();
  const router = useRouter();
  const [analise, setAnalise] = useState(null);
  const [paciente, setPaciente] = useState(null);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    buscarDadosAnalise();
  }, [id, analiseId]);

  const buscarDadosAnalise = async () => {
    try {
      const token = await getFirebaseToken(auth);
      
      const response = await fetch(`http://192.168.0.18:3000/pacientes/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (!response.ok) throw new Error('Erro ao buscar paciente');
      
      const dadosPaciente = await response.json();
      setPaciente(dadosPaciente);
      
      if (dadosPaciente.analises) {
        const analiseEncontrada = dadosPaciente.analises.find(a => a._id === analiseId || a.id === analiseId);
        setAnalise(dadosPaciente.fotos[analiseId]);

      }
      
    } catch (error) {
      console.error('Erro ao buscar análise:', error);
      Alert.alert('Erro', 'Não foi possível carregar os dados da análise');
    } finally {
      setCarregando(false);
    }
  };

  const formatarData = (data) => {
    return new Date(data).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (carregando) {
    return (
      <View style={styles.containerCarregando}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  if (!analise || !paciente) {
    return (
      <View style={styles.containerCarregando}>
        <Text>Análise não encontrada</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.botaoVoltar} onPress={() => router.back()}>
          <MaterialIcons name="close" size={24} color="#007AFF" />
        </TouchableOpacity>
        <Text style={styles.titulo}>Análise - {paciente.nome}</Text>
      </View>

      {/* SEÇÃO: FOTO */}
      <View style={styles.secao}>
        <Text style={styles.tituloSecao}>Imagem Capturada</Text>
        <Image source={{ uri: analise.url }} style={styles.imagemLesao} />
        <Text style={styles.dataCaptura}>
          📅 {formatarData(analise.dataUpload)}
        </Text>
      </View>

      {/* SEÇÃO: ANÁLISE */}
      <View style={styles.secao}>
        <Text style={styles.tituloSecao}>Resultado da Análise</Text>
        
        <View style={styles.itemAnalise}>
          <Text style={styles.label}>Status:</Text>
          <Text style={styles.valor}>{analise.statusAnalise}</Text>
        </View>

        {/* Resultados da IA (quando houver) */}
        {analise.resultadoAnalise && (
          <>
            {analise.resultadoAnalise.classificacao && (
              <View style={styles.itemAnalise}>
                <Text style={styles.label}>Classificação:</Text>
                <Text style={styles.valor}>{analise.resultadoAnalise.classificacao}</Text>
              </View>
            )}

            {analise.resultadoAnalise.confianca && (
              <View style={styles.itemAnalise}>
                <Text style={styles.label}>Confiança:</Text>
                <Text style={styles.valor}>
                  {Math.round(analise.resultadoAnalise.confianca * 100)}%
                </Text>
              </View>
            )}
          </>
        )}

        {analise.observacoes && (
          <View style={styles.observacoes}>
            <Text style={styles.label}>Observações:</Text>
            <Text style={styles.textoObservacoes}>{analise.observacoes}</Text>
          </View>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  containerCarregando: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    paddingTop: 50,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  botaoVoltar: {
    marginRight: 15,
  },
  titulo: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  secao: {
    backgroundColor: '#fff',
    margin: 15,
    borderRadius: 12,
    padding: 20,
  },
  tituloSecao: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  imagemLesao: {
    width: '100%',
    height: 250,
    borderRadius: 12,
    marginBottom: 10,
  },
  dataCaptura: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  itemAnalise: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  label: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  valor: {
    fontSize: 14,
    color: '#333',
    fontWeight: 'bold',
  },
  observacoes: {
    marginTop: 15,
    padding: 15,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
  },
  textoObservacoes: {
    fontSize: 14,
    color: '#333',
    lineHeight: 20,
    marginTop: 5,
  },
});