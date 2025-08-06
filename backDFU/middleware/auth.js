// pegar minha instancia de autenticacao

const {admin, auth} = require('../config/firebase');

async function autenticarFirebase(req, res, next) {
  const token = req.headers.authorization?.split(' ')[1]; //pega o token

  if (!token) {
    return res.status(401).json({ erro: 'Token não fornecido' });
  }

  try {
    const decoded = await auth.verifyIdToken(token)  // Verifica o token com o Firebase Admin SDK

    req.firebaseUid = decoded.uid;  // Armazena o ID do usuário (médico) no request
    next();  // Chama a próxima função (a rota de criação de paciente, por exemplo)
  } catch (err) {
    return res.status(401).json({ erro: 'Token inválido' });
  }
}

module.exports = autenticarFirebase;