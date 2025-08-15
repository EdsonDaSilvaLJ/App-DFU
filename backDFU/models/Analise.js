// models/Analise.js
const mongoose = require('mongoose');
const { Schema, model } = mongoose;

const BoxSchema = new Schema({
  xMin:        { type: Number, required: true },
  yMin:        { type: Number, required: true },
  xMax:        { type: Number, required: true },
  yMax:        { type: Number, required: true },

  // classificação automática da subimagem
  classification: {
    label:      { type: String, required: true },
    confidence: { type: Number, required: true }
  },

  // diagnóstico/observação opcional para esta subimagem
  diagnosis:   { type: String }
}, { _id: false });

const analiseSchema = new Schema({
  medicoId:         { type: Schema.Types.ObjectId, ref: 'Profissional', required: true, index: true },
  pacienteId:       { type: Schema.Types.ObjectId, ref: 'Paciente',     required: true, index: true },
  originalImageUrl: { type: String, required: false, default: '' },               // URL da foto no Firebase Storage
  boxes:            { type: [BoxSchema], required: true },          // array com cada subimagem e classificação
  imageDiagnosis:   { type: String, required: true }                // diagnóstico/observação geral obrigatório
}, {
  timestamps: true,
  collection: 'analises'
});

module.exports = model('Analise', analiseSchema);
