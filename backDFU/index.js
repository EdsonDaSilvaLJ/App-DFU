const cors = require('cors');
const mongoose = require('mongoose');
const express = require('express');
const multer = require('multer'); // Para upload de arquivos
const { bucket } = require('./config/firebase');

// Importar modelos
const Analise = require('./models/Analise');
const Profissional = require('./models/Profissional');
const Paciente = require('./models/Paciente');

// Carrega as variáveis de ambiente do arquivo .env
require('dotenv').config({ path: './.env' });

const app = express();
// Railway define a porta automaticamente através da variável PORT
const port = process.env.PORT || 3000;

// Módulos para requisições HTTP e manipulação de arquivos
const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');
const stream = require('stream'); // Necessário para criar o stream do buffer

// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Configuração do multer para upload de arquivos (em memória para Railway)
const storage = multer.memoryStorage();
const upload = multer({
    storage: storage,
    limits: {
        fileSize: 10 * 1024 * 1024 // Limite de 10MB
    }
});

// Variável de ambiente MONGO_URI
const MONGO_URI = process.env.MONGO_URI;
// URL base da API Python
const PYTHON_API_BASE_URL = process.env.PYTHON_API_URL;
if (!PYTHON_API_BASE_URL) {
    console.error('❌ Erro: A variável de ambiente PYTHON_API_URL não está configurada.');
    process.exit(1);
}

// Conectar ao MongoDB Atlas
mongoose.connect(MONGO_URI)
    .then(() => console.log('✅ Conectado ao MongoDB Atlas'))
    .catch((err) => console.error('❌ Erro na conexão:', err));

// Importação das rotas
const pacienteRoute = require('./routes/pacienteRoute');
const logupRoute = require('./routes/logupRoute');
const profissionalRoutes = require('./routes/profissionalRoute');

app.use('/pacientes', pacienteRoute);
app.use('/logup', logupRoute);
app.use('/profissionais', profissionalRoutes);

// Rota de saúde para verificar se o servidor está funcionando
app.get('/health', (req, res) => {
    res.json({
        status: 'OK',
        timestamp: new Date().toISOString(),
        service: 'Node.js API'
    });
});

/**
 * Endpoint para a primeira etapa do fluxo: Detecção de Bounding Boxes.
 * Recebe a imagem original e a repassa para a API Python para detecção.
 * Retorna as boxes detectadas e as informações de redimensionamento.
 */
// ENDPOINT DETECTAR
app.post('/api/detect-ulcers', upload.single('file'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: 'Nenhuma imagem foi enviada'
            });
        }

        console.log('--- Etapa 1: Detecção de Úlceras ---');
        console.log(`📤 Enviando imagem para detecção...`);

        const formDetection = new FormData();
        formDetection.append('file', stream.Readable.from(req.file.buffer), {
            filename: req.file.originalname || 'ulcera.jpg',
            contentType: req.file.mimetype || 'image/jpeg'
        });

        const urlDetection = `${PYTHON_API_BASE_URL}/predict/detection`;
        const responseDetection = await axios.post(urlDetection, formDetection, {
            headers: formDetection.getHeaders(),
            timeout: 60000 // 60 segundos para IA
        });

        console.log(`✅ Detecção concluída. Encontradas ${responseDetection.data.deteccoes.length} regiões.`);

        // ⭐ CONVERTER IMAGEM PARA BASE64 E RETORNAR NO FORMATO ESPERADO
        const imageBase64 = req.file.buffer.toString('base64');

        res.json({
            success: true,
            message: 'Detecção realizada com sucesso',
            imagem_redimensionada: imageBase64,
            boxes: responseDetection.data.deteccoes,
            dimensoes: {
                width: responseDetection.data.info_redimensionamento?.original_size?.width || 640,
                height: responseDetection.data.info_redimensionamento?.original_size?.height || 640
            },
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        console.error('❌ Erro na detecção:', error.message);
        res.status(500).json({
            success: false,
            message: error.message || 'Erro na detecção de úlceras'
        });
    }
});

/**
 * Endpoint para a segunda etapa do fluxo: Classificação de Regiões.
 * Recebe a imagem original e o JSON das boxes editadas pelo usuário.
 * Repassa para a API Python para classificação.
 * Retorna os resultados finais.
 */

app.post('/api/classify-regions', express.json(), async (req, res) => {
    try {
        const { imagem_redimensionada, boxes_finais, medico_id, paciente_id } = req.body;

        if (!imagem_redimensionada || !boxes_finais) {
            return res.status(400).json({
                success: false,
                message: 'Dados insuficientes para classificação'
            });
        }

        console.log('--- Etapa 2: Classificação das Regiões ---');
        console.log(`📤 Classificando ${boxes_finais.length} regiões...`);

        // Converter base64 para buffer
        const imageBuffer = Buffer.from(imagem_redimensionada, 'base64');

        const formClassification = new FormData();
        formClassification.append('file', stream.Readable.from(imageBuffer), {
            filename: 'ulcera_analise.jpg',
            contentType: 'image/jpeg'
        });
        formClassification.append('deteccoes_json', JSON.stringify(boxes_finais));

        const urlClassification = `${PYTHON_API_BASE_URL}/predict/classification`;
        const responseClassification = await axios.post(urlClassification, formClassification, {
            headers: formClassification.getHeaders(),
            timeout: 60000
        });

        console.log(`✅ Classificação concluída. ${responseClassification.data.resultados.length} resultados.`);

        // ⭐ PROCESSAR RESULTADOS PARA FRONTEND
        const resultados_classificacao = responseClassification.data.resultados.map((resultado, index) => {
            // Criar subimagem (crop da região)
            const subimagem_base64 = criarSubimagem(imagem_redimensionada, resultado);

            return {
                xmin: resultado.xmin,
                ymin: resultado.ymin,
                xmax: resultado.xmax,
                ymax: resultado.ymax,
                classe_classificacao: resultado.classe_classificacao,
                confianca_classificacao: resultado.confianca_classificacao,
                subimagem: subimagem_base64
            };
        });

        res.json({
            success: true,
            message: 'Classificação realizada com sucesso',
            resultados_classificacao,
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        console.error('❌ Erro na classificação:', error.message);
        res.status(500).json({
            success: false,
            message: error.message || 'Erro na classificação das regiões'
        });
    }
});


// ⭐ FUNÇÃO HELPER PARA CRIAR SUBIMAGEM
function criarSubimagem(imageBase64, regiao) {
    try {
        // Em uma implementação real, você usaria uma biblioteca como sharp ou jimp
        // Por enquanto, retorna a imagem original como placeholder
        return imageBase64;
    } catch (error) {
        console.error('Erro ao criar subimagem:', error);
        return imageBase64;
    }
}

app.post('/api/save-analysis', express.json(), async (req, res) => {
    try {
        const { 
            medico_id,  // UID do Firebase
            paciente_id, 
            imagem_original, 
            regioes_analisadas, 
            diagnostico_geral 
        } = req.body;

        if (!medico_id || !paciente_id || !diagnostico_geral || !imagem_original) {
            return res.status(400).json({
                success: false,
                message: 'Dados obrigatórios ausentes'
            });
        }

        console.log('--- Etapa 3: Salvando Análise ---');
        
        // ⭐ BUSCAR MÉDICO PELO UID DO FIREBASE
        const medico = await Profissional.findOne({ firebaseUid: medico_id });
        if (!medico) {
            return res.status(404).json({
                success: false,
                message: 'Médico não encontrado'
            });
        }

        // ⭐ VERIFICAR SE PACIENTE PERTENCE AO MÉDICO
        const paciente = await Paciente.findOne({ 
            _id: paciente_id,
            medicoId: medico._id
        });
        if (!paciente) {
            return res.status(404).json({
                success: false,
                message: 'Paciente não encontrado ou não pertence a você'
            });
        }

        // ⭐ CRIAR NOVA ANÁLISE COM ObjectId CORRETO
        const novaAnalise = new Analise({
            medicoId: medico._id,        // ✅ ObjectId do MongoDB
            pacienteId: paciente_id,     // ✅ ObjectId do MongoDB
            originalImageUrl: '',        // Será preenchido após upload
            boxes: (regioes_analisadas || []).map(regiao => ({
                xMin: regiao.coordenadas?.xmin || 0,
                yMin: regiao.coordenadas?.ymin || 0,
                xMax: regiao.coordenadas?.xmax || 0,
                yMax: regiao.coordenadas?.ymax || 0,
                classification: {
                    label: regiao.classificacao_ia?.classe || 'Não classificado',
                    confidence: regiao.classificacao_ia?.confianca || 0
                },
                diagnosis: regiao.diagnostico_medico || ''
            })),
            imageDiagnosis: diagnostico_geral
        });

        // ⭐ SALVAR PARA GERAR O _id
        await novaAnalise.save();
        console.log(`📝 Análise criada no MongoDB com ID: ${novaAnalise._id}`);

        // ⭐ GERAR NOME DO ARQUIVO (usando ObjectIds do MongoDB)
        const nomeArquivo = `${medico._id}_${paciente_id}_${novaAnalise._id}.jpg`;
        console.log(`📤 Fazendo upload da imagem: ${nomeArquivo}`);

        // ⭐ UPLOAD DA IMAGEM PARA FIREBASE STORAGE
        const imageBuffer = Buffer.from(imagem_original, 'base64');
        const file = bucket.file(`analises/${nomeArquivo}`);
        
        const stream = file.createWriteStream({
            metadata: {
                contentType: 'image/jpeg',
                metadata: {
                    medicoId: medico._id.toString(),
                    medicoFirebaseUid: medico_id,
                    pacienteId: paciente_id,
                    analiseId: novaAnalise._id.toString(),
                    uploadDate: new Date().toISOString()
                }
            }
        });

        // ⭐ PROMISE PARA AGUARDAR O UPLOAD
        const uploadPromise = new Promise((resolve, reject) => {
            stream.on('error', (error) => {
                console.error('❌ Erro no upload:', error);
                reject(error);
            });

            stream.on('finish', async () => {
                try {
                    // ⭐ TORNAR O ARQUIVO PÚBLICO E OBTER URL
                    await file.makePublic();
                    const publicUrl = `https://storage.googleapis.com/${bucket.name}/analises/${nomeArquivo}`;
                    console.log(`✅ Upload concluído: ${publicUrl}`);
                    resolve(publicUrl);
                } catch (error) {
                    console.error('❌ Erro ao tornar público:', error);
                    reject(error);
                }
            });
        });

        // ⭐ ENVIAR BUFFER PARA O STREAM
        stream.end(imageBuffer);

        // ⭐ AGUARDAR UPLOAD COMPLETAR
        const firebaseUrl = await uploadPromise;

        // ⭐ ATUALIZAR ANÁLISE COM URL DA IMAGEM
        novaAnalise.originalImageUrl = firebaseUrl;
        await novaAnalise.save();

        console.log(`✅ Análise completa salva para paciente ${paciente.nome}`);
        console.log(`🔗 URL da imagem: ${firebaseUrl}`);

        res.json({
            success: true,
            message: 'Análise salva com sucesso',
            analise_id: novaAnalise._id.toString(),
            firebase_url: firebaseUrl,
            nome_arquivo: nomeArquivo,
            medico: {
                id: medico._id,
                nome: medico.nome,
                firebaseUid: medico.firebaseUid
            },
            paciente: {
                id: paciente._id,
                nome: paciente.nome
            },
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        console.error('❌ Erro ao salvar análise:', error.message);
        
        // ⭐ CLEANUP: Se houve erro, tentar deletar análise incompleta
        if (error.analiseId) {
            try {
                await Analise.findByIdAndDelete(error.analiseId);
                console.log('🧹 Análise incompleta removida do MongoDB');
            } catch (cleanupError) {
                console.error('❌ Erro no cleanup:', cleanupError.message);
            }
        }

        res.status(500).json({
            success: false,
            message: error.message || 'Erro ao salvar análise',
            details: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    }
});

app.get('/analises/:id', async (req, res) => {
    try {
        const { id } = req.params;
        
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                success: false,
                message: 'ID da análise inválido'
            });
        }

        const analise = await Analise.findById(id)
            .populate('medicoId', 'nome email firebaseUid')
            .populate('pacienteId', 'nome cpf telefone email');

        if (!analise) {
            return res.status(404).json({
                success: false,
                message: 'Análise não encontrada'
            });
        }

        res.json({
            success: true,
            data: analise
        });

    } catch (error) {
        console.error('❌ Erro ao buscar análise:', error.message);
        res.status(500).json({
            success: false,
            message: 'Erro ao buscar análise'
        });
    }
});

// ⭐ LISTAR ANÁLISES DE UM PACIENTE
app.get('/pacientes/:pacienteId/analises', async (req, res) => {
    try {
        const { pacienteId } = req.params;

        if (!mongoose.Types.ObjectId.isValid(pacienteId)) {
            return res.status(400).json({
                success: false,
                message: 'ID do paciente inválido'
            });
        }

        const analises = await Analise.find({ pacienteId })
            .populate('medicoId', 'nome email')
            .sort({ createdAt: -1 }); // Mais recentes primeiro

        res.json({
            success: true,
            data: analises,
            total: analises.length
        });

    } catch (error) {
        console.error('❌ Erro ao buscar análises:', error.message);
        res.status(500).json({
            success: false,
            message: 'Erro ao buscar análises'
        });
    }
});



// Middleware para capturar rotas não encontradas
app.use((req, res) => {
    res.status(404).json({
        erro: 'Rota não encontrada',
        message: `A rota ${req.method} ${req.originalUrl} não existe`,
        rotas_disponiveis: [
            'GET /health',
            'POST /api/detect-ulcers',
            'POST /api/classify-regions',
            'POST /api/save-analysis',
            'GET /analises/:id',
            'GET /pacientes/:pacienteId/analises',
            'GET /pacientes',
            'POST /logup'
        ]
    });
});

// Middleware para tratamento de erros globais
app.use((error, req, res, next) => {
    console.error('❌ Erro não tratado:', error);
    res.status(500).json({
        erro: 'Erro interno do servidor',
        message: 'Ocorreu um erro inesperado'
    });
});

// Graceful shutdown
process.on('SIGTERM', () => {
    console.log('🔄 Recebido SIGTERM, encerrando servidor...');
    mongoose.connection.close().then(() => {
        console.log('🔒 Conexão com MongoDB fechada');
        process.exit(0);
    });
});

// Inicia o servidor
app.listen(port, '0.0.0.0', () => {
    console.log(`🚀 Servidor Node.js rodando na porta ${port}`);
    console.log(`🌐 Health check: http://localhost:${port}/health`);
    console.log(`🔗 Python API URL: ${PYTHON_API_BASE_URL}`);
    console.log(`📝 MongoDB: ${MONGO_URI ? 'Configurado' : 'Não configurado'}`);
});