// validações de formulário

// Retorna string de erro ou vazio se válido
export function validateEmail(email) {
  if (!email.trim()) {
    return 'E-mail obrigatório';
  }
  // regex simples: algo@algo.algo
  const re = /^\S+@\S+\.\S+$/;
  if (!re.test(email)) {
    return 'E-mail inválido';
  }
  return '';
}
