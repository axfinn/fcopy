export const user = {
  state: {
    apiKey: null,
    userInfo: null,
    isAuthenticated: false,
    isAdmin: false,
    users: [],
    activeUsers: []
  },
  
  mutations: {
    SET_API_KEY(state, apiKey) {
      state.apiKey = apiKey;
      // 同时设置到api服务中
      if (typeof window !== 'undefined' && window.api) {
        window.api.setApiKey(apiKey);
      }
    },
    
    SET_USER_INFO(state, userInfo) {
      state.userInfo = userInfo;
      state.isAuthenticated = !!userInfo;
      state.isAdmin = userInfo?.is_admin || false;
    },
    
    SET_USERS(state, users) {
      state.users = Array.isArray(users) ? users : [];
    },
    
    SET_ACTIVE_USERS(state, activeUsers) {
      state.activeUsers = Array.isArray(activeUsers) ? activeUsers : [];
    },
    
    ADD_USER(state, user) {
      if (user && typeof user.id !== 'undefined') {
        state.users.push(user);
      }
    },
    
    REMOVE_USER(state, userId) {
      const index = state.users.findIndex(user => user.id === userId);
      if (index > -1) {
        state.users.splice(index, 1);
      }
    },
    
    UPDATE_USER(state, updatedUser) {
      const index = state.users.findIndex(user => user.id === updatedUser.id);
      if (index > -1) {
        state.users.splice(index, 1, updatedUser);
      }
    },
    
    LOGOUT(state) {
      state.apiKey = null;
      state.userInfo = null;
      state.isAuthenticated = false;
      state.isAdmin = false;
      state.users = [];
      state.activeUsers = [];
    }
  },
  
  getters: {
    apiKey: state => state.apiKey,
    userInfo: state => state.userInfo,
    isAuthenticated: state => state.isAuthenticated,
    isAdmin: state => state.isAdmin,
    users: state => state.users,
    activeUsers: state => state.activeUsers,
    username: state => state.userInfo?.username || '',
    userId: state => state.userInfo?.id
  }
};