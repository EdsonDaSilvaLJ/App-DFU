// backDFU/middleware/auth.js - VERSÃO CORRIGIDA
const admin = require('../config/firebase');

const authenticateToken = async (req, res, next) => {
  try {
    console.log('🔍 MIDDLEWARE: Verificando Firebase Admin...');
    
    // ⭐ VERIFICAR SE ADMIN ESTÁ CONFIGURADO
    if (!admin.apps || admin.apps.length === 0) {
      console.error('❌ MIDDLEWARE: Firebase Admin não inicializado');
      return res.status(500).json({
        erro: 'Erro de configuração',
        message: 'Servidor não configurado corretamente'
      });
    }

    const authHeader = req.headers.authorization;
    console.log('🔑 MIDDLEWARE: Header Authorization:', authHeader ? 'Presente' : 'Ausente');
    
    const token = authHeader && authHeader.split(' ')[1];
    console.log('🔑 MIDDLEWARE: Token extraído:', token ? `${token.substring(0, 20)}...` : 'Nulo');

    if (!token) {
      console.log('❌ MIDDLEWARE: Token não fornecido');
      return res.status(401).json({ 
        erro: 'Token de acesso não fornecido',
        message: 'Autorização necessária'
      });
    }

    // ⭐ VERIFICAR TOKEN NO FIREBASE
    console.log('🔥 MIDDLEWARE: Verificando token no Firebase...');
    
    const authService = admin.auth();
    console.log('🔥 MIDDLEWARE: Auth service obtido:', typeof authService);
    
    const decoded = await authService.verifyIdToken(token);
    console.log('✅ MIDDLEWARE: Token verificado com sucesso');
    console.log('👤 MIDDLEWARE: UID:', decoded.uid);

    // ⭐ ADICIONAR DADOS DO FIREBASE
    req.firebaseUid = decoded.uid;
    req.firebaseUser = {
      uid: decoded.uid,
      email: decoded.email,
      emailVerified: decoded.email_verified
    };

    console.log('✅ MIDDLEWARE: Prosseguindo para próximo middleware...');
    next();
    
  } catch (error) {
    console.error('❌ MIDDLEWARE: Erro completo:', error);
    
    if (error.code === 'auth/id-token-expired') {
      return res.status(401).json({
        erro: 'Token expirado',
        message: 'Faça login novamente'
      });
    }
    
    if (error.code === 'auth/argument-error') {
      return res.status(403).json({
        erro: 'Token inválido',
        message: 'Token malformado'
      });
    }
    
    return res.status(403).json({
      erro: 'Token inválido',
      message: 'Não foi possível verificar a autenticação'
    });
  }
};

module.exports = authenticateToken;