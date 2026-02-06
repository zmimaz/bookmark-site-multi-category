import { useState, useEffect } from 'react';
import { getFile } from '@/services/fileStorage';

interface FilePreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  fileName: string;
  fileData?: string;
  fileId?: string;
  isDark: boolean;
}

type FileType = 'image' | 'pdf' | 'video' | 'audio' | 'text' | 'code' | 'unknown';

const getFileType = (fileName: string): FileType => {
  const ext = fileName.split('.').pop()?.toLowerCase() || '';
  
  const imageExts = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp', 'ico'];
  const pdfExts = ['pdf'];
  const videoExts = ['mp4', 'webm', 'ogg', 'mov', 'avi'];
  const audioExts = ['mp3', 'wav', 'ogg', 'aac', 'm4a', 'flac'];
  const textExts = ['txt', 'md', 'markdown', 'rtf'];
  const codeExts = ['js', 'jsx', 'ts', 'tsx', 'html', 'css', 'scss', 'less', 'json', 'xml', 'yaml', 'yml', 'py', 'java', 'c', 'cpp', 'h', 'hpp', 'cs', 'go', 'rs', 'php', 'rb', 'swift', 'kt', 'sql', 'sh', 'bash', 'zsh', 'ps1', 'bat', 'cmd'];
  
  if (imageExts.includes(ext)) return 'image';
  if (pdfExts.includes(ext)) return 'pdf';
  if (videoExts.includes(ext)) return 'video';
  if (audioExts.includes(ext)) return 'audio';
  if (textExts.includes(ext)) return 'text';
  if (codeExts.includes(ext)) return 'code';
  
  return 'unknown';
};

const getLanguage = (fileName: string): string => {
  const ext = fileName.split('.').pop()?.toLowerCase() || '';
  const langMap: Record<string, string> = {
    'js': 'JavaScript',
    'jsx': 'JavaScript (JSX)',
    'ts': 'TypeScript',
    'tsx': 'TypeScript (TSX)',
    'html': 'HTML',
    'css': 'CSS',
    'scss': 'SCSS',
    'less': 'Less',
    'json': 'JSON',
    'xml': 'XML',
    'yaml': 'YAML',
    'yml': 'YAML',
    'py': 'Python',
    'java': 'Java',
    'c': 'C',
    'cpp': 'C++',
    'h': 'C Header',
    'hpp': 'C++ Header',
    'cs': 'C#',
    'go': 'Go',
    'rs': 'Rust',
    'php': 'PHP',
    'rb': 'Ruby',
    'swift': 'Swift',
    'kt': 'Kotlin',
    'sql': 'SQL',
    'sh': 'Shell',
    'bash': 'Bash',
    'md': 'Markdown',
  };
  return langMap[ext] || ext.toUpperCase();
};

export function FilePreviewModal({ isOpen, onClose, fileName, fileData: initialFileData, fileId, isDark }: FilePreviewModalProps) {
  const [textContent, setTextContent] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [zoom, setZoom] = useState(100);
  const [fileData, setFileData] = useState<string>(initialFileData || '');
  
  const fileType = getFileType(fileName);
  
  // 如果有 fileId 但没有 fileData，从存储加载
  useEffect(() => {
    if (isOpen && fileId && !initialFileData) {
      setIsLoading(true);
      getFile(fileId).then((data) => {
        if (data) {
          setFileData(data.data);
        }
        setIsLoading(false);
      }).catch(() => {
        setIsLoading(false);
      });
    } else if (initialFileData) {
      setFileData(initialFileData);
    }
  }, [isOpen, fileId, initialFileData]);
  
  useEffect(() => {
    if (isOpen && (fileType === 'text' || fileType === 'code') && fileData) {
      setIsLoading(true);
      // 解码 base64 文本内容
      try {
        const base64Content = fileData.split(',')[1];
        const decodedContent = atob(base64Content);
        // 尝试 UTF-8 解码
        const uint8Array = new Uint8Array(decodedContent.length);
        for (let i = 0; i < decodedContent.length; i++) {
          uint8Array[i] = decodedContent.charCodeAt(i);
        }
        const decoder = new TextDecoder('utf-8');
        setTextContent(decoder.decode(uint8Array));
      } catch (e) {
        setTextContent('无法解析文件内容');
      }
      setIsLoading(false);
    }
  }, [isOpen, fileType, fileData]);
  
  useEffect(() => {
    if (isOpen) {
      setZoom(100);
    }
  }, [isOpen]);
  
  if (!isOpen) return null;
  
  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = fileData;
    link.download = fileName;
    link.click();
  };
  
  const handleZoomIn = () => setZoom(prev => Math.min(prev + 25, 300));
  const handleZoomOut = () => setZoom(prev => Math.max(prev - 25, 25));
  const handleZoomReset = () => setZoom(100);
  
  const renderPreview = () => {
    switch (fileType) {
      case 'image':
        return (
          <div className="flex-1 flex items-center justify-center overflow-auto p-4">
            <img
              src={fileData}
              alt={fileName}
              className="max-w-full max-h-full object-contain transition-transform duration-200"
              style={{ transform: `scale(${zoom / 100})` }}
            />
          </div>
        );
        
      case 'pdf':
        return (
          <div className="flex-1 w-full">
            <iframe
              src={fileData}
              className="w-full h-full border-0"
              title={fileName}
            />
          </div>
        );
        
      case 'video':
        return (
          <div className="flex-1 flex items-center justify-center p-4">
            <video
              src={fileData}
              controls
              className="max-w-full max-h-full rounded-lg shadow-lg"
              style={{ maxHeight: '70vh' }}
            >
              您的浏览器不支持视频播放
            </video>
          </div>
        );
        
      case 'audio':
        return (
          <div className="flex-1 flex flex-col items-center justify-center p-8 gap-6">
            <div className={`w-32 h-32 rounded-full flex items-center justify-center ${
              isDark ? 'bg-gradient-to-br from-purple-600 to-indigo-700' : 'bg-gradient-to-br from-purple-400 to-indigo-500'
            } shadow-xl`}>
              <svg className="w-16 h-16 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
              </svg>
            </div>
            <p className={`text-lg font-medium ${isDark ? 'text-gray-200' : 'text-gray-700'}`}>{fileName}</p>
            <audio
              src={fileData}
              controls
              className="w-full max-w-md"
            >
              您的浏览器不支持音频播放
            </audio>
          </div>
        );
        
      case 'text':
      case 'code':
        return (
          <div className="flex-1 flex flex-col overflow-hidden">
            {fileType === 'code' && (
              <div className={`px-4 py-2 text-sm border-b ${
                isDark ? 'bg-gray-800/50 border-gray-700 text-gray-400' : 'bg-gray-100/50 border-gray-200 text-gray-500'
              }`}>
                {getLanguage(fileName)}
              </div>
            )}
            <div className="flex-1 overflow-auto p-4">
              {isLoading ? (
                <div className="flex items-center justify-center h-full">
                  <div className="animate-spin w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full"></div>
                </div>
              ) : (
                <pre className={`text-sm font-mono whitespace-pre-wrap break-words ${
                  isDark ? 'text-gray-300' : 'text-gray-700'
                }`} style={{ fontSize: `${zoom}%` }}>
                  {textContent}
                </pre>
              )}
            </div>
          </div>
        );
        
      case 'unknown':
      default:
        return (
          <div className="flex-1 flex flex-col items-center justify-center p-8 gap-4">
            <div className={`w-24 h-24 rounded-2xl flex items-center justify-center ${
              isDark ? 'bg-gray-700' : 'bg-gray-200'
            }`}>
              <svg className={`w-12 h-12 ${isDark ? 'text-gray-500' : 'text-gray-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <p className={`text-lg font-medium ${isDark ? 'text-gray-200' : 'text-gray-700'}`}>{fileName}</p>
            <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
              此文件类型不支持预览
            </p>
            <button
              onClick={handleDownload}
              className="mt-4 px-6 py-3 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-xl font-medium hover:from-indigo-600 hover:to-purple-700 transition-all shadow-lg"
            >
              下载文件
            </button>
          </div>
        );
    }
  };
  
  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fadeIn"
      onClick={onClose}
    >
      {/* 背景遮罩 */}
      <div className={`absolute inset-0 ${isDark ? 'bg-black/70' : 'bg-black/50'} backdrop-blur-md`} />
      
      {/* 预览面板 */}
      <div 
        className={`relative w-full max-w-5xl h-[90vh] flex flex-col rounded-2xl overflow-hidden shadow-2xl animate-scaleIn ${
          isDark 
            ? 'bg-gray-900/95 border border-gray-700/50' 
            : 'bg-white/95 border border-gray-200/50'
        }`}
        onClick={e => e.stopPropagation()}
      >
        {/* 头部 */}
        <div className={`flex items-center justify-between px-4 py-3 border-b ${
          isDark ? 'border-gray-700/50 bg-gray-800/50' : 'border-gray-200/50 bg-gray-50/50'
        }`}>
          <div className="flex items-center gap-3 min-w-0">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
              fileType === 'image' ? 'bg-pink-500/20 text-pink-500' :
              fileType === 'pdf' ? 'bg-red-500/20 text-red-500' :
              fileType === 'video' ? 'bg-purple-500/20 text-purple-500' :
              fileType === 'audio' ? 'bg-indigo-500/20 text-indigo-500' :
              fileType === 'code' ? 'bg-green-500/20 text-green-500' :
              fileType === 'text' ? 'bg-blue-500/20 text-blue-500' :
              'bg-gray-500/20 text-gray-500'
            }`}>
              {fileType === 'image' && (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              )}
              {fileType === 'pdf' && (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
              )}
              {fileType === 'video' && (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              )}
              {fileType === 'audio' && (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
                </svg>
              )}
              {(fileType === 'text' || fileType === 'code') && (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                </svg>
              )}
              {fileType === 'unknown' && (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              )}
            </div>
            <div className="min-w-0">
              <h3 className={`font-semibold truncate ${isDark ? 'text-white' : 'text-gray-900'}`}>
                {fileName}
              </h3>
              <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                {fileType === 'image' && '图片'}
                {fileType === 'pdf' && 'PDF 文档'}
                {fileType === 'video' && '视频'}
                {fileType === 'audio' && '音频'}
                {fileType === 'text' && '文本文件'}
                {fileType === 'code' && '代码文件'}
                {fileType === 'unknown' && '文件'}
              </p>
            </div>
          </div>
          
          {/* 工具栏 */}
          <div className="flex items-center gap-2">
            {/* 缩放控制 - 仅图片和文本 */}
            {(fileType === 'image' || fileType === 'text' || fileType === 'code') && (
              <div className={`flex items-center gap-1 px-2 py-1 rounded-lg ${
                isDark ? 'bg-gray-700/50' : 'bg-gray-200/50'
              }`}>
                <button
                  onClick={handleZoomOut}
                  className={`p-1.5 rounded-md transition-colors ${
                    isDark ? 'hover:bg-gray-600 text-gray-300' : 'hover:bg-gray-300 text-gray-600'
                  }`}
                  title="缩小"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                  </svg>
                </button>
                <button
                  onClick={handleZoomReset}
                  className={`px-2 py-0.5 text-xs font-medium rounded transition-colors ${
                    isDark ? 'hover:bg-gray-600 text-gray-300' : 'hover:bg-gray-300 text-gray-600'
                  }`}
                  title="重置缩放"
                >
                  {zoom}%
                </button>
                <button
                  onClick={handleZoomIn}
                  className={`p-1.5 rounded-md transition-colors ${
                    isDark ? 'hover:bg-gray-600 text-gray-300' : 'hover:bg-gray-300 text-gray-600'
                  }`}
                  title="放大"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                </button>
              </div>
            )}
            
            {/* 下载按钮 */}
            <button
              onClick={handleDownload}
              className={`p-2 rounded-lg transition-colors ${
                isDark ? 'hover:bg-gray-700 text-gray-300' : 'hover:bg-gray-200 text-gray-600'
              }`}
              title="下载"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
            </button>
            
            {/* 关闭按钮 */}
            <button
              onClick={onClose}
              className={`p-2 rounded-lg transition-colors ${
                isDark ? 'hover:bg-gray-700 text-gray-300' : 'hover:bg-gray-200 text-gray-600'
              }`}
              title="关闭"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
        
        {/* 预览内容 */}
        {renderPreview()}
      </div>
    </div>
  );
}
