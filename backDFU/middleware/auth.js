// middleware/auth.js - VERSÃO CORRIGIDA
const admin = require('../config/firebase');

const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({ 
        erro: 'Token de acesso não fornecido',
        message: 'Autorização necessária para acessar este recurso'
      });
    }

    // ⭐ VERIFICAR TOKEN NO FIREBASE
    const decoded = await admin.auth().verifyIdToken(token);
    console.log('🔑 Token Firebase verificado:', decoded.uid);

    // ⭐ ADICIONAR APENAS O FIREBASE UID (não sobrescrever profissional)
    req.firebaseUid = decoded.uid;
    req.firebaseUser = {
      uid: decoded.uid,
      email: decoded.email,
      emailVerified: decoded.email_verified
    };

    next();
  } catch (error) {
    console.error('❌ Erro na autenticação:', error);
    
    if (error.code === 'auth/id-token-expired') {
      return res.status(401).json({
        erro: 'Token expirado',
        message: 'Faça login novamente'
      });
    }
    
    return res.status(403).json({
      erro: 'Token inválido',
      message: 'Não foi possível verificar a autenticação'
    });
  }
};

module.exports = authenticateToken;