import React, { useState, useRef, useEffect, useMemo } from 'react';
import { cn } from '../utils/cn';
import type { Category } from '../types';

interface CategorySelectorProps {
  categories: Category[];
  selectedId: string;
  onChange: (id: string) => void;
  isDark: boolean;
  placeholder?: string;
}

interface FlatCategory {
  category: Category;
  level: number;
  path: string[];
}

export function CategorySelector({
  categories,
  selectedId,
  onChange,
  isDark,
  placeholder = '选择分类'
}: CategorySelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [highlightIndex, setHighlightIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // 构建扁平化的分类列表，包含层级信息
  const flatCategories = useMemo(() => {
    const result: FlatCategory[] = [];
    
    // 根据 parentId 构建树形结构
    const buildTree = (parentId: string | null, level: number, path: string[]) => {
      const children = categories
        .filter(cat => cat.parentId === parentId)
        .sort((a, b) => a.order - b.order);
      
      children.forEach(cat => {
        const currentPath = [...path, cat.name];
        result.push({ category: cat, level, path: currentPath });
        buildTree(cat.id, level + 1, currentPath);
      });
    };
    
    buildTree(null, 0, []);
    return result;
  }, [categories]);

  // 过滤分类
  const filteredCategories = useMemo(() => {
    if (!search.trim()) return flatCategories;
    const searchLower = search.toLowerCase();
    return flatCategories.filter(item => 
      item.category.name.toLowerCase().includes(searchLower) ||
      item.path.join('/').toLowerCase().includes(searchLower)
    );
  }, [flatCategories, search]);

  // 获取选中分类的显示文本
  const selectedDisplay = useMemo(() => {
    const found = flatCategories.find(item => item.category.id === selectedId);
    if (!found) return placeholder;
    return found.path.join(' / ');
  }, [flatCategories, selectedId, placeholder]);

  // 点击外部关闭
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
        setSearch('');
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // 打开时聚焦搜索框
  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isOpen]);

  // 滚动到高亮项
  useEffect(() => {
    if (highlightIndex >= 0 && listRef.current) {
      const items = listRef.current.querySelectorAll('[data-category-item]');
      if (items[highlightIndex]) {
        items[highlightIndex].scrollIntoView({ block: 'nearest' });
      }
    }
  }, [highlightIndex]);

  // 键盘导航
  const handleKeyDown = (e: React.KeyboardEvent) => {
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setHighlightIndex(prev => 
          prev < filteredCategories.length - 1 ? prev + 1 : 0
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setHighlightIndex(prev => 
          prev > 0 ? prev - 1 : filteredCategories.length - 1
        );
        break;
      case 'Enter':
        e.preventDefault();
        if (highlightIndex >= 0 && filteredCategories[highlightIndex]) {
          handleSelect(filteredCategories[highlightIndex].category.id);
        }
        break;
      case 'Escape':
        setIsOpen(false);
        setSearch('');
        break;
    }
  };

  const handleSelect = (id: string) => {
    onChange(id);
    setIsOpen(false);
    setSearch('');
    setHighlightIndex(-1);
  };

  const handleToggle = () => {
    setIsOpen(!isOpen);
    if (!isOpen) {
      setHighlightIndex(-1);
    }
  };

  // 获取分类图标
  const getCategoryIcon = (level: number) => {
    const icons = ['📁', '📂', '📄', '📋', '📝'];
    return icons[Math.min(level, icons.length - 1)];
  };

  return (
    <div ref={containerRef} className="relative">
      {/* 选择按钮 */}
      <button
        type="button"
        onClick={handleToggle}
        className={cn(
          "w-full px-4 py-3 rounded-xl text-left transition-all duration-200",
          "flex items-center justify-between gap-2",
          "border-2 focus:outline-none",
          isDark
            ? "bg-white/10 border-white/20 text-white hover:bg-white/15 focus:border-indigo-400"
            : "bg-white/50 border-gray-200 text-gray-800 hover:bg-white/70 focus:border-indigo-500",
          isOpen && (isDark ? "border-indigo-400" : "border-indigo-500")
        )}
      >
        <span className={cn(
          "truncate flex-1",
          !selectedId && (isDark ? "text-gray-400" : "text-gray-500")
        )}>
          {selectedDisplay}
        </span>
        <svg
          className={cn(
            "w-5 h-5 transition-transform duration-200 flex-shrink-0",
            isDark ? "text-gray-400" : "text-gray-500",
            isOpen && "rotate-180"
          )}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* 下拉列表 */}
      {isOpen && (
        <div
          className={cn(
            "absolute z-50 mt-2 w-full rounded-xl overflow-hidden",
            "border shadow-2xl backdrop-blur-xl",
            "animate-in fade-in-0 zoom-in-95 duration-150",
            isDark
              ? "bg-gray-800/95 border-white/20"
              : "bg-white/95 border-gray-200"
          )}
          style={{ maxHeight: '320px' }}
        >
          {/* 搜索框 */}
          <div className={cn(
            "p-2 border-b",
            isDark ? "border-white/10" : "border-gray-100"
          )}>
            <div className="relative">
              <svg
                className={cn(
                  "absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4",
                  isDark ? "text-gray-400" : "text-gray-500"
                )}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                ref={searchInputRef}
                type="text"
                value={search}
                onChange={e => {
                  setSearch(e.target.value);
                  setHighlightIndex(0);
                }}
                onKeyDown={handleKeyDown}
                placeholder="搜索分类..."
                className={cn(
                  "w-full pl-9 pr-3 py-2 rounded-lg text-sm",
                  "focus:outline-none focus:ring-2",
                  isDark
                    ? "bg-white/10 text-white placeholder-gray-400 focus:ring-indigo-400/50"
                    : "bg-gray-100 text-gray-800 placeholder-gray-500 focus:ring-indigo-500/50"
                )}
              />
            </div>
          </div>

          {/* 分类列表 */}
          <div
            ref={listRef}
            className="overflow-y-auto"
            style={{ maxHeight: '220px' }}
          >
            {/* 未分类选项 */}
            <button
              type="button"
              data-category-item
              onClick={() => handleSelect('')}
              className={cn(
                "w-full px-4 py-2.5 text-left flex items-center gap-2 transition-colors",
                !selectedId && (isDark ? "bg-indigo-500/30" : "bg-indigo-100"),
                isDark
                  ? "text-gray-300 hover:bg-white/10"
                  : "text-gray-700 hover:bg-gray-50"
              )}
            >
              <span className="text-base">📥</span>
              <span className="font-medium">未分类</span>
              {!selectedId && (
                <svg
                  className={cn("w-4 h-4 ml-auto", isDark ? "text-indigo-400" : "text-indigo-600")}
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              )}
            </button>

            {filteredCategories.length === 0 && search ? (
              <div className={cn(
                "px-4 py-8 text-center",
                isDark ? "text-gray-400" : "text-gray-500"
              )}>
                <svg className="w-12 h-12 mx-auto mb-2 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-sm">没有找到匹配的分类</p>
              </div>
            ) : (
              filteredCategories.map((item, index) => (
                <button
                  key={item.category.id}
                  type="button"
                  data-category-item
                  onClick={() => handleSelect(item.category.id)}
                  className={cn(
                    "w-full py-2.5 text-left flex items-center gap-2 transition-colors group",
                    selectedId === item.category.id && (isDark ? "bg-indigo-500/30" : "bg-indigo-100"),
                    highlightIndex === index && selectedId !== item.category.id && (isDark ? "bg-white/10" : "bg-gray-100"),
                    isDark
                      ? "text-gray-200 hover:bg-white/10"
                      : "text-gray-700 hover:bg-gray-50"
                  )}
                  style={{ paddingLeft: `${16 + item.level * 16}px`, paddingRight: '16px' }}
                >
                  {/* 层级连接线 */}
                  {item.level > 0 && (
                    <span className={cn(
                      "text-xs font-mono",
                      isDark ? "text-gray-600" : "text-gray-400"
                    )}>
                      └
                    </span>
                  )}
                  
                  {/* 图标 */}
                  <span className="text-base flex-shrink-0">{getCategoryIcon(item.level)}</span>
                  
                  {/* 名称 */}
                  <span className={cn(
                    "flex-1 truncate",
                    selectedId === item.category.id && "font-medium"
                  )}>
                    {item.category.name}
                  </span>
                  
                  {/* 路径提示 */}
                  {item.level > 0 && (
                    <span className={cn(
                      "text-xs truncate max-w-[100px] hidden sm:block",
                      isDark ? "text-gray-500" : "text-gray-400"
                    )}>
                      {item.path.slice(0, -1).join(' / ')}
                    </span>
                  )}
                  
                  {/* 选中标记 */}
                  {selectedId === item.category.id && (
                    <svg
                      className={cn(
                        "w-4 h-4 flex-shrink-0",
                        isDark ? "text-indigo-400" : "text-indigo-600"
                      )}
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  )}
                </button>
              ))
            )}
          </div>

          {/* 底部提示 */}
          <div className={cn(
            "px-3 py-2 border-t text-xs flex items-center justify-between",
            isDark 
              ? "border-white/10 text-gray-500 bg-gray-900/50" 
              : "border-gray-100 text-gray-400 bg-gray-50/50"
          )}>
            <span className="flex items-center gap-1">
              <kbd className={cn(
                "px-1.5 py-0.5 rounded text-[10px]",
                isDark ? "bg-gray-700" : "bg-gray-200"
              )}>↑↓</kbd>
              <span>导航</span>
            </span>
            <span className="flex items-center gap-1">
              <kbd className={cn(
                "px-1.5 py-0.5 rounded text-[10px]",
                isDark ? "bg-gray-700" : "bg-gray-200"
              )}>Enter</kbd>
              <span>选择</span>
            </span>
            <span className="flex items-center gap-1">
              <kbd className={cn(
                "px-1.5 py-0.5 rounded text-[10px]",
                isDark ? "bg-gray-700" : "bg-gray-200"
              )}>Esc</kbd>
              <span>关闭</span>
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
