const cors = require('cors');
const mongoose = require('mongoose');
const express = require('express');
const multer = require('multer'); // Para upload de arquivos
const { bucket } = require('./config/firebase');
const admin = require('./config/firebase');
const MONGO_URI = process.env.MONGO_URI;

// Módulos para requisições HTTP e manipulação de arquivos
const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');
const stream = require('stream'); // Necessário para criar o stream do buffer


// Importar modelos
const Analise = require('./models/Analise');
const Profissional = require('./models/Profissional');
const Paciente = require('./models/Paciente');

// Carrega as variáveis de ambiente do arquivo .env
require('dotenv').config({ path: './.env' });

const app = express();
// Railway define a porta automaticamente através da variável PORT
const port = process.env.PORT || 3000;


// ⭐ MIDDLEWARES PRIMEIRO - ORDEM CRÍTICA
app.use(cors({
    origin: '*', // Para desenvolvimento
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json({ limit: '50mb' })); // ⭐ ANTES DAS ROTAS
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Log middleware para debug
app.use((req, res, next) => {
    console.log(`📡 ${req.method} ${req.path}`);
    console.log('📦 Body:', req.body ? 'Presente' : 'Ausente');
    console.log('🔑 Auth:', req.headers.authorization ? 'Presente' : 'Ausente');
    next();
});

// Teste Firebase
console.log('🔥 Testando Firebase Admin...');
try {
    const authService = admin.auth();
    console.log('✅ Firebase Admin funcionando:', typeof authService);
} catch (error) {
    console.error('❌ Firebase Admin com erro:', error.message);
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


// Configuração do multer para upload de arquivos (em memória para Railway)
const storage = multer.memoryStorage();
const upload = multer({
    storage: storage,
    limits: {
        fileSize: 10 * 1024 * 1024 // Limite de 10MB
    }
});


// URL base da API Python
const PYTHON_API_BASE_URL = process.env.PYTHON_API_URL;
if (!PYTHON_API_BASE_URL) {
    console.error('❌ Erro: A variável de ambiente PYTHON_API_URL não está configurada.');
    process.exit(1);
}



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
        console.log('🔍 === DEBUG COMPLETO ===');
        console.log('PYTHON_API_URL env var:', process.env.PYTHON_API_URL);
        console.log('PYTHON_API_BASE_URL const:', PYTHON_API_BASE_URL);
        console.log('Arquivo recebido:', req.file ? 'SIM' : 'NÃO');

        // ⭐ VERIFICAR SE A VARIÁVEL ESTÁ DEFINIDA
        if (!PYTHON_API_BASE_URL) {
            console.error('❌ PYTHON_API_BASE_URL é undefined!');
            console.log('Todas as env vars:', Object.keys(process.env));
            return res.status(500).json({
                success: false,
                message: 'PYTHON_API_URL não está configurada',
                debug: {
                    PYTHON_API_URL: process.env.PYTHON_API_URL,
                    allEnvKeys: Object.keys(process.env).filter(k => k.includes('PYTHON'))
                }
            });
        }

        const urlDetection = `${PYTHON_API_BASE_URL}/api/detect-ulcers`; // ✅ ROTA CORRETA
        console.log('🌐 URL montada:', urlDetection);;

        // ⭐ TESTAR A URL ANTES DE USAR (COM FETCH)
        try {
            console.log('🧪 Testando conectividade com server-py...');
            const testResponse = await axios.get(PYTHON_API_BASE_URL, { timeout: 10000 });
            console.log('🧪 Teste de conectividade:', testResponse.status);
        } catch (testError) {
            console.error('🧪 Falha no teste de conectividade:', testError.message);
            return res.status(500).json({
                success: false,
                message: 'Server-py indisponível',
                debug: {
                    url: PYTHON_API_BASE_URL,
                    error: testError.message
                }
            });
        }

        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: 'Nenhum arquivo enviado'
            });
        }

        console.log('📤 Enviando para server-py...');

        const formData = new FormData();
        formData.append('file', req.file.buffer, {
            filename: req.file.originalname,
            contentType: req.file.mimetype,
        });

        console.log('🔗 Fazendo fetch para:', urlDetection);

        const response = await axios.post(urlDetection, formData, {
            headers: {
                ...formData.getHeaders(),
            },
            timeout: 60000, // 60 segundos
            maxContentLength: Infinity,
            maxBodyLength: Infinity
        });

        console.log('📊 Status da resposta:', response.status);

        if (!response.ok) {
            const errorText = await response.text();
            console.error('❌ Erro do server-py:', errorText);
            throw new Error(`Server-py retornou ${response.status}: ${errorText}`);
        }

        const responseData = await response.json();
        console.log('✅ Dados recebidos do server-py');

        res.json({
            success: true,
            ...responseData
        });

    } catch (error) {
        console.error('❌ ERRO COMPLETO:', {
            message: error.message,
            stack: error.stack
        });

        // ⭐ TRATAMENTO DE ERRO ESPECÍFICO PARA AXIOS
        let errorMessage = error.message;
        let statusCode = 500;

        if (error.response) {
            // Server respondeu com erro
            statusCode = error.response.status;
            errorMessage = error.response.data?.message || error.response.statusText || error.message;
        } else if (error.request) {
            // Request foi feito mas não houve resposta
            errorMessage = 'Server-py não está respondendo';
            statusCode = 503;
        } else {
            // Erro na configuração da request
            errorMessage = 'Erro na configuração da requisição';
        }


        res.status(statusCode).json({
            success: false,
            message: errorMessage,
            statusText: error.response?.statusText,
            data: error.response?.data,
            config: error.config?.url,
            debug: {
                PYTHON_API_BASE_URL: PYTHON_API_BASE_URL || 'undefined'
            }
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

        const urlClassification = `${PYTHON_API_BASE_URL}/api/classify-regions`;
        console.log('🔗 URL classificação:', urlClassification);

        // ⭐ MELHORAR CONFIGURAÇÃO DO AXIOS
        const responseClassification = await axios.post(urlClassification, formClassification, {
            headers: {
                ...formClassification.getHeaders(),
            },
            timeout: 60000,
            maxContentLength: Infinity,
            maxBodyLength: Infinity
        });

        console.log(`✅ Classificação concluída. Status: ${responseClassification.status}`);

        // ⭐ VERIFICAR SE TEM RESULTADOS
        if (!responseClassification.data || !responseClassification.data.resultados) {
            throw new Error('Resposta inválida do server-py: resultados não encontrados');
        }

        const resultados = responseClassification.data.resultados;
        console.log(`📊 ${resultados.length} resultados recebidos`);

        // ⭐ PROCESSAR RESULTADOS PARA FRONTEND
        const resultados_classificacao = resultados.map((resultado, index) => {
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
        console.error('❌ Erro na classificação:', {
            message: error.message,
            status: error.response?.status,
            data: error.response?.data
        });

        // ⭐ TRATAMENTO DE ERRO ESPECÍFICO PARA AXIOS
        let errorMessage = error.message;
        let statusCode = 500;

        if (error.response) {
            statusCode = error.response.status;
            errorMessage = error.response.data?.message || error.response.statusText || error.message;
        } else if (error.request) {
            errorMessage = 'Server-py não está respondendo para classificação';
            statusCode = 503;
        }

        res.status(statusCode).json({
            success: false,
            message: errorMessage
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