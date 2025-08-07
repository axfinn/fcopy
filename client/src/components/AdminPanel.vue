<template>
  <div class="card">
    <div class="card-header">
      <h3><i class="el-icon-setting"></i> 系统管理</h3>
    </div>
    
    <el-tabs type="border-card" class="admin-tabs">
      <!-- 用户管理标签页 -->
      <el-tab-pane label="用户管理">
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
            
            <el-table :data="users" style="width: 100%" empty-text="暂无用户数据">
              <el-table-column prop="id" label="ID" width="80"></el-table-column>
              <el-table-column prop="username" label="用户名"></el-table-column>
              <el-table-column prop="is_admin" label="管理员" width="100">
                <template #default="scope">
                  <el-tag :type="scope.row.is_admin ? 'danger' : 'info'">
                    {{ scope.row.is_admin ? '是' : '否' }}
                  </el-tag>
                </template>
              </el-table-column>
              <el-table-column label="操作" width="150">
                <template #default="scope">
                  <el-button 
                    size="small" 
                    type="danger" 
                    @click="deleteUser(scope.row.id)"
                    :disabled="scope.row.is_admin"
                  >
                    <i class="el-icon-delete"></i> 删除
                  </el-button>
                </template>
              </el-table-column>
            </el-table>
          </el-card>
        </div>
      </el-tab-pane>
      
      <!-- 活跃客户端标签页 -->
      <el-tab-pane label="活跃客户端">
        <div class="tab-content">
          <el-card class="admin-card">
            <template #header>
              <div class="card-header">
                <span>当前活跃客户端</span>
              </div>
            </template>
            
            <el-table :data="activeUsers" style="width: 100%" empty-text="暂无活跃客户端">
              <el-table-column prop="id" label="用户ID" width="100"></el-table-column>
              <el-table-column prop="username" label="用户名"></el-table-column>
              <el-table-column prop="is_admin" label="管理员" width="100">
                <template #default="scope">
                  <el-tag :type="scope.row.is_admin ? 'danger' : 'info'">
                    {{ scope.row.is_admin ? '是' : '否' }}
                  </el-tag>
                </template>
              </el-table-column>
              <el-table-column prop="totalConnections" label="连接数" width="100">
                <template #default="scope">
                  {{ scope.row.totalConnections }}
                </template>
              </el-table-column>
              <el-table-column label="浏览器详情" width="250">
                <template #default="scope">
                  <div v-for="(count, browser) in scope.row.browsers" :key="browser" class="browser-info">
                    <el-tag size="small" type="info">{{ browser }}: {{ count }}</el-tag>
                  </div>
                </template>
              </el-table-column>
              <el-table-column label="连接详情" width="300">
                <template #default="scope">
                  <div v-for="conn in scope.row.connections" :key="conn.socketId" class="connection-info">
                    <div class="connection-detail">
                      <div>IP: {{ conn.ip }}</div>
                      <div>User Agent: {{ truncatedText(conn.userAgent, 50) }}</div>
                      <div>连接时间: {{ formatToShanghaiTime(conn.connectedAt) }}</div>
                    </div>
                  </div>
                </template>
              </el-table-column>
            </el-table>
          </el-card>
        </div>
      </el-tab-pane>
      
      <el-tab-pane label="访问记录">
        <div class="tab-content">
          <el-card class="admin-card">
            <template #header>
              <div class="card-header">
                <span>访问日志</span>
              </div>
            </template>
            
            <el-table :data="accessLogs" style="width: 100%" empty-text="暂无访问记录">
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
          <el-button type="primary" @click="addUser">确定</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script>
export default {
  name: 'AdminPanel',
  props: {
    users: Array,
    activeUsers: Array,
    accessLogs: Array
  },
  data() {
    return {
      addUserDialogVisible: false,
      newUser: {
        username: '',
        apiKey: ''
      },
      currentPage: 1,
      pageSize: 50,
      totalItems: 0
    };
  },
  methods: {
    // 显示添加用户对话框
    showAddUserDialog() {
      this.addUserDialogVisible = true;
      this.newUser = {
        username: '',
        apiKey: ''
      };
    },
    
    // 添加用户
    addUser() {
      if (!this.newUser.username || !this.newUser.apiKey) {
        this.$message.error('用户名和API密钥不能为空');
        return;
      }
      
      this.$emit('add-user', {
        username: this.newUser.username,
        apiKey: this.newUser.apiKey
      });
      
      this.addUserDialogVisible = false;
    },
    
    // 删除用户
    deleteUser(userId) {
      this.$emit('delete-user', userId);
    },
    
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

    // 处理分页变化
    handlePageChange(page) {
      this.currentPage = page;
      this.fetchAccessLogs();
    },

    // 处理页面大小变化
    handleSizeChange(size) {
      this.pageSize = size;
      this.currentPage = 1;
      this.fetchAccessLogs();
    },

    // 获取访问日志
    fetchAccessLogs() {
      // 构建查询参数
      const params = new URLSearchParams({
        page: this.currentPage,
        size: this.pageSize
      });

      // 发送事件到父组件获取访问日志
      this.$emit('update-access-logs', params);
    }
  },
  emits: ['add-user', 'delete-user']
};
</script>

<style scoped>
.admin-panel {
  padding: 20px 0;
}

.admin-tabs {
  border-radius: 15px;
  overflow: hidden;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  border: none;
}

.tab-content {
  min-height: 400px;
}

.admin-card {
  border-radius: 10px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(5px);
  border: none;
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

.user-agent {
  max-width: 200px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

@media (max-width: 768px) {
  .admin-panel {
    padding: 10px 0;
  }
  
  .card-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 10px;
  }
  
  .header-actions {
    width: 100%;
    justify-content: flex-end;
  }
  
  .user-agent {
    max-width: 100px;
  }
}

.browser-info {
  margin-bottom: 4px;
}

.browser-info:last-child {
  margin-bottom: 0;
}

.connection-info {
  margin-bottom: 8px;
  padding: 5px;
  background-color: #f5f7fa;
  border-radius: 4px;
}

.connection-info:last-child {
  margin-bottom: 0;
}

.connection-detail {
  font-size: 12px;
  color: #666;
}
</style>