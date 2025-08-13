export const admin = {
  state: {
    accessLogs: [],
    pagination: {
      currentPage: 1,
      pageSize: 10,
      total: 0
    },
    rateLimits: {},
    systemInfo: {}
  },
  
  mutations: {
    SET_ACCESS_LOGS(state, logs) {
      state.accessLogs = Array.isArray(logs) ? logs : [];
    },
    
    SET_ADMIN_PAGINATION(state, pagination) {
      state.pagination = { ...state.pagination, ...pagination };
    },
    
    SET_RATE_LIMITS(state, rateLimits) {
      state.rateLimits = rateLimits || {};
    },
    
    SET_SYSTEM_INFO(state, systemInfo) {
      state.systemInfo = systemInfo || {};
    }
  },
  
  getters: {
    accessLogs: state => state.accessLogs,
    adminPagination: state => state.pagination,
    rateLimits: state => state.rateLimits,
    systemInfo: state => state.systemInfo
  }
};