import { useState, useEffect, useCallback, useRef } from 'react';
import { api, setToken } from '../services/api';
import { Category, BookmarkItem, ThemeConfig } from '../types';

// 默认主题设置
const defaultLightTheme: ThemeConfig = {
  mode: 'system',
  lightBackground: { type: 'gradient', value: 'bg-gradient-to-br from-slate-100 via-blue-50 to-indigo-100' },
  darkBackground: { type: 'gradient', value: 'bg-gradient-to-br from-gray-900 via-slate-900 to-zinc-900' },
};

// 示例数据
const sampleCategories: Category[] = [
  { id: 'cat-1', name: '工作', parentId: null, order: 0 },
  { id: 'cat-2', name: '学习', parentId: null, order: 1 },
  { id: 'cat-3', name: '娱乐', parentId: null, order: 2 },
  { id: 'cat-1-1', name: '项目文档', parentId: 'cat-1', order: 0 },
  { id: 'cat-2-1', name: '编程', parentId: 'cat-2', order: 0 },
  { id: 'cat-2-2', name: '设计', parentId: 'cat-2', order: 1 },
];

const sampleItems: BookmarkItem[] = [
  {
    id: 'item-1',
    type: 'website',
    title: 'GitHub',
    url: 'https://github.com',
    categoryId: 'cat-1-1',
    createdAt: Date.now(),
    order: 0,
  },
  {
    id: 'item-2',
    type: 'note',
    title: '学习笔记',
    content: '这是一个示例笔记，可以记录重要信息。\n\n支持多行文本。',
    categoryId: 'cat-2-1',
    createdAt: Date.now(),
    order: 0,
  },
  {
    id: 'item-3',
    type: 'website',
    title: 'Tailwind CSS',
    url: 'https://tailwindcss.com',
    categoryId: 'cat-2-1',
    createdAt: Date.now(),
    order: 1,
  },
];

export function useCloudStorage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [items, setItems] = useState<BookmarkItem[]>([]);
  const [theme, setTheme] = useState<ThemeConfig>(defaultLightTheme);
  const [defaultTheme, setDefaultTheme] = useState<ThemeConfig | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isCloudMode, setIsCloudMode] = useState(false);
  
  const saveTimeoutRef = useRef<{ categories?: number; items?: number }>({});

  // 初始化加载数据
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    
    try {
      // 尝试从云端加载
      const cloudData = await api.getData();
      
      if (cloudData) {
        setIsCloudMode(true);
        
        // 使用云端数据
        if (cloudData.categories && cloudData.categories.length > 0) {
          setCategories(cloudData.categories);
        } else {
          setCategories(sampleCategories);
        }
        
        if (cloudData.items && cloudData.items.length > 0) {
          setItems(cloudData.items);
        } else {
          setItems(sampleItems);
        }
        
        if (cloudData.defaultTheme) {
          setDefaultTheme(cloudData.defaultTheme);
          // 使用默认主题（如果用户未自定义）
          const savedUserTheme = localStorage.getItem('bookmark-user-theme');
          if (savedUserTheme) {
            setTheme(JSON.parse(savedUserTheme));
          } else {
            setTheme(cloudData.defaultTheme);
          }
        } else {
          const savedUserTheme = localStorage.getItem('bookmark-user-theme');
          if (savedUserTheme) {
            setTheme(JSON.parse(savedUserTheme));
          }
        }
        
        // 检查是否已登录
        setIsAuthenticated(api.isLoggedIn());
      } else {
        // 云端不可用，使用本地存储
        loadFromLocalStorage();
      }
    } catch (error) {
      console.error('加载云端数据失败:', error);
      loadFromLocalStorage();
    }
    
    setIsLoading(false);
  };

  const loadFromLocalStorage = () => {
    setIsCloudMode(false);
    
    const savedCategories = localStorage.getItem('bookmark-categories');
    const savedItems = localStorage.getItem('bookmark-items');
    const savedTheme = localStorage.getItem('bookmark-theme');
    const savedDefaultTheme = localStorage.getItem('bookmark-default-theme');
    const savedAuth = localStorage.getItem('bookmark-auth');

    if (savedCategories) {
      setCategories(JSON.parse(savedCategories));
    } else {
      setCategories(sampleCategories);
    }

    if (savedItems) {
      setItems(JSON.parse(savedItems));
    } else {
      setItems(sampleItems);
    }

    if (savedDefaultTheme) {
      const parsed = JSON.parse(savedDefaultTheme);
      setDefaultTheme(parsed);
      if (savedTheme) {
        setTheme(JSON.parse(savedTheme));
      } else {
        setTheme(parsed);
      }
    } else if (savedTheme) {
      setTheme(JSON.parse(savedTheme));
    }

    if (savedAuth === 'true') {
      setIsAuthenticated(true);
    }
  };

  // 保存分类（带防抖）
  const saveCategories = useCallback((newCategories: Category[]) => {
    setCategories(newCategories);
    
    // 清除之前的定时器
    if (saveTimeoutRef.current.categories) {
      clearTimeout(saveTimeoutRef.current.categories);
    }
    
    // 延迟保存
    saveTimeoutRef.current.categories = window.setTimeout(async () => {
      if (isCloudMode && isAuthenticated) {
        try {
          await api.saveCategories(newCategories);
        } catch (error) {
          console.error('保存分类失败:', error);
        }
      }
      localStorage.setItem('bookmark-categories', JSON.stringify(newCategories));
    }, 500);
  }, [isCloudMode, isAuthenticated]);

  // 保存收藏项（带防抖）
  const saveItems = useCallback((newItems: BookmarkItem[]) => {
    setItems(newItems);
    
    if (saveTimeoutRef.current.items) {
      clearTimeout(saveTimeoutRef.current.items);
    }
    
    saveTimeoutRef.current.items = window.setTimeout(async () => {
      if (isCloudMode && isAuthenticated) {
        try {
          await api.saveItems(newItems);
        } catch (error) {
          console.error('保存收藏失败:', error);
        }
      }
      localStorage.setItem('bookmark-items', JSON.stringify(newItems));
    }, 500);
  }, [isCloudMode, isAuthenticated]);

  // 保存主题
  const saveTheme = useCallback((newTheme: ThemeConfig) => {
    setTheme(newTheme);
    localStorage.setItem('bookmark-theme', JSON.stringify(newTheme));
    localStorage.setItem('bookmark-user-theme', JSON.stringify(newTheme));
  }, []);

  // 保存默认主题
  const saveDefaultTheme = useCallback(async (newDefaultTheme: ThemeConfig) => {
    setDefaultTheme(newDefaultTheme);
    
    if (isCloudMode && isAuthenticated) {
      try {
        await api.saveDefaultTheme(newDefaultTheme);
      } catch (error) {
        console.error('保存默认主题失败:', error);
      }
    }
    localStorage.setItem('bookmark-default-theme', JSON.stringify(newDefaultTheme));
  }, [isCloudMode, isAuthenticated]);

  // 登录
  const login = useCallback(async (password: string): Promise<boolean> => {
    if (isCloudMode) {
      try {
        await api.login(password);
        setIsAuthenticated(true);
        return true;
      } catch (error) {
        return false;
      }
    } else {
      // 本地模式
      const storedPassword = localStorage.getItem('bookmark-password') || 'admin';
      if (password === storedPassword) {
        setIsAuthenticated(true);
        localStorage.setItem('bookmark-auth', 'true');
        return true;
      }
      return false;
    }
  }, [isCloudMode]);

  // 登出
  const logout = useCallback(() => {
    if (isCloudMode) {
      api.logout();
    }
    setIsAuthenticated(false);
    localStorage.removeItem('bookmark-auth');
    setToken(null);
  }, [isCloudMode]);

  // 修改密码
  const changePassword = useCallback(async (newPassword: string): Promise<boolean> => {
    if (isCloudMode) {
      try {
        await api.changePassword(newPassword);
        return true;
      } catch (error) {
        return false;
      }
    } else {
      localStorage.setItem('bookmark-password', newPassword);
      return true;
    }
  }, [isCloudMode]);

  // 上传文件
  const uploadFile = useCallback(async (file: File): Promise<string> => {
    if (isCloudMode && isAuthenticated) {
      try {
        const result = await api.uploadFile(file);
        return result.url;
      } catch (error) {
        console.error('上传文件失败:', error);
        // 回退到 base64
      }
    }
    
    // 本地模式或上传失败，使用 base64
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }, [isCloudMode, isAuthenticated]);

  // 重置主题
  const resetTheme = useCallback(() => {
    const resetSettings = defaultTheme || defaultLightTheme;
    setTheme(resetSettings);
    localStorage.setItem('bookmark-theme', JSON.stringify(resetSettings));
    localStorage.removeItem('bookmark-user-theme');
  }, [defaultTheme]);

  return {
    categories,
    items,
    theme,
    defaultTheme,
    isAuthenticated,
    isLoading,
    isCloudMode,
    setCategories: saveCategories,
    setItems: saveItems,
    setTheme: saveTheme,
    setDefaultTheme: saveDefaultTheme,
    login,
    logout,
    changePassword,
    uploadFile,
    resetTheme,
  };
}
