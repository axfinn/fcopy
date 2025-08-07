<template>
  <div class="main-view">
    <el-tabs v-model="activeTab" @tab-click="handleTabChange" class="main-tabs" stretch>
      <!-- 剪贴板内容标签页 -->
      <el-tab-pane label="剪贴板" name="clipboard">
        <el-row :gutter="20">
          <el-col :span="24">
            <ClipboardHistoryImproved 
              :api-key="apiKey"
              @copy-to-clipboard="$emit('copy-to-clipboard', $event)"
              @download-file="(fileId, fileName, mimeType) => $emit('download-file', fileId, fileName, mimeType)"
              @preview-text-file="$emit('preview-text-file', $event)"
              @preview-pdf-file="$emit('preview-pdf-file', $event)"
              @delete-item="$emit('delete-item', $event)"
            />
          </el-col>
        </el-row>
      </el-tab-pane>
      
      <!-- 添加内容标签页 -->
      <el-tab-pane label="添加内容" name="add">
        <AddContent 
          :api-key="apiKey"
          @text-added="$emit('add-text-content', $event)"
          @file-success="$emit('file-success', $event)"
          @file-error="$emit('file-error', $event)"
        />
      </el-tab-pane>
      
      <!-- 管理面板标签页 (仅管理员可见) -->
      <el-tab-pane label="管理面板" name="admin" v-if="isAdmin">
        <el-row :gutter="20">
          <el-col :span="24">
            <AdminPanel 
              :users="users"
              :active-users="activeUsers"
              :access-logs="accessLogs"
              @add-user="$emit('add-user', $event)"
              @delete-user="$emit('delete-user', $event)"
              @update-access-logs="updateAccessLogs"
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
import AddContent from './AddContent.vue';
import AdminPanel from './AdminPanel.vue';
import MyConnections from './MyConnections.vue';

export default {
  name: 'MainView',
  components: {
    ClipboardHistoryImproved,
    AddContent,
    AdminPanel,
    MyConnections
  },
  props: {
    apiKey: String,
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
    handleTabChange(tab) {
      this.$emit('tab-change', tab);
    },
    
    // 更新访问日志（带分页参数）
    updateAccessLogs(params) {
      this.$emit('update-access-logs', params);
    },
    
    // 处理分页变化
    handlePaginationChange(page) {
      this.$emit('update:current-page', page);
      // 可以在这里添加其他分页逻辑
    },
    
    // 处理每页数量变化
    handleSizeChange(size) {
      this.$emit('update:page-size', size);
      // 可以在这里添加其他分页逻辑
    }
  },
  emits: [
    'add-text-content',
    'file-success',
    'file-error',
    'copy-to-clipboard',
    'download-file',
    'delete-item',
    'add-user',
    'delete-user',
    'preview-text-file',
    'preview-pdf-file',
    'update-clipboard-items',
    'tab-change',
    'update-access-logs',
    // 分页相关emits
    'update:current-page',
    'update:page-size'
  ]
}
</script>

<style scoped>
.main-view {
  width: 100%;
  padding: 0;
  margin: 0;
  position: relative;
  z-index: 50;
}

.main-tabs {
  border-radius: 15px;
  overflow: hidden;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  border: none;
  flex: 1;
  position: relative;
  z-index: 51;
}

.main-tabs ::v-deep(.el-tabs__content) {
  position: relative;
  z-index: 52;
}

.main-tabs ::v-deep(.el-tab-pane) {
  position: relative;
  z-index: 53;
}

@media (max-width: 768px) {
  .main-tabs {
    border-radius: 10px;
  }
}
</style>