'use client';

import { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from '@/components/ui/dialog';
import {
  History,
  Search,
  Filter,
  Eye,
  GitBranch,
  Edit,
  UserCheck,
  FileText,
  Calendar,
  Clock,
  User,
  Tag,
  AlertCircle,
  CheckCircle,
  XCircle,
  ArrowRight,
  Plus,
  Minus,
  RotateCcw
} from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';
import { zhCN } from 'date-fns/locale/zh-CN';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface HistoryEntry {
  id: string;
  action:
    | 'CREATE'
    | 'UPDATE'
    | 'STATUS_CHANGE'
    | 'ASSIGN'
    | 'COMMENT'
    | 'RELATION_ADD'
    | 'RELATION_REMOVE'
    | 'ARCHIVE'
    | 'RESTORE';
  field?: string;
  oldValue?: any;
  newValue?: any;
  description?: string;
  createdAt: Date;
  user: {
    id: string;
    name: string;
    email: string;
    avatar?: string;
  };
  metadata?: {
    ip?: string;
    userAgent?: string;
    source?: string;
  };
}

interface RequirementHistoryProps {
  requirementId: string;
}

const actionConfig = {
  CREATE: {
    label: '创建',
    color: 'bg-green-100 text-green-800',
    icon: Plus,
    description: '创建了需求'
  },
  UPDATE: {
    label: '更新',
    color: 'bg-blue-100 text-blue-800',
    icon: Edit,
    description: '更新了需求信息'
  },
  STATUS_CHANGE: {
    label: '状态变更',
    color: 'bg-purple-100 text-purple-800',
    icon: GitBranch,
    description: '变更了需求状态'
  },
  ASSIGN: {
    label: '分配',
    color: 'bg-orange-100 text-orange-800',
    icon: UserCheck,
    description: '分配了负责人'
  },
  COMMENT: {
    label: '评论',
    color: 'bg-gray-100 text-gray-800',
    icon: FileText,
    description: '添加了评论'
  },
  RELATION_ADD: {
    label: '添加关联',
    color: 'bg-cyan-100 text-cyan-800',
    icon: Plus,
    description: '添加了关联关系'
  },
  RELATION_REMOVE: {
    label: '移除关联',
    color: 'bg-red-100 text-red-800',
    icon: Minus,
    description: '移除了关联关系'
  },
  ARCHIVE: {
    label: '归档',
    color: 'bg-yellow-100 text-yellow-800',
    icon: AlertCircle,
    description: '归档了需求'
  },
  RESTORE: {
    label: '恢复',
    color: 'bg-green-100 text-green-800',
    icon: RotateCcw,
    description: '恢复了需求'
  }
};

const fieldLabels = {
  title: '标题',
  description: '描述',
  status: '状态',
  priority: '优先级',
  type: '类型',
  complexity: '复杂度',
  businessValue: '业务价值',
  estimatedEffort: '预估工作量',
  actualEffort: '实际工作量',
  dueDate: '截止日期',
  assigneeId: '负责人',
  projectId: '关联项目',
  acceptanceCriteria: '验收标准',
  businessRules: '业务规则',
  technicalNotes: '技术说明',
  tags: '标签'
};

const statusLabels = {
  DRAFT: '草稿',
  PENDING: '待评估',
  APPROVED: '已确认',
  IN_PROGRESS: '开发中',
  TESTING: '测试中',
  COMPLETED: '已完成',
  REJECTED: '已拒绝',
  CANCELLED: '已取消'
};

const priorityLabels = {
  LOW: '低',
  MEDIUM: '中',
  HIGH: '高',
  URGENT: '紧急'
};

export function RequirementHistory({ requirementId }: RequirementHistoryProps) {
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [actionFilter, setActionFilter] = useState<string>('ALL');
  const [userFilter, setUserFilter] = useState<string>('ALL');
  const [dateFilter, setDateFilter] = useState<string>('ALL');
  const [selectedEntry, setSelectedEntry] = useState<HistoryEntry | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchHistory();
  }, [requirementId]);

  const fetchHistory = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `/api/requirements/${requirementId}/history`
      );
      if (!response.ok) {
        throw new Error('获取变更历史失败');
      }

      const data = await response.json();
      setHistory(data.data);
    } catch (error) {
      console.error('获取变更历史失败:', error);
      toast({
        title: '错误',
        description: '获取变更历史失败，请稍后重试',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredHistory = history.filter((entry) => {
    // 搜索过滤
    if (
      searchQuery &&
      !(
        entry.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        entry.user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        actionConfig[entry.action].label
          .toLowerCase()
          .includes(searchQuery.toLowerCase())
      )
    ) {
      return false;
    }

    // 操作类型过滤
    if (actionFilter !== 'ALL' && entry.action !== actionFilter) {
      return false;
    }

    // 用户过滤
    if (userFilter !== 'ALL' && entry.user.id !== userFilter) {
      return false;
    }

    // 日期过滤
    if (dateFilter !== 'ALL') {
      const entryDate = new Date(entry.createdAt);
      const now = new Date();
      const daysDiff = Math.floor(
        (now.getTime() - entryDate.getTime()) / (1000 * 60 * 60 * 24)
      );

      switch (dateFilter) {
        case 'TODAY':
          if (daysDiff > 0) return false;
          break;
        case 'WEEK':
          if (daysDiff > 7) return false;
          break;
        case 'MONTH':
          if (daysDiff > 30) return false;
          break;
      }
    }

    return true;
  });

  const formatValue = (field: string, value: any) => {
    if (value === null || value === undefined) {
      return '无';
    }

    switch (field) {
      case 'status':
        return statusLabels[value as keyof typeof statusLabels] || value;
      case 'priority':
        return priorityLabels[value as keyof typeof priorityLabels] || value;
      case 'dueDate':
        return value
          ? format(new Date(value), 'yyyy年MM月dd日', { locale: zhCN })
          : '无';
      case 'businessValue':
      case 'estimatedEffort':
      case 'actualEffort':
        return `${value}`;
      case 'tags':
        return Array.isArray(value) ? value.join(', ') : value;
      default:
        return String(value);
    }
  };

  const getChangeDescription = (entry: HistoryEntry) => {
    const config = actionConfig[entry.action];

    if (entry.description) {
      return entry.description;
    }

    if (entry.action === 'UPDATE' && entry.field) {
      const fieldLabel =
        fieldLabels[entry.field as keyof typeof fieldLabels] || entry.field;
      const oldValue = formatValue(entry.field, entry.oldValue);
      const newValue = formatValue(entry.field, entry.newValue);
      return `将 ${fieldLabel} 从 "${oldValue}" 更改为 "${newValue}"`;
    }

    if (entry.action === 'STATUS_CHANGE') {
      const oldStatus = formatValue('status', entry.oldValue);
      const newStatus = formatValue('status', entry.newValue);
      return `将状态从 "${oldStatus}" 更改为 "${newStatus}"`;
    }

    return config.description;
  };

  const uniqueUsers = Array.from(new Set(history.map((entry) => entry.user.id)))
    .map((userId) => history.find((entry) => entry.user.id === userId)?.user)
    .filter(Boolean);

  if (loading) {
    return (
      <div className='space-y-4'>
        {[...Array(5)].map((_, i) => (
          <div key={i} className='flex space-x-3'>
            <div className='h-8 w-8 animate-pulse rounded-full bg-gray-200' />
            <div className='flex-1 space-y-2'>
              <div className='h-4 animate-pulse rounded bg-gray-200' />
              <div className='h-3 w-2/3 animate-pulse rounded bg-gray-200' />
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className='space-y-6'>
      {/* 过滤器 */}
      <Card>
        <CardHeader>
          <CardTitle className='flex items-center'>
            <Filter className='mr-2 h-5 w-5' />
            筛选条件
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className='grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4'>
            <div className='space-y-2'>
              <label className='text-sm font-medium'>搜索</label>
              <div className='relative'>
                <Search className='text-muted-foreground absolute top-3 left-3 h-4 w-4' />
                <Input
                  placeholder='搜索变更记录...'
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className='pl-10'
                />
              </div>
            </div>
            <div className='space-y-2'>
              <label className='text-sm font-medium'>操作类型</label>
              <Select value={actionFilter} onValueChange={setActionFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='ALL'>全部操作</SelectItem>
                  {Object.entries(actionConfig).map(([action, config]) => (
                    <SelectItem key={action} value={action}>
                      {config.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className='space-y-2'>
              <label className='text-sm font-medium'>操作人</label>
              <Select value={userFilter} onValueChange={setUserFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='ALL'>全部用户</SelectItem>
                  {uniqueUsers.map((user) => (
                    <SelectItem key={user!.id} value={user!.id}>
                      {user!.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className='space-y-2'>
              <label className='text-sm font-medium'>时间范围</label>
              <Select value={dateFilter} onValueChange={setDateFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='ALL'>全部时间</SelectItem>
                  <SelectItem value='TODAY'>今天</SelectItem>
                  <SelectItem value='WEEK'>最近一周</SelectItem>
                  <SelectItem value='MONTH'>最近一月</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 变更历史 */}
      <Card>
        <CardHeader>
          <CardTitle className='flex items-center'>
            <History className='mr-2 h-5 w-5' />
            变更历史
          </CardTitle>
          <CardDescription>
            共 {filteredHistory.length} 条变更记录
          </CardDescription>
        </CardHeader>
        <CardContent>
          {filteredHistory.length === 0 ? (
            <div className='py-12 text-center'>
              <History className='text-muted-foreground mx-auto mb-4 h-12 w-12' />
              <h3 className='mb-2 text-lg font-medium'>暂无变更记录</h3>
              <p className='text-muted-foreground'>
                {searchQuery ||
                actionFilter !== 'ALL' ||
                userFilter !== 'ALL' ||
                dateFilter !== 'ALL'
                  ? '没有符合筛选条件的变更记录'
                  : '还没有任何变更记录'}
              </p>
            </div>
          ) : (
            <div className='space-y-4'>
              {filteredHistory.map((entry, index) => {
                const config = actionConfig[entry.action];
                const Icon = config.icon;
                const isLast = index === filteredHistory.length - 1;

                return (
                  <div key={entry.id} className='relative'>
                    {/* 时间线 */}
                    {!isLast && (
                      <div className='absolute top-12 bottom-0 left-4 w-px bg-gray-200' />
                    )}

                    <div className='flex items-start space-x-4'>
                      {/* 图标 */}
                      <div
                        className={cn(
                          'flex h-8 w-8 items-center justify-center rounded-full border-2 border-white shadow-sm',
                          config.color
                        )}
                      >
                        <Icon className='h-4 w-4' />
                      </div>

                      {/* 内容 */}
                      <div className='min-w-0 flex-1'>
                        <div className='flex items-center justify-between'>
                          <div className='flex items-center space-x-2'>
                            <Badge className={config.color}>
                              {config.label}
                            </Badge>
                            <span className='text-muted-foreground text-sm'>
                              {formatDistanceToNow(new Date(entry.createdAt), {
                                addSuffix: true,
                                locale: zhCN
                              })}
                            </span>
                          </div>
                          <Button
                            variant='ghost'
                            size='sm'
                            onClick={() => {
                              setSelectedEntry(entry);
                              setShowDetails(true);
                            }}
                          >
                            <Eye className='h-4 w-4' />
                          </Button>
                        </div>

                        <div className='mt-1'>
                          <div className='flex items-center space-x-2'>
                            <Avatar className='h-6 w-6'>
                              <AvatarImage src={entry.user.avatar} />
                              <AvatarFallback className='text-xs'>
                                {entry.user.name.slice(0, 2)}
                              </AvatarFallback>
                            </Avatar>
                            <span className='text-sm font-medium'>
                              {entry.user.name}
                            </span>
                            <span className='text-muted-foreground text-sm'>
                              {getChangeDescription(entry)}
                            </span>
                          </div>
                        </div>

                        {/* 字段变更详情 */}
                        {entry.action === 'UPDATE' && entry.field && (
                          <div className='mt-2 rounded-lg bg-gray-50 p-3'>
                            <div className='flex items-center space-x-2 text-sm'>
                              <span className='font-medium'>
                                {fieldLabels[
                                  entry.field as keyof typeof fieldLabels
                                ] || entry.field}
                                :
                              </span>
                              <span className='text-red-600 line-through'>
                                {formatValue(entry.field, entry.oldValue)}
                              </span>
                              <ArrowRight className='text-muted-foreground h-3 w-3' />
                              <span className='font-medium text-green-600'>
                                {formatValue(entry.field, entry.newValue)}
                              </span>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* 详情对话框 */}
      <Dialog open={showDetails} onOpenChange={setShowDetails}>
        <DialogContent className='max-w-2xl'>
          <DialogHeader>
            <DialogTitle>变更详情</DialogTitle>
            <DialogDescription>查看变更记录的详细信息</DialogDescription>
          </DialogHeader>
          {selectedEntry && (
            <div className='space-y-4'>
              <div className='grid grid-cols-2 gap-4'>
                <div>
                  <label className='text-muted-foreground text-sm font-medium'>
                    操作类型
                  </label>
                  <div className='mt-1'>
                    <Badge className={actionConfig[selectedEntry.action].color}>
                      {actionConfig[selectedEntry.action].label}
                    </Badge>
                  </div>
                </div>
                <div>
                  <label className='text-muted-foreground text-sm font-medium'>
                    操作时间
                  </label>
                  <div className='mt-1 text-sm'>
                    {format(
                      new Date(selectedEntry.createdAt),
                      'yyyy年MM月dd日 HH:mm:ss',
                      { locale: zhCN }
                    )}
                  </div>
                </div>
              </div>

              <div>
                <label className='text-muted-foreground text-sm font-medium'>
                  操作人
                </label>
                <div className='mt-1 flex items-center space-x-2'>
                  <Avatar className='h-8 w-8'>
                    <AvatarImage src={selectedEntry.user.avatar} />
                    <AvatarFallback>
                      {selectedEntry.user.name.slice(0, 2)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <div className='font-medium'>{selectedEntry.user.name}</div>
                    <div className='text-muted-foreground text-sm'>
                      {selectedEntry.user.email}
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <label className='text-muted-foreground text-sm font-medium'>
                  变更描述
                </label>
                <div className='mt-1 text-sm'>
                  {getChangeDescription(selectedEntry)}
                </div>
              </div>

              {selectedEntry.field && (
                <div className='grid grid-cols-2 gap-4'>
                  <div>
                    <label className='text-muted-foreground text-sm font-medium'>
                      原值
                    </label>
                    <div className='mt-1 rounded border border-red-200 bg-red-50 p-2 text-sm'>
                      {formatValue(selectedEntry.field, selectedEntry.oldValue)}
                    </div>
                  </div>
                  <div>
                    <label className='text-muted-foreground text-sm font-medium'>
                      新值
                    </label>
                    <div className='mt-1 rounded border border-green-200 bg-green-50 p-2 text-sm'>
                      {formatValue(selectedEntry.field, selectedEntry.newValue)}
                    </div>
                  </div>
                </div>
              )}

              {selectedEntry.metadata && (
                <div>
                  <label className='text-muted-foreground text-sm font-medium'>
                    技术信息
                  </label>
                  <div className='text-muted-foreground mt-1 space-y-1 text-sm'>
                    {selectedEntry.metadata.ip && (
                      <div>IP 地址: {selectedEntry.metadata.ip}</div>
                    )}
                    {selectedEntry.metadata.source && (
                      <div>操作来源: {selectedEntry.metadata.source}</div>
                    )}
                    {selectedEntry.metadata.userAgent && (
                      <div
                        className='truncate'
                        title={selectedEntry.metadata.userAgent}
                      >
                        用户代理: {selectedEntry.metadata.userAgent}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
