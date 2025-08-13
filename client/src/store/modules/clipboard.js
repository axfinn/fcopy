export const clipboard = {
  state: {
    items: [],
    loading: false,
    pagination: {
      currentPage: 1,
      pageSize: 10,
      total: 0
    },
    searchParams: {
      keyword: '',
      type: ''
    }
  },
  
  mutations: {
    SET_CLIPBOARD_ITEMS(state, items) {
      state.items = Array.isArray(items) ? items : [];
    },
    
    ADD_CLIPBOARD_ITEM(state, item) {
      if (item && typeof item.id !== 'undefined') {
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
          ip_address: item.ip_address || item.ip || null,
          user_agent: item.user_agent || item.ua || null,
          created_at: item.created_at || new Date().toISOString(),
          // 添加type字段以匹配前端组件期望的格式
          type: item.type || (item.content ? 'text' : 'file')
        };
        
        // 检查是否已存在，避免重复添加
        const existingIndex = state.items.findIndex(existingItem => existingItem.id === formattedItem.id);
        if (existingIndex === -1) {
          state.items.unshift(formattedItem);
          
          // 保持最多显示100条记录
          if (state.items.length > 100) {
            state.items.splice(100);
          }
        } else {
          // 更新现有项目
          state.items.splice(existingIndex, 1, formattedItem);
          // 将该项目移到列表顶部
          const [updatedItem] = state.items.splice(existingIndex, 1);
          state.items.unshift(updatedItem);
        }
        
        console.log('更新后的剪贴板项目列表:', state.items);
      }
    },
    
    REMOVE_CLIPBOARD_ITEM(state, itemId) {
      const index = state.items.findIndex(item => item.id === itemId);
      if (index > -1) {
        state.items.splice(index, 1);
      }
    },
    
    UPDATE_CLIPBOARD_ITEM(state, updatedItem) {
      const index = state.items.findIndex(item => item.id === updatedItem.id);
      if (index > -1) {
        state.items.splice(index, 1, updatedItem);
      }
    },
    
    SET_LOADING(state, loading) {
      state.loading = loading;
    },
    
    SET_PAGINATION(state, pagination) {
      state.pagination = { ...state.pagination, ...pagination };
    },
    
    SET_SEARCH_PARAMS(state, params) {
      state.searchParams = { ...state.searchParams, ...params };
    }
  },
  
  getters: {
    clipboardItems: state => state.items,
    clipboardLoading: state => state.loading,
    clipboardPagination: state => state.pagination,
    clipboardSearchParams: state => state.searchParams,
    clipboardItemsCount: state => state.items.length
  }
};