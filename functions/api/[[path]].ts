// Cloudflare Pages Functions API
interface Env {
  BOOKMARK_KV: KVNamespace;
}

// CORS 头
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

// 处理 OPTIONS 请求
function handleOptions() {
  return new Response(null, { headers: corsHeaders });
}

// JSON 响应
function jsonResponse(data: any, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      ...corsHeaders,
    },
  });
}

// 主处理函数
export const onRequest: PagesFunction<Env> = async (context) => {
  const { request, env, params } = context;
  const url = new URL(request.url);
  const path = params.path ? (params.path as string[]).join('/') : '';
  
  // 处理 OPTIONS
  if (request.method === 'OPTIONS') {
    return handleOptions();
  }

  try {
    // 健康检查
    if (path === 'ping' && request.method === 'GET') {
      return jsonResponse({ ok: true, timestamp: Date.now() });
    }

    // 获取所有数据
    if (path === 'data' && request.method === 'GET') {
      const categories = await env.BOOKMARK_KV.get('categories', 'json') || [];
      const items = await env.BOOKMARK_KV.get('items', 'json') || [];
      const settings = await env.BOOKMARK_KV.get('settings', 'json') || {};
      const defaultTheme = await env.BOOKMARK_KV.get('defaultTheme', 'json') || null;
      
      return jsonResponse({ categories, items, settings, defaultTheme });
    }

    // 保存分类
    if (path === 'categories' && request.method === 'POST') {
      const auth = request.headers.get('Authorization');
      const storedPassword = await env.BOOKMARK_KV.get('password') || 'admin';
      
      if (auth !== storedPassword) {
        return jsonResponse({ error: '未授权' }, 401);
      }
      
      const categories = await request.json();
      await env.BOOKMARK_KV.put('categories', JSON.stringify(categories));
      return jsonResponse({ success: true });
    }

    // 保存收藏项
    if (path === 'items' && request.method === 'POST') {
      const auth = request.headers.get('Authorization');
      const storedPassword = await env.BOOKMARK_KV.get('password') || 'admin';
      
      if (auth !== storedPassword) {
        return jsonResponse({ error: '未授权' }, 401);
      }
      
      const items = await request.json();
      await env.BOOKMARK_KV.put('items', JSON.stringify(items));
      return jsonResponse({ success: true });
    }

    // 验证密码
    if (path === 'auth/login' && request.method === 'POST') {
      const { password } = await request.json();
      const storedPassword = await env.BOOKMARK_KV.get('password') || 'admin';
      
      if (password === storedPassword) {
        return jsonResponse({ success: true, token: storedPassword });
      }
      return jsonResponse({ error: '密码错误' }, 401);
    }

    // 修改密码
    if (path === 'auth/password' && request.method === 'POST') {
      const auth = request.headers.get('Authorization');
      const storedPassword = await env.BOOKMARK_KV.get('password') || 'admin';
      
      if (auth !== storedPassword) {
        return jsonResponse({ error: '未授权' }, 401);
      }
      
      const { newPassword } = await request.json();
      await env.BOOKMARK_KV.put('password', newPassword);
      return jsonResponse({ success: true });
    }

    // 保存默认主题
    if (path === 'theme/default' && request.method === 'POST') {
      const auth = request.headers.get('Authorization');
      const storedPassword = await env.BOOKMARK_KV.get('password') || 'admin';
      
      if (auth !== storedPassword) {
        return jsonResponse({ error: '未授权' }, 401);
      }
      
      const theme = await request.json();
      await env.BOOKMARK_KV.put('defaultTheme', JSON.stringify(theme));
      return jsonResponse({ success: true });
    }

    // 上传文件
    if (path === 'upload' && request.method === 'POST') {
      const auth = request.headers.get('Authorization');
      const storedPassword = await env.BOOKMARK_KV.get('password') || 'admin';
      
      if (auth !== storedPassword) {
        return jsonResponse({ error: '未授权' }, 401);
      }
      
      const formData = await request.formData();
      const file = formData.get('file') as File;
      
      if (!file) {
        return jsonResponse({ error: '没有文件' }, 400);
      }
      
      // 将文件转为 base64 存储在 KV 中
      const arrayBuffer = await file.arrayBuffer();
      const base64 = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));
      const dataUrl = `data:${file.type};base64,${base64}`;
      
      const fileId = `file_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      // 保存文件数据和元信息
      await env.BOOKMARK_KV.put(fileId, JSON.stringify({
        data: dataUrl,
        name: file.name,
        type: file.type,
        size: file.size,
        createdAt: Date.now()
      }));
      
      return jsonResponse({ 
        success: true, 
        fileId,
        url: `/api/file/${fileId}`,
        name: file.name,
        type: file.type,
        size: file.size
      });
    }

    // 获取文件
    if (path.startsWith('file/') && request.method === 'GET') {
      const fileId = path.replace('file/', '');
      const fileDataStr = await env.BOOKMARK_KV.get(fileId);
      
      if (!fileDataStr) {
        return jsonResponse({ error: '文件不存在' }, 404);
      }
      
      let dataUrl: string;
      let fileName = 'file';
      let mimeType = 'application/octet-stream';
      
      // 尝试解析为 JSON（新格式）
      try {
        const fileData = JSON.parse(fileDataStr);
        dataUrl = fileData.data;
        fileName = fileData.name || fileName;
        mimeType = fileData.type || mimeType;
      } catch {
        // 旧格式，直接是 data URL
        dataUrl = fileDataStr;
      }
      
      // 解析 data URL
      const matches = dataUrl.match(/^data:(.+);base64,(.+)$/);
      if (!matches) {
        return jsonResponse({ error: '文件格式错误' }, 500);
      }
      
      mimeType = matches[1] || mimeType;
      const base64 = matches[2];
      const binary = atob(base64);
      const bytes = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) {
        bytes[i] = binary.charCodeAt(i);
      }
      
      return new Response(bytes, {
        headers: {
          'Content-Type': mimeType,
          'X-File-Name': encodeURIComponent(fileName),
          'Content-Disposition': `inline; filename="${encodeURIComponent(fileName)}"`,
          ...corsHeaders,
        },
      });
    }

    return jsonResponse({ error: '未找到' }, 404);
  } catch (error) {
    console.error(error);
    return jsonResponse({ error: '服务器错误' }, 500);
  }
};
