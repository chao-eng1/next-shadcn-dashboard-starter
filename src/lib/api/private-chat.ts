// 私聊相关的API调用函数

export interface PrivateConversation {
  id: string;
  participant: {
    id: string;
    name: string;
    email: string;
    image?: string;
    role?: string;
  };
  lastMessage?: {
    content: string;
    sender: string;
    timestamp: string;
  };
  unreadCount: number;
  project: {
    id: string;
    name: string;
  };
  createdAt: string;
}

export interface PrivateMessage {
  id: string;
  content: string;
  messageType: 'TEXT' | 'IMAGE' | 'FILE';
  sender: {
    id: string;
    name: string;
    email: string;
    image?: string;
  };
  receiver: {
    id: string;
    name: string;
    email: string;
    image?: string;
  };
  createdAt: string;
  isRead: boolean;
  readAt?: string;
  replyTo?: {
    id: string;
    content: string;
    sender: {
      id: string;
      name: string;
    };
  };
}

export interface ProjectMember {
  id: string;
  name: string;
  email: string;
  image?: string;
  role: string;
  status: 'online' | 'away' | 'offline';
  joinedAt: string;
}

// 获取项目中的私聊会话列表
export async function getPrivateConversations(projectId: string): Promise<PrivateConversation[]> {
  try {
    const response = await fetch(`/api/projects/${projectId}/private-conversations`);
    if (!response.ok) {
      throw new Error('Failed to fetch private conversations');
    }
    const data = await response.json();
    return data.data || [];
  } catch (error) {
    console.error('Error fetching private conversations:', error);
    return [];
  }
}

// 创建或获取私聊会话
export async function createPrivateConversation(
  projectId: string, 
  participantId: string
): Promise<PrivateConversation | null> {
  try {
    const response = await fetch(`/api/projects/${projectId}/private-conversations`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ participantId }),
    });
    
    if (!response.ok) {
      throw new Error('Failed to create private conversation');
    }
    
    const data = await response.json();
    return data.data;
  } catch (error) {
    console.error('Error creating private conversation:', error);
    return null;
  }
}

// 获取私聊消息列表
export async function getPrivateMessages(
  projectId: string,
  conversationId: string,
  page: number = 1,
  limit: number = 50
): Promise<{ messages: PrivateMessage[]; pagination: any }> {
  try {
    const response = await fetch(
      `/api/projects/${projectId}/private-conversations/${conversationId}/messages?page=${page}&limit=${limit}`
    );
    
    if (!response.ok) {
      throw new Error('Failed to fetch private messages');
    }
    
    const data = await response.json();
    return data.data || { messages: [], pagination: {} };
  } catch (error) {
    console.error('Error fetching private messages:', error);
    return { messages: [], pagination: {} };
  }
}

// 发送私聊消息
export async function sendPrivateMessage(
  projectId: string,
  conversationId: string,
  content: string,
  messageType: 'TEXT' | 'IMAGE' | 'FILE' = 'TEXT',
  replyToId?: string
): Promise<PrivateMessage | null> {
  try {
    const response = await fetch(
      `/api/projects/${projectId}/private-conversations/${conversationId}/messages`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content,
          messageType,
          replyToId,
        }),
      }
    );
    
    if (!response.ok) {
      throw new Error('Failed to send private message');
    }
    
    const data = await response.json();
    return data.data;
  } catch (error) {
    console.error('Error sending private message:', error);
    return null;
  }
}

// 获取项目成员列表
export async function getProjectMembers(
  projectId: string,
  search?: string,
  excludeSelf: boolean = true
): Promise<ProjectMember[]> {
  try {
    const params = new URLSearchParams();
    if (search) params.append('search', search);
    if (excludeSelf) params.append('excludeSelf', 'true');
    
    const response = await fetch(
      `/api/projects/${projectId}/members?${params.toString()}`
    );
    
    if (!response.ok) {
      throw new Error('Failed to fetch project members');
    }
    
    const data = await response.json();
    return data.data || [];
  } catch (error) {
    console.error('Error fetching project members:', error);
    return [];
  }
}

// 获取私聊消息通知
export async function getPrivateMessageNotifications(
  unreadOnly: boolean = true,
  limit: number = 20
): Promise<any[]> {
  try {
    const params = new URLSearchParams();
    if (unreadOnly) params.append('unreadOnly', 'true');
    params.append('limit', limit.toString());
    
    const response = await fetch(
      `/api/private-message-notifications?${params.toString()}`
    );
    
    if (!response.ok) {
      throw new Error('Failed to fetch private message notifications');
    }
    
    const data = await response.json();
    return data.data || [];
  } catch (error) {
    console.error('Error fetching private message notifications:', error);
    return [];
  }
}

// 标记通知为已读
export async function markNotificationsAsRead(
  notificationIds?: string[],
  markAllAsRead: boolean = false
): Promise<boolean> {
  try {
    const response = await fetch('/api/private-message-notifications', {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        notificationIds,
        markAllAsRead,
      }),
    });
    
    return response.ok;
  } catch (error) {
    console.error('Error marking notifications as read:', error);
    return false;
  }
}