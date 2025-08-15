import { defineStore } from 'pinia';
import { getActiveUsers } from '../apis/logApi';

export const usePresenceStore = defineStore('presence', {
  state: () => ({ activeUsers: [], loading:false }),
  actions: {
    set(list){ this.activeUsers = list; },
    async load(apiKey){
      this.loading = true;
      try { const r = await getActiveUsers(apiKey); this.activeUsers = r.data || r; } finally { this.loading=false; }
    }
  }
});
