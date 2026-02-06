export type ItemType = 'website' | 'note' | 'file';

export type ThemeMode = 'system' | 'light' | 'dark';

export interface UserConfig {
  isAdmin: boolean;
  adminPassword: string;
}

export interface AuthState {
  isLoggedIn: boolean;
  isAdmin: boolean;
}

export interface BackgroundConfig {
  type: 'gradient' | 'solid' | 'image';
  value: string;
  blur?: number;
  opacity?: number;
}

export interface ThemeConfig {
  mode: ThemeMode;
  lightBackground: BackgroundConfig;
  darkBackground: BackgroundConfig;
}

export interface BookmarkItem {
  id: string;
  type: ItemType;
  title: string;
  categoryId: string;
  createdAt: number;
  updatedAt?: number;
  order: number;
  // For websites
  url?: string;
  favicon?: string;
  // For notes
  content?: string;
  // For files
  fileName?: string;
  fileType?: string;
  fileData?: string; // base64 encoded (deprecated, use fileId)
  fileId?: string; // ID for IndexedDB storage
}

export interface Category {
  id: string;
  name: string;
  parentId: string | null;
  icon?: string;
  order: number;
}

export interface AppState {
  categories: Category[];
  items: BookmarkItem[];
  selectedCategoryId: string | null;
}
