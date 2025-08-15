<template>
  <div class="admin-dashboard">
    <div class="dashboard-header">
      <h2>系统管理面板</h2>
      <el-button type="primary" @click="refreshAllData">刷新数据</el-button>
    </div>

    <el-tabs v-model="activeTab" type="border-card" @tab-change="handleTabChange">
      <!-- 用户管理标签页 -->
      <el-tab-pane label="用户管理" name="users">
        <div class="tab-content">
          <el-card class="admin-card">
            <template #header>
              <div class="card-header">
                <span>用户列表</span>
                <div class="header-actions">
                  <el-button type="primary" @click="showAddUserDialog" size="small">
                    <i class="el-icon-plus"></i> 添加用户
                  </el-button>
                </div>
              </div>
            </template>
            
            <el-table :data="admin.users" style="width: 100%" empty-text="暂无用户数据" v-loading="admin.loadingUsers">
              <el-table-column prop="id" label="ID" width="80"></el-table-column>
              <el-table-column prop="username" label="用户名"></el-table-column>
              <el-table-column prop="is_admin" label="管理员" width="100">
                <template #default="scope">
                  <el-tag :type="scope.row.is_admin ? 'danger' : 'info'">
                    {{ scope.row.is_admin ? '是' : '否' }}
                  </el-tag>
                </template>
              </el-table-column>
              <el-table-column label="API密钥" width="200">
                <template #default="scope">
                  <div class="api-key-cell">
                    <span class="api-key-text">{{ truncatedText(scope.row.api_key, 20) }}</span>
                    <el-button 
                      type="text" 
                      @click="copyToClipboard(scope.row.api_key)"
                      icon="el-icon-document-copy"
                      size="small"
                    >
                      复制
                    </el-button>
                  </div>
                </template>
              </el-table-column>
              <el-table-column label="操作" width="200">
                <template #default="scope">
                  <el-button 
                    size="small" 
                    type="warning" 
                    @click="showEditApiKeyDialog(scope.row)"
                  >
                    更新密钥
                  </el-button>
                  <el-button 
                    size="small" 
                    type="danger" 
                    @click="deleteUser(scope.row.id)"
                    :disabled="scope.row.is_admin"
                  >
                    删除
                  </el-button>
                </template>
              </el-table-column>
            </el-table>
          </el-card>
        </div>
      </el-tab-pane>
      
      <!-- 在线用户标签页 -->
      <el-tab-pane label="在线用户" name="active-users">
        <div class="tab-content">
          <el-card class="admin-card">
            <template #header>
              <div class="card-header">
                <span>在线用户</span>
              </div>
            </template>
            
            <el-table :data="presence.activeUsers" style="width: 100%" empty-text="暂无在线用户" v-loading="presence.loading">
              <el-table-column prop="id" label="用户ID" width="80"></el-table-column>
              <el-table-column prop="username" label="用户名"></el-table-column>
              <el-table-column prop="totalConnections" label="连接数" width="100"></el-table-column>
              <el-table-column label="浏览器分布" width="200">
                <template #default="scope">
                  <div class="browser-info" v-for="(count, browser) in scope.row.browsers" :key="browser">
                    {{ browser }}: {{ count }}
                  </div>
                </template>
              </el-table-column>
              <el-table-column label="连接详情" width="300">
                <template #default="scope">
                  <div class="connection-info" v-for="(conn, index) in scope.row.connections" :key="conn.socketId">
                    <div class="connection-detail">
                      <el-row :gutter="10">
                        <el-col :span="8">
                          <div class="detail-item">
                            <strong>IP:</strong> {{ conn.ip }}
                          </div>
                        </el-col>
                        <el-col :span="8">
                          <div class="detail-item">
                            <strong>连接时间:</strong> {{ formatToShanghaiTime(conn.connectedAt) }}
                          </div>
                        </el-col>
                        <el-col :span="8">
                          <div class="detail-item">
                            <strong>Socket ID:</strong> {{ truncatedText(conn.socketId, 10) }}
                          </div>
                        </el-col>
                      </el-row>
                      <div class="detail-item">
                        <strong>User Agent:</strong> {{ conn.userAgent }}
                      </div>
                    </div>
                    <el-divider v-if="index < scope.row.connections.length - 1"></el-divider>
                  </div>
                </template>
              </el-table-column>
            </el-table>
          </el-card>
        </div>
      </el-tab-pane>
      
      <el-tab-pane label="访问记录" name="access-logs">
        <div class="tab-content">
          <el-card class="admin-card">
            <template #header>
              <div class="card-header">
                <span>访问日志</span>
                <div class="header-actions">
                  <el-pagination
                    @current-change="handlePageChange"
                    :current-page="admin.logsPage"
                    :page-size="admin.logsSize"
                    :total="admin.logsTotal"
                    layout="prev, pager, next, jumper"
                    background
                    small
                  />
                </div>
              </div>
            </template>
            
            <el-table :data="admin.accessLogs" style="width: 100%" empty-text="暂无访问记录" v-loading="admin.loadingLogs">
              <el-table-column prop="ip_address" label="IP地址" width="150"></el-table-column>
              <el-table-column prop="request_path" label="请求路径"></el-table-column>
              <el-table-column prop="request_method" label="请求方法" width="100"></el-table-column>
              <el-table-column prop="user_agent" label="用户代理">
                <template #default="scope">
                  <div class="user-agent">{{ truncatedText(scope.row.user_agent, 50) }}</div>
                </template>
              </el-table-column>
              <el-table-column prop="timestamp" label="访问时间" width="180">
                <template #default="scope">
                  {{ formatToShanghaiTime(scope.row.timestamp) }}
                </template>
              </el-table-column>
            </el-table>
            
            <div class="pagination-footer">
              <el-pagination
                @current-change="handlePageChange"
                :current-page="admin.logsPage"
                :page-size="admin.logsSize"
                :total="admin.logsTotal"
                layout="prev, pager, next, jumper"
                background
                small
              />
            </div>
          </el-card>
        </div>
      </el-tab-pane>
    </el-tabs>
    
    <!-- 添加用户对话框 -->
    <el-dialog title="添加用户" v-model="addUserDialogVisible" width="400px">
      <el-form :model="newUser" label-width="80px">
        <el-form-item label="用户名">
          <el-input v-model="newUser.username" autocomplete="off"></el-input>
        </el-form-item>
        <el-form-item label="API密钥">
          <el-input v-model="newUser.apiKey" autocomplete="off"></el-input>
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="addUserDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="handleAddUser">确定</el-button>
        </span>
      </template>
    </el-dialog>
    
    <!-- 编辑API密钥对话框 -->
    <el-dialog title="更新API密钥" v-model="editApiKeyDialogVisible" width="400px">
      <el-form :model="editingUser" label-width="80px">
        <el-form-item label="用户名">
          <el-input v-model="editingUser.username" disabled></el-input>
        </el-form-item>
        <el-form-item label="新API密钥">
          <el-input v-model="editingUser.apiKey" autocomplete="off"></el-input>
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="editApiKeyDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="handleUpdateApiKey">确定</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script>
import { reactive, ref, onMounted } from 'vue';
import { useAdminStore } from '../stores/adminStore';
import { usePresenceStore } from '../stores/presenceStore';
import { useAuthStore } from '../stores/authStore';
import { ElMessage } from 'element-plus';

export default {
  name: 'AdminDashboard',
  setup(){
    const admin = useAdminStore();
    const presence = usePresenceStore();
    const auth = useAuthStore();

    const activeTab = ref('users');
    const addUserDialogVisible = ref(false);
    const editApiKeyDialogVisible = ref(false);
    const newUser = reactive({ username:'', apiKey:'' });
    const editingUser = reactive({ id:null, username:'', apiKey:'' });

    function truncatedText(text, maxLength = 100){ if (!text) return ''; return text.length > maxLength ? text.substring(0, maxLength) + '...' : text; }
    function formatToShanghaiTime(dateString){ const date = new Date(dateString); return new Intl.DateTimeFormat('zh-CN', { timeZone:'Asia/Shanghai', year:'numeric', month:'2-digit', day:'2-digit', hour:'2-digit', minute:'2-digit', second:'2-digit', hour12:false }).format(date); }

    async function refreshAllData(){ await Promise.all([ admin.loadUsers(auth.apiKey), presence.load(auth.apiKey), admin.loadLogs(auth.apiKey) ]); }

    function handleTabChange(tabName){ switch(tabName){ case 'users': if(!admin.users.length) admin.loadUsers(auth.apiKey); break; case 'active-users': presence.load(auth.apiKey); break; case 'access-logs': admin.loadLogs(auth.apiKey); break; } }
    function handlePageChange(page){ admin.logsPage = page; admin.loadLogs(auth.apiKey); }

    function showAddUserDialog(){ newUser.username=''; newUser.apiKey=''; addUserDialogVisible.value=true; }
    function showEditApiKeyDialog(user){ editingUser.id=user.id; editingUser.username=user.username; editingUser.apiKey=''; editApiKeyDialogVisible.value=true; }

    async function handleAddUser(){ if(!newUser.username || !newUser.apiKey){ ElMessage.error('请输入用户名与 API 密钥'); return; } try { await admin.addUser({ username:newUser.username, apiKey:newUser.apiKey }, auth.apiKey); ElMessage.success('用户创建成功'); addUserDialogVisible.value=false; } catch(e){ ElMessage.error('创建失败'); console.error(e); } }
    async function handleUpdateApiKey(){ if(!editingUser.apiKey){ ElMessage.error('请输入新密钥'); return; } try { await admin.updateApiKey(editingUser.id, editingUser.apiKey, auth.apiKey); ElMessage.success('密钥更新成功'); editApiKeyDialogVisible.value=false; } catch(e){ ElMessage.error('更新失败'); console.error(e); } }
    async function deleteUser(userId){ try { await admin.deleteUser(userId, auth.apiKey); ElMessage.success('删除成功'); } catch(e){ ElMessage.error('删除失败'); console.error(e); } }

    function copyToClipboard(text){ navigator.clipboard.writeText(text).then(()=>{ ElMessage.success('已复制'); }); }

    onMounted(()=>{ handleTabChange(activeTab.value); });

    return { admin, presence, auth, activeTab, addUserDialogVisible, editApiKeyDialogVisible, newUser, editingUser, truncatedText, formatToShanghaiTime, refreshAllData, handleTabChange, handlePageChange, showAddUserDialog, showEditApiKeyDialog, handleAddUser, handleUpdateApiKey, deleteUser, copyToClipboard };
  }
};
</script>

<style scoped>
.admin-dashboard {
  padding: 20px;
}

.dashboard-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.dashboard-header h2 {
  margin: 0;
}

.admin-card {
  margin-bottom: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.header-actions {
  display: flex;
  gap: 10px;
}

.browser-info {
  margin-bottom: 5px;
}

.connection-detail {
  margin-bottom: 10px;
}

.detail-item {
  margin-bottom: 5px;
  font-size: 12px;
}

.user-agent {
  font-size: 12px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.api-key-cell {
  display: flex;
  align-items: center;
  gap: 10px;
}

.api-key-text {
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
}

.pagination-footer {
  display: flex;
  justify-content: center;
  margin-top: 20px;
}
</style>