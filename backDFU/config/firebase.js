//criação da minha instância de autenticação

const admin = require('firebase-admin');
const serviceAcount = {
  type: process.env.FIREBASE_TYPE,
  project_id: process.env.FIREBASE_PROJECT_ID,
  private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID,
  private_key: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'), // Fix quebras de linha
  client_email: process.env.FIREBASE_CLIENT_EMAIL,
  client_id: process.env.FIREBASE_CLIENT_ID,
  auth_uri: process.env.FIREBASE_AUTH_URI,
  token_uri: process.env.FIREBASE_TOKEN_URI,
  auth_provider_x509_cert_url: process.env.FIREBASE_AUTH_PROVIDER_X509_CERT_URL,
  client_x509_cert_url: process.env.FIREBASE_CLIENT_X509_CERT_URL,
  universe_domain: process.env.FIREBASE_UNIVERSE_DOMAIN
};

try {
  // ⭐ VERIFICAR SE JÁ FOI INICIALIZADO
  if (!admin.apps.length) {
    console.log('🔧 Inicializando Firebase Admin...');
    
    // ⭐ CARREGAR CREDENCIAIS
    const serviceAccount = require('./dfu-app1-firebase-adminsdk-fbsvc-64e7a9d78e.json');
    
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      projectId: 'dfu-app1'
    });
    
    console.log('✅ Firebase Admin inicializado com sucesso');
  } else {
    console.log('✅ Firebase Admin já estava inicializado');
  }
} catch (error) {
  console.error('❌ Erro ao inicializar Firebase Admin:', error);
  throw error;
}

module.exports = admin;