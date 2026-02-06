// API 服务层 - 与 Cloudflare Workers 后端通信

const API_BASE = '/api';

// 检查是否在云端环境
export const isCloudEnvironment = () => {
  return window.location.hostname !== 'localhost' && 
         window.location.hostname !== '127.0.0.1' &&
         !window.location.hostname.includes('webcontainer') &&
         !window.location.hostname.includes('local');
};

// 获取存储的 token
function getToken(): string | null {
  return sessionStorage.getItem('auth_token');
}

// 设置 token
export function setToken(token: string | null) {
  if (token) {
    sessionStorage.setItem('auth_token', token);
  } else {
    sessionStorage.removeItem('auth_token');
  }
}

// 通用请求函数
async function request<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getToken();
  
  const headers: HeadersInit = {
    ...options.headers,
  };
  
  if (token) {
    (headers as Record<string, string>)['Authorization'] = token;
  }
  
  if (options.body && typeof options.body === 'string') {
    (headers as Record<string, string>)['Content-Type'] = 'application/json';
  }
  
  const response = await fetch(`${API_BASE}/${path}`, {
    ...options,
    headers,
  });
  
  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: '请求失败' }));
    throw new Error(error.error || '请求失败');
  }
  
  return response.json();
}

// API 接口
export const api = {
  // 健康检查 - 检测云端 API 是否可用
  async ping(): Promise<boolean> {
    try {
      const response = await fetch(`${API_BASE}/ping`, { 
        method: 'GET',
        // 短超时，快速检测
        signal: AbortSignal.timeout(5000)
      });
      return response.ok;
    } catch {
      return false;
    }
  },
  
  // 获取所有数据
  async getData() {
    try {
      return await request<{
        categories: any[];
        items: any[];
        settings: any;
        defaultTheme: any;
      }>('data');
    } catch {
      // 如果 API 不可用，返回 null，使用本地存储
      return null;
    }
  },
  
  // 保存分类
  async saveCategories(categories: any[], token?: string) {
    if (token) setToken(token);
    return request('categories', {
      method: 'POST',
      body: JSON.stringify(categories),
    });
  },
  
  // 保存收藏项
  async saveItems(items: any[], token?: string) {
    if (token) setToken(token);
    return request('items', {
      method: 'POST',
      body: JSON.stringify(items),
    });
  },
  
  // 登录
  async login(password: string) {
    const result = await request<{ success: boolean; token: string }>('auth/login', {
      method: 'POST',
      body: JSON.stringify({ password }),
    });
    if (result.success && result.token) {
      setToken(result.token);
    }
    return result;
  },
  
  // 登出
  logout() {
    setToken(null);
  },
  
  // 修改密码
  async changePassword(newPassword: string) {
    const result = await request<{ success: boolean }>('auth/password', {
      method: 'POST',
      body: JSON.stringify({ newPassword }),
    });
    if (result.success) {
      setToken(newPassword);
    }
    return result;
  },
  
  // 保存默认主题
  async saveDefaultTheme(theme: any) {
    return request('theme/default', {
      method: 'POST',
      body: JSON.stringify(theme),
    });
  },
  
  // 上传文件
  async uploadFile(file: File) {
    const formData = new FormData();
    formData.append('file', file);
    
    const token = getToken();
    const headers: HeadersInit = {};
    if (token) {
      headers['Authorization'] = token;
    }
    
    const response = await fetch(`${API_BASE}/upload`, {
      method: 'POST',
      headers,
      body: formData,
    });
    
    if (!response.ok) {
      throw new Error('上传失败');
    }
    
    return response.json();
  },
  
  // 获取文件 URL
  getFileUrl(fileId: string) {
    return `${API_BASE}/file/${fileId}`;
  },
  
  // 检查是否已登录
  isLoggedIn() {
    return !!getToken();
  }
};
