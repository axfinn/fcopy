<template>
  <div class="chat-wrapper">
    <el-card class="chat-card">
      <template #header>
        <div class="card-header">
          <span>实时聊天</span>
          <div class="header-actions">
            <el-button size="small" type="primary" plain @click="scrollToBottom">到底部</el-button>
            <el-button size="small" @click="clearChat" :disabled="messages.length === 0">清空</el-button>
          </div>
        </div>
      </template>
      
      <!-- 消息列表 -->
      <div ref="messageList" class="message-list" @scroll.passive="handleScroll">
        <div v-if="messages.length === 0" class="empty">
          <el-icon><ChatDotRound /></el-icon>
          <p>开始聊天吧！支持文本和文件</p>
        </div>
        
        <div v-for="message in messages" :key="message.id" class="message-item" :class="message.side">
          <div class="avatar" :style="getAvatarStyle(message)">
            {{ getAvatarText(message) }}
          </div>
          <div class="message-content">
            <div class="message-meta">
              <span class="time">{{ formatTime(message.created_at) }}</span>
              <span class="type-tag" :class="message.type">{{ message.type === 'text' ? '文本' : '文件' }}</span>
            </div>
            <div class="message-bubble" :class="[message.type, message.side, message.status]">
              <!-- 文本消息 -->
              <template v-if="message.type === 'text'">
                <div class="text-content" @click="copyText(message.content)">
                  {{ message.content }}
                </div>
                <div class="message-actions">
                  <el-button size="small" text @click="copyText(message.content)">
                    <el-icon><DocumentCopy /></el-icon>
                    复制
                  </el-button>
                </div>
              </template>
              
              <!-- 文件消息 -->
              <template v-else-if="message.type === 'file'">
                <div class="file-content">
                  <div v-if="isImage(message)" class="image-preview" @click="previewImage(message)">
                    <img v-if="message.thumbnailUrl" :src="message.thumbnailUrl" :alt="message.file_name" />
                    <div v-else class="image-placeholder">
                      <el-icon><Picture /></el-icon>
                      <span>{{ message.file_name }}</span>
                    </div>
                  </div>
                  <div v-else class="file-info">
                    <el-icon><Document /></el-icon>
                    <div class="file-details">
                      <div class="file-name">{{ message.file_name }}</div>
                      <div class="file-size">{{ formatSize(message.file_size) }}</div>
                    </div>
                  </div>
                  <div class="message-actions">
                    <el-button size="small" text @click="downloadFile(message)">
                      <el-icon><Download /></el-icon>
                      下载
                    </el-button>
                    <el-button v-if="isTextFile(message)" size="small" text @click="previewText(message)">
                      <el-icon><View /></el-icon>
                      预览
                    </el-button>
                  </div>
                </div>
              </template>
              
              <!-- 状态指示器 -->
              <div v-if="message.status === 'sending'" class="status-indicator">
                <el-icon class="is-loading"><Loading /></el-icon>
              </div>
              <div v-else-if="message.status === 'failed'" class="status-indicator error">
                <el-icon><WarningFilled /></el-icon>
                <span>发送失败</span>
                <el-button size="small" text type="primary" @click="resendMessage(message)">重试</el-button>
              </div>
            </div>
          </div>
        </div>
        
        <!-- 新消息提示 -->
        <div v-if="showNewMessageTip" class="new-message-tip" @click="scrollToBottom">
          有新消息 ({{ newMessageCount }})
        </div>
      </div>
      
      <!-- 输入区域 -->
      <div class="input-area">
        <div class="input-wrapper">
          <el-input
            v-model="inputText"
            type="textarea"
            :autosize="{ minRows: 1, maxRows: 4 }"
            placeholder="输入消息，Ctrl+Enter 发送，支持粘贴文件"
            @keydown="handleKeydown"
            @paste="handlePaste"
            class="message-input"
          />
          <div class="input-actions">
            <el-upload
              :action="uploadUrl"
              :headers="uploadHeaders"
              :show-file-list="false"
              :on-success="handleFileSuccess"
              :on-error="handleFileError"
              :before-upload="handleBeforeUpload"
              multiple
            >
              <el-button size="small" :icon="Paperclip">文件</el-button>
            </el-upload>
            <el-button
              type="primary"
              size="small"
              :disabled="!inputText.trim() || sending"
              :loading="sending"
              @click="sendMessage"
            >
              发送
            </el-button>
          </div>
        </div>
      </div>
    </el-card>
    
    <!-- 图片预览对话框 -->
    <el-dialog v-model="imagePreviewVisible" title="图片预览" width="70%">
      <div class="image-preview-container">
        <img v-if="previewImageUrl" :src="previewImageUrl" :alt="previewFile?.file_name" />
      </div>
      <template #footer>
        <el-button @click="downloadCurrentImage">下载</el-button>
        <el-button type="primary" @click="imagePreviewVisible = false">关闭</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script>
import { 
  ChatDotRound, 
  DocumentCopy, 
  Download, 
  View, 
  Picture, 
  Document, 
  Loading, 
  WarningFilled,
  Paperclip
} from '@element-plus/icons-vue';

export default {
  name: 'ChatBox',
  components: {
    ChatDotRound,
    DocumentCopy,
    Download,
    View,
    Picture,
    Document,
    Loading,
    WarningFilled,
    Paperclip
  },
  props: {
    apiKey: {
      type: String,
      required: true
    }
  },
  emits: ['message-sent', 'file-uploaded'],
  data() {
    return {
      messages: [],
      inputText: '',
      sending: false,
      isAtBottom: true,
      newMessageCount: 0,
      messageIdCounter: 0,
      currentUser: null,
      clientId: null, // 唯一的客户端标识符
      sentMessageIds: new Set(), // 跟踪此客户端发送的消息ID
      
      // 文件预览
      imagePreviewVisible: false,
      previewImageUrl: '',
      previewFile: null
    };
  },
  computed: {
    showNewMessageTip() {
      return !this.isAtBottom && this.newMessageCount > 0;
    },
    uploadUrl() {
      return '/api/clipboard/file';
    },
    uploadHeaders() {
      return {
        'X-API-Key': this.apiKey
      };
    }
  },
  mounted() {
    this.initCurrentUser();
    this.initWebSocketListeners();
    this.loadInitialMessages();
    this.scrollToBottom();
  },
  beforeUnmount() {
    this.removeWebSocketListeners();
  },
  methods: {
    // 初始化WebSocket监听器
    initWebSocketListeners() {
      // 监听自定义事件
      window.addEventListener('clipboard-websocket-update', this.handleWebSocketMessage);
      window.addEventListener('clipboard-websocket-delete', this.handleWebSocketDelete);
    },
    
    // 移除WebSocket监听器
    removeWebSocketListeners() {
      window.removeEventListener('clipboard-websocket-update', this.handleWebSocketMessage);
      window.removeEventListener('clipboard-websocket-delete', this.handleWebSocketDelete);
    },
    
    // 处理WebSocket消息
    handleWebSocketMessage(event) {
      const data = event.detail;
      
      // 检查是否是本客户端已发送的消息
      if (this.sentMessageIds.has(data.id)) {
        return;
      }
      
      // 检查是否已经存在（避免重复）
      if (this.messages.find(m => m.id === data.id)) {
        return;
      }
      
      // 添加来自其他客户端的消息
      this.addMessage(data);
      
      // 显示提示（如果不在底部）
      if (!this.isAtBottom) {
        this.$message.info('收到新消息');
      }
    },
    
    // 处理WebSocket删除消息
    handleWebSocketDelete(event) {
      const data = event.detail;
      
      if (data && data.id) {
        // 从聊天记录中移除对应消息
        const index = this.messages.findIndex(msg => msg.id === data.id);
        if (index > -1) {
          this.messages.splice(index, 1);
        }
      }
    },
    
    // 初始化当前用户信息
    initCurrentUser() {
      // 生成唯一的客户端ID
      this.clientId = this.generateClientId();
      
      this.currentUser = {
        ip: this.getClientIP(),
        userAgent: navigator.userAgent,
        clientId: this.clientId
      };
      
      // 存储到localStorage，这样可以在多个标签页中识别同一客户端
      localStorage.setItem('chatbox_client_id', this.clientId);
    },
    
    // 生成客户端ID
    generateClientId() {
      // 先检查localStorage中是否已有
      const existingId = localStorage.getItem('chatbox_client_id');
      if (existingId) {
        return existingId;
      }
      
      // 生成新的ID
      return 'client_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    },
    
    // 加载初始消息
    async loadInitialMessages() {
      try {
        const response = await fetch('/api/clipboard/history?page=1&size=20', {
          headers: {
            'X-API-Key': this.apiKey
          }
        });
        
        if (response.ok) {
          const result = await response.json();
          const items = result.data?.items || result.data || [];
          
          // 将历史消息添加到聊天框（最近的消息在后面）
          for (const item of items.reverse()) {
            this.addHistoryMessage(item); // 使用专门的历史消息添加方法
          }
        }
      } catch (error) {
        console.error('加载历史消息失败:', error);
      }
    },
    
    // 添加历史消息（不会触发WebSocket过滤）
    addHistoryMessage(message) {
      // 避免重复添加
      if (this.messages.find(m => m.id === message.id)) {
        return;
      }
      
      const formattedMessage = {
        ...message,
        side: this.isOwnMessage(message) ? 'right' : 'left',
        status: 'sent',
        created_at: new Date(message.created_at)
      };
      
      this.messages.push(formattedMessage);
      
      // 注意：历史消息不添加到sentMessageIds，因为它们不是当前客户端发送的
    },
    
    // 获取客户端IP（模拟）
    getClientIP() {
      return '192.168.1.' + Math.floor(Math.random() * 255);
    },
    
    // 生成消息ID
    generateMessageId() {
      return `msg_${Date.now()}_${++this.messageIdCounter}`;
    },
    
    // 发送文本消息
    async sendMessage() {
      if (!this.inputText.trim() || this.sending) return;
      
      const messageText = this.inputText.trim();
      const messageId = this.generateMessageId();
      
      // 立即添加到界面，状态为发送中
      const message = {
        id: messageId,
        type: 'text',
        content: messageText,
        status: 'sending',
        created_at: new Date(),
        ip_address: this.currentUser.ip,
        user_agent: this.currentUser.userAgent,
        side: 'right' // 自己发送的消息
      };
      
      this.messages.push(message);
      this.inputText = '';
      this.scrollToBottom();
      this.sending = true;
      
      try {
        const response = await fetch('/api/clipboard/text', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-API-Key': this.apiKey
          },
          body: JSON.stringify({ content: messageText })
        });
        
        if (!response.ok) {
          throw new Error('发送失败');
        }
        
        const result = await response.json();
        
        // 更新消息状态为成功，更新服务器返回的ID
        const messageIndex = this.messages.findIndex(m => m.id === messageId);
        if (messageIndex > -1) {
          const serverId = result.id || messageId;
          this.messages[messageIndex] = {
            ...this.messages[messageIndex],
            id: serverId,
            status: 'sent',
            created_at: result.created_at || message.created_at
          };
          
          // 记录此消息ID，避免WebSocket重复显示
          this.sentMessageIds.add(serverId);
        }
        
        this.$emit('message-sent', result);
        this.$message.success('消息发送成功');
        
      } catch (error) {
        console.error('发送消息失败:', error);
        
        // 更新消息状态为失败
        const messageIndex = this.messages.findIndex(m => m.id === messageId);
        if (messageIndex > -1) {
          this.messages[messageIndex].status = 'failed';
        }
        
        this.$message.error('消息发送失败: ' + error.message);
      } finally {
        this.sending = false;
      }
    },
    
    // 重新发送消息
    async resendMessage(message) {
      message.status = 'sending';
      
      try {
        const response = await fetch('/api/clipboard/text', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-API-Key': this.apiKey
          },
          body: JSON.stringify({ content: message.content })
        });
        
        if (!response.ok) {
          throw new Error('重发失败');
        }
        
        const result = await response.json();
        message.status = 'sent';
        message.id = result.id || message.id;
        
        this.$emit('message-sent', result);
        this.$message.success('消息重发成功');
        
      } catch (error) {
        console.error('重发消息失败:', error);
        message.status = 'failed';
        this.$message.error('重发失败: ' + error.message);
      }
    },
    
    // 处理文件上传前
    handleBeforeUpload(file) {
      const messageId = this.generateMessageId();
      
      // 立即添加文件消息到界面
      const message = {
        id: messageId,
        type: 'file',
        file_name: file.name,
        file_size: file.size,
        mime_type: file.type,
        status: 'sending',
        created_at: new Date(),
        ip_address: this.currentUser.ip,
        user_agent: this.currentUser.userAgent,
        side: 'right',
        _uploadFile: file
      };
      
      this.messages.push(message);
      this.scrollToBottom();
      
      return true;
    },
    
    // 处理文件上传成功
    handleFileSuccess(result, file) {
      // 找到对应的消息并更新
      const messageIndex = this.messages.findIndex(m => 
        m._uploadFile && m._uploadFile.name === file.name && m.status === 'sending'
      );
      
      if (messageIndex > -1) {
        this.messages[messageIndex] = {
          ...this.messages[messageIndex],
          id: result.id,
          file_path: result.file_path,
          status: 'sent',
          created_at: result.created_at || this.messages[messageIndex].created_at
        };
        delete this.messages[messageIndex]._uploadFile;
        
        // 记录此消息ID，避免WebSocket重复显示
        this.sentMessageIds.add(result.id);
      }
      
      this.$emit('file-uploaded', result);
      this.$message.success('文件上传成功');
    },
    
    // 处理文件上传失败
    handleFileError(error, file) {
      const messageIndex = this.messages.findIndex(m => 
        m._uploadFile && m._uploadFile.name === file.name && m.status === 'sending'
      );
      
      if (messageIndex > -1) {
        this.messages[messageIndex].status = 'failed';
        delete this.messages[messageIndex]._uploadFile;
      }
      
      this.$message.error('文件上传失败');
    },
    
    // 从外部添加消息（WebSocket等）
    addMessage(message) {
      // 避免重复添加（如果已经有相同ID的消息）
      if (this.messages.find(m => m.id === message.id)) {
        return;
      }
      
      const formattedMessage = {
        ...message,
        side: this.isOwnMessage(message) ? 'right' : 'left',
        status: 'sent',
        created_at: new Date(message.created_at)
      };
      
      this.messages.push(formattedMessage);
      
      // 如果不在底部，增加新消息计数
      if (!this.isAtBottom) {
        this.newMessageCount++;
      } else {
        this.scrollToBottom();
      }
    },
    
    // 判断是否是自己的消息 (用于显示样式)
    isOwnMessage(message) {
      // 用于UI显示的判断，基于user agent匹配
      return message.user_agent === this.currentUser.userAgent;
    },
    
    // 清空聊天
    clearChat() {
      this.messages = [];
      this.newMessageCount = 0;
    },
    
    // 处理键盘事件
    handleKeydown(event) {
      if (event.ctrlKey && event.key === 'Enter') {
        event.preventDefault();
        this.sendMessage();
      }
    },
    
    // 处理粘贴
    async handlePaste(event) {
      const items = (event.clipboardData || window.clipboardData).items;
      
      for (let item of items) {
        if (item.kind === 'file') {
          const file = item.getAsFile();
          if (file) {
            this.handleBeforeUpload(file);
            
            // 手动上传文件
            const formData = new FormData();
            formData.append('file', file);
            
            try {
              const response = await fetch('/api/clipboard/file', {
                method: 'POST',
                headers: {
                  'X-API-Key': this.apiKey
                },
                body: formData
              });
              
              const result = await response.json();
              this.handleFileSuccess(result, file);
              
            } catch (error) {
              this.handleFileError(error, file);
            }
          }
        }
      }
    },
    
    // 滚动处理
    handleScroll() {
      const container = this.$refs.messageList;
      if (!container) return;
      
      const { scrollTop, scrollHeight, clientHeight } = container;
      this.isAtBottom = scrollTop + clientHeight >= scrollHeight - 10;
      
      if (this.isAtBottom) {
        this.newMessageCount = 0;
      }
    },
    
    // 滚动到底部
    scrollToBottom() {
      this.$nextTick(() => {
        const container = this.$refs.messageList;
        if (container) {
          container.scrollTop = container.scrollHeight;
          this.isAtBottom = true;
          this.newMessageCount = 0;
        }
      });
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
        background: `hsl(${hue}, 70%, 55%)`,
        boxShadow: `0 2px 8px hsl(${hue}, 70%, 35%, 0.3)`
      };
    },
    
    // 获取头像文字
    getAvatarText(message) {
      if (!message.ip_address) return '?';
      const parts = message.ip_address.split('.');
      return parts[parts.length - 1] || '?';
    },
    
    // 格式化时间
    formatTime(date) {
      const d = new Date(date);
      return d.toLocaleTimeString('zh-CN', { 
        hour: '2-digit', 
        minute: '2-digit',
        second: '2-digit'
      });
    },
    
    // 格式化文件大小
    formatSize(size) {
      if (!size) return '0B';
      const units = ['B', 'KB', 'MB', 'GB'];
      let i = 0;
      while (size >= 1024 && i < units.length - 1) {
        size /= 1024;
        i++;
      }
      return size.toFixed(i === 0 ? 0 : 1) + units[i];
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
    
    // 判断是否是图片
    isImage(message) {
      return message.mime_type && message.mime_type.startsWith('image/');
    },
    
    // 判断是否是文本文件
    isTextFile(message) {
      return message.mime_type && (
        message.mime_type.startsWith('text/') ||
        message.mime_type === 'application/json' ||
        message.file_name?.match(/\.(txt|md|json|xml|csv|log)$/i)
      );
    },
    
    // 预览图片
    async previewImage(message) {
      try {
        this.previewFile = message;
        this.imagePreviewVisible = true;
        
        const response = await fetch(`/api/clipboard/file/${message.id}`, {
          headers: {
            'X-API-Key': this.apiKey
          }
        });
        
        const blob = await response.blob();
        this.previewImageUrl = URL.createObjectURL(blob);
        
      } catch (error) {
        console.error('预览失败:', error);
        this.$message.error('图片预览失败');
      }
    },
    
    // 预览文本
    previewText(message) {
      this.$emit('preview-text', message);
    },
    
    // 下载文件
    downloadFile(message) {
      this.$emit('download-file', message);
    },
    
    // 下载当前预览的图片
    downloadCurrentImage() {
      if (this.previewFile) {
        this.downloadFile(this.previewFile);
      }
    }
  }
};
</script>

<style scoped>
.chat-wrapper {
  height: 100%;
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
  overflow: hidden;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-weight: 600;
}

.header-actions {
  display: flex;
  gap: 8px;
}

.message-list {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
  position: relative;
}

.empty {
  text-align: center;
  color: #999;
  padding: 60px 20px;
}

.empty .el-icon {
  font-size: 48px;
  margin-bottom: 16px;
  opacity: 0.5;
}

.message-item {
  display: flex;
  margin-bottom: 16px;
  align-items: flex-start;
  gap: 12px;
}

.message-item.right {
  flex-direction: row-reverse;
}

.avatar {
  width: 40px;
  height: 40px;
  border-radius: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-weight: 600;
  font-size: 14px;
  flex-shrink: 0;
}

.message-content {
  max-width: 70%;
  display: flex;
  flex-direction: column;
}

.message-item.right .message-content {
  align-items: flex-end;
}

.message-meta {
  display: flex;
  gap: 8px;
  align-items: center;
  margin-bottom: 4px;
  font-size: 12px;
  color: #666;
}

.message-item.right .message-meta {
  flex-direction: row-reverse;
}

.type-tag {
  padding: 2px 6px;
  border-radius: 10px;
  font-size: 11px;
  font-weight: 500;
}

.type-tag.text {
  background: #e3f2fd;
  color: #1976d2;
}

.type-tag.file {
  background: #e8f5e8;
  color: #4caf50;
}

.message-bubble {
  background: #f5f5f5;
  border-radius: 18px;
  padding: 12px 16px;
  position: relative;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
  transition: all 0.2s;
}

.message-bubble:hover {
  box-shadow: 0 4px 12px rgba(0,0,0,0.15);
}

.message-item.right .message-bubble {
  background: #1976d2;
  color: white;
}

.message-bubble.sending {
  opacity: 0.7;
}

.message-bubble.failed {
  background: #ffebee;
  border: 1px solid #f44336;
}

.text-content {
  white-space: pre-wrap;
  word-break: break-word;
  cursor: pointer;
  line-height: 1.4;
}

.file-content {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.image-preview {
  cursor: pointer;
  border-radius: 8px;
  overflow: hidden;
  max-width: 200px;
}

.image-preview img {
  width: 100%;
  height: auto;
  display: block;
}

.image-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 20px;
  background: #f9f9f9;
  border: 2px dashed #ddd;
  border-radius: 8px;
  gap: 8px;
}

.file-info {
  display: flex;
  align-items: center;
  gap: 12px;
}

.file-details {
  display: flex;
  flex-direction: column;
}

.file-name {
  font-weight: 500;
}

.file-size {
  font-size: 12px;
  opacity: 0.7;
}

.message-actions {
  display: flex;
  gap: 4px;
  margin-top: 8px;
}

.status-indicator {
  display: flex;
  align-items: center;
  gap: 4px;
  margin-top: 8px;
  font-size: 12px;
  opacity: 0.7;
}

.status-indicator.error {
  color: #f44336;
}

.new-message-tip {
  position: absolute;
  bottom: 20px;
  left: 50%;
  transform: translateX(-50%);
  background: #1976d2;
  color: white;
  padding: 8px 16px;
  border-radius: 20px;
  cursor: pointer;
  font-size: 12px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.2);
  animation: bounce 0.5s ease-out;
}

@keyframes bounce {
  0% { transform: translateX(-50%) translateY(20px); opacity: 0; }
  100% { transform: translateX(-50%) translateY(0); opacity: 1; }
}

.input-area {
  border-top: 1px solid #eee;
  padding: 16px;
  background: white;
}

.input-wrapper {
  display: flex;
  gap: 8px;
  align-items: flex-end;
}

.message-input {
  flex: 1;
}

.input-actions {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.image-preview-container {
  text-align: center;
  max-height: 70vh;
  overflow: auto;
}

.image-preview-container img {
  max-width: 100%;
  max-height: 70vh;
  border-radius: 8px;
}

/* 滚动条样式 */
.message-list::-webkit-scrollbar {
  width: 6px;
}

.message-list::-webkit-scrollbar-track {
  background: transparent;
}

.message-list::-webkit-scrollbar-thumb {
  background: rgba(0,0,0,0.1);
  border-radius: 3px;
}

.message-list::-webkit-scrollbar-thumb:hover {
  background: rgba(0,0,0,0.2);
}

/* 暗色模式适配 */
:global(.dark) .message-bubble {
  background: #2d2d2d;
  color: #e0e0e0;
}

:global(.dark) .message-item.right .message-bubble {
  background: #1565c0;
}

:global(.dark) .message-meta {
  color: #999;
}

:global(.dark) .input-area {
  background: #1e1e1e;
  border-top-color: #333;
}
</style>