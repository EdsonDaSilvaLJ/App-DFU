import { useState, useEffect } from 'react';
import { auth } from '../config/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import API_CONFIG, { makeAuthenticatedRequest, buildURL } from '../config/api';

export const useUserSync = () => {
  const [syncStatus, setSyncStatus] = useState('checking'); // checking, synced, needs_sync, error
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  const checkUserSyncStatus = async (firebaseUser) => {
    if (!firebaseUser) {
      setSyncStatus('error');
      setLoading(false);
      return;
    }

    try {
      console.log('🔍 Verificando sincronização do usuário...');

      const token = await firebaseUser.getIdToken();

      // ⭐ VERIFICAR SE PROFISSIONAL EXISTE NO MONGODB
      const response = await makeAuthenticatedRequest(
        buildURL(API_CONFIG.ENDPOINTS.PROFISSIONAL_PROFILE), // ⭐ USAR CONSTANTE
        { method: 'GET' },
        token
      );

      if (response.ok) {
        const userData = await response.json();
        console.log('✅ Usuário sincronizado:', userData);

        setUserProfile(userData);
        setSyncStatus('synced');
      } else if (response.status === 404) {
        console.log('⚠️ Profissional não encontrado no MongoDB - precisa re-cadastrar');
        setSyncStatus('needs_sync');
      } else {
        throw new Error(`HTTP ${response.status}`);
      }
    } catch (error) {
      console.error('❌ Erro ao verificar sincronização:', error);
      setSyncStatus('error');
    } finally {
      setLoading(false);
    }
  };

  const syncUserData = async (userData) => {
    try {
      setLoading(true);
      console.log('🔄 Sincronizando dados do profissional...');

      const token = await auth.currentUser.getIdToken();

      // ⭐ USAR MESMA ROTA DO LOGUP (POST /logup)
      const response = await makeAuthenticatedRequest(
        buildURL(API_CONFIG.ENDPOINTS.SIGNUP), // /logup
        {
          method: 'POST',
          body: JSON.stringify({
            // ⭐ DADOS CONFORME MODEL PROFISSIONAL
            nome: userData.nome,
            email: auth.currentUser.email, // Email do Firebase
            telefone: userData.telefone,
            cpf: userData.cpf,
            tipoProfissional: userData.tipoProfissional,
            crm: userData.crm || null,
            // ⭐ NÃO ENVIAR SENHA (já existe no Firebase)
          })
        },
        token
      );

      if (response.ok) {
        const savedUser = await response.json();
        setUserProfile(savedUser.profissional || savedUser);
        setSyncStatus('synced');
        console.log('✅ Profissional sincronizado com sucesso');
        return { success: true, user: savedUser.profissional || savedUser };
      } else {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP ${response.status}`);
      }
    } catch (error) {
      console.error('❌ Erro na sincronização:', error);
      setSyncStatus('error');
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      if (firebaseUser) {
        checkUserSyncStatus(firebaseUser);
      } else {
        setSyncStatus('error');
        setUserProfile(null);
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  return {
    syncStatus,
    userProfile,
    loading,
    syncUserData,
    recheckSync: () => checkUserSyncStatus(auth.currentUser)
  };
};