'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
  Briefcase,
  Calendar,
  CheckCircle,
  Clock,
  AlertTriangle,
  Users,
  FileText,
  GitBranch,
  MessageSquare,
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
  Settings,
  Bell,
  BellOff,
  ExternalLink,
  User,
  Target,
  TrendingUp
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';
import { zhCN } from 'date-fns/locale/zh-CN';

interface ProjectNotification {
  id: string;
  title: string;
  content: string;
  type:
    | 'task'
    | 'milestone'
    | 'deadline'
    | 'assignment'
    | 'comment'
    | 'status'
    | 'meeting';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  projectId: string;
  projectName: string;
  sender: {
    id: string;
    name: string;
    avatar?: string;
    role: string;
  };
  timestamp: Date;
  isRead: boolean;
  isStarred: boolean;
  isArchived: boolean;
  relatedUrl?: string;
  metadata?: {
    taskId?: string;
    milestoneId?: string;
    meetingId?: string;
    oldStatus?: string;
    newStatus?: string;
    dueDate?: Date;
    assignee?: string;
  };
}

interface ProjectSummary {
  id: string;
  name: string;
  unreadCount: number;
  totalNotifications: number;
  lastActivity: Date;
  status: 'active' | 'completed' | 'paused';
}

export function ProjectNotifications() {
  const router = useRouter();
  const [notifications, setNotifications] = useState<ProjectNotification[]>([]);
  const [projectSummaries, setProjectSummaries] = useState<ProjectSummary[]>(
    []
  );
  const [filteredNotifications, setFilteredNotifications] = useState<
    ProjectNotification[]
  >([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [filterProject, setFilterProject] = useState<string>('all');
  const [filterPriority, setFilterPriority] = useState<string>('all');
  const [selectedNotification, setSelectedNotification] =
    useState<ProjectNotification | null>(null);
  const [activeTab, setActiveTab] = useState('all');

  // 模拟数据
  useEffect(() => {
    const mockNotifications: ProjectNotification[] = [
      {
        id: '1',
        title: '任务已分配给您',
        content:
          '您被分配了新任务："实现用户认证模块"，截止日期为2024年1月25日。',
        type: 'assignment',
        priority: 'high',
        projectId: 'proj1',
        projectName: '电商平台开发',
        sender: {
          id: 'user1',
          name: '张项目经理',
          avatar:
            'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?prompt=professional%20avatar%20project%20manager&image_size=square',
          role: '项目经理'
        },
        timestamp: new Date('2024-01-20 14:30'),
        isRead: false,
        isStarred: true,
        isArchived: false,
        relatedUrl: '/projects/proj1/tasks/task1',
        metadata: {
          taskId: 'task1',
          dueDate: new Date('2024-01-25'),
          assignee: '当前用户'
        }
      },
      {
        id: '2',
        title: '里程碑已完成',
        content: '恭喜！项目里程碑"前端界面设计"已成功完成，项目进度达到60%。',
        type: 'milestone',
        priority: 'medium',
        projectId: 'proj1',
        projectName: '电商平台开发',
        sender: {
          id: 'system',
          name: '系统自动',
          role: '系统'
        },
        timestamp: new Date('2024-01-20 11:15'),
        isRead: true,
        isStarred: false,
        isArchived: false,
        relatedUrl: '/projects/proj1/milestones/milestone1',
        metadata: {
          milestoneId: 'milestone1'
        }
      },
      {
        id: '3',
        title: '任务状态更新',
        content: '任务"数据库设计"状态已从"进行中"更新为"已完成"。',
        type: 'status',
        priority: 'low',
        projectId: 'proj2',
        projectName: 'CRM系统升级',
        sender: {
          id: 'user2',
          name: '李开发',
          avatar:
            'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?prompt=professional%20avatar%20developer&image_size=square',
          role: '开发工程师'
        },
        timestamp: new Date('2024-01-20 09:45'),
        isRead: true,
        isStarred: false,
        isArchived: false,
        relatedUrl: '/projects/proj2/tasks/task2',
        metadata: {
          taskId: 'task2',
          oldStatus: '进行中',
          newStatus: '已完成'
        }
      },
      {
        id: '4',
        title: '截止日期提醒',
        content: '任务"API接口开发"将在明天（2024年1月21日）到期，请及时完成。',
        type: 'deadline',
        priority: 'urgent',
        projectId: 'proj1',
        projectName: '电商平台开发',
        sender: {
          id: 'system',
          name: '系统自动',
          role: '系统'
        },
        timestamp: new Date('2024-01-20 08:00'),
        isRead: false,
        isStarred: true,
        isArchived: false,
        relatedUrl: '/projects/proj1/tasks/task3',
        metadata: {
          taskId: 'task3',
          dueDate: new Date('2024-01-21')
        }
      },
      {
        id: '5',
        title: '新评论',
        content:
          '王测试在任务"用户界面测试"中添加了新评论："发现了几个UI问题，需要修复"。',
        type: 'comment',
        priority: 'medium',
        projectId: 'proj1',
        projectName: '电商平台开发',
        sender: {
          id: 'user3',
          name: '王测试',
          avatar:
            'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?prompt=professional%20avatar%20tester&image_size=square',
          role: '测试工程师'
        },
        timestamp: new Date('2024-01-19 16:20'),
        isRead: true,
        isStarred: false,
        isArchived: false,
        relatedUrl: '/projects/proj1/tasks/task4#comment-1',
        metadata: {
          taskId: 'task4'
        }
      },
      {
        id: '6',
        title: '会议提醒',
        content: '项目评审会议将于明天上午10:00举行，请准时参加。',
        type: 'meeting',
        priority: 'high',
        projectId: 'proj2',
        projectName: 'CRM系统升级',
        sender: {
          id: 'user1',
          name: '张项目经理',
          avatar:
            'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?prompt=professional%20avatar%20project%20manager&image_size=square',
          role: '项目经理'
        },
        timestamp: new Date('2024-01-19 14:00'),
        isRead: false,
        isStarred: false,
        isArchived: false,
        relatedUrl: '/meetings/meeting1',
        metadata: {
          meetingId: 'meeting1'
        }
      }
    ];

    const mockProjectSummaries: ProjectSummary[] = [
      {
        id: 'proj1',
        name: '电商平台开发',
        unreadCount: 3,
        totalNotifications: 12,
        lastActivity: new Date('2024-01-20 14:30'),
        status: 'active'
      },
      {
        id: 'proj2',
        name: 'CRM系统升级',
        unreadCount: 1,
        totalNotifications: 8,
        lastActivity: new Date('2024-01-19 16:20'),
        status: 'active'
      },
      {
        id: 'proj3',
        name: '移动应用开发',
        unreadCount: 0,
        totalNotifications: 5,
        lastActivity: new Date('2024-01-18 10:15'),
        status: 'completed'
      }
    ];

    setNotifications(mockNotifications);
    setProjectSummaries(mockProjectSummaries);
  }, []);

  // 过滤通知
  useEffect(() => {
    let filtered = notifications;

    // 根据标签页过滤
    if (activeTab === 'unread') {
      filtered = filtered.filter((notif) => !notif.isRead);
    } else if (activeTab === 'starred') {
      filtered = filtered.filter((notif) => notif.isStarred);
    } else if (activeTab === 'archived') {
      filtered = filtered.filter((notif) => notif.isArchived);
    } else {
      filtered = filtered.filter((notif) => !notif.isArchived);
    }

    // 搜索过滤
    if (searchQuery) {
      filtered = filtered.filter(
        (notif) =>
          notif.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          notif.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
          notif.projectName.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // 类型过滤
    if (filterType !== 'all') {
      filtered = filtered.filter((notif) => notif.type === filterType);
    }

    // 项目过滤
    if (filterProject !== 'all') {
      filtered = filtered.filter((notif) => notif.projectId === filterProject);
    }

    // 优先级过滤
    if (filterPriority !== 'all') {
      filtered = filtered.filter((notif) => notif.priority === filterPriority);
    }

    // 按时间倒序排列
    filtered.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

    setFilteredNotifications(filtered);
  }, [
    notifications,
    searchQuery,
    filterType,
    filterProject,
    filterPriority,
    activeTab
  ]);

  // 获取通知类型图标
  const getTypeIcon = (type: ProjectNotification['type']) => {
    switch (type) {
      case 'task':
        return <CheckCircle className='h-5 w-5 text-blue-500' />;
      case 'milestone':
        return <Target className='h-5 w-5 text-green-500' />;
      case 'deadline':
        return <Clock className='h-5 w-5 text-red-500' />;
      case 'assignment':
        return <User className='h-5 w-5 text-purple-500' />;
      case 'comment':
        return <MessageSquare className='h-5 w-5 text-orange-500' />;
      case 'status':
        return <TrendingUp className='h-5 w-5 text-indigo-500' />;
      case 'meeting':
        return <Calendar className='h-5 w-5 text-pink-500' />;
      default:
        return <Bell className='h-5 w-5 text-gray-500' />;
    }
  };

  // 获取优先级颜色
  const getPriorityColor = (priority: ProjectNotification['priority']) => {
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
  const getPriorityText = (priority: ProjectNotification['priority']) => {
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

  // 获取通知类型文本
  const getTypeText = (type: ProjectNotification['type']) => {
    switch (type) {
      case 'task':
        return '任务';
      case 'milestone':
        return '里程碑';
      case 'deadline':
        return '截止日期';
      case 'assignment':
        return '任务分配';
      case 'comment':
        return '评论';
      case 'status':
        return '状态更新';
      case 'meeting':
        return '会议';
      default:
        return '通知';
    }
  };

  // 标记为已读
  const markAsRead = (notificationId: string) => {
    setNotifications((prev) =>
      prev.map((notif) =>
        notif.id === notificationId ? { ...notif, isRead: true } : notif
      )
    );
  };

  // 切换收藏状态
  const toggleStar = (notificationId: string) => {
    setNotifications((prev) =>
      prev.map((notif) =>
        notif.id === notificationId
          ? { ...notif, isStarred: !notif.isStarred }
          : notif
      )
    );
  };

  // 归档通知
  const archiveNotification = (notificationId: string) => {
    setNotifications((prev) =>
      prev.map((notif) =>
        notif.id === notificationId ? { ...notif, isArchived: true } : notif
      )
    );
  };

  // 删除通知
  const deleteNotification = (notificationId: string) => {
    setNotifications((prev) =>
      prev.filter((notif) => notif.id !== notificationId)
    );
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
              <h1 className='text-xl font-semibold'>项目通知</h1>
              <p className='text-muted-foreground text-sm'>
                {
                  notifications.filter(
                    (notif) => !notif.isRead && !notif.isArchived
                  ).length
                }{' '}
                条未读通知
              </p>
            </div>
          </div>

          <div className='flex items-center gap-2'>
            <Button variant='outline' size='sm'>
              <Settings className='mr-2 h-4 w-4' />
              通知设置
            </Button>
          </div>
        </div>

        {/* 标签页 */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className='mb-4'>
          <TabsList>
            <TabsTrigger value='all'>全部</TabsTrigger>
            <TabsTrigger value='unread'>
              未读 (
              {
                notifications.filter(
                  (notif) => !notif.isRead && !notif.isArchived
                ).length
              }
              )
            </TabsTrigger>
            <TabsTrigger value='starred'>
              收藏 (
              {
                notifications.filter(
                  (notif) => notif.isStarred && !notif.isArchived
                ).length
              }
              )
            </TabsTrigger>
            <TabsTrigger value='archived'>
              归档 ({notifications.filter((notif) => notif.isArchived).length})
            </TabsTrigger>
          </TabsList>
        </Tabs>

        {/* 搜索和过滤 */}
        <div className='flex items-center gap-3'>
          <div className='relative flex-1'>
            <Search className='text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 transform' />
            <Input
              placeholder='搜索通知...'
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
              <SelectItem value='task'>任务</SelectItem>
              <SelectItem value='milestone'>里程碑</SelectItem>
              <SelectItem value='deadline'>截止日期</SelectItem>
              <SelectItem value='assignment'>任务分配</SelectItem>
              <SelectItem value='comment'>评论</SelectItem>
              <SelectItem value='status'>状态更新</SelectItem>
              <SelectItem value='meeting'>会议</SelectItem>
            </SelectContent>
          </Select>

          <Select value={filterProject} onValueChange={setFilterProject}>
            <SelectTrigger className='w-40'>
              <SelectValue placeholder='项目' />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value='all'>全部项目</SelectItem>
              {projectSummaries.map((project) => (
                <SelectItem key={project.id} value={project.id}>
                  {project.name}
                </SelectItem>
              ))}
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

      {/* 内容区域 */}
      <div className='flex flex-1'>
        {/* 项目概览侧边栏 */}
        <div className='bg-muted/30 w-80 border-r'>
          <Card className='h-full rounded-none border-0'>
            <CardHeader>
              <CardTitle>项目概览</CardTitle>
            </CardHeader>
            <CardContent className='p-0'>
              <ScrollArea className='h-[calc(100vh-200px)]'>
                <div className='space-y-3 p-4'>
                  {projectSummaries.map((project) => (
                    <Card
                      key={project.id}
                      className={cn(
                        'hover:bg-muted/50 cursor-pointer transition-colors',
                        filterProject === project.id && 'ring-primary ring-2'
                      )}
                      onClick={() => setFilterProject(project.id)}
                    >
                      <CardContent className='p-4'>
                        <div className='flex items-start justify-between'>
                          <div className='flex-1'>
                            <div className='mb-2 flex items-center gap-2'>
                              <h3 className='font-medium'>{project.name}</h3>
                              <Badge
                                variant={
                                  project.status === 'active'
                                    ? 'default'
                                    : 'secondary'
                                }
                                className='text-xs'
                              >
                                {project.status === 'active'
                                  ? '进行中'
                                  : project.status === 'completed'
                                    ? '已完成'
                                    : '暂停'}
                              </Badge>
                            </div>

                            <div className='text-muted-foreground space-y-1 text-sm'>
                              <div className='flex justify-between'>
                                <span>未读通知:</span>
                                <span className='text-primary font-medium'>
                                  {project.unreadCount}
                                </span>
                              </div>
                              <div className='flex justify-between'>
                                <span>总通知:</span>
                                <span>{project.totalNotifications}</span>
                              </div>
                              <div className='flex justify-between'>
                                <span>最后活动:</span>
                                <span>
                                  {format(project.lastActivity, 'MM-dd HH:mm', {
                                    locale: zhCN
                                  })}
                                </span>
                              </div>
                            </div>
                          </div>

                          {project.unreadCount > 0 && (
                            <div className='bg-primary text-primary-foreground flex h-6 w-6 items-center justify-center rounded-full text-xs font-medium'>
                              {project.unreadCount}
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </div>

        {/* 通知列表 */}
        <div className='flex min-h-0 flex-1'>
          {/* 通知列表 */}
          <div className='flex-1 border-r'>
            <ScrollArea className='h-[calc(100vh-240px)]'>
              <div className='space-y-3 p-4'>
                {filteredNotifications.length === 0 ? (
                  <div className='py-12 text-center'>
                    <Briefcase className='text-muted-foreground mx-auto mb-4 h-12 w-12' />
                    <p className='text-muted-foreground'>
                      {activeTab === 'unread'
                        ? '没有未读通知'
                        : activeTab === 'starred'
                          ? '没有收藏的通知'
                          : activeTab === 'archived'
                            ? '没有归档的通知'
                            : '没有找到相关通知'}
                    </p>
                  </div>
                ) : (
                  filteredNotifications.map((notification) => (
                    <Card
                      key={notification.id}
                      className={cn(
                        'hover:bg-muted/50 cursor-pointer transition-colors',
                        !notification.isRead &&
                          'border-primary/50 bg-primary/5',
                        selectedNotification?.id === notification.id &&
                          'ring-primary ring-2'
                      )}
                      onClick={() => {
                        setSelectedNotification(notification);
                        if (!notification.isRead) {
                          markAsRead(notification.id);
                        }
                      }}
                    >
                      <CardContent className='p-4'>
                        <div className='flex items-start gap-3'>
                          {/* 通知类型图标 */}
                          <div className='mt-1 flex-shrink-0'>
                            {getTypeIcon(notification.type)}
                          </div>

                          {/* 通知内容 */}
                          <div className='min-w-0 flex-1'>
                            <div className='flex items-start justify-between gap-2'>
                              <div className='flex-1'>
                                <div className='mb-1 flex items-center gap-2'>
                                  <h3
                                    className={cn(
                                      'truncate font-medium',
                                      !notification.isRead && 'font-semibold'
                                    )}
                                  >
                                    {notification.title}
                                  </h3>
                                  {!notification.isRead && (
                                    <div className='bg-primary h-2 w-2 flex-shrink-0 rounded-full' />
                                  )}
                                </div>

                                <p className='text-muted-foreground mb-2 line-clamp-2 text-sm'>
                                  {notification.content}
                                </p>

                                <div className='text-muted-foreground flex items-center gap-2 text-xs'>
                                  <Badge variant='outline' className='text-xs'>
                                    {notification.projectName}
                                  </Badge>
                                  <Badge
                                    variant='secondary'
                                    className='text-xs'
                                  >
                                    {getTypeText(notification.type)}
                                  </Badge>
                                  <div
                                    className={cn(
                                      'h-2 w-2 rounded-full',
                                      getPriorityColor(notification.priority)
                                    )}
                                  />
                                  <span>
                                    {getPriorityText(notification.priority)}
                                  </span>
                                  <span>•</span>
                                  <span>{notification.sender.name}</span>
                                  <span>•</span>
                                  <span>
                                    {format(
                                      notification.timestamp,
                                      'MM-dd HH:mm',
                                      { locale: zhCN }
                                    )}
                                  </span>
                                </div>
                              </div>

                              {/* 操作按钮 */}
                              <div className='flex items-center gap-1'>
                                {notification.isStarred && (
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
                                        toggleStar(notification.id);
                                      }}
                                    >
                                      {notification.isStarred ? (
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
                                        markAsRead(notification.id);
                                      }}
                                    >
                                      {notification.isRead ? (
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
                                        archiveNotification(notification.id);
                                      }}
                                    >
                                      <Archive className='mr-2 h-4 w-4' />
                                      归档
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        deleteNotification(notification.id);
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

          {/* 通知详情 */}
          <div className='w-96'>
            {selectedNotification ? (
              <div className='h-[calc(100vh-240px)] overflow-y-auto'>
                <Card className='h-full rounded-none border-0'>
                  <CardHeader>
                    <div className='flex items-start gap-3'>
                      {getTypeIcon(selectedNotification.type)}
                      <div className='flex-1'>
                        <CardTitle className='text-lg'>
                          {selectedNotification.title}
                        </CardTitle>
                        <div className='text-muted-foreground mt-2 flex items-center gap-2 text-sm'>
                          <Badge variant='outline'>
                            {selectedNotification.projectName}
                          </Badge>
                          <Badge variant='secondary'>
                            {getTypeText(selectedNotification.type)}
                          </Badge>
                          <div
                            className={cn(
                              'h-2 w-2 rounded-full',
                              getPriorityColor(selectedNotification.priority)
                            )}
                          />
                          <span>
                            {getPriorityText(selectedNotification.priority)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className='space-y-4'>
                    {/* 通知内容 */}
                    <div>
                      <p className='text-sm leading-relaxed'>
                        {selectedNotification.content}
                      </p>
                    </div>

                    {/* 元数据信息 */}
                    {selectedNotification.metadata && (
                      <div>
                        <h4 className='mb-2 font-medium'>详细信息</h4>
                        <div className='space-y-2 text-sm'>
                          {selectedNotification.metadata.dueDate && (
                            <div className='flex justify-between'>
                              <span className='text-muted-foreground'>
                                截止日期:
                              </span>
                              <span>
                                {format(
                                  selectedNotification.metadata.dueDate,
                                  'yyyy-MM-dd',
                                  { locale: zhCN }
                                )}
                              </span>
                            </div>
                          )}
                          {selectedNotification.metadata.assignee && (
                            <div className='flex justify-between'>
                              <span className='text-muted-foreground'>
                                分配给:
                              </span>
                              <span>
                                {selectedNotification.metadata.assignee}
                              </span>
                            </div>
                          )}
                          {selectedNotification.metadata.oldStatus &&
                            selectedNotification.metadata.newStatus && (
                              <div className='flex justify-between'>
                                <span className='text-muted-foreground'>
                                  状态变更:
                                </span>
                                <span>
                                  {selectedNotification.metadata.oldStatus} →{' '}
                                  {selectedNotification.metadata.newStatus}
                                </span>
                              </div>
                            )}
                        </div>
                      </div>
                    )}

                    {/* 相关链接 */}
                    {selectedNotification.relatedUrl && (
                      <div>
                        <Button
                          className='w-full'
                          onClick={() => {
                            if (
                              selectedNotification.relatedUrl!.startsWith('/')
                            ) {
                              router.push(selectedNotification.relatedUrl!);
                            } else {
                              window.open(
                                selectedNotification.relatedUrl!,
                                '_blank'
                              );
                            }
                          }}
                        >
                          <ExternalLink className='mr-2 h-4 w-4' />
                          查看详情
                        </Button>
                      </div>
                    )}

                    {/* 发送者信息 */}
                    <div className='border-t pt-4'>
                      <h4 className='mb-2 font-medium'>发送者</h4>
                      <div className='flex items-center gap-3'>
                        <div className='bg-primary/10 flex h-8 w-8 items-center justify-center rounded-full'>
                          <User className='text-primary h-4 w-4' />
                        </div>
                        <div>
                          <p className='text-sm font-medium'>
                            {selectedNotification.sender.name}
                          </p>
                          <p className='text-muted-foreground text-xs'>
                            {selectedNotification.sender.role}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* 通知信息 */}
                    <div className='text-muted-foreground space-y-1 border-t pt-4 text-xs'>
                      <div className='flex justify-between'>
                        <span>时间:</span>
                        <span>
                          {format(
                            selectedNotification.timestamp,
                            'yyyy-MM-dd HH:mm:ss',
                            { locale: zhCN }
                          )}
                        </span>
                      </div>
                      <div className='flex justify-between'>
                        <span>状态:</span>
                        <span>
                          {selectedNotification.isRead ? '已读' : '未读'}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            ) : (
              <div className='text-muted-foreground flex h-full items-center justify-center'>
                <div className='text-center'>
                  <Briefcase className='mx-auto mb-4 h-12 w-12' />
                  <p>选择一条通知查看详情</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
