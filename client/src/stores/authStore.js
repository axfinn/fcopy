import { defineStore } from 'pinia';
import { authenticate } from '../apis/authApi';

export const useAuthStore = defineStore('auth', {
  state: () => ({
    apiKey: null,
    isAuthenticated: false,
    isAdmin: false,
    username: '',
  }),
  actions: {
    async login(key){
      this.apiKey = key;
      const resp = await authenticate(key);
      if(resp.success){
        this.isAuthenticated = true;
        this.isAdmin = !!resp.admin;
        this.username = resp.username || '';
        localStorage.setItem('clipboard_api_key', key);
      } else {
        this.logout();
        throw new Error(resp.message || '认证失败');
      }
    },
    logout(){
      this.apiKey = null;
      this.isAuthenticated = false;
      this.isAdmin = false;
      this.username='';
      localStorage.removeItem('clipboard_api_key');
    },
    initFromLocal(){
      const saved = localStorage.getItem('clipboard_api_key');
      if(saved){ this.apiKey = saved; }
    }
  }
});
