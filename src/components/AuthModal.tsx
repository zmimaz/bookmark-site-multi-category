import React, { useState, useEffect } from 'react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLogin: (password: string) => Promise<boolean>;
  onLogout: () => void;
  onChangePassword: (oldPassword: string, newPassword: string) => Promise<boolean>;
  isLoggedIn: boolean;
  isDark: boolean;
}

type TabType = 'login' | 'changePassword';

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  onLogin,
  onLogout,
  onChangePassword,
  isLoggedIn,
  isDark,
}) => {
  const [_activeTab, setActiveTab] = useState<TabType>('login');
  const [password, setPassword] = useState('');
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (isOpen) {
      setPassword('');
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setError('');
      setSuccess('');
      setActiveTab(isLoggedIn ? 'changePassword' : 'login');
    }
  }, [isOpen, isLoggedIn]);

  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!password.trim()) {
      setError('请输入密码');
      return;
    }

    setIsLoading(true);
    try {
      const result = await onLogin(password);
      if (result) {
        onClose();
      } else {
        setError('密码错误');
        setPassword('');
      }
    } catch {
      setError('登录失败，请重试');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    onLogout();
    onClose();
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!oldPassword.trim()) {
      setError('请输入当前密码');
      return;
    }

    if (!newPassword.trim()) {
      setError('请输入新密码');
      return;
    }

    if (newPassword.length < 4) {
      setError('新密码至少需要4个字符');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('两次输入的密码不一致');
      return;
    }

    setIsLoading(true);
    try {
      const result = await onChangePassword(oldPassword, newPassword);
      if (result) {
        setSuccess('密码修改成功');
        setOldPassword('');
        setNewPassword('');
        setConfirmPassword('');
        setTimeout(() => {
          onClose();
        }, 1500);
      } else {
        setError('当前密码错误');
      }
    } catch {
      setError('修改失败，请重试');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:items-center"
      onClick={onClose}
    >
      {/* 背景遮罩 */}
      <div className={`absolute inset-0 ${isDark ? 'bg-black/50' : 'bg-black/30'}`} />
      
      {/* 模态框 */}
      <div
        onClick={(e) => e.stopPropagation()}
        className={`relative w-full max-w-sm rounded-2xl shadow-2xl overflow-hidden
          ${isDark 
            ? 'bg-gray-900/80 border border-white/10' 
            : 'bg-white/70 border border-white/50'
          } backdrop-blur-xl animate-in fade-in zoom-in-95 duration-200`}
      >
        {/* 头部 */}
        <div className={`px-6 py-4 border-b ${isDark ? 'border-white/10' : 'border-gray-200/50'}`}>
          <div className="flex items-center justify-between">
            <h2 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-800'}`}>
              {isLoggedIn ? '管理员设置' : '管理员登录'}
            </h2>
            <button
              onClick={onClose}
              className={`p-2 rounded-full transition-colors
                ${isDark 
                  ? 'hover:bg-white/10 text-gray-400 hover:text-white' 
                  : 'hover:bg-gray-100 text-gray-500 hover:text-gray-700'
                }`}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* 内容 */}
        <div className="p-6">
          {isLoggedIn ? (
            <div className="space-y-4">
              {/* 已登录状态 */}
              <div className={`flex items-center gap-3 p-4 rounded-xl ${isDark ? 'bg-green-500/20' : 'bg-green-50'}`}>
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${isDark ? 'bg-green-500/30' : 'bg-green-100'}`}>
                  <svg className={`w-5 h-5 ${isDark ? 'text-green-400' : 'text-green-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <div>
                  <p className={`font-medium ${isDark ? 'text-green-400' : 'text-green-700'}`}>已登录</p>
                  <p className={`text-sm ${isDark ? 'text-green-400/70' : 'text-green-600'}`}>您拥有管理员权限</p>
                </div>
              </div>

              {/* 修改密码表单 */}
              <form onSubmit={handleChangePassword} className="space-y-4">
                <div className={`text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                  修改密码
                </div>
                
                <div>
                  <input
                    type="password"
                    value={oldPassword}
                    onChange={(e) => setOldPassword(e.target.value)}
                    placeholder="当前密码"
                    className={`w-full px-4 py-3 rounded-xl border transition-all
                      ${isDark 
                        ? 'bg-white/5 border-white/10 text-white placeholder-gray-500 focus:border-indigo-500/50 focus:bg-white/10' 
                        : 'bg-white/50 border-gray-200 text-gray-800 placeholder-gray-400 focus:border-indigo-400 focus:bg-white/80'
                      } focus:outline-none focus:ring-2 focus:ring-indigo-500/20`}
                  />
                </div>

                <div>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="新密码"
                    className={`w-full px-4 py-3 rounded-xl border transition-all
                      ${isDark 
                        ? 'bg-white/5 border-white/10 text-white placeholder-gray-500 focus:border-indigo-500/50 focus:bg-white/10' 
                        : 'bg-white/50 border-gray-200 text-gray-800 placeholder-gray-400 focus:border-indigo-400 focus:bg-white/80'
                      } focus:outline-none focus:ring-2 focus:ring-indigo-500/20`}
                  />
                </div>

                <div>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="确认新密码"
                    className={`w-full px-4 py-3 rounded-xl border transition-all
                      ${isDark 
                        ? 'bg-white/5 border-white/10 text-white placeholder-gray-500 focus:border-indigo-500/50 focus:bg-white/10' 
                        : 'bg-white/50 border-gray-200 text-gray-800 placeholder-gray-400 focus:border-indigo-400 focus:bg-white/80'
                      } focus:outline-none focus:ring-2 focus:ring-indigo-500/20`}
                  />
                </div>

                {error && (
                  <p className="text-sm text-red-500 flex items-center gap-1">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    {error}
                  </p>
                )}

                {success && (
                  <p className="text-sm text-green-500 flex items-center gap-1">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    {success}
                  </p>
                )}

                <button
                  type="submit"
                  className={`w-full py-3 rounded-xl font-medium transition-all
                    ${isDark
                      ? 'bg-indigo-600 hover:bg-indigo-500 text-white'
                      : 'bg-indigo-500 hover:bg-indigo-600 text-white'
                    } shadow-lg shadow-indigo-500/25`}
                >
                  修改密码
                </button>
              </form>

              {/* 退出登录按钮 */}
              <button
                onClick={handleLogout}
                className={`w-full py-3 rounded-xl font-medium transition-all
                  ${isDark
                    ? 'bg-red-500/20 hover:bg-red-500/30 text-red-400'
                    : 'bg-red-50 hover:bg-red-100 text-red-600'
                  }`}
              >
                退出登录
              </button>
            </div>
          ) : (
            <form onSubmit={handleLogin} className="space-y-4">
              {/* 登录图标 */}
              <div className="flex justify-center mb-6">
                <div className={`w-20 h-20 rounded-2xl flex items-center justify-center
                  ${isDark ? 'bg-indigo-500/20' : 'bg-indigo-50'}`}>
                  <svg className={`w-10 h-10 ${isDark ? 'text-indigo-400' : 'text-indigo-500'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
              </div>

              <div>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="请输入管理员密码"
                  autoFocus
                  className={`w-full px-4 py-3 rounded-xl border transition-all text-center text-lg tracking-widest
                    ${isDark 
                      ? 'bg-white/5 border-white/10 text-white placeholder-gray-500 focus:border-indigo-500/50 focus:bg-white/10' 
                      : 'bg-white/50 border-gray-200 text-gray-800 placeholder-gray-400 focus:border-indigo-400 focus:bg-white/80'
                    } focus:outline-none focus:ring-2 focus:ring-indigo-500/20`}
                />
              </div>

              {error && (
                <p className="text-sm text-red-500 flex items-center justify-center gap-1">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  {error}
                </p>
              )}

              <button
                type="submit"
                disabled={isLoading}
                className={`w-full py-3 rounded-xl font-medium transition-all
                  ${isDark
                    ? 'bg-indigo-600 hover:bg-indigo-500 text-white'
                    : 'bg-indigo-500 hover:bg-indigo-600 text-white'
                  } shadow-lg shadow-indigo-500/25 disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                {isLoading ? '登录中...' : '登录'}
              </button>

              <p className={`text-xs text-center ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                默认密码: admin
              </p>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
