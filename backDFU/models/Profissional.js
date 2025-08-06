// models/Profissional.js
const mongoose = require('mongoose');
const { Schema, model } = mongoose;

const profissionalSchema = new Schema({
  nome: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true,
    unique: true
  },
  cpf: {
    type: String,
    unique: true
  },
  telefone: {
    type: String,
    required: true
  },
  tipoProfissional: {
    type: String,
    required: true
  },
  crm: {
    type: String
  },
  firebaseUid: {
    type: String,
    required: true,
    unique: true
  }
}, {
  timestamps: true,
  collection: 'profissionais'
});

module.exports = model('Profissional', profissionalSchema);
