 <template>
  <div id="app">
    <!-- 背景容器 -->
    <div class="background-container">
      <div 
        class="background-slide"
        :style="{ 
          backgroundImage: `url(${store.state.currentBackground})`
        }"
      ></div>
    </div>
    
    <!-- 登录视图 (放在最外层以避免被遮挡) -->
    <LoginView 
      v-if="!store.state.isAuthenticated" 
      @authenticate="handleAuthenticate"
      class="login-view"
      :github-info="store.state.githubInfo"
    />
    
    <!-- 头部组件 -->
    <AppHeader 
      v-if="store.state.isAuthenticated"
      :is-authenticated="store.state.isAuthenticated"
      @logout="handleLogout"
    />
    
    <!-- 主要内容区域 -->
    <div class="app-container" v-if="store.state.isAuthenticated">
      <el-container class="main-container">
        <el-main class="content-main">
          <MainView 
            :api-key="store.state.apiKey"
            :is-admin="store.state.isAdmin"
            :users="store.state.users"
            :active-users="store.state.activeUsers"
            :access-logs="store.state.accessLogs"
            :clipboard-items="store.state.clipboardItems"
            :current-page="store.state.currentPage"
            :page-size="store.state.pageSize"
            :total-items="store.state.totalItems"
            @update-clipboard-items="updateClipboardItems"
            @add-text-content="handleAddTextContent"
            @file-success="handleFileSuccess"
            @file-error="handleFileError"
            @copy-to-clipboard="copyToClipboard"
            @download-file="downloadFile"
            @preview-text-file="previewTextFile"
            @preview-pdf-file="previewPdfFile"
            @delete-item="handleDeleteItem"
            @add-user="handleAddUser"
            @delete-user="handleDeleteUser"
            @fetch-active-users="fetchActiveUsers"
            @update-access-logs="updateAccessLogs"
            @tab-change="handleTabChange"
            @current-change="handleCurrentChange"
            @size-change="handleSizeChange"
            @search="handleSearch"
            @page-change="handlePageChange"
          />
        </el-main>
        
      </el-container>
    </div>
    
    <!-- 底部信息 -->
    <Footer 
      v-if="store.state.isAuthenticated"
      :github-info="store.state.githubInfo"
    />
    
    <!-- 文本预览对话框 -->
    <el-dialog
      v-model="textPreviewDialogVisible"
      title="文本预览"
      width="80%"
      class="file-preview-dialog"
      :before-close="handleTextPreviewClose"
    >
      <div class="text-file-container">
        <pre class="text-preview-content">{{ textPreviewContent }}</pre>
      </div>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="textPreviewDialogVisible = false">关闭</el-button>
        </span>
      </template>
    </el-dialog>
    
    <!-- PDF预览对话框 -->
    <el-dialog
      v-model="pdfPreviewDialogVisible"
      title="PDF预览"
      width="80%"
      class="file-preview-dialog"
      :before-close="handlePdfPreviewClose"
    >
      <div class="pdf-file-container" v-if="previewFile">
        <iframe 
          :src="`/api/clipboard/file/${previewFile.id}`" 
          width="100%" 
          height="600"
          frameborder="0"
        ></iframe>
      </div>
      <div v-else class="pdf-file-container">
        <p>文件加载中...</p>
      </div>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="pdfPreviewDialogVisible = false">关闭</el-button>
        </span>
      </template>
    </el-dialog>
    
    <!-- 文件上传对话框 -->
    <el-dialog
      v-model="uploadFileDialogVisible"
      title="上传文件"
      width="500px"
      :before-close="handleUploadFileClose"
    >
      <el-upload
        class="upload-demo"
        drag
        :action="uploadUrl"
        :headers="uploadHeaders"
        :on-success="handleUploadSuccess"
        :on-error="handleUploadError"
        multiple
      >
        <i class="el-icon-upload"></i>
        <div class="el-upload__text">将文件拖到此处，或<em>点击上传</em></div>
        <template #tip>
          <div class="el-upload__tip">只能上传jpg/png/gif/pdf/doc/docx/xls/xlsx/ppt/pptx/txt/md文件，且不超过10MB</div>
        </template>
      </el-upload>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="uploadFileDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="confirmUpload">确定</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script>
import { defineComponent } from 'vue';
import store from './store';
import api from './services/api.js';
import socket from './services/socket.js';
import LoginView from './components/LoginView.vue';
import MainView from './components/MainView.vue';
import Footer from './components/Footer.vue';
import AppHeader from './components/AppHeader.vue';

export default defineComponent({
  name: 'ClipboardApp',
  components: {
    LoginView,
    MainView,
    Footer,
    AppHeader
  },
  data() {
    return {
      textPreviewContent: '',
      textPreviewDialogVisible: false,
      pdfPreviewDialogVisible: false,
      previewFile: null
    };
  },
  // 添加计算属性，确保模板中可以访问store
  computed: {
    store() {
      return store;
    }
  },
  mounted() {
    // 将$message服务添加到window对象，以便在store中使用
    if (this.$message) {
      window.$message = this.$message;
    }
    
    // 尝试从本地存储获取API密钥
    const storedApiKey = localStorage.getItem('clipboard_api_key');
    if (storedApiKey) {
      this.handleAuthenticate(storedApiKey);
    }
    
    // 初始化背景
    store.mutations.initializeBackground();
    
    // 添加粘贴事件监听器
    document.addEventListener('paste', this.handlePaste);
    
    // 初始化WebSocket连接
    this.initWebSocket();
  },

  methods: {
    // 初始化WebSocket连接
    initWebSocket() {
      if (!store.state.apiKey) return;
      
      // 如果已有连接，先关闭旧连接
      socket.disconnect();
      
      // 使用socket服务连接
      socket.connect(store.state.apiKey);
      
      // 监听剪贴板更新事件
      socket.on('clipboard-update', (data) => {
        try {
          console.log('收到WebSocket消息:', data);
          // 将新内容添加到列表顶部
          store.mutations.ADD_CLIPBOARD_ITEM(data);
          if (window.$message) {
            window.$message.success('收到新内容');
          }
        } catch (error) {
          console.error('处理WebSocket消息时出错:', error);
        }
      });
      
      // 监听用户更新事件
      socket.on('user-update', (data) => {
        store.mutations.SET_ACTIVE_USERS(data);
      });
    },
    
    // 处理用户认证
    async handleAuthenticate(apiKey) {
      try {
        const response = await api.authenticate(apiKey);
        if (response.success) {
          // 更新认证状态
          store.mutations.SET_AUTHENTICATED(true);
          store.mutations.SET_API_KEY(apiKey);
          // 修复：正确访问认证响应中的管理员字段
          store.mutations.SET_ADMIN(response.admin);
          
          // 保存API密钥到本地存储
          localStorage.setItem('clipboard_api_key', apiKey);
          
          // 初始化WebSocket连接
          this.initWebSocket();
          
          // 获取初始数据
          await this.loadInitialData();
          
          if (window.$message) {
            window.$message.success('认证成功');
          }
        } else {
          throw new Error(response.message || '认证失败');
        }
      } catch (error) {
        console.error('认证失败:', error);
        store.mutations.SET_AUTHENTICATED(false);
        store.mutations.SET_API_KEY(null);
        localStorage.removeItem('clipboard_api_key');
        
        if (window.$message) {
          window.$message.error(error.message || '认证失败');
        }
      }
    },
    
    // 加载初始数据
    async loadInitialData() {
      try {
        // 获取剪贴板历史记录
        await this.updateClipboardItems({ page: 1, size: 10 });
        
        // 如果是管理员，获取用户和访问日志
        if (store.state.isAdmin) {
          await this.updateUsers();
          await this.updateAccessLogs({ page: 1, size: 10 });
        } else {
          // 如果是普通用户，获取活跃用户
          await this.fetchActiveUsers();
        }
      } catch (error) {
        console.error('加载初始数据失败:', error);
        if (window.$message) {
          window.$message.error('加载数据失败');
        }
      }
    },
    
    // 更新剪贴板项目
    async updateClipboardItems(params = {}) {
      try {
        store.mutations.SET_LOADING('clipboard', true);
        const response = await api.getClipboardHistory({
          page: params.page || store.state.currentPage,
          size: params.size || store.state.pageSize,
          search: params.search || store.state.searchKeyword
        });
        
        if (response.success) {
          store.mutations.SET_CLIPBOARD_ITEMS(response.data.items || response.data);
          store.mutations.SET_TOTAL_ITEMS(response.data.total || 0);
        } else {
          throw new Error(response.error || '获取剪贴板历史失败');
        }
      } catch (error) {
        console.error('获取剪贴板历史失败:', error);
        store.mutations.SET_CLIPBOARD_ITEMS([]);
        if (window.$message) {
          window.$message.error(error.message || '获取剪贴板历史失败');
        }
      } finally {
        store.mutations.SET_LOADING('clipboard', false);
      }
    },
    
    // 获取活跃用户
    async fetchActiveUsers() {
      if (!store.state.isAdmin) {
        try {
          store.mutations.SET_LOADING('activeUsers', true);
          const response = await api.getActiveUsers();
          if (response.success) {
            store.mutations.SET_ACTIVE_USERS(response.data);
          } else {
            throw new Error(response.error || '获取活跃用户失败');
          }
        } catch (error) {
          console.error('获取活跃用户失败:', error);
          if (window.$message) {
            window.$message.error(error.message || '获取活跃用户失败');
          }
        } finally {
          store.mutations.SET_LOADING('activeUsers', false);
        }
      }
    },
    
    // 更新访问日志
    async updateAccessLogs(params = {}) {
      try {
        store.mutations.SET_LOADING('accessLogs', true);
        const response = await api.getAccessLogs({
          page: params.page || store.state.currentPage,
          size: params.size || store.state.pageSize
        });
        
        if (response.success) {
          store.mutations.SET_ACCESS_LOGS(response.data.items);
          store.mutations.SET_TOTAL_ITEMS(response.data.total);
        } else {
          throw new Error(response.error || '获取访问日志失败');
        }
      } catch (error) {
        console.error('获取访问日志失败:', error);
        store.mutations.SET_ACCESS_LOGS([]);
        if (window.$message) {
          window.$message.error(error.message || '获取访问日志失败');
        }
      } finally {
        store.mutations.SET_LOADING('accessLogs', false);
      }
    },
    
    // 更新用户列表
    async updateUsers() {
      try {
        store.mutations.SET_LOADING('users', true);
        const response = await api.getUsers();
        if (response.success) {
          store.mutations.SET_USERS(response.data);
        } else {
          throw new Error(response.error || '获取用户列表失败');
        }
      } catch (error) {
        console.error('获取用户列表失败:', error);
        store.mutations.SET_USERS([]);
        if (window.$message) {
          window.$message.error(error.message || '获取用户列表失败');
        }
      } finally {
        store.mutations.SET_LOADING('users', false);
      }
    },
    
    // 添加用户
    async handleAddUser(userData) {
      try {
        const response = await api.addUser(userData);
        if (response.success) {
          await this.updateUsers();
          if (window.$message) {
            window.$message.success('用户添加成功');
          }
        } else {
          throw new Error(response.error || '添加用户失败');
        }
      } catch (error) {
        console.error('添加用户失败:', error);
        if (window.$message) {
          window.$message.error(error.message || '添加用户失败');
        }
      }
    },
    
    // 删除用户
    async handleDeleteUser(userId) {
      try {
        const response = await api.deleteUser(userId);
        if (response.success) {
          await this.updateUsers();
          if (window.$message) {
            window.$message.success('用户删除成功');
          }
        } else {
          throw new Error(response.error || '删除用户失败');
        }
      } catch (error) {
        console.error('删除用户失败:', error);
        if (window.$message) {
          window.$message.error(error.message || '删除用户失败');
        }
      }
    },
    
    // 处理登出
    handleLogout() {
      // 断开WebSocket连接
      socket.disconnect();
      
      // 清除认证状态
      store.mutations.SET_AUTHENTICATED(false);
      store.mutations.SET_API_KEY(null);
      store.mutations.SET_ADMIN(false);
      
      // 清除本地存储
      localStorage.removeItem('clipboard_api_key');
      
      // 清空用户数据
      store.mutations.SET_CLIPBOARD_ITEMS([]);
      store.mutations.SET_USERS([]);
      store.mutations.SET_ACTIVE_USERS([]);
      store.mutations.SET_ACCESS_LOGS([]);
      
      if (window.$message) {
        window.$message.success('已登出');
      }
    },
    
    // 处理添加文本内容
    async handleAddTextContent(content) {
      try {
        const response = await api.addTextContent(content);
        if (response.id) {
          // 通过WebSocket实时更新，不需要手动刷新列表
          if (window.$message) {
            window.$message.success('内容添加成功');
          }
        } else {
          throw new Error(response.error || '添加内容失败');
        }
      } catch (error) {
        console.error('添加内容失败:', error);
        if (window.$message) {
          window.$message.error(error.message || '添加内容失败');
        }
      }
    },
    
    // 处理文件上传成功
    handleFileSuccess() {
      // 通过WebSocket实时更新，不需要手动刷新列表
      if (window.$message) {
        window.$message.success('文件上传成功');
      }
    },
    
    // 处理文件上传错误
    handleFileError(error) {
      console.error('文件上传失败:', error);
      if (window.$message) {
        window.$message.error(error.message || '文件上传失败');
      }
    },
    
    // 复制到剪贴板
    copyToClipboard(content) {
      navigator.clipboard.writeText(content).then(() => {
        if (window.$message) {
          window.$message.success('已复制到剪贴板');
        }
      }).catch(err => {
        console.error('复制失败:', err);
        if (window.$message) {
          window.$message.error('复制失败');
        }
      });
    },
    
    // 下载文件
    async downloadFile(fileId, fileName) {
      try {
        const response = await api.downloadFile(fileId);
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = fileName;
        link.click();
        window.URL.revokeObjectURL(url);
      } catch (error) {
        console.error('下载失败:', error);
        if (window.$message) {
          window.$message.error('下载失败');
        }
      }
    },
    
    // 预览文本文件
    async previewTextFile(file) {
      try {
        const response = await fetch(`/api/clipboard/file/${file.id}`, {
          headers: {
            'X-API-Key': store.state.apiKey
          }
        });
        if (response.ok) {
          this.textPreviewContent = await response.text();
          this.textPreviewDialogVisible = true;
          this.previewFile = file;
        } else {
          throw new Error('获取文件内容失败');
        }
      } catch (error) {
        console.error('预览文件失败:', error);
        if (window.$message) {
          window.$message.error('预览文件失败');
        }
      }
    },
    
    // 预览PDF文件
    previewPdfFile(file) {
      this.pdfPreviewDialogVisible = true;
      this.previewFile = file;
    },
    
    // 处理文本预览关闭
    handleTextPreviewClose() {
      this.textPreviewDialogVisible = false;
      this.textPreviewContent = '';
      this.previewFile = null;
    },
    
    // 处理PDF预览关闭
    handlePdfPreviewClose() {
      this.pdfPreviewDialogVisible = false;
      this.previewFile = null;
    },
    
    // 删除项目
    async handleDeleteItem(id) {
      try {
        const response = await api.deleteClipboardItem(id);
        if (response.success) {
          // 更新剪贴板项目列表
          await this.updateClipboardItems();
          if (window.$message) {
            window.$message.success('删除成功');
          }
        } else {
          throw new Error(response.error || '删除失败');
        }
      } catch (error) {
        console.error('删除失败:', error);
        if (window.$message) {
          window.$message.error(error.message || '删除失败');
        }
      }
    },
    
    // 处理标签页切换
    handleTabChange(tab) {
      // 根据标签页加载相应数据
      switch(tab) {
        case 'clipboard':
          this.updateClipboardItems();
          break;
        case 'admin':
          if (store.state.isAdmin) {
            this.updateUsers();
            this.updateAccessLogs({ page: 1, size: store.state.pageSize });
          }
          break;
        case 'user-info':
          this.fetchActiveUsers();
          break;
      }
    },
    
    // 处理页码变化
    handleCurrentChange(page) {
      store.mutations.SET_CURRENT_PAGE(page);
      // 根据当前标签页更新数据
      const activeTab = this.$refs.mainView ? this.$refs.mainView.activeTab : 'clipboard';
      switch(activeTab) {
        case 'clipboard':
          this.updateClipboardItems({ page });
          break;
        case 'admin':
          this.updateAccessLogs({ page });
          break;
      }
    },
    
    // 处理页面大小变化
    handleSizeChange(size) {
      store.mutations.SET_PAGE_SIZE(size);
      store.mutations.SET_CURRENT_PAGE(1); // 重置到第一页
      // 根据当前标签页更新数据
      const activeTab = this.$refs.mainView ? this.$refs.mainView.activeTab : 'clipboard';
      switch(activeTab) {
        case 'clipboard':
          this.updateClipboardItems({ page: 1, size });
          break;
        case 'admin':
          this.updateAccessLogs({ page: 1, size });
          break;
      }
    },
    
    // 处理搜索
    handleSearch(keyword) {
      store.mutations.SET_SEARCH_KEYWORD(keyword);
      store.mutations.SET_CURRENT_PAGE(1); // 重置到第一页
      this.updateClipboardItems({ page: 1, search: keyword });
    },
    
    // 处理页面变化
    handlePageChange(page) {
      this.handleCurrentChange(page);
    },
    
    
    // 处理粘贴事件
    async handlePaste(event) {
      const items = (event.clipboardData || event.originalEvent.clipboardData).items;
      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        if (item.kind === 'file') {
          // 处理文件粘贴
          const file = item.getAsFile();
          const formData = new FormData();
          formData.append('file', file);
          
          try {
            const response = await fetch('/api/clipboard/file', {
              method: 'POST',
              headers: {
                'X-API-Key': store.state.apiKey
              },
              body: formData
            });
            
            const result = await response.json();
            if (result.success) {
              await this.updateClipboardItems();
              if (window.$message) {
                window.$message.success('文件上传成功');
              }
            } else {
              throw new Error(result.error || '文件上传失败');
            }
          } catch (error) {
            console.error('文件上传失败:', error);
            if (window.$message) {
              window.$message.error(error.message || '文件上传失败');
            }
          }
        } else if (item.kind === 'string') {
          // 处理文本粘贴
          item.getAsString(async (text) => {
            if (text.trim()) {
              await this.handleAddTextContent(text);
            }
          });
        }
      }
    }
  },
  
  beforeUnmount() {
    // 清理事件监听器
    document.removeEventListener('paste', this.handlePaste);
    
    // 断开WebSocket连接
    socket.disconnect();
  }
});
</script>

<style>
#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  color: #2c3e50;
  min-height: 100vh;
  position: relative;
  display: flex;
  flex-direction: column;
}

/* 背景样式 */
.background-container {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: -1;
  overflow: hidden;
}

.background-slide {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
  transition: opacity 0.5s ease;
}

.login-view {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 100;
}

.app-container {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: calc(100vh - 120px); /* 减去头部和底部的高度 */
  padding-top: 60px;
}

.main-container {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.content-main {
  padding: 20px;
  flex: 1;
}

.github-footer {
  padding: 10px 0;
  background-color: #f5f5f5;
  border-top: 1px solid #ebeef5;
}

.file-preview-dialog .el-dialog__body {
  padding: 0;
}

.text-file-container {
  max-height: 60vh;
  overflow-y: auto;
  padding: 20px;
}

.text-preview-content {
  white-space: pre-wrap;
  word-wrap: break-word;
  margin: 0;
  font-family: 'Courier New', Courier, monospace;
}

.pdf-file-container {
  text-align: center;
}

/* 滚动条样式 */
::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}

::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 4px;
}

::-webkit-scrollbar-thumb {
  background: #c1c1c1;
  border-radius: 4px;
}

::-webkit-scrollbar-thumb:hover {
  background: #a8a8a8;
}

/* 移动端适配 */
@media (max-width: 768px) {
  .app-container {
    min-height: calc(100vh - 100px);
    padding-top: 50px;
  }
  
  .content-main {
    padding: 15px;
  }
}

@media (max-width: 480px) {
  .app-container {
    min-height: calc(100vh - 80px);
    padding-top: 45px;
  }
  
  .content-main {
    padding: 10px;
  }
}
</style>