// models/Paciente.js
const mongoose = require('mongoose');
const { Schema, model } = mongoose;

const pacienteSchema = new Schema({
  nome: {
    type: String,
    required: true
  },
  cpf: {
    type: String,
    required: true,
    unique: true
  },
  dataNascimento: {
    type: Date,
    required: true
  },
  genero: {
    type: String,
    enum: ['masculino', 'feminino', 'outro'],
    required: true
  },
  telefone: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: false,
    unique: true,
    trim: true,
    sparse: true,
  },
  planoSaude: {
    type: String,
    default: null
  },
  endereco: {
    type: String,
    default: null
  },
  medicoId: {
    type: Schema.Types.ObjectId,
    ref: 'Profissional',
    required: true,
    index: true
  }
}, {
  timestamps: true,
  collection: 'pacientes'
});

module.exports = model('Paciente', pacienteSchema);
