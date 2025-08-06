<template>
  <div id="app">
    <el-container>
      <el-header>
        <div class="header-content">
          <h1><i class="el-icon-copy-document"></i> 跨平台剪贴板同步工具</h1>
          <div v-if="isAuthenticated" class="auth-info">
            <el-button type="danger" size="small" @click="logout" round>
              <i class="el-icon-switch-button"></i> 清除密钥
            </el-button>
          </div>
        </div>
      </el-header>
      
      <el-main>
        <!-- API 密钥输入 -->
        <div v-if="!isAuthenticated" class="auth-container">
          <el-card class="auth-card" shadow="always">
            <div class="auth-card-header">
              <i class="el-icon-lock"></i>
              <h2>安全验证</h2>
            </div>
            <el-input 
              v-model="apiKey" 
              placeholder="请输入访问密钥" 
              show-password
              size="large"
              class="auth-input"
            />
            <el-button 
              type="primary" 
              @click="authenticate" 
              :disabled="!apiKey"
              size="large"
              class="auth-button"
              round
            >
              <i class="el-icon-right"></i> 进入系统
            </el-button>
            
            <div class="auth-hint">
              <p><i class="el-icon-info"></i> 为保护您的数据安全，请输入正确的 API 密钥。</p>
            </div>
            
            <!-- GitHub项目信息 -->
            <div class="github-info" v-if="githubInfo">
              <h3><i class="el-icon-star-off"></i> GitHub 项目信息</h3>
              <div class="github-stats">
                <span class="stat-item">
                  <i class="el-icon-collection"></i> {{ githubInfo.stars }} Stars
                </span>
                <span class="stat-item">
                  <i class="el-icon-share"></i> {{ githubInfo.forks }} Forks
                </span>
                <span class="stat-item">
                  <i class="el-icon-info"></i> {{ githubInfo.version }}
                </span>
              </div>
              <el-button 
                type="default" 
                @click="openGithubRepo"
                round
                size="small"
              >
                <i class="el-icon-link"></i> 查看 GitHub 仓库
              </el-button>
            </div>
          </el-card>
        </div>
        
        <!-- 主功能界面 -->
        <div v-else>
          <el-tabs type="border-card" class="main-tabs" v-model="activeTab">
            <el-tab-pane label="添加内容" name="add">
              <el-row :gutter="30">
                <el-col :span="12">
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
                
                <el-col :span="12">
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
                  
                  <!-- GitHub项目信息 -->
                  <div class="github-info card" v-if="githubInfo">
                    <div class="card-header">
                      <h3><i class="el-icon-star-off"></i> GitHub 项目信息</h3>
                    </div>
                    <div class="github-stats">
                      <span class="stat-item">
                        <i class="el-icon-collection"></i> {{ githubInfo.stars }} Stars
                      </span>
                      <span class="stat-item">
                        <i class="el-icon-share"></i> {{ githubInfo.forks }} Forks
                      </span>
                      <span class="stat-item">
                        <i class="el-icon-info"></i> {{ githubInfo.version }}
                      </span>
                    </div>
                    <el-button 
                      type="default" 
                      @click="openGithubRepo"
                      round
                      size="small"
                    >
                      <i class="el-icon-link"></i> 查看 GitHub 仓库
                    </el-button>
                  </div>
                </el-col>
              </el-row>
            </el-tab-pane>
            
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
            
            <el-tab-pane label="访问统计" name="analytics">
              <div class="analytics-container">
                <el-row :gutter="20">
                  <el-col :span="24">
                    <div class="card analytics-card">
                      <div class="card-header">
                        <h3><i class="el-icon-data-analysis"></i> 7天内访问记录</h3>
                      </div>
                      <el-table :data="accessLogs" style="width: 100%" max-height="400" :default-sort="{prop: 'timestamp', order: 'descending'}">
                        <el-table-column prop="ip_address" label="IP地址" width="150" sortable></el-table-column>
                        <el-table-column prop="request_path" label="请求路径" width="150" sortable></el-table-column>
                        <el-table-column prop="request_method" label="方法" width="80" sortable></el-table-column>
                        <el-table-column prop="user_agent" label="客户端信息" show-overflow-tooltip></el-table-column>
                        <el-table-column prop="timestamp" label="时间" width="180" sortable>
                          <template #default="scope">
                            {{ formatTime(scope.row.timestamp) }}
                          </template>
                        </el-table-column>
                      </el-table>
                    </div>
                  </el-col>
                  <el-col :span="12">
                    <div class="card analytics-card">
                      <div class="card-header">
                        <h3><i class="el-icon-pie-chart"></i> 访问统计图表</h3>
                      </div>
                      <div class="chart-container">
                        <canvas ref="accessChart"></canvas>
                      </div>
                    </div>
                  </el-col>
                  <el-col :span="12">
                    <div class="card analytics-card">
                      <div class="card-header">
                        <h3><i class="el-icon-warning-outline"></i> 限流状态</h3>
                      </div>
                      <el-table :data="rateLimits" style="width: 100%" max-height="400" :default-sort="{prop: 'updated_at', order: 'descending'}">
                        <el-table-column prop="ip_address" label="IP地址" width="150" sortable></el-table-column>
                        <el-table-column prop="request_count" label="请求次数" width="100" sortable></el-table-column>
                        <el-table-column prop="last_request_time" label="最后请求时间" width="180" sortable>
                          <template #default="scope">
                            <span v-if="scope.row.last_request_time">
                              {{ formatTime(scope.row.last_request_time) }}
                            </span>
                            <span v-else>-</span>
                          </template>
                        </el-table-column>
                        <el-table-column prop="blocked_until" label="限制解除时间" width="180" sortable>
                          <template #default="scope">
                            <span v-if="scope.row.blocked_until">
                              {{ formatTime(scope.row.blocked_until) }}
                            </span>
                            <span v-else>-</span>
                          </template>
                        </el-table-column>
                        <el-table-column prop="updated_at" label="更新时间" width="180" sortable>
                          <template #default="scope">
                            {{ formatTime(scope.row.updated_at) }}
                          </template>
                        </el-table-column>
                      </el-table>
                    </div>
                  </el-col>
                </el-row>
              </div>
            </el-tab-pane>
            
            <el-tab-pane label="用户管理" name="userManagement" v-if="isAdmin">
              <div class="user-management-container">
                <el-row :gutter="20">
                  <el-col :span="12">
                    <div class="card user-form-card">
                      <div class="card-header">
                        <h3><i class="el-icon-plus"></i> 添加新用户</h3>
                      </div>
                      <el-form :model="newUser" label-width="80px" @submit.prevent="addUser">
                        <el-form-item label="用户名">
                          <el-input v-model="newUser.username" placeholder="请输入用户名"></el-input>
                        </el-form-item>
                        <el-form-item label="API密钥">
                          <el-input v-model="newUser.apiKey" placeholder="请输入API密钥"></el-input>
                        </el-form-item>
                        <el-form-item>
                          <el-button type="primary" @click="addUser" :loading="isAddingUser">添加用户</el-button>
                        </el-form-item>
                      </el-form>
                    </div>
                  </el-col>
                  <el-col :span="12">
                    <div class="card user-list-card">
                      <div class="card-header">
                        <h3><i class="el-icon-user"></i> 用户列表</h3>
                      </div>
                      <el-table :data="users" style="width: 100%" max-height="400">
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
                              删除
                            </el-button>
                          </template>
                        </el-table-column>
                      </el-table>
                    </div>
                  </el-col>
                </el-row>
              </div>
            </el-tab-pane>
          </el-tabs>
        </div>
      </el-main>
    </el-container>
    
    <!-- 文本文件预览对话框 -->
    <el-dialog
      v-model="textPreviewDialogVisible"
      :title="'文件预览: ' + previewFile.file_name"
      width="60%"
      class="file-preview-dialog"
    >
      <pre class="text-preview-content">{{ previewFileContent }}</pre>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="textPreviewDialogVisible = false">关闭</el-button>
          <el-button 
            type="primary" 
            @click="downloadFileById(previewFile.id, previewFile.file_name)"
          >
            下载文件
          </el-button>
        </span>
      </template>
    </el-dialog>
    
    <!-- PDF文件预览对话框 -->
    <el-dialog
      v-model="pdfPreviewDialogVisible"
      :title="'PDF预览: ' + previewFile.file_name"
      width="80%"
      class="file-preview-dialog"
    >
      <div class="pdf-preview-container">
        <iframe 
          :src="'/api/clipboard/file/' + previewFile.id" 
          width="100%" 
          height="600" 
          frameborder="0"
        ></iframe>
      </div>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="pdfPreviewDialogVisible = false">关闭</el-button>
          <el-button 
            type="primary" 
            @click="downloadFileById(previewFile.id, previewFile.file_name)"
          >
            下载文件
          </el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script>
import io from 'socket.io-client';
import { Document, UploadFilled } from '@element-plus/icons-vue';
import Chart from 'chart.js/auto';

export default {
  name: 'ClipboardApp',
  components: {
    Document,
    UploadFilled
  },
  data() {
    return {
      apiKey: '',
      isAuthenticated: false,
      socket: null,
      newTextContent: '',
      clipboardItems: [],
      accessLogs: [],
      rateLimits: [],
      activeTab: 'add',
      textPreviewDialogVisible: false,
      pdfPreviewDialogVisible: false,
      previewFile: {},
      previewFileContent: '',
      githubInfo: null,
      accessChart: null,
      isAdmin: false,
      users: [],
      newUser: {
        username: '',
        apiKey: ''
      },
      isAddingUser: false
    };
  },
  mounted() {
    // 检查本地存储中是否有 API 密钥
    const storedApiKey = localStorage.getItem('clipboard_api_key');
    if (storedApiKey) {
      this.apiKey = storedApiKey;
      this.authenticate();
    }
    
    // 获取GitHub项目信息
    this.fetchGithubInfo();
    
    // 添加粘贴事件监听器
    document.addEventListener('paste', this.handlePaste);
    
    // 初始化时检查是否有粘贴板内容（可选）
    if (navigator.clipboard && navigator.clipboard.read) {
      navigator.clipboard.read().then(data => {
        for (let i = 0; i < data.length; i++) {
          const item = data[i];
          if (item.types.includes('image/png') || item.types.includes('image/jpeg')) {
            this.$message.info('检测到剪贴板中有图片，可以粘贴上传');
            break;
          }
        }
      }).catch(err => {
        console.log('无法读取剪贴板内容:', err);
      });
    }
  },
  methods: {
    // 鉴权
    authenticate() {
      if (!this.apiKey) {
        this.$message.error('请输入 API 密钥');
        return;
      }
      
      // 尝试获取数据以验证密钥
      fetch('/api/clipboard', {
        headers: {
          'X-API-Key': this.apiKey
        }
      })
      .then(response => {
        if (response.ok) {
          this.isAuthenticated = true;
          localStorage.setItem('clipboard_api_key', this.apiKey);
          this.connectSocket();
          this.fetchClipboardHistory();
          this.fetchAccessLogs();  // 获取访问日志
          this.fetchRateLimits();  // 获取限流状态
          
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
      this.isAuthenticated = false;
      this.apiKey = '';
      this.activeTab = 'add';
      localStorage.removeItem('clipboard_api_key');
      if (this.socket) {
        this.socket.disconnect();
        this.socket = null;
      }
      this.clipboardItems = [];
      this.accessLogs = [];
      this.rateLimits = [];
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
        this.updateAccessChart();
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
    async addUser() {
      if (!this.newUser.username || !this.newUser.apiKey) {
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
          body: JSON.stringify(this.newUser)
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
            version: data.default_branch || 'main', // 使用默认分支作为版本信息
            url: data.html_url || 'https://github.com/axfinn/fcopy'
          };
        } else {
          // 如果GitHub API调用失败，使用默认信息
          this.githubInfo = {
            stars: 0,
            forks: 0,
            version: 'v1.0.0',
            url: 'https://github.com/axfinn/fcopy'
          };
        }
      } catch (error) {
        console.error('获取GitHub信息失败:', error);
        // 使用默认信息
        this.githubInfo = {
          stars: 0,
          forks: 0,
          version: 'v1.0.0',
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
    
    // 打开GitHub仓库页面
    openGithubRepo() {
      if (this.githubInfo && this.githubInfo.url) {
        window.open(this.githubInfo.url, '_blank');
      }
    },
    
    // 添加文本内容
    async addTextContent() {
      if (!this.newTextContent.trim()) {
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
          body: JSON.stringify({ content: this.newTextContent })
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

    // 下载文件（兼容旧方式）
    downloadFile(filePath, fileName) {
      // 对于图片预览对话框中的下载按钮，仍然使用这个方法
      const link = document.createElement('a');
      link.href = filePath;
      link.download = fileName;
      link.click();
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
    
    // 判断是否为图片
    isImage(mimeType) {
      return mimeType && mimeType.startsWith('image/');
    },
    
    // 判断是否为文本文件
    isTextFile(mimeType) {
      if (!mimeType) return false;
      return mimeType.startsWith('text/') || 
             mimeType === 'application/json' || 
             mimeType === 'application/xml';
    },
    
    // 判断是否为PDF文件
    isPdfFile(mimeType) {
      if (!mimeType) return false;
      return mimeType === 'application/pdf';
    },
    
    // 格式化文件大小
    formatFileSize(size) {
      if (size < 1024) {
        return size + ' B';
      } else if (size < 1024 * 1024) {
        return (size / 1024).toFixed(2) + ' KB';
      } else {
        return (size / (1024 * 1024)).toFixed(2) + ' MB';
      }
    },
    
    // 格式化时间
    formatTime(time) {
      return new Date(time).toLocaleString('zh-CN');
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
    },

    // 处理图片加载错误
    handleImageError(event) {
      console.error('图片加载失败:', event);
      // 设置一个默认的占位图
      event.target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgZmlsbD0iI2VlZSIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMTQiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGRvbWluYW50LWJhc2VsaW5lPSJtaWRkbGUiIGZpbGw9IiM5OTkiPkltYWdlIG5vdCBhdmFpbGFibGU8L3RleHQ+PC9zdmc+';
      event.target.style.opacity = '0.7';
      this.$message.warning('图片加载失败，可能文件已丢失');
    },

    // 截断文本显示
    truncateText(text, maxLength) {
      if (text.length <= maxLength) {
        return text;
      }
      return text.substr(0, maxLength) + '...';
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

    // 更新访问图表
    updateAccessChart() {
      if (!this.$refs.accessChart) return;

      // 销毁现有图表（如果存在）
      if (this.accessChart) {
        this.accessChart.destroy();
      }

      // 准备图表数据
      const pathCounts = {};
      const methodCounts = {};
      
      this.accessLogs.forEach(log => {
        // 统计请求路径
        pathCounts[log.request_path] = (pathCounts[log.request_path] || 0) + 1;
        
        // 统计请求方法
        methodCounts[log.request_method] = (methodCounts[log.request_method] || 0) + 1;
      });

      // 创建图表
      const ctx = this.$refs.accessChart.getContext('2d');
      this.accessChart = new Chart(ctx, {
        type: 'bar',
        data: {
          labels: Object.keys(pathCounts),
          datasets: [{
            label: '访问次数',
            data: Object.values(pathCounts),
            backgroundColor: 'rgba(64, 158, 255, 0.6)',
            borderColor: 'rgba(64, 158, 255, 1)',
            borderWidth: 1
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          scales: {
            y: {
              beginAtZero: true,
              ticks: {
                precision: 0
              }
            }
          }
        }
      });
    }
  },
  watch: {
    activeTab(newTab) {
      if (newTab === 'analytics') {
        // 延迟更新图表，确保DOM已渲染
        this.$nextTick(() => {
          this.updateAccessChart();
        });
      }
    }
  },
  beforeUnmount() {
    if (this.socket) {
      this.socket.disconnect();
    }
    // 移除粘贴事件监听器
    document.removeEventListener('paste', this.handlePaste);
  }
};
</script>

<style scoped>
#app {
  font-family: 'Helvetica Neue', Helvetica, 'PingFang SC', 'Hiragino Sans GB', Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
  margin-top: 0;
  height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 20px;
  box-sizing: border-box;
}

.el-container {
  height: 100%;
  background: transparent;
}

.el-header {
  background: rgba(255, 255, 255, 0.95);
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
  border-radius: 10px;
  margin-bottom: 20px;
  backdrop-filter: blur(10px);
}

.header-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  height: 100%;
}

.header-content h1 {
  margin: 0;
  color: #409EFF;
  font-size: 1.8rem;
}

.auth-container {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 80vh;
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
}
</style>