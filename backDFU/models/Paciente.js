const mongoose = require('mongoose');

// Definindo o schema para o paciente
// Este schema define a estrutura dos documentos de pacientes no MongoDB
//mongoose.schema é usado para criar um modelo de dados
// que será utilizado para interagir com a coleção de pacientes no banco de dados.

const pacienteSchema = new mongoose.Schema(
  {
    nome: {
      type: String,
      required: true, // Nome obrigatório
    },
    cpf: {
      type: String,
      required: true,
      unique: true, // CPF deve ser único
    },
    dataNascimento: {
      type: Date,
      required: true, // Data de nascimento obrigatória
    },
    genero: {
      type: String,
      enum: ['masculino', 'feminino', 'outro'], // Gênero pode ser masculino, feminino ou outro
      required: true,
    },
    telefone: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
      unique: true, // E-mail único
    },
    planoSaude: {
      type: String, // Plano de saúde (opcional)
      default: null,
    },
    endereco: {
      type: String, // Endereço do paciente (opcional)
      default: null,
    },
    medicoId: {
      type: String,
      required: true, // UID do médico que cadastrou o paciente
    },
    
    //Array apenas com metadados das análises
    analises: [{

      _id:{
        type: mongoose.Schema.Types.ObjectId,
        default: new mongoose.Types.ObjectId() // Gera um ID único para cada foto
      },
      firebaseUrl: {
        type: String,
        required: true // URL do Firebase Storage
      },
      firebasePath: {
        type: String,
        required: true // Caminho no Firebase Storage
      },
      nomeArquivo: {
        type: String,
        required: true
      },
      dataUpload: {
        type: Date,
        default: Date.now
      },
      statusAnalise: {
        type: String,
        enum: ['pendente', 'analisando', 'concluida', 'erro'],
        default: 'pendente'
      },
      observacoes: {
        type: String,
        default: null
      },
      resultadoAnalise: {
        classificacao: String,
        confianca: Number,
        detalhes: String,
        // Metadados da análise apenas, não a imagem
        dataAnalise: Date
      }
    }]
  },
  {
    timestamps: true, // Adiciona os campos de createdAt e updatedAt
    collection: 'pacientes', // Nome da coleção no MongoDB
  }
);

// Exportando o modelo de paciente
module.exports = mongoose.model('Paciente', pacienteSchema);