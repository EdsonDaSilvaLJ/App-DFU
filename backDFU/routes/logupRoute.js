const express = require('express');
const router = express.Router();
const authenticateToken = require('../middleware/auth');
const Profissional = require('../models/Profissional');

// POST - Criar/Atualizar profissional
router.post('/', authenticateToken, async (req, res) => {
  try {
    console.log('📝 Cadastro/Sincronização - Firebase UID:', req.firebaseUid);
    console.log('📝 Dados recebidos:', req.body);

    const { nome, cpf, email, telefone, tipoProfissional, crm } = req.body;

    //VALIDAÇÕES OBRIGATÓRIAS (como no frontend)
    if (!nome?.trim()) {
      return res.status(400).json({
        success: false,
        erro: 'Nome é obrigatório',
        message: 'Nome é obrigatório'
      });
    }

    if (!email?.trim()) {
      return res.status(400).json({
        success: false,
        erro: 'E-mail é obrigatório', 
        message: 'E-mail é obrigatório'
      });
    }

    if (!telefone?.trim()) {
      return res.status(400).json({
        success: false,
        erro: 'Telefone é obrigatório',
        message: 'Telefone é obrigatório'
      });
    }

    if (!tipoProfissional) {
      return res.status(400).json({
        success: false,
        erro: 'Tipo de profissional é obrigatório',
        message: 'Selecione o tipo de profissional'
      });
    }

    //VALIDAÇÃO DE CPF
    const cpfLimpo = cpf?.replace(/\D/g, '') || '';
    if (cpfLimpo.length !== 11) {
      return res.status(400).json({
        success: false,
        erro: 'CPF inválido',
        message: 'CPF deve conter 11 dígitos'
      });
    }

    //VALIDAÇÃO DE EMAIL
    const emailRegex = /^\S+@\S+$/i;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        erro: 'E-mail inválido',
        message: 'Digite um e-mail válido'
      });
    }

    //VALIDAÇÃO DE TIPO PROFISSIONAL
    const tiposValidos = ['medico', 'enfermeiro', 'outro'];
    if (!tiposValidos.includes(tipoProfissional)) {
      return res.status(400).json({
        success: false,
        erro: 'Tipo de profissional inválido',
        message: 'Tipo deve ser: médico, enfermeiro ou outro'
      });
    }

    //VALIDAÇÃO DE CRM (obrigatório para médicos e enfermeiros)
    if ((tipoProfissional === 'medico' || tipoProfissional === 'enfermeiro') && !crm?.trim()) {
      const tipoCrm = tipoProfissional === 'medico' ? 'CRM' : 'COREN';
      return res.status(400).json({
        success: false,
        erro: `${tipoCrm} obrigatório`,
        message: `${tipoCrm} é obrigatório para ${tipoProfissional}s`
      });
    }

    //VERIFICAR DUPLICAÇÃO DE CPF (exceto próprio usuário)
    const cpfExistente = await Profissional.findOne({
      cpf: cpfLimpo,
      firebaseUid: { $ne: req.firebaseUid }
    });

    if (cpfExistente) {
      return res.status(409).json({
        success: false,
        erro: 'CPF já cadastrado',
        message: 'CPF já está em uso por outro profissional'
      });
    }

    //VERIFICAR SE JÁ EXISTE (RE-CADASTRO/SINCRONIZAÇÃO)
    let profissional = await Profissional.findOne({ 
      firebaseUid: req.firebaseUid 
    });

    const dadosProfissional = {
      nome: nome.trim(),
      email: email.toLowerCase().trim(),
      telefone: telefone.replace(/\D/g, ''),
      cpf: cpfLimpo,
      tipoProfissional,
      crm: crm?.trim() || null,
      firebaseUid: req.firebaseUid
    };

    if (profissional) {
      //ATUALIZAR EXISTENTE (SINCRONIZAÇÃO)
      console.log('🔄 Atualizando profissional existente...');
      
      profissional = await Profissional.findByIdAndUpdate(
        profissional._id,
        dadosProfissional,
        { new: true, runValidators: true }
      );

      console.log('✅ Profissional atualizado:', profissional._id);

      return res.status(200).json({
        success: true,
        message: 'Dados atualizados com sucesso',
        action: 'updated',
        profissional: {
          id: profissional._id,
          nome: profissional.nome,
          email: profissional.email,
          telefone: profissional.telefone,
          cpf: profissional.cpf,
          tipoProfissional: profissional.tipoProfissional,
          crm: profissional.crm
        }
      });
    }

    //CRIAR NOVO PROFISSIONAL
    console.log('🆕 Criando novo profissional...');
    
    const novoProfissional = new Profissional(dadosProfissional);
    await novoProfissional.save();

    console.log('✅ Profissional criado:', novoProfissional._id);

    res.status(201).json({
      success: true,
      message: 'Profissional cadastrado com sucesso',
      action: 'created',
      profissional: {
        id: novoProfissional._id,
        nome: novoProfissional.nome,
        email: novoProfissional.email,
        telefone: novoProfissional.telefone,
        cpf: novoProfissional.cpf,
        tipoProfissional: novoProfissional.tipoProfissional,
        crm: novoProfissional.crm
      }
    });

  } catch (error) {
    console.error('❌ Erro no cadastro:', error);

    //TRATAMENTO ESPECÍFICO DE ERROS MONGOOSE
    if (error.name === 'ValidationError') {
      return res.status(400).json({
        success: false,
        erro: 'Dados inválidos',
        message: 'Verifique os campos obrigatórios',
        detalhes: error.message
      });
    }

    if (error.code === 11000) {
      // Erro de duplicação (unique constraint)
      const campo = Object.keys(error.keyValue)[0];
      return res.status(409).json({
        success: false,
        erro: `${campo.toUpperCase()} já cadastrado`,
        message: `${campo.toUpperCase()} já está em uso`
      });
    }

    //ERRO GENÉRICO
    res.status(500).json({
      success: false,
      erro: 'Erro interno do servidor',
      message: 'Não foi possível processar o cadastro'
    });
  }
});

module.exports = router;