const express = require('express');
const router = express.Router();
const autenticarFirebase = require('../middleware/auth');
const Profissional = require('../models/Profissional');


// POST - Criar profissional
router.post('/', autenticarFirebase, async (req, res) => {
  try {
    const { nome, cpf, email, telefone, tipoProfissional, crm } = req.body;
    
    const novoProfissional = new Profissional({
      nome,
      email,
      telefone,
      tipoProfissional,
      cpf,
      crm,
      userId: req.userId // UID do Firebase
    });

    await novoProfissional.save();
    res.status(201).json(novoProfissional);
  } catch (error) {
    res.status(400).json({ erro: 'Erro ao criar profissional', detalhes: error.message });
  }
});

module.exports = router;
