<template>
  <div class="main-view">
    <el-tabs v-model="activeTab" @tab-change="handleTabChange" class="main-tabs" stretch>
      <!-- 剪贴板内容标签页 -->
      <el-tab-pane label="剪贴板" name="clipboard">
        <el-row :gutter="20">
          <el-col :span="24">
            <ClipboardList :api-key="auth.apiKey" :clipboard-items="clipboard.items" />
          </el-col>
        </el-row>
      </el-tab-pane>
      
      <!-- 添加内容标签页 -->
      <el-tab-pane label="添加内容" name="add">
        <el-row :gutter="20">
          <el-col :span="24">
            <AddContent :api-key="auth.apiKey" @text-added="handleTextAdded" @file-success="handleFileSuccess" />
          </el-col>
        </el-row>
      </el-tab-pane>
      
      <!-- 管理面板标签页 (仅管理员可见) -->
      <el-tab-pane label="管理面板" name="admin" v-if="auth.isAdmin">
        <el-row :gutter="20">
          <el-col :span="24">
            <AdminDashboard :users="admin.users" :active-users="presence.activeUsers" :access-logs="admin.accessLogs" />
          </el-col>
        </el-row>
      </el-tab-pane>
      
      <!-- 用户信息标签页 (普通用户可见) -->
      <el-tab-pane label="我的连接" name="user-info" v-if="!auth.isAdmin">
        <el-row :gutter="20">
          <el-col :span="24">
            <MyConnections :active-users="presence.activeUsers" />
          </el-col>
        </el-row>
      </el-tab-pane>
    </el-tabs>
  </div>
</template>

<script>
import { defineComponent, ref, watch } from 'vue';
import { useAuthStore } from '../stores/authStore';
import { useClipboardStore } from '../stores/clipboardStore';
import { usePresenceStore } from '../stores/presenceStore';
import { useAdminStore } from '../stores/adminStore';
import ClipboardList from '../features/clipboard/components/ClipboardList.vue';
import AddContent from './AddContent.vue';
import AdminDashboard from './AdminDashboard.vue';
import MyConnections from './MyConnections.vue';

export default defineComponent({
  name: 'MainView',
  components: {
    ClipboardList,
    AddContent,
    AdminDashboard,
    MyConnections
  },
  setup() {
    const auth = useAuthStore();
    const clipboard = useClipboardStore();
    const presence = usePresenceStore();
    const admin = useAdminStore();
    const activeTab = ref('clipboard');

    async function handleTabChange(name) {
      if (name === 'clipboard') { if(!clipboard.items.length) clipboard.load(auth.apiKey); }
      if (name === 'user-info') presence.load(auth.apiKey);
      if (name === 'admin' && auth.isAdmin) {
        if (!admin.users.length) admin.loadUsers(auth.apiKey);
        if (!admin.accessLogs.length) admin.loadLogs(auth.apiKey);
      }
    }

    // 处理文本添加成功
    function handleTextAdded() {
      clipboard.load(auth.apiKey); // 重新加载剪贴板数据
    }

    // 处理文件上传成功
    function handleFileSuccess() {
      clipboard.load(auth.apiKey); // 重新加载剪贴板数据
    }

    watch(activeTab, (v) => handleTabChange(v), { immediate: true });

    return { auth, clipboard, presence, admin, activeTab, handleTabChange, handleTextAdded, handleFileSuccess };
  }
});
</script>

<style scoped>
.main-view {
  padding: 20px;
  background-color: #f5f5f5;
  min-height: calc(100vh - 120px);
}

.main-tabs {
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
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