import { ref, onMounted, onUnmounted } from 'vue';
import socket from '../services/socket.js';
import store from '../store/index.js';

export function useSocket() {
  const isConnected = ref(false);
  const socketInstance = ref(null);
  const processedMessageIds = new Set(); // 防止快速重复处理

  // 事件处理函数（定义在外部，避免重复创建）
  const handleClipboardUpdate = (data) => {
    try {
      // 防重复处理
      if (processedMessageIds.has(data.id)) {
        console.log('[SOCKET_CLIENT] 跳过重复消息:', data.id);
        return;
      }
      processedMessageIds.add(data.id);
      
      console.log('[SOCKET_CLIENT] 收到clipboard-update消息:', data);
      
      // 只添加到store，让聊天框通过自定义事件接收
      store.mutations.ADD_CLIPBOARD_ITEM(data);
      
      // 通过自定义事件通知聊天框
      window.dispatchEvent(new CustomEvent('clipboard-websocket-update', {
        detail: data
      }));
      
      // 减少提示频率，避免过多干扰
      if (window.$message && data.type === 'text') {
        window.$message.success('收到新消息');
      }
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