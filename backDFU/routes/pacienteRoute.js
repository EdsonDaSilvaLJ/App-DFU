const express = require('express');
const router = express.Router(); // cria uma rota
const autenticarFirebase = require('../middleware/auth')
const Paciente = require('../models/Paciente'); // Importa o modelo Paciente
const multer = require('multer');
const admin = require('../config/firebase'); // Firebase Admin SDK


// Configuração do multer para upload de imagens
const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Apenas imagens são permitidas'), false);
    }
  }
});




// Rota para buscar todos os pacientes do médico autenticado
router.get('/', autenticarFirebase, async (req, res) => {
  /*res.json(
    [
      { id: '1', nome: 'João', cpf: '123.456.789-00' },
      { id: '2', nome: 'Maria', cpf: '987.654.321-00' }
    ]
  )*/
  try {
    // req.userId já foi validado pelo middleware de autenticação
    const pacientes = await Paciente.find({ medicoId: req.userId  });
    res.json(pacientes);
  } catch (error) {
    res.status(500).json({ erro: 'Erro ao buscar pacientes' });
  }
});


// Rota para buscar um paciente específico pelo ID
router.get('/:id', autenticarFirebase, async (req, res) => {
  try {
    const paciente = await Paciente.findOne(
      {
        _id: req.params.id,
        medicoId: req.userId // Verifica se o paciente pertence ao médico autenticado
      }
    )
    if (!paciente) {
      return res.status(404).json({ erro: 'Paciente não encontrado' });
    }
    res.json(paciente);
  } catch (error) {
    res.status(500).json({ erro: 'Erro ao buscar paciente', detalhes: error.message });
  }
});



router.post('/', autenticarFirebase, async (req, res) => {
  try {
    const { nome, cpf, dataNascimento, genero, telefone, email, planoSaude, endereco } = req.body;

    // Validações básicas
    if (!nome || !cpf || !dataNascimento || !genero || !telefone || !email) {
      return res.status(400).json({ erro: 'Campos obrigatórios não preenchidos' });
    }

    const novoPaciente = new Paciente({
      nome,
      cpf,
      dataNascimento: new Date(dataNascimento),
      genero,
      telefone,
      email,
      planoSaude,
      endereco,
      medicoId: req.userId, // UID já validado pelo middleware
      analises: [] // Inicializa o array de fotos vazio
    });

    await novoPaciente.save();
    res.status(201).json(novoPaciente);

  } catch (error) {

    if (error.code === 11000) {
      res.status(400).json({ erro: 'CPF ou e-mail já cadastrado' });
    } else {
      res.status(400).json({ erro: 'Erro ao criar paciente', detalhes: error.message });
    }

  }

});




router.post('/upload-foto', autenticarFirebase, upload.single('foto'), async (req, res) => {
  try {
    const { pacienteId, observacoes } = req.body;
    
    if (!req.file) {
      return res.status(400).json({ erro: 'Nenhuma foto enviada' });
    }

    // Verificar se o paciente pertence ao médico
    const paciente = await Paciente.findOne({ 
      _id: pacienteId, 
      medicoId: req.userId 
    });
    
    if (!paciente) {
      return res.status(404).json({ erro: 'Paciente não encontrado' });
    }

    // Configurar Firebase Storage
    const bucket = admin.storage().bucket();
    const nomeArquivo = `lesoes/${pacienteId}/${Date.now()}_${req.file.originalname}`;
    const file = bucket.file(nomeArquivo);

    // Upload para Firebase Storage
    const stream = file.createWriteStream({
      metadata: {
        contentType: req.file.mimetype,
        metadata: {
          pacienteId: pacienteId,
          uploadedBy: req.userId,
          originalName: req.file.originalname
        }
      }
    });

    stream.on('error', (error) => {
      console.error('Erro no upload para Firebase:', error);
      return res.status(500).json({ erro: 'Erro ao fazer upload da imagem' });
    });

    stream.on('finish', async () => {
      try {
        // Tornar o arquivo público e obter URL
        await file.makePublic();
        const firebaseUrl = `https://storage.googleapis.com/${bucket.name}/${nomeArquivo}`;

        // Adicionar metadados ao MongoDB
        const novaAnalise = {
          firebaseUrl: firebaseUrl,
          firebasePath: nomeArquivo,
          nomeArquivo: req.file.originalname,
          dataUpload: new Date(),
          statusAnalise: 'analisando', // Mudou de 'pendente' para 'analisando'
          observacoes: observacoes || null
        };

        paciente.analises.push(novaAnalise);
        await paciente.save();

        // REMOVIDO: Não simular mais a IA aqui
        // A IA será "simulada" no frontend e enviada via /salvar-avaliacao

        res.status(201).json({
          message: 'Analise enviada com sucesso',
          analise: novaAnalise
        });

      } catch (error) {
        console.error('Erro ao processar upload:', error);
        res.status(500).json({ erro: 'Erro ao processar upload' });
      }
    });

    // Iniciar o upload
    stream.end(req.file.buffer);

  } catch (error) {
    console.error('Erro no upload:', error);
    res.status(500).json({ erro: 'Erro ao fazer upload da foto' });
  }
});




// POST - Salvar avaliação médica
router.post('/salvar-avaliacao', autenticarFirebase, async (req, res) => {
  try {
    const { pacienteId, resultadoIA, observacoesMedico } = req.body;

    if (!pacienteId || !observacoesMedico) {
      return res.status(400).json({ erro: 'Dados obrigatórios não fornecidos' });
    }

    // Verificar se o paciente pertence ao médico
    const paciente = await Paciente.findOne({ 
      _id: pacienteId, 
      medicoId: req.userId 
    });
    
    if (!paciente) {
      return res.status(404).json({ erro: 'Paciente não encontrado' });
    }

    // Encontrar a última foto (mais recente) - a que acabou de ser analisada
    if (!paciente.analises || paciente.analises.length === 0) {
      return res.status(400).json({ erro: 'Nenhuma foto encontrada para este paciente' });
    }

    const ultimaAnalise = paciente.analises[paciente.analises.length - 1];

    // Atualizar com resultado da IA e avaliação médica
    UltimaAnalise.resultadoAnalise = {
      classificacao: resultadoIA.classificacao,
      confianca: resultadoIA.confianca / 100, // Converter porcentagem para decimal
      detalhes: resultadoIA.detalhes,
      gravidade: resultadoIA.gravidade,
      recomendacoes: resultadoIA.recomendacoes,
      dataAnalise: new Date()
    };

    UltimaAnalise.avaliacaoMedica = {
      observacoesMedico: observacoesMedico,
      dataAvaliacao: new Date(),
      finalizada: true
    };

    UltimaAnalise.statusAnalise = 'concluida';

    await paciente.save();

    res.status(200).json({
      message: 'Avaliação salva com sucesso',
      analise: UltimaAnalise
    });

  } catch (error) {
    console.error('Erro ao salvar avaliação:', error);
    res.status(500).json({ erro: 'Erro ao salvar avaliação' });
  }
});


module.exports = router; 