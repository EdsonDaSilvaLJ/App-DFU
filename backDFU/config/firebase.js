// --- Início do arquivo: config/firebase.js (VERSÃO FINAL SIMPLIFICADA) ---

const admin = require('firebase-admin');

// Carrega as variáveis de ambiente, garantindo que estejam disponíveis
require('dotenv').config();

let serviceAccount;
let storageBucketUrl;

// Verifica a variável de credenciais em Base64
if (process.env.FIREBASE_CREDENTIALS_BASE64) {
  try {
    const decodedJson = Buffer.from(process.env.FIREBASE_CREDENTIALS_BASE64, 'base64').toString('utf-8');
    serviceAccount = JSON.parse(decodedJson);
    console.log('✅ Credenciais do Firebase decodificadas com sucesso.');
  } catch (error) {
    console.error('❌ ERRO CRÍTICO: Falha ao decodificar FIREBASE_CREDENTIALS_BASE64. Verifique o valor no Railway.', error.message);
    // Encerra a aplicação se as credenciais estiverem corrompidas. Sem elas, nada funciona.
    process.exit(1);
  }
} else {
  console.error('❌ ERRO CRÍTICO: A variável de ambiente FIREBASE_CREDENTIALS_BASE64 é obrigatória e não foi encontrada.');
  process.exit(1);
}

// Verifica a variável do Storage Bucket
if (process.env.FIREBASE_STORAGE_BUCKET) {
    storageBucketUrl = process.env.FIREBASE_STORAGE_BUCKET;
    console.log(`📦 Usando Firebase Storage Bucket: ${storageBucketUrl}`);
} else {
    console.error('❌ ERRO CRÍTICO: A variável de ambiente FIREBASE_STORAGE_BUCKET é obrigatória e não foi encontrada.');
    process.exit(1);
}


// Inicializa o app do Firebase. Node.js garante que este bloco só rode uma vez.
try {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    storageBucket: storageBucketUrl
  });
  console.log('✅ Firebase Admin SDK inicializado com sucesso.');
} catch (error) {
  // O SDK pode lançar um erro se já estiver inicializado, o que é ok.
  if (error.code !== 'app/duplicate-app') {
    console.error('❌ Falha catastrófica ao inicializar o Firebase Admin SDK:', error);
    process.exit(1);
  } else {
    console.log('⚠️ Firebase Admin SDK já estava inicializado.');
  }
}

// Exporta o admin e uma função para obter o bucket de forma segura
module.exports = {
    admin,
    getBucket: () => admin.storage().bucket()
};