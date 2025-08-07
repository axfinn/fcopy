import { io } from 'socket.io-client';

class SocketService {
  constructor() {
    this.socket = null;
    this.listeners = new Map();
  }

  // 连接WebSocket
  connect(apiKey) {
    this.socket = io('/', {
      auth: {
        apiKey
      }
    });

    // 注册事件监听器
    this.listeners.forEach((callback, event) => {
      this.socket.on(event, callback);
    });

    return this.socket;
  }

  // 断开连接
  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  // 添加事件监听器
  on(event, callback) {
    this.listeners.set(event, callback);
    if (this.socket) {
      this.socket.on(event, callback);
    }
  }

  // 移除事件监听器
  off(event, callback) {
    this.listeners.delete(event);
    if (this.socket) {
      this.socket.off(event, callback);
    }
  }
}

export default new SocketService();