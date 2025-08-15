import { ref, computed } from 'vue';
import { authenticate } from '../apis/authApi';
import { useNotify } from './useNotify';

export function useAuth(){
  const { success, error } = useNotify();
  const apiKey = ref(null);
  const isAuthenticated = ref(false);
  const isAdmin = ref(false);
  const username = ref('');

  async function login(key){
    try {
      apiKey.value = key;
      const resp = await authenticate(key);
      if(resp.success){
        isAuthenticated.value = true;
        isAdmin.value = !!resp.admin;
        username.value = resp.username || '';
        localStorage.setItem('clipboard_api_key', key);
        success('认证成功');
      } else throw new Error(resp.message || '认证失败');
    } catch(e){
      apiKey.value = null;
      isAuthenticated.value = false;
      localStorage.removeItem('clipboard_api_key');
      error(e.message||'认证失败');
      throw e;
    }
  }

  function logout(){
    apiKey.value = null;
    isAuthenticated.value = false;
    isAdmin.value = false;
    username.value='';
    localStorage.removeItem('clipboard_api_key');
    success('已登出');
  }

  return { apiKey, isAuthenticated, isAdmin, username, login, logout };
}
