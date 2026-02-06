import { useState, useRef, useEffect } from 'react';
import { BookmarkItem, Category } from '@/types';
import { X, Globe, FileText, File, Upload } from 'lucide-react';
import { saveFile, getFile } from '@/services/fileStorage';
import { cn } from '@/utils/cn';
import { CategorySelector } from './CategorySelector';

interface EditItemModalProps {
  isOpen: boolean;
  item: BookmarkItem | null;
  onClose: () => void;
  onSave: (item: BookmarkItem) => void;
  categories: Category[];
  isDark?: boolean;
}

export function EditItemModal({ isOpen, item, onClose, onSave, categories, isDark = false }: EditItemModalProps) {
  const [title, setTitle] = useState('');
  const [url, setUrl] = useState('');
  const [content, setContent] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [fileName, setFileName] = useState('');
  const [fileType, setFileType] = useState('');
  const [fileData, setFileData] = useState('');
  const [fileId, setFileId] = useState<string | undefined>();
  const [isLoading, setIsLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 当 item 改变时,初始化表单
  useEffect(() => {
    if (item) {
      setTitle(item.title);
      setUrl(item.url || '');
      setContent(item.content || '');
      setCategoryId(item.categoryId);
      setFileName(item.fileName || '');
      setFileType(item.fileType || '');
      setFileId(item.fileId);
      
      // 加载文件数据
      if (item.fileId) {
        getFile(item.fileId).then((data) => {
          if (data) {
            setFileData(data.data);
          }
        });
      } else if (item.fileData) {
        setFileData(item.fileData);
      }
    }
  }, [item]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFileName(file.name);
      setFileType(file.type);
      
      const reader = new FileReader();
      reader.onload = () => {
        setFileData(reader.result as string);
        // 标记为新文件,需要重新上传
        setFileId(undefined);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async () => {
    if (!item) return;
    if (!title.trim()) return;
    
    setIsLoading(true);
    
    try {
      let newFileId = fileId;
      
      // 如果是文件类型且有新文件数据且没有 fileId,需要上传
      if (item.type === 'file' && fileData && !fileId) {
        const tempId = `file-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        newFileId = await saveFile(tempId, fileData, fileName, fileType);
      }
      
      const updatedItem: BookmarkItem = {
        ...item,
        title: title.trim(),
        categoryId,
        updatedAt: Date.now(),
        ...(item.type === 'website' && { url }),
        ...(item.type === 'note' && { content }),
        ...(item.type === 'file' && { fileName, fileType, fileId: newFileId }),
      };
      
      onSave(updatedItem);
      onClose();
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen || !item) return null;

  const getTypeIcon = () => {
    switch (item.type) {
      case 'website':
        return <Globe className="w-5 h-5 text-blue-500" />;
      case 'note':
        return <FileText className="w-5 h-5 text-emerald-500" />;
      case 'file':
        return <File className="w-5 h-5 text-orange-500" />;
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
      "fixed inset-0 backdrop-blur-md flex items-end sm:items-center justify-center z-50 p-0 sm:p-4",
      isDark ? "bg-black/40" : "bg-black/20"
    )} onClick={onClose}>
      <div 
        className={cn(
          "backdrop-blur-xl rounded-t-3xl sm:rounded-3xl w-full sm:max-w-lg shadow-2xl border max-h-[90vh] sm:max-h-[85vh] flex flex-col",
          isDark 
            ? "bg-gray-900/70 border-white/10" 
            : "bg-white/50 border-white/30"
        )}
        onClick={e => e.stopPropagation()}
      >
        {/* 头部 */}
        <div className={cn(
          "flex items-center justify-between p-4 sm:p-5 border-b flex-shrink-0",
          isDark ? "border-white/10" : "border-gray-200/50"
        )}>
          <div className="flex items-center gap-3">
            <div className={cn(
              "w-10 h-10 rounded-xl flex items-center justify-center",
              isDark ? "bg-white/10" : "bg-white/50"
            )}>
              {getTypeIcon()}
            </div>
            <div>
              <h2 className={cn(
                "text-lg font-semibold",
                isDark ? "text-white" : "text-gray-900"
              )}>编辑{getTypeLabel()}</h2>
              <p className={cn(
                "text-xs",
                isDark ? "text-gray-400" : "text-gray-500"
              )}>
                创建于 {new Date(item.createdAt).toLocaleDateString('zh-CN')}
                {item.updatedAt && ` · 修改于 ${new Date(item.updatedAt).toLocaleDateString('zh-CN')}`}
              </p>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className={cn(
              "p-2 rounded-xl transition-colors",
              isDark ? "hover:bg-white/10" : "hover:bg-white/40"
            )}
          >
            <X className={cn("w-5 h-5", isDark ? "text-gray-400" : "text-gray-600")} />
          </button>
        </div>
        
        {/* 内容区 - 可滚动 */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
          {/* Title */}
          <div>
            <label className={cn(
              "block text-sm font-medium mb-1.5",
              isDark ? "text-gray-300" : "text-gray-700"
            )}>标题</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="输入标题"
              className={cn(
                "w-full px-4 py-3 sm:py-2.5 border rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all text-base sm:text-sm",
                isDark 
                  ? "bg-white/5 border-white/10 text-white placeholder-gray-500 focus:bg-white/10" 
                  : "bg-white/30 border-white/20 focus:bg-white/50"
              )}
            />
          </div>
          
          {/* Category - 使用新的 CategorySelector */}
          <div>
            <label className={cn(
              "block text-sm font-medium mb-1.5",
              isDark ? "text-gray-300" : "text-gray-700"
            )}>分类</label>
            <CategorySelector
              categories={categories}
              selectedId={categoryId}
              onChange={setCategoryId}
              isDark={isDark}
              placeholder="选择分类（可选）"
            />
          </div>
          
          {/* Website URL */}
          {item.type === 'website' && (
            <div>
              <label className={cn(
                "block text-sm font-medium mb-1.5",
                isDark ? "text-gray-300" : "text-gray-700"
              )}>网址</label>
              <input
                type="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://example.com"
                className={cn(
                  "w-full px-4 py-3 sm:py-2.5 border rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all text-base sm:text-sm",
                  isDark 
                    ? "bg-white/5 border-white/10 text-white placeholder-gray-500 focus:bg-white/10" 
                    : "bg-white/30 border-white/20 focus:bg-white/50"
                )}
              />
            </div>
          )}
          
          {/* Note content */}
          {item.type === 'note' && (
            <div>
              <label className={cn(
                "block text-sm font-medium mb-1.5",
                isDark ? "text-gray-300" : "text-gray-700"
              )}>内容</label>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="输入笔记内容..."
                rows={8}
                className={cn(
                  "w-full px-4 py-3 sm:py-2.5 border rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all resize-none text-base sm:text-sm",
                  isDark 
                    ? "bg-white/5 border-white/10 text-white placeholder-gray-500 focus:bg-white/10" 
                    : "bg-white/30 border-white/20 focus:bg-white/50"
                )}
              />
            </div>
          )}
          
          {/* File */}
          {item.type === 'file' && (
            <div>
              <label className={cn(
                "block text-sm font-medium mb-1.5",
                isDark ? "text-gray-300" : "text-gray-700"
              )}>文件</label>
              
              {/* 当前文件信息 */}
              {fileName && (
                <div className={cn(
                  "flex items-center gap-3 p-3 rounded-xl mb-3",
                  isDark ? "bg-white/5" : "bg-white/30"
                )}>
                  <File className={cn(
                    "w-8 h-8 flex-shrink-0",
                    isDark ? "text-orange-400" : "text-orange-500"
                  )} />
                  <div className="flex-1 min-w-0">
                    <p className={cn(
                      "text-sm font-medium truncate",
                      isDark ? "text-white" : "text-gray-900"
                    )}>{fileName}</p>
                    <p className={cn(
                      "text-xs",
                      isDark ? "text-gray-400" : "text-gray-500"
                    )}>{fileType || '未知类型'}</p>
                  </div>
                </div>
              )}
              
              <input
                ref={fileInputRef}
                type="file"
                onChange={handleFileChange}
                className="hidden"
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                className={cn(
                  "w-full flex items-center justify-center gap-3 py-6 border-2 border-dashed rounded-xl transition-all group",
                  isDark
                    ? "border-white/20 hover:border-indigo-400 hover:bg-indigo-500/10"
                    : "border-white/40 hover:border-indigo-500/50 hover:bg-indigo-50/30"
                )}
              >
                <Upload className={cn(
                  "w-6 h-6 transition-colors",
                  isDark ? "text-gray-500 group-hover:text-indigo-400" : "text-gray-400 group-hover:text-indigo-500"
                )} />
                <span className={cn(
                  "transition-colors",
                  isDark ? "text-gray-400 group-hover:text-indigo-400" : "text-gray-600 group-hover:text-indigo-600"
                )}>
                  点击更换文件
                </span>
              </button>
            </div>
          )}
        </div>
        
        {/* 底部按钮 */}
        <div className={cn(
          "flex gap-3 p-4 sm:p-5 border-t flex-shrink-0",
          isDark ? "border-white/10" : "border-gray-200/50"
        )}>
          <button
            onClick={onClose}
            className={cn(
              "flex-1 px-4 py-3 sm:py-2.5 rounded-xl transition-all font-medium",
              isDark 
                ? "bg-white/10 text-gray-300 hover:bg-white/20" 
                : "bg-white/40 text-gray-700 hover:bg-white/60"
            )}
          >
            取消
          </button>
          <button
            onClick={handleSubmit}
            disabled={!title.trim() || isLoading}
            className="flex-1 px-4 py-3 sm:py-2.5 bg-gradient-to-r from-indigo-500 to-purple-500 text-white rounded-xl hover:from-indigo-600 hover:to-purple-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed font-medium shadow-lg shadow-indigo-500/25"
          >
            {isLoading ? '保存中...' : '保存'}
          </button>
        </div>
      </div>
    </div>
  );
}
