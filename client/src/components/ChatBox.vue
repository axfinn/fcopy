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

        <div v-for="message in messages" :key="message.id" class="message-item">
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
    }
  },
  data() {
    return {
      messages: [], // 聊天消息列表
      messageInput: '', // 输入框内容
      isSending: false, // 是否正在发送
      isAtBottom: true, // 是否在底部
      newMessageCount: 0, // 新消息数量
      currentUserAgent: navigator.userAgent // 当前用户标识
    };
  },
  computed: {
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
  methods: {
    // 初始化聊天框
    async initializeChat() {
      console.log('[CHAT] 初始化聊天框');
      await this.loadRecentMessages();
      this.scrollToBottom();
    },

    // 加载最近5条消息
    async loadRecentMessages() {
      try {
        console.log('[CHAT] 加载最近5条消息');
        const response = await fetch('/api/clipboard?page=1&size=5', {
          headers: {
            'X-API-Key': this.apiKey
          }
        });

        if (!response.ok) {
          throw new Error('加载消息失败');
        }

        const result = await response.json();
        if (result.success && result.data) {
          // 加载历史消息并按时间排序（最新的在后面）
          this.messages = result.data
            .map(item => ({
              ...item,
              type: item.content ? 'text' : 'file'
            }))
            .sort((a, b) => {
              // 按created_at时间排序
              const timeA = new Date(a.created_at).getTime();
              const timeB = new Date(b.created_at).getTime();
              return timeA - timeB;
            });
          console.log('[CHAT] 加载了', this.messages.length, '条历史消息，已按时间排序');
        }
      } catch (error) {
        console.error('[CHAT] 加载历史消息失败:', error);
        this.$message.error('加载历史消息失败');
      }
    },

    // 设置WebSocket监听器
    setupWebSocketListener() {
      console.log('[CHAT] 设置WebSocket监听器');
      console.log('[CHAT] window对象:', typeof window);
      console.log('[CHAT] addEventListener方法:', typeof window.addEventListener);
      
      // 测试事件监听器是否正常工作
      const testHandler = (event) => {
        console.log('[CHAT] 收到测试事件:', event.detail);
      };
      window.addEventListener('test-event', testHandler);
      
      // 立即触发一个测试事件来验证机制是否工作
      setTimeout(() => {
        console.log('[CHAT] 发送测试事件');
        window.dispatchEvent(new CustomEvent('test-event', { detail: 'test data' }));
      }, 1000);
      
      // 绑定事件监听器 - 确保this上下文正确
      this._boundHandleWebSocketMessage = this.handleWebSocketMessage.bind(this);
      this._boundHandleWebSocketDelete = this.handleWebSocketDelete.bind(this);
      
      window.addEventListener('clipboard-websocket-update', this._boundHandleWebSocketMessage);
      window.addEventListener('clipboard-websocket-delete', this._boundHandleWebSocketDelete);
      
      console.log('[CHAT] 事件监听器已绑定，函数类型:', typeof this._boundHandleWebSocketMessage);
    },

    // 移除WebSocket监听器
    removeWebSocketListener() {
      console.log('[CHAT] 移除WebSocket监听器');
      if (this._boundHandleWebSocketMessage) {
        window.removeEventListener('clipboard-websocket-update', this._boundHandleWebSocketMessage);
      }
      if (this._boundHandleWebSocketDelete) {
        window.removeEventListener('clipboard-websocket-delete', this._boundHandleWebSocketDelete);
      }
    },

    // 处理WebSocket消息
    handleWebSocketMessage(event) {
      const messageData = event.detail;
      console.log('[CHAT] *** 成功收到WebSocket消息! ***', messageData);
      console.log('[CHAT] 事件类型:', event.type);
      console.log('[CHAT] 事件详情:', event.detail);
      console.log('[CHAT] 当前消息数量:', this.messages.length);

      // 检查是否已经存在这条消息
      const existingMessage = this.messages.find(msg => msg.id === messageData.id);
      if (existingMessage) {
        console.log('[CHAT] 消息已存在，跳过:', messageData.id);
        return;
      }

      // 添加新消息
      const newMessage = {
        ...messageData,
        type: messageData.content ? 'text' : 'file'
      };

      // 按时间顺序插入消息
      const messageTime = new Date(newMessage.created_at).getTime();
      let insertIndex = this.messages.length;
      
      // 找到正确的插入位置
      for (let i = this.messages.length - 1; i >= 0; i--) {
        const existingTime = new Date(this.messages[i].created_at).getTime();
        if (existingTime <= messageTime) {
          insertIndex = i + 1;
          break;
        }
        insertIndex = i;
      }
      
      this.messages.splice(insertIndex, 0, newMessage);
      console.log('[CHAT] 添加新消息到位置', insertIndex, ':', newMessage);

      // 处理滚动
      if (this.isAtBottom) {
        this.$nextTick(() => {
          this.scrollToBottom();
        });
      } else {
        this.newMessageCount++;
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
        console.log('[CHAT] 消息发送成功，等待WebSocket广播:', result);
        
        // 消息发送成功，等待WebSocket广播
        // 如果5秒内没收到广播，提示用户刷新页面
        setTimeout(() => {
          const hasMessage = this.messages.find(msg => msg.id === result.id);
          if (!hasMessage) {
            console.warn('[CHAT] 5秒内未收到WebSocket广播，可能需要刷新页面');
            this.$message.warning('消息发送成功，但未能及时显示，请刷新页面查看');
          }
        }, 5000);

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
      console.log('[CHAT] 文件上传成功:', result);
      // 文件上传成功，等待WebSocket广播
      // 不在这里立即添加消息，等待WebSocket事件
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

    // 处理滚动
    handleScroll() {
      const container = this.$refs.messageContainer;
      if (!container) return;

      const { scrollTop, scrollHeight, clientHeight } = container;
      const isAtBottom = scrollTop + clientHeight >= scrollHeight - 10;
      
      this.isAtBottom = isAtBottom;
      
      if (isAtBottom) {
        this.newMessageCount = 0;
      }
    },

    // 滚动到底部
    scrollToBottom() {
      this.$nextTick(() => {
        const container = this.$refs.messageContainer;
        if (container) {
          container.scrollTop = container.scrollHeight;
          this.isAtBottom = true;
          this.newMessageCount = 0;
        }
      });
    },

    // 清空消息
    clearMessages() {
      this.$confirm('确定要清空所有聊天记录吗？', '确认清空', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(() => {
        this.messages = [];
        this.newMessageCount = 0;
        this.$message.success('聊天记录已清空');
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
}

.chat-card :deep(.el-card__body) {
  flex: 1;
  display: flex;
  flex-direction: column;
  padding: 0;
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