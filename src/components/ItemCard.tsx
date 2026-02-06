import { useState, useEffect } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { BookmarkItem, Category } from '@/types';
import { Globe, FileText, File, ExternalLink, Trash2, Download, Eye, GripVertical, Pencil } from 'lucide-react';
import { cn } from '@/utils/cn';
import { getFile } from '@/services/fileStorage';

interface ItemCardProps {
  item: BookmarkItem;
  category?: Category;
  onDelete: (id: string) => void;
  onView: (item: BookmarkItem) => void;
  onEdit?: (item: BookmarkItem) => void;
  isDark?: boolean;
  canEdit?: boolean;
}

// 拖拽覆盖层卡片
interface DragOverlayCardProps {
  item: BookmarkItem;
  category?: Category;
  isDark?: boolean;
}

export function DragOverlayCard({ item, category, isDark = false }: DragOverlayCardProps) {
  const getIcon = () => {
    switch (item.type) {
      case 'website':
        return <Globe className="w-4 h-4 sm:w-5 sm:h-5 text-blue-500 drop-shadow-sm" />;
      case 'note':
        return <FileText className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-500 drop-shadow-sm" />;
      case 'file':
        return <File className="w-4 h-4 sm:w-5 sm:h-5 text-orange-500 drop-shadow-sm" />;
    }
  };

  const getTypeLabel = () => {
    switch (item.type) {
      case 'website':
        return '网站';
      case 'note':
        return '笔记';
      case 'file':
        return '文件';
    }
  };

  return (
    <div className={cn(
      "backdrop-blur-xl rounded-2xl border p-3 sm:p-4 shadow-2xl scale-[1.02]",
      isDark 
        ? "bg-gray-800/70 border-white/15" 
        : "bg-white/50 border-white/40"
    )}>
      <div className="flex items-start gap-2 sm:gap-3">
        <div className={cn(
          "w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-br backdrop-blur-sm flex items-center justify-center flex-shrink-0 shadow-inner",
          isDark ? "from-gray-700/50 to-gray-800/50" : "from-white/50 to-gray-100/50"
        )}>
          {getIcon()}
        </div>
        
        <div className="flex-1 min-w-0">
          <h3 className={cn(
            "font-medium truncate text-sm sm:text-base",
            isDark ? "text-white" : "text-gray-900"
          )}>{item.title}</h3>
          
          {item.type === 'website' && item.url && (
            <p className={cn("text-xs sm:text-sm truncate", isDark ? "text-gray-400" : "text-gray-500")}>{item.url}</p>
          )}
          
          {item.type === 'note' && item.content && (
            <p className={cn("text-xs sm:text-sm line-clamp-2", isDark ? "text-gray-400" : "text-gray-500")}>{item.content}</p>
          )}
          
          {item.type === 'file' && item.fileName && (
            <p className={cn("text-xs sm:text-sm truncate", isDark ? "text-gray-400" : "text-gray-500")}>{item.fileName}</p>
          )}
          
          <div className="flex items-center gap-2 mt-2">
            <span className={cn(
              "text-xs px-2 py-0.5 rounded-full backdrop-blur-sm",
              item.type === 'website' && (isDark ? "bg-blue-500/20 text-blue-400" : "bg-blue-100/50 text-blue-700"),
              item.type === 'note' && (isDark ? "bg-green-500/20 text-green-400" : "bg-green-100/50 text-green-700"),
              item.type === 'file' && (isDark ? "bg-orange-500/20 text-orange-400" : "bg-orange-100/50 text-orange-700")
            )}>
              {getTypeLabel()}
            </span>
            {category && (
              <span className={cn("text-xs", isDark ? "text-gray-500" : "text-gray-400")}>
                {category.name}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export function ItemCard({ item, category, onDelete, onView, onEdit, isDark = false, canEdit = false }: ItemCardProps) {
  const [fileData, setFileData] = useState<string | null>(item.fileData || null);
  
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  // 从 IndexedDB 加载文件数据
  useEffect(() => {
    if (item.type === 'file' && item.fileId && !fileData) {
      getFile(item.fileId).then((data) => {
        if (data) {
          setFileData(data.data);
        }
      });
    }
  }, [item.fileId, item.type, fileData]);

  const getIcon = () => {
    switch (item.type) {
      case 'website':
        return <Globe className="w-4 h-4 sm:w-5 sm:h-5 text-blue-500 drop-shadow-sm" />;
      case 'note':
        return <FileText className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-500 drop-shadow-sm" />;
      case 'file':
        return <File className="w-4 h-4 sm:w-5 sm:h-5 text-orange-500 drop-shadow-sm" />;
    }
  };

  const getTypeLabel = () => {
    switch (item.type) {
      case 'website':
        return '网站';
      case 'note':
        return '笔记';
      case 'file':
        return '文件';
    }
  };

  const handleDownload = () => {
    const data = fileData || item.fileData;
    if (data && item.fileName) {
      const link = document.createElement('a');
      link.href = data;
      link.download = item.fileName;
      link.click();
    }
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "rounded-2xl border p-3 sm:p-4 group shadow-lg hover-lift gpu-accelerate",
        "lg:backdrop-blur-xl",
        "transition-all duration-200 ease-out",
        "active:scale-[0.98]",
        isDragging && "opacity-40 scale-[0.97]",
        isDark 
          ? "bg-gray-800/95 lg:bg-gray-800/40 border-white/10 shadow-black/30 hover:bg-gray-800 lg:hover:bg-gray-800/60 hover:border-indigo-400/30 hover:shadow-xl" 
          : "bg-white/95 lg:bg-white/35 border-white/40 shadow-black/5 hover:bg-white lg:hover:bg-white/55 hover:shadow-xl hover:shadow-indigo-500/10 hover:border-indigo-200/40"
      )}
    >
      <div className="flex items-start gap-2 sm:gap-3">
        {/* 拖拽手柄 - 仅管理员可见 */}
        {canEdit && (
          <div
            {...attributes}
            {...listeners}
            className={cn(
              "p-1.5 sm:p-1 -ml-1 cursor-grab active:cursor-grabbing sm:opacity-0 sm:group-hover:opacity-100 touch-none rounded-lg",
              "transition-all duration-200",
              isDark ? "text-gray-500 hover:text-gray-300 hover:bg-white/10" : "text-gray-400 sm:text-gray-300 hover:text-gray-500 hover:bg-black/5"
            )}
          >
            <GripVertical className="w-4 h-4" />
          </div>
        )}

        <div className={cn(
          "w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-br backdrop-blur-sm flex items-center justify-center flex-shrink-0 shadow-inner border",
          "transition-transform duration-200 group-hover:scale-105",
          isDark 
            ? "from-gray-700/60 to-gray-800/60 border-white/10" 
            : "from-white/60 to-gray-100/60 border-white/50"
        )}>
          {getIcon()}
        </div>
        
        <div className="flex-1 min-w-0">
          <h3 className={cn(
            "font-semibold truncate text-sm sm:text-base tracking-tight",
            isDark ? "text-white" : "text-gray-900"
          )}>{item.title}</h3>
          
          {item.type === 'website' && item.url && (
            <p className={cn(
              "text-xs sm:text-sm truncate mt-0.5",
              isDark ? "text-gray-400" : "text-gray-500"
            )}>{item.url}</p>
          )}
          
          {item.type === 'note' && item.content && (
            <p className={cn(
              "text-xs sm:text-sm line-clamp-2 mt-0.5 leading-relaxed",
              isDark ? "text-gray-400" : "text-gray-500"
            )}>{item.content}</p>
          )}
          
          {item.type === 'file' && item.fileName && (
            <p className={cn(
              "text-xs sm:text-sm truncate mt-0.5",
              isDark ? "text-gray-400" : "text-gray-500"
            )}>{item.fileName}</p>
          )}
          
          <div className="flex items-center flex-wrap gap-1.5 sm:gap-2 mt-2.5">
            <span className={cn(
              "text-[11px] font-medium px-2 py-0.5 rounded-full backdrop-blur-sm tracking-wide",
              item.type === 'website' && (isDark ? "bg-blue-500/25 text-blue-300" : "bg-blue-100/70 text-blue-600"),
              item.type === 'note' && (isDark ? "bg-emerald-500/25 text-emerald-300" : "bg-emerald-100/70 text-emerald-600"),
              item.type === 'file' && (isDark ? "bg-orange-500/25 text-orange-300" : "bg-orange-100/70 text-orange-600")
            )}>
              {getTypeLabel()}
            </span>
            {category && (
              <span className={cn(
                "text-[11px] hidden sm:inline",
                isDark ? "text-gray-500" : "text-gray-400"
              )}>
                {category.name}
              </span>
            )}
            <span className={cn(
              "text-[11px] hidden sm:inline",
              isDark ? "text-gray-500" : "text-gray-400"
            )}>
              {formatDate(item.createdAt)}
            </span>
          </div>
        </div>
        
        {/* 操作按钮 - 移动端始终显示 */}
        <div className="flex items-center gap-0.5 sm:gap-1 sm:opacity-0 sm:group-hover:opacity-100 transition-all duration-200">
          {item.type === 'website' && item.url && (
            <a
              href={item.url}
              target="_blank"
              rel="noopener noreferrer"
              className={cn(
                "p-2 rounded-xl backdrop-blur-sm btn-press",
                "transition-all duration-200",
                isDark 
                  ? "hover:bg-white/10 active:bg-white/20 text-gray-400 hover:text-blue-400" 
                  : "hover:bg-blue-50/70 active:bg-blue-100/70 text-gray-500 hover:text-blue-500"
              )}
              title="打开链接"
            >
              <ExternalLink className="w-4 h-4" />
            </a>
          )}
          
          {item.type === 'note' && (
            <button
              onClick={() => onView(item)}
              className={cn(
                "p-2 rounded-xl backdrop-blur-sm btn-press",
                "transition-all duration-200",
                isDark 
                  ? "hover:bg-white/10 active:bg-white/20 text-gray-400 hover:text-emerald-400" 
                  : "hover:bg-emerald-50/70 active:bg-emerald-100/70 text-gray-500 hover:text-emerald-500"
              )}
              title="查看"
            >
              <Eye className="w-4 h-4" />
            </button>
          )}
          
          {item.type === 'file' && (item.fileId || item.fileData || fileData) && (
            <>
              <button
                onClick={() => {
                  // 传递包含实际文件数据的 item
                  const itemWithData = fileData ? { ...item, fileData } : item;
                  onView(itemWithData);
                }}
                className={cn(
                  "p-2 rounded-xl backdrop-blur-sm btn-press",
                  "transition-all duration-200",
                  isDark 
                    ? "hover:bg-white/10 active:bg-white/20 text-gray-400 hover:text-purple-400" 
                    : "hover:bg-purple-50/70 active:bg-purple-100/70 text-gray-500 hover:text-purple-500"
                )}
                title="预览"
              >
                <Eye className="w-4 h-4" />
              </button>
              <button
                onClick={handleDownload}
                className={cn(
                  "p-2 rounded-xl backdrop-blur-sm btn-press",
                  "transition-all duration-200",
                  isDark 
                    ? "hover:bg-white/10 active:bg-white/20 text-gray-400 hover:text-orange-400" 
                    : "hover:bg-orange-50/70 active:bg-orange-100/70 text-gray-500 hover:text-orange-500"
                )}
                title="下载"
              >
                <Download className="w-4 h-4" />
              </button>
            </>
          )}
          
          {canEdit && (
            <>
              <button
                onClick={() => onEdit?.(item)}
                className={cn(
                  "p-2 rounded-xl backdrop-blur-sm btn-press",
                  "transition-all duration-200",
                  isDark 
                    ? "hover:bg-white/10 active:bg-white/20 text-gray-400 hover:text-indigo-400" 
                    : "hover:bg-indigo-50/70 active:bg-indigo-100/70 text-gray-500 hover:text-indigo-500"
                )}
                title="编辑"
              >
                <Pencil className="w-4 h-4" />
              </button>
              <button
                onClick={() => onDelete(item.id)}
                className={cn(
                  "p-2 rounded-xl backdrop-blur-sm btn-press",
                  "transition-all duration-200",
                  isDark 
                    ? "hover:bg-red-500/20 text-gray-400 hover:text-red-400" 
                    : "hover:bg-red-50/70 active:bg-red-100/70 text-gray-500 hover:text-red-500"
                )}
                title="删除"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
