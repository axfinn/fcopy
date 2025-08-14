<template>
  <div class="chat-container">
    <el-card class="chat-card">
      <template #header>
        <div class="chat-header">
          <span>实时聊天</span>
          <div class="header-actions">
            <el-button size="small" type="primary" plain @click="scrollToBottom">到底部</el-button>
            <el-button size="small" @click="clearMessages">清空</el-button>
          </div>
        </div>
      </template>

      <!-- 消息列表 -->
      <div ref="messageContainer" class="message-container" @scroll="handleScroll">
        <div v-if="messages.length === 0" class="empty-state">
          <el-icon size="48px"><ChatDotRound /></el-icon>
          <p>还没有消息，开始聊天吧！</p>
        </div>

        <div v-for="message in messages" :key="`chat-${message.id}`" class="message-item">
          <div class="message-wrapper" :class="{ 'own-message': isOwnMessage(message) }">
            <div class="message-avatar">
              <div class="avatar-circle" :style="getAvatarStyle(message)">
                {{ getAvatarText(message) }}
              </div>
            </div>
            <div class="message-content">
              <div class="message-header">
                <span class="message-time">{{ formatTime(message.created_at) }}</span>
                <span class="message-type">{{ message.type === 'text' ? '文本' : '文件' }}</span>
              </div>
              <div class="message-bubble">
                <!-- 文本消息 -->
                <div v-if="message.type === 'text'" class="text-message">
                  <div class="text-content">{{ message.content }}</div>
                  <el-button size="small" text @click="copyText(message.content)">
                    <el-icon><DocumentCopy /></el-icon>
                    复制
                  </el-button>
                </div>
                
                <!-- 文件消息 -->
                <div v-else class="file-message">
                  <div class="file-info">
                    <el-icon><Document /></el-icon>
                    <div class="file-details">
                      <div class="file-name">{{ message.file_name }}</div>
                      <div class="file-size">{{ formatFileSize(message.file_size) }}</div>
                    </div>
                  </div>
                  <div class="file-actions">
                    <el-button size="small" text @click="downloadFile(message)">
                      <el-icon><Download /></el-icon>
                      下载
                    </el-button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 新消息提示 -->
        <div v-if="hasNewMessages" class="new-message-indicator" @click="scrollToBottom">
          有新消息 ({{ newMessageCount }})
        </div>
      </div>

      <!-- 输入区域 -->
      <div class="input-area">
        <div v-if="isSending" class="sending-indicator">
          <el-icon class="is-loading"><Loading /></el-icon>
          <span>发送中...</span>
        </div>
        
        <div class="input-wrapper">
          <el-input
            v-model="messageInput"
            type="textarea"
            :rows="2"
            placeholder="输入消息内容，Ctrl+Enter 发送"
            @keydown="handleKeyPress"
            :disabled="isSending"
          />
          <div class="input-buttons">
            <el-upload
              :action="fileUploadUrl"
              :headers="uploadHeaders"
              :show-file-list="false"
              :on-success="handleFileUploadSuccess"
              :on-error="handleFileUploadError"
              :disabled="isSending"
            >
              <el-button size="small" :disabled="isSending">
                <el-icon><Paperclip /></el-icon>
                文件
              </el-button>
            </el-upload>
            <el-button 
              type="primary" 
              size="small" 
              @click="sendTextMessage"
              :disabled="!messageInput.trim() || isSending"
              :loading="isSending"
            >
              发送
            </el-button>
          </div>
        </div>
      </div>
    </el-card>
  </div>
</template>

<script>
import { 
  ChatDotRound, 
  DocumentCopy, 
  Download, 
  Document, 
  Loading,
  Paperclip
} from '@element-plus/icons-vue';

export default {
  name: 'ChatBox',
  components: {
    ChatDotRound,
    DocumentCopy,
    Download,
    Document,
    Loading,
    Paperclip
  },
  props: {
    apiKey: {
      type: String,
      required: true
    },
    clipboardItems: {
      type: Array,
      default: () => []
    }
  },
  data() {
    return {
      messageInput: '', // 输入框内容
      isSending: false, // 是否正在发送
      isAtBottom: true, // 是否在底部
      newMessageCount: 0, // 新消息数量
      currentUserAgent: navigator.userAgent // 当前用户标识
    };
  },
  computed: {
    // 从clipboardItems中提取聊天消息，完全依赖props
    messages() {
      if (!Array.isArray(this.clipboardItems)) {
        return [];
      }
      
      // 过滤并格式化聊天消息（所有类型的消息都显示）
      const chatMessages = this.clipboardItems
        .map(item => ({
          ...item,
          type: item.content ? 'text' : 'file'
        }))
        .sort((a, b) => {
          // 按created_at时间排序，最新的在底部
          const timeA = new Date(a.created_at).getTime();
          const timeB = new Date(b.created_at).getTime();
          return timeA - timeB;
        })
        .slice(-5); // 只显示最近5条消息，保持简洁
        
      console.log('[CHAT] 计算属性messages更新，消息数量:', chatMessages.length, '（显示最近5条）');
      return chatMessages;
    },
    
    hasNewMessages() {
      return !this.isAtBottom && this.newMessageCount > 0;
    },
    
    fileUploadUrl() {
      return '/api/clipboard/file';
    },
    
    uploadHeaders() {
      return {
        'X-API-Key': this.apiKey
      };
    }
  },
  mounted() {
    this.initializeChat();
    this.setupWebSocketListener();
  },
  beforeUnmount() {
    this.removeWebSocketListener();
  },
  watch: {
    // 最简化的监听，避免Vue响应式错误
    clipboardItems: {
      handler() {
        // 简单的响应，避免复杂的DOM操作
        this.$nextTick(() => {
          if (this.isAtBottom && this.$refs.messageContainer) {
            this.$refs.messageContainer.scrollTop = this.$refs.messageContainer.scrollHeight;
          }
        });
      },
      immediate: true
    }
  },
  methods: {
    // 初始化聊天框
    async initializeChat() {
      console.log('[CHAT] 初始化聊天框 - 完全基于计算属性，无需手动加载消息');
      // messages由计算属性自动处理，这里只需要设置UI状态
      this.scrollToBottom();
    },

    // 设置WebSocket监听器 - 现在主要通过props获取数据，WebSocket只做删除监听
    setupWebSocketListener() {
      console.log('[CHAT] 设置WebSocket监听器（仅删除事件）');
      
      this._boundHandleWebSocketDelete = this.handleWebSocketDelete.bind(this);
      window.addEventListener('clipboard-websocket-delete', this._boundHandleWebSocketDelete);
    },

    // 移除WebSocket监听器
    removeWebSocketListener() {
      console.log('[CHAT] 移除WebSocket监听器');
      if (this._boundHandleWebSocketDelete) {
        window.removeEventListener('clipboard-websocket-delete', this._boundHandleWebSocketDelete);
      }
    },

    // 处理WebSocket删除消息
    handleWebSocketDelete(event) {
      const { id } = event.detail;
      console.log('[CHAT] 删除消息:', id);
      
      const index = this.messages.findIndex(msg => msg.id === id);
      if (index !== -1) {
        this.messages.splice(index, 1);
      }
    },

    // 发送文本消息
    async sendTextMessage() {
      if (!this.messageInput.trim() || this.isSending) {
        return;
      }

      const content = this.messageInput.trim();
      this.isSending = true;
      
      // 先保存输入内容（用于失败恢复）
      const originalInput = this.messageInput;
      this.messageInput = '';

      try {
        console.log('[CHAT] 发送文本消息:', content);
        
        // 立即显示发送状态提示
        this.$message.info('正在发送消息...', { duration: 1000 });
        
        const response = await fetch('/api/clipboard/text', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-API-Key': this.apiKey
          },
          body: JSON.stringify({ content })
        });

        if (!response.ok) {
          throw new Error('发送失败');
        }

        const result = await response.json();
        console.log('[CHAT] 消息发送成功，等待WebSocket广播更新界面:', result);
        
        // 发送成功提示
        this.$message.success('消息发送成功！', { duration: 1000 });
        
        // 消息发送成功，Store会通过WebSocket自动更新，无需手动处理
        // 移除定时器避免组件销毁时的引用错误

      } catch (error) {
        console.error('[CHAT] 发送消息失败:', error);
        this.$message.error('发送失败: ' + error.message);
        
        // 发送失败，恢复输入内容
        this.messageInput = originalInput;
      } finally {
        this.isSending = false;
      }
    },

    // 处理文件上传成功
    handleFileUploadSuccess(result) {
      console.log('[CHAT] 文件上传成功，WebSocket会自动更新Store:', result);
      // Store会通过WebSocket自动更新，无需手动处理
      this.$message.success('文件上传成功');
    },

    // 处理文件上传失败
    handleFileUploadError(error) {
      console.error('[CHAT] 文件上传失败:', error);
      this.$message.error('文件上传失败');
    },

    // 处理键盘事件
    handleKeyPress(event) {
      if (event.ctrlKey && event.key === 'Enter') {
        event.preventDefault();
        this.sendTextMessage();
      }
    },

    // 处理滚动 - 添加安全检查
    handleScroll() {
      try {
        const container = this.$refs.messageContainer;
        if (!container || !container.getBoundingClientRect) return;

        const { scrollTop, scrollHeight, clientHeight } = container;
        if (typeof scrollTop !== 'number' || typeof scrollHeight !== 'number' || typeof clientHeight !== 'number') {
          return;
        }
        
        const isAtBottom = scrollTop + clientHeight >= scrollHeight - 10;
        this.isAtBottom = isAtBottom;
        
        if (isAtBottom) {
          this.newMessageCount = 0;
        }
      } catch (error) {
        console.warn('[CHAT] 处理滚动事件时出错:', error);
        // 忽略滚动错误，不影响核心功能
      }
    },

    // 滚动到底部 - 添加安全检查避免Vue错误
    scrollToBottom() {
      try {
        this.$nextTick(() => {
          const container = this.$refs.messageContainer;
          if (container && typeof container.scrollTop !== 'undefined' && typeof container.scrollHeight !== 'undefined') {
            container.scrollTop = container.scrollHeight;
            this.isAtBottom = true;
            this.newMessageCount = 0;
          }
        });
      } catch (error) {
        console.warn('[CHAT] 滚动到底部时出错:', error);
        // 忽略滚动错误，不影响核心功能
      }
    },

    // 清空消息
    clearMessages() {
      this.$confirm('确定要清空所有聊天记录吗？', '确认清空', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(() => {
        // 发出事件给父组件处理，因为需要清空Store数据
        this.$emit('clear-messages');
        this.newMessageCount = 0;
        this.$message.success('正在清空聊天记录...');
      }).catch(() => {});
    },

    // 判断是否是自己的消息
    isOwnMessage(message) {
      return message.user_agent === this.currentUserAgent;
    },

    // 获取头像样式
    getAvatarStyle(message) {
      const ip = message.ip_address || 'unknown';
      let hash = 0;
      for (let i = 0; i < ip.length; i++) {
        hash = ((hash << 5) - hash) + ip.charCodeAt(i);
        hash = hash & hash;
      }
      const hue = Math.abs(hash) % 360;
      return {
        backgroundColor: `hsl(${hue}, 65%, 55%)`,
        color: '#fff'
      };
    },

    // 获取头像文本
    getAvatarText(message) {
      if (!message.ip_address) return '?';
      const parts = message.ip_address.split('.');
      return parts[parts.length - 1] || '?';
    },

    // 格式化时间
    formatTime(dateString) {
      if (!dateString) return '';
      
      // 如果是服务器格式化的时间字符串
      if (typeof dateString === 'string' && dateString.includes('/')) {
        const parts = dateString.split(' ');
        return parts.length > 1 ? parts[1] : dateString;
      }
      
      // 否则格式化Date对象
      const date = new Date(dateString);
      return date.toLocaleTimeString('zh-CN', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      });
    },

    // 格式化文件大小
    formatFileSize(bytes) {
      if (!bytes) return '0 B';
      const sizes = ['B', 'KB', 'MB', 'GB'];
      const i = Math.floor(Math.log(bytes) / Math.log(1024));
      return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
    },

    // 复制文本
    async copyText(text) {
      try {
        await navigator.clipboard.writeText(text);
        this.$message.success('已复制到剪贴板');
      } catch (error) {
        console.error('复制失败:', error);
        this.$message.error('复制失败');
      }
    },

    // 下载文件
    downloadFile(message) {
      this.$emit('download-file', message);
    }
  }
};
</script>

<style scoped>
.chat-container {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.chat-card {
  height: calc(100vh - 200px);
  display: flex;
  flex-direction: column;
  min-height: 500px;
}

.chat-card :deep(.el-card__body) {
  flex: 1;
  display: flex;
  flex-direction: column;
  padding: 0;
  height: 100%;
}

.chat-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-weight: 600;
}

.header-actions {
  display: flex;
  gap: 8px;
}

.message-container {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
  position: relative;
  background: #fafafa;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: #999;
  gap: 16px;
}

.message-item {
  margin-bottom: 16px;
}

.message-wrapper {
  display: flex;
  gap: 12px;
}

.message-wrapper.own-message {
  flex-direction: row-reverse;
}

.message-avatar {
  flex-shrink: 0;
}

.avatar-circle {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  font-size: 14px;
}

.message-content {
  flex: 1;
  max-width: 70%;
}

.own-message .message-content {
  text-align: right;
}

.message-header {
  display: flex;
  gap: 8px;
  margin-bottom: 4px;
  font-size: 12px;
  color: #666;
}

.own-message .message-header {
  justify-content: flex-end;
}

.message-type {
  background: #e3f2fd;
  color: #1976d2;
  padding: 2px 6px;
  border-radius: 10px;
  font-size: 11px;
}

.message-bubble {
  background: #fff;
  border-radius: 12px;
  padding: 12px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}

.own-message .message-bubble {
  background: #1976d2;
  color: #fff;
}

.text-message {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.text-content {
  white-space: pre-wrap;
  word-break: break-word;
  line-height: 1.4;
}

.file-message {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.file-info {
  display: flex;
  align-items: center;
  gap: 8px;
}

.file-details {
  flex: 1;
}

.file-name {
  font-weight: 500;
  margin-bottom: 2px;
}

.file-size {
  font-size: 12px;
  opacity: 0.7;
}

.file-actions {
  display: flex;
  gap: 8px;
}

.new-message-indicator {
  position: absolute;
  bottom: 20px;
  left: 50%;
  transform: translateX(-50%);
  background: #1976d2;
  color: #fff;
  padding: 8px 16px;
  border-radius: 20px;
  cursor: pointer;
  font-size: 12px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.2);
  animation: slideUp 0.3s ease-out;
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateX(-50%) translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateX(-50%) translateY(0);
  }
}

.input-area {
  border-top: 1px solid #eee;
  padding: 16px;
  background: #fff;
  flex-shrink: 0;
  min-height: 80px;
}

.sending-indicator {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
  color: #1976d2;
  font-size: 14px;
}

.input-wrapper {
  display: flex;
  gap: 8px;
  align-items: flex-end;
}

.input-wrapper :deep(.el-textarea) {
  flex: 1;
  min-height: 60px;
}

.input-wrapper :deep(.el-textarea__inner) {
  min-height: 60px !important;
  resize: none;
}

.input-buttons {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

/* 滚动条样式 */
.message-container::-webkit-scrollbar {
  width: 6px;
}

.message-container::-webkit-scrollbar-track {
  background: transparent;
}

.message-container::-webkit-scrollbar-thumb {
  background: rgba(0,0,0,0.1);
  border-radius: 3px;
}

.message-container::-webkit-scrollbar-thumb:hover {
  background: rgba(0,0,0,0.2);
}
</style>