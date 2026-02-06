import { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { v4 as uuidv4 } from 'uuid';
import {
  DndContext,
  DragOverlay,
  pointerWithin,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  DragStartEvent,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  rectSortingStrategy,
} from '@dnd-kit/sortable';
import { Category, BookmarkItem, ItemType, ThemeConfig, UserConfig } from '@/types';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { api, setToken } from '@/services/api';
import { Sidebar } from '@/components/Sidebar';
import { AddItemModal } from '@/components/AddItemModal';
import { ItemCard, DragOverlayCard } from '@/components/ItemCard';
import { NoteViewModal } from '@/components/NoteViewModal';
import { ThemeSettings, DEFAULT_THEME } from '@/components/ThemeSettings';
import { AuthModal } from '@/components/AuthModal';
import { FilePreviewModal } from '@/components/FilePreviewModal';
import { Plus, Search, Globe, FileText, File, LayoutGrid, List, FolderOpen, Palette, Menu, Lock, LogIn } from 'lucide-react';
import { cn } from '@/utils/cn';
import ConfirmDialog from './components/ConfirmDialog';

// 默认用户配置
const DEFAULT_USER_CONFIG: UserConfig = {
  isAdmin: false,
  adminPassword: 'admin',
};

// 默认示例数据
const defaultCategories: Category[] = [
  { id: 'cat-1', name: '开发工具', parentId: null, order: 0 },
  { id: 'cat-1-1', name: '前端框架', parentId: 'cat-1', order: 0 },
  { id: 'cat-1-2', name: '后端工具', parentId: 'cat-1', order: 1 },
  { id: 'cat-2', name: '设计资源', parentId: null, order: 1 },
  { id: 'cat-2-1', name: '图标库', parentId: 'cat-2', order: 0 },
  { id: 'cat-2-2', name: '配色方案', parentId: 'cat-2', order: 1 },
  { id: 'cat-3', name: '学习笔记', parentId: null, order: 2 },
  { id: 'cat-4', name: '文档资料', parentId: null, order: 3 },
];

const defaultItems: BookmarkItem[] = [
  {
    id: 'item-1',
    type: 'website',
    title: 'React 官方文档',
    categoryId: 'cat-1-1',
    url: 'https://react.dev',
    createdAt: Date.now() - 86400000 * 3,
    order: 0,
  },
  {
    id: 'item-2',
    type: 'website',
    title: 'Vue.js 官方文档',
    categoryId: 'cat-1-1',
    url: 'https://vuejs.org',
    createdAt: Date.now() - 86400000 * 2,
    order: 1,
  },
  {
    id: 'item-3',
    type: 'website',
    title: 'Tailwind CSS',
    categoryId: 'cat-1-1',
    url: 'https://tailwindcss.com',
    createdAt: Date.now() - 86400000,
    order: 2,
  },
  {
    id: 'item-4',
    type: 'note',
    title: 'React Hooks 使用心得',
    categoryId: 'cat-3',
    content: 'useState 和 useEffect 是最常用的两个 Hook。\n\nuseState 用于管理组件状态，useEffect 用于处理副作用。\n\n记得在 useEffect 中正确处理清理函数，避免内存泄漏。',
    createdAt: Date.now() - 86400000 * 5,
    order: 0,
  },
  {
    id: 'item-5',
    type: 'website',
    title: 'Lucide Icons',
    categoryId: 'cat-2-1',
    url: 'https://lucide.dev',
    createdAt: Date.now() - 86400000 * 4,
    order: 0,
  },
  {
    id: 'item-6',
    type: 'note',
    title: 'CSS Grid 布局笔记',
    categoryId: 'cat-3',
    content: 'Grid 布局的基本概念：\n\n1. grid-template-columns: 定义列\n2. grid-template-rows: 定义行\n3. gap: 定义间距\n4. grid-area: 定义区域',
    createdAt: Date.now() - 86400000 * 6,
    order: 1,
  },
];

export function App() {
  const [categories, setCategories] = useLocalStorage<Category[]>('bookmark-categories', defaultCategories);
  const [items, setItems] = useLocalStorage<BookmarkItem[]>('bookmark-items', defaultItems);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewingNote, setViewingNote] = useState<BookmarkItem | null>(null);
  const [viewingFile, setViewingFile] = useState<BookmarkItem | null>(null);
  const [typeFilter, setTypeFilter] = useState<ItemType | 'all'>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [activeItem, setActiveItem] = useState<BookmarkItem | null>(null);
  const [itemDragOffset, setItemDragOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isThemeSettingsOpen, setIsThemeSettingsOpen] = useState(false);
  const [themeConfig, setThemeConfig] = useLocalStorage<ThemeConfig>('bookmark-theme', DEFAULT_THEME);
  const [defaultThemeConfig, setDefaultThemeConfig] = useLocalStorage<ThemeConfig>('bookmark-default-theme', DEFAULT_THEME);
  const [deleteItemConfirm, setDeleteItemConfirm] = useState<{ id: string; title: string } | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [systemDarkMode, setSystemDarkMode] = useState(false);
  const [userConfig, setUserConfig] = useLocalStorage<UserConfig>('bookmark-user-config', DEFAULT_USER_CONFIG);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authToken, setAuthToken] = useState<string | null>(null);
  const [isCloudAvailable, setIsCloudAvailable] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // 从云端加载数据
  useEffect(() => {
    const loadFromCloud = async () => {
      try {
        // 先检测云端是否可用
        const isAvailable = await api.ping();
        setIsCloudAvailable(isAvailable);
        
        if (isAvailable) {
          // 云端可用,加载数据
          const data = await api.getData();
          if (data) {
            if (data.categories && data.categories.length > 0) {
              setCategories(data.categories);
            }
            if (data.items && data.items.length > 0) {
              setItems(data.items);
            }
            if (data.defaultTheme) {
              setDefaultThemeConfig(data.defaultTheme);
            }
          }
        } else {
          console.log('Cloud storage not available, using local storage');
        }
      } catch (error) {
        console.log('Cloud storage error, using local storage:', error);
        setIsCloudAvailable(false);
      } finally {
        setIsLoading(false);
      }
    };
    loadFromCloud();
  }, []);

  // 防抖保存到云端
  const saveToCloud = useCallback((newCategories: Category[], newItems: BookmarkItem[]) => {
    if (!isCloudAvailable || !authToken) {
      console.log('Cannot save to cloud:', { isCloudAvailable, hasToken: !!authToken });
      return;
    }
    
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
    
    saveTimeoutRef.current = setTimeout(async () => {
      try {
        console.log('Saving to cloud...', { categories: newCategories.length, items: newItems.length });
        await Promise.all([
          api.saveCategories(newCategories),
          api.saveItems(newItems),
        ]);
        console.log('Saved to cloud successfully');
      } catch (error) {
        console.error('Failed to save to cloud:', error);
      }
    }, 500); // 减少延迟到 500ms
  }, [isCloudAvailable, authToken]);

  // 是否有编辑权限
  const canEdit = isLoggedIn;

  // 处理登录 - 使用云端 API 验证
  const handleLogin = async (password: string): Promise<boolean> => {
    try {
      // 优先使用云端验证
      if (isCloudAvailable) {
        const result = await api.login(password);
        if (result.success) {
          setIsLoggedIn(true);
          setAuthToken(result.token);
          setToken(result.token); // 同步到 api 服务
          return true;
        }
        return false;
      } else {
        // 本地验证
        if (password === userConfig.adminPassword) {
          setIsLoggedIn(true);
          setAuthToken(password);
          setToken(password); // 同步到 api 服务
          return true;
        }
        return false;
      }
    } catch (error) {
      // 如果云端验证失败，尝试本地验证
      if (password === userConfig.adminPassword) {
        setIsLoggedIn(true);
        setAuthToken(password);
        setToken(password); // 同步到 api 服务
        return true;
      }
      return false;
    }
  };

  // 处理登出
  const handleLogout = () => {
    setIsLoggedIn(false);
    setAuthToken(null);
    setToken(null); // 清除 api 服务的 token
  };

  // 修改密码 - 使用云端 API
  const handleChangePassword = async (oldPassword: string, newPassword: string): Promise<boolean> => {
    try {
      // 优先验证当前密码
      if (isCloudAvailable && authToken) {
        if (oldPassword !== authToken) {
          return false;
        }
        // 调用云端 API 修改密码
        await api.changePassword(newPassword);
        setAuthToken(newPassword);
        setToken(newPassword); // 同步到 api 服务
        return true;
      } else {
        // 本地修改密码
        if (oldPassword === userConfig.adminPassword) {
          setUserConfig({ ...userConfig, adminPassword: newPassword });
          setAuthToken(newPassword);
          setToken(newPassword); // 同步到 api 服务
          return true;
        }
        return false;
      }
    } catch (error) {
      console.error('Change password error:', error);
      return false;
    }
  };

  // 监听系统主题变化
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    setSystemDarkMode(mediaQuery.matches);

    const handler = (e: MediaQueryListEvent) => setSystemDarkMode(e.matches);
    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, []);

  // 计算实际使用的主题模式
  const effectiveMode = useMemo(() => {
    if (themeConfig.mode === 'system') {
      return systemDarkMode ? 'dark' : 'light';
    }
    return themeConfig.mode;
  }, [themeConfig.mode, systemDarkMode]);

  // 获取当前背景配置
  const currentBackground = effectiveMode === 'dark' ? themeConfig.darkBackground : themeConfig.lightBackground;
  const isDark = effectiveMode === 'dark';

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 200,
        tolerance: 5,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // 获取选中分类及其所有子分类的ID
  const getDescendantCategoryIds = (categoryId: string): string[] => {
    const descendants: string[] = [categoryId];
    const children = categories.filter(c => c.parentId === categoryId);
    children.forEach(child => {
      descendants.push(...getDescendantCategoryIds(child.id));
    });
    return descendants;
  };

  // 过滤显示的项目
  const filteredItems = useMemo(() => {
    let result = items;

    // 按分类过滤
    if (selectedCategoryId) {
      const categoryIds = getDescendantCategoryIds(selectedCategoryId);
      result = result.filter(item => categoryIds.includes(item.categoryId));
    }

    // 按类型过滤
    if (typeFilter !== 'all') {
      result = result.filter(item => item.type === typeFilter);
    }

    // 按搜索词过滤
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(item =>
        item.title.toLowerCase().includes(query) ||
        item.url?.toLowerCase().includes(query) ||
        item.content?.toLowerCase().includes(query) ||
        item.fileName?.toLowerCase().includes(query)
      );
    }

    // 按 order 排序
    return result.sort((a, b) => a.order - b.order);
  }, [items, selectedCategoryId, typeFilter, searchQuery, categories]);

  // 添加分类
  const handleAddCategory = (name: string, parentId: string | null) => {
    const newCategory: Category = {
      id: uuidv4(),
      name,
      parentId,
      order: categories.filter(c => c.parentId === parentId).length,
    };
    const newCategories = [...categories, newCategory];
    setCategories(newCategories);
    saveToCloud(newCategories, items);
  };

  // 删除分类
  const handleDeleteCategory = (id: string) => {
    const idsToDelete = getDescendantCategoryIds(id);
    const newCategories = categories.filter(c => !idsToDelete.includes(c.id));
    const newItems = items.filter(item => !idsToDelete.includes(item.categoryId));
    setCategories(newCategories);
    setItems(newItems);
    if (selectedCategoryId && idsToDelete.includes(selectedCategoryId)) {
      setSelectedCategoryId(null);
    }
    saveToCloud(newCategories, newItems);
  };

  // 编辑分类
  const handleEditCategory = (id: string, name: string) => {
    const newCategories = categories.map(c => c.id === id ? { ...c, name } : c);
    setCategories(newCategories);
    saveToCloud(newCategories, items);
  };

  // 移动分类到新位置
  const handleMoveCategory = (categoryId: string, newParentId: string | null, newOrder: number) => {
    const movedCategory = categories.find(c => c.id === categoryId);
    if (!movedCategory) return;

    // 获取目标位置的同级分类
    const siblings = categories
      .filter(c => c.parentId === newParentId && c.id !== categoryId)
      .sort((a, b) => a.order - b.order);

    // 在指定位置插入
    siblings.splice(newOrder, 0, movedCategory);

    // 更新所有分类的 order 和 parentId
    const updatedCategories = categories.map(cat => {
      if (cat.id === categoryId) {
        return { ...cat, parentId: newParentId, order: newOrder };
      }
      const siblingIndex = siblings.findIndex(s => s.id === cat.id);
      if (siblingIndex !== -1) {
        return { ...cat, order: siblingIndex };
      }
      return cat;
    });

    setCategories(updatedCategories);
    saveToCloud(updatedCategories, items);
  };

  // 添加项目
  const handleAddItem = (itemData: {
    type: ItemType;
    title: string;
    categoryId: string;
    url?: string;
    content?: string;
    fileName?: string;
    fileType?: string;
    fileData?: string;
    fileId?: string;
  }) => {
    // 不保存 fileData 到 items 中（文件数据已存储在 IndexedDB）
    const { fileData: _, ...itemWithoutFileData } = itemData;
    const newItem: BookmarkItem = {
      id: uuidv4(),
      ...itemWithoutFileData,
      createdAt: Date.now(),
      order: items.filter(i => i.categoryId === itemData.categoryId).length,
    };
    const newItems = [...items, newItem];
    setItems(newItems);
    saveToCloud(categories, newItems);
  };

  // 删除项目
  const handleDeleteItem = (id: string) => {
    const newItems = items.filter(item => item.id !== id);
    setItems(newItems);
    saveToCloud(categories, newItems);
  };

  // 获取分类名称
  const getCategoryById = (id: string) => categories.find(c => c.id === id);

  // 获取当前分类的路径
  const getCategoryPath = (categoryId: string | null): Category[] => {
    if (!categoryId) return [];
    const path: Category[] = [];
    let current = getCategoryById(categoryId);
    while (current) {
      path.unshift(current);
      current = current.parentId ? getCategoryById(current.parentId) : undefined;
    }
    return path;
  };

  const categoryPath = getCategoryPath(selectedCategoryId);

  // 统计数据
  const stats = useMemo(() => ({
    total: items.length,
    websites: items.filter(i => i.type === 'website').length,
    notes: items.filter(i => i.type === 'note').length,
    files: items.filter(i => i.type === 'file').length,
  }), [items]);

  // 拖拽开始
  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const item = filteredItems.find(i => i.id === active.id);
    if (item) {
      setActiveItem(item);
      // 计算鼠标相对于拖拽元素的偏移量
      const activeRect = active.rect.current.initial;
      if (activeRect && event.activatorEvent instanceof PointerEvent) {
        const offsetX = event.activatorEvent.clientX - activeRect.left;
        const offsetY = event.activatorEvent.clientY - activeRect.top;
        setItemDragOffset({ x: offsetX, y: offsetY });
      }
    }
  };

  // 拖拽结束
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveItem(null);

    if (over && active.id !== over.id) {
      const oldIndex = filteredItems.findIndex(i => i.id === active.id);
      const newIndex = filteredItems.findIndex(i => i.id === over.id);

      if (oldIndex !== -1 && newIndex !== -1) {
        const newFilteredItems = [...filteredItems];
        const [movedItem] = newFilteredItems.splice(oldIndex, 1);
        newFilteredItems.splice(newIndex, 0, movedItem);

        // 更新 order
        const updatedItems = items.map(item => {
          const index = newFilteredItems.findIndex(i => i.id === item.id);
          if (index !== -1) {
            return { ...item, order: index };
          }
          return item;
        });

        setItems(updatedItems);
        saveToCloud(categories, updatedItems);
      }
    }
  };

  // 生成背景样式
  const getBackgroundStyle = (): React.CSSProperties => {
    if (currentBackground.type === 'image' && currentBackground.value) {
      return {};
    } else if (currentBackground.type === 'gradient') {
      return { background: currentBackground.value };
    } else if (currentBackground.type === 'solid') {
      return { backgroundColor: currentBackground.value };
    }
    return { background: effectiveMode === 'dark' ? DEFAULT_THEME.darkBackground.value : DEFAULT_THEME.lightBackground.value };
  };

  // 重置主题
  const handleResetTheme = () => {
    setThemeConfig(DEFAULT_THEME);
  };

  // 设为默认主题（访客可见）- 保存到云端
  const handleSetAsDefaultTheme = async () => {
    setDefaultThemeConfig(themeConfig);
    
    // 保存到云端
    if (isCloudAvailable && authToken) {
      try {
        await api.saveDefaultTheme(themeConfig);
      } catch (error) {
        console.error('Failed to save default theme:', error);
      }
    }
  };

  // 检查当前主题是否与默认主题相同
  const isDefaultTheme = JSON.stringify(themeConfig) === JSON.stringify(defaultThemeConfig);

  // 未登录用户使用默认主题
  useEffect(() => {
    if (!isLoggedIn) {
      // 当用户未登录时，使用管理员设置的默认主题
      const savedPersonalTheme = localStorage.getItem('bookmark-theme-personal');
      if (!savedPersonalTheme) {
        setThemeConfig(defaultThemeConfig);
      }
    }
  }, [isLoggedIn, defaultThemeConfig]);

  // 选择分类时关闭侧边栏（移动端）
  const handleSelectCategory = (id: string | null) => {
    setSelectedCategoryId(id);
    setIsSidebarOpen(false);
  };

  // 显示加载状态
  if (isLoading) {
    return (
      <div 
        className={cn(
          "flex h-screen items-center justify-center",
          isDark ? "bg-gray-900 text-white" : "bg-gray-100 text-gray-900"
        )}
        style={getBackgroundStyle()}
      >
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-gray-500">加载中...</p>
        </div>
      </div>
    );
  }

  return (
    <div 
      className={cn(
        "flex h-screen relative overflow-hidden",
        isDark ? "text-white" : "text-gray-900"
      )}
      style={getBackgroundStyle()}
    >
      {/* 背景图片层 */}
      {currentBackground.type === 'image' && currentBackground.value && (
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{
            backgroundImage: `url(${currentBackground.value})`,
            filter: `blur(${currentBackground.blur ?? 0}px)`,
            opacity: (currentBackground.opacity ?? 100) / 100,
            transform: 'scale(1.1)',
          }}
        />
      )}
      
      {/* 内容层 */}
      <div className="flex w-full h-full relative z-10">
        {/* 侧边栏 */}
        <div className={cn(
          "fixed lg:relative h-full transition-transform duration-300 ease-out w-72 sm:w-80",
          isSidebarOpen ? "translate-x-0 z-50" : "-translate-x-full lg:translate-x-0 z-40"
        )}>
          <Sidebar
            categories={categories}
            selectedCategoryId={selectedCategoryId}
            onSelectCategory={handleSelectCategory}
            onAddCategory={handleAddCategory}
            onDeleteCategory={handleDeleteCategory}
            onEditCategory={handleEditCategory}
            onMoveCategory={handleMoveCategory}
            onClose={() => setIsSidebarOpen(false)}
            isDark={isDark}
            canEdit={canEdit}
          />
        </div>

        {/* 主内容区 */}
        <div className="flex-1 flex flex-col overflow-hidden relative">
          {/* 移动端遮罩层 */}
          {isSidebarOpen && (
            <div 
              className="absolute inset-0 bg-black/40 z-40 lg:hidden"
              onClick={() => setIsSidebarOpen(false)}
            />
          )}
          
          {/* 顶部工具栏 */}
          <div className={cn(
            "backdrop-blur-xl border-b p-3 sm:p-4 shadow-lg",
            isDark 
              ? "bg-gray-900/40 border-white/10" 
              : "bg-white/35 border-white/30"
          )}>
            {/* 第一行：面包屑和按钮 */}
            <div className="flex items-center justify-between gap-2 sm:gap-4">
              {/* 左侧：汉堡菜单和面包屑 */}
              <div className="flex items-center gap-2 flex-1 min-w-0">
                {/* 汉堡菜单按钮 */}
                <button
                  onClick={() => setIsSidebarOpen(true)}
                  className={cn(
                    "lg:hidden p-2 rounded-xl transition-colors flex-shrink-0",
                    isDark ? "hover:bg-white/10" : "hover:bg-white/40"
                  )}
                >
                  <Menu className="w-5 h-5" />
                </button>

                {/* 面包屑 */}
                <div className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm min-w-0 overflow-x-auto scrollbar-hide">
                  <button
                    onClick={() => handleSelectCategory(null)}
                    className={cn(
                      "whitespace-nowrap flex-shrink-0 font-medium px-2 py-1 rounded-lg",
                      "transition-all duration-200",
                      isDark 
                        ? "text-gray-400 hover:text-white hover:bg-white/10" 
                        : "text-gray-500 hover:text-gray-700 hover:bg-black/5"
                    )}
                  >
                    全部
                  </button>
                  {categoryPath.map((cat, index) => (
                    <span key={cat.id} className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
                      <span className={cn(
                        "text-[10px]",
                        isDark ? "text-gray-600" : "text-gray-300"
                      )}>/</span>
                      <button
                        onClick={() => handleSelectCategory(cat.id)}
                        className={cn(
                          "whitespace-nowrap px-2 py-1 rounded-lg tracking-wide",
                          "transition-all duration-200",
                          index === categoryPath.length - 1
                            ? isDark 
                              ? "text-white font-semibold bg-white/10" 
                              : "text-gray-900 font-semibold bg-black/5"
                            : isDark 
                              ? "text-gray-400 hover:text-white hover:bg-white/10" 
                              : "text-gray-500 hover:text-gray-700 hover:bg-black/5"
                        )}
                      >
                        {cat.name}
                      </button>
                    </span>
                  ))}
                </div>
              </div>

              {/* 右侧按钮组 */}
              <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
                {/* 登录/用户按钮 */}
                <button
                  onClick={() => setIsAuthModalOpen(true)}
                  className={cn(
                    "p-2.5 sm:px-3.5 sm:py-2.5 backdrop-blur-sm rounded-xl border btn-press",
                    "transition-all duration-200",
                    isLoggedIn
                      ? isDark
                        ? "bg-green-500/20 text-green-400 border-green-500/30 hover:bg-green-500/30"
                        : "bg-green-50 text-green-600 border-green-200 hover:bg-green-100"
                      : isDark 
                        ? "bg-white/10 text-gray-300 border-white/10 hover:bg-white/20 hover:border-white/20" 
                        : "bg-white/40 text-gray-600 border-white/30 hover:bg-white/60 hover:text-gray-800"
                  )}
                  title={isLoggedIn ? "管理员已登录" : "登录管理"}
                >
                  {isLoggedIn ? <Lock className="w-4 h-4" /> : <LogIn className="w-4 h-4" />}
                </button>

                {/* 主题设置按钮 */}
                <button
                  onClick={() => setIsThemeSettingsOpen(true)}
                  className={cn(
                    "p-2.5 sm:px-3.5 sm:py-2.5 backdrop-blur-sm rounded-xl border btn-press",
                    "transition-all duration-200",
                    isDark 
                      ? "bg-white/10 text-gray-300 border-white/10 hover:bg-white/20 hover:border-white/20" 
                      : "bg-white/40 text-gray-600 border-white/30 hover:bg-white/60 hover:text-gray-800"
                  )}
                  title="主题设置"
                >
                  <Palette className="w-4 h-4" />
                </button>

                {/* 添加按钮 - 仅管理员可见 */}
                {canEdit && (
                  <button
                    onClick={() => setIsAddModalOpen(true)}
                    className={cn(
                      "flex items-center gap-1.5 sm:gap-2 px-3.5 sm:px-5 py-2.5 rounded-xl font-medium btn-press",
                      "bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-white",
                      "hover:from-indigo-600 hover:via-purple-600 hover:to-pink-600",
                      "transition-all duration-200",
                      "shadow-lg shadow-purple-500/25 hover:shadow-purple-500/40 hover:scale-[1.02]"
                    )}
                  >
                    <Plus className="w-4 h-4" />
                    <span className="hidden sm:inline tracking-wide">添加</span>
                  </button>
                )}
              </div>
            </div>

            {/* 第二行：搜索和过滤 */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-4 mt-3">
              {/* 搜索框 */}
              <div className="flex-1 relative group">
                <Search className={cn(
                  "absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4",
                  "transition-colors duration-200",
                  isDark ? "text-gray-500 group-focus-within:text-indigo-400" : "text-gray-400 group-focus-within:text-indigo-500"
                )} />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="搜索收藏..."
                  className={cn(
                    "w-full pl-10 pr-4 py-2.5 backdrop-blur-sm border rounded-xl text-sm tracking-wide",
                    "transition-all duration-200",
                    "focus:outline-none focus:ring-2 focus:ring-indigo-500/40",
                    isDark 
                      ? "bg-white/10 border-white/10 text-white placeholder-gray-500 focus:bg-white/15 focus:border-indigo-400/30" 
                      : "bg-white/40 border-white/30 placeholder-gray-400 focus:bg-white/60 focus:border-indigo-300/50"
                  )}
                />
              </div>

              {/* 过滤和视图切换 */}
              <div className="flex items-center gap-2">
                {/* 类型过滤 */}
                <div className={cn(
                  "flex items-center gap-0.5 sm:gap-1 backdrop-blur-sm rounded-xl p-1 border flex-1 sm:flex-none overflow-x-auto",
                  isDark ? "bg-white/10 border-white/10" : "bg-white/40 border-white/30"
                )}>
                  {[
                    { type: 'all' as const, label: '全部', count: stats.total },
                    { type: 'website' as ItemType, icon: Globe, label: '网站', count: stats.websites },
                    { type: 'note' as ItemType, icon: FileText, label: '笔记', count: stats.notes },
                    { type: 'file' as ItemType, icon: File, label: '文件', count: stats.files },
                  ].map(({ type, icon: Icon, label, count }) => (
                    <button
                      key={type}
                      onClick={() => setTypeFilter(type)}
                      className={cn(
                        "flex items-center justify-center gap-1 px-2.5 sm:px-3 py-1.5 rounded-lg text-xs sm:text-sm flex-1 sm:flex-none whitespace-nowrap",
                        "transition-all duration-200 btn-press",
                        typeFilter === type
                          ? isDark 
                            ? "bg-white/20 text-white shadow-md" 
                            : "bg-white/70 text-gray-900 shadow-md backdrop-blur-sm"
                          : isDark
                            ? "text-gray-400 hover:text-white hover:bg-white/10"
                            : "text-gray-500 hover:text-gray-800 hover:bg-white/50"
                      )}
                    >
                      {Icon && <Icon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />}
                      <span className="hidden sm:inline font-medium">{label}</span>
                      <span className={cn(
                        "text-[10px] font-medium",
                        typeFilter === type
                          ? isDark ? "text-gray-300" : "text-gray-500"
                          : isDark ? "text-gray-500" : "text-gray-400"
                      )}>{count}</span>
                    </button>
                  ))}
                </div>

                {/* 视图切换 */}
                <div className={cn(
                  "flex items-center gap-0.5 backdrop-blur-sm rounded-xl p-1 border",
                  isDark ? "bg-white/10 border-white/10" : "bg-white/40 border-white/30"
                )}>
                  <button
                    onClick={() => setViewMode('grid')}
                    className={cn(
                      "p-2 rounded-lg btn-press",
                      "transition-all duration-200",
                      viewMode === 'grid' 
                        ? isDark 
                          ? "bg-white/20 shadow-md text-white" 
                          : "bg-white/70 shadow-md backdrop-blur-sm text-gray-800" 
                        : isDark 
                          ? "hover:bg-white/10 text-gray-400" 
                          : "hover:bg-white/50 text-gray-500"
                    )}
                  >
                    <LayoutGrid className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setViewMode('list')}
                    className={cn(
                      "p-2 rounded-lg btn-press",
                      "transition-all duration-200",
                      viewMode === 'list' 
                        ? isDark 
                          ? "bg-white/20 shadow-md text-white" 
                          : "bg-white/70 shadow-md backdrop-blur-sm text-gray-800" 
                        : isDark 
                          ? "hover:bg-white/10 text-gray-400" 
                          : "hover:bg-white/50 text-gray-500"
                    )}
                  >
                    <List className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* 内容区 */}
          <div className="flex-1 overflow-y-auto p-3 sm:p-6">
            {filteredItems.length > 0 ? (
              <DndContext
                sensors={sensors}
                collisionDetection={pointerWithin}
                onDragStart={handleDragStart}
                onDragEnd={handleDragEnd}
              >
                <SortableContext
                  items={filteredItems.map(i => i.id)}
                  strategy={rectSortingStrategy}
                >
                  <div className={cn(
                    viewMode === 'grid'
                      ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4"
                      : "flex flex-col gap-2 sm:gap-3"
                  )}>
                    {filteredItems.map(item => (
                      <ItemCard
                        key={item.id}
                        item={item}
                        category={getCategoryById(item.categoryId)}
                        onDelete={(id) => {
                          const itemToDelete = items.find(i => i.id === id);
                          if (itemToDelete) {
                            setDeleteItemConfirm({ id, title: itemToDelete.title });
                          }
                        }}
                        onView={(item) => {
                          if (item.type === 'note') {
                            setViewingNote(item);
                          } else if (item.type === 'file') {
                            setViewingFile(item);
                          }
                        }}
                        isDark={isDark}
                        canEdit={canEdit}
                      />
                    ))}
                  </div>
                </SortableContext>
                <DragOverlay 
                  dropAnimation={null}
                  modifiers={[
                    ({ transform }) => {
                      return {
                        ...transform,
                        x: transform.x - itemDragOffset.x + 10,
                        y: transform.y - itemDragOffset.y + 10,
                      };
                    }
                  ]}
                >
                  {activeItem ? (
                    <DragOverlayCard
                      item={activeItem}
                      category={getCategoryById(activeItem.categoryId)}
                      isDark={isDark}
                    />
                  ) : null}
                </DragOverlay>
              </DndContext>
            ) : (
              <div className={cn(
                "flex flex-col items-center justify-center h-full px-4 animate-fade-in",
                isDark ? "text-gray-400" : "text-gray-500"
              )}>
                <div className={cn(
                  "w-24 h-24 sm:w-28 sm:h-28 backdrop-blur-xl rounded-3xl flex items-center justify-center mb-6 shadow-xl border",
                  isDark 
                    ? "bg-white/10 border-white/10" 
                    : "bg-white/40 border-white/40"
                )}>
                  <FolderOpen className={cn(
                    "w-12 h-12 sm:w-14 sm:h-14",
                    isDark ? "text-gray-500" : "text-gray-300"
                  )} />
                </div>
                <p className={cn(
                  "text-lg sm:text-xl font-semibold text-center tracking-tight",
                  isDark ? "text-gray-300" : "text-gray-600"
                )}>暂无收藏</p>
                <p className={cn(
                  "text-sm mt-2 text-center",
                  isDark ? "text-gray-500" : "text-gray-400"
                )}>点击右上角的「添加」按钮开始添加</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 添加项目模态框 */}
      <AddItemModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onAdd={handleAddItem}
        categories={categories}
        defaultCategoryId={selectedCategoryId}
        isDark={isDark}
      />

      {/* 笔记查看模态框 */}
      <NoteViewModal
        item={viewingNote}
        onClose={() => setViewingNote(null)}
        isDark={isDark}
      />

      {/* 文件预览模态框 */}
      <FilePreviewModal
        isOpen={!!viewingFile}
        onClose={() => setViewingFile(null)}
        fileName={viewingFile?.fileName || ''}
        fileData={viewingFile?.fileData}
        fileId={viewingFile?.fileId}
        isDark={isDark}
      />

      {/* 主题设置模态框 */}
      <ThemeSettings
        isOpen={isThemeSettingsOpen}
        onClose={() => setIsThemeSettingsOpen(false)}
        config={themeConfig}
        onChange={setThemeConfig}
        onReset={handleResetTheme}
        effectiveMode={effectiveMode}
        canEdit={canEdit}
        onSetAsDefault={handleSetAsDefaultTheme}
        isDefaultTheme={isDefaultTheme}
      />

      {/* 删除收藏项确认对话框 */}
      <ConfirmDialog
        isOpen={!!deleteItemConfirm}
        title="删除收藏"
        message={`确定要删除「${deleteItemConfirm?.title}」吗？此操作无法撤销。`}
        confirmText="删除"
        cancelText="取消"
        type="danger"
        onConfirm={() => {
          if (deleteItemConfirm) {
            handleDeleteItem(deleteItemConfirm.id);
            setDeleteItemConfirm(null);
          }
        }}
        onCancel={() => setDeleteItemConfirm(null)}
        isDark={isDark}
      />

      {/* 登录管理模态框 */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        isLoggedIn={isLoggedIn}
        onLogin={handleLogin}
        onLogout={handleLogout}
        onChangePassword={handleChangePassword}
        isDark={isDark}
      />
    </div>
  );
}
