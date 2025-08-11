const API_CONFIG = {
  BASE_URL: "https://backdfu-production.up.railway.app" || 'http://localhost:3000',
  ENDPOINTS: {
    SIGNUP: '/logup',
    PACIENTES: "/pacientes",
    PACIENTE_BY_ID: (id) => `/pacientes/${id}`,
    UPLOAD_FOTO: '/pacientes/upload-foto',
    SALVAR_AVALIACAO: "/pacientes/salvar-avaliacao",
    PROFISSIONAL_PROFILE: '/profissionais/profile',
  }
};

// Função helper para construir URLs completas
export const buildURL = (endpoint) => {
  console.log(`${API_CONFIG.BASE_URL}${endpoint}`)
  return `${API_CONFIG.BASE_URL}${endpoint}`;
};

// Função helper para fazer requisições autenticadas
export const makeAuthenticatedRequest = async (url, options = {}, token) => {
  const defaultHeaders = {
    'Content-Type': 'application/json',
    ...(token && { 'Authorization': `Bearer ${token}` })
  };

  return fetch(url, {
    ...options,
    headers: {
      ...defaultHeaders,
      ...options.headers
    }
  });
};

// Função helper para requisições com FormData (upload de arquivos)
export const makeFormDataRequest = async (url, formData, token) => {
  return fetch(url, {
    method: 'POST',
    headers: {
      // NÃO definir Content-Type para FormData - o browser faz automaticamente
      ...(token && { 'Authorization': `Bearer ${token}` })
    },
    body: formData
  });
};

export default API_CONFIG;
//ainda n implementado