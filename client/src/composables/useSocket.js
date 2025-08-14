import { ref, onMounted, onUnmounted } from 'vue';
import socket from '../services/socket.js';
import store from '../store/index.js';

// 消息去重管理器
class MessageDeduplicator {
  constructor(ttl = 30000) { // 30秒TTL，减少去重时间窗口
    this.processedMessages = new Map();
    this.ttl = ttl;
  }
  
  isProcessed(messageId) {
    const now = Date.now();
    const record = this.processedMessages.get(messageId);
    
    // 简化日志输出
    console.log('[DEDUPLICATOR] 检查消息ID:', messageId, '已处理:', !!record);
    
    if (record && (now - record.timestamp) < this.ttl) {
      console.log('[DEDUPLICATOR] 消息已处理，跳过:', messageId);
      return true;
    }
    
    console.log('[DEDUPLICATOR] 标记消息为已处理:', messageId);
    this.processedMessages.set(messageId, { timestamp: now });
    this.cleanup(now);
    return false;
  }
  
  cleanup(now) {
    for (const [id, record] of this.processedMessages.entries()) {
      if ((now - record.timestamp) >= this.ttl) {
        this.processedMessages.delete(id);
      }
    }
  }
}

export function useSocket() {
  const isConnected = ref(false);
  const socketInstance = ref(null);
  const messageDeduplicator = new MessageDeduplicator();

  // 事件处理函数（定义在外部，避免重复创建）
  const handleClipboardUpdate = (data) => {
    try {
      console.log('[SOCKET_CLIENT] 收到clipboard-update消息:', data);
      
      // 防重复处理（带过期清理）
      const isAlreadyProcessed = messageDeduplicator.isProcessed(data.id);
      console.log('[SOCKET_CLIENT] 消息ID:', data.id, '重复:', isAlreadyProcessed);
      
      if (isAlreadyProcessed) {
        console.log('[SOCKET_CLIENT] 跳过重复消息:', data.id);
        return;
      }
      
      console.log('[SOCKET_CLIENT] 处理新消息:', data.id);
      
      // 统一通过store管理状态，移除多重处理路径
      store.mutations.ADD_CLIPBOARD_ITEM(data);
      
      // 派发自定义事件给所有监听器（ChatBox现在不需要这个，但保留向后兼容）
      const customEvent = new CustomEvent('clipboard-websocket-update', {
        detail: data
      });
      window.dispatchEvent(customEvent);
      console.log('[SOCKET_CLIENT] 事件已派发，消息ID:', data.id);
      
      // WebSocket消息处理完成，不显示提示避免干扰用户
    } catch (error) {
      console.error('[SOCKET_CLIENT] 处理WebSocket消息时出错:', error);
    }
  };

  const handleClipboardDelete = (data) => {
    try {
      if (!data || typeof data.id === 'undefined') return;
      store.mutations.REMOVE_CLIPBOARD_ITEM(data.id);
      
      // 通知聊天框
      window.dispatchEvent(new CustomEvent('clipboard-websocket-delete', {
        detail: data
      }));
    } catch (e) {
      console.error('处理删除事件出错:', e);
    }
  };

  const handleUserUpdate = (data) => {
    store.mutations.SET_ACTIVE_USERS(data);
  };

  const initWebSocket = (apiKey) => {
    if (!apiKey) return;
    
    // 如果已有连接，先关闭旧连接
    socket.disconnect();
    
    // 使用socket服务连接
    socketInstance.value = socket.connect(apiKey);
    
    // 添加连接状态监听（每次连接都重新设置）
    socketInstance.value.on('connect', () => {
      console.log('[SOCKET_CLIENT] WebSocket连接已建立');
      isConnected.value = true;
    });
    
    socketInstance.value.on('disconnect', (reason) => {
      console.log('[SOCKET_CLIENT] WebSocket连接已断开:', reason);
      isConnected.value = false;
    });
    
    socketInstance.value.on('connect_error', (error) => {
      console.error('[SOCKET_CLIENT] WebSocket连接错误:', error);
      isConnected.value = false;
    });
    
    // 业务事件监听器（每次都重新注册，因为socket已经清理了旧的）
    socketInstance.value.on('clipboard-update', handleClipboardUpdate);
    socketInstance.value.on('clipboard-delete', handleClipboardDelete);
    socketInstance.value.on('user-update', handleUserUpdate);
  };

  const disconnect = () => {
    socket.disconnect();
    isConnected.value = false;
    socketInstance.value = null;
  };

  onUnmounted(() => {
    disconnect();
  });

  return {
    isConnected,
    socketInstance,
    initWebSocket,
    disconnect
  };
}