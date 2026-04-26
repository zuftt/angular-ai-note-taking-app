export interface Page {
  _id?: string;
  title: string;
  icon?: string;
  content: string;
  parentId: string | null;
  folderId?: string | null;
  tags: string[];
  summary?: string;
  wordCount: number;
  isPinned: boolean;
  children?: Page[];
  createdAt?: string;
  updatedAt?: string;
}

export interface Folder {
  _id?: string;
  name: string;
  parentId: string | null;
  children?: Folder[];
  createdAt?: string;
  updatedAt?: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}
