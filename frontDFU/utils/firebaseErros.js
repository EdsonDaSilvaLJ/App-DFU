export function traduzErroLogin(code) {
  switch (code) {
    case 'auth/invalid-email':
      return 'E-mail inválido.';
    case 'auth/user-not-found':
      return 'Usuário não encontrado.';
    case 'auth/wrong-password':
      return 'Senha incorreta.';
    default:
      return 'Erro no Login.';
  }
}

export function traduzErroLogup(code) {
  switch (code) {
    case 'auth/email-already-in-use':
      return 'Este e-mail já está em uso.';
    case 'auth/invalid-email':
      return 'E-mail inválido.';
    case 'auth/weak-password':
      return 'Senha muito fraca (mínimo 6 caracteres).';
    default:
      return 'Erro desconhecido.';
  }
}