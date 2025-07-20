const mongoose = require('mongoose');

const profissionalSchema = new mongoose.Schema(
  {

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
    userId: {
      type: String,
      required: true,
      unique: true
    },

  }
  , {
    timestamps: true,
    collection: 'profissionais'
  });

module.exports = mongoose.model('Profissional', profissionalSchema);