// middleware/auth.js - VERSÃO MELHORADA
const admin = require('../config/firebase');

const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({ 
        erro: 'Token de acesso não fornecido',
        message: 'Autorização necessária',
        needsLogin: true
      });
    }

    // ⭐ VERIFICAR TOKEN NO FIREBASE
    const decoded = await admin.auth().verifyIdToken(token);
    console.log('🔑 Token Firebase verificado:', decoded.uid);

    // ⭐ ADICIONAR DADOS DO FIREBASE
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
        message: 'Faça login novamente',
        needsLogin: true
      });
    }
    
    if (error.code === 'auth/argument-error') {
      return res.status(403).json({
        erro: 'Token inválido',
        message: 'Token malformado',
        needsLogin: true
      });
    }
    
    return res.status(403).json({
      erro: 'Token inválido',
      message: 'Não foi possível verificar a autenticação',
      needsLogin: true
    });
  }
};

module.exports = authenticateToken;