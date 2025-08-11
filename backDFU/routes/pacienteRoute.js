// routes/pacienteRoute.js
const express = require('express');
const router = express.Router();
const authenticateToken = require('../middleware/auth');
const Paciente = require('../models/Paciente');
const Profissional = require('../models/Profissional');
const Analise = require('../models/Analise');

// ⭐ MIDDLEWARE PARA BUSCAR PROFISSIONAL
async function buscarProfissional(req, res, next) {
  try {
    const profissional = await Profissional.findOne({ firebaseUid: req.firebaseUid });
    if (!profissional) {
      return res.status(404).json({ 
        erro: 'Profissional não encontrado',
        message: 'Faça login novamente'
      });
    }
    req.profissional = profissional;
    next();
  } catch (error) {
    res.status(500).json({ 
      erro: 'Erro ao buscar profissional', 
      detalhes: error.message 
    });
  }
}

// ⭐ GET /pacientes - LISTAR PACIENTES DO MÉDICO
router.get('/', authenticateToken, buscarProfissional, async (req, res) => {
  try {
    const { page = 1, limit = 50, busca } = req.query;
    
    // Filtro base: pacientes do médico logado
    const filtro = { medicoId: req.profissional._id };
    
    // Filtro adicional por busca (nome ou CPF)
    if (busca) {
      filtro.$or = [
        { nome: { $regex: busca, $options: 'i' } },
        { cpf: { $regex: busca.replace(/\D/g, ''), $options: 'i' } }
      ];
    }

    const pacientes = await Paciente.find(filtro)
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .lean();

    // Buscar análises para cada paciente
    const pacientesComAnalises = await Promise.all(
      pacientes.map(async (paciente) => {
        const analises = await Analise.find({ 
          pacienteId: paciente._id 
        }).sort({ createdAt: -1 });
        
        return {
          ...paciente,
          analises: analises || [],
          totalAnalises: analises.length
        };
      })
    );

    const total = await Paciente.countDocuments(filtro);

    res.json({
      pacientes: pacientesComAnalises,
      totalPacientes: total,
      paginaAtual: parseInt(page),
      totalPaginas: Math.ceil(total / limit),
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Erro ao listar pacientes:', error);
    res.status(500).json({ 
      erro: 'Erro ao listar pacientes', 
      detalhes: error.message 
    });
  }
});

// ⭐ POST /pacientes - CRIAR NOVO PACIENTE
router.post('/', authenticateToken, buscarProfissional, async (req, res) => {
  try {
    const { 
      nome, 
      cpf, 
      dataNascimento, 
      genero, 
      telefone, 
      email, 
      endereco, 
      planoSaude 
    } = req.body;

    // Validações obrigatórias
    if (!nome || !cpf || !dataNascimento || !genero || !telefone) {
      return res.status(400).json({
        erro: 'Campos obrigatórios ausentes',
        message: 'Nome, CPF, data de nascimento, gênero e telefone são obrigatórios'
      });
    }

    // Verificar se CPF já existe
    const cpfLimpo = cpf.replace(/\D/g, '');
    const pacienteExistente = await Paciente.findOne({ cpf: cpfLimpo });
    
    if (pacienteExistente) {
      return res.status(409).json({
        erro: 'CPF já cadastrado',
        message: 'Já existe um paciente com este CPF'
      });
    }

    // Verificar se email já existe (se fornecido)
    if (email) {
      const emailExistente = await Paciente.findOne({ email: email.toLowerCase() });
      if (emailExistente) {
        return res.status(409).json({
          erro: 'E-mail já cadastrado',
          message: 'Já existe um paciente com este e-mail'
        });
      }
    }

    // Validar data de nascimento
    const dataFormatada = new Date(dataNascimento.split('/').reverse().join('-'));
    if (isNaN(dataFormatada.getTime())) {
      return res.status(400).json({
        erro: 'Data inválida',
        message: 'Formato de data deve ser dd/mm/aaaa'
      });
    }

    // Criar novo paciente
    const novoPaciente = new Paciente({
      nome: nome.trim(),
      cpf: cpfLimpo,
      dataNascimento: dataFormatada,
      genero,
      telefone: telefone.replace(/\D/g, ''),
      email: email ? email.toLowerCase().trim() : null,
      endereco: endereco?.trim() || null,
      planoSaude: planoSaude?.trim() || null,
      medicoId: req.profissional._id
    });

    await novoPaciente.save();

    // Retornar paciente criado com dados do médico
    const pacienteCriado = await Paciente.findById(novoPaciente._id)
      .populate('medicoId', 'nome email')
      .lean();

    res.status(201).json({
      success: true,
      message: 'Paciente cadastrado com sucesso',
      paciente: {
        ...pacienteCriado,
        analises: [],
        totalAnalises: 0
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Erro ao criar paciente:', error);
    
    // Tratar erros específicos do MongoDB
    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern)[0];
      return res.status(409).json({
        erro: 'Dados duplicados',
        message: `${field === 'cpf' ? 'CPF' : 'E-mail'} já está em uso`
      });
    }

    res.status(500).json({ 
      erro: 'Erro ao criar paciente', 
      detalhes: error.message 
    });
  }
});

// ⭐ GET /pacientes/:id - BUSCAR PACIENTE ESPECÍFICO
router.get('/:id', authenticateToken, buscarProfissional, async (req, res) => {
  try {
    const { id } = req.params;

    // Buscar paciente que pertence ao médico logado
    const paciente = await Paciente.findOne({
      _id: id,
      medicoId: req.profissional._id
    }).populate('medicoId', 'nome email').lean();

    if (!paciente) {
      return res.status(404).json({
        erro: 'Paciente não encontrado',
        message: 'Paciente não existe ou não pertence a você'
      });
    }

    // Buscar todas as análises do paciente
    const analises = await Analise.find({ 
      pacienteId: paciente._id 
    }).sort({ createdAt: -1 });

    res.json({
      ...paciente,
      analises: analises || [],
      totalAnalises: analises.length,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Erro ao buscar paciente:', error);
    res.status(500).json({ 
      erro: 'Erro ao buscar paciente', 
      detalhes: error.message 
    });
  }
});

// ⭐ PUT /pacientes/:id - ATUALIZAR PACIENTE
router.put('/:id', authenticateToken, buscarProfissional, async (req, res) => {
  try {
    const { id } = req.params;
    const dadosAtualizacao = req.body;

    // Verificar se paciente existe e pertence ao médico
    const paciente = await Paciente.findOne({
      _id: id,
      medicoId: req.profissional._id
    });

    if (!paciente) {
      return res.status(404).json({
        erro: 'Paciente não encontrado',
        message: 'Paciente não existe ou não pertence a você'
      });
    }

    // Limpar e validar dados
    if (dadosAtualizacao.cpf) {
      dadosAtualizacao.cpf = dadosAtualizacao.cpf.replace(/\D/g, '');
    }
    if (dadosAtualizacao.telefone) {
      dadosAtualizacao.telefone = dadosAtualizacao.telefone.replace(/\D/g, '');
    }
    if (dadosAtualizacao.email) {
      dadosAtualizacao.email = dadosAtualizacao.email.toLowerCase().trim();
    }

    // Atualizar paciente
    const pacienteAtualizado = await Paciente.findByIdAndUpdate(
      id,
      dadosAtualizacao,
      { new: true, runValidators: true }
    ).populate('medicoId', 'nome email');

    res.json({
      success: true,
      message: 'Paciente atualizado com sucesso',
      paciente: pacienteAtualizado,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Erro ao atualizar paciente:', error);
    res.status(500).json({ 
      erro: 'Erro ao atualizar paciente', 
      detalhes: error.message 
    });
  }
});

// ⭐ DELETE /pacientes/:id - EXCLUIR PACIENTE
router.delete('/:id', authenticateToken, buscarProfissional, async (req, res) => {
  try {
    const { id } = req.params;

    // Verificar se paciente existe e pertence ao médico
    const paciente = await Paciente.findOne({
      _id: id,
      medicoId: req.profissional._id
    });

    if (!paciente) {
      return res.status(404).json({
        erro: 'Paciente não encontrado',
        message: 'Paciente não existe ou não pertence a você'
      });
    }

    // Verificar se há análises vinculadas
    const analiseCount = await Analise.countDocuments({ pacienteId: id });
    
    if (analiseCount > 0) {
      return res.status(409).json({
        erro: 'Paciente possui análises',
        message: `Não é possível excluir. O paciente possui ${analiseCount} análise(s) vinculada(s)`
      });
    }

    // Excluir paciente
    await Paciente.findByIdAndDelete(id);

    res.json({
      success: true,
      message: 'Paciente excluído com sucesso',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Erro ao excluir paciente:', error);
    res.status(500).json({ 
      erro: 'Erro ao excluir paciente', 
      detalhes: error.message 
    });
  }
});

module.exports = router;