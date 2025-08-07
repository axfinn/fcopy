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

  SET_CURRENT_BACKGROUND(background) {
    state.currentBackground = background;
  },

  SET_LOADING(section, loading) {
    state.loading[section] = loading;
  },

  SET_PAGINATION(page, size, total) {
    state.currentPage = page;
    state.pageSize = size;
    state.totalItems = total;
  },
  
  SET_SEARCH_KEYWORD(keyword) {
    state.searchKeyword = keyword;
  }
};

// 定义actions（业务逻辑方法）
const actions = {
  // 用户认证
  authenticate: async function(apiKey) {
    try {
      mutations.SET_LOADING('users', true);
      const result = await api.authenticate(apiKey);
      
      if (result.success) {
        mutations.SET_AUTHENTICATED(true);
        mutations.SET_API_KEY(apiKey);
        mutations.SET_ADMIN(result.admin || false);
        
        // 获取用户列表
        if (result.admin) {
          await this.fetchUsers();
        }
      } else {
        // 使用全局消息提示而不是this.$message
        console.error(result.message || '认证失败');
      }
      
      return result;
    } catch (error) {
      console.error('认证错误:', error);
      // 返回标准错误格式
      return { success: false, message: error.message || '认证过程中发生错误' };
    } finally {
      mutations.SET_LOADING('users', false);
    }
  },

  // 获取剪贴板历史记录
  fetchClipboardHistory: async function(search = '') {
    try {
      mutations.SET_LOADING('clipboard', true);
      // 使用当前状态的分页参数和搜索关键词
      const params = {
        page: state.currentPage,
        size: state.pageSize,
        search: search || state.searchKeyword
      };
      
      const result = await api.getClipboardHistory(params);
      
      if (result.success) {
        mutations.SET_CLIPBOARD_ITEMS(result.data || []);
        // 更新分页状态
        if (result.total !== undefined) {
          mutations.SET_PAGINATION(
            result.page || state.currentPage,
            result.size || state.pageSize,
            result.total
          );
        }
      } else {
        console.error(result.message || '获取剪贴板历史失败');
      }
      
      return result;
    } catch (error) {
      console.error('获取剪贴板历史错误:', error);
      return { success: false, message: '获取剪贴板历史时发生错误' };
    } finally {
      mutations.SET_LOADING('clipboard', false);
    }
  },

  // 获取访问日志
  fetchAccessLogs: async function() {
    try {
      mutations.SET_LOADING('accessLogs', true);
      // 使用当前状态的分页参数
      const params = {
        page: state.currentPage,
        size: state.pageSize
      };
      
      const result = await api.getAccessLogs(params);
      
      if (result.success) {
        mutations.SET_ACCESS_LOGS(result.data || []);
        // 更新分页状态
        if (result.total !== undefined) {
          mutations.SET_PAGINATION(
            result.page || state.currentPage,
            result.size || state.pageSize,
            result.total
          );
        }
      } else {
        console.error(result.message || '获取访问日志失败');
      }
      
      return result;
    } catch (error) {
      console.error('获取访问日志错误:', error);
      return { success: false, message: '获取访问日志时发生错误' };
    } finally {
      mutations.SET_LOADING('accessLogs', false);
    }
  },

  // 获取用户列表（仅管理员）
  fetchUsers: async function() {
    try {
      mutations.SET_LOADING('users', true);
      const result = await api.getAllUsers();
      
      if (result.success) {
        mutations.SET_USERS(result.data || []);
      } else {
        console.error(result.message || '获取用户列表失败');
      }
      
      return result;
    } catch (error) {
      console.error('获取用户列表错误:', error);
      return { success: false, message: '获取用户列表时发生错误' };
    } finally {
      mutations.SET_LOADING('users', false);
    }
  },

  // 获取活跃用户
  fetchActiveUsers: async function() {
    try {
      mutations.SET_LOADING('activeUsers', true);
      const result = await api.getActiveUsers();
      
      if (result.success) {
        mutations.SET_ACTIVE_USERS(result.data || []);
      } else {
        console.error(result.message || '获取活跃用户失败');
      }
      
      return result;
    } catch (error) {
      console.error('获取活跃用户错误:', error);
      return { success: false, message: '获取活跃用户时发生错误' };
    } finally {
      mutations.SET_LOADING('activeUsers', false);
    }
  },

  // 添加文本内容
  addTextContent: async function(content) {
    try {
      const result = await api.addTextContent(content);
      return result;
    } catch (error) {
      console.error('添加文本内容错误:', error);
      return { success: false, message: '添加文本内容时发生错误' };
    }
  },

  // 删除剪贴板项目
  deleteClipboardItem: async function(id) {
    try {
      const result = await api.deleteClipboardItem(id);
      return result;
    } catch (error) {
      console.error('删除剪贴板项目错误:', error);
      return { success: false, message: '删除剪贴板项目时发生错误' };
    }
  },

  // 添加用户（仅管理员）
  addUser: async function(userData) {
    try {
      const result = await api.addUser(userData);
      
      if (result.success) {
        // 添加成功后刷新用户列表
        await this.fetchUsers();
      }
      
      return result;
    } catch (error) {
      console.error('添加用户错误:', error);
      return { success: false, message: '添加用户时发生错误' };
    }
  },

  // 删除用户（仅管理员）
  deleteUser: async function(userId) {
    try {
      const result = await api.deleteUser(userId);
      
      if (result.success) {
        // 删除成功后刷新用户列表
        await this.fetchUsers();
      }
      
      return result;
    } catch (error) {
      console.error('删除用户错误:', error);
      return { success: false, message: '删除用户时发生错误' };
    }
  },

  // 登出
  logout: function() {
    mutations.SET_AUTHENTICATED(false);
    mutations.SET_ADMIN(false);
    mutations.SET_API_KEY(null);
    mutations.SET_USERS([]);
    mutations.SET_ACTIVE_USERS([]);
    mutations.SET_CLIPBOARD_ITEMS([]);
    mutations.SET_ACCESS_LOGS([]);
    localStorage.removeItem('clipboard_api_key');
  },

  // 初始化背景图片
  initializeBackground: function() {
    // 检查本地存储中是否有背景图片设置
    const storedBackground = localStorage.getItem('clipboard_background');
    if (storedBackground && state.backgroundImages.includes(storedBackground)) {
      mutations.SET_CURRENT_BACKGROUND(storedBackground);
    } else {
      // 默认使用第一张图片
      const defaultBackground = state.backgroundImages[0];
      mutations.SET_CURRENT_BACKGROUND(defaultBackground);
      localStorage.setItem('clipboard_background', defaultBackground);
    }
  },

  // 更新背景图片（现在只有一张图片，所以不更新）
  updateBackground: function() {
    // 保持当前背景图片不变
  },

  // 设置搜索关键词
  setSearchKeyword: function(keyword) {
    mutations.SET_SEARCH_KEYWORD(keyword);
  }
};

// 导出只读状态和方法
export default {
  state: readonly(state),
  ...actions,
  ...mutations
};