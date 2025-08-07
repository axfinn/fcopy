// API服务模块
class ClipboardApi {
  constructor() {
    this.baseUrl = '/api';
  }

  // 设置API密钥
  setApiKey(apiKey) {
    this.apiKey = apiKey;
  }

  // 通用请求方法
  async request(endpoint, options = {}) {
    const url = `${this.baseUrl}${endpoint}`;
    const config = {
      headers: {
        'X-API-Key': this.apiKey,
        'Content-Type': 'application/json',
        ...options.headers
      },
      ...options
    };

    const response = await fetch(url, config);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    return response.json();
  }

  // 用户认证
  authenticate(apiKey) {
    return this.request('/users/auth', {
      method: 'POST',
      body: JSON.stringify({ apiKey })
    });
  }

  // 获取剪贴板历史记录
  getClipboardHistory(params = {}) {
    // 构建查询参数
    const searchParams = new URLSearchParams();
    
    // 添加分页参数
    if (params.page !== undefined) {
      searchParams.append('page', params.page);
    } else {
      searchParams.append('page', 1); // 默认第一页
    }
    
    if (params.size !== undefined) {
      searchParams.append('size', params.size);
    } else {
      searchParams.append('size', 10); // 默认每页10条
    }
    
    // 添加搜索参数
    if (params.search !== undefined && params.search !== '') {
      searchParams.append('search', params.search);
    }
    
    const queryString = searchParams.toString();
    const url = queryString ? `/clipboard?${queryString}` : '/clipboard';
    
    return this.request(url);
  }

  // 添加文本内容
  addTextContent(content) {
    return this.request('/clipboard/text', {
      method: 'POST',
      body: JSON.stringify({ content })
    });
  }

  // 删除剪贴板项目
  deleteClipboardItem(id) {
    return this.request(`/clipboard/${id}`, {
      method: 'DELETE'
    });
  }

  // 下载文件
  async downloadFile(fileId) {
    const response = await fetch(`${this.baseUrl}/clipboard/download/${fileId}`, {
      headers: {
        'X-API-Key': this.apiKey,
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || '下载失败');
    }
    
    return response;
  }

  // 获取访问日志
  getAccessLogs(params = {}) {
    const searchParams = new URLSearchParams();
    
    // 添加分页参数
    if (params.page !== undefined) {
      searchParams.append('page', params.page);
    } else {
      searchParams.append('page', 1);
    }
    
    if (params.size !== undefined) {
      searchParams.append('size', params.size);
    } else {
      searchParams.append('size', 10);
    }
    
    // 添加搜索参数
    if (params.search !== undefined && params.search !== '') {
      searchParams.append('search', params.search);
    }
    
    const queryString = searchParams.toString();
    const url = queryString ? `/access-logs/access?${queryString}` : '/access-logs/access';
    
    return this.request(url);
  }

  // 获取用户信息
  getUserInfo() {
    return this.request('/users/me');
  }

  // 获取所有用户（仅管理员）
  getAllUsers() {
    return this.request('/users');
  }

  // 添加用户
  addUser(userData) {
    return this.request('/users', {
      method: 'POST',
      body: JSON.stringify(userData)
    });
  }

  // 删除用户
  deleteUser(userId) {
    return this.request(`/users/${userId}`, {
      method: 'DELETE'
    });
  }

  // 获取活跃用户
  getActiveUsers(params = {}) {
    const searchParams = new URLSearchParams();
    
    // 复制参数到URLSearchParams对象
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) {
        searchParams.append(key, value);
      }
    });
    
    return this.request(`/active-users?${searchParams.toString()}`);
  }
}

export default new ClipboardApi();