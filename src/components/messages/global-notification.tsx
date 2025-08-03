'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Bell,
  BellOff,
  MessageSquare,
  Users,
  AlertTriangle,
  CheckCircle,
  Clock,
  X,
  Eye,
  Archive,
  Settings,
  Briefcase,
  Calendar,
  User,
  Target,
  TrendingUp,
  Star
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import { toast } from 'sonner';

interface GlobalNotification {
  id: string;
  title: string;
  content: string;
  type: 'private' | 'group' | 'system' | 'project';
  subType?: 'task' | 'milestone' | 'deadline' | 'assignment' | 'comment' | 'status' | 'meeting';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  timestamp: Date;
  isRead: boolean;
  sender?: {
    id: string;
    name: string;
    avatar?: string;
  };
  relatedUrl?: string;
  actions?: {
    label: string;
    action: () => void;
    variant?: 'default' | 'destructive' | 'outline';
  }[];
}

interface GlobalNotificationProps {
  className?: string;
  maxNotifications?: number;
  autoHide?: boolean;
  autoHideDelay?: number;
}

export function GlobalNotification({ 
  className, 
  maxNotifications = 5, 
  autoHide = true, 
  autoHideDelay = 5000 
}: GlobalNotificationProps) {
  const router = useRouter();
  const [notifications, setNotifications] = useState<GlobalNotification[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  // 模拟接收通知
  useEffect(() => {
    const mockNotifications: GlobalNotification[] = [
      {
        id: '1',
        title: '新私聊消息',
        content: '张三: 你好，关于项目的问题...',
        type: 'private',
        priority: 'medium',
        timestamp: new Date(),
        isRead: false,
        sender: {
          id: 'user1',
          name: '张三',
          avatar: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?prompt=professional%20avatar%20person&image_size=square'
        },
        relatedUrl: '/dashboard/messages/private/user1',
        actions: [
          {
            label: '回复',
            action: () => router.push('/dashboard/messages/private/user1')
          },
          {
            label: '标记已读',
            action: () => markAsRead('1'),
            variant: 'outline'
          }
        ]
      },
      {
        id: '2',
        title: '任务分配通知',
        content: '您被分配了新任务："实现用户认证模块"',
        type: 'project',
        subType: 'assignment',
        priority: 'high',
        timestamp: new Date(Date.now() - 5 * 60 * 1000),
        isRead: false,
        sender: {
          id: 'pm1',
          name: '项目经理',
          avatar: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?prompt=professional%20avatar%20manager&image_size=square'
        },
        relatedUrl: '/projects/proj1/tasks/task1',
        actions: [
          {
            label: '查看任务',
            action: () => router.push('/projects/proj1/tasks/task1')
          },
          {
            label: '接受',
            action: () => {
              toast.success('任务已接受');
              markAsRead('2');
            }
          }
        ]
      },
      {
        id: '3',
        title: '系统维护通知',
        content: '系统将于今晚22:00-24:00进行维护，请提前保存工作。',
        type: 'system',
        priority: 'urgent',
        timestamp: new Date(Date.now() - 10 * 60 * 1000),
        isRead: false,
        relatedUrl: '/system/maintenance',
        actions: [
          {
            label: '了解详情',
            action: () => router.push('/system/maintenance')
          }
        ]
      },
      {
        id: '4',
        title: '群聊@提醒',
        content: '在"前端开发组"中@了您：请查看最新的设计稿',
        type: 'group',
        priority: 'medium',
        timestamp: new Date(Date.now() - 15 * 60 * 1000),
        isRead: true,
        sender: {
          id: 'designer1',
          name: '设计师小李',
          avatar: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?prompt=professional%20avatar%20designer&image_size=square'
        },
        relatedUrl: '/dashboard/messages/group/frontend-team',
        actions: [
          {
            label: '查看群聊',
            action: () => router.push('/dashboard/messages/group/frontend-team')
          }
        ]
      }
    ];

    setNotifications(mockNotifications);
  }, [router]);

  // 计算未读数量
  useEffect(() => {
    const count = notifications.filter(notif => !notif.isRead).length;
    setUnreadCount(count);
  }, [notifications]);

  // 自动隐藏通知
  useEffect(() => {
    if (autoHide && notifications.length > 0) {
      const timer = setTimeout(() => {
        setNotifications(prev => prev.slice(0, -1));
      }, autoHideDelay);

      return () => clearTimeout(timer);
    }
  }, [notifications, autoHide, autoHideDelay]);

  // 获取通知类型图标
  const getTypeIcon = (type: GlobalNotification['type'], subType?: string) => {
    if (type === 'project') {
      switch (subType) {
        case 'task':
          return <CheckCircle className="h-4 w-4 text-blue-500" />;
        case 'milestone':
          return <Target className="h-4 w-4 text-green-500" />;
        case 'deadline':
          return <Clock className="h-4 w-4 text-red-500" />;
        case 'assignment':
          return <User className="h-4 w-4 text-purple-500" />;
        case 'comment':
          return <MessageSquare className="h-4 w-4 text-orange-500" />;
        case 'status':
          return <TrendingUp className="h-4 w-4 text-indigo-500" />;
        case 'meeting':
          return <Calendar className="h-4 w-4 text-pink-500" />;
        default:
          return <Briefcase className="h-4 w-4 text-blue-500" />;
      }
    }

    switch (type) {
      case 'private':
        return <MessageSquare className="h-4 w-4 text-blue-500" />;
      case 'group':
        return <Users className="h-4 w-4 text-green-500" />;
      case 'system':
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
      default:
        return <Bell className="h-4 w-4 text-gray-500" />;
    }
  };

  // 获取优先级颜色
  const getPriorityColor = (priority: GlobalNotification['priority']) => {
    switch (priority) {
      case 'urgent':
        return 'border-red-500 bg-red-50';
      case 'high':
        return 'border-orange-500 bg-orange-50';
      case 'medium':
        return 'border-blue-500 bg-blue-50';
      case 'low':
        return 'border-gray-500 bg-gray-50';
      default:
        return 'border-gray-500 bg-gray-50';
    }
  };

  // 获取类型文本
  const getTypeText = (type: GlobalNotification['type']) => {
    switch (type) {
      case 'private':
        return '私聊';
      case 'group':
        return '群聊';
      case 'system':
        return '系统';
      case 'project':
        return '项目';
      default:
        return '通知';
    }
  };

  // 标记为已读
  const markAsRead = (notificationId: string) => {
    setNotifications(prev => 
      prev.map(notif => 
        notif.id === notificationId ? { ...notif, isRead: true } : notif
      )
    );
  };

  // 删除通知
  const removeNotification = (notificationId: string) => {
    setNotifications(prev => prev.filter(notif => notif.id !== notificationId));
  };

  // 全部标记为已读
  const markAllAsRead = () => {
    setNotifications(prev => prev.map(notif => ({ ...notif, isRead: true })));
    toast.success('所有通知已标记为已读');
  };

  // 清空所有通知
  const clearAllNotifications = () => {
    setNotifications([]);
    toast.success('所有通知已清空');
  };

  // 显示的通知列表（限制数量）
  const displayNotifications = notifications.slice(0, maxNotifications);

  return (
    <div className={cn('relative', className)}>
      {/* 通知按钮 */}
      <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className="relative h-9 w-9 p-0"
          >
            <Bell className="h-4 w-4" />
            {unreadCount > 0 && (
              <Badge 
                variant="destructive" 
                className="absolute -top-1 -right-1 h-5 w-5 p-0 text-xs flex items-center justify-center"
              >
                {unreadCount > 99 ? '99+' : unreadCount}
              </Badge>
            )}
          </Button>
        </DropdownMenuTrigger>
        
        <DropdownMenuContent 
          align="end" 
          className="w-96 max-h-[600px] overflow-hidden p-0"
        >
          {/* 头部 */}
          <div className="flex items-center justify-between p-4 border-b">
            <div className="flex items-center gap-2">
              <Bell className="h-4 w-4" />
              <span className="font-medium">通知</span>
              {unreadCount > 0 && (
                <Badge variant="secondary" className="text-xs">
                  {unreadCount} 条未读
                </Badge>
              )}
            </div>
            
            <div className="flex items-center gap-1">
              {unreadCount > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={markAllAsRead}
                  className="text-xs h-7 px-2"
                >
                  全部已读
                </Button>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.push('/dashboard/messages/settings')}
                className="h-7 w-7 p-0"
              >
                <Settings className="h-3 w-3" />
              </Button>
            </div>
          </div>

          {/* 通知列表 */}
          <div className="max-h-96 overflow-y-auto">
            {displayNotifications.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground">
                <Bell className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">暂无新通知</p>
              </div>
            ) : (
              <div className="space-y-1 p-2">
                {displayNotifications.map((notification) => (
                  <Card
                    key={notification.id}
                    className={cn(
                      'cursor-pointer transition-colors hover:bg-muted/50 border-l-4',
                      !notification.isRead && 'bg-primary/5',
                      getPriorityColor(notification.priority)
                    )}
                    onClick={() => {
                      if (notification.relatedUrl) {
                        router.push(notification.relatedUrl);
                        markAsRead(notification.id);
                        setIsOpen(false);
                      }
                    }}
                  >
                    <CardContent className="p-3">
                      <div className="flex items-start gap-3">
                        {/* 通知图标 */}
                        <div className="flex-shrink-0 mt-0.5">
                          {getTypeIcon(notification.type, notification.subType)}
                        </div>
                        
                        {/* 通知内容 */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <h4 className={cn(
                                  'text-sm font-medium truncate',
                                  !notification.isRead && 'font-semibold'
                                )}>
                                  {notification.title}
                                </h4>
                                {!notification.isRead && (
                                  <div className="h-2 w-2 bg-primary rounded-full flex-shrink-0" />
                                )}
                              </div>
                              
                              <p className="text-xs text-muted-foreground line-clamp-2 mb-2">
                                {notification.content}
                              </p>
                              
                              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                <Badge variant="outline" className="text-xs px-1 py-0">
                                  {getTypeText(notification.type)}
                                </Badge>
                                {notification.sender && (
                                  <span>{notification.sender.name}</span>
                                )}
                                <span>•</span>
                                <span>{format(notification.timestamp, 'HH:mm', { locale: zhCN })}</span>
                              </div>
                            </div>
                            
                            {/* 操作按钮 */}
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100"
                              onClick={(e) => {
                                e.stopPropagation();
                                removeNotification(notification.id);
                              }}
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          </div>
                          
                          {/* 快捷操作 */}
                          {notification.actions && notification.actions.length > 0 && (
                            <div className="flex gap-1 mt-2">
                              {notification.actions.slice(0, 2).map((action, index) => (
                                <Button
                                  key={index}
                                  variant={action.variant || 'outline'}
                                  size="sm"
                                  className="h-6 text-xs px-2"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    action.action();
                                  }}
                                >
                                  {action.label}
                                </Button>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>

          {/* 底部操作 */}
          {notifications.length > 0 && (
            <>
              <DropdownMenuSeparator />
              <div className="p-2">
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1 text-xs h-8"
                    onClick={() => {
                      router.push('/dashboard/messages');
                      setIsOpen(false);
                    }}
                  >
                    查看全部
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1 text-xs h-8"
                    onClick={clearAllNotifications}
                  >
                    清空通知
                  </Button>
                </div>
              </div>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* 浮动通知（可选） */}
      {notifications.length > 0 && (
        <div className="fixed top-4 right-4 z-50 space-y-2 pointer-events-none">
          {notifications
            .filter(notif => !notif.isRead)
            .slice(0, 3)
            .map((notification) => (
              <Card
                key={`floating-${notification.id}`}
                className={cn(
                  'w-80 shadow-lg border-l-4 pointer-events-auto animate-in slide-in-from-right-full',
                  getPriorityColor(notification.priority)
                )}
              >
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0">
                      {getTypeIcon(notification.type, notification.subType)}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1">
                          <h4 className="text-sm font-medium mb-1">
                            {notification.title}
                          </h4>
                          <p className="text-xs text-muted-foreground line-clamp-2">
                            {notification.content}
                          </p>
                        </div>
                        
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0"
                          onClick={() => removeNotification(notification.id)}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                      
                      {notification.actions && (
                        <div className="flex gap-1 mt-2">
                          {notification.actions.slice(0, 2).map((action, index) => (
                            <Button
                              key={index}
                              variant={action.variant || 'outline'}
                              size="sm"
                              className="h-6 text-xs px-2"
                              onClick={action.action}
                            >
                              {action.label}
                            </Button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      )}
    </div>
  );
}

// 通知提供者组件
export function NotificationProvider({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative">
      {children}
      <GlobalNotification className="fixed top-4 right-4 z-50" />
    </div>
  );
}