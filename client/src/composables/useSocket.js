import { ref, onMounted, onUnmounted } from 'vue';
import socket from '../services/socket.js';
import store from '../store/index.js';

export function useSocket() {
  const isConnected = ref(false);
  const socketInstance = ref(null);

  const initWebSocket = (apiKey) => {
    if (!apiKey) return;
    
    // 如果已有连接，先关闭旧连接
    socket.disconnect();
    
    // 使用socket服务连接
    socketInstance.value = socket.connect(apiKey);
    
    // 添加连接状态监听
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
    
    // 监听剪贴板更新事件
    socketInstance.value.on('clipboard-update', (data) => {
      try {
        console.log('[SOCKET_CLIENT] 收到clipboard-update消息:', data);
        // 将新内容添加到列表顶部
        store.mutations.ADD_CLIPBOARD_ITEM(data);
        console.log('[SOCKET_CLIENT] 已添加到store, 当前列表长度:', store.state.items.length);
        
        // 同时通知聊天框
        if (window.mainViewRef) {
          window.mainViewRef.addMessageToChat(data);
        }
        
        if (window.$message) {
          window.$message.success('收到新内容');
        }
      } catch (error) {
        console.error('[SOCKET_CLIENT] 处理WebSocket消息时出错:', error);
      }
    });
    
    // 监听剪贴板删除事件
    socketInstance.value.on('clipboard-delete', (data) => {
      try {
        if (!data || typeof data.id === 'undefined') return;
        store.mutations.REMOVE_CLIPBOARD_ITEM(data.id);
      } catch (e) {
        console.error('处理删除事件出错:', e);
      }
    });
    
    // 监听用户更新事件
    socketInstance.value.on('user-update', (data) => {
      store.mutations.SET_ACTIVE_USERS(data);
    });
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