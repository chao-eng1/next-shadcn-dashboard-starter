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
  AlertTriangle, 
  Info, 
  CheckCircle, 
  XCircle,
  Search,
  Filter,
  MoreVertical,
  Trash2,
  Archive,
  Star,
  StarOff,
  Eye,
  EyeOff,
  Download,
  ExternalLink,
  Calendar,
  Clock,
  User,
  Settings,
  Shield,
  Zap,
  TrendingUp,
  AlertCircle,
  FileText,
  Users,
  Briefcase
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

// 系统消息类型
interface SystemMessage {
  id: string;
  title: string;
  content: string;
  type: 'info' | 'warning' | 'error' | 'success' | 'announcement' | 'maintenance' | 'security' | 'update';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  category: 'system' | 'security' | 'maintenance' | 'feature' | 'policy' | 'performance';
  timestamp: Date;
  isRead: boolean;
  isStarred: boolean;
  isArchived: boolean;
  sender: {
    name: string;
    role: string;
    avatar?: string;
  };
  actions?: {
    label: string;
    type: 'link' | 'download' | 'action';
    url?: string;
    handler?: () => void;
  }[];
  attachments?: {
    id: string;
    name: string;
    size: number;
    type: string;
    url: string;
  }[];
  expiresAt?: Date;
  readBy?: {
    userId: string;
    userName: string;
    readAt: Date;
  }[];
}

// 模拟系统消息数据
const mockSystemMessages: SystemMessage[] = [
  {
    id: '1',
    title: '系统维护通知',
    content: '系统将于今晚23:00-01:00进行例行维护，期间可能会出现短暂的服务中断。维护期间将升级数据库和优化系统性能，预计维护时间为2小时。如有紧急情况，请联系技术支持团队。',
    type: 'maintenance',
    priority: 'high',
    category: 'maintenance',
    timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
    isRead: false,
    isStarred: true,
    isArchived: false,
    sender: {
      name: '系统管理员',
      role: '技术团队',
      avatar: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?prompt=professional%20system%20administrator%20icon%20blue%20gradient&image_size=square'
    },
    actions: [
      {
        label: '查看详情',
        type: 'link',
        url: '/maintenance-details'
      }
    ],
    expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000)
  },
  {
    id: '2',
    title: '新功能发布：消息中心模块',
    content: '我们很高兴地宣布，全新的消息中心模块现已正式上线！新功能包括：实时消息推送、群组聊天、文件分享、消息搜索等。欢迎大家体验并提供反馈。',
    type: 'announcement',
    priority: 'medium',
    category: 'feature',
    timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000),
    isRead: true,
    isStarred: false,
    isArchived: false,
    sender: {
      name: '产品团队',
      role: '产品部',
      avatar: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?prompt=modern%20product%20team%20icon%20purple%20gradient&image_size=square'
    },
    actions: [
      {
        label: '体验新功能',
        type: 'link',
        url: '/dashboard/messages'
      },
      {
        label: '功能指南',
        type: 'download',
        url: '/guides/message-center.pdf'
      }
    ],
    attachments: [
      {
        id: 'att1',
        name: '消息中心功能指南.pdf',
        size: 1024000,
        type: 'application/pdf',
        url: '#'
      }
    ]
  },
  {
    id: '3',
    title: '安全警告：检测到异常登录',
    content: '系统检测到您的账户在异地有登录行为，登录时间：2024年1月15日 14:30，登录地点：上海。如果这不是您本人的操作，请立即修改密码并联系安全团队。',
    type: 'security',
    priority: 'urgent',
    category: 'security',
    timestamp: new Date(Date.now() - 12 * 60 * 60 * 1000),
    isRead: false,
    isStarred: false,
    isArchived: false,
    sender: {
      name: '安全中心',
      role: '安全团队',
      avatar: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?prompt=security%20shield%20icon%20red%20gradient&image_size=square'
    },
    actions: [
      {
        label: '修改密码',
        type: 'link',
        url: '/security/change-password'
      },
      {
        label: '查看登录记录',
        type: 'link',
        url: '/security/login-history'
      }
    ]
  },
  {
    id: '4',
    title: '系统性能优化完成',
    content: '经过技术团队的努力，系统性能优化工作已经完成。主要改进包括：页面加载速度提升40%，数据库查询优化，内存使用率降低25%。感谢大家的耐心等待。',
    type: 'success',
    priority: 'low',
    category: 'performance',
    timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000),
    isRead: true,
    isStarred: false,
    isArchived: false,
    sender: {
      name: '技术团队',
      role: '开发部',
      avatar: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?prompt=technical%20team%20icon%20green%20gradient&image_size=square'
    }
  },
  {
    id: '5',
    title: '隐私政策更新',
    content: '根据最新的数据保护法规要求，我们更新了隐私政策。主要变更包括：数据收集范围的明确说明、用户权利的详细描述、数据处理流程的透明化。请仔细阅读并确认。',
    type: 'info',
    priority: 'medium',
    category: 'policy',
    timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
    isRead: false,
    isStarred: false,
    isArchived: false,
    sender: {
      name: '法务部',
      role: '合规团队',
      avatar: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?prompt=legal%20compliance%20icon%20gray%20gradient&image_size=square'
    },
    actions: [
      {
        label: '查看隐私政策',
        type: 'link',
        url: '/privacy-policy'
      }
    ],
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
  },
  {
    id: '6',
    title: '服务器升级通知',
    content: '为了提供更好的服务体验，我们将在本周末对服务器进行升级。升级期间服务不会中断，但可能会有轻微的延迟。升级完成后，系统稳定性和响应速度都将得到显著提升。',
    type: 'update',
    priority: 'low',
    category: 'system',
    timestamp: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
    isRead: true,
    isStarred: false,
    isArchived: true,
    sender: {
      name: '运维团队',
      role: '技术部',
      avatar: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?prompt=server%20operations%20icon%20blue%20gradient&image_size=square'
    }
  }
];

// 消息类型配置
const messageTypeConfig = {
  info: { icon: Info, color: 'text-blue-600', bgColor: 'bg-blue-100', label: '信息' },
  warning: { icon: AlertTriangle, color: 'text-yellow-600', bgColor: 'bg-yellow-100', label: '警告' },
  error: { icon: XCircle, color: 'text-red-600', bgColor: 'bg-red-100', label: '错误' },
  success: { icon: CheckCircle, color: 'text-green-600', bgColor: 'bg-green-100', label: '成功' },
  announcement: { icon: Bell, color: 'text-purple-600', bgColor: 'bg-purple-100', label: '公告' },
  maintenance: { icon: Settings, color: 'text-orange-600', bgColor: 'bg-orange-100', label: '维护' },
  security: { icon: Shield, color: 'text-red-600', bgColor: 'bg-red-100', label: '安全' },
  update: { icon: Zap, color: 'text-blue-600', bgColor: 'bg-blue-100', label: '更新' }
};

// 优先级配置
const priorityConfig = {
  low: { color: 'text-gray-600', bgColor: 'bg-gray-100', label: '低' },
  medium: { color: 'text-blue-600', bgColor: 'bg-blue-100', label: '中' },
  high: { color: 'text-orange-600', bgColor: 'bg-orange-100', label: '高' },
  urgent: { color: 'text-red-600', bgColor: 'bg-red-100', label: '紧急' }
};

// 分类配置
const categoryConfig = {
  system: { icon: Settings, label: '系统' },
  security: { icon: Shield, label: '安全' },
  maintenance: { icon: Settings, label: '维护' },
  feature: { icon: Zap, label: '功能' },
  policy: { icon: FileText, label: '政策' },
  performance: { icon: TrendingUp, label: '性能' }
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

// 文件大小格式化
const formatFileSize = (bytes: number) => {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

export default function SystemMessagesPage() {
  const [messages, setMessages] = useState<SystemMessage[]>(mockSystemMessages);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [selectedPriority, setSelectedPriority] = useState<string>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [showArchived, setShowArchived] = useState(false);
  const [selectedMessages, setSelectedMessages] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState('all');

  // 过滤消息
  const filteredMessages = messages.filter(message => {
    // 搜索过滤
    if (searchQuery && !message.title.toLowerCase().includes(searchQuery.toLowerCase()) && 
        !message.content.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false;
    }
    
    // 类型过滤
    if (selectedType !== 'all' && message.type !== selectedType) {
      return false;
    }
    
    // 优先级过滤
    if (selectedPriority !== 'all' && message.priority !== selectedPriority) {
      return false;
    }
    
    // 分类过滤
    if (selectedCategory !== 'all' && message.category !== selectedCategory) {
      return false;
    }
    
    // 归档过滤
    if (!showArchived && message.isArchived) {
      return false;
    }
    
    // 标签页过滤
    switch (activeTab) {
      case 'unread':
        return !message.isRead;
      case 'starred':
        return message.isStarred;
      case 'archived':
        return message.isArchived;
      default:
        return !message.isArchived;
    }
  });

  // 标记为已读
  const markAsRead = (messageId: string) => {
    setMessages(prev => prev.map(msg => 
      msg.id === messageId ? { ...msg, isRead: true } : msg
    ));
  };

  // 标记为未读
  const markAsUnread = (messageId: string) => {
    setMessages(prev => prev.map(msg => 
      msg.id === messageId ? { ...msg, isRead: false } : msg
    ));
  };

  // 切换收藏
  const toggleStar = (messageId: string) => {
    setMessages(prev => prev.map(msg => 
      msg.id === messageId ? { ...msg, isStarred: !msg.isStarred } : msg
    ));
  };

  // 归档消息
  const archiveMessage = (messageId: string) => {
    setMessages(prev => prev.map(msg => 
      msg.id === messageId ? { ...msg, isArchived: true } : msg
    ));
    toast.success('消息已归档');
  };

  // 删除消息
  const deleteMessage = (messageId: string) => {
    setMessages(prev => prev.filter(msg => msg.id !== messageId));
    toast.success('消息已删除');
  };

  // 批量操作
  const handleBatchAction = (action: string) => {
    switch (action) {
      case 'read':
        setMessages(prev => prev.map(msg => 
          selectedMessages.includes(msg.id) ? { ...msg, isRead: true } : msg
        ));
        toast.success(`已标记 ${selectedMessages.length} 条消息为已读`);
        break;
      case 'unread':
        setMessages(prev => prev.map(msg => 
          selectedMessages.includes(msg.id) ? { ...msg, isRead: false } : msg
        ));
        toast.success(`已标记 ${selectedMessages.length} 条消息为未读`);
        break;
      case 'archive':
        setMessages(prev => prev.map(msg => 
          selectedMessages.includes(msg.id) ? { ...msg, isArchived: true } : msg
        ));
        toast.success(`已归档 ${selectedMessages.length} 条消息`);
        break;
      case 'delete':
        setMessages(prev => prev.filter(msg => !selectedMessages.includes(msg.id)));
        toast.success(`已删除 ${selectedMessages.length} 条消息`);
        break;
    }
    setSelectedMessages([]);
  };

  // 全选/取消全选
  const toggleSelectAll = () => {
    if (selectedMessages.length === filteredMessages.length) {
      setSelectedMessages([]);
    } else {
      setSelectedMessages(filteredMessages.map(msg => msg.id));
    }
  };

  // 统计数据
  const stats = {
    total: messages.filter(msg => !msg.isArchived).length,
    unread: messages.filter(msg => !msg.isRead && !msg.isArchived).length,
    starred: messages.filter(msg => msg.isStarred && !msg.isArchived).length,
    archived: messages.filter(msg => msg.isArchived).length
  };

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">系统消息</h1>
          <p className="text-muted-foreground">查看系统通知、公告和重要信息</p>
        </div>
        
        {selectedMessages.length > 0 && (
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">
              已选择 {selectedMessages.length} 条消息
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
                  placeholder="搜索消息标题或内容..."
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
                  {Object.entries(messageTypeConfig).map(([key, config]) => (
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
              
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="分类" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">全部分类</SelectItem>
                  {Object.entries(categoryConfig).map(([key, config]) => (
                    <SelectItem key={key} value={key}>{config.label}</SelectItem>
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

      {/* 消息列表 */}
      <div className="space-y-4">
        {/* 全选控制 */}
        {filteredMessages.length > 0 && (
          <div className="flex items-center gap-2 p-2 bg-muted/50 rounded">
            <Checkbox
              checked={selectedMessages.length === filteredMessages.length}
              onCheckedChange={toggleSelectAll}
            />
            <span className="text-sm text-muted-foreground">
              {selectedMessages.length === filteredMessages.length ? '取消全选' : '全选'}
            </span>
          </div>
        )}
        
        {filteredMessages.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <Bell className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">暂无消息</h3>
              <p className="text-muted-foreground">
                {searchQuery || selectedType !== 'all' || selectedPriority !== 'all' || selectedCategory !== 'all'
                  ? '没有找到符合条件的消息'
                  : '您目前没有系统消息'}
              </p>
            </CardContent>
          </Card>
        ) : (
          filteredMessages.map((message) => {
            const TypeIcon = messageTypeConfig[message.type].icon;
            const CategoryIcon = categoryConfig[message.category].icon;
            
            return (
              <Card key={message.id} className={cn(
                'transition-all duration-200 hover:shadow-md',
                !message.isRead && 'border-l-4 border-l-blue-500 bg-blue-50/50',
                message.priority === 'urgent' && 'border-l-4 border-l-red-500 bg-red-50/50',
                selectedMessages.includes(message.id) && 'ring-2 ring-blue-500'
              )}>
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    {/* 选择框 */}
                    <Checkbox
                      checked={selectedMessages.includes(message.id)}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setSelectedMessages(prev => [...prev, message.id]);
                        } else {
                          setSelectedMessages(prev => prev.filter(id => id !== message.id));
                        }
                      }}
                      className="mt-1"
                    />
                    
                    {/* 消息图标 */}
                    <div className={cn(
                      'p-2 rounded-full',
                      messageTypeConfig[message.type].bgColor
                    )}>
                      <TypeIcon className={cn(
                        'h-5 w-5',
                        messageTypeConfig[message.type].color
                      )} />
                    </div>
                    
                    {/* 消息内容 */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className={cn(
                            'font-semibold text-lg',
                            !message.isRead && 'text-blue-900'
                          )}>
                            {message.title}
                          </h3>
                          
                          {/* 优先级标签 */}
                          <Badge className={cn(
                            'text-xs',
                            priorityConfig[message.priority].color,
                            priorityConfig[message.priority].bgColor
                          )}>
                            {priorityConfig[message.priority].label}
                          </Badge>
                          
                          {/* 分类标签 */}
                          <Badge variant="outline" className="text-xs">
                            <CategoryIcon className="h-3 w-3 mr-1" />
                            {categoryConfig[message.category].label}
                          </Badge>
                          
                          {/* 状态标签 */}
                          {message.isStarred && (
                            <Star className="h-4 w-4 text-yellow-500 fill-current" />
                          )}
                          
                          {message.expiresAt && new Date() < message.expiresAt && (
                            <Badge variant="outline" className="text-xs text-orange-600">
                              <Clock className="h-3 w-3 mr-1" />
                              即将过期
                            </Badge>
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
                              onClick={() => message.isRead ? markAsUnread(message.id) : markAsRead(message.id)}
                            >
                              {message.isRead ? (
                                <><EyeOff className="h-4 w-4 mr-2" />标记为未读</>
                              ) : (
                                <><Eye className="h-4 w-4 mr-2" />标记为已读</>
                              )}
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => toggleStar(message.id)}>
                              {message.isStarred ? (
                                <><StarOff className="h-4 w-4 mr-2" />取消收藏</>
                              ) : (
                                <><Star className="h-4 w-4 mr-2" />收藏</>
                              )}
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => archiveMessage(message.id)}>
                              <Archive className="h-4 w-4 mr-2" />
                              归档
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              className="text-red-600"
                              onClick={() => deleteMessage(message.id)}
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              删除
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                      
                      {/* 发送者信息 */}
                      <div className="flex items-center gap-2 mb-3">
                        <Avatar className="h-6 w-6">
                          <AvatarImage src={message.sender.avatar} alt={message.sender.name} />
                          <AvatarFallback>{message.sender.name.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <span className="text-sm text-muted-foreground">
                          {message.sender.name} • {message.sender.role}
                        </span>
                        <span className="text-sm text-muted-foreground">•</span>
                        <span className="text-sm text-muted-foreground">
                          {formatTime(message.timestamp)}
                        </span>
                      </div>
                      
                      {/* 消息内容 */}
                      <p className="text-muted-foreground mb-4 leading-relaxed">
                        {message.content}
                      </p>
                      
                      {/* 附件 */}
                      {message.attachments && message.attachments.length > 0 && (
                        <div className="mb-4">
                          <h4 className="text-sm font-medium mb-2">附件</h4>
                          <div className="space-y-2">
                            {message.attachments.map((attachment) => (
                              <div key={attachment.id} className="flex items-center gap-3 p-2 bg-muted rounded border">
                                <FileText className="h-6 w-6 text-muted-foreground" />
                                <div className="flex-1 min-w-0">
                                  <p className="font-medium truncate">{attachment.name}</p>
                                  <p className="text-sm text-muted-foreground">
                                    {formatFileSize(attachment.size)}
                                  </p>
                                </div>
                                <Button size="sm" variant="ghost">
                                  <Download className="h-4 w-4" />
                                </Button>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                      
                      {/* 操作按钮 */}
                      {message.actions && message.actions.length > 0 && (
                        <div className="flex gap-2 flex-wrap">
                          {message.actions.map((action, index) => (
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
                                if (!message.isRead) {
                                  markAsRead(message.id);
                                }
                              }}
                            >
                              {action.type === 'link' && <ExternalLink className="h-4 w-4 mr-2" />}
                              {action.type === 'download' && <Download className="h-4 w-4 mr-2" />}
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