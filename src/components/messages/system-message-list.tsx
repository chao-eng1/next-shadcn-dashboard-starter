'use client';

import React, { useState, useEffect } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { Bell, Search, RefreshCw, CheckCircle2 } from 'lucide-react';
import { SystemMessageCard } from './system-message-card';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface SystemMessage {
  id: string;
  title?: string;
  content: string;
  type?: 'info' | 'warning' | 'error' | 'success' | 'announcement' | 'system';
  priority?: 'low' | 'normal' | 'high' | 'urgent';
  category?: string;
  timestamp: Date;
  isRead?: boolean;
  isStarred?: boolean;
  sender?: {
    id: string;
    name: string;
    avatar?: string;
  };
  actions?: {
    id: string;
    label: string;
    url?: string;
    type: 'primary' | 'secondary';
  }[];
  attachments?: {
    id: string;
    name: string;
    url: string;
    size: number;
  }[];
}

interface SystemMessageListProps {
  className?: string;
  onRefresh?: () => void;
  isLoading?: boolean;
}

export function SystemMessageList({
  className,
  onRefresh,
  isLoading = false
}: SystemMessageListProps) {
  const [messages, setMessages] = useState<SystemMessage[]>([]);
  const [filteredMessages, setFilteredMessages] = useState<SystemMessage[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [filterRead, setFilterRead] = useState<string>('all');
  const [filterPriority, setFilterPriority] = useState<string>('all');

  // 模拟加载系统消息数据
  useEffect(() => {
    loadSystemMessages();
  }, []);

  const loadSystemMessages = async () => {
    try {
      const response = await fetch('/api/user-messages');
      if (response.ok) {
        const data = await response.json();

        // 转换API数据为组件所需格式
        const formattedMessages: SystemMessage[] = data.data.messages.map(
          (userMsg: any) => ({
            id: userMsg.id,
            title: extractTitle(userMsg.message.content),
            content: userMsg.message.content,
            type: determineMessageType(userMsg.message.content),
            priority: determinePriority(userMsg.message.content),
            category: '系统通知',
            timestamp: new Date(userMsg.message.createdAt),
            isRead: userMsg.isRead,
            isStarred: false,
            sender: {
              id: userMsg.message.sender?.id || 'system',
              name: userMsg.message.sender?.name || '系统管理员',
              avatar: userMsg.message.sender?.image
            }
          })
        );

        setMessages(formattedMessages);
      }
    } catch (error) {
      // console.error('Failed to load system messages:', error);
      // 如果API失败，显示一些示例数据
      setMessages(getSampleMessages());
    }
  };

  // 从消息内容中提取标题
  const extractTitle = (content: string): string => {
    const lines = content.split('\n');
    const firstLine = lines[0];

    // 如果第一行很短，可能就是标题
    if (firstLine.length <= 50) {
      return firstLine;
    }

    // 否则截取前50个字符作为标题
    return firstLine.slice(0, 50) + '...';
  };

  // 根据内容判断消息类型
  const determineMessageType = (content: string): SystemMessage['type'] => {
    const lowerContent = content.toLowerCase();

    if (
      lowerContent.includes('错误') ||
      lowerContent.includes('失败') ||
      lowerContent.includes('error')
    ) {
      return 'error';
    }
    if (
      lowerContent.includes('警告') ||
      lowerContent.includes('注意') ||
      lowerContent.includes('warning')
    ) {
      return 'warning';
    }
    if (
      lowerContent.includes('成功') ||
      lowerContent.includes('完成') ||
      lowerContent.includes('success')
    ) {
      return 'success';
    }
    if (
      lowerContent.includes('公告') ||
      lowerContent.includes('通知') ||
      lowerContent.includes('announcement')
    ) {
      return 'announcement';
    }

    return 'info';
  };

  // 根据内容判断优先级
  const determinePriority = (content: string): SystemMessage['priority'] => {
    const lowerContent = content.toLowerCase();

    if (lowerContent.includes('紧急') || lowerContent.includes('urgent')) {
      return 'urgent';
    }
    if (lowerContent.includes('重要') || lowerContent.includes('important')) {
      return 'high';
    }
    if (lowerContent.includes('一般') || lowerContent.includes('normal')) {
      return 'normal';
    }

    return 'normal';
  };

  // 获取示例消息数据
  const getSampleMessages = (): SystemMessage[] => [
    {
      id: '1',
      title: '系统维护通知',
      content:
        '系统将于今晚23:00-01:00进行例行维护，期间可能会出现短暂的服务中断。请提前保存您的工作内容，感谢您的理解与配合。',
      type: 'warning',
      priority: 'high',
      category: '系统维护',
      timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2小时前
      isRead: false,
      isStarred: true,
      sender: {
        id: 'admin',
        name: '系统管理员'
      },
      actions: [
        {
          id: 'details',
          label: '查看详情',
          url: '/maintenance-details',
          type: 'primary'
        }
      ]
    },
    {
      id: '2',
      title: '密码策略更新',
      content:
        '为提高账户安全性，我们已更新密码策略。新的密码要求包括：至少8位字符、包含大小写字母、数字和特殊字符。',
      type: 'info',
      priority: 'normal',
      category: '安全通知',
      timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000), // 1天前
      isRead: true,
      isStarred: false,
      sender: {
        id: 'security',
        name: '安全团队'
      }
    },
    {
      id: '3',
      title: '功能更新发布',
      content:
        '新版本已发布！本次更新包含多项功能改进和性能优化。主要更新内容：\n• 全新的用户界面设计\n• 提升系统响应速度\n• 修复已知问题\n• 新增数据分析功能',
      type: 'success',
      priority: 'normal',
      category: '产品更新',
      timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3天前
      isRead: true,
      isStarred: false,
      sender: {
        id: 'product',
        name: '产品团队'
      },
      actions: [
        {
          id: 'changelog',
          label: '查看更新日志',
          url: '/changelog',
          type: 'secondary'
        }
      ]
    }
  ];

  // 过滤消息
  useEffect(() => {
    let filtered = messages;

    // 搜索过滤
    if (searchQuery) {
      filtered = filtered.filter(
        (msg) =>
          msg.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          msg.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
          msg.category?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // 类型过滤
    if (filterType !== 'all') {
      filtered = filtered.filter((msg) => msg.type === filterType);
    }

    // 已读状态过滤
    if (filterRead !== 'all') {
      filtered = filtered.filter((msg) =>
        filterRead === 'read' ? msg.isRead : !msg.isRead
      );
    }

    // 优先级过滤
    if (filterPriority !== 'all') {
      filtered = filtered.filter((msg) => msg.priority === filterPriority);
    }

    // 按时间倒序排列
    filtered.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

    setFilteredMessages(filtered);
  }, [messages, searchQuery, filterType, filterRead, filterPriority]);

  // 消息操作处理
  const handleMarkAsRead = async (id: string) => {
    try {
      const response = await fetch(`/api/user-messages/${id}/read`, {
        method: 'POST'
      });

      if (response.ok) {
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === id ? { ...msg, isRead: !msg.isRead } : msg
          )
        );
        toast.success('状态已更新');
      }
    } catch (error) {
      toast.error('操作失败');
    }
  };

  const handleStar = (id: string) => {
    setMessages((prev) =>
      prev.map((msg) =>
        msg.id === id ? { ...msg, isStarred: !msg.isStarred } : msg
      )
    );
    toast.success('收藏状态已更新');
  };

  const handleArchive = (id: string) => {
    setMessages((prev) => prev.filter((msg) => msg.id !== id));
    toast.success('消息已归档');
  };

  const handleDelete = (id: string) => {
    setMessages((prev) => prev.filter((msg) => msg.id !== id));
    toast.success('消息已删除');
  };

  const handleMarkAllAsRead = async () => {
    try {
      const response = await fetch('/api/user-messages/mark-all-read', {
        method: 'POST'
      });

      if (response.ok) {
        setMessages((prev) => prev.map((msg) => ({ ...msg, isRead: true })));
        toast.success('所有消息已标记为已读');
      }
    } catch (error) {
      toast.error('操作失败');
    }
  };

  const unreadCount = messages.filter((msg) => !msg.isRead).length;

  return (
    <div className={cn('flex h-full flex-col', className)}>
      {/* 头部 */}
      <div className='flex-shrink-0 space-y-4 border-b bg-white p-4'>
        {/* 标题和统计 */}
        <div className='flex items-center justify-between'>
          <div className='flex items-center gap-3'>
            <div className='rounded-lg bg-blue-100 p-2'>
              <Bell className='h-5 w-5 text-blue-600' />
            </div>
            <div>
              <h2 className='text-lg font-semibold text-slate-900'>系统消息</h2>
              <p className='text-sm text-slate-500'>
                共 {messages.length} 条消息
                {unreadCount > 0 && (
                  <Badge variant='destructive' className='ml-2'>
                    {unreadCount} 未读
                  </Badge>
                )}
              </p>
            </div>
          </div>

          <div className='flex items-center gap-2'>
            {unreadCount > 0 && (
              <Button variant='outline' size='sm' onClick={handleMarkAllAsRead}>
                <CheckCircle2 className='mr-1 h-4 w-4' />
                全部已读
              </Button>
            )}

            <Button
              variant='outline'
              size='sm'
              onClick={() => {
                onRefresh?.();
                loadSystemMessages();
              }}
              disabled={isLoading}
            >
              <RefreshCw
                className={cn('mr-1 h-4 w-4', isLoading && 'animate-spin')}
              />
              刷新
            </Button>
          </div>
        </div>

        {/* 搜索和筛选 */}
        <div className='grid grid-cols-1 gap-2 md:grid-cols-4'>
          <div className='relative'>
            <Search className='absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 transform text-slate-400' />
            <Input
              placeholder='搜索消息...'
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className='pl-9'
            />
          </div>

          <Select value={filterType} onValueChange={setFilterType}>
            <SelectTrigger>
              <SelectValue placeholder='消息类型' />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value='all'>全部类型</SelectItem>
              <SelectItem value='info'>信息</SelectItem>
              <SelectItem value='warning'>警告</SelectItem>
              <SelectItem value='error'>错误</SelectItem>
              <SelectItem value='success'>成功</SelectItem>
              <SelectItem value='announcement'>公告</SelectItem>
            </SelectContent>
          </Select>

          <Select value={filterRead} onValueChange={setFilterRead}>
            <SelectTrigger>
              <SelectValue placeholder='阅读状态' />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value='all'>全部状态</SelectItem>
              <SelectItem value='unread'>未读</SelectItem>
              <SelectItem value='read'>已读</SelectItem>
            </SelectContent>
          </Select>

          <Select value={filterPriority} onValueChange={setFilterPriority}>
            <SelectTrigger>
              <SelectValue placeholder='优先级' />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value='all'>全部优先级</SelectItem>
              <SelectItem value='urgent'>紧急</SelectItem>
              <SelectItem value='high'>重要</SelectItem>
              <SelectItem value='normal'>普通</SelectItem>
              <SelectItem value='low'>低</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* 消息列表 */}
      <ScrollArea className='flex-1'>
        <div className='space-y-4 p-4'>
          {filteredMessages.length === 0 ? (
            <div className='py-12 text-center'>
              <Bell className='mx-auto mb-4 h-12 w-12 text-slate-300' />
              <h3 className='mb-2 text-lg font-medium text-slate-600'>
                {searchQuery ||
                filterType !== 'all' ||
                filterRead !== 'all' ||
                filterPriority !== 'all'
                  ? '没有找到匹配的消息'
                  : '暂无系统消息'}
              </h3>
              <p className='text-slate-500'>
                {searchQuery ||
                filterType !== 'all' ||
                filterRead !== 'all' ||
                filterPriority !== 'all'
                  ? '尝试调整搜索条件或筛选选项'
                  : '系统消息将会显示在这里'}
              </p>
            </div>
          ) : (
            filteredMessages.map((message) => (
              <SystemMessageCard
                key={message.id}
                message={message}
                onMarkAsRead={handleMarkAsRead}
                onStar={handleStar}
                onArchive={handleArchive}
                onDelete={handleDelete}
              />
            ))
          )}
        </div>
      </ScrollArea>
    </div>
  );
}

export default SystemMessageList;
