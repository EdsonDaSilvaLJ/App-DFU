// backDFU/config/firebase.js - USAR VARIÁVEIS DE AMBIENTE

const admin = require('firebase-admin');
require('dotenv').config();

if (!admin.apps.length) {
    try {
        console.log('🔧 Inicializando Firebase Admin...');
        
        // ⭐ USAR VARIÁVEIS DE AMBIENTE EM VEZ DO ARQUIVO JSON
        const serviceAccount = {
            type: process.env.FIREBASE_TYPE,
            project_id: process.env.FIREBASE_PROJECT_ID,
            private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID,
            private_key: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
            client_email: process.env.FIREBASE_CLIENT_EMAIL,
            client_id: process.env.FIREBASE_CLIENT_ID,
            auth_uri: process.env.FIREBASE_AUTH_URI,
            token_uri: process.env.FIREBASE_TOKEN_URI,
            auth_provider_x509_cert_url: process.env.FIREBASE_AUTH_PROVIDER_X509_CERT_URL,
            client_x509_cert_url: process.env.FIREBASE_CLIENT_X509_CERT_URL,
            universe_domain: process.env.FIREBASE_UNIVERSE_DOMAIN
        };
        
        // ⭐ VERIFICAR SE TODAS AS VARIÁVEIS ESTÃO PRESENTES
        const requiredVars = ['FIREBASE_PROJECT_ID', 'FIREBASE_PRIVATE_KEY', 'FIREBASE_CLIENT_EMAIL'];
        const missingVars = requiredVars.filter(varName => !process.env[varName]);
        
        if (missingVars.length > 0) {
            throw new Error(`Variáveis Firebase ausentes: ${missingVars.join(', ')}`);
        }
        
        admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
            projectId: process.env.FIREBASE_PROJECT_ID,
            storageBucket: `${process.env.FIREBASE_PROJECT_ID}.appspot.com`
        });
        
        console.log('✅ Firebase Admin inicializado com variáveis de ambiente');
        
    } catch (error) {
        console.error('❌ Erro ao inicializar Firebase Admin:', error);
        throw error;
    }
}

const bucket = admin.storage().bucket();

module.exports = {
    admin,
    bucket
};