// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth } from "firebase/auth";

// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyBlmO9s4xQoh113pXEUjdUEeAW1Rxl4hWY",
  authDomain:"dfu-app1.firebaseapp.com",
  projectId: "dfu-app1",
  storageBucket: "dfu-app1.firebasestorage.app",
  messagingSenderId: "766727258367",
  appId: "1:766727258367:web:af25b32f9ea60c18964cca",
  measurementId: "G-M3XZLZ74QV"
};

const requiredVars = [
  'EXPO_PUBLIC_FIREBASE_API_KEY',
  'EXPO_PUBLIC_FIREBASE_PROJECT_ID',
  'EXPO_PUBLIC_FIREBASE_APP_ID',
  'EXPO_PUBLIC_API_URL',
  'EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN',
  'EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET',
  'EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID'
];

for (const varName of requiredVars) {
  if (!process.env[varName]) {
    throw new Error(`❌ Variável de ambiente obrigatória não encontrada: ${varName}`);
  }
}


// Inicializa o app do Firebase (conexão firebase e react)
const app = initializeApp(firebaseConfig);

// ⭐ CONFIGURAR AUTH COM PERSISTÊNCIA
export const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(AsyncStorage)
});

//auth é o objeto de autenticação do Firebase, usado para gerenciar usuários autenticados
// ele pode ser usado para registrar usuários, fazer login, logout, etc. então representa a conexão do Firebase com o React
// também pode ser usado para obter o token do usuário autenticado, que é necessário para autenticar requisições para o backend 
// ou outros serviços que exigem autenticação do Firebase


// Função global para obter o token Firebase do usuário autenticado
// Esta função pode ser usada em qualquer parte do aplicativo para obter o token do usuário autenticado
// Ela verifica se o usuário está autenticado e, se sim, retorna o token. Caso contrário, lança um erro.
// É importante tratar erros ao chamar essa função, pois pode ocorrer um erro se o usuário não estiver autenticado ou se houver problemas ao obter o token.
// O token é usado para autenticar requisições para o backend ou outros serviços que exigem autenticação do Firebase.
// A função retorna o token como uma string ou null se ocorrer um erro.

export const getFirebaseToken = async (auth) => {
  try {
    const user = auth.currentUser
    if (user) {
      const token = await user.getIdToken();
      return token;
    } else {
      throw new Error('Usuário não autenticado');
    }
  } catch (error) {
    console.error('Erro ao obter token:', error);
    return null;
  }
};

export default app;