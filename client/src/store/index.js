import { reactive, readonly } from 'vue';
import api from '../services/api.js';
import socket from '../services/socket.js';
import { clipboard } from './modules/clipboard.js';
import { user } from './modules/user.js';
import { ui } from './modules/ui.js';
import { admin } from './modules/admin.js';

// 合并所有模块的state
const initialState = {
  ...clipboard.state,
  ...user.state,
  ...ui.state,
  ...admin.state,
  // 添加一些必需的兼容性字段
  githubInfo: null
};

// 创建响应式状态
const state = reactive(initialState);

let clipboardUpdateListener = null;

// 合并所有模块的mutations，绑定到正确的state
const mutations = {
  ...Object.keys(clipboard.mutations).reduce((acc, key) => {
    acc[key] = (...args) => clipboard.mutations[key](state, ...args);
    return acc;
  }, {}),
  ...Object.keys(user.mutations).reduce((acc, key) => {
    acc[key] = (...args) => user.mutations[key](state, ...args);
    return acc;
  }, {}),
  ...Object.keys(ui.mutations).reduce((acc, key) => {
    acc[key] = (...args) => ui.mutations[key](state, ...args);
    return acc;
  }, {}),
  ...Object.keys(admin.mutations).reduce((acc, key) => {
    acc[key] = (...args) => admin.mutations[key](state, ...args);
    return acc;
  }, {}),
  
  // 兼容性方法 - 将旧的方法映射到新的模块方法
  SET_AUTHENTICATED(isAuthenticated) {
    // 直接调用SET_USER_INFO来更新用户信息
    if (isAuthenticated) {
      // 如果已有用户信息，只更新认证状态
      if (state.userInfo) {
        user.mutations.SET_USER_INFO(state, { ...state.userInfo, isAuthenticated: true });
      } else {
        user.mutations.SET_USER_INFO(state, { isAuthenticated: true });
      }
    } else {
      user.mutations.SET_USER_INFO(state, null);
    }
  },
  
  SET_ADMIN(isAdmin) {
    if (state.userInfo) {
      user.mutations.SET_USER_INFO(state, { ...state.userInfo, is_admin: isAdmin });
    }
  },
  
  SET_USERNAME(username) {
    if (state.userInfo) {
      user.mutations.SET_USER_INFO(state, { ...state.userInfo, username });
    } else {
      user.mutations.SET_USER_INFO(state, { username });
    }
  },
  
  SET_CURRENT_PAGE(page) {
    clipboard.mutations.SET_PAGINATION(state, { currentPage: page });
  },
  
  SET_PAGE_SIZE(size) {
    clipboard.mutations.SET_PAGINATION(state, { pageSize: size });
  },
  
  SET_TOTAL_ITEMS(total) {
    clipboard.mutations.SET_PAGINATION(state, { total });
  },
  
  SET_SEARCH_KEYWORD(keyword) {
    clipboard.mutations.SET_SEARCH_PARAMS(state, { keyword });
  },
  
  initializeBackground() {
    ui.mutations.INIT_BACKGROUND(state);
  },
  
  // 其他兼容性方法
  SET_GITHUB_INFO(info) {
    // 可以添加到admin模块或者直接设置
    state.githubInfo = info;
  },
  
  SET_LOADING(type, loading) {
    if (state.loading && typeof state.loading === 'object') {
      state.loading[type] = loading;
    }
  },
  
  // 确保API密钥正确设置
  SET_API_KEY(apiKey) {
    state.apiKey = apiKey;
    api.setApiKey(apiKey);
  }
};

// 添加兼容性getters - 使用可写的计算属性
Object.defineProperty(state, 'clipboardItems', {
  get() { return this.items; },
  set() {}, // 允许设置但忽略
  enumerable: true,
  configurable: true
});
Object.defineProperty(state, 'isAuthenticated', {
  get() { return !!this.userInfo; },
  set() {}, // 允许设置但忽略
  enumerable: true,
  configurable: true
});
Object.defineProperty(state, 'username', {
  get() { return this.userInfo?.username; },
  set() {}, // 允许设置但忽略
  enumerable: true,
  configurable: true
});
Object.defineProperty(state, 'currentPage', {
  get() { return this.pagination.currentPage; },
  set() {}, // 允许设置但忽略
  enumerable: true,
  configurable: true
});
Object.defineProperty(state, 'pageSize', {
  get() { return this.pagination.pageSize; },
  set() {}, // 允许设置但忽略
  enumerable: true,
  configurable: true
});
Object.defineProperty(state, 'totalItems', {
  get() { return this.pagination.total; },
  set() {}, // 允许设置但忽略
  enumerable: true,
  configurable: true
});
Object.defineProperty(state, 'isAdmin', {
  get() { return !!this.userInfo?.is_admin; },
  set() {}, // 允许设置但忽略
  enumerable: true,
  configurable: true
});

// 创建store实例
const store = {
  state: state, // 移除readonly，因为mutations需要能够修改状态
  mutations
};

export default store;