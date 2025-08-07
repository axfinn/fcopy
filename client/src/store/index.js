import { reactive, readonly } from 'vue';
import api from '../services/api.js';
import socket from '../services/socket.js';

// 创建响应式状态
const state = reactive({
  isAuthenticated: false,
  apiKey: null,
  isAdmin: false,
  users: [],
  activeUsers: [],
  clipboardItems: [],
  accessLogs: [],
  githubInfo: null,
  backgroundImages: [
    'https://picsum.photos/1920/1080?random=1'
  ],
  currentBackground: '',
  loading: {
    activeUsers: false,
    clipboard: false,
    accessLogs: false,
    users: false
  },
  // 分页相关状态
  currentPage: 1,
  pageSize: 10,
  totalItems: 0,
  searchKeyword: ''
});

let clipboardUpdateListener = null;

// 定义mutations（修改状态的方法）
const mutations = {
  SET_AUTHENTICATED(isAuthenticated) {
    state.isAuthenticated = isAuthenticated;
  },

  SET_ADMIN(isAdmin) {
    state.isAdmin = isAdmin;
  },

  SET_API_KEY(apiKey) {
    state.apiKey = apiKey;
    api.setApiKey(apiKey);
  },

  SET_CLIPBOARD_ITEMS(items) {
    state.clipboardItems = items;
  },

  ADD_CLIPBOARD_ITEM(item) {
    console.log('添加剪贴板项目:', item);
    // 确保项目有正确的格式
    const formattedItem = {
      id: item.id,
      content: item.content || '',
      file_path: item.file_path || null,
      file_name: item.file_name || item.filename || null, // 兼容后端返回的filename字段
      file_size: item.file_size || item.size || null, // 兼容后端返回的size字段
      mime_type: item.mime_type || null,
      user_id: item.user_id,
      created_at: item.created_at || new Date().toISOString(),
      // 添加type字段以匹配前端组件期望的格式
      type: item.type || (item.content ? 'text' : 'file')
    };
    
    // 检查项目是否已存在于列表中
    const existingIndex = state.clipboardItems.findIndex(existingItem => existingItem.id === formattedItem.id);
    
    if (existingIndex === -1) {
      // 只有当项目不存在时才添加到列表顶部
      state.clipboardItems.unshift(formattedItem);
      
      // 保持最多显示100条记录
      if (state.clipboardItems.length > 100) {
        state.clipboardItems.splice(100);
      }
    } else {
      // 如果项目已存在，更新它而不是添加新项目
      state.clipboardItems[existingIndex] = formattedItem;
      
      // 将该项目移到列表顶部
      const [updatedItem] = state.clipboardItems.splice(existingIndex, 1);
      state.clipboardItems.unshift(updatedItem);
    }
    
    console.log('更新后的剪贴板项目列表:', state.clipboardItems);
  },

  SET_ACCESS_LOGS(logs) {
    state.accessLogs = logs;
  },

  SET_USERS(users) {
    state.users = users;
  },

  SET_ACTIVE_USERS(activeUsers) {
    state.activeUsers = activeUsers;
  },

  SET_GITHUB_INFO(githubInfo) {
    state.githubInfo = githubInfo;
  },

  SET_TOTAL_ITEMS(total) {
    state.totalItems = total;
  },

  SET_CURRENT_PAGE(page) {
    state.currentPage = page;
  },

  SET_PAGE_SIZE(size) {
    state.pageSize = size;
  },

  SET_SEARCH_KEYWORD(keyword) {
    state.searchKeyword = keyword;
  },

  SET_LOADING(type, loading) {
    state.loading[type] = loading;
  },
  
  initializeBackground() {
    // 从本地存储获取背景图片设置
    const savedBackground = localStorage.getItem('clipboard_background');
    if (savedBackground) {
      state.currentBackground = savedBackground;
    } else {
      // 默认使用第一张图片
      state.currentBackground = state.backgroundImages[0];
    }
  }
};

// 创建store实例
const store = {
  state: readonly(state),
  mutations
};

export default store;