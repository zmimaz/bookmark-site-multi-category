import { useState, useRef, useEffect } from 'react';
import { X, Palette, Image, RotateCcw, Check, Sun, Moon, Monitor } from 'lucide-react';
import { cn } from '@/utils/cn';
import { ThemeConfig, ThemeMode, BackgroundConfig } from '@/types';

export const DEFAULT_LIGHT_BACKGROUND: BackgroundConfig = {
  type: 'gradient',
  value: 'linear-gradient(to bottom right, #f1f5f9, #eff6ff, #eef2ff)',
  blur: 0,
  opacity: 100,
};

export const DEFAULT_DARK_BACKGROUND: BackgroundConfig = {
  type: 'gradient',
  value: 'linear-gradient(to bottom right, #0f172a, #1e293b, #334155)',
  blur: 0,
  opacity: 100,
};

export const DEFAULT_THEME: ThemeConfig = {
  mode: 'system',
  lightBackground: DEFAULT_LIGHT_BACKGROUND,
  darkBackground: DEFAULT_DARK_BACKGROUND,
};

// 预设渐变 - 浅色
const LIGHT_GRADIENTS = [
  { name: '默认', value: 'linear-gradient(to bottom right, #f1f5f9, #eff6ff, #eef2ff)' },
  { name: '日落', value: 'linear-gradient(to bottom right, #fdf2f8, #fce7f3, #fbcfe8)' },
  { name: '海洋', value: 'linear-gradient(to bottom right, #ecfeff, #cffafe, #a5f3fc)' },
  { name: '森林', value: 'linear-gradient(to bottom right, #f0fdf4, #dcfce7, #bbf7d0)' },
  { name: '薰衣草', value: 'linear-gradient(to bottom right, #faf5ff, #f3e8ff, #e9d5ff)' },
  { name: '暖阳', value: 'linear-gradient(to bottom right, #fffbeb, #fef3c7, #fde68a)' },
  { name: '极简白', value: 'linear-gradient(to bottom, #ffffff, #f8fafc)' },
  { name: '彩虹', value: 'linear-gradient(to right, #fecaca, #fed7aa, #fef08a, #bbf7d0, #a5f3fc, #c4b5fd)' },
];

// 预设渐变 - 深色
const DARK_GRADIENTS = [
  { name: '默认', value: 'linear-gradient(to bottom right, #0f172a, #1e293b, #334155)' },
  { name: '深空', value: 'linear-gradient(to bottom right, #1e1b4b, #312e81, #4338ca)' },
  { name: '极光', value: 'linear-gradient(to bottom right, #0f172a, #1e3a5f, #0d9488)' },
  { name: '晚霞', value: 'linear-gradient(to bottom right, #4c1d95, #be185d, #ea580c)' },
  { name: '星空', value: 'linear-gradient(to bottom right, #020617, #0f172a, #1e293b)' },
  { name: '暗夜森林', value: 'linear-gradient(to bottom right, #022c22, #064e3b, #065f46)' },
  { name: '深海', value: 'linear-gradient(to bottom right, #0c4a6e, #0369a1, #0284c7)' },
  { name: '熔岩', value: 'linear-gradient(to bottom right, #450a0a, #7f1d1d, #b91c1c)' },
];

// 预设纯色 - 浅色
const LIGHT_COLORS = [
  '#ffffff', '#f8fafc', '#f1f5f9', '#e2e8f0',
  '#fef2f2', '#fee2e2', '#fecaca', '#fca5a5',
  '#fffbeb', '#fef3c7', '#fde68a', '#fcd34d',
  '#f0fdf4', '#dcfce7', '#bbf7d0', '#86efac',
  '#ecfeff', '#cffafe', '#a5f3fc', '#67e8f9',
  '#eff6ff', '#dbeafe', '#bfdbfe', '#93c5fd',
  '#faf5ff', '#f3e8ff', '#e9d5ff', '#d8b4fe',
  '#fdf2f8', '#fce7f3', '#fbcfe8', '#f9a8d4',
];

// 预设纯色 - 深色
const DARK_COLORS = [
  '#020617', '#0f172a', '#1e293b', '#334155',
  '#18181b', '#27272a', '#3f3f46', '#52525b',
  '#450a0a', '#7f1d1d', '#991b1b', '#b91c1c',
  '#422006', '#713f12', '#854d0e', '#a16207',
  '#052e16', '#14532d', '#166534', '#15803d',
  '#083344', '#164e63', '#155e75', '#0e7490',
  '#1e1b4b', '#312e81', '#3730a3', '#4338ca',
  '#4a044e', '#701a75', '#86198f', '#a21caf',
];

interface ThemeSettingsProps {
  isOpen: boolean;
  onClose: () => void;
  config: ThemeConfig;
  onChange: (config: ThemeConfig) => void;
  onReset: () => void;
  effectiveMode: 'light' | 'dark';
  canEdit: boolean;
  onSetAsDefault: () => void;
  isDefaultTheme: boolean;
}

export function ThemeSettings({ isOpen, onClose, config, onChange, onReset, effectiveMode, canEdit, onSetAsDefault, isDefaultTheme }: ThemeSettingsProps) {
  const [activeTab, setActiveTab] = useState<'mode' | 'background'>('mode');
  const [bgType, setBgType] = useState<'gradient' | 'solid' | 'image'>('gradient');
  const [customColor, setCustomColor] = useState('#ffffff');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 获取当前模式对应的背景配置
  const currentBackground = effectiveMode === 'dark' ? config.darkBackground : config.lightBackground;
  const gradients = effectiveMode === 'dark' ? DARK_GRADIENTS : LIGHT_GRADIENTS;
  const colors = effectiveMode === 'dark' ? DARK_COLORS : LIGHT_COLORS;

  useEffect(() => {
    if (isOpen) {
      setBgType(currentBackground.type);
    }
  }, [isOpen, currentBackground.type]);

  if (!isOpen) return null;

  const isDark = effectiveMode === 'dark';

  const handleModeChange = (mode: ThemeMode) => {
    onChange({ ...config, mode });
  };

  const updateBackground = (bg: BackgroundConfig) => {
    if (effectiveMode === 'dark') {
      onChange({ ...config, darkBackground: bg });
    } else {
      onChange({ ...config, lightBackground: bg });
    }
  };

  const handleGradientSelect = (gradient: string) => {
    updateBackground({ ...currentBackground, type: 'gradient', value: gradient });
  };

  const handleColorSelect = (color: string) => {
    updateBackground({ ...currentBackground, type: 'solid', value: color });
  };

  const handleCustomColorChange = (color: string) => {
    setCustomColor(color);
    updateBackground({ ...currentBackground, type: 'solid', value: color });
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        updateBackground({
          type: 'image',
          value: reader.result as string,
          blur: currentBackground.blur ?? 0,
          opacity: currentBackground.opacity ?? 100,
        });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleBlurChange = (blur: number) => {
    updateBackground({ ...currentBackground, blur });
  };

  const handleOpacityChange = (opacity: number) => {
    updateBackground({ ...currentBackground, opacity });
  };

  return (
    <div className={cn(
      "fixed inset-0 flex items-end sm:items-center justify-center z-50 p-0 sm:p-4",
      isDark ? "bg-black/40" : "bg-black/20",
      "backdrop-blur-md"
    )}>
      <div className={cn(
        "rounded-t-3xl sm:rounded-3xl w-full sm:max-w-lg shadow-2xl max-h-[90vh] flex flex-col",
        isDark 
          ? "bg-gray-900/70 backdrop-blur-xl border border-white/10" 
          : "bg-white/50 backdrop-blur-xl border border-white/30"
      )}>
        {/* 头部 */}
        <div className={cn(
          "flex items-center justify-between p-4 sm:p-5 border-b flex-shrink-0",
          isDark ? "border-white/10" : "border-gray-200/50"
        )}>
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-lg shadow-violet-500/30">
              <Palette className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
            </div>
            <h2 className={cn(
              "text-base sm:text-lg font-semibold",
              isDark ? "text-white" : "text-gray-900"
            )}>主题设置</h2>
          </div>
          <button 
            onClick={onClose} 
            className={cn(
              "p-2 rounded-xl transition-colors",
              isDark ? "hover:bg-white/10 text-gray-400" : "hover:bg-white/40 text-gray-600"
            )}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab 切换 */}
        <div className="p-4 sm:p-5 pb-0">
          <div className={cn(
            "flex gap-1 sm:gap-2 rounded-xl p-1 sm:p-1.5 border",
            isDark 
              ? "bg-white/5 border-white/10" 
              : "bg-white/30 border-white/20"
          )}>
            {[
              { type: 'mode' as const, label: '主题模式', icon: '🌓' },
              { type: 'background' as const, label: '背景设置', icon: '🎨' },
            ].map(({ type, label, icon }) => (
              <button
                key={type}
                onClick={() => setActiveTab(type)}
                className={cn(
                  "flex-1 flex items-center justify-center gap-1 sm:gap-2 py-2.5 rounded-lg text-sm font-medium transition-all",
                  activeTab === type
                    ? isDark 
                      ? "bg-white/10 text-white shadow-md" 
                      : "bg-white/60 text-gray-900 shadow-md"
                    : isDark
                      ? "text-gray-400 hover:text-white hover:bg-white/5"
                      : "text-gray-600 hover:text-gray-900 hover:bg-white/40"
                )}
              >
                <span>{icon}</span>
                <span>{label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* 内容区 */}
        <div className="p-4 sm:p-5 overflow-y-auto flex-1 space-y-4 sm:space-y-5">
          {/* 主题模式 */}
          {activeTab === 'mode' && (
            <div className="space-y-4">
              <p className={cn(
                "text-sm font-medium",
                isDark ? "text-gray-400" : "text-gray-600"
              )}>选择主题模式</p>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { mode: 'system' as ThemeMode, label: '跟随系统', icon: Monitor, desc: '自动' },
                  { mode: 'light' as ThemeMode, label: '浅色模式', icon: Sun, desc: '明亮' },
                  { mode: 'dark' as ThemeMode, label: '深色模式', icon: Moon, desc: '护眼' },
                ].map(({ mode, label, icon: Icon, desc }) => (
                  <button
                    key={mode}
                    onClick={() => handleModeChange(mode)}
                    className={cn(
                      "relative flex flex-col items-center gap-2 p-4 rounded-2xl border-2 transition-all",
                      config.mode === mode
                        ? "border-indigo-500 ring-2 ring-indigo-500/30"
                        : isDark
                          ? "border-white/10 hover:border-white/30"
                          : "border-white/50 hover:border-indigo-300"
                    )}
                  >
                    <div className={cn(
                      "w-12 h-12 rounded-xl flex items-center justify-center",
                      mode === 'system' 
                        ? "bg-gradient-to-br from-amber-400 to-indigo-600"
                        : mode === 'light'
                          ? "bg-gradient-to-br from-amber-400 to-orange-500"
                          : "bg-gradient-to-br from-indigo-600 to-purple-700"
                    )}>
                      <Icon className="w-6 h-6 text-white" />
                    </div>
                    <div className="text-center">
                      <p className={cn(
                        "text-sm font-medium",
                        isDark ? "text-white" : "text-gray-900"
                      )}>{label}</p>
                      <p className={cn(
                        "text-xs",
                        isDark ? "text-gray-500" : "text-gray-500"
                      )}>{desc}</p>
                    </div>
                    {config.mode === mode && (
                      <div className="absolute top-2 right-2 w-5 h-5 bg-indigo-500 rounded-full flex items-center justify-center">
                        <Check className="w-3 h-3 text-white" />
                      </div>
                    )}
                  </button>
                ))}
              </div>

              {/* 当前模式提示 */}
              <div className={cn(
                "p-4 rounded-xl text-sm",
                isDark ? "bg-white/5 text-gray-400" : "bg-white/40 text-gray-600"
              )}>
                <p>当前显示: <span className={cn(
                  "font-medium",
                  isDark ? "text-white" : "text-gray-900"
                )}>{effectiveMode === 'dark' ? '深色模式' : '浅色模式'}</span></p>
                {config.mode === 'system' && (
                  <p className="mt-1 text-xs opacity-70">根据系统设置自动切换</p>
                )}
              </div>
            </div>
          )}

          {/* 背景设置 */}
          {activeTab === 'background' && (
            <div className="space-y-4">
              {/* 背景类型 Tab */}
              <div className={cn(
                "flex gap-1 rounded-xl p-1 border",
                isDark ? "bg-white/5 border-white/10" : "bg-white/30 border-white/20"
              )}>
                {[
                  { type: 'gradient' as const, label: '渐变', icon: '🌈' },
                  { type: 'solid' as const, label: '纯色', icon: '🎨' },
                  { type: 'image' as const, label: '图片', icon: '🖼️' },
                ].map(({ type, label, icon }) => (
                  <button
                    key={type}
                    onClick={() => setBgType(type)}
                    className={cn(
                      "flex-1 flex items-center justify-center gap-1 py-2 rounded-lg text-sm font-medium transition-all",
                      bgType === type
                        ? isDark
                          ? "bg-white/10 text-white shadow-md"
                          : "bg-white/60 text-gray-900 shadow-md"
                        : isDark
                          ? "text-gray-400 hover:text-white hover:bg-white/5"
                          : "text-gray-600 hover:text-gray-900 hover:bg-white/40"
                    )}
                  >
                    <span>{icon}</span>
                    <span className="hidden sm:inline">{label}</span>
                  </button>
                ))}
              </div>

              <p className={cn(
                "text-xs",
                isDark ? "text-gray-500" : "text-gray-500"
              )}>
                正在设置 <span className="font-medium">{effectiveMode === 'dark' ? '深色模式' : '浅色模式'}</span> 的背景
              </p>

              {/* 渐变选项 */}
              {bgType === 'gradient' && (
                <div className="space-y-3">
                  <div className="grid grid-cols-4 gap-2 sm:gap-3">
                    {gradients.map((gradient) => (
                      <button
                        key={gradient.name}
                        onClick={() => handleGradientSelect(gradient.value)}
                        className={cn(
                          "relative h-14 sm:h-16 rounded-xl border-2 transition-all overflow-hidden group",
                          currentBackground.type === 'gradient' && currentBackground.value === gradient.value
                            ? "border-indigo-500 ring-2 ring-indigo-500/30"
                            : isDark
                              ? "border-white/20 hover:border-indigo-400"
                              : "border-white/50 hover:border-indigo-300"
                        )}
                        style={{ background: gradient.value }}
                      >
                        <div className="absolute inset-x-0 bottom-0 bg-black/40 backdrop-blur-sm py-0.5 text-[10px] text-white font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                          {gradient.name}
                        </div>
                        {currentBackground.type === 'gradient' && currentBackground.value === gradient.value && (
                          <div className="absolute top-1 right-1 w-4 h-4 bg-indigo-500 rounded-full flex items-center justify-center">
                            <Check className="w-2.5 h-2.5 text-white" />
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* 纯色选项 */}
              {bgType === 'solid' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-8 gap-2">
                    {colors.map((color) => (
                      <button
                        key={color}
                        onClick={() => handleColorSelect(color)}
                        className={cn(
                          "w-full aspect-square rounded-lg border-2 transition-all",
                          currentBackground.type === 'solid' && currentBackground.value === color
                            ? "border-indigo-500 ring-2 ring-indigo-500/30 scale-110"
                            : isDark
                              ? "border-white/20 hover:scale-105"
                              : "border-white/50 hover:scale-105"
                        )}
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </div>

                  <div>
                    <p className={cn(
                      "text-sm font-medium mb-2",
                      isDark ? "text-gray-400" : "text-gray-600"
                    )}>自定义颜色</p>
                    <div className="flex items-center gap-3">
                      <input
                        type="color"
                        value={customColor}
                        onChange={(e) => handleCustomColorChange(e.target.value)}
                        className="w-10 h-10 rounded-xl cursor-pointer border-2 border-white/30"
                      />
                      <input
                        type="text"
                        value={customColor}
                        onChange={(e) => handleCustomColorChange(e.target.value)}
                        placeholder="#FFFFFF"
                        className={cn(
                          "flex-1 px-4 py-2.5 border rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all uppercase font-mono text-sm",
                          isDark
                            ? "bg-white/5 border-white/10 text-white focus:bg-white/10"
                            : "bg-white/30 border-white/20 focus:bg-white/50"
                        )}
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* 图片选项 */}
              {bgType === 'image' && (
                <div className="space-y-4">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                  />

                  {/* 当前图片预览 */}
                  {currentBackground.type === 'image' && currentBackground.value && (
                    <div className="relative h-28 sm:h-36 rounded-xl overflow-hidden border border-white/30">
                      <img
                        src={currentBackground.value}
                        alt="背景预览"
                        className="w-full h-full object-cover"
                        style={{
                          filter: `blur(${currentBackground.blur || 0}px)`,
                          opacity: (currentBackground.opacity ?? 100) / 100,
                        }}
                      />
                      <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                        <span className="text-white text-sm font-medium bg-black/40 backdrop-blur-sm px-3 py-1 rounded-full">
                          当前背景
                        </span>
                      </div>
                    </div>
                  )}

                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className={cn(
                      "w-full flex items-center justify-center gap-3 py-5 sm:py-6 border-2 border-dashed rounded-xl transition-all group",
                      isDark
                        ? "border-white/20 hover:border-indigo-400 hover:bg-indigo-500/10"
                        : "border-white/40 hover:border-indigo-500/50 hover:bg-indigo-50/30"
                    )}
                  >
                    <Image className={cn(
                      "w-6 h-6 transition-colors",
                      isDark ? "text-gray-500 group-hover:text-indigo-400" : "text-gray-400 group-hover:text-indigo-500"
                    )} />
                    <span className={cn(
                      "font-medium text-sm",
                      isDark ? "text-gray-400 group-hover:text-indigo-400" : "text-gray-600 group-hover:text-indigo-600"
                    )}>
                      点击上传图片
                    </span>
                  </button>

                  {currentBackground.type === 'image' && currentBackground.value && (
                    <>
                      {/* 模糊度调节 */}
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <p className={cn("text-sm font-medium", isDark ? "text-gray-400" : "text-gray-600")}>模糊度</p>
                          <span className={cn("text-sm", isDark ? "text-gray-500" : "text-gray-500")}>{currentBackground.blur ?? 0}px</span>
                        </div>
                        <input
                          type="range"
                          min="0"
                          max="20"
                          value={currentBackground.blur ?? 0}
                          onChange={(e) => handleBlurChange(Number(e.target.value))}
                          className="w-full h-2 bg-white/20 rounded-full appearance-none cursor-pointer accent-indigo-500"
                        />
                      </div>

                      {/* 透明度调节 */}
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <p className={cn("text-sm font-medium", isDark ? "text-gray-400" : "text-gray-600")}>亮度</p>
                          <span className={cn("text-sm", isDark ? "text-gray-500" : "text-gray-500")}>{currentBackground.opacity ?? 100}%</span>
                        </div>
                        <input
                          type="range"
                          min="20"
                          max="100"
                          value={currentBackground.opacity ?? 100}
                          onChange={(e) => handleOpacityChange(Number(e.target.value))}
                          className="w-full h-2 bg-white/20 rounded-full appearance-none cursor-pointer accent-indigo-500"
                        />
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* 底部按钮 */}
        <div className={cn(
          "flex flex-col gap-3 p-4 sm:p-5 border-t flex-shrink-0",
          isDark ? "border-white/10" : "border-gray-200/50"
        )}>
          {/* 管理员设置默认主题 */}
          {canEdit && (
            <button
              onClick={onSetAsDefault}
              disabled={isDefaultTheme}
              className={cn(
                "w-full flex items-center justify-center gap-2 px-4 py-3 sm:py-2.5 rounded-xl font-medium transition-all border",
                isDefaultTheme
                  ? isDark
                    ? "bg-green-500/20 border-green-500/30 text-green-400 cursor-default"
                    : "bg-green-100/50 border-green-300/50 text-green-600 cursor-default"
                  : isDark
                    ? "bg-amber-500/20 border-amber-500/30 text-amber-400 hover:bg-amber-500/30"
                    : "bg-amber-100/50 border-amber-300/50 text-amber-700 hover:bg-amber-200/50"
              )}
            >
              {isDefaultTheme ? (
                <>
                  <Check className="w-4 h-4" />
                  <span>已设为默认主题</span>
                </>
              ) : (
                <>
                  <Palette className="w-4 h-4" />
                  <span>设为访客默认主题</span>
                </>
              )}
            </button>
          )}
          
          <div className="flex gap-3">
            <button
              onClick={onReset}
              className={cn(
                "flex items-center justify-center gap-2 px-4 py-3 sm:py-2.5 rounded-xl font-medium transition-all",
                isDark
                  ? "bg-white/10 text-gray-300 hover:bg-white/20"
                  : "bg-white/40 text-gray-700 hover:bg-white/60"
              )}
            >
              <RotateCcw className="w-4 h-4" />
              <span className="hidden sm:inline">恢复默认</span>
            </button>
            <button
              onClick={onClose}
              className="flex-1 px-4 py-3 sm:py-2.5 bg-gradient-to-r from-indigo-500 to-purple-500 text-white rounded-xl hover:from-indigo-600 hover:to-purple-600 transition-all font-medium shadow-lg shadow-indigo-500/25"
            >
              完成
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
