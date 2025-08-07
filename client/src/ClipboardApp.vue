<template>
  <div id="app">
    <!-- 背景容器 -->
    <div class="background-container">
      <div 
        class="background-slide"
        :style="{ 
          backgroundImage: `url(${store.state.currentBackground})`,
          opacity: 1
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
    
    <!-- 主要内容区域 -->
    <div class="app-container" v-if="store.state.isAuthenticated">
      <el-container class="main-container">
        <AppHeader 
          :is-authenticated="store.state.isAuthenticated" 
          :is-admin="store.state.isAdmin"
          :users="store.state.users"
          @logout="handleLogout"
        />
        
        <el-main class="content-main">
          <MainView 
            :api-key="store.state.apiKey"
            :clipboard-items="store.state.clipboardItems"
            :access-logs="store.state.accessLogs"
            :is-admin="store.state.isAdmin"
            :users="store.state.users"
            :active-users="store.state.activeUsers"
            @add-text-content="handleAddTextContent"
            @file-success="handleFileSuccess"
            @file-error="handleFileError"
            @copy-to-clipboard="copyToClipboard"
            @download-file="handleDownloadFile"
            @delete-item="handleDeleteItem"
            @add-user="handleAddUser"
            @delete-user="handleDeleteUser"
            @preview-text-file="previewTextFile"
            @preview-pdf-file="previewPdfFile"
            @update-clipboard-items="updateClipboardItems"
            @tab-change="handleTabChange"
            @current-change="handleCurrentChange"
            @size-change="handleSizeChange"
            @search="handleSearch"
          />
        </el-main>
        
        
        <!-- GitHub信息 -->
        <el-footer class="github-footer" v-if="store.state.githubInfo">
          <GitHubInfo 
            :github-info="store.state.githubInfo" 
            :is-authenticated="store.state.isAuthenticated"
          />
        </el-footer>
      </el-container>
    </div>
    
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
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="pdfPreviewDialogVisible = false">关闭</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script>
import store from './store';
export default {
  name: 'ClipboardApp',
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
    // 尝试从本地存储获取API密钥
    const storedApiKey = localStorage.getItem('clipboard_api_key');
    if (storedApiKey) {
      this.handleAuthenticate(storedApiKey);
    }
    
    // 获取GitHub信息
    this.fetchGithubInfo();
    
    // 初始化背景
    store.initializeBackground();
    
    // 添加粘贴事件监听器
    document.addEventListener('paste', this.handlePaste);
  },
  methods: {
    
    // 鉴权
    async handleAuthenticate(inputApiKey) {
      const result = await store.authenticate(inputApiKey);
      if (result.success) {
        localStorage.setItem('clipboard_api_key', inputApiKey);
        this.$message.success('鉴权成功');
        
        // 获取初始数据
        await Promise.allSettled([
          store.fetchAccessLogs(),
          store.fetchActiveUsers()
        ]);
      } else {
        this.$message.error(result.message || '认证失败');
      }
    },
    
    // 登出
    handleLogout() {
      store.logout();
      this.$message.success('已登出');
    },
    
    // 添加文本内容
    async handleAddTextContent(content) {
      try {
        await store.addTextContent(content);
        this.$message.success('文本已添加并同步');
        // 刷新剪贴板历史
        await store.fetchClipboardHistory();
      } catch (error) {
        this.$message.error('添加文本失败');
      }
    },
    
    // 文件上传成功回调
    handleFileSuccess() {
      this.$message.success('文件已上传并同步');
      // 重新获取列表以显示新项目
      store.fetchClipboardHistory();
    },
    
    // 文件上传失败回调
    handleFileError(error) {
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
    
    // 处理文件下载
    async handleDownloadFile(fileId, fileName, mimeType) {
      try {
        await store.downloadFile(fileId, fileName, mimeType);
      } catch (error) {
        this.$message.error('下载文件失败: ' + (error.message || '未知错误'));
      }
    },

    // 删除项目
    async handleDeleteItem(id) {
      try {
        await store.deleteClipboardItem(id);
        this.$message.success('删除成功');
      } catch (error) {
        this.$message.error('删除失败');
      }
    },
    
    // 预览文本文件
    async previewTextFile(item) {
      try {
        const response = await fetch(`/api/clipboard/file/${item.id}`, {
          headers: {
            'X-API-Key': store.state.apiKey
          }
        });
        if (response.ok) {
          this.textPreviewContent = await response.text();
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
      this.previewFile = item;
      this.pdfPreviewDialogVisible = true;
    },

    // 处理粘贴事件
    handlePaste(event) {
      // 只在已认证状态下处理粘贴事件
      if (!store.state.isAuthenticated) return;
      
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
          'X-API-Key': store.state.apiKey
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
        store.fetchClipboardHistory();
      })
      .catch(error => {
        console.error('上传截图失败:', error);
        this.$message.error('上传截图失败: ' + (error.message || '未知错误'));
      });
    },

    // 获取GitHub信息
    async fetchGithubInfo() {
      try {
        const result = await store.fetchGithubInfo();
        if (!result.success) {
          console.error('获取GitHub信息失败:', result.message);
        }
      } catch (error) {
        console.error('获取GitHub信息失败:', error);
      }
    },
    
    // 更新剪贴板项目
    updateClipboardItems(items) {
      store.state.clipboardItems = items;
    },
    
    // 处理当前页码改变
    async handleCurrentChange(page) {
      try {
        // 获取新页数据
        await store.fetchClipboardHistory({ page, size: store.state.pageSize });
      } catch (error) {
        console.error('获取剪贴板历史失败:', error);
        this.$message.error('获取剪贴板历史失败');
      }
    },
    
    // 处理每页数量改变
    async handleSizeChange(size) {
      try {
        // 重新获取数据，使用新的分页大小
        await store.fetchClipboardHistory({ page: 1, size });
        // 更新store中的pageSize
        store.state.pageSize = size;
      } catch (error) {
        console.error('获取剪贴板历史失败:', error);
        this.$message.error('获取剪贴板历史失败');
      }
    },
    
    // 处理搜索事件
    async handleSearch(query) {
      try {
        // 执行搜索
        await store.fetchClipboardHistory({ 
          page: 1, 
          size: store.state.pageSize, 
          search: query 
        });
      } catch (error) {
        console.error('搜索剪贴板历史失败:', error);
        this.$message.error('搜索剪贴板历史失败');
      }
    },
    
    // 更新访问日志
    async updateAccessLogs(params) {
      try {
        await store.fetchAccessLogs(params);
      } catch (error) {
        console.error('获取访问日志失败:', error);
        this.$message.error('获取访问日志失败: ' + (error.message || '未知错误'));
      }
    },

    // 添加用户
    async handleAddUser(userData) {
      try {
        const result = await store.addUser(userData);
        if (result.error) {
          this.$message.error(result.error);
        } else if (result.success) {
          this.$message.success('用户添加成功');
        } else {
          this.$message.error('添加用户失败');
        }
      } catch (error) {
        this.$message.error('添加用户失败');
      }
    },
    
    // 删除用户
    async handleDeleteUser(userId) {
      try {
        await this.$confirm('确认删除该用户吗？此操作不可恢复。', '警告', {
          confirmButtonText: '确认',
          cancelButtonText: '取消',
          type: 'warning'
        });
        
        const result = await store.deleteUser(userId);
        if (result.error) {
          this.$message.error(result.error);
        } else if (result.success) {
          this.$message.success('用户删除成功');
        } else {
          this.$message.error('删除用户失败');
        }
      } catch (error) {
        // 用户取消删除
        console.log('用户取消删除操作');
      }
    },
    
    handleTabChange(tab) {
      switch (tab.name) {
        case 'admin':
          if (store.state.isAdmin) {
            store.fetchUsers();
            store.fetchAccessLogs();
          }
          break;
        case 'user-info':
        case '活跃客户端':
          store.fetchActiveUsers();
          break;
      }
    },
    
    // 关闭文本预览对话框
    handleTextPreviewClose(done) {
      this.textPreviewContent = '';
      this.previewFile = null;
      done();
    },
    
    // 关闭PDF预览对话框
    handlePdfPreviewClose(done) {
      this.previewFile = null;
      done();
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
  overflow-x: hidden;
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

.background-slide {
  width: 100%;
  height: 100%;
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
}

.login-view {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 2000;
}

.app-container {
  position: relative;
  z-index: 1;
  min-height: 100vh;
}

.main-container {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  padding: 0;
  margin: 0;
}

.content-main {
  flex: 1;
  padding: 20px;
  margin: 0;
  position: relative;
  z-index: 10;
}

.app-footer {
  padding: 0 !important;
  position: relative;
  z-index: 20;
}

.github-info-container {
  position: static;
  bottom: auto;
  left: auto;
  transform: none;
  z-index: 1000;
  width: auto;
  max-width: 100%;
}

.el-main {
  flex: 1;
  padding: 20px;
  margin: 0;
  position: relative;
  z-index: 10;
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

.file-preview-dialog .el-dialog__body {
  padding: 10px 20px;
}

.dialog-footer {
  text-align: right;
}

/* 保持原有媒体查询样式不变 */
@media (max-width: 768px) {
  #app {
    padding: 10px;
  }
  
  .el-card__body {
    padding: 15px;
  }
  
  .file-preview-dialog {
    width: 95% !important;
  }
  
  .pdf-file-container iframe {
    height: 400px;
  }
}
</style>