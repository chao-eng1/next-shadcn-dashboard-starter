'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import {
  Bell,
  AlertTriangle,
  Info,
  CheckCircle,
  XCircle,
  Search,
  Filter,
  MoreVertical,
  ArrowLeft,
  Trash2,
  Archive,
  Star,
  StarOff,
  Eye,
  EyeOff,
  Calendar,
  Clock,
  Settings,
  Download
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';
import { zhCN } from 'date-fns/locale/zh-CN';

interface SystemMessage {
  id: string;
  title: string;
  content: string;
  type: 'info' | 'warning' | 'error' | 'success' | 'announcement';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  category: string;
  sender: string;
  timestamp: Date;
  isRead: boolean;
  isStarred: boolean;
  isArchived: boolean;
  attachments?: {
    id: string;
    name: string;
    url: string;
    size: number;
  }[];
  actions?: {
    id: string;
    label: string;
    url: string;
    type: 'primary' | 'secondary';
  }[];
}

export function SystemMessages() {
  const router = useRouter();
  const [messages, setMessages] = useState<SystemMessage[]>([]);
  const [filteredMessages, setFilteredMessages] = useState<SystemMessage[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [filterPriority, setFilterPriority] = useState<string>('all');
  const [showArchived, setShowArchived] = useState(false);
  const [selectedMessage, setSelectedMessage] = useState<SystemMessage | null>(
    null
  );

  // 模拟数据
  useEffect(() => {
    const mockMessages: SystemMessage[] = [
      {
        id: '1',
        title: '系统维护通知',
        content:
          '系统将于今晚23:00-01:00进行例行维护，期间可能会出现短暂的服务中断。请提前保存您的工作内容。',
        type: 'warning',
        priority: 'high',
        category: '系统维护',
        sender: '系统管理员',
        timestamp: new Date('2024-01-20 15:30'),
        isRead: false,
        isStarred: true,
        isArchived: false,
        actions: [
          {
            id: 'action1',
            label: '查看详情',
            url: '/maintenance-details',
            type: 'primary'
          }
        ]
      },
      {
        id: '2',
        title: '新功能发布',
        content:
          '我们很高兴地宣布，消息中心新增了群组聊天功能！现在您可以创建项目群组，与团队成员进行更高效的沟通。',
        type: 'announcement',
        priority: 'medium',
        category: '产品更新',
        sender: '产品团队',
        timestamp: new Date('2024-01-19 10:00'),
        isRead: true,
        isStarred: false,
        isArchived: false,
        attachments: [
          {
            id: 'att1',
            name: '新功能使用指南.pdf',
            url: '#',
            size: 1024000
          }
        ],
        actions: [
          {
            id: 'action2',
            label: '立即体验',
            url: '/dashboard/messages/group',
            type: 'primary'
          },
          {
            id: 'action3',
            label: '查看指南',
            url: '/guide',
            type: 'secondary'
          }
        ]
      },
      {
        id: '3',
        title: '安全提醒',
        content:
          '检测到您的账户在异地登录，如果不是您本人操作，请立即修改密码并启用双因素认证。',
        type: 'error',
        priority: 'urgent',
        category: '安全警告',
        sender: '安全中心',
        timestamp: new Date('2024-01-18 14:22'),
        isRead: true,
        isStarred: true,
        isArchived: false,
        actions: [
          {
            id: 'action4',
            label: '修改密码',
            url: '/security/password',
            type: 'primary'
          },
          {
            id: 'action5',
            label: '查看登录记录',
            url: '/security/logs',
            type: 'secondary'
          }
        ]
      },
      {
        id: '4',
        title: '数据备份完成',
        content:
          '您的数据已成功备份到云端，备份时间：2024-01-17 02:00。如需恢复数据，请联系技术支持。',
        type: 'success',
        priority: 'low',
        category: '数据管理',
        sender: '系统自动',
        timestamp: new Date('2024-01-17 02:05'),
        isRead: true,
        isStarred: false,
        isArchived: false
      },
      {
        id: '5',
        title: '服务条款更新',
        content:
          '我们已更新服务条款和隐私政策，新条款将于2024年2月1日生效。请仔细阅读相关内容。',
        type: 'info',
        priority: 'medium',
        category: '法律条款',
        sender: '法务部',
        timestamp: new Date('2024-01-15 09:00'),
        isRead: false,
        isStarred: false,
        isArchived: true,
        attachments: [
          {
            id: 'att2',
            name: '服务条款v2.0.pdf',
            url: '#',
            size: 512000
          },
          {
            id: 'att3',
            name: '隐私政策v2.0.pdf',
            url: '#',
            size: 256000
          }
        ],
        actions: [
          {
            id: 'action6',
            label: '阅读条款',
            url: '/terms',
            type: 'primary'
          }
        ]
      }
    ];

    setMessages(mockMessages);
  }, []);

  // 过滤消息
  useEffect(() => {
    let filtered = messages.filter((msg) => {
      if (!showArchived && msg.isArchived) return false;
      if (showArchived && !msg.isArchived) return false;
      return true;
    });

    if (searchQuery) {
      filtered = filtered.filter(
        (msg) =>
          msg.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          msg.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
          msg.category.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (filterType !== 'all') {
      filtered = filtered.filter((msg) => msg.type === filterType);
    }

    if (filterPriority !== 'all') {
      filtered = filtered.filter((msg) => msg.priority === filterPriority);
    }

    // 按时间倒序排列
    filtered.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

    setFilteredMessages(filtered);
  }, [messages, searchQuery, filterType, filterPriority, showArchived]);

  // 获取消息类型图标
  const getTypeIcon = (type: SystemMessage['type']) => {
    switch (type) {
      case 'info':
        return <Info className='h-5 w-5 text-blue-500' />;
      case 'warning':
        return <AlertTriangle className='h-5 w-5 text-orange-500' />;
      case 'error':
        return <XCircle className='h-5 w-5 text-red-500' />;
      case 'success':
        return <CheckCircle className='h-5 w-5 text-green-500' />;
      case 'announcement':
        return <Bell className='h-5 w-5 text-purple-500' />;
      default:
        return <Info className='h-5 w-5 text-gray-500' />;
    }
  };

  // 获取优先级颜色
  const getPriorityColor = (priority: SystemMessage['priority']) => {
    switch (priority) {
      case 'urgent':
        return 'bg-red-500';
      case 'high':
        return 'bg-orange-500';
      case 'medium':
        return 'bg-blue-500';
      case 'low':
        return 'bg-gray-500';
      default:
        return 'bg-gray-500';
    }
  };

  // 获取优先级文本
  const getPriorityText = (priority: SystemMessage['priority']) => {
    switch (priority) {
      case 'urgent':
        return '紧急';
      case 'high':
        return '高';
      case 'medium':
        return '中';
      case 'low':
        return '低';
      default:
        return '未知';
    }
  };

  // 标记为已读
  const markAsRead = (messageId: string) => {
    setMessages((prev) =>
      prev.map((msg) => (msg.id === messageId ? { ...msg, isRead: true } : msg))
    );
  };

  // 切换收藏状态
  const toggleStar = (messageId: string) => {
    setMessages((prev) =>
      prev.map((msg) =>
        msg.id === messageId ? { ...msg, isStarred: !msg.isStarred } : msg
      )
    );
  };

  // 归档消息
  const archiveMessage = (messageId: string) => {
    setMessages((prev) =>
      prev.map((msg) =>
        msg.id === messageId ? { ...msg, isArchived: true } : msg
      )
    );
  };

  // 删除消息
  const deleteMessage = (messageId: string) => {
    setMessages((prev) => prev.filter((msg) => msg.id !== messageId));
  };

  // 格式化文件大小
  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className='flex h-full flex-col'>
      {/* 头部 */}
      <div className='bg-background border-b p-4'>
        <div className='mb-4 flex items-center justify-between'>
          <div className='flex items-center gap-3'>
            <Button variant='ghost' size='sm' onClick={() => router.back()}>
              <ArrowLeft className='h-4 w-4' />
            </Button>
            <div>
              <h1 className='text-xl font-semibold'>系统消息</h1>
              <p className='text-muted-foreground text-sm'>
                {filteredMessages.filter((msg) => !msg.isRead).length}{' '}
                条未读消息
              </p>
            </div>
          </div>

          <div className='flex items-center gap-2'>
            <Button
              variant={showArchived ? 'default' : 'outline'}
              size='sm'
              onClick={() => setShowArchived(!showArchived)}
            >
              <Archive className='mr-2 h-4 w-4' />
              {showArchived ? '查看当前' : '查看归档'}
            </Button>

            <Button variant='outline' size='sm'>
              <Settings className='mr-2 h-4 w-4' />
              设置
            </Button>
          </div>
        </div>

        {/* 搜索和过滤 */}
        <div className='flex items-center gap-3'>
          <div className='relative flex-1'>
            <Search className='text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 transform' />
            <Input
              placeholder='搜索消息...'
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className='pl-10'
            />
          </div>

          <Select value={filterType} onValueChange={setFilterType}>
            <SelectTrigger className='w-32'>
              <SelectValue placeholder='类型' />
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

          <Select value={filterPriority} onValueChange={setFilterPriority}>
            <SelectTrigger className='w-32'>
              <SelectValue placeholder='优先级' />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value='all'>全部优先级</SelectItem>
              <SelectItem value='urgent'>紧急</SelectItem>
              <SelectItem value='high'>高</SelectItem>
              <SelectItem value='medium'>中</SelectItem>
              <SelectItem value='low'>低</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* 消息列表 */}
      <div className='flex min-h-0 flex-1'>
        {/* 消息列表 */}
        <div className='flex-1 border-r'>
          <ScrollArea className='h-[calc(100vh-180px)]'>
            <div className='space-y-3 p-4'>
              {filteredMessages.length === 0 ? (
                <div className='py-12 text-center'>
                  <Bell className='text-muted-foreground mx-auto mb-4 h-12 w-12' />
                  <p className='text-muted-foreground'>
                    {showArchived ? '没有归档的消息' : '没有找到相关消息'}
                  </p>
                </div>
              ) : (
                filteredMessages.map((message) => (
                  <Card
                    key={message.id}
                    className={cn(
                      'hover:bg-muted/50 cursor-pointer transition-colors',
                      !message.isRead && 'border-primary/50 bg-primary/5',
                      selectedMessage?.id === message.id &&
                        'ring-primary ring-2'
                    )}
                    onClick={() => {
                      setSelectedMessage(message);
                      if (!message.isRead) {
                        markAsRead(message.id);
                      }
                    }}
                  >
                    <CardContent className='p-4'>
                      <div className='flex items-start gap-3'>
                        {/* 消息类型图标 */}
                        <div className='mt-1 flex-shrink-0'>
                          {getTypeIcon(message.type)}
                        </div>

                        {/* 消息内容 */}
                        <div className='min-w-0 flex-1'>
                          <div className='flex items-start justify-between gap-2'>
                            <div className='flex-1'>
                              <div className='mb-1 flex items-center gap-2'>
                                <h3
                                  className={cn(
                                    'truncate font-medium',
                                    !message.isRead && 'font-semibold'
                                  )}
                                >
                                  {message.title}
                                </h3>
                                {!message.isRead && (
                                  <div className='bg-primary h-2 w-2 flex-shrink-0 rounded-full' />
                                )}
                              </div>

                              <p className='text-muted-foreground mb-2 line-clamp-2 text-sm'>
                                {message.content}
                              </p>

                              <div className='text-muted-foreground flex items-center gap-2 text-xs'>
                                <Badge variant='outline' className='text-xs'>
                                  {message.category}
                                </Badge>
                                <div
                                  className={cn(
                                    'h-2 w-2 rounded-full',
                                    getPriorityColor(message.priority)
                                  )}
                                />
                                <span>{getPriorityText(message.priority)}</span>
                                <span>•</span>
                                <span>{message.sender}</span>
                                <span>•</span>
                                <span>
                                  {format(message.timestamp, 'MM-dd HH:mm', {
                                    locale: zhCN
                                  })}
                                </span>
                              </div>
                            </div>

                            {/* 操作按钮 */}
                            <div className='flex items-center gap-1'>
                              {message.isStarred && (
                                <Star className='h-4 w-4 fill-yellow-500 text-yellow-500' />
                              )}

                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button
                                    variant='ghost'
                                    size='sm'
                                    className='h-6 w-6 p-0'
                                    onClick={(e) => e.stopPropagation()}
                                  >
                                    <MoreVertical className='h-3 w-3' />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align='end'>
                                  <DropdownMenuItem
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      toggleStar(message.id);
                                    }}
                                  >
                                    {message.isStarred ? (
                                      <>
                                        <StarOff className='mr-2 h-4 w-4' />
                                        取消收藏
                                      </>
                                    ) : (
                                      <>
                                        <Star className='mr-2 h-4 w-4' />
                                        收藏
                                      </>
                                    )}
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      markAsRead(message.id);
                                    }}
                                  >
                                    {message.isRead ? (
                                      <>
                                        <EyeOff className='mr-2 h-4 w-4' />
                                        标为未读
                                      </>
                                    ) : (
                                      <>
                                        <Eye className='mr-2 h-4 w-4' />
                                        标为已读
                                      </>
                                    )}
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      archiveMessage(message.id);
                                    }}
                                  >
                                    <Archive className='mr-2 h-4 w-4' />
                                    归档
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      deleteMessage(message.id);
                                    }}
                                    className='text-destructive'
                                  >
                                    <Trash2 className='mr-2 h-4 w-4' />
                                    删除
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </ScrollArea>
        </div>

        {/* 消息详情 */}
        <div className='w-96'>
          {selectedMessage ? (
            <div className='h-[calc(100vh-180px)] overflow-y-auto'>
              <Card className='h-full rounded-none border-0'>
                <CardHeader>
                  <div className='flex items-start gap-3'>
                    {getTypeIcon(selectedMessage.type)}
                    <div className='flex-1'>
                      <CardTitle className='text-lg'>
                        {selectedMessage.title}
                      </CardTitle>
                      <div className='text-muted-foreground mt-2 flex items-center gap-2 text-sm'>
                        <Badge variant='outline'>
                          {selectedMessage.category}
                        </Badge>
                        <div
                          className={cn(
                            'h-2 w-2 rounded-full',
                            getPriorityColor(selectedMessage.priority)
                          )}
                        />
                        <span>{getPriorityText(selectedMessage.priority)}</span>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className='space-y-4'>
                  {/* 消息内容 */}
                  <div>
                    <p className='text-sm leading-relaxed'>
                      {selectedMessage.content}
                    </p>
                  </div>

                  {/* 附件 */}
                  {selectedMessage.attachments &&
                    selectedMessage.attachments.length > 0 && (
                      <div>
                        <h4 className='mb-2 font-medium'>附件</h4>
                        <div className='space-y-2'>
                          {selectedMessage.attachments.map((attachment) => (
                            <div
                              key={attachment.id}
                              className='flex items-center gap-3 rounded-lg border p-2'
                            >
                              <div className='bg-primary/10 flex h-8 w-8 items-center justify-center rounded'>
                                <Download className='text-primary h-4 w-4' />
                              </div>
                              <div className='min-w-0 flex-1'>
                                <p className='truncate text-sm font-medium'>
                                  {attachment.name}
                                </p>
                                <p className='text-muted-foreground text-xs'>
                                  {formatFileSize(attachment.size)}
                                </p>
                              </div>
                              <Button size='sm' variant='ghost'>
                                <Download className='h-4 w-4' />
                              </Button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                  {/* 操作按钮 */}
                  {selectedMessage.actions &&
                    selectedMessage.actions.length > 0 && (
                      <div>
                        <h4 className='mb-2 font-medium'>操作</h4>
                        <div className='space-y-2'>
                          {selectedMessage.actions.map((action) => (
                            <Button
                              key={action.id}
                              variant={
                                action.type === 'primary'
                                  ? 'default'
                                  : 'outline'
                              }
                              className='w-full'
                              onClick={() => {
                                if (action.url.startsWith('/')) {
                                  router.push(action.url);
                                } else {
                                  window.open(action.url, '_blank');
                                }
                              }}
                            >
                              {action.label}
                            </Button>
                          ))}
                        </div>
                      </div>
                    )}

                  {/* 消息信息 */}
                  <div className='text-muted-foreground space-y-1 border-t pt-4 text-xs'>
                    <div className='flex justify-between'>
                      <span>发送者:</span>
                      <span>{selectedMessage.sender}</span>
                    </div>
                    <div className='flex justify-between'>
                      <span>时间:</span>
                      <span>
                        {format(
                          selectedMessage.timestamp,
                          'yyyy-MM-dd HH:mm:ss',
                          { locale: zhCN }
                        )}
                      </span>
                    </div>
                    <div className='flex justify-between'>
                      <span>状态:</span>
                      <span>{selectedMessage.isRead ? '已读' : '未读'}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          ) : (
            <div className='text-muted-foreground flex h-full items-center justify-center'>
              <div className='text-center'>
                <Bell className='mx-auto mb-4 h-12 w-12' />
                <p>选择一条消息查看详情</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
