import { defineStore } from 'pinia';
import { getUsers, addUser as apiAddUser, deleteUser as apiDeleteUser } from '../apis/userApi';
import { getAccessLogs } from '../apis/logApi';

export const useAdminStore = defineStore('admin', {
  state: () => ({ users: [], accessLogs: [], logsPage:1, logsSize:10, logsTotal:0, loadingUsers:false, loadingLogs:false, saving:false }),
  actions: {
    async loadUsers(apiKey){ this.loadingUsers=true; try { const r = await getUsers(apiKey); this.users = r.data || r; } finally { this.loadingUsers=false; }},
    async loadLogs(apiKey){ this.loadingLogs=true; try { const r = await getAccessLogs({ page:this.logsPage, size:this.logsSize }, apiKey); this.accessLogs = r.data?.items || r.data || []; this.logsTotal = r.data?.total || r.total || 0; } finally { this.loadingLogs=false; }},
    async addUser(payload, apiKey){ this.saving=true; try { await apiAddUser(payload, apiKey); await this.loadUsers(apiKey); } finally { this.saving=false; }},
    async deleteUser(id, apiKey){ this.saving=true; try { await apiDeleteUser(id, apiKey); await this.loadUsers(apiKey); } finally { this.saving=false; }},
    async updateApiKey(id, newKey, apiKey){ /* 如果后端有更新密钥接口可在此实现 */ console.warn('updateApiKey 未实现, 请在 apis/userApi.js 中添加'); }
  }
});
