const express = require('express');
const router = express.Router();
const Profissional = require('../models/Profissional');
const authenticateToken = require('../middleware/auth');

// ⭐ VERIFICAR SE PROFISSIONAL EXISTE NO MONGODB
router.get('/profile', authenticateToken, async (req, res) => {
  try {
    const profissional = await Profissional.findOne({ 
      firebaseUid: req.profissional.uid 
    });

    if (!profissional) {
      return res.status(404).json({
        error: 'Profissional não encontrado',
        message: 'Dados não sincronizados com MongoDB'
      });
    }

    res.json({
      id: profissional._id,
      nome: profissional.nome,
      email: profissional.email,
      telefone: profissional.telefone,
      cpf: profissional.cpf,
      tipoProfissional: profissional.tipoProfissional,
      crm: profissional.crm,
      createdAt: profissional.createdAt,
      updatedAt: profissional.updatedAt
    });
  } catch (error) {
    console.error('Erro ao buscar perfil:', error);
    res.status(500).json({
      error: 'Erro interno do servidor',
      message: error.message
    });
  }
});

module.exports = router;