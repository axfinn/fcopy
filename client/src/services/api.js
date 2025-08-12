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
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
    }
    
    return response.json();
  }

  // 格式化时间为上海时区
  formatToShanghaiTime(dateString) {
    if (!dateString) return '';
    const date = new Date(dateString);
    // API返回的时间已经是上海时区的ISO格式（包含+08:00后缀）
    // 直接格式化为中文时间格式，不再指定时区转换
    return date.toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    });
  }

  // 格式化剪贴板项目数据
  formatClipboardItem(item) {
    return {
      ...item,
      created_at: this.formatToShanghaiTime(item.created_at)
    };
  }

  // 用户认证
  authenticate(apiKey) {
    return this.request('/users/auth', {
      method: 'POST',
      body: JSON.stringify({ apiKey })
    });
  }

  // 获取剪贴板历史记录
  async getClipboardHistory(params = {}) {
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
    
    // 添加类型筛选参数
    if (params.type !== undefined && params.type !== '') {
      searchParams.append('type', params.type);
    }
    
    const queryString = searchParams.toString();
    const url = queryString ? `/clipboard?${queryString}` : '/clipboard';
    
    const response = await this.request(url);
    
    // 格式化返回的数据
    if (response.data && Array.isArray(response.data)) {
      response.data = response.data.map(item => this.formatClipboardItem(item));
    }
    
    return response;
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

  // 获取活跃用户
  getActiveUsers() {
    return this.request('/active-users');
  }

  // 获取所有用户 (仅管理员)
  getUsers() {
    return this.request('/users');
  }

  // 添加用户 (仅管理员)
  addUser(userData) {
    return this.request('/users', {
      method: 'POST',
      body: JSON.stringify(userData)
    });
  }

  // 删除用户 (仅管理员)
  deleteUser(userId) {
    return this.request(`/users/${userId}`, {
      method: 'DELETE'
    });
  }

  // 获取访问日志 (仅管理员)
  getAccessLogs(params = {}) {
    // 构建查询参数
    const searchParams = new URLSearchParams();
    
    // 添加分页参数
    if (params.page !== undefined) {
      searchParams.append('page', params.page);
    }
    
    if (params.size !== undefined) {
      searchParams.append('size', params.size);
    }
    
    const queryString = searchParams.toString();
    const url = queryString ? `/logs/access?${queryString}` : '/logs/access';
    
    return this.request(url);
  }

  // 下载文件（返回 fetch Response，调用方自行处理 blob）
  async downloadFile(id) {
    const url = `${this.baseUrl}/clipboard/file/${id}?download=1`;
    const response = await fetch(url, {
      headers: { 'X-API-Key': this.apiKey }
    });
    if (!response.ok) {
      throw new Error(`下载失败: ${response.status}`);
    }
    return response; // 让调用方选择 blob/text
  }
}

export default new ClipboardApi();

export async function downloadFile(id, apiKey) {
  const url = `/api/clipboard/file/${id}?download=1`;
  try {
    const resp = await fetch(url, { headers: { 'X-API-Key': apiKey }});
    if (!resp.ok) throw new Error('status ' + resp.status);
    const disposition = resp.headers.get('Content-Disposition') || '';
    let suggested = 'download';
    const m = disposition.match(/filename\*=UTF-8''([^;]+)|filename="?([^";]+)"?/i);
    if (m) suggested = decodeURIComponent(m[1] || m[2] || suggested);
    const blob = await resp.blob();
    if (blob.size === 0) throw new Error('empty');
    const objectUrl = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = objectUrl;
    a.download = suggested;
    document.body.appendChild(a);
    a.click();
    setTimeout(()=>{ URL.revokeObjectURL(objectUrl); a.remove(); }, 1500);
    return true;
  } catch(e) {
    console.warn('[api][downloadFile] blob 方式失败, fallback 直接导航', e);
    const a = document.createElement('a');
    a.href = `${url}&ts=${Date.now()}`;
    a.setAttribute('download','');
    document.body.appendChild(a);
    a.click();
    setTimeout(()=> a.remove(), 1000);
    return false;
  }
}