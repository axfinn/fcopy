import { defineStore } from 'pinia';
import { getUsers, addUser as apiAddUser, deleteUser as apiDeleteUser, updateUserApiKey } from '../apis/userApi';
import { getAccessLogs } from '../apis/logApi';

export const useAdminStore = defineStore('admin', {
  state: () => ({ users: [], accessLogs: [], logsPage:1, logsSize:10, logsTotal:0, loadingUsers:false, loadingLogs:false, saving:false }),
  actions: {
    async loadUsers(apiKey){ this.loadingUsers=true; try { const r = await getUsers(apiKey); this.users = r.data || r; } finally { this.loadingUsers=false; }},
    async loadLogs(apiKey){ this.loadingLogs=true; try { const r = await getAccessLogs({ page:this.logsPage, size:this.logsSize }, apiKey); this.accessLogs = r.data?.items || r.data || []; this.logsTotal = r.data?.total || r.total || 0; } finally { this.loadingLogs=false; }},
    async addUser(payload, apiKey){ this.saving=true; try { await apiAddUser(payload, apiKey); await this.loadUsers(apiKey); } finally { this.saving=false; }},
    async deleteUser(id, apiKey){ this.saving=true; try { await apiDeleteUser(id, apiKey); await this.loadUsers(apiKey); } finally { this.saving=false; }},
    async updateApiKey(id, newKey, apiKey){ this.saving=true; try { await updateUserApiKey(id, newKey, apiKey); await this.loadUsers(apiKey); } finally { this.saving=false; }}
  }
});
