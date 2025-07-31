import React, { useState } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Reply, MoreVertical } from 'lucide-react';
import { PrivateMessage } from '@/lib/api/private-chat';
// 简单的时间格式化函数
const formatTimeAgo = (date: Date) => {
  const now = new Date();
  const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
  
  if (diffInMinutes < 1) return '刚刚';
  if (diffInMinutes < 60) return `${diffInMinutes}分钟前`;
  
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) return `${diffInHours}小时前`;
  
  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 7) return `${diffInDays}天前`;
  
  return date.toLocaleDateString('zh-CN');
};

interface PrivateMessageListProps {
  messages: PrivateMessage[];
  currentUserId: string;
  onReply?: (messageId: string) => void;
}

// 模拟私聊消息数据
const mockPrivateMessages: PrivateMessage[] = [
  {
    id: '1',
    content: '你好，关于明天的会议，我想和你单独讨论一下。',
    messageType: 'TEXT',
    sender: {
      id: '2',
      name: '张三',
      image: ''
    },
    receiver: {
      id: '1',
      name: '我',
      image: ''
    },
    createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2小时前
    isRead: true
  },
  {
    id: '2',
    content: '好的，有什么具体的问题吗？',
    messageType: 'TEXT',
    sender: {
      id: '1',
      name: '我',
      image: ''
    },
    receiver: {
      id: '2',
      name: '张三',
      image: ''
    },
    createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000 + 5 * 60 * 1000).toISOString(), // 1小时55分钟前
    isRead: true
  },
  {
    id: '3',
    content: '主要是关于项目进度的安排，我觉得我们需要调整一下时间线。',
    messageType: 'TEXT',
    sender: {
      id: '2',
      name: '张三',
      image: ''
    },
    receiver: {
      id: '1',
      name: '我',
      image: ''
    },
    createdAt: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(), // 1小时前
    isRead: true,
    replyTo: {
      id: '2',
      content: '好的，有什么具体的问题吗？',
      sender: {
        id: '1',
        name: '我'
      }
    }
  },
  {
    id: '4',
    content: '明天的会议记得准备PPT，我们需要向客户展示最新的进展。',
    messageType: 'TEXT',
    sender: {
      id: '2',
      name: '张三',
      image: ''
    },
    receiver: {
      id: '1',
      name: '我',
      image: ''
    },
    createdAt: new Date(Date.now() - 30 * 60 * 1000).toISOString(), // 30分钟前
    isRead: false
  }
];

export default function PrivateMessageList({ 
  messages = mockPrivateMessages, 
  currentUserId = '1' 
}: PrivateMessageListProps) {

  return (
    <div className="space-y-4">
      {messages.map((message) => {
        const isOwn = message.sender.id === currentUserId;
        
        return (
          <div
            key={message.id}
            className={`flex gap-3 ${isOwn ? 'flex-row-reverse' : ''}`}
          >
            <Avatar className="h-8 w-8 flex-shrink-0">
              <AvatarImage src={message.sender.image} />
              <AvatarFallback>
                {message.sender.name.charAt(0)}
              </AvatarFallback>
            </Avatar>
            
            <div className={`flex-1 max-w-[70%] ${isOwn ? 'text-right' : ''}`}>
              <div className={`flex items-center gap-2 mb-1 ${isOwn ? 'justify-end' : ''}`}>
                <span className="text-sm font-medium">{message.sender.name}</span>
                <span className="text-xs text-muted-foreground">
                  {formatTimeAgo(new Date(message.createdAt))}
                </span>
                {!message.isRead && !isOwn && (
                  <Badge variant="destructive" className="text-xs px-1.5 py-0.5">
                    未读
                  </Badge>
                )}
              </div>
              
              {/* 回复消息显示 */}
              {message.replyTo && (
                <div className={`mb-2 ${isOwn ? 'ml-auto' : ''} max-w-fit`}>
                  <div className="bg-muted/50 border-l-2 border-primary/50 pl-3 py-2 rounded text-xs">
                    <div className="font-medium text-primary mb-1">
                      回复 {message.replyTo.sender.name}
                    </div>
                    <div className="text-muted-foreground line-clamp-2">
                      {message.replyTo.content}
                    </div>
                  </div>
                </div>
              )}
              
              {/* 消息内容 */}
              <div
                className={`p-3 rounded-lg text-sm break-words ${
                  isOwn
                    ? 'bg-primary text-primary-foreground ml-auto'
                    : 'bg-muted'
                }`}
              >
                {message.messageType === 'TEXT' && message.content}
                {message.messageType === 'IMAGE' && (
                  <div className="space-y-2">
                    <div className="text-xs opacity-75">[图片]</div>
                    <div>{message.content}</div>
                  </div>
                )}
                {message.messageType === 'FILE' && (
                  <div className="space-y-2">
                    <div className="text-xs opacity-75">[文件]</div>
                    <div>{message.content}</div>
                  </div>
                )}
              </div>
              
              {/* 消息状态 */}
              {isOwn && (
                <div className="text-xs text-muted-foreground mt-1">
                  {message.isRead ? '已读' : '已发送'}
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}