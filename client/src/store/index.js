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
    state.isAuthenticated = isAuthenticated;
  },
  
  SET_ADMIN(isAdmin) {
    state.isAdmin = isAdmin;
    if (state.userInfo) {
      state.userInfo = { ...state.userInfo, is_admin: isAdmin };
    }
  },
  
  SET_USERNAME(username) {
    state.username = username;
    if (state.userInfo) {
      state.userInfo = { ...state.userInfo, username };
    }
  },
  
  SET_CURRENT_PAGE(page) {
    if (state.pagination) {
      state.pagination.currentPage = page;
    }
  },
  
  SET_PAGE_SIZE(size) {
    if (state.pagination) {
      state.pagination.pageSize = size;
    }
  },
  
  SET_TOTAL_ITEMS(total) {
    if (state.pagination) {
      state.pagination.total = total;
    }
  },
  
  SET_SEARCH_KEYWORD(keyword) {
    if (state.searchParams) {
      state.searchParams.keyword = keyword;
    }
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

// 添加兼容性getters
Object.defineProperty(state, 'clipboardItems', {
  get() { return this.items; }
});
Object.defineProperty(state, 'isAuthenticated', {
  get() { return !!this.userInfo; }
});
Object.defineProperty(state, 'username', {
  get() { return this.userInfo?.username; }
});
Object.defineProperty(state, 'currentPage', {
  get() { return this.pagination.currentPage; }
});
Object.defineProperty(state, 'pageSize', {
  get() { return this.pagination.pageSize; }
});
Object.defineProperty(state, 'totalItems', {
  get() { return this.pagination.total; }
});
Object.defineProperty(state, 'searchKeyword', {
  get() { return this.searchParams.keyword; }
});

// 创建store实例
const store = {
  state: readonly(state),
  mutations
};

export default store;