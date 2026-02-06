import { useEffect, useRef } from 'react';
import { cn } from '@/utils/cn';

interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  type?: 'danger' | 'warning' | 'info';
  onConfirm: () => void;
  onCancel: () => void;
  isDark?: boolean;
}

export default function ConfirmDialog({
  isOpen,
  title,
  message,
  confirmText = '确认',
  cancelText = '取消',
  type = 'danger',
  onConfirm,
  onCancel,
  isDark = false,
}: ConfirmDialogProps) {
  const confirmButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (isOpen) {
      confirmButtonRef.current?.focus();
    }
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;
      if (e.key === 'Escape') {
        onCancel();
      } else if (e.key === 'Enter') {
        onConfirm();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onConfirm, onCancel]);

  if (!isOpen) return null;

  const typeStyles = {
    danger: {
      icon: (
        <svg className="w-5 h-5 sm:w-6 sm:h-6 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
        </svg>
      ),
      confirmButton: 'bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white',
      iconBg: isDark ? 'bg-red-500/20' : 'bg-red-100/50',
    },
    warning: {
      icon: (
        <svg className="w-5 h-5 sm:w-6 sm:h-6 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
      ),
      confirmButton: 'bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white',
      iconBg: isDark ? 'bg-amber-500/20' : 'bg-amber-100/50',
    },
    info: {
      icon: (
        <svg className="w-5 h-5 sm:w-6 sm:h-6 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      confirmButton: 'bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white',
      iconBg: isDark ? 'bg-blue-500/20' : 'bg-blue-100/50',
    },
  };

  const styles = typeStyles[type];

  return (
    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4">
      {/* 背景遮罩 */}
      <div 
        className={cn(
          "absolute inset-0 backdrop-blur-md animate-fade-in",
          isDark ? "bg-black/50" : "bg-black/25"
        )}
        onClick={onCancel}
      />
      
      {/* 对话框 */}
      <div className={cn(
        "relative backdrop-blur-xl rounded-t-2xl sm:rounded-2xl shadow-2xl border w-full sm:max-w-sm overflow-hidden",
        "animate-slide-up sm:animate-scale-in",
        isDark 
          ? "bg-gray-900/85 border-white/10" 
          : "bg-white/70 border-white/40"
      )}>
        <div className="p-5 sm:p-6">
          {/* 图标和标题 */}
          <div className="flex items-center gap-3 sm:gap-4 mb-4">
            <div className={cn(
              "p-2.5 sm:p-3 rounded-xl shadow-inner",
              styles.iconBg
            )}>
              {styles.icon}
            </div>
            <h3 className={cn(
              "text-base sm:text-lg font-bold tracking-tight",
              isDark ? "text-white" : "text-gray-800"
            )}>{title}</h3>
          </div>
          
          {/* 消息内容 */}
          <p className={cn(
            "text-sm sm:text-base ml-0 sm:ml-[56px] mb-6 leading-relaxed",
            isDark ? "text-gray-400" : "text-gray-600"
          )}>{message}</p>
          
          {/* 按钮 */}
          <div className="flex flex-col-reverse sm:flex-row gap-2.5 sm:gap-3 sm:justify-end">
            <button
              onClick={onCancel}
              className={cn(
                "w-full sm:w-auto px-5 py-3 sm:py-2.5 rounded-xl font-medium border btn-press",
                "transition-all duration-200",
                isDark 
                  ? "bg-white/10 hover:bg-white/20 text-gray-300 border-white/10" 
                  : "bg-white/50 hover:bg-white/70 active:bg-white/80 text-gray-700 border-white/40"
              )}
            >
              {cancelText}
            </button>
            <button
              ref={confirmButtonRef}
              onClick={onConfirm}
              className={cn(
                "w-full sm:w-auto px-5 py-3 sm:py-2.5 rounded-xl font-medium shadow-lg btn-press",
                "transition-all duration-200",
                styles.confirmButton
              )}
            >
              {confirmText}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
