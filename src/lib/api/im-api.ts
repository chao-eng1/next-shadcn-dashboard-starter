// IM系统的API接口

import { User, Conversation, Message, Project } from '@/store/im-store';

// API基础配置
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || '/api';

// 通用的API请求函数
async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<{ data: T; success: boolean; message?: string }> {
  const url = `${API_BASE_URL}${endpoint}`;
  
  const defaultHeaders = {
    'Content-Type': 'application/json',
  };
  
  // 获取认证token
  const token = localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token');
  if (token) {
    defaultHeaders['Authorization'] = `Bearer ${token}`;
  }
  
  const config: RequestInit = {
    ...options,
    headers: {
      ...defaultHeaders,
      ...options.headers,
    },
  };
  
  try {
    const response = await fetch(url, config);
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || `HTTP error! status: ${response.status}`);
    }
    
    return {
      data: data.data || data,
      success: true,
      message: data.message
    };
  } catch (error) {
    console.error(`API request failed for ${endpoint}:`, error);
    throw error;
  }
}

// 用户相关API
export const userAPI = {
  // 获取当前用户信息
  getCurrentUser: async (): Promise<User> => {
    const result = await apiRequest<User>('/users/me');
    return result.data;
  },
  
  // 获取在线用户列表
  getOnlineUsers: async (projectId?: string): Promise<User[]> => {
    const endpoint = projectId ? `/users/online?projectId=${projectId}` : '/users/online';
    const result = await apiRequest<User[]>(endpoint);
    return result.data;
  },
  
  // 更新用户状态
  updateUserStatus: async (status: 'online' | 'away' | 'offline'): Promise<void> => {
    await apiRequest('/users/status', {
      method: 'PUT',
      body: JSON.stringify({ status })
    });
  },
  
  // 搜索用户
  searchUsers: async (query: string): Promise<User[]> => {
    const result = await apiRequest<User[]>(`/users/search?q=${encodeURIComponent(query)}`);
    return result.data;
  }
};

// 项目相关API
export const projectAPI = {
  // 获取用户参与的项目列表
  getUserProjects: async (): Promise<Project[]> => {
    const result = await apiRequest<Project[]>('/projects');
    return result.data;
  },
  
  // 获取项目详情
  getProject: async (projectId: string): Promise<Project> => {
    const result = await apiRequest<Project>(`/projects/${projectId}`);
    return result.data;
  },
  
  // 获取项目成员
  getProjectMembers: async (projectId: string, search?: string): Promise<User[]> => {
    const params = search ? `?search=${encodeURIComponent(search)}` : '';
    const result = await apiRequest<User[]>(`/projects/${projectId}/members${params}`);
    return result.data;
  }
};

// 会话相关API
export const conversationAPI = {
  // 获取会话列表
  getConversations: async (type?: 'project' | 'private'): Promise<Conversation[]> => {
    const params = type ? `?type=${type}` : '';
    const result = await apiRequest<Conversation[]>(`/conversations${params}`);
    return result.data;
  },
  
  // 获取项目群聊会话
  getProjectConversations: async (): Promise<Conversation[]> => {
    const result = await apiRequest<Conversation[]>('/conversations?type=project');
    return result.data;
  },
  
  // 获取私聊会话
  getPrivateConversations: async (): Promise<Conversation[]> => {
    const result = await apiRequest<Conversation[]>('/conversations?type=private');
    return result.data;
  },
  
  // 创建或获取私聊会话
  createPrivateConversation: async (participantId: string, projectId?: string): Promise<Conversation> => {
    const result = await apiRequest<Conversation>('/conversations', {
      method: 'POST',
      body: JSON.stringify({
        type: 'private',
        participantId,
        projectId
      })
    });
    return result.data;
  },
  
  // 获取会话详情
  getConversation: async (conversationId: string): Promise<Conversation> => {
    const result = await apiRequest<Conversation>(`/conversations/${conversationId}`);
    return result.data;
  },
  
  // 标记会话为已读
  markConversationAsRead: async (conversationId: string): Promise<void> => {
    await apiRequest(`/conversations/${conversationId}/read`, {
      method: 'PUT'
    });
  }
};

// 消息相关API
export const messageAPI = {
  // 获取会话消息
  getMessages: async (
    conversationId: string,
    page: number = 1,
    limit: number = 50
  ): Promise<{ messages: Message[]; pagination: any }> => {
    const result = await apiRequest<{ messages: Message[]; pagination: any }>(
      `/conversations/${conversationId}/messages?page=${page}&limit=${limit}`
    );
    return result.data;
  },
  
  // 发送消息
  sendMessage: async (
    conversationId: string,
    content: string,
    messageType: 'text' | 'image' | 'file' = 'text',
    replyToId?: string
  ): Promise<Message> => {
    const result = await apiRequest<Message>(`/conversations/${conversationId}/messages`, {
      method: 'POST',
      body: JSON.stringify({
        content,
        messageType,
        replyToId
      })
    });
    return result.data;
  },
  
  // 删除消息
  deleteMessage: async (messageId: string): Promise<void> => {
    await apiRequest(`/messages/${messageId}`, {
      method: 'DELETE'
    });
  },
  
  // 编辑消息
  editMessage: async (messageId: string, content: string): Promise<Message> => {
    const result = await apiRequest<Message>(`/messages/${messageId}`, {
      method: 'PUT',
      body: JSON.stringify({ content })
    });
    return result.data;
  },
  
  // 标记消息为已读
  markMessageAsRead: async (messageId: string): Promise<void> => {
    await apiRequest(`/messages/${messageId}/read`, {
      method: 'PUT'
    });
  },
  
  // 获取未读消息数量
  getUnreadCount: async (): Promise<number> => {
    const result = await apiRequest<{ count: number }>('/messages/unread-count');
    return result.data.count;
  }
};

// 文件相关API
export const fileAPI = {
  // 上传文件
  uploadFile: async (file: File, conversationId?: string): Promise<{
    id: string;
    url: string;
    fileName: string;
    fileSize: number;
    mimeType: string;
  }> => {
    const formData = new FormData();
    formData.append('file', file);
    if (conversationId) {
      formData.append('conversationId', conversationId);
    }
    
    const result = await apiRequest<{
      id: string;
      url: string;
      fileName: string;
      fileSize: number;
      mimeType: string;
    }>('/files/upload', {
      method: 'POST',
      body: formData,
      headers: {} // 让浏览器自动设置Content-Type
    });
    return result.data;
  },
  
  // 获取文件下载链接
  getFileDownloadUrl: async (fileId: string): Promise<string> => {
    const result = await apiRequest<{ url: string }>(`/files/${fileId}/download`);
    return result.data.url;
  },
  
  // 获取文件预览链接
  getFilePreviewUrl: async (fileId: string): Promise<string> => {
    const result = await apiRequest<{ url: string }>(`/files/${fileId}/preview`);
    return result.data.url;
  }
};

// WebSocket相关API
export const websocketAPI = {
  // 获取WebSocket连接token
  getWebSocketToken: async (): Promise<string> => {
    const result = await apiRequest<{ token: string }>('/ws/token');
    return result.data.token;
  },
  
  // 获取WebSocket连接URL
  getWebSocketUrl: (): string => {
    // 检查是否在浏览器环境中
    if (typeof window === 'undefined') {
      // 服务器端渲染时返回默认值
      const wsHost = process.env.NEXT_PUBLIC_WS_HOST || 'localhost:3001';
      return `ws://${wsHost}/ws/chat`;
    }
    
    const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsHost = process.env.NEXT_PUBLIC_WS_HOST || window.location.host;
    return `${wsProtocol}//${wsHost}/ws/chat`;
  }
};

// 通知相关API
export const notificationAPI = {
  // 获取未读通知数量
  getUnreadCount: async (): Promise<number> => {
    const result = await apiRequest<{ count: number }>('/notifications/unread-count');
    return result.data.count;
  },
  
  // 获取通知列表
  getNotifications: async (page: number = 1, limit: number = 20): Promise<any[]> => {
    const result = await apiRequest<any[]>(`/notifications?page=${page}&limit=${limit}`);
    return result.data;
  },
  
  // 标记通知为已读
  markNotificationAsRead: async (notificationId: string): Promise<void> => {
    await apiRequest(`/notifications/${notificationId}/read`, {
      method: 'PUT'
    });
  },
  
  // 标记所有通知为已读
  markAllNotificationsAsRead: async (): Promise<void> => {
    await apiRequest('/notifications/read-all', {
      method: 'PUT'
    });
  }
};

// 导出所有API
export const imAPI = {
  user: userAPI,
  project: projectAPI,
  conversation: conversationAPI,
  message: messageAPI,
  file: fileAPI,
  websocket: websocketAPI,
  notification: notificationAPI
};