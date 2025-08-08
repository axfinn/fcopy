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
            
            <el-table :data="users" style="width: 100%" empty-text="暂无用户数据" v-loading="loading.users">
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
            
            <el-table :data="activeUsers" style="width: 100%" empty-text="暂无在线用户" v-loading="loading.activeUsers">
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
                    :current-page="pagination.currentPage"
                    :page-size="pagination.pageSize"
                    :total="pagination.total"
                    layout="prev, pager, next, jumper"
                    background
                    small
                  />
                </div>
              </div>
            </template>
            
            <el-table :data="accessLogs" style="width: 100%" empty-text="暂无访问记录" v-loading="loading.accessLogs">
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
                :current-page="pagination.currentPage"
                :page-size="pagination.pageSize"
                :total="pagination.total"
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
import api from '../services/api.js';

export default {
  name: 'AdminDashboard',
  data() {
    return {
      activeTab: 'users',
      loading: {
        users: false,
        activeUsers: false,
        accessLogs: false
      },
      users: [],
      activeUsers: [],
      accessLogs: [],
      pagination: {
        currentPage: 1,
        pageSize: 50,
        total: 0
      },
      addUserDialogVisible: false,
      editApiKeyDialogVisible: false,
      newUser: {
        username: '',
        apiKey: ''
      },
      editingUser: {
        id: null,
        username: '',
        apiKey: ''
      }
    };
  },
  mounted() {
    this.loadDataForActiveTab();
  },
  methods: {
    // 截断文本显示
    truncatedText(text, maxLength = 100) {
      if (!text) return '';
      return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
    },
    
    // 格式化时间为上海时区
    formatToShanghaiTime(dateString) {
      const date = new Date(dateString);
      // 使用Intl.DateTimeFormat格式化为上海时区时间
      return new Intl.DateTimeFormat('zh-CN', {
        timeZone: 'Asia/Shanghai',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false
      }).format(date);
    },
    
    async refreshAllData() {
      await this.loadUsers();
      await this.loadActiveUsers();
      await this.loadAccessLogs();
    },
    
    handleTabChange(tabName) {
      this.activeTab = tabName;
      this.loadDataForActiveTab();
    },
    
    loadDataForActiveTab() {
      switch (this.activeTab) {
        case 'users':
          this.loadUsers();
          break;
        case 'active-users':
          this.loadActiveUsers();
          break;
        case 'access-logs':
          this.loadAccessLogs();
          break;
      }
    },
    
    async loadUsers() {
      this.loading.users = true;
      try {
        const response = await api.getUsers();
        if (response.success) {
          this.users = response.data;
        } else {
          this.$message.error(response.error || '获取用户列表失败');
        }
      } catch (error) {
        console.error('获取用户列表失败:', error);
        this.$message.error('获取用户列表失败');
      } finally {
        this.loading.users = false;
      }
    },
    
    async loadActiveUsers() {
      this.loading.activeUsers = true;
      try {
        const response = await api.getActiveUsers();
        if (response.success) {
          this.activeUsers = response.data;
        } else {
          this.$message.error(response.error || '获取活跃用户失败');
        }
      } catch (error) {
        console.error('获取活跃用户失败:', error);
        this.$message.error('获取活跃用户失败');
      } finally {
        this.loading.activeUsers = false;
      }
    },
    
    async loadAccessLogs() {
      this.loading.accessLogs = true;
      try {
        const response = await api.getAccessLogs({
          page: this.pagination.currentPage,
          size: this.pagination.pageSize
        });
        
        if (response.success) {
          this.accessLogs = response.data;
          this.pagination.total = response.total;
        } else {
          this.$message.error(response.error || '获取访问日志失败');
        }
      } catch (error) {
        console.error('获取访问日志失败:', error);
        this.$message.error('获取访问日志失败');
      } finally {
        this.loading.accessLogs = false;
      }
    },
    
    handlePageChange(page) {
      this.pagination.currentPage = page;
      this.loadAccessLogs();
    },
    
    showAddUserDialog() {
      this.newUser = {
        username: '',
        apiKey: ''
      };
      this.addUserDialogVisible = true;
    },
    
    showEditApiKeyDialog(user) {
      this.editingUser = {
        id: user.id,
        username: user.username,
        apiKey: ''
      };
      this.editApiKeyDialogVisible = true;
    },
    
    async handleAddUser() {
      try {
        const response = await api.addUser(this.newUser);
        if (response.success) {
          this.$message.success('用户添加成功');
          this.addUserDialogVisible = false;
          this.loadUsers();
        } else {
          this.$message.error(response.error || '添加用户失败');
        }
      } catch (error) {
        console.error('添加用户失败:', error);
        this.$message.error('添加用户失败');
      }
    },
    
    async handleUpdateApiKey() {
      try {
        const response = await api.updateUserApiKey(this.editingUser.id, this.editingUser.apiKey);
        if (response.success) {
          this.$message.success('API密钥更新成功');
          this.editApiKeyDialogVisible = false;
          this.loadUsers();
        } else {
          this.$message.error(response.error || '更新API密钥失败');
        }
      } catch (error) {
        console.error('更新API密钥失败:', error);
        this.$message.error('更新API密钥失败');
      }
    },
    
    async deleteUser(userId) {
      try {
        await this.$confirm('确认删除该用户吗？', '提示', {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          type: 'warning'
        });
        
        const response = await api.deleteUser(userId);
        if (response.success) {
          this.$message.success('用户删除成功');
          this.loadUsers();
        } else {
          this.$message.error(response.error || '删除用户失败');
        }
      } catch (error) {
        if (error !== 'cancel') {
          console.error('删除用户失败:', error);
          this.$message.error('删除用户失败');
        }
      }
    },
    
    copyToClipboard(text) {
      navigator.clipboard.writeText(text).then(() => {
        this.$message.success('复制成功');
      }).catch(() => {
        this.$message.error('复制失败');
      });
    }
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