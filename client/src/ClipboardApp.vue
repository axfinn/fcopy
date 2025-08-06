<template>
  <div id="app">
    <!-- 背景容器 -->
    <div class="background-container">
      <div 
        v-for="(image, index) in backgroundImages" 
        :key="index"
        class="background-slide"
        :style="{ 
          backgroundImage: `url(${image})`,
          opacity: currentBackgroundIndex === index ? 1 : 0,
          transition: 'opacity 1s ease-in-out'
        }"
      ></div>
    </div>
    
    <!-- 主要内容区域 -->
    <div class="app-container">
      <el-container class="main-container">
        <AppHeader 
          :is-authenticated="isAuthenticated" 
          :is-admin="isAdmin"
          :users="users"
          @logout="logout"
        />
        
        <el-main class="content-main">
          <LoginView 
            v-if="!isAuthenticated" 
            @authenticate="authenticate"
            @login-success="handleLoginSuccess"
          />
          
          <MainView 
            v-else
            :api-key="apiKey"
            :clipboard-items="clipboardItems"
            :access-logs="accessLogs"
            :rate-limits="rateLimits"
            :is-admin="isAdmin"
            :users="users"
            :active-users="activeUsers"
            @add-text-content="addTextContent"
            @file-success="handleFileSuccess"
            @file-error="handleFileError"
            @copy-to-clipboard="copyToClipboard"
            @download-file="downloadFileById"
            @delete-item="deleteItem"
            @add-user="addUser"
            @delete-user="deleteUser"
            @preview-text-file="previewTextFile"
            @preview-pdf-file="previewPdfFile"
          />
        </el-main>
        
        <GitHubInfo 
          :github-info="githubInfo" 
          :is-authenticated="isAuthenticated"
        />
      </el-container>
    </div>
  </div>
</template>
```

```vue
/Volumes/M20/code/docs/fcopy/client/src/ClipboardApp.vue
```

```css
<<<<<<< SEARCH
<style scoped>
#app {
  font-family: 'Helvetica Neue', Helvetica, 'PingFang SC', 'Hiragino Sans GB', Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  position: relative;
  min-height: 100vh;
  background-color: #f5f7fa;
}

.background-container {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
  z-index: -1;
  opacity: 0.9;
  transition: background-image 1s ease-in-out;
}

.app-overlay {
  position: relative;
  min-height: 100vh;
  background: rgba(255, 255, 255, 0.85);
  backdrop-filter: blur(5px);
}

.el-container {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.el-main {
  flex: 1;
  padding: 20px;
  display: flex;
  flex-direction: column;
}

.el-header {
  background-color: transparent !important;
  padding: 0 !important;
  height: auto !important;
  line-height: normal !important;
  position: relative !important;
  z-index: 1000 !important;
  width: 100%;
}

.el-footer {
  background-color: transparent !important;
  padding: 20px !important;
  position: relative !important;
  z-index: 999 !important;
}

/* 全局按钮样式优化 */
.el-button {
  border-radius: 8px;
  font-weight: 500;
  transition: all 0.3s ease;
}

.el-button:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

/* 全局卡片样式优化 */
.el-card {
  border-radius: 15px;
  box-shadow: 0 5px 20px rgba(0, 0, 0, 0.08);
  border: none;
  transition: all 0.3s ease;
}

.el-card:hover {
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.12);
}

/* 全局输入框样式优化 */
.el-input__inner,
.el-textarea__inner {
  border-radius: 10px;
  border: 1px solid #dcdfe6;
  transition: border-color 0.3s ease;
}

.el-input__inner:focus,
.el-textarea__inner:focus {
  border-color: #409EFF;
  box-shadow: 0 0 0 3px rgba(64, 158, 255, 0.1);
}

/* 响应式设计 */
@media (max-width: 768px) {
  .el-main {
    padding: 15px;
  }
  
  .el-card {
    border-radius: 12px;
  }
  
  .el-button {
    font-size: 14px;
    padding: 10px 16px;
  }
  
  .el-input__inner {
    font-size: 14px;
  }
  
  .el-textarea__inner {
    font-size: 14px;
  }
  
  .content-preview {
    font-size: 14px;
  }
  
  .clipboard-meta {
    flex-direction: column;
    gap: 5px;
    font-size: 12px;
  }
  
  .el-card__body {
    padding: 15px;
  }
  
  .header-content {
    flex-direction: column;
    gap: 10px;
  }
  
  .header-content h1 {
    font-size: 1.2rem;
    text-align: center;
    width: 100%;
  }
  
  .auth-info {
    justify-content: center;
  }
}

@media (max-width: 480px) {
  .github-stats {
    font-size: 14px;
  }
  
  .stat-item {
    padding: 3px 8px;
  }
  
  .el-button {
    font-size: 12px;
    padding: 8px 12px;
  }
  
  .el-input__inner {
    font-size: 14px;
  }
  
  .el-textarea__inner {
    font-size: 14px;
  }
  
  .content-preview {
    font-size: 14px;
  }
  
  .clipboard-meta {
    flex-direction: column;
    gap: 5px;
    font-size: 12px;
  }
  
  .el-card__body {
    padding: 15px;
  }
  
  .header-content {
    flex-direction: column;
    gap: 10px;
  }
  
  .header-content h1 {
    font-size: 1.2rem;
    text-align: center;
    width: 100%;
  }
  
  .auth-info {
    justify-content: center;
  }
}
</style>

<script>
import { io } from 'socket.io-client';
import Chart from 'chart.js/auto';
import GitHubInfo from './components/GitHubInfo.vue';

export default {
  name: 'ClipboardApp',
  components: {
    GitHubInfo
  },
  data() {
    return {
      socket: null,
      isAuthenticated: false,
      isAdmin: false,
      apiKey: '',
      clipboardItems: [],
      accessLogs: [],
      rateLimits: {},
      users: [],
      activeUsers: [],
      newUser: {
        username: '',
        apiKey: ''
      },
      isAddingUser: false,
      loadingActiveUsers: false,
      textPreviewContent: '',
      textPreviewDialogVisible: false,
      pdfPreviewDialogVisible: false,
      newTextContent: '',
      backgroundImages: [
        'https://picsum.photos/1920/1080?random=1',
        'https://picsum.photos/1920/1080?random=2',
        'https://picsum.photos/1920/1080?random=3'
      ],
      currentBackground: ''
    };
  },
  mounted() {
    // 尝试从本地存储获取API密钥
    const storedApiKey = localStorage.getItem('clipboard_api_key');
    if (storedApiKey) {
      this.apiKey = storedApiKey;
      this.authenticate();
    }
    
    // 获取GitHub信息
    this.fetchGithubInfo();
    
    // 添加粘贴事件监听器
    document.addEventListener('paste', this.handlePaste);
    
    // 初始化背景图片
    this.updateBackground();
    setInterval(this.updateBackground, 30000); // 每30秒更换背景
  },
  methods: {
    // 更新背景图片
    updateBackground() {
      const randomIndex = Math.floor(Math.random() * this.backgroundImages.length);
      this.currentBackground = this.backgroundImages[randomIndex];
    },
    
    // 鉴权
    async authenticate(inputApiKey) {
      const authKey = inputApiKey || this.apiKey;
      
      if (!authKey) {
        this.$message.error('请输入 API 密钥');
        return;
      }
      
      // 尝试获取数据以验证密钥
      fetch('/api/clipboard', {
        headers: {
          'X-API-Key': authKey
        }
      })
      .then(response => {
        if (response.ok) {
          this.isAuthenticated = true;
          this.apiKey = authKey;
          localStorage.setItem('clipboard_api_key', authKey);
          this.connectSocket();
          this.fetchClipboardHistory();
          this.fetchAccessLogs();  // 获取访问日志
          this.fetchRateLimits();  // 获取限流状态
          this.fetchActiveUsers(); // 获取活跃用户
          
          // 每10秒刷新一次活跃用户列表
          if (this.activeUsersInterval) {
            clearInterval(this.activeUsersInterval);
          }
          this.activeUsersInterval = setInterval(this.fetchActiveUsers, 10000);
          
          // 检查是否为管理员
          this.checkAdminStatus();
          
          this.$message.success('鉴权成功');
        } else {
          this.$message.error('API 密钥无效');
        }
      })
      .catch(error => {
        console.error('鉴权失败:', error);
        this.$message.error('鉴权失败，请检查网络连接');
      });
    },
    
    // 登出
    logout() {
      console.log('登出按钮被点击');
      this.isAuthenticated = false;
      this.apiKey = '';
      this.activeTab = 'add';
      localStorage.removeItem('clipboard_api_key');
      if (this.socket) {
        this.socket.disconnect();
        this.socket = null;
      }
      if (this.activeUsersInterval) {
        clearInterval(this.activeUsersInterval);
        this.activeUsersInterval = null;
      }
      this.clipboardItems = [];
      this.accessLogs = [];
      this.rateLimits = [];
      this.users = [];
      this.activeUsers = [];
      this.isAdmin = false;
      
      // 清理图表
      if (this.accessChart) {
        this.accessChart.destroy();
        this.accessChart = null;
      }
      
      // 重置表单数据
      this.newUser = {
        username: '',
        apiKey: ''
      };
      this.newTextContent = '';
      this.previewFile = {};
      this.previewFileContent = '';
      
      console.log('登出完成');
    },
    
    // 获取剪贴板历史记录
    async fetchClipboardHistory() {
      try {
        const response = await fetch('/api/clipboard', {
          headers: {
            'X-API-Key': this.apiKey
          }
        });
        const result = await response.json();
        this.clipboardItems = result.data;
      } catch (error) {
        console.error('获取剪贴板历史失败:', error);
        this.$message.error('获取剪贴板历史失败');
      }
    },
    
    // 获取访问日志
    async fetchAccessLogs() {
      try {
        const response = await fetch('/api/access-logs', {
          headers: {
            'X-API-Key': this.apiKey
          }
        });
        const result = await response.json();
        this.accessLogs = result.data;
      } catch (error) {
        console.error('获取访问日志失败:', error);
        // 不显示错误消息，因为这可能是一个可选功能
      }
    },
    
    // 获取限流状态
    async fetchRateLimits() {
      try {
        const response = await fetch('/api/rate-limits', {
          headers: {
            'X-API-Key': this.apiKey
          }
        });
        const result = await response.json();
        this.rateLimits = result.data;
      } catch (error) {
        console.error('获取限流状态失败:', error);
        // 不显示错误消息，因为这可能是一个可选功能
      }
    },

    // 获取活跃用户列表
    async fetchActiveUsers() {
      try {
        const response = await fetch('/api/active-users', {
          headers: {
            'X-API-Key': this.apiKey
          }
        });
        
        if (!response.ok) {
          throw new Error('获取活跃用户失败');
        }
        
        const result = await response.json();
        // 添加连接时间信息
        const now = new Date();
        this.activeUsers = result.data.map(user => ({
          ...user,
          connectionTime: now
        }));
      } catch (error) {
        console.error('获取活跃用户失败:', error);
        // 不显示错误消息，因为普通用户没有权限访问此接口
      }
    },

    // 获取用户列表
    async fetchUsers() {
      if (!this.isAdmin) return;
      
      try {
        const response = await fetch('/api/users', {
          headers: {
            'X-API-Key': this.apiKey
          }
        });
        const result = await response.json();
        this.users = result.data;
      } catch (error) {
        console.error('获取用户列表失败:', error);
        this.$message.error('获取用户列表失败');
      }
    },

    // 添加用户
    async addUser(userData) {
      if (!userData.username || !userData.apiKey) {
        this.$message.warning('请填写完整的用户信息');
        return;
      }

      this.isAddingUser = true;
      try {
        const response = await fetch('/api/users', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-API-Key': this.apiKey
          },
          body: JSON.stringify(userData)
        });

        const result = await response.json();
        
        if (response.ok) {
          this.$message.success('用户创建成功');
          this.newUser.username = '';
          this.newUser.apiKey = '';
          this.fetchUsers(); // 刷新用户列表
        } else {
          this.$message.error(result.error || '创建用户失败');
        }
      } catch (error) {
        console.error('创建用户失败:', error);
        this.$message.error('创建用户失败');
      } finally {
        this.isAddingUser = false;
      }
    },

    // 删除用户
    async deleteUser(userId) {
      try {
        const response = await fetch(`/api/users/${userId}`, {
          method: 'DELETE',
          headers: {
            'X-API-Key': this.apiKey
          }
        });

        const result = await response.json();
        
        if (response.ok) {
          this.$message.success('用户删除成功');
          this.fetchUsers(); // 刷新用户列表
        } else {
          this.$message.error(result.error || '删除用户失败');
        }
      } catch (error) {
        console.error('删除用户失败:', error);
        this.$message.error('删除用户失败');
      }
    },

    // 获取GitHub项目信息
    async fetchGithubInfo() {
      try {
        // 调用GitHub API获取真实的项目信息
        const response = await fetch('https://api.github.com/repos/axfinn/fcopy');
        if (response.ok) {
          const data = await response.json();
          this.githubInfo = {
            stars: data.stargazers_count || 0,
            forks: data.forks_count || 0,
            version: 'v1.2.7', // 当前项目版本
            url: data.html_url || 'https://github.com/axfinn/fcopy'
          };
        } else {
          // 如果GitHub API调用失败，使用默认信息
          this.githubInfo = {
            stars: 0,
            forks: 0,
            version: 'v1.2.7', // 当前项目版本
            url: 'https://github.com/axfinn/fcopy'
          };
        }
      } catch (error) {
        console.error('获取GitHub信息失败:', error);
        // 使用默认信息
        this.githubInfo = {
          stars: 0,
          forks: 0,
          version: 'v1.2.7', // 当前项目版本
          url: 'https://github.com/axfinn/fcopy'
        };
      }
    },

    // 检查用户是否为管理员
    async checkAdminStatus() {
      try {
        const response = await fetch('/api/users/me', {
          headers: {
            'X-API-Key': this.apiKey
          }
        });
        
        if (response.ok) {
          const userData = await response.json();
          this.isAdmin = userData.is_admin || false;
          
          // 如果是管理员，获取用户列表
          if (this.isAdmin) {
            this.fetchUsers();
          }
        }
      } catch (error) {
        console.error('检查管理员状态失败:', error);
      }
    },
    
    // 添加文本内容
    async addTextContent(content) {
      if (!content.trim()) {
        this.$message.warning('请输入文本内容');
        return;
      }
      
      try {
        const response = await fetch('/api/clipboard/text', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-API-Key': this.apiKey
          },
          body: JSON.stringify({ content })
        });
        
        if (response.ok) {
          const result = await response.json();
          this.newTextContent = '';
          this.$message.success('文本已添加并同步');
        } else {
          this.$message.error('添加文本失败');
        }
      } catch (error) {
        console.error('添加文本失败:', error);
        this.$message.error('添加文本失败');
      }
    },
    
    // 文件上传成功回调
    handleFileSuccess(response, file, fileList) {
      this.$message.success('文件已上传并同步');
      // 重新获取列表以显示新项目
      this.fetchClipboardHistory();
    },
    
    // 文件上传失败回调
    handleFileError(error, file, fileList) {
      this.$message.error('文件上传失败: ' + (error.message || '未知错误'));
    },
    
    // 复制文本到剪贴板
    copyToClipboard(text) {
      // 首先尝试使用现代 Clipboard API
      if (navigator.clipboard && window.isSecureContext) {
        navigator.clipboard.writeText(text).then(() => {
          this.$message.success('文本已复制到剪贴板');
        }).catch(err => {
          console.error('Clipboard API 复制失败:', err);
          // 如果 Clipboard API 失败，使用备用方法
          this.fallbackCopyTextToClipboard(text);
        });
      } else {
        // 如果不支持 Clipboard API，使用备用方法
        this.fallbackCopyTextToClipboard(text);
      }
    },

    // 备用复制方法
    fallbackCopyTextToClipboard(text) {
      const textArea = document.createElement("textarea");
      textArea.value = text;
      
      // 避免滚动到底部
      textArea.style.top = "0";
      textArea.style.left = "0";
      textArea.style.position = "fixed";
      textArea.style.opacity = "0";
      
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      
      try {
        const successful = document.execCommand('copy');
        if (successful) {
          this.$message.success('文本已复制到剪贴板');
        } else {
          this.$message.error('复制失败');
        }
      } catch (err) {
        console.error('execCommand 复制失败:', err);
        this.$message.error('复制失败');
      }
      
      document.body.removeChild(textArea);
    },
    
    // 根据文件ID下载文件
    async downloadFileById(fileId, fileName) {
      try {
        // 使用新的下载API端点下载文件
        const response = await fetch(`/api/clipboard/download/${fileId}`, {
          headers: {
            'X-API-Key': this.apiKey
          }
        });
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || '下载失败');
        }
        
        // 创建下载链接
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        
        // 清理创建的URL和链接元素
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
      } catch (error) {
        console.error('下载文件失败:', error);
        this.$message.error('下载文件失败: ' + (error.message || '未知错误'));
      }
    },

    // 删除项目
    async deleteItem(id) {
      try {
        const response = await fetch(`/api/clipboard/${id}`, {
          method: 'DELETE',
          headers: {
            'X-API-Key': this.apiKey
          }
        });
        
        if (response.ok) {
          this.$message.success('删除成功');
          // 从列表中移除该项目
          this.clipboardItems = this.clipboardItems.filter(item => item.id !== id);
        } else {
          const result = await response.json();
          this.$message.error(result.error || '删除失败');
        }
      } catch (error) {
        console.error('删除失败:', error);
        this.$message.error('删除失败');
      }
    },
    
    // 预览文本文件
    async previewTextFile(item) {
      try {
        const response = await fetch(`/api/clipboard/file/${item.id}`);
        if (response.ok) {
          this.previewFileContent = await response.text();
          this.previewFile = item;
          this.textPreviewDialogVisible = true;
        } else {
          this.$message.error('文件预览失败');
        }
      } catch (error) {
        console.error('文件预览失败:', error);
        this.$message.error('文件预览失败');
      }
    },
    
    // 预览PDF文件
    previewPdfFile(item) {
      this.previewFile = item; // 包含ID在内的完整文件信息
      this.pdfPreviewDialogVisible = true;
    },

    // 处理粘贴事件
    handlePaste(event) {
      // 只在已认证状态下处理粘贴事件
      if (!this.isAuthenticated) return;
      
      const items = (event.clipboardData || event.originalEvent.clipboardData).items;
      
      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        
        // 检查是否为文件类型
        if (item.kind === 'file') {
          const file = item.getAsFile();
          if (file) {
            // 检查是否为图片类型
            if (file.type.startsWith('image/')) {
              this.$message.info('检测到截图，正在上传...');
              // 添加文件大小检查（例如限制为10MB）
              if (file.size > 10 * 1024 * 1024) { // 10MB in bytes
                this.$message.error('文件太大，最大支持10MB的截图');
                continue;
              }
            }
            
            // 添加文件类型检查
            if (!file.type.startsWith('image/') && 
                !file.type.startsWith('text/') && 
                file.type !== 'application/pdf') {
              this.$message.warning(`不支持的文件类型: ${file.type}`);
              continue;
            }
            
            this.uploadPastedFile(file);
          }
        }
      }
    },

    // 上传粘贴的文件
    uploadPastedFile(file) {
      const formData = new FormData();
      formData.append('file', file);
      
      fetch('/api/clipboard/file', {
        method: 'POST',
        headers: {
          'X-API-Key': this.apiKey
        },
        body: formData
      })
      .then(response => {
        if (response.ok) {
          return response.json();
        } else {
          throw new Error('上传失败');
        }
      })
      .then(result => {
        this.$message.success('截图已上传并同步');
        // 重新获取列表以显示新项目
        this.fetchClipboardHistory();
      })
      .catch(error => {
        console.error('上传截图失败:', error);
        this.$message.error('上传截图失败: ' + (error.message || '未知错误'));
      });
    },

    // 连接 Socket.IO 实现实时更新
    connectSocket() {
      // 使用相对路径连接WebSocket服务器
      this.socket = io('/', {
        auth: {
          apiKey: this.apiKey
        }
      });
      
      this.socket.on('clipboard-update', (data) => {
        // 将新内容添加到列表顶部
        this.clipboardItems.unshift(data);
        this.$message.success('收到新内容');
      });
      
      this.socket.on('clipboard-cleanup', () => {
        // 定期清理后重新获取数据
        this.fetchClipboardHistory();
        this.$message.info('系统已完成定期清理');
      });
      
      this.socket.on('connect_error', (error) => {
        console.error('WebSocket连接失败:', error);
        this.$message.error('连接失败: ' + error.message);
      });
      
      this.socket.on('disconnect', (reason) => {
        console.log('WebSocket断开连接:', reason);
      });
    }
  }
};
</script>

<style scoped>
#app {
  position: relative;
  min-height: 100vh;
  padding: 0;
  margin: 0;
}

.background-container {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
  z-index: -1;
  transition: background-image 1s ease-in-out;
}

.app-overlay {
  min-height: 100vh;
  padding: 0;
  margin: 0;
  background: rgba(255, 255, 255, 0.85);
  backdrop-filter: blur(5px);
}

.el-container {
  min-height: 100vh;
  padding: 0;
  margin: 0;
}

.el-main {
  flex: 1;
  padding: 20px;
  margin: 0;
}

/* 保持原有媒体查询样式不变 */
@media (max-width: 768px) {
  #app {
    padding: 10px;
  }
  
  .el-card__body {
    padding: 15px;
  }
}
</style>
  box-shadow: 0 2px 8px rgba(0,0,0,0.15);
  background-color: #f56c6c !important;
  border-color: #f56c6c !important;
  color: white !important;
}

.auth-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 70vh;
}

.auth-card {
  width: 100%;
  max-width: 500px;
  border-radius: 15px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
  border: none;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
}

.auth-card-header {
  text-align: center;
  margin-bottom: 30px;
}

.auth-card-header i {
  font-size: 3rem;
  color: #409EFF;
  margin-bottom: 15px;
}

.auth-card-header h2 {
  margin: 0;
  color: #333;
  font-size: 1.8rem;
}

.auth-input {
  margin: 20px 0;
}

.auth-button {
  width: 100%;
  margin-bottom: 20px;
}

.auth-hint {
  font-size: 14px;
  color: #666;
  text-align: center;
}

.auth-hint i {
  margin-right: 5px;
}

.main-tabs {
  border-radius: 15px;
  overflow: hidden;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  border: none;
}

.card {
  background: white;
  border-radius: 10px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.05);
  padding: 20px;
  transition: all 0.3s ease;
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

.content-textarea {
  margin-bottom: 20px;
}

.submit-button {
  width: 100%;
}

.instructions ul {
  text-align: left;
  padding-left: 20px;
}

.instructions li {
  margin-bottom: 10px;
  line-height: 1.6;
  color: #666;
}

.instructions li:before {
  content: "•";
  color: #409EFF;
  margin-right: 10px;
}

.clipboard-items-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  gap: 20px;
  padding: 20px 0;
}

.clipboard-item-card {
  border-radius: 10px;
  transition: all 0.3s ease;
}

.clipboard-item-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.1);
}

.content-text {
  text-align: left;
  margin-bottom: 15px;
}

.content-preview {
  white-space: pre-wrap;
  word-break: break-word;
  margin-bottom: 15px;
  line-height: 1.6;
  color: #333;
}

.content-file {
  text-align: center;
}

.image-container {
  margin-bottom: 15px;
  display: flex;
  justify-content: center;
}

.content-image {
  max-width: 100%;
  max-height: 200px;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.file-info {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  margin-bottom: 15px;
  font-size: 1.2rem;
  color: #666;
}

.file-name {
  font-weight: 500;
}

.file-actions {
  display: flex;
  justify-content: center;
  gap: 10px;
  flex-wrap: wrap;
}

.clipboard-meta {
  display: flex;
  justify-content: space-between;
  margin-top: 15px;
  padding-top: 15px;
  border-top: 1px solid #eee;
  color: #999;
  font-size: 0.9rem;
}

.clipboard-meta i {
  margin-right: 5px;
}

.empty-alert {
  border-radius: 10px;
  margin-top: 20px;
}

.file-preview {
  padding: 20px;
  background-color: #f5f7fa;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s ease;
  text-align: center;
}

.file-preview:hover {
  background-color: #eef1f6;
  transform: translateY(-2px);
}

.file-preview i {
  font-size: 2rem;
  color: #409EFF;
  display: block;
  margin-bottom: 10px;
}

.file-preview .preview-hint {
  font-size: 0.8rem;
  color: #999;
  margin-top: 5px;
}

.analytics-container {
  padding: 20px 0;
}

.analytics-card {
  margin-bottom: 20px;
}

.chart-container {
  position: relative;
  height: 300px;
  width: 100%;
}

.text-file-container,
.pdf-file-container {
  margin-bottom: 15px;
}

.text-preview-content {
  white-space: pre-wrap;
  word-break: break-word;
  max-height: 500px;
  overflow-y: auto;
  background-color: #f5f7fa;
  padding: 15px;
  border-radius: 8px;
  font-family: monospace;
}

.pdf-preview-container {
  text-align: center;
}

.file-preview-dialog .el-dialog__body {
  padding: 10px 20px;
}

.dialog-footer {
  text-align: right;
}

.github-info {
  margin-top: 30px;
  padding: 20px;
  background-color: #f8f9fa;
  border-radius: 10px;
  border: 1px solid #e9ecef;
}

.github-info h3 {
  margin-top: 0;
  color: #333;
  display: flex;
  align-items: center;
  gap: 10px;
}

.github-stats {
  display: flex;
  flex-wrap: wrap;
  gap: 15px;
  margin: 15px 0;
}

.stat-item {
  display: flex;
  align-items: center;
  gap: 5px;
  background-color: #fff;
  padding: 5px 10px;
  border-radius: 15px;
  font-size: 0.9rem;
  box-shadow: 0 1px 3px rgba(0,0,0,0.1);
}

.stat-item i {
  color: #409EFF;
}

.paste-hint {
  margin-bottom: 20px;
}

.paste-instruction {
  border-radius: 8px;
}

@media (max-width: 768px) {
  .clipboard-items-grid {
    grid-template-columns: 1fr;
  }
  
  .el-col {
    width: 100%;
  }
  
  .auth-card {
    margin: 0 20px;
  }
  
  #app {
    padding: 10px;
  }
  
  .file-preview-dialog {
    width: 95% !important;
  }
  
  .pdf-preview-container iframe {
    height: 400px;
  }
  
  .github-stats {
    flex-direction: column;
    gap: 10px;
  }
  
  .stat-item {
    justify-content: center;
  }
  
  .el-table {
    font-size: 12px;
  }
  
  .el-table th, 
  .el-table td {
    padding: 5px 0;
  }
  
  .el-table .cell {
    padding: 0 5px;
  }
  
  .el-dialog {
    width: 95%;
  }
  
  .el-message-box {
    width: 90%;
  }
  
  .header-content {
    flex-direction: row;
    text-align: left;
    gap: 10px;
    padding: 15px 0;
  }
  
  .header-content h1 {
    font-size: 1.3rem;
    margin: 0;
    text-align: left;
    width: auto;
    flex: 1;
  }
  
  .auth-info {
    display: flex;
    justify-content: flex-end;
    margin: 0;
    position: relative;
    z-index: 1001;
    right: auto;
    top: auto;
    transform: none;
  }
  
  .logout-button {
    padding: 8px 16px;
    font-size: 13px;
    cursor: pointer;
    position: relative;
    z-index: 1002;
    box-shadow: 0 2px 12px rgba(0,0,0,0.2) !important;
  }
  
  .card-header h3 {
    font-size: 1.2rem;
  }
  
  .el-tabs__item {
    font-size: 14px;
    padding: 0 10px;
  }
  
  .el-upload-dragger {
    padding: 20px 10px;
  }
  
  .el-alert {
    padding: 10px;
  }
  
  .el-alert__content {
    padding: 0 5px;
  }
  
  .el-alert__title {
    font-size: 13px;
  }
  
  .el-alert__description {
    font-size: 12px;
  }
  
  .clipboard-meta {
    flex-direction: column;
    gap: 5px;
    font-size: 12px;
  }
  
  .el-card__body {
    padding: 15px;
  }
}

@media (min-width: 769px) {
  .logout-button {
    padding: 10px 20px !important;
    font-size: 13px !important;
    min-width: 100px !important;
    box-shadow: 0 2px 12px rgba(0,0,0,0.2) !important;
    cursor: pointer !important;
    pointer-events: auto !important;
    z-index: 9999 !important;
    position: relative !important;
  }
  
  .auth-info {
    position: absolute;
    right: 0;
    top: 50%;
    transform: translateY(-50%);
    z-index: 9998;
  }
  
  .app-header {
    position: relative !important;
    z-index: 9997 !important;
  }
}

@media (max-width: 480px) {
  .github-stats {
    font-size: 14px;
  }
  
  .stat-item {
    padding: 3px 8px;
  }
  
  .el-button {
    font-size: 12px;
    padding: 8px 12px;
  }
  
  .el-input__inner {
    font-size: 14px;
  }
  
  .el-textarea__inner {
    font-size: 14px;
  }
  
  .content-preview {
    font-size: 14px;
  }
  
  .clipboard-meta {
    flex-direction: column;
    gap: 5px;
    font-size: 12px;
  }
  
  .el-card__body {
    padding: 15px;
  }
  
  .header-content {
    flex-direction: column;
    gap: 10px;
  }
  
  .header-content h1 {
    font-size: 1.2rem;
    text-align: center;
    width: 100%;
  }
  
  .auth-info {
    justify-content: center;
  }
}