// routes/profissionalRoute.js - VERSÃO FINAL
const express = require('express');
const router = express.Router();
const Profissional = require('../models/Profissional');
const authenticateToken = require('../middleware/auth');


router.get('/profile', authenticateToken, async (req, res) => {
  try {
    console.log('🔍 Verificando profissional:', req.firebaseUid);
    
    const profissional = await Profissional.findOne({ 
      firebaseUid: req.firebaseUid 
    });

    if (!profissional) {
      console.log('⚠️ Profissional não encontrado no MongoDB');
      return res.status(404).json({
        success: false,
        error: 'Profissional não encontrado',
        message: 'Complete seu cadastro para continuar',
        needsSync: true,
        action: 'redirect_to_sync'
      });
    }

    console.log('✅ Profissional encontrado:', profissional._id);
    
    res.json({
      success: true,
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
    console.error('❌ Erro ao verificar perfil:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor',
      message: 'Tente novamente em alguns instantes',
      needsSync: true // ⭐ EM CASO DE ERRO, ASSUMIR QUE PRECISA SYNC
    });
  }
});

module.exports = router;