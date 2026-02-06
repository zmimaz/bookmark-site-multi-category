// 使用 IndexedDB 存储大文件，支持云端同步

import { api, isCloudEnvironment } from './api';

const DB_NAME = 'bookmark-files';
const DB_VERSION = 1;
const STORE_NAME = 'files';

let db: IDBDatabase | null = null;

// 初始化数据库
function initDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (db) {
      resolve(db);
      return;
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => {
      reject(new Error('Failed to open IndexedDB'));
    };

    request.onsuccess = () => {
      db = request.result;
      resolve(db);
    };

    request.onupgradeneeded = (event) => {
      const database = (event.target as IDBOpenDBRequest).result;
      if (!database.objectStoreNames.contains(STORE_NAME)) {
        database.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    };
  });
}

// 保存文件到本地 IndexedDB
async function saveFileLocal(id: string, data: string, name: string, type: string): Promise<void> {
  try {
    const database = await initDB();
    return new Promise((resolve, reject) => {
      const transaction = database.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      
      const request = store.put({
        id,
        data,
        name,
        type,
        createdAt: Date.now()
      });

      request.onsuccess = () => resolve();
      request.onerror = () => reject(new Error('Failed to save file'));
    });
  } catch (error) {
    console.error('saveFileLocal error:', error);
    // 降级到 localStorage（小文件）
    try {
      localStorage.setItem(`file-${id}`, JSON.stringify({ data, name, type }));
    } catch {
      console.error('localStorage also failed');
    }
  }
}

// 从本地获取文件
async function getFileLocal(id: string): Promise<{ data: string; name: string; type: string } | null> {
  try {
    const database = await initDB();
    return new Promise((resolve, reject) => {
      const transaction = database.transaction([STORE_NAME], 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      
      const request = store.get(id);

      request.onsuccess = () => {
        if (request.result) {
          resolve({
            data: request.result.data,
            name: request.result.name,
            type: request.result.type
          });
        } else {
          // 尝试从 localStorage 获取
          const localData = localStorage.getItem(`file-${id}`);
          if (localData) {
            resolve(JSON.parse(localData));
          } else {
            resolve(null);
          }
        }
      };
      request.onerror = () => reject(new Error('Failed to get file'));
    });
  } catch (error) {
    console.error('getFileLocal error:', error);
    // 降级到 localStorage
    const localData = localStorage.getItem(`file-${id}`);
    if (localData) {
      return JSON.parse(localData);
    }
    return null;
  }
}

// 保存文件 - 优先云端，本地作为缓存
export async function saveFile(id: string, data: string, name: string, type: string): Promise<string> {
  // 如果在云端环境且已登录，上传到云端
  if (isCloudEnvironment() && api.isLoggedIn()) {
    try {
      // 将 base64 转换为 File 对象
      const byteString = atob(data.split(',')[1] || data);
      const mimeType = type || 'application/octet-stream';
      const ab = new ArrayBuffer(byteString.length);
      const ia = new Uint8Array(ab);
      for (let i = 0; i < byteString.length; i++) {
        ia[i] = byteString.charCodeAt(i);
      }
      const blob = new Blob([ab], { type: mimeType });
      const file = new File([blob], name, { type: mimeType });
      
      // 上传到云端
      const result = await api.uploadFile(file);
      if (result.fileId) {
        // 同时保存到本地作为缓存
        await saveFileLocal(result.fileId, data, name, type);
        return result.fileId;
      }
    } catch (error) {
      console.error('Cloud upload failed, saving locally:', error);
    }
  }
  
  // 保存到本地
  await saveFileLocal(id, data, name, type);
  return id;
}

// 获取文件 - 优先本地缓存，然后云端
export async function getFile(id: string): Promise<{ data: string; name: string; type: string } | null> {
  // 先尝试从本地获取
  const localFile = await getFileLocal(id);
  if (localFile) {
    return localFile;
  }
  
  // 如果本地没有且在云端环境，从云端获取
  if (isCloudEnvironment()) {
    try {
      const response = await fetch(api.getFileUrl(id));
      if (response.ok) {
        const blob = await response.blob();
        const reader = new FileReader();
        
        return new Promise((resolve) => {
          reader.onload = async () => {
            const data = reader.result as string;
            const name = response.headers.get('X-File-Name') || 'file';
            const type = blob.type;
            
            // 缓存到本地
            await saveFileLocal(id, data, name, type);
            
            resolve({ data, name, type });
          };
          reader.onerror = () => resolve(null);
          reader.readAsDataURL(blob);
        });
      }
    } catch (error) {
      console.error('Failed to fetch from cloud:', error);
    }
  }
  
  return null;
}

// 删除文件
export async function deleteFile(id: string): Promise<void> {
  try {
    const database = await initDB();
    return new Promise((resolve, reject) => {
      const transaction = database.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      
      const request = store.delete(id);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(new Error('Failed to delete file'));
    });
  } catch (error) {
    console.error('deleteFile error:', error);
  }
  
  // 也尝试从 localStorage 删除
  localStorage.removeItem(`file-${id}`);
}

// 获取所有文件 ID
export async function getAllFileIds(): Promise<string[]> {
  try {
    const database = await initDB();
    return new Promise((resolve, reject) => {
      const transaction = database.transaction([STORE_NAME], 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      
      const request = store.getAllKeys();

      request.onsuccess = () => {
        resolve(request.result as string[]);
      };
      request.onerror = () => reject(new Error('Failed to get file IDs'));
    });
  } catch (error) {
    console.error('getAllFileIds error:', error);
    return [];
  }
}

// 清理未使用的文件
export async function cleanupUnusedFiles(usedIds: string[]): Promise<void> {
  try {
    const allIds = await getAllFileIds();
    const unusedIds = allIds.filter(id => !usedIds.includes(id));
    
    for (const id of unusedIds) {
      await deleteFile(id);
    }
  } catch (error) {
    console.error('cleanupUnusedFiles error:', error);
  }
}

// 获取文件 URL（用于直接显示/下载）
export function getFileUrl(id: string): string {
  if (isCloudEnvironment()) {
    return api.getFileUrl(id);
  }
  // 本地环境返回空，需要通过 getFile 获取 base64 数据
  return '';
}
