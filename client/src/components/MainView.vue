<template>
  <el-tabs type="border-card" class="main-tabs" v-model="activeTab">
    <!-- 添加内容标签页 -->
    <el-tab-pane label="添加内容" name="add">
      <el-row :gutter="20">
        <el-col :xs="24" :sm="24" :md="12" :lg="12" :xl="12">
          <div class="clipboard-input card">
            <div class="card-header">
              <h3><i class="el-icon-edit"></i> 添加文本</h3>
            </div>
            <el-input
              type="textarea"
              :rows="6"
              placeholder="请输入要同步的文本内容"
              v-model="newTextContent"
              class="content-textarea"
            ></el-input>
            <el-button 
              type="primary" 
              @click="addTextContent" 
              class="submit-button"
              round
            >
              <i class="el-icon-plus"></i> 添加文本并同步
            </el-button>
          </div>
          
          <div class="file-input card" style="margin-top: 30px">
            <div class="card-header">
              <h3><i class="el-icon-upload"></i> 添加文件/图片</h3>
            </div>
            <div class="paste-hint">
              <el-alert
                title="提示：截图后可直接按 Ctrl+V (Cmd+V) 粘贴上传"
                type="success"
                show-icon
                :closable="false"
                class="paste-instruction"
              />
            </div>
            <el-upload
              class="upload-demo"
              drag
              action="/api/clipboard/file"
              :headers="{ 'X-API-Key': apiKey }"
              :on-success="handleFileSuccess"
              :on-error="handleFileError"
              :multiple="false"
              name="file"
            >
              <i class="el-icon-upload"></i>
              <div class="el-upload__text">
                将文件拖到此处，或<em>点击上传</em>
              </div>
              <div class="el-upload__tip">
                支持各种文件类型，单个文件不超过10MB
              </div>
            </el-upload>
          </div>
        </el-col>
        
        <el-col :xs="24" :sm="24" :md="12" :lg="12" :xl="12">
          <div class="instructions card">
            <div class="card-header">
              <h3><i class="el-icon-guide"></i> 使用说明</h3>
            </div>
            <ul>
              <li>文本同步：在左侧输入框中输入文本内容，点击"添加文本并同步"</li>
              <li>文件同步：将文件拖拽到上传区域或点击上传按钮</li>
              <li>截图粘贴：在任何地方截图后，直接按 Ctrl+V (Cmd+V) 粘贴上传</li>
              <li>实时同步：所有设备间内容将实时同步</li>
              <li>历史记录：可在"内容历史"标签页查看所有同步内容</li>
              <li>安全保护：所有内容均通过API密钥保护</li>
            </ul>
          </div>
        </el-col>
      </el-row>
    </el-tab-pane>
    
    <!-- 内容历史标签页 -->
    <el-tab-pane label="内容历史" name="history">
      <div class="clipboard-history">
        <el-alert
          v-if="clipboardItems.length === 0"
          title="暂无内容"
          type="info"
          description="添加文本或文件后会显示在这里"
          show-icon
          class="empty-alert"
        />
        
        <div class="clipboard-items-grid" v-else>
          <el-card 
            v-for="item in clipboardItems" 
            :key="item.id" 
            class="clipboard-item-card"
            shadow="hover"
          >
            <div class="clipboard-content">
              <!-- 文本内容 -->
              <div v-if="item.content" class="content-text">
                <div class="content-preview">{{ truncateText(item.content, 100) }}</div>
                <el-button 
                  type="success" 
                  size="small" 
                  @click="copyToClipboard(item.content)"
                  round
                >
                  <i class="el-icon-document-copy"></i> 复制文本
                </el-button>
              </div>
              
              <!-- 文件内容 -->
              <div v-else-if="item.file_path" class="content-file">
                <div v-if="isImage(item.mime_type)" class="image-container">
                  <img 
                    :src="'/api/clipboard/file/' + item.id" 
                    :alt="item.file_name" 
                    class="content-image"
                    @error="handleImageError"
                  />
                </div>
                <div v-else-if="isTextFile(item.mime_type)" class="text-file-container">
                  <div class="file-preview" @click="previewTextFile(item)">
                    <i class="el-icon-document"></i>
                    <span>{{ item.file_name }}</span>
                    <div class="preview-hint">点击预览文件内容</div>
                  </div>
                </div>
                <div v-else-if="isPdfFile(item.mime_type)" class="pdf-file-container">
                  <div class="file-preview" @click="previewPdfFile(item)">
                    <i class="el-icon-document"></i>
                    <span>{{ item.file_name }}</span>
                    <div class="preview-hint">点击预览PDF文件</div>
                  </div>
                </div>
                <div v-else class="file-info">
                  <i class="el-icon-document"></i>
                  <span class="file-name">{{ item.file_name }}</span>
                </div>
                
                <div class="file-actions">
                  <el-button 
                    type="success" 
                    size="small" 
                    @click="downloadFileById(item.id, item.file_name)"
                    round
                  >
                    <i class="el-icon-download"></i> 下载
                  </el-button>
                  <el-button 
                    type="danger" 
                    size="small" 
                    @click="deleteItem(item.id)"
                    round
                  >
                    <i class="el-icon-delete"></i> 删除
                  </el-button>
                </div>
              </div>
            </div>
            <div class="clipboard-meta">
              <div class="clipboard-time">
                <i class="el-icon-time"></i> {{ formatTime(item.created_at) }}
              </div>
              <div class="clipboard-size" v-if="item.file_size">
                <i class="el-icon-data-line"></i> {{ formatFileSize(item.file_size) }}
              </div>
            </div>
          </el-card>
        </div>
      </div>
    </el-tab-pane>
    
    <!-- 系统监控标签页 (仅管理员可见) -->
    <el-tab-pane label="系统监控" name="admin" v-if="isAdmin">
      <el-row :gutter="20">
        <el-col :span="24">
          <div class="card">
            <div class="card-header">
              <h3><i class="el-icon-monitor"></i> 系统监控面板</h3>
            </div>
            
            <el-tabs type="card">
              <el-tab-pane label="用户管理">
                <el-table :data="users" style="width: 100%" v-loading="loadingUsers">
                  <el-table-column prop="id" label="ID" width="80"></el-table-column>
                  <el-table-column prop="username" label="用户名"></el-table-column>
                  <el-table-column label="角色">
                    <template #default="scope">
                      <el-tag :type="scope.row.is_admin ? 'danger' : 'success'">
                        {{ scope.row.is_admin ? '管理员' : '普通用户' }}
                      </el-tag>
                    </template>
                  </el-table-column>
                  <el-table-column label="操作">
                    <template #default="scope">
                      <el-button 
                        size="mini" 
                        type="danger" 
                        @click="deleteUser(scope.row.id)"
                        :disabled="scope.row.username === 'admin' || scope.row.username === 'default'"
                      >
                        删除
                      </el-button>
                    </template>
                  </el-table-column>
                </el-table>
                
                <div style="margin-top: 20px;">
                  <el-form :inline="true" :model="newUser" class="demo-form-inline">
                    <el-form-item label="用户名">
                      <el-input v-model="newUser.username" placeholder="请输入用户名"></el-input>
                    </el-form-item>
                    <el-form-item label="API密钥">
                      <el-input v-model="newUser.apiKey" placeholder="请输入API密钥"></el-input>
                    </el-form-item>
                    <el-form-item>
                      <el-button type="primary" @click="addUser">添加用户</el-button>
                    </el-form-item>
                  </el-form>
                </div>
              </el-tab-pane>
              
              <el-tab-pane label="活跃客户端">
                <el-table :data="activeUsers" style="width: 100%" v-loading="loadingActiveUsers">
                  <el-table-column prop="id" label="用户ID" width="80"></el-table-column>
                  <el-table-column prop="username" label="用户名"></el-table-column>
                  <el-table-column label="角色">
                    <template #default="scope">
                      <el-tag :type="scope.row.is_admin ? 'danger' : 'success'">
                        {{ scope.row.is_admin ? '管理员' : '普通用户' }}
                      </el-tag>
                    </template>
                  </el-table-column>
                  <el-table-column prop="connectionTime" label="连接时间">
                    <template #default="scope">
                      {{ formatTime(scope.row.connectionTime) }}
                    </template>
                  </el-table-column>
                </el-table>
              </el-tab-pane>
              
              <el-tab-pane label="访问统计">
                <div style="height: 400px">
                  <canvas ref="accessChart"></canvas>
                </div>
              </el-tab-pane>
            </el-tabs>
          </div>
        </el-col>
      </el-row>
    </el-tab-pane>
    
    <!-- 用户信息标签页 (普通用户可见) -->
    <el-tab-pane label="我的连接" name="user-info" v-if="!isAdmin">
      <el-row :gutter="20">
        <el-col :span="24">
          <div class="card">
            <div class="card-header">
              <h3><i class="el-icon-user"></i> 活跃客户端</h3>
            </div>
            
            <el-table :data="activeUsers" style="width: 100%" v-loading="loadingActiveUsers">
              <el-table-column prop="id" label="用户ID" width="80"></el-table-column>
              <el-table-column prop="username" label="用户名"></el-table-column>
              <el-table-column label="角色">
                <template #default="scope">
                  <el-tag :type="scope.row.is_admin ? 'danger' : 'success'">
                    {{ scope.row.is_admin ? '管理员' : '普通用户' }}
                  </el-tag>
                </template>
              </el-table-column>
              <el-table-column prop="connectionTime" label="连接时间">
                <template #default="scope">
                  {{ formatTime(scope.row.connectionTime) }}
                </template>
              </el-table-column>
            </el-table>
          </div>
        </el-col>
      </el-row>
    </el-tab-pane>
  </el-tabs>
</template>

<script>
import { formatDistanceToNow, parseISO } from 'date-fns';
import { zhCN } from 'date-fns/locale';
export default {
  name: 'MainView',
  props: {
    apiKey: {
      type: String,
      required: true
    },
    clipboardItems: {
      type: Array,
      required: true
    },
    accessLogs: {
      type: Array,
      required: true
    },
    rateLimits: {
      type: Array,
      required: true
    },
    isAdmin: {
      type: Boolean,
      required: true
    },
    users: {
      type: Array,
      required: true
    },
    activeUsers: {
      type: Array,
      required: true
    }
  },
  data() {
    return {
      activeTab: 'add',
      newTextContent: '',
      previewFile: {},
      previewFileContent: '',
      pdfPreviewDialogVisible: false,
      textPreviewDialogVisible: false,
      textPreviewContent: '',
      newUser: {
        username: '',
        apiKey: ''
      },
      loadingUsers: false,
      loadingActiveUsers: false
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
    'preview-pdf-file'
  ],
  mounted() {
    // 组件挂载完成后执行的初始化逻辑
    console.log('MainView component mounted');
    // 可以在这里执行初始化操作，如加载数据、初始化图表等
  },
  
  methods: {
    addTextContent() {
      this.$emit('add-text-content', this.newTextContent);
    },
    
    handleFileSuccess(response, file, fileList) {
      this.$emit('file-success', response, file, fileList);
    },
    
    handleFileError(error, file, fileList) {
      this.$emit('file-error', error, file, fileList);
    },
    
    copyToClipboard(text) {
      this.$emit('copy-to-clipboard', text);
    },
    
    downloadFileById(fileId, fileName) {
      this.$emit('download-file', fileId, fileName);
    },
    
    deleteItem(id) {
      this.$emit('delete-item', id);
    },
    
    addUser() {
      if (!this.newUser.username || !this.newUser.apiKey) {
        this.$message.error('用户名和API密钥不能为空');
        return;
      }
      
      this.$emit('add-user', this.newUser);
      this.newUser = {
        username: '',
        apiKey: ''
      };
    },
    
    deleteUser(userId) {
      this.$emit('delete-user', userId);
    },
    
    formatTime(date) {
      if (!date) return '';
      return formatDistanceToNow(parseISO(date), { 
        addSuffix: true, 
        locale: zhCN 
      });
    },
    
    previewTextFile(item) {
      this.$emit('preview-text-file', item);
    },
    
    previewPdfFile(item) {
      this.$emit('preview-pdf-file', item);
    },
    
    isImage(mimeType) {
      return mimeType && mimeType.startsWith('image/');
    },
    
    isTextFile(mimeType) {
      if (!mimeType) return false;
      return mimeType.startsWith('text/') || 
             mimeType === 'application/json' || 
             mimeType === 'application/xml';
    },
    
    isPdfFile(mimeType) {
      if (!mimeType) return false;
      return mimeType === 'application/pdf';
    },
    
    formatFileSize(size) {
      if (size < 1024) {
        return size + ' B';
      } else if (size < 1024 * 1024) {
        return (size / 1024).toFixed(2) + ' KB';
      } else {
        return (size / (1024 * 1024)).toFixed(2) + ' MB';
      }
    },
    
    truncateText(text, maxLength) {
      if (text.length <= maxLength) {
        return text;
      }
      return text.substr(0, maxLength) + '...';
    },
    
    handleImageError(event) {
      console.error('图片加载失败:', event);
      // 设置一个默认的占位图
      event.target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgZmlsbD0iI2VlZSIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMTQiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGRvbWluYW50LWJhc2VsaW5lPSJtaWRkbGUiIGZpbGw9IiM5OTkiPkltYWdlIG5vdCBhdmFpbGFibGU8L3RleHQ+PC9zdmc+';
      event.target.style.opacity = '0.7';
      this.$message.warning('图片加载失败，可能文件已丢失');
    }
  }
}
</script>

<style scoped>
.main-view {
  width: 100%;
  padding: 0;
  margin: 0;
}

.main-tabs {
  border-radius: 15px;
  overflow: hidden;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  border: none;
  flex: 1;
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
  background: white;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.05);
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

@media (max-width: 768px) {
  .clipboard-items-grid {
    grid-template-columns: 1fr;
  }
  
  .el-col {
    width: 100%;
  }
  
  .pdf-preview-container iframe {
    height: 400px;
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
</style>