import {useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, Alert, ActivityIndicator, TextInput, ScrollView } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { getFirebaseToken, auth } from '../../../../config/firebase';

export default function NovaAnalise() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  
  const [etapa, setEtapa] = useState('camera');
  const [imagemCapturada, setImagemCapturada] = useState(null);
  const [resultadoIA, setResultadoIA] = useState(null);
  const [observacoesMedico, setObservacoesMedico] = useState('');
  const [processando, setProcessando] = useState(false);

  useEffect(() => { abrirCameraAutomaticamente(); }, []);

  const abrirCameraAutomaticamente = async () => {
    try {
      const permissionResult = await ImagePicker.requestCameraPermissionsAsync();
      if (!permissionResult.granted) {
        Alert.alert('Permissão Necessária', 'É necessário permitir o acesso à câmera para realizar a análise',
          [
            { text: 'Cancelar', onPress: () => router.back() },
            { text: 'Tentar Novamente', onPress: abrirCameraAutomaticamente }
          ]
        );
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.9,
      });

      if (!result.canceled) {
        setImagemCapturada(result.assets[0]);
        enviarParaAnaliseIA(result.assets[0]);
      } else {
        router.back();
      }
    } catch (error) {
      Alert.alert('Erro', 'Não foi possível abrir a câmera');
      router.back();
    }
  };

  const enviarParaAnaliseIA = async (imagem) => {
    setEtapa('analisando');
    setProcessando(true);

    try {
      const token = await getFirebaseToken(auth);

      const formData = new FormData();
      formData.append('foto', {
        uri: imagem.uri,
        type: 'image/jpeg',
        name: `lesao_${id}_${Date.now()}.jpg`,
      });
      formData.append('pacienteId', id);

      const response = await fetch('http://192.168.0.18:3000/pacientes/upload-foto', {
        method: 'POST',
        headers: {
          'Content-Type': 'multipart/form-data',
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      if (!response.ok) throw new Error('Erro ao enviar para análise');

      // Simular resultado IA
      const resultadoSimulado = {
        classificacao: 'Úlcera Diabética Grau 2',
        confianca: 87,
        gravidade: 'Moderada',
        recomendacoes: [
          'Limpeza diária com solução salina',
          'Aplicação de curativo hidrocoloide',
          'Reavaliação em 7 dias'
        ],
        detalhes: 'Lesão com bordas irregulares, presença de tecido de granulação, sem sinais de infecção aparente.'
      };

      setResultadoIA(resultadoSimulado);
      setEtapa('resultado');
    } catch (error) {
      Alert.alert(
        'Erro na Análise', 
        'Não foi possível analisar a imagem. Deseja tentar novamente?',
        [
          { text: 'Cancelar', onPress: () => router.back() },
          { text: 'Tentar Novamente', onPress: () => enviarParaAnaliseIA(imagem) }
        ]
      );
    } finally {
      setProcessando(false);
    }
  };

  const salvarAvaliacaoFinal = async () => {
    if (!observacoesMedico.trim()) {
      Alert.alert('Atenção', 'Por favor, escreva sua análise antes de finalizar.');
      return;
    }

    setProcessando(true);
    try {
      const token = await getFirebaseToken(auth);
      const avaliacaoFinal = {
        pacienteId: id,
        resultadoIA: resultadoIA,
        observacoesMedico: observacoesMedico,
        dataAvaliacao: new Date().toISOString()
      };

      const response = await fetch('http://192.168.0.18:3000/pacientes/salvar-avaliacao', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(avaliacaoFinal),
      });

      if (!response.ok) throw new Error('Erro ao salvar avaliação');

      Alert.alert(
        'Análise Concluída!',
        'A análise foi salva com sucesso.',
        [{ text: 'OK', onPress: () => router.back() }]
      );
    } catch (error) {
      Alert.alert('Erro', 'Não foi possível salvar a avaliação');
    } finally {
      setProcessando(false);
    }
  };

  // Etapa 1: Abrindo câmera
  if (etapa === 'camera') {
    return (
      <View style={styles.containerCarregando}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.textoCarregando}>Abrindo câmera...</Text>
      </View>
    );
  }

  // Etapa 2: Analisando imagem
  if (etapa === 'analisando') {
    return (
      <View style={styles.containerCarregando}>
        {imagemCapturada && <Image source={{ uri: imagemCapturada.uri }} style={styles.imagemAnalisando} />}
        <Text style={styles.tituloAnalise}>Sendo analisada pelos modelos de IA...</Text>
        <ActivityIndicator size="large" color="#007AFF" style={{ marginTop: 16 }} />
        <Text style={styles.subtextoCarregando}>Aguarde, isso pode levar alguns segundos.</Text>
      </View>
    );
  }

  // Etapa 3: Resultado + Avaliação Médica
  if (etapa === 'resultado') {
    return (
      <ScrollView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.botaoVoltar} onPress={() => router.back()}>
            <MaterialIcons name="arrow-back" size={24} color="#007AFF" />
          </TouchableOpacity>
          <Text style={styles.titulo}>Resultado da Análise</Text>
        </View>

        <View style={styles.secao}>
          <Text style={styles.tituloSecao}>Foto Capturada</Text>
          {imagemCapturada && <Image source={{ uri: imagemCapturada.uri }} style={styles.imagemCapturada} />}
        </View>

        <View style={styles.secao}>
          <Text style={styles.tituloSecao}>O modelo de IA obteve o seguinte resultado:</Text>

          <View style={styles.resultadoIA}>
            <View style={styles.itemResultado}>
              <Text style={styles.labelResultado}>Classificação:</Text>
              <Text style={styles.valorResultado}>{resultadoIA.classificacao}</Text>
            </View>

            <View style={styles.itemResultado}>
              <Text style={styles.labelResultado}>Confiança:</Text>
              <Text style={styles.valorResultado}>{resultadoIA.confianca}%</Text>
            </View>

            <View style={styles.itemResultado}>
              <Text style={styles.labelResultado}>Gravidade:</Text>
              <Text style={[styles.valorResultado, { color: getGravidadeColor(resultadoIA.gravidade) }]}>
                {resultadoIA.gravidade}
              </Text>
            </View>

            <View style={styles.detalhesContainer}>
              <Text style={styles.labelResultado}>Detalhes:</Text>
              <Text style={styles.detalhesTexto}>{resultadoIA.detalhes}</Text>
            </View>

            <View style={styles.recomendacoesContainer}>
              <Text style={styles.labelResultado}>Recomendações:</Text>
              {resultadoIA.recomendacoes.map((rec, index) => (
                <Text key={index} style={styles.recomendacaoItem}>• {rec}</Text>
              ))}
            </View>
          </View>
        </View>

        {/* Campo para o médico colocar a própria análise */}
        <View style={styles.secao}>
          <Text style={styles.tituloSecao}>Sua Análise Profissional</Text>
          <TextInput
            style={styles.inputObservacoes}
            placeholder="Descreva sua análise clínica sobre a lesão, evolução, sugestões, etc..."
            value={observacoesMedico}
            onChangeText={setObservacoesMedico}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
          />
        </View>

        {/* Botão Finalizar */}
        <TouchableOpacity
          style={[styles.botaoFinalizar, processando && styles.botaoDesabilitado]}
          onPress={salvarAvaliacaoFinal}
          disabled={processando}
        >
          {processando ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <>
              <MaterialIcons name="check" size={20} color="#fff" />
              <Text style={styles.textoBotaoFinalizar}>Finalizar Análise</Text>
            </>
          )}
        </TouchableOpacity>
      </ScrollView>
    );
  }

  function getGravidadeColor(gravidade) {
    switch (gravidade?.toLowerCase()) {
      case 'leve': return '#4CAF50';
      case 'moderada': return '#FF9800';
      case 'grave': return '#F44336';
      default: return '#757575';
    }
  }
}




const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
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
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  secaoImagem: {
    backgroundColor: '#fff',
    margin: 15,
    borderRadius: 12,
    padding: 20,
  },
  subtitulo: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  imagemContainer: {
    position: 'relative',
    alignItems: 'center',
    marginBottom: 20,
  },
  imagemPreview: {
    width: '100%',
    height: 200,
    borderRadius: 12,
    resizeMode: 'cover',
  },
  botaoRemover: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: 'rgba(244, 67, 54, 0.8)',
    borderRadius: 15,
    width: 30,
    height: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  areaCaptura: {
    height: 200,
    borderWidth: 2,
    borderColor: '#e0e0e0',
    borderStyle: 'dashed',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  textoCaptura: {
    color: '#ccc',
    marginTop: 10,
    fontSize: 16,
  },
  botoesCaptura: {
    flexDirection: 'row',
    gap: 15,
  },
  botaoCaptura: {
    flex: 1,
    backgroundColor: '#007AFF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
  },
  botaoGaleria: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#007AFF',
  },
  textoBotaoCaptura: {
    color: '#fff',
    fontWeight: 'bold',
    marginLeft: 8,
  },
  textoBotaoGaleria: {
    color: '#007AFF',
  },
  secaoObservacoes: {
    backgroundColor: '#fff',
    marginHorizontal: 15,
    marginBottom: 15,
    borderRadius: 12,
    padding: 20,
  },
  inputObservacoes: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    padding: 15,
    fontSize: 16,
    minHeight: 100,
  },
  botaoEnviar: {
    backgroundColor: '#4CAF50',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 15,
    marginBottom: 15,
    paddingVertical: 15,
    borderRadius: 12,
  },
  botaoDesabilitado: {
    backgroundColor: '#ccc',
  },
  textoBotaoEnviar: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  infoProcesso: {
    flexDirection: 'row',
    backgroundColor: '#f0f8ff',
    marginHorizontal: 15,
    marginBottom: 30,
    padding: 15,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#007AFF',
  },
  textoInfo: {
    flex: 1,
    marginLeft: 10,
    color: '#007AFF',
    fontSize: 14,
  },
});