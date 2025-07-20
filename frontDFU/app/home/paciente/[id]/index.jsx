import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, Alert, ActivityIndicator, ScrollView, FlatList } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { getFirebaseToken, auth } from '../../../../config/firebase';

export default function PerfilPaciente() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const [paciente, setPaciente] = useState(null);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    buscarDadosPaciente();
  }, [id]);

  const buscarDadosPaciente = async () => {
    try {
      const token = await getFirebaseToken(auth);
      const response = await fetch(`http://192.168.0.18:3000/pacientes/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (!response.ok) throw new Error('Erro ao buscar paciente');

      const data = await response.json();
      setPaciente(data);
    } catch (error) {
      console.error('Erro ao buscar paciente:', error);
      Alert.alert('Erro', 'Não foi possível carregar os dados do paciente');
    } finally {
      setCarregando(false);
    }
  };

  const calcularIdade = (dataNascimento) => {
    const hoje = new Date();
    const nascimento = new Date(dataNascimento);
    let idade = hoje.getFullYear() - nascimento.getFullYear();
    const mesAtual = hoje.getMonth();
    const mesNascimento = nascimento.getMonth();

    if (mesAtual < mesNascimento || (mesAtual === mesNascimento && hoje.getDate() < nascimento.getDate())) {
      idade--;
    }
    return idade;
  };

  const navegarNovaAnalise = () => {
    router.push(`/home/paciente/${id}/nova-analise`);
  };

  const navegarDetalhesAnalise = (analise) => {
    router.push(`/home/paciente/${id}/${analise._id || analise.id}`);
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

  // const getStatusColor = (status) => {
  //   switch (status) {
  //     case 'concluida': return '#4CAF50';
  //     case 'analisando': return '#FF9800';
  //     case 'pendente': return '#2196F3';
  //     case 'erro': return '#F44336';
  //     default: return '#757575';
  //   }
  // };

  // const getGravidadeColor = (gravidade) => {
  //   switch (gravidade?.toLowerCase()) {
  //     case 'leve': return '#4CAF50';
  //     case 'moderada': return '#FF9800';
  //     case 'grave': return '#F44336';
  //     default: return '#757575';
  //   }
  // };

  if (carregando) {
    return (
      <View style={styles.containerCarregando}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  if (!paciente) {
    return (
      <View style={styles.containerCarregando}>
        <Text>Paciente não encontrado</Text>
      </View>
    );
  }

  const renderAnalise = ({ item }) => (
    <TouchableOpacity
      style={styles.cardAnalise}
      onPress={() => navegarDetalhesAnalise(item)}
    >
      <View style={styles.conteudoAnalise}>
        {/* Imagem da análise */}
        <Image source={{ uri: item.url }} style={styles.imagemAnalise} />

        {/* Informações básicas */}
        <View style={styles.infoAnalise}>
          <Text style={styles.dataAnalise}>
            {formatarData(item.dataUpload)}
          </Text>

          <Text style={styles.statusAnalise}>
            Status: {item.statusAnalise}
          </Text>

          {/* Placeholder para resultados futuros */}
          {item.resultadoAnalise && (
            <Text style={styles.resultadoPlaceholder}>
              Análise concluída
            </Text>
          )}
        </View>

        {/* Seta para indicar que é clicável */}
        <MaterialIcons name="chevron-right" size={24} color="#ccc" />
      </View>
    </TouchableOpacity>
  );

  return (
    <ScrollView style={styles.container}>
      {/* Header com botão voltar */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.botaoVoltar} onPress={() => router.back()}>
          <MaterialIcons name="arrow-back" size={24} color="#007AFF" />
        </TouchableOpacity>
        <Text style={styles.tituloHeader}>Perfil do Paciente</Text>
      </View>

      {/* PARTE 1: INFORMAÇÕES BÁSICAS */}
      <View style={styles.secao}>
        <Text style={styles.tituloSecao}>Informações Básicas</Text>

        <View style={styles.gridInfo}>
          <View style={styles.itemInfo}>
            <MaterialIcons name="person" size={20} color="#007AFF" />
            <View style={styles.textoInfo}>
              <Text style={styles.labelInfo}>Nome</Text>
              <Text style={styles.valorInfo}>{paciente.nome}</Text>
            </View>
          </View>

          <View style={styles.itemInfo}>
            <MaterialIcons name="cake" size={20} color="#007AFF" />
            <View style={styles.textoInfo}>
              <Text style={styles.labelInfo}>Idade</Text>
              <Text style={styles.valorInfo}>
                {calcularIdade(paciente.dataNascimento)} anos
              </Text>
            </View>
          </View>

          <View style={styles.itemInfo}>
            <MaterialIcons name="wc" size={20} color="#007AFF" />
            <View style={styles.textoInfo}>
              <Text style={styles.labelInfo}>Sexo</Text>
              <Text style={styles.valorInfo}>
                {paciente.genero.charAt(0).toUpperCase() + paciente.genero.slice(1)}
              </Text>
            </View>
          </View>

          <View style={styles.itemInfo}>
            <MaterialIcons name="phone" size={20} color="#007AFF" />
            <View style={styles.textoInfo}>
              <Text style={styles.labelInfo}>Telefone</Text>
              <Text style={styles.valorInfo}>{paciente.telefone}</Text>
            </View>
          </View>

          <View style={styles.itemInfo}>
            <MaterialIcons name="email" size={20} color="#007AFF" />
            <View style={styles.textoInfo}>
              <Text style={styles.labelInfo}>Email</Text>
              <Text style={styles.valorInfo}>{paciente.email}</Text>
            </View>
          </View>

          <View style={styles.itemInfo}>
            <MaterialIcons name="credit-card" size={20} color="#007AFF" />
            <View style={styles.textoInfo}>
              <Text style={styles.labelInfo}>CPF</Text>
              <Text style={styles.valorInfo}>{paciente.cpf}</Text>
            </View>
          </View>

          {paciente.planoSaude && (
            <View style={styles.itemInfo}>
              <MaterialIcons name="local-hospital" size={20} color="#007AFF" />
              <View style={styles.textoInfo}>
                <Text style={styles.labelInfo}>Plano de Saúde</Text>
                <Text style={styles.valorInfo}>{paciente.planoSaude}</Text>
              </View>
            </View>
          )}

          {paciente.endereco && (
            <View style={styles.itemInfo}>
              <MaterialIcons name="location-on" size={20} color="#007AFF" />
              <View style={styles.textoInfo}>
                <Text style={styles.labelInfo}>Endereço</Text>
                <Text style={styles.valorInfo}>{paciente.endereco}</Text>
              </View>
            </View>
          )}
        </View>
      </View>

      {/* PARTE 2: ANÁLISES DAS ÚLCERAS/LESÕES */}
      <View style={styles.secao}>
        <View style={styles.headerAnalises}>
          <Text style={styles.tituloSecao}>Análises das Lesões</Text>
          <TouchableOpacity style={styles.botaoNovaAnalise} onPress={navegarNovaAnalise}>
            <MaterialIcons name="add-a-photo" size={20} color="#fff" />
            <Text style={styles.textoBotaoNovaAnalise}>Nova Análise</Text>
          </TouchableOpacity>
        </View>

        {paciente.fotos && paciente.fotos.length > 0 ? (
          <FlatList
            data={paciente.fotos.slice().reverse()}
            renderItem={renderAnalise}
            keyExtractor={(item, index) => index.toString()}
            scrollEnabled={false}
            showsVerticalScrollIndicator={false}
          />
        ) : (
          <View style={styles.nenhumaAnalise}>
            <MaterialIcons name="photo-camera" size={48} color="#ccc" />
            <Text style={styles.textoNenhumaAnalise}>
              Nenhuma análise realizada ainda
            </Text>
            <Text style={styles.subtextoNenhumaAnalise}>
              Toque em Nova Análise para começar
            </Text>
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
  tituloHeader: {
    fontSize: 20,
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
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 20,
  },
  gridInfo: {
    gap: 15,
  },
  itemInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  textoInfo: {
    marginLeft: 15,
    flex: 1,
  },
  labelInfo: {
    fontSize: 12,
    color: '#666',
    marginBottom: 2,
  },
  valorInfo: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
  },
  headerAnalises: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  botaoNovaAnalise: {
    backgroundColor: '#007AFF',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 8,
  },
  textoBotaoNovaAnalise: {
    color: '#fff',
    fontWeight: 'bold',
    marginLeft: 5,
  },
  cardAnalise: {
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 15,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  headerAnalise: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  dataAnalise: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  conteudoAnalise: {
    flexDirection: 'row',
    marginBottom: 10,
  },
  imagemAnalise: {
    width: 80,
    height: 80,
    borderRadius: 8,
    marginRight: 15,
  },
  infoAnalise: {
    flex: 1,
  },
  labelAnalise: {
    fontSize: 12,
    color: '#666',
    marginBottom: 2,
  },
  valorAnalise: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
    marginBottom: 8,
  },
  gravidadeContainer: {
    marginBottom: 8,
  },
  gravidadeBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  gravidadeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  acoes: {
    alignItems: 'flex-end',
  },
  nenhumaAnalise: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  textoNenhumaAnalise: {
    fontSize: 16,
    color: '#666',
    marginTop: 15,
    marginBottom: 5,
  },
  subtextoNenhumaAnalise: {
    fontSize: 14,
    color: '#999',
  },
});