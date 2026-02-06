import { useState, useCallback } from 'react';
import {
  DndContext,
  pointerWithin,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  DragStartEvent,
  DragEndEvent,
  DragOverEvent,
  MeasuringStrategy,
  useDraggable,
  useDroppable,
} from '@dnd-kit/core';
import { Category } from '@/types';
import { 
  ChevronRight, 
  FolderPlus, 
  Folder, 
  FolderOpen,
  Trash2,
  Edit2,
  Plus,
  Home,
  GripVertical,
  ArrowRight,
  X
} from 'lucide-react';
import { cn } from '@/utils/cn';
import ConfirmDialog from './ConfirmDialog';

interface SidebarProps {
  categories: Category[];
  selectedCategoryId: string | null;
  onSelectCategory: (id: string | null) => void;
  onAddCategory: (name: string, parentId: string | null) => void;
  onDeleteCategory: (id: string) => void;
  onEditCategory: (id: string, name: string) => void;
  onMoveCategory: (categoryId: string, newParentId: string | null, newOrder: number) => void;
  onClose?: () => void;
  isDark?: boolean;
  canEdit?: boolean;
}

interface DropInfo {
  type: 'before' | 'after' | 'inside' | 'root';
  targetId: string;
}

interface DraggableCategoryProps {
  category: Category;
  level: number;
  isSelected: boolean;
  isExpanded: boolean;
  hasChildren: boolean;
  dropInfo: DropInfo | null;
  isDragging: boolean;
  isDropDisabled: boolean;
  onToggle: () => void;
  onSelect: () => void;
  onAddChild: () => void;
  onDelete: () => void;
  onEdit: () => void;
  canEdit?: boolean;
}

function DraggableCategory({
  category,
  level,
  isSelected,
  isExpanded,
  hasChildren,
  dropInfo,
  isDragging,
  isDropDisabled,
  onToggle,
  onSelect,
  onAddChild,
  onDelete,
  onEdit,
  isDark = false,
  canEdit = false,
}: DraggableCategoryProps & { isDark?: boolean }) {
  const {
    attributes,
    listeners,
    setNodeRef: setDragRef,
    transform,
  } = useDraggable({ 
    id: category.id,
  });

  const { setNodeRef: setDropRef } = useDroppable({
    id: category.id,
    disabled: isDropDisabled,
  });

  const style: React.CSSProperties | undefined = transform ? {
    transform: `translate3d(${transform.x}px, ${transform.y - 30}px, 0)`,
    zIndex: 1000,
    position: 'relative',
    transition: 'none',
  } : undefined;

  const isTargetBefore = dropInfo?.targetId === category.id && dropInfo.type === 'before';
  const isTargetAfter = dropInfo?.targetId === category.id && dropInfo.type === 'after';
  const isTargetInside = dropInfo?.targetId === category.id && dropInfo.type === 'inside';

  // 计算缩进：每层 10px，最大缩进 60px（6层）
  const indent = Math.min(level * 10, 60);

  return (
    <div
      ref={(node) => {
        setDragRef(node);
        setDropRef(node);
      }}
      style={style}
      className={cn(
        "relative",
        !isDragging && "transition-all duration-200 ease-out",
        isDragging && "opacity-95 scale-[1.02] shadow-2xl rounded-xl z-50",
        isDropDisabled && "pointer-events-none opacity-25"
      )}
    >
      {/* 顶部放置指示器 */}
      <div 
        className={cn(
          "absolute left-0 right-0 h-0.5 -top-0.5 z-20 rounded-full",
          "transition-all duration-200 ease-out",
          isTargetBefore 
            ? "bg-gradient-to-r from-indigo-400 via-purple-500 to-pink-400 shadow-lg shadow-purple-500/50 opacity-100 scale-x-100" 
            : "opacity-0 scale-x-50"
        )}
        style={{ marginLeft: `${indent + 8}px`, marginRight: '8px' }}
      />

      <div
        className={cn(
          "group flex items-center gap-1.5 py-2.5 sm:py-2 px-2 mx-1 rounded-xl cursor-pointer",
          "transition-all duration-200 ease-out",
          isDragging 
            ? isDark
              ? "bg-gray-800/90 backdrop-blur-xl shadow-2xl border border-white/20 text-white"
              : "bg-white/70 backdrop-blur-xl shadow-2xl border border-white/60 text-gray-800"
            : isSelected 
              ? isDark
                ? "bg-gradient-to-r from-indigo-500/30 to-purple-500/30 text-indigo-300 shadow-md shadow-indigo-500/20 border border-indigo-400/30 backdrop-blur-sm"
                : "bg-gradient-to-r from-indigo-500/25 to-purple-500/25 text-indigo-700 shadow-md shadow-indigo-500/10 border border-indigo-300/30 backdrop-blur-sm" 
              : isDark
                ? "hover:bg-white/10 text-gray-200 active:bg-white/15"
                : "hover:bg-white/40 text-gray-700 active:bg-white/50",
          isTargetInside && !isDragging && (isDark 
            ? "ring-2 ring-indigo-400 ring-offset-2 ring-offset-transparent bg-indigo-900/50 scale-[1.01]"
            : "ring-2 ring-indigo-400 ring-offset-2 ring-offset-transparent bg-indigo-50/50 scale-[1.01]"),
        )}
        style={{ paddingLeft: `${indent + 8}px` }}
        onClick={onSelect}
      >
        {/* 拖拽手柄 - 仅管理员可见 */}
        {canEdit ? (
          <div
            {...attributes}
            {...listeners}
            className={cn(
              "p-1.5 sm:p-1 cursor-grab active:cursor-grabbing rounded-lg touch-none",
              "transition-all duration-200",
              isDark 
                ? "text-gray-500 hover:text-gray-300 hover:bg-white/10"
                : "text-gray-400 hover:text-gray-600 hover:bg-white/50",
              isDragging ? "opacity-100 cursor-grabbing" : "opacity-100 sm:opacity-0 sm:group-hover:opacity-100"
            )}
          >
            <GripVertical className="w-4 h-4 sm:w-3.5 sm:h-3.5" />
          </div>
        ) : (
          <div className="w-4" />
        )}

        <button
          onClick={(e) => {
            e.stopPropagation();
            onToggle();
          }}
          className={cn(
            "p-1 sm:p-0.5 rounded-lg transition-all duration-200",
            isDark ? "hover:bg-white/10" : "hover:bg-white/40"
          )}
        >
          {hasChildren ? (
            <div className={cn(
              "transition-transform duration-200 ease-out",
              isExpanded && "rotate-90"
            )}>
              <ChevronRight className="w-4 h-4" />
            </div>
          ) : (
            <span className="w-4 h-4 block" />
          )}
        </button>
        
        <div className="transition-transform duration-200">
          {isExpanded && hasChildren ? (
            <FolderOpen className="w-4 h-4 text-amber-500 drop-shadow-sm" />
          ) : (
            <Folder className="w-4 h-4 text-amber-500 drop-shadow-sm" />
          )}
        </div>
        
        <span 
          className="flex-1 truncate text-sm font-medium tracking-wide" 
          title={category.name}
        >
          {level > 5 && <span className="text-gray-400 text-xs mr-1">+{level - 5}</span>}
          {category.name}
        </span>

        {isTargetInside && !isDragging && (
          <div className="flex items-center gap-1 text-indigo-500">
            <ArrowRight className="w-4 h-4 animate-pulse" />
          </div>
        )}
        
        {/* 操作按钮 - 仅管理员可见 */}
        {canEdit && (
          <div className={cn(
            "items-center gap-0.5 transition-all duration-200",
            isDragging ? "hidden" : "hidden group-hover:flex"
          )}>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onAddChild();
              }}
              className={cn(
                "p-1.5 rounded-lg transition-all duration-200 hover:scale-110",
                isDark ? "hover:bg-white/10 text-gray-400 hover:text-gray-200" : "hover:bg-white/50"
              )}
              title="添加子分类"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onEdit();
              }}
              className={cn(
                "p-1.5 rounded-lg transition-all duration-200 hover:scale-110",
                isDark ? "hover:bg-white/10 text-gray-400 hover:text-gray-200" : "hover:bg-white/50"
              )}
              title="编辑"
            >
              <Edit2 className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDelete();
              }}
              className={cn(
                "p-1.5 rounded-lg transition-all duration-200 hover:scale-110",
                isDark ? "hover:bg-red-900/40 hover:text-red-400" : "hover:bg-red-100/60 hover:text-red-500"
              )}
              title="删除"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>

      {/* 底部放置指示器 */}
      <div 
        className={cn(
          "absolute left-0 right-0 h-0.5 -bottom-0.5 z-20 rounded-full",
          "transition-all duration-200 ease-out",
          isTargetAfter 
            ? "bg-gradient-to-r from-indigo-400 via-purple-500 to-pink-400 shadow-lg shadow-purple-500/50 opacity-100 scale-x-100" 
            : "opacity-0 scale-x-50"
        )}
        style={{ marginLeft: `${indent + 8}px`, marginRight: '8px' }}
      />
    </div>
  );
}

// 根区域放置组件
function RootDropZone({ isActive, isOver, isDark = false }: { isActive: boolean; isOver: boolean; isDark?: boolean }) {
  const { setNodeRef } = useDroppable({
    id: 'root-zone',
  });

  if (!isActive) return null;

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "mx-2 my-1 py-2.5 px-3 rounded-xl border-2 border-dashed transition-all duration-150 text-center text-sm",
        isOver
          ? isDark
            ? "border-indigo-400 bg-indigo-900/50 text-indigo-300 scale-[1.02]"
            : "border-indigo-500 bg-indigo-100/50 text-indigo-600 scale-[1.02]" 
          : isDark
            ? "border-gray-600 text-gray-500 hover:border-gray-500"
            : "border-gray-300/50 text-gray-400 hover:border-gray-400"
      )}
    >
      <Home className="w-4 h-4 inline mr-2" />
      移至顶级分类
    </div>
  );
}

export function Sidebar({
  categories,
  selectedCategoryId,
  onSelectCategory,
  onAddCategory,
  onDeleteCategory,
  onEditCategory,
  onMoveCategory,
  onClose,
  isDark = false,
  canEdit = false
}: SidebarProps) {
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [showAddRoot, setShowAddRoot] = useState(false);
  const [addingParentId, setAddingParentId] = useState<string | null>(null);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');
  const [activeId, setActiveId] = useState<string | null>(null);
  const [dropInfo, setDropInfo] = useState<DropInfo | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<{ id: string; name: string } | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 200,
        tolerance: 8,
      },
    })
  );

  // 获取所有后代ID
  const getDescendantIds = useCallback((categoryId: string): Set<string> => {
    const descendants = new Set<string>();
    const findDescendants = (parentId: string) => {
      categories.filter(c => c.parentId === parentId).forEach(child => {
        descendants.add(child.id);
        findDescendants(child.id);
      });
    };
    findDescendants(categoryId);
    return descendants;
  }, [categories]);

  // 构建可见分类列表（扁平化）
  const buildVisibleList = useCallback((parentId: string | null = null, level = 0): Array<{ category: Category; level: number }> => {
    const result: Array<{ category: Category; level: number }> = [];
    const children = categories
      .filter(c => c.parentId === parentId)
      .sort((a, b) => a.order - b.order);
    
    for (const child of children) {
      result.push({ category: child, level });
      if (expandedIds.has(child.id)) {
        result.push(...buildVisibleList(child.id, level + 1));
      }
    }
    return result;
  }, [categories, expandedIds]);

  const visibleCategories = buildVisibleList();

  const toggleExpand = (id: string) => {
    setExpandedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleAddCategory = () => {
    if (newCategoryName.trim()) {
      onAddCategory(newCategoryName.trim(), addingParentId);
      setNewCategoryName('');
      setShowAddRoot(false);
      setAddingParentId(null);
      if (addingParentId) {
        setExpandedIds(prev => new Set([...prev, addingParentId]));
      }
    }
  };

  const handleStartEdit = (id: string) => {
    const cat = categories.find(c => c.id === id);
    if (cat) {
      setEditingId(id);
      setEditingName(cat.name);
    }
  };

  const handleSaveEdit = () => {
    if (editingId && editingName.trim()) {
      onEditCategory(editingId, editingName.trim());
      setEditingId(null);
      setEditingName('');
    }
  };

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    
    if (!over || !activeId) {
      setDropInfo(null);
      return;
    }

    const overId = over.id as string;

    // 检查是否拖到根区域
    if (overId === 'root-zone') {
      setDropInfo({ type: 'root', targetId: 'root-zone' });
      return;
    }

    // 不能拖到自己或自己的后代
    const descendants = getDescendantIds(activeId);
    if (overId === activeId || descendants.has(overId)) {
      setDropInfo(null);
      return;
    }

    // 获取目标元素的rect
    const overRect = over.rect;
    if (!overRect) {
      setDropInfo(null);
      return;
    }

    // 计算当前拖拽位置
    const activeRect = active.rect.current.translated;
    if (!activeRect) {
      setDropInfo(null);
      return;
    }

    // 使用拖拽元素的中心点Y坐标
    const dragCenterY = activeRect.top + activeRect.height / 2;
    const overTop = overRect.top;
    const overHeight = overRect.height;
    
    // 计算相对于目标元素的位置比例
    const relativeY = dragCenterY - overTop;
    const threshold = overHeight * 0.3;
    
    if (relativeY < threshold) {
      setDropInfo({ type: 'before', targetId: overId });
    } else if (relativeY > overHeight - threshold) {
      setDropInfo({ type: 'after', targetId: overId });
    } else {
      setDropInfo({ type: 'inside', targetId: overId });
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    
    const currentDropInfo = dropInfo;
    setActiveId(null);
    setDropInfo(null);

    if (!over || !currentDropInfo) return;

    const draggedId = active.id as string;
    const movedCategory = categories.find(c => c.id === draggedId);
    if (!movedCategory) return;

    // 拖到根区域
    if (currentDropInfo.type === 'root') {
      const rootCats = categories.filter(c => c.parentId === null && c.id !== draggedId);
      const newOrder = rootCats.length;
      onMoveCategory(draggedId, null, newOrder);
      return;
    }

    const targetId = currentDropInfo.targetId;
    const targetCategory = categories.find(c => c.id === targetId);
    if (!targetCategory) return;

    // 不能移动到自己或后代
    const descendants = getDescendantIds(draggedId);
    if (targetId === draggedId || descendants.has(targetId)) {
      return;
    }

    if (currentDropInfo.type === 'inside') {
      // 作为目标的子分类
      const children = categories.filter(c => c.parentId === targetId && c.id !== draggedId);
      const newOrder = children.length;
      onMoveCategory(draggedId, targetId, newOrder);
      setExpandedIds(prev => new Set([...prev, targetId]));
    } else {
      // before 或 after: 放在目标的同级
      const siblings = categories
        .filter(c => c.parentId === targetCategory.parentId && c.id !== draggedId)
        .sort((a, b) => a.order - b.order);
      
      const targetIndex = siblings.findIndex(s => s.id === targetId);
      const newOrder = currentDropInfo.type === 'before' ? targetIndex : targetIndex + 1;
      
      onMoveCategory(draggedId, targetCategory.parentId, Math.max(0, newOrder));
    }
  };

  const handleDragCancel = () => {
    setActiveId(null);
    setDropInfo(null);
  };

  return (
    <div className={cn(
      "w-72 sm:w-80 backdrop-blur-2xl border-r flex flex-col h-full shadow-2xl",
      isDark ? "bg-gray-900/40 border-white/10" : "bg-white/25 border-white/30"
    )}>
      {/* 头部 */}
      <div className={cn("p-4 border-b", isDark ? "border-white/10" : "border-white/20")}>
        <div className="flex items-center justify-between">
          <h1 className={cn(
            "text-lg sm:text-xl font-bold flex items-center gap-2.5 sm:gap-3",
            isDark ? "text-white" : "text-gray-800"
          )}>
            <div className="w-9 h-9 sm:w-10 sm:h-10 bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 rounded-xl flex items-center justify-center shadow-lg shadow-purple-500/30 animate-scale-in">
              <Folder className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
            </div>
            <span className="truncate tracking-tight">我的收藏夹</span>
          </h1>
          {/* 关闭按钮（移动端） */}
          {onClose && (
            <button
              onClick={onClose}
              className={cn(
                "lg:hidden p-2 rounded-xl transition-all duration-200 btn-press",
                isDark ? "hover:bg-white/10 active:bg-white/20" : "hover:bg-white/50 active:bg-white/70"
              )}
            >
              <X className={cn("w-5 h-5", isDark ? "text-gray-400" : "text-gray-500")} />
            </button>
          )}
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto overflow-x-hidden p-2">
        {/* 全部收藏 */}
        <div
          className={cn(
            "flex items-center gap-2.5 py-3 sm:py-2.5 px-3.5 mx-1 rounded-xl cursor-pointer mb-2 btn-press",
            "transition-all duration-200 ease-out",
            selectedCategoryId === null 
              ? isDark
                ? "bg-gradient-to-r from-indigo-500/30 to-purple-500/30 text-indigo-300 shadow-lg shadow-indigo-500/10 border border-indigo-400/20"
                : "bg-gradient-to-r from-indigo-500/20 to-purple-500/20 text-indigo-700 shadow-lg shadow-indigo-500/10 border border-indigo-300/30"
              : isDark
                ? "hover:bg-white/10 active:bg-white/15 text-gray-300"
                : "hover:bg-white/50 active:bg-white/70 text-gray-700"
          )}
          onClick={() => onSelectCategory(null)}
        >
          <Home className="w-4 h-4" />
          <span className="font-medium text-sm tracking-wide">全部收藏</span>
        </div>
        
        <div className={cn(
          "text-[11px] px-4 py-2.5 uppercase tracking-widest font-semibold",
          isDark ? "text-gray-500" : "text-gray-400"
        )}>分类</div>
        
        <DndContext
          sensors={sensors}
          collisionDetection={pointerWithin}
          onDragStart={handleDragStart}
          onDragOver={handleDragOver}
          onDragEnd={handleDragEnd}
          onDragCancel={handleDragCancel}
          measuring={{
            droppable: {
              strategy: MeasuringStrategy.Always,
            },
          }}
        >
          {/* 根区域放置 */}
          <RootDropZone 
            isActive={!!activeId} 
            isOver={dropInfo?.type === 'root'}
            isDark={isDark}
          />

          {visibleCategories.map(({ category, level }) => {
            const children = categories.filter(c => c.parentId === category.id);
            const hasChildren = children.length > 0;
            const isExpanded = expandedIds.has(category.id);
            const isSelected = selectedCategoryId === category.id;
            const isDragging = activeId === category.id;
            
            // 检查是否是禁用的目标（自己或后代）
            const isDropDisabled = activeId 
              ? category.id === activeId || getDescendantIds(activeId).has(category.id)
              : false;

            return (
              <DraggableCategory
                key={category.id}
                category={category}
                level={level}
                isSelected={isSelected}
                isExpanded={isExpanded}
                hasChildren={hasChildren}
                dropInfo={dropInfo}
                isDragging={isDragging}
                isDropDisabled={isDropDisabled}
                isDark={isDark}
                canEdit={canEdit}
                onToggle={() => toggleExpand(category.id)}
                onSelect={() => onSelectCategory(category.id)}
                onAddChild={() => {
                  setAddingParentId(category.id);
                  setShowAddRoot(true);
                }}
                onDelete={() => setDeleteConfirm({ id: category.id, name: category.name })}
                onEdit={() => handleStartEdit(category.id)}
              />
            );
          })}
        </DndContext>
        
        {/* 添加分类表单 - 仅管理员可见 */}
        {canEdit && (showAddRoot || addingParentId !== null) && (
          <div className={cn(
            "mt-3 mx-2 p-3.5 backdrop-blur-xl rounded-xl border shadow-xl animate-scale-in",
            isDark 
              ? "bg-gray-800/60 border-white/10" 
              : "bg-white/50 border-white/40"
          )}>
            <input
              type="text"
              value={newCategoryName}
              onChange={(e) => setNewCategoryName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAddCategory()}
              placeholder="输入分类名称..."
              className={cn(
                "w-full px-3.5 py-2.5 text-sm rounded-lg transition-all duration-200",
                "focus:outline-none focus:ring-2 focus:ring-indigo-500/50",
                isDark 
                  ? "bg-white/10 border border-white/10 text-white placeholder-gray-500 focus:bg-white/15" 
                  : "bg-white/50 border border-white/40 placeholder-gray-400 focus:bg-white/70"
              )}
              autoFocus
            />
            <div className="flex gap-2 mt-3">
              <button
                onClick={handleAddCategory}
                className="flex-1 px-3 py-2.5 text-sm font-medium bg-gradient-to-r from-indigo-500 to-purple-500 text-white rounded-lg hover:from-indigo-600 hover:to-purple-600 transition-all shadow-lg shadow-indigo-500/25 btn-press"
              >
                添加
              </button>
              <button
                onClick={() => {
                  setShowAddRoot(false);
                  setAddingParentId(null);
                  setNewCategoryName('');
                }}
                className={cn(
                  "flex-1 px-3 py-2.5 text-sm font-medium rounded-lg transition-all btn-press",
                  isDark 
                    ? "bg-white/10 text-gray-300 hover:bg-white/15" 
                    : "bg-white/50 text-gray-700 hover:bg-white/70"
                )}
              >
                取消
              </button>
            </div>
          </div>
        )}
        
        {/* 添加分类按钮 - 仅管理员可见 */}
        {canEdit && !showAddRoot && addingParentId === null && (
          <button
            onClick={() => setShowAddRoot(true)}
            className={cn(
              "mt-2 mx-2 w-[calc(100%-16px)] flex items-center gap-2.5 py-3 sm:py-2.5 px-3.5 text-sm rounded-xl",
              "transition-all duration-200 btn-press border border-dashed",
              isDark 
                ? "text-gray-400 border-gray-700 hover:bg-white/5 hover:border-gray-600 hover:text-gray-300" 
                : "text-gray-500 border-gray-300/50 hover:bg-white/40 hover:border-gray-400/50 hover:text-gray-700"
            )}
          >
            <FolderPlus className="w-4 h-4" />
            <span className="font-medium">添加分类</span>
          </button>
        )}
      </div>
      
      {/* 编辑模态框 */}
      {editingId && (
        <div 
          className="fixed inset-0 bg-black/30 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-fade-in"
          onClick={() => setEditingId(null)}
        >
          <div 
            className={cn(
              "backdrop-blur-xl rounded-2xl p-5 w-full max-w-sm shadow-2xl border animate-scale-in",
              isDark 
                ? "bg-gray-800/80 border-white/10" 
                : "bg-white/70 border-white/40"
            )}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className={cn(
              "font-semibold mb-4 text-lg tracking-tight",
              isDark ? "text-white" : "text-gray-900"
            )}>编辑分类</h3>
            <input
              type="text"
              value={editingName}
              onChange={(e) => setEditingName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSaveEdit()}
              className={cn(
                "w-full px-4 py-3 rounded-xl transition-all duration-200",
                "focus:outline-none focus:ring-2 focus:ring-indigo-500/50",
                isDark 
                  ? "bg-white/10 border border-white/10 text-white focus:bg-white/15" 
                  : "bg-white/50 border border-white/30 focus:bg-white/70"
              )}
              autoFocus
            />
            <div className="flex gap-3 mt-5">
              <button
                onClick={handleSaveEdit}
                className="flex-1 px-4 py-3 text-sm font-medium bg-gradient-to-r from-indigo-500 to-purple-500 text-white rounded-xl hover:from-indigo-600 hover:to-purple-600 transition-all shadow-lg shadow-indigo-500/25 btn-press"
              >
                保存
              </button>
              <button
                onClick={() => setEditingId(null)}
                className={cn(
                  "flex-1 px-4 py-3 text-sm font-medium rounded-xl transition-all btn-press",
                  isDark 
                    ? "bg-white/10 text-gray-300 hover:bg-white/15" 
                    : "bg-gray-100/70 text-gray-700 hover:bg-gray-200/70"
                )}
              >
                取消
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 删除确认对话框 */}
      <ConfirmDialog
        isOpen={!!deleteConfirm}
        title="删除分类"
        message={`确定要删除分类「${deleteConfirm?.name}」吗？该分类下的所有子分类和收藏项也会被删除。`}
        confirmText="删除"
        cancelText="取消"
        type="danger"
        onConfirm={() => {
          if (deleteConfirm) {
            onDeleteCategory(deleteConfirm.id);
            setDeleteConfirm(null);
          }
        }}
        onCancel={() => setDeleteConfirm(null)}
      />
    </div>
  );
}
