export interface User {
  id: string;
  name: string;
  avatar: string;
  username?: string; // @nickname
  bio?: string;
  phone?: string;
}

export interface Attachment {
  type: 'photo' | 'video' | 'audio' | 'file';
  url: string; // base64 or blob url
  name?: string;
  mimeType?: string; // For Gemini API
}

export interface Message {
  id: string;
  senderId: string; // 'me' or contactId
  text: string;
  timestamp: number;
  status: 'sent' | 'read';
  attachment?: Attachment;
}

export interface Chat {
  id: string;
  name: string;
  avatar: string;
  username?: string; // For search
  bio?: string; // For profile view
  isAi: boolean;
  systemInstruction?: string; 
  messages: Message[];
  unreadCount: number;
  lastMessage?: Message;
  isTyping?: boolean;
  onlineStatus?: string; 
  muted?: boolean;
}

export interface AppState {
  chats: Chat[];
  activeChatId: string | null;
  user: User;
}