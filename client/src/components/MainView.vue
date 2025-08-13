<template>
  <div class="main-view">
    <el-tabs v-model="activeTab" @tab-change="handleTabChange" class="main-tabs" stretch>
      <!-- 剪贴板内容标签页 -->
      <el-tab-pane label="剪贴板" name="clipboard">
        <el-row :gutter="20">
          <el-col :span="24">
            <ClipboardHistoryImproved 
              :api-key="apiKey"
              :clipboard-items="clipboardItems"
              @update-clipboard-items="$emit('update-clipboard-items', $event)"
              @copy-to-clipboard="$emit('copy-to-clipboard', $event)"
              @download-file="(fileId, fileName, mimeType) => $emit('download-file', fileId, fileName, mimeType)"
              @preview-text-file="$emit('preview-text-file', $event)"
              @preview-pdf-file="$emit('preview-pdf-file', $event)"
              @delete-item="$emit('delete-item', $event)"
            />
          </el-col>
        </el-row>
      </el-tab-pane>
      
      <!-- 聊天标签页 -->
      <el-tab-pane label="聊天" name="chat">
        <el-row :gutter="20">
          <el-col :span="24">
            <ChatBox 
              :api-key="apiKey"
              @message-sent="handleMessageSent"
              @file-uploaded="handleFileUploaded"
              @preview-text="$emit('preview-text-file', $event)"
              @download-file="handleDownloadFile"
              ref="chatBox"
            />
          </el-col>
        </el-row>
      </el-tab-pane>
      
      <!-- 管理面板标签页 (仅管理员可见) -->
      <el-tab-pane label="管理面板" name="admin" v-if="isAdmin">
        <el-row :gutter="20">
          <el-col :span="24">
            <AdminDashboard 
              :users="users"
              :active-users="activeUsers"
              :access-logs="accessLogs"
              :current-page="currentPage"
              :page-size="pageSize"
              :total-items="totalItems"
              @add-user="$emit('add-user', $event)"
              @delete-user="$emit('delete-user', $event)"
              @update-user-apikey="$emit('update-user-apikey', $event)"
              @page-change="$emit('page-change', $event)"
              @fetch-admin-data="$emit('fetch-admin-data')"
            />
          </el-col>
        </el-row>
      </el-tab-pane>
      
      <!-- 用户信息标签页 (普通用户可见) -->
      <el-tab-pane label="我的连接" name="user-info" v-if="!isAdmin">
        <el-row :gutter="20">
          <el-col :span="24">
            <MyConnections 
              :active-users="activeUsers"
            />
          </el-col>
        </el-row>
      </el-tab-pane>
    </el-tabs>
  </div>
</template>

<script>
import ClipboardHistoryImproved from './ClipboardHistoryImproved.vue';
import ChatBox from './ChatBox.vue';
import AdminDashboard from './AdminDashboard.vue';
import MyConnections from './MyConnections.vue';

export default {
  name: 'MainView',
  components: {
    ClipboardHistoryImproved,
    ChatBox,
    AdminDashboard,
    MyConnections
  },
  props: {
    apiKey: String,
    clipboardItems: Array,
    accessLogs: Array,
    rateLimits: Object,
    isAdmin: Boolean,
    users: Array,
    activeUsers: Array,
    // 分页相关props
    currentPage: {
      type: Number,
      default: 1
    },
    pageSize: {
      type: Number,
      default: 10
    },
    totalItems: {
      type: Number,
      default: 0
    }
  },
  data() {
    return {
      activeTab: 'clipboard'
    };
  },
  methods: {
    handlePageChange(page) {
      this.$emit('page-change', page);
    },
    
    handleSizeChange(size) {
      this.$emit('size-change', size);
    },
    
    handleSearch(keyword) {
      this.$emit('search', keyword);
    },
    
    handleTabChange(name) {
      this.$emit('tab-change', name);
    },
    
    fetchActiveUsers() {
      this.$emit('fetch-active-users');
    },
    
    fetchAdminData() {
      this.$emit('fetch-admin-data');
    },
    
    handleMessageSent(result) {
      this.$emit('add-text-content', result.content);
    },
    
    handleFileUploaded(result) {
      this.$emit('file-success', result);
    },
    
    handleDownloadFile(message) {
      this.$emit('download-file', message.id, message.file_name, message.mime_type);
    },
    
    // 从外部添加消息到聊天框（WebSocket等）
    addMessageToChat(message) {
      if (this.$refs.chatBox) {
        this.$refs.chatBox.addMessage(message);
      }
    }
  },
  watch: {
    // 当用户切换到"我的连接"标签页时，自动获取活跃用户数据
    activeTab: {
      handler(newValue) {
        if (newValue === 'user-info' && this.activeUsers.length === 0) {
          this.fetchActiveUsers();
        }
        // 当管理员切换到管理面板标签页时，获取相关数据
        if (newValue === 'admin' && this.isAdmin) {
          this.fetchAdminData();
        }
      },
      immediate: true // 立即执行一次，确保初始加载时也能获取数据
    }
  },
  emits: ['page-change', 'size-change', 'search', 'delete-item', 'preview-text', 'preview-file', 'copy-to-clipboard', 'add-user', 'delete-user', 'update-user-apikey', 'tab-change', 'fetch-active-users', 'fetch-admin-data']
};
</script>

<style scoped>
.main-view {
  padding: 10px 10px 40px;
}

.main-tabs {
  border-radius: var(--radius-lg);
}

.card {
  background: white;
  border-radius: 10px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.05);
  padding: 20px;
  transition: all 0.3s ease;
  margin-bottom: 20px;
}

.card:hover {
  box-shadow: 0 4px 20px 0 rgba(0, 0, 0, 0.1);
}

.card-header {
  border-bottom: 1px solid #eee;
  padding-bottom: 15px;
  margin-bottom: 20px;
}

.card-header h3 {
  margin: 0;
  color: #333;
  display: flex;
  align-items: center;
  gap: 10px;
}

.card-header h3 i {
  color: #409EFF;
}
</style>