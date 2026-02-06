import { BookmarkItem } from '@/types';
import { X, FileText } from 'lucide-react';
import { cn } from '@/utils/cn';

interface NoteViewModalProps {
  item: BookmarkItem | null;
  onClose: () => void;
  isDark?: boolean;
}

export function NoteViewModal({ item, onClose, isDark = false }: NoteViewModalProps) {
  if (!item) return null;

  return (
    <div className={cn(
      "fixed inset-0 backdrop-blur-md flex items-end sm:items-center justify-center z-50 p-0 sm:p-4",
      isDark ? "bg-black/40" : "bg-black/20"
    )}>
      <div className={cn(
        "backdrop-blur-xl rounded-t-3xl sm:rounded-3xl w-full sm:max-w-2xl shadow-2xl max-h-[90vh] sm:max-h-[80vh] flex flex-col border",
        isDark 
          ? "bg-gray-900/70 border-white/10" 
          : "bg-white/50 border-white/30"
      )}>
        {/* 头部 */}
        <div className={cn(
          "flex items-center justify-between p-4 sm:p-5 border-b flex-shrink-0",
          isDark ? "border-white/10" : "border-gray-200/50"
        )}>
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center shadow-lg shadow-green-500/30 flex-shrink-0">
              <FileText className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
            </div>
            <h2 className={cn(
              "text-base sm:text-lg font-semibold truncate",
              isDark ? "text-white" : "text-gray-900"
            )}>{item.title}</h2>
          </div>
          <button 
            onClick={onClose} 
            className={cn(
              "p-2 rounded-xl transition-colors flex-shrink-0",
              isDark ? "hover:bg-white/10" : "hover:bg-white/40"
            )}
          >
            <X className={cn("w-5 h-5", isDark ? "text-gray-400" : "text-gray-600")} />
          </button>
        </div>
        
        {/* 内容区 */}
        <div className="p-4 sm:p-5 overflow-y-auto flex-1">
          <div className="prose prose-sm max-w-none">
            <pre className={cn(
              "whitespace-pre-wrap font-sans backdrop-blur-sm rounded-2xl p-4 sm:p-5 border shadow-inner text-sm sm:text-base",
              isDark 
                ? "bg-white/5 border-white/10 text-gray-300" 
                : "bg-white/30 border-white/30 text-gray-700"
            )}>
              {item.content}
            </pre>
          </div>
        </div>
        
        {/* 底部按钮 */}
        <div className={cn(
          "p-4 sm:p-5 border-t flex-shrink-0",
          isDark ? "border-white/10" : "border-gray-200/50"
        )}>
          <button
            onClick={onClose}
            className={cn(
              "w-full px-4 py-3 sm:py-2.5 rounded-xl transition-all font-medium",
              isDark 
                ? "bg-white/10 text-gray-300 hover:bg-white/20" 
                : "bg-white/40 text-gray-700 hover:bg-white/60"
            )}
          >
            关闭
          </button>
        </div>
      </div>
    </div>
  );
}
