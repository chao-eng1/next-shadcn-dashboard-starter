'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Bell, 
  Briefcase, 
  Users, 
  Calendar, 
  CheckCircle, 
  AlertTriangle,
  Search,
  Filter,
  MoreVertical,
  Trash2,
  Archive,
  Star,
  StarOff,
  Eye,
  EyeOff,
  ExternalLink,
  Clock,
  User,
  FileText,
  MessageSquare,
  GitBranch,
  Target,
  TrendingUp,
  AlertCircle,
  Settings,
  UserPlus,
  UserMinus,
  Upload,
  Download,
  Edit,
  Zap
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

// 项目通知类型
interface ProjectNotification {
  id: string;
  title: string;
  content: string;
  type: 'project_progress' | 'task_status' | 'member_change' | 'document_update' | 'deadline_reminder' | 'approval_process' | 'milestone' | 'meeting';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  projectId: string;
  projectName: string;
  projectAvatar?: string;
  timestamp: Date;
  isRead: boolean;
  isStarred: boolean;
  isArchived: boolean;
  actor: {
    id: string;
    name: string;
    avatar?: string;
    role?: string;
  };
  target?: {
    type: 'task' | 'document' | 'member' | 'milestone' | 'meeting';
    id: string;
    name: string;
  };
  actions?: {
    label: string;
    type: 'link' | 'action';
    url?: string;
    handler?: () => void;
  }[];
  metadata?: {
    oldValue?: string;
    newValue?: string;
    dueDate?: Date;
    progress?: number;
    [key: string]: any;
  };
}

// 项目信息
interface Project {
  id: string;
  name: string;
  avatar?: string;
  status: 'active' | 'completed' | 'paused' | 'cancelled';
  memberCount: number;
}

// 模拟项目数据
const mockProjects: Project[] = [
  {
    id: 'proj1',
    name: '项目Alpha',
    avatar: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?prompt=modern%20project%20alpha%20logo%20blue%20gradient&image_size=square',
    status: 'active',
    memberCount: 8
  },
  {
    id: 'proj2',
    name: '项目Beta',
    avatar: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?prompt=modern%20project%20beta%20logo%20green%20gradient&image_size=square',
    status: 'active',
    memberCount: 5
  },
  {
    id: 'proj3',
    name: '项目Gamma',
    avatar: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?prompt=modern%20project%20gamma%20logo%20purple%20gradient&image_size=square',
    status: 'completed',
    memberCount: 12
  }
];

// 模拟项目通知数据
const mockProjectNotifications: ProjectNotification[] = [
  {
    id: '1',
    title: '任务状态更新',
    content: '张三将任务"用户界面设计"的状态从"进行中"更新为"已完成"。任务已按时完成，质量符合预期。',
    type: 'task_status',
    priority: 'medium',
    projectId: 'proj1',
    projectName: '项目Alpha',
    projectAvatar: mockProjects[0].avatar,
    timestamp: new Date(Date.now() - 30 * 60 * 1000),
    isRead: false,
    isStarred: false,
    isArchived: false,
    actor: {
      id: 'user1',
      name: '张三',
      avatar: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?prompt=professional%20business%20portrait%20of%20asian%20man%20in%20suit&image_size=square',
      role: '产品经理'
    },
    target: {
      type: 'task',
      id: 'task1',
      name: '用户界面设计'
    },
    actions: [
      {
        label: '查看任务',
        type: 'link',
        url: '/dashboard/projects/proj1/tasks/task1'
      }
    ],
    metadata: {
      oldValue: '进行中',
      newValue: '已完成',
      progress: 100
    }
  },
  {
    id: '2',
    title: '项目进度更新',
    content: '项目Alpha整体进度已达到75%，比预期进度提前5%。主要功能模块开发已完成，目前正在进行测试阶段。',
    type: 'project_progress',
    priority: 'high',
    projectId: 'proj1',
    projectName: '项目Alpha',
    projectAvatar: mockProjects[0].avatar,
    timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
    isRead: false,
    isStarred: true,
    isArchived: false,
    actor: {
      id: 'system',
      name: '系统',
      role: '自动更新'
    },
    actions: [
      {
        label: '查看详情',
        type: 'link',
        url: '/dashboard/projects/proj1'
      }
    ],
    metadata: {
      progress: 75,
      expectedProgress: 70
    }
  },
  {
    id: '3',
    title: '新成员加入',
    content: '李四已加入项目Alpha团队，担任UI/UX设计师。请大家欢迎新同事的加入！',
    type: 'member_change',
    priority: 'low',
    projectId: 'proj1',
    projectName: '项目Alpha',
    projectAvatar: mockProjects[0].avatar,
    timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000),
    isRead: true,
    isStarred: false,
    isArchived: false,
    actor: {
      id: 'user1',
      name: '张三',
      avatar: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?prompt=professional%20business%20portrait%20of%20asian%20man%20in%20suit&image_size=square',
      role: '产品经理'
    },
    target: {
      type: 'member',
      id: 'user4',
      name: '李四'
    },
    actions: [
      {
        label: '查看成员',
        type: 'link',
        url: '/dashboard/projects/proj1/members'
      }
    ]
  },
  {
    id: '4',
    title: '文档更新',
    content: '王五更新了"技术架构文档v2.0"，主要修改了数据库设计部分和API接口规范。',
    type: 'document_update',
    priority: 'medium',
    projectId: 'proj1',
    projectName: '项目Alpha',
    projectAvatar: mockProjects[0].avatar,
    timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000),
    isRead: true,
    isStarred: false,
    isArchived: false,
    actor: {
      id: 'user3',
      name: '王五',
      avatar: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?prompt=professional%20business%20portrait%20of%20young%20asian%20developer&image_size=square',
      role: '开发工程师'
    },
    target: {
      type: 'document',
      id: 'doc1',
      name: '技术架构文档v2.0'
    },
    actions: [
      {
        label: '查看文档',
        type: 'link',
        url: '/dashboard/projects/proj1/documents/doc1'
      }
    ]
  },
  {
    id: '5',
    title: '截止日期提醒',
    content: '任务"API接口开发"将在明天（1月16日）到期，请相关负责人注意按时完成。',
    type: 'deadline_reminder',
    priority: 'urgent',
    projectId: 'proj1',
    projectName: '项目Alpha',
    projectAvatar: mockProjects[0].avatar,
    timestamp: new Date(Date.now() - 8 * 60 * 60 * 1000),
    isRead: false,
    isStarred: true,
    isArchived: false,
    actor: {
      id: 'system',
      name: '系统',
      role: '自动提醒'
    },
    target: {
      type: 'task',
      id: 'task2',
      name: 'API接口开发'
    },
    actions: [
      {
        label: '查看任务',
        type: 'link',
        url: '/dashboard/projects/proj1/tasks/task2'
      }
    ],
    metadata: {
      dueDate: new Date(Date.now() + 24 * 60 * 60 * 1000)
    }
  },
  {
    id: '6',
    title: '里程碑达成',
    content: '恭喜！项目Beta已成功达成"MVP版本发布"里程碑。团队表现出色，提前2天完成目标。',
    type: 'milestone',
    priority: 'high',
    projectId: 'proj2',
    projectName: '项目Beta',
    projectAvatar: mockProjects[1].avatar,
    timestamp: new Date(Date.now() - 12 * 60 * 60 * 1000),
    isRead: true,
    isStarred: true,
    isArchived: false,
    actor: {
      id: 'system',
      name: '系统',
      role: '自动通知'
    },
    target: {
      type: 'milestone',
      id: 'milestone1',
      name: 'MVP版本发布'
    },
    actions: [
      {
        label: '查看里程碑',
        type: 'link',
        url: '/dashboard/projects/proj2/milestones/milestone1'
      }
    ]
  },
  {
    id: '7',
    title: '审批流程',
    content: '赵六提交了"预算申请"，等待您的审批。申请金额：50,000元，用途：购买开发设备。',
    type: 'approval_process',
    priority: 'medium',
    projectId: 'proj2',
    projectName: '项目Beta',
    projectAvatar: mockProjects[1].avatar,
    timestamp: new Date(Date.now() - 18 * 60 * 60 * 1000),
    isRead: false,
    isStarred: false,
    isArchived: false,
    actor: {
      id: 'user4',
      name: '赵六',
      avatar: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?prompt=professional%20business%20portrait%20of%20asian%20woman%20developer&image_size=square',
      role: '测试工程师'
    },
    actions: [
      {
        label: '审批',
        type: 'link',
        url: '/dashboard/approvals/approval1'
      }
    ],
    metadata: {
      amount: 50000,
      purpose: '购买开发设备'
    }
  },
  {
    id: '8',
    title: '会议安排',
    content: '项目Gamma回顾会议已安排在明天下午2:00，地点：会议室A。请相关人员准时参加。',
    type: 'meeting',
    priority: 'medium',
    projectId: 'proj3',
    projectName: '项目Gamma',
    projectAvatar: mockProjects[2].avatar,
    timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000),
    isRead: true,
    isStarred: false,
    isArchived: false,
    actor: {
      id: 'user1',
      name: '张三',
      avatar: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?prompt=professional%20business%20portrait%20of%20asian%20man%20in%20suit&image_size=square',
      role: '产品经理'
    },
    target: {
      type: 'meeting',
      id: 'meeting1',
      name: '项目Gamma回顾会议'
    },
    actions: [
      {
        label: '查看会议',
        type: 'link',
        url: '/dashboard/calendar/meeting1'
      }
    ],
    metadata: {
      meetingTime: new Date(Date.now() + 24 * 60 * 60 * 1000),
      location: '会议室A'
    }
  }
];

// 通知类型配置
const notificationTypeConfig = {
  project_progress: { icon: TrendingUp, color: 'text-blue-600', bgColor: 'bg-blue-100', label: '项目进度' },
  task_status: { icon: CheckCircle, color: 'text-green-600', bgColor: 'bg-green-100', label: '任务状态' },
  member_change: { icon: Users, color: 'text-purple-600', bgColor: 'bg-purple-100', label: '成员变动' },
  document_update: { icon: FileText, color: 'text-orange-600', bgColor: 'bg-orange-100', label: '文档更新' },
  deadline_reminder: { icon: Clock, color: 'text-red-600', bgColor: 'bg-red-100', label: '截止提醒' },
  approval_process: { icon: Settings, color: 'text-yellow-600', bgColor: 'bg-yellow-100', label: '审批流程' },
  milestone: { icon: Target, color: 'text-indigo-600', bgColor: 'bg-indigo-100', label: '里程碑' },
  meeting: { icon: Calendar, color: 'text-pink-600', bgColor: 'bg-pink-100', label: '会议安排' }
};

// 优先级配置
const priorityConfig = {
  low: { color: 'text-gray-600', bgColor: 'bg-gray-100', label: '低' },
  medium: { color: 'text-blue-600', bgColor: 'bg-blue-100', label: '中' },
  high: { color: 'text-orange-600', bgColor: 'bg-orange-100', label: '高' },
  urgent: { color: 'text-red-600', bgColor: 'bg-red-100', label: '紧急' }
};

// 时间格式化
const formatTime = (date: Date) => {
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const minutes = Math.floor(diff / (1000 * 60));
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));

  if (minutes < 1) return '刚刚';
  if (minutes < 60) return `${minutes}分钟前`;
  if (hours < 24) return `${hours}小时前`;
  if (days < 7) return `${days}天前`;
  
  return date.toLocaleDateString('zh-CN', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

// 格式化截止时间
const formatDueDate = (date: Date) => {
  const now = new Date();
  const diff = date.getTime() - now.getTime();
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));

  if (diff < 0) return '已过期';
  if (hours < 24) return `${hours}小时后到期`;
  if (days < 7) return `${days}天后到期`;
  
  return date.toLocaleDateString('zh-CN');
};

export default function ProjectNotificationsPage() {
  const [notifications, setNotifications] = useState<ProjectNotification[]>(mockProjectNotifications);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [selectedPriority, setSelectedPriority] = useState<string>('all');
  const [selectedProject, setSelectedProject] = useState<string>('all');
  const [selectedNotifications, setSelectedNotifications] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState('all');

  // 过滤通知
  const filteredNotifications = notifications.filter(notification => {
    // 搜索过滤
    if (searchQuery && !notification.title.toLowerCase().includes(searchQuery.toLowerCase()) && 
        !notification.content.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false;
    }
    
    // 类型过滤
    if (selectedType !== 'all' && notification.type !== selectedType) {
      return false;
    }
    
    // 优先级过滤
    if (selectedPriority !== 'all' && notification.priority !== selectedPriority) {
      return false;
    }
    
    // 项目过滤
    if (selectedProject !== 'all' && notification.projectId !== selectedProject) {
      return false;
    }
    
    // 标签页过滤
    switch (activeTab) {
      case 'unread':
        return !notification.isRead && !notification.isArchived;
      case 'starred':
        return notification.isStarred && !notification.isArchived;
      case 'archived':
        return notification.isArchived;
      default:
        return !notification.isArchived;
    }
  });

  // 标记为已读
  const markAsRead = (notificationId: string) => {
    setNotifications(prev => prev.map(notif => 
      notif.id === notificationId ? { ...notif, isRead: true } : notif
    ));
  };

  // 标记为未读
  const markAsUnread = (notificationId: string) => {
    setNotifications(prev => prev.map(notif => 
      notif.id === notificationId ? { ...notif, isRead: false } : notif
    ));
  };

  // 切换收藏
  const toggleStar = (notificationId: string) => {
    setNotifications(prev => prev.map(notif => 
      notif.id === notificationId ? { ...notif, isStarred: !notif.isStarred } : notif
    ));
  };

  // 归档通知
  const archiveNotification = (notificationId: string) => {
    setNotifications(prev => prev.map(notif => 
      notif.id === notificationId ? { ...notif, isArchived: true } : notif
    ));
    toast.success('通知已归档');
  };

  // 删除通知
  const deleteNotification = (notificationId: string) => {
    setNotifications(prev => prev.filter(notif => notif.id !== notificationId));
    toast.success('通知已删除');
  };

  // 批量操作
  const handleBatchAction = (action: string) => {
    switch (action) {
      case 'read':
        setNotifications(prev => prev.map(notif => 
          selectedNotifications.includes(notif.id) ? { ...notif, isRead: true } : notif
        ));
        toast.success(`已标记 ${selectedNotifications.length} 条通知为已读`);
        break;
      case 'unread':
        setNotifications(prev => prev.map(notif => 
          selectedNotifications.includes(notif.id) ? { ...notif, isRead: false } : notif
        ));
        toast.success(`已标记 ${selectedNotifications.length} 条通知为未读`);
        break;
      case 'archive':
        setNotifications(prev => prev.map(notif => 
          selectedNotifications.includes(notif.id) ? { ...notif, isArchived: true } : notif
        ));
        toast.success(`已归档 ${selectedNotifications.length} 条通知`);
        break;
      case 'delete':
        setNotifications(prev => prev.filter(notif => !selectedNotifications.includes(notif.id)));
        toast.success(`已删除 ${selectedNotifications.length} 条通知`);
        break;
    }
    setSelectedNotifications([]);
  };

  // 全选/取消全选
  const toggleSelectAll = () => {
    if (selectedNotifications.length === filteredNotifications.length) {
      setSelectedNotifications([]);
    } else {
      setSelectedNotifications(filteredNotifications.map(notif => notif.id));
    }
  };

  // 统计数据
  const stats = {
    total: notifications.filter(notif => !notif.isArchived).length,
    unread: notifications.filter(notif => !notif.isRead && !notif.isArchived).length,
    starred: notifications.filter(notif => notif.isStarred && !notif.isArchived).length,
    archived: notifications.filter(notif => notif.isArchived).length
  };

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">项目通知</h1>
          <p className="text-muted-foreground">查看项目进度、任务更新和团队动态</p>
        </div>
        
        {selectedNotifications.length > 0 && (
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">
              已选择 {selectedNotifications.length} 条通知
            </span>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  批量操作
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem onClick={() => handleBatchAction('read')}>
                  <Eye className="h-4 w-4 mr-2" />
                  标记为已读
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleBatchAction('unread')}>
                  <EyeOff className="h-4 w-4 mr-2" />
                  标记为未读
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => handleBatchAction('archive')}>
                  <Archive className="h-4 w-4 mr-2" />
                  归档
                </DropdownMenuItem>
                <DropdownMenuItem 
                  className="text-red-600"
                  onClick={() => handleBatchAction('delete')}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  删除
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )}
      </div>

      {/* 搜索和过滤 */}
      <Card className="mb-6">
        <CardContent className="p-4">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="搜索通知标题或内容..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <div className="flex gap-2">
              <Select value={selectedType} onValueChange={setSelectedType}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="类型" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">全部类型</SelectItem>
                  {Object.entries(notificationTypeConfig).map(([key, config]) => (
                    <SelectItem key={key} value={key}>{config.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <Select value={selectedPriority} onValueChange={setSelectedPriority}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="优先级" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">全部优先级</SelectItem>
                  {Object.entries(priorityConfig).map(([key, config]) => (
                    <SelectItem key={key} value={key}>{config.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <Select value={selectedProject} onValueChange={setSelectedProject}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="项目" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">全部项目</SelectItem>
                  {mockProjects.map((project) => (
                    <SelectItem key={project.id} value={project.id}>{project.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 标签页 */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
        <TabsList>
          <TabsTrigger value="all">
            全部 ({stats.total})
          </TabsTrigger>
          <TabsTrigger value="unread">
            未读 ({stats.unread})
          </TabsTrigger>
          <TabsTrigger value="starred">
            收藏 ({stats.starred})
          </TabsTrigger>
          <TabsTrigger value="archived">
            归档 ({stats.archived})
          </TabsTrigger>
        </TabsList>
      </Tabs>

      {/* 通知列表 */}
      <div className="space-y-4">
        {/* 全选控制 */}
        {filteredNotifications.length > 0 && (
          <div className="flex items-center gap-2 p-2 bg-muted/50 rounded">
            <Checkbox
              checked={selectedNotifications.length === filteredNotifications.length}
              onCheckedChange={toggleSelectAll}
            />
            <span className="text-sm text-muted-foreground">
              {selectedNotifications.length === filteredNotifications.length ? '取消全选' : '全选'}
            </span>
          </div>
        )}
        
        {filteredNotifications.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <Bell className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">暂无通知</h3>
              <p className="text-muted-foreground">
                {searchQuery || selectedType !== 'all' || selectedPriority !== 'all' || selectedProject !== 'all'
                  ? '没有找到符合条件的通知'
                  : '您目前没有项目通知'}
              </p>
            </CardContent>
          </Card>
        ) : (
          filteredNotifications.map((notification) => {
            const TypeIcon = notificationTypeConfig[notification.type].icon;
            
            return (
              <Card key={notification.id} className={cn(
                'transition-all duration-200 hover:shadow-md',
                !notification.isRead && 'border-l-4 border-l-blue-500 bg-blue-50/50',
                notification.priority === 'urgent' && 'border-l-4 border-l-red-500 bg-red-50/50',
                selectedNotifications.includes(notification.id) && 'ring-2 ring-blue-500'
              )}>
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    {/* 选择框 */}
                    <Checkbox
                      checked={selectedNotifications.includes(notification.id)}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setSelectedNotifications(prev => [...prev, notification.id]);
                        } else {
                          setSelectedNotifications(prev => prev.filter(id => id !== notification.id));
                        }
                      }}
                      className="mt-1"
                    />
                    
                    {/* 通知图标 */}
                    <div className={cn(
                      'p-2 rounded-full',
                      notificationTypeConfig[notification.type].bgColor
                    )}>
                      <TypeIcon className={cn(
                        'h-5 w-5',
                        notificationTypeConfig[notification.type].color
                      )} />
                    </div>
                    
                    {/* 通知内容 */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className={cn(
                            'font-semibold text-lg',
                            !notification.isRead && 'text-blue-900'
                          )}>
                            {notification.title}
                          </h3>
                          
                          {/* 优先级标签 */}
                          <Badge className={cn(
                            'text-xs',
                            priorityConfig[notification.priority].color,
                            priorityConfig[notification.priority].bgColor
                          )}>
                            {priorityConfig[notification.priority].label}
                          </Badge>
                          
                          {/* 通知类型标签 */}
                          <Badge variant="outline" className="text-xs">
                            {notificationTypeConfig[notification.type].label}
                          </Badge>
                          
                          {/* 状态标签 */}
                          {notification.isStarred && (
                            <Star className="h-4 w-4 text-yellow-500 fill-current" />
                          )}
                          
                          {/* 截止日期提醒 */}
                          {notification.metadata?.dueDate && (
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger>
                                  <Badge variant="outline" className="text-xs text-red-600">
                                    <Clock className="h-3 w-3 mr-1" />
                                    {formatDueDate(notification.metadata.dueDate)}
                                  </Badge>
                                </TooltipTrigger>
                                <TooltipContent>
                                  截止时间：{notification.metadata.dueDate.toLocaleString('zh-CN')}
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          )}
                        </div>
                        
                        {/* 操作菜单 */}
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem 
                              onClick={() => notification.isRead ? markAsUnread(notification.id) : markAsRead(notification.id)}
                            >
                              {notification.isRead ? (
                                <><EyeOff className="h-4 w-4 mr-2" />标记为未读</>
                              ) : (
                                <><Eye className="h-4 w-4 mr-2" />标记为已读</>
                              )}
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => toggleStar(notification.id)}>
                              {notification.isStarred ? (
                                <><StarOff className="h-4 w-4 mr-2" />取消收藏</>
                              ) : (
                                <><Star className="h-4 w-4 mr-2" />收藏</>
                              )}
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => archiveNotification(notification.id)}>
                              <Archive className="h-4 w-4 mr-2" />
                              归档
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              className="text-red-600"
                              onClick={() => deleteNotification(notification.id)}
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              删除
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                      
                      {/* 项目和操作者信息 */}
                      <div className="flex items-center gap-2 mb-3">
                        <Avatar className="h-6 w-6">
                          <AvatarImage src={notification.projectAvatar} alt={notification.projectName} />
                          <AvatarFallback>{notification.projectName.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <span className="text-sm font-medium">{notification.projectName}</span>
                        <span className="text-sm text-muted-foreground">•</span>
                        <Avatar className="h-6 w-6">
                          <AvatarImage src={notification.actor.avatar} alt={notification.actor.name} />
                          <AvatarFallback>{notification.actor.name.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <span className="text-sm text-muted-foreground">
                          {notification.actor.name}
                          {notification.actor.role && ` • ${notification.actor.role}`}
                        </span>
                        <span className="text-sm text-muted-foreground">•</span>
                        <span className="text-sm text-muted-foreground">
                          {formatTime(notification.timestamp)}
                        </span>
                      </div>
                      
                      {/* 通知内容 */}
                      <p className="text-muted-foreground mb-4 leading-relaxed">
                        {notification.content}
                      </p>
                      
                      {/* 元数据信息 */}
                      {notification.metadata && (
                        <div className="mb-4">
                          {notification.metadata.progress !== undefined && (
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <TrendingUp className="h-4 w-4" />
                              <span>进度：{notification.metadata.progress}%</span>
                              {notification.metadata.expectedProgress && (
                                <span>（预期：{notification.metadata.expectedProgress}%）</span>
                              )}
                            </div>
                          )}
                          
                          {notification.metadata.oldValue && notification.metadata.newValue && (
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <Edit className="h-4 w-4" />
                              <span>
                                从 "{notification.metadata.oldValue}" 更改为 "{notification.metadata.newValue}"
                              </span>
                            </div>
                          )}
                          
                          {notification.metadata.amount && (
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <span>金额：¥{notification.metadata.amount.toLocaleString()}</span>
                              {notification.metadata.purpose && (
                                <span>• 用途：{notification.metadata.purpose}</span>
                              )}
                            </div>
                          )}
                          
                          {notification.metadata.meetingTime && (
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <Calendar className="h-4 w-4" />
                              <span>
                                时间：{notification.metadata.meetingTime.toLocaleString('zh-CN')}
                              </span>
                              {notification.metadata.location && (
                                <span>• 地点：{notification.metadata.location}</span>
                              )}
                            </div>
                          )}
                        </div>
                      )}
                      
                      {/* 操作按钮 */}
                      {notification.actions && notification.actions.length > 0 && (
                        <div className="flex gap-2 flex-wrap">
                          {notification.actions.map((action, index) => (
                            <Button 
                              key={index}
                              variant={index === 0 ? 'default' : 'outline'}
                              size="sm"
                              onClick={() => {
                                if (action.type === 'link' && action.url) {
                                  window.open(action.url, '_blank');
                                } else if (action.handler) {
                                  action.handler();
                                }
                                if (!notification.isRead) {
                                  markAsRead(notification.id);
                                }
                              }}
                            >
                              {action.type === 'link' && <ExternalLink className="h-4 w-4 mr-2" />}
                              {action.label}
                            </Button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}