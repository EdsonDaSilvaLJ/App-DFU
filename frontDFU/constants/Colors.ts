// constants/Colors.js
export const COLORS = {
  
// Cores principais - NOVA PALETA
  primary: '#087db4',      // Azul principal
  secondary: '#18837c',    // Verde azulado
  accent: '#ab4d3d',       // Vermelho terroso

  // Estados
  success: '#4CAF50',
  warning: '#FF9800', 
  error: '#F44336',
  info: '#2196F3',
  
  // Tons de cinza
  background: '#f8f9fa',
  surface: '#ffffff',
  border: '#e0e0e0',
  
  // Textos
  text: {
    primary: '#333333',
    secondary: '#666666',
    disabled: '#999999',
    placeholder: '#cccccc'
  },
  
  // Status específicos da aplicação
  status: {
    concluida: '#4CAF50',
    analisando: '#FF9800',
    pendente: '#2196F3',
    erro: '#F44336'
  },
  
  // Gravidade médica
  gravidade: {
    leve: '#4CAF50',
    moderada: '#FF9800',
    grave: '#F44336'
  }
};

export const SPACING = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48
};

export const TYPOGRAPHY = {
  heading1: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.text.primary
  },
  heading2: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.text.primary
  },
  heading3: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.text.primary
  },
  body: {
    fontSize: 16,
    color: COLORS.text.primary
  },
  caption: {
    fontSize: 14,
    color: COLORS.text.secondary
  },
  small: {
    fontSize: 12,
    color: COLORS.text.secondary
  }
};

export const BORDER_RADIUS = {
  small: 4,
  medium: 8,
  large: 12,
  xlarge: 16
};
