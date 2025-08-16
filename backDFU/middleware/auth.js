const { admin } = require('../config/firebase');

const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({ 
        erro: 'Token de acesso não fornecido',
        message: 'Autorização necessária'
      });
    }

    const decoded = await admin.auth().verifyIdToken(token);
    
    req.firebaseUid = decoded.uid;
    req.firebaseUser = decoded;

    next();
    
  } catch (error) {
    console.error('❌ Erro de autenticação no middleware:', error.code, error.message);
    
    if (error.code === 'auth/id-token-expired') {
      return res.status(401).json({
        erro: 'Token expirado',
        message: 'Faça login novamente'
      });
    }
    
    return res.status(403).json({
      erro: 'Token inválido',
      message: 'Não foi possível verificar a autenticação.'
    });
  }
};

module.exports = authenticateToken;