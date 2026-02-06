import { useState, useRef } from 'react';
import { ItemType, Category } from '@/types';
import { X, Globe, FileText, File, Upload } from 'lucide-react';
import { saveFile } from '@/services/fileStorage';
import { cn } from '@/utils/cn';

interface AddItemModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (item: {
    type: ItemType;
    title: string;
    categoryId: string;
    url?: string;
    content?: string;
    fileName?: string;
    fileType?: string;
    fileData?: string;
    fileId?: string;
  }) => void;
  categories: Category[];
  defaultCategoryId: string | null;
  isDark?: boolean;
}

export function AddItemModal({ isOpen, onClose, onAdd, categories, defaultCategoryId, isDark = false }: AddItemModalProps) {
  const [type, setType] = useState<ItemType>('website');
  const [title, setTitle] = useState('');
  const [url, setUrl] = useState('');
  const [content, setContent] = useState('');
  const [categoryId, setCategoryId] = useState(defaultCategoryId || '');
  const [fileName, setFileName] = useState('');
  const [fileType, setFileType] = useState('');
  const [fileData, setFileData] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const resetForm = () => {
    setTitle('');
    setUrl('');
    setContent('');
    setFileName('');
    setFileType('');
    setFileData('');
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFileName(file.name);
      setFileType(file.type);
      if (!title) setTitle(file.name);
      
      const reader = new FileReader();
      reader.onload = () => {
        setFileData(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async () => {
    if (!title.trim()) return;
    if (!categoryId) return;
    
    let fileId: string | undefined;
    
    // 如果是文件类型，保存文件（saveFile 会自动处理本地/云端存储）
    if (type === 'file' && fileData) {
      const tempId = `file-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      // saveFile 会返回实际的 fileId（云端上传成功会返回新 ID）
      fileId = await saveFile(tempId, fileData, fileName, fileType);
    }
    
    onAdd({
      type,
      title: title.trim(),
      categoryId,
      ...(type === 'website' && { url }),
      ...(type === 'note' && { content }),
      ...(type === 'file' && { fileName, fileType, fileId }),
    });
    
    resetForm();
    onClose();
  };

  if (!isOpen) return null;

  const buildCategoryOptions = (cats: Category[], parentId: string | null = null, level = 0): React.ReactNode[] => {
    return cats
      .filter(c => c.parentId === parentId)
      .sort((a, b) => a.order - b.order)
      .flatMap(c => {
        // 使用全角空格和特殊字符来正确显示层级
        const indent = '\u00A0\u00A0\u00A0\u00A0'.repeat(level); // 使用不间断空格
        const prefix = level > 0 ? '└─ ' : '';
        return [
          <option key={c.id} value={c.id}>
            {indent}{prefix}{c.name}
          </option>,
          ...buildCategoryOptions(cats, c.id, level + 1)
        ];
      });
  };

  return (
    <div className={cn(
      "fixed inset-0 backdrop-blur-md flex items-end sm:items-center justify-center z-50 p-0 sm:p-4",
      isDark ? "bg-black/40" : "bg-black/20"
    )}>
      <div className={cn(
        "backdrop-blur-xl rounded-t-3xl sm:rounded-3xl w-full sm:max-w-lg shadow-2xl border max-h-[90vh] sm:max-h-[85vh] flex flex-col",
        isDark 
          ? "bg-gray-900/70 border-white/10" 
          : "bg-white/50 border-white/30"
      )}>
        {/* 头部 */}
        <div className={cn(
          "flex items-center justify-between p-4 sm:p-5 border-b flex-shrink-0",
          isDark ? "border-white/10" : "border-gray-200/50"
        )}>
          <h2 className={cn(
            "text-lg font-semibold",
            isDark ? "text-white" : "text-gray-900"
          )}>添加收藏</h2>
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
          {/* Type selector */}
          <div className="flex gap-2">
            {[
              { type: 'website' as ItemType, icon: Globe, label: '网站' },
              { type: 'note' as ItemType, icon: FileText, label: '笔记' },
              { type: 'file' as ItemType, icon: File, label: '文件' },
            ].map(({ type: t, icon: Icon, label }) => (
              <button
                key={t}
                onClick={() => {
                  setType(t);
                  resetForm();
                }}
                className={cn(
                  "flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border-2 transition-all",
                  type === t
                    ? "border-indigo-500 bg-indigo-500/20 text-indigo-400 shadow-lg shadow-indigo-500/20"
                    : isDark
                      ? "border-white/10 hover:border-white/30 bg-white/5 hover:bg-white/10 text-gray-400"
                      : "border-white/30 hover:border-white/50 bg-white/30 hover:bg-white/50 text-gray-700"
                )}
              >
                <Icon className="w-4 h-4" />
                {label}
              </button>
            ))}
          </div>
          
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
          
          {/* Category */}
          <div>
            <label className={cn(
              "block text-sm font-medium mb-1.5",
              isDark ? "text-gray-300" : "text-gray-700"
            )}>分类</label>
            <select
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              className={cn(
                "w-full px-4 py-3 sm:py-2.5 border rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all text-base sm:text-sm",
                isDark 
                  ? "bg-white/5 border-white/10 text-white focus:bg-white/10 [&>option]:bg-gray-800 [&>option]:text-white" 
                  : "bg-white/30 border-white/20 focus:bg-white/50 [&>option]:bg-white [&>option]:text-gray-900"
              )}
              style={{ fontFamily: 'monospace' }}
            >
              <option value="">选择分类</option>
              {buildCategoryOptions(categories)}
            </select>
          </div>
          
          {/* Website URL */}
          {type === 'website' && (
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
          {type === 'note' && (
            <div>
              <label className={cn(
                "block text-sm font-medium mb-1.5",
                isDark ? "text-gray-300" : "text-gray-700"
              )}>内容</label>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="输入笔记内容..."
                rows={5}
                className={cn(
                  "w-full px-4 py-3 sm:py-2.5 border rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all resize-none text-base sm:text-sm",
                  isDark 
                    ? "bg-white/5 border-white/10 text-white placeholder-gray-500 focus:bg-white/10" 
                    : "bg-white/30 border-white/20 focus:bg-white/50"
                )}
              />
            </div>
          )}
          
          {/* File upload */}
          {type === 'file' && (
            <div>
              <label className={cn(
                "block text-sm font-medium mb-1.5",
                isDark ? "text-gray-300" : "text-gray-700"
              )}>上传文件</label>
              <input
                ref={fileInputRef}
                type="file"
                onChange={handleFileChange}
                className="hidden"
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                className={cn(
                  "w-full flex items-center justify-center gap-3 py-8 sm:py-10 border-2 border-dashed rounded-xl transition-all group",
                  isDark
                    ? "border-white/20 hover:border-indigo-400 hover:bg-indigo-500/10"
                    : "border-white/40 hover:border-indigo-500/50 hover:bg-indigo-50/30"
                )}
              >
                <Upload className={cn(
                  "w-8 h-8 transition-colors",
                  isDark ? "text-gray-500 group-hover:text-indigo-400" : "text-gray-400 group-hover:text-indigo-500"
                )} />
                <span className={cn(
                  "transition-colors",
                  isDark ? "text-gray-400 group-hover:text-indigo-400" : "text-gray-600 group-hover:text-indigo-600"
                )}>
                  {fileName || '点击选择文件'}
                </span>
              </button>
              {fileName && (
                <p className={cn(
                  "mt-2 text-sm backdrop-blur-sm rounded-lg px-3 py-2",
                  isDark ? "bg-white/5 text-gray-400" : "bg-white/30 text-gray-500"
                )}>
                  已选择: {fileName}
                </p>
              )}
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
            disabled={!title.trim() || !categoryId}
            className="flex-1 px-4 py-3 sm:py-2.5 bg-gradient-to-r from-indigo-500 to-purple-500 text-white rounded-xl hover:from-indigo-600 hover:to-purple-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed font-medium shadow-lg shadow-indigo-500/25"
          >
            添加
          </button>
        </div>
      </div>
    </div>
  );
}
