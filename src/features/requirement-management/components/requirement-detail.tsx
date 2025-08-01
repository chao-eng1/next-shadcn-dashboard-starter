'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Edit,
  MoreHorizontal,
  Calendar,
  User,
  Target,
  Clock,
  Tag,
  FileText,
  Link,
  AlertCircle,
  CheckCircle,
  XCircle,
  Archive,
  Copy,
  ExternalLink,
  Share2,
  Star,
  Eye,
  Activity,
  Zap
} from 'lucide-react';
import { formatDistanceToNow, format } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface Requirement {
  id: string;
  title: string;
  description: string;
  status: 'DRAFT' | 'PENDING' | 'APPROVED' | 'IN_PROGRESS' | 'TESTING' | 'COMPLETED' | 'REJECTED' | 'CANCELLED';
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  type: 'FUNCTIONAL' | 'NON_FUNCTIONAL' | 'TECHNICAL' | 'BUSINESS';
  complexity: 'SIMPLE' | 'MEDIUM' | 'COMPLEX' | 'VERY_COMPLEX';
  businessValue: number;
  estimatedEffort: number;
  actualEffort?: number;
  dueDate?: Date;
  createdAt: Date;
  updatedAt: Date;
  acceptanceCriteria?: string;
  businessRules?: string;
  technicalNotes?: string;
  project?: {
    id: string;
    name: string;
  };
  assignee?: {
    id: string;
    name: string;
    email: string;
  };
  creator: {
    id: string;
    name: string;
    email: string;
  };
  tags: Array<{
    tag: {
      id: string;
      name: string;
      color: string;
    };
  }>;
  dependencies: Array<{
    dependency: {
      id: string;
      title: string;
      status: string;
    };
  }>;
  dependents: Array<{
    dependent: {
      id: string;
      title: string;
      status: string;
    };
  }>;
}

interface RequirementDetailProps {
  requirementId: string;
}

const statusConfig = {
  DRAFT: { label: '草稿', color: 'bg-gray-100 text-gray-800', icon: FileText },
  PENDING: { label: '待评估', color: 'bg-yellow-100 text-yellow-800', icon: Clock },
  APPROVED: { label: '已确认', color: 'bg-blue-100 text-blue-800', icon: CheckCircle },
  IN_PROGRESS: { label: '开发中', color: 'bg-purple-100 text-purple-800', icon: Clock },
  TESTING: { label: '测试中', color: 'bg-orange-100 text-orange-800', icon: AlertCircle },
  COMPLETED: { label: '已完成', color: 'bg-green-100 text-green-800', icon: CheckCircle },
  REJECTED: { label: '已拒绝', color: 'bg-red-100 text-red-800', icon: XCircle },
  CANCELLED: { label: '已取消', color: 'bg-gray-100 text-gray-800', icon: XCircle }
};

const priorityConfig = {
  LOW: { label: '低', color: 'bg-green-100 text-green-800' },
  MEDIUM: { label: '中', color: 'bg-yellow-100 text-yellow-800' },
  HIGH: { label: '高', color: 'bg-orange-100 text-orange-800' },
  URGENT: { label: '紧急', color: 'bg-red-100 text-red-800' }
};

const typeConfig = {
  FUNCTIONAL: { label: '功能性', color: 'bg-blue-100 text-blue-800' },
  NON_FUNCTIONAL: { label: '非功能性', color: 'bg-purple-100 text-purple-800' },
  TECHNICAL: { label: '技术性', color: 'bg-gray-100 text-gray-800' },
  BUSINESS: { label: '业务性', color: 'bg-green-100 text-green-800' }
};

const complexityConfig = {
  SIMPLE: { label: '简单', points: 1, color: 'bg-green-100 text-green-800' },
  MEDIUM: { label: '中等', points: 3, color: 'bg-yellow-100 text-yellow-800' },
  COMPLEX: { label: '复杂', points: 5, color: 'bg-orange-100 text-orange-800' },
  VERY_COMPLEX: { label: '非常复杂', points: 8, color: 'bg-red-100 text-red-800' }
};

export function RequirementDetail({ requirementId }: RequirementDetailProps) {
  const [requirement, setRequirement] = useState<Requirement | null>(null);
  const [loading, setLoading] = useState(true);
  const [showStatusUpdate, setShowStatusUpdate] = useState(false);
  const [newStatus, setNewStatus] = useState('');
  const [statusComment, setStatusComment] = useState('');
  const [updating, setUpdating] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    fetchRequirement();
  }, [requirementId]);

  const fetchRequirement = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/requirements/${requirementId}`);
      if (!response.ok) {
        throw new Error('获取需求详情失败');
      }
      
      const data = await response.json();
      setRequirement(data.data);
    } catch (error) {
      console.error('获取需求详情失败:', error);
      toast({
        title: '错误',
        description: '获取需求详情失败，请稍后重试',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async () => {
    if (!newStatus || !requirement) {
      return;
    }

    try {
      setUpdating(true);
      const response = await fetch(`/api/requirements/${requirementId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          status: newStatus,
          comment: statusComment
        })
      });

      if (!response.ok) {
        throw new Error('更新状态失败');
      }

      toast({
        title: '成功',
        description: '需求状态已更新'
      });

      setShowStatusUpdate(false);
      setNewStatus('');
      setStatusComment('');
      fetchRequirement();
    } catch (error) {
      console.error('更新状态失败:', error);
      toast({
        title: '错误',
        description: '更新状态失败，请稍后重试',
        variant: 'destructive'
      });
    } finally {
      setUpdating(false);
    }
  };

  const handleEdit = () => {
    router.push(`/dashboard/requirements/${requirementId}/edit`);
  };

  const handleDuplicate = async () => {
    try {
      const response = await fetch('/api/requirements/duplicate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ids: [requirementId]
        })
      });

      if (!response.ok) {
        throw new Error('复制需求失败');
      }

      const result = await response.json();
      toast({
        title: '成功',
        description: '需求已复制'
      });

      router.push(`/dashboard/requirements/${result.data[0].id}`);
    } catch (error) {
      console.error('复制需求失败:', error);
      toast({
        title: '错误',
        description: '复制需求失败，请稍后重试',
        variant: 'destructive'
      });
    }
  };

  const handleArchive = async () => {
    if (!confirm('确定要归档这个需求吗？')) {
      return;
    }

    try {
      const response = await fetch(`/api/requirements/${requirementId}/archive`, {
        method: 'POST'
      });

      if (!response.ok) {
        throw new Error('归档需求失败');
      }

      toast({
        title: '成功',
        description: '需求已归档'
      });

      router.push('/dashboard/requirements');
    } catch (error) {
      console.error('归档需求失败:', error);
      toast({
        title: '错误',
        description: '归档需求失败，请稍后重试',
        variant: 'destructive'
      });
    }
  };

  const getProgressPercentage = () => {
    if (!requirement) return 0;
    
    const statusProgress = {
      DRAFT: 0,
      PENDING: 10,
      APPROVED: 25,
      IN_PROGRESS: 50,
      TESTING: 80,
      COMPLETED: 100,
      REJECTED: 0,
      CANCELLED: 0
    };
    
    return statusProgress[requirement.status] || 0;
  };

  const isOverdue = () => {
    if (!requirement?.dueDate) return false;
    return new Date(requirement.dueDate) < new Date() && requirement.status !== 'COMPLETED';
  };

  if (loading) {
    return (
      <div className="space-y-6">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-48 bg-gray-100 rounded animate-pulse" />
        ))}
      </div>
    );
  }

  if (!requirement) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <div className="text-center space-y-2">
            <h3 className="text-lg font-medium">需求不存在</h3>
            <p className="text-muted-foreground">找不到指定的需求</p>
            <Button onClick={() => router.push('/dashboard/requirements')}>
              返回需求列表
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  const StatusIcon = statusConfig[requirement.status].icon;

  return (
    <div className="space-y-8">
      {/* 美化的头部信息 */}
      <Card className="border-0 shadow-xl bg-gradient-to-br from-white via-blue-50/30 to-indigo-50/50 dark:from-gray-900 dark:via-blue-950/20 dark:to-indigo-950/30">
        <CardHeader className="pb-6">
          <div className="flex items-start justify-between">
            <div className="space-y-4 flex-1">
              <div className="flex items-center space-x-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-100 to-indigo-100 dark:from-blue-900/20 dark:to-indigo-900/20">
                  <Target className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <Badge className={statusConfig[requirement.status].color}>
                    <StatusIcon className="h-3 w-3 mr-1" />
                    {statusConfig[requirement.status].label}
                  </Badge>
                  <Badge className={priorityConfig[requirement.priority].color}>
                    {priorityConfig[requirement.priority].label}
                  </Badge>
                  <Badge variant="outline" className={typeConfig[requirement.type].color}>
                    {typeConfig[requirement.type].label}
                  </Badge>
                  {isOverdue() && (
                    <Badge variant="destructive">
                      <AlertCircle className="h-3 w-3 mr-1" />
                      已逾期
                    </Badge>
                  )}
                </div>
              </div>
              <div className="space-y-2">
                <CardTitle className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent leading-tight">
                  {requirement.title}
                </CardTitle>
                <CardDescription className="text-base leading-relaxed text-muted-foreground">
                  {requirement.description}
                </CardDescription>
              </div>
            </div>
            <div className="flex space-x-2 ml-4">
              <Button onClick={handleEdit} className="hover:bg-blue-50 hover:border-blue-200 dark:hover:bg-blue-900/20">
                <Edit className="h-4 w-4 mr-2" />
                编辑
              </Button>
              <Button variant="outline" size="sm" className="hover:bg-green-50 hover:border-green-200 dark:hover:bg-green-900/20">
                <Share2 className="h-4 w-4 mr-2" />
                分享
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="icon">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuLabel>操作</DropdownMenuLabel>
                  <DropdownMenuItem onClick={() => setShowStatusUpdate(true)}>
                    更新状态
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleDuplicate}>
                    <Copy className="mr-2 h-4 w-4" />
                    复制需求
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleArchive}>
                    <Archive className="mr-2 h-4 w-4" />
                    归档需求
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* 美化的进度条 */}
          <div className="space-y-3 p-4 rounded-xl bg-gradient-to-r from-blue-50/50 to-indigo-50/50 dark:from-blue-900/10 dark:to-indigo-900/10 border border-blue-100 dark:border-blue-800/30">
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium text-blue-700 dark:text-blue-300">完成进度</span>
              <span className="font-bold text-blue-900 dark:text-blue-100">{getProgressPercentage()}%</span>
            </div>
            <Progress value={getProgressPercentage()} className="h-3 bg-blue-100 dark:bg-blue-900/20" />
          </div>
        </CardContent>
      </Card>

      {/* 美化的基本信息 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="border-0 shadow-lg bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 hover:shadow-xl transition-all duration-300">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold flex items-center text-blue-700 dark:text-blue-300">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-900/30 mr-3">
                <Zap className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              </div>
              复杂度
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Badge className={complexityConfig[requirement.complexity].color}>
                {complexityConfig[requirement.complexity].label}
                ({complexityConfig[requirement.complexity].points}分)
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20 hover:shadow-xl transition-all duration-300">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold flex items-center text-green-700 dark:text-green-300">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-green-100 dark:bg-green-900/30 mr-3">
                <Target className="h-4 w-4 text-green-600 dark:text-green-400" />
              </div>
              业务价值
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="font-semibold text-2xl text-green-900 dark:text-green-100">{requirement.businessValue}/100</div>
              <div className="w-full h-2 bg-green-100 dark:bg-green-900/20 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-green-400 to-emerald-400 transition-all duration-300" style={{width: `${requirement.businessValue}%`}} />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg bg-gradient-to-br from-orange-50 to-yellow-50 dark:from-orange-950/20 dark:to-yellow-950/20 hover:shadow-xl transition-all duration-300">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold flex items-center text-orange-700 dark:text-orange-300">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-orange-100 dark:bg-orange-900/30 mr-3">
                <Clock className="h-4 w-4 text-orange-600 dark:text-orange-400" />
              </div>
              工作量
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="font-semibold text-2xl text-orange-900 dark:text-orange-100">{requirement.estimatedEffort}h</div>
              <div className="text-sm text-orange-600/70 dark:text-orange-400/70">预估工时</div>
              {requirement.actualEffort && (
                <div className="text-sm text-orange-600/70 dark:text-orange-400/70">实际: {requirement.actualEffort}h</div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg bg-gradient-to-br from-purple-50 to-violet-50 dark:from-purple-950/20 dark:to-violet-950/20 hover:shadow-xl transition-all duration-300">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold flex items-center text-purple-700 dark:text-purple-300">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-100 dark:bg-purple-900/30 mr-3">
                <Calendar className="h-4 w-4 text-purple-600 dark:text-purple-400" />
              </div>
              截止日期
            </CardTitle>
          </CardHeader>
          <CardContent>
            {requirement.dueDate ? (
              <div className="space-y-2">
                <div className={cn(
                  "font-semibold text-purple-900 dark:text-purple-100",
                  isOverdue() && "text-red-600 dark:text-red-400"
                )}>
                  {format(new Date(requirement.dueDate), 'MM月dd日', { locale: zhCN })}
                </div>
                <Badge className={isOverdue() 
                  ? 'bg-red-100 text-red-800 border-red-200 dark:bg-red-900/20 dark:text-red-300 dark:border-red-800'
                  : 'bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-900/20 dark:text-purple-300 dark:border-purple-800'
                }>
                  {isOverdue() ? '已逾期' : '进行中'}
                </Badge>
              </div>
            ) : (
              <div className="text-muted-foreground text-sm">未设置</div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* 时间信息 */}
      <Card className="border-0 shadow-lg bg-gradient-to-br from-white to-gray-50/50 dark:from-gray-900 dark:to-gray-800/50">
        <CardHeader>
          <CardTitle className="text-lg flex items-center">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-700 mr-3">
              <Clock className="h-4 w-4 text-gray-600 dark:text-gray-400" />
            </div>
            时间信息
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div className="p-3 rounded-lg bg-gray-50 dark:bg-gray-800/50">
              <Label className="text-sm text-muted-foreground">创建时间</Label>
              <div className="mt-1 text-sm font-medium">
                {format(new Date(requirement.createdAt), 'yyyy年MM月dd日 HH:mm', { locale: zhCN })}
              </div>
            </div>
            <div className="p-3 rounded-lg bg-gray-50 dark:bg-gray-800/50">
              <Label className="text-sm text-muted-foreground">更新时间</Label>
              <div className="mt-1 text-sm font-medium">
                {formatDistanceToNow(new Date(requirement.updatedAt), {
                  addSuffix: true,
                  locale: zhCN
                })}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">项目和人员</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* 关联项目 */}
            {requirement.project ? (
              <div>
                <Label className="text-sm text-muted-foreground">关联项目</Label>
                <div className="mt-1 flex items-center space-x-2">
                  <Tag className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">{requirement.project.name}</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => router.push(`/dashboard/projects/${requirement.project?.id}`)}
                  >
                    <ExternalLink className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            ) : (
              <div>
                <Label className="text-sm text-muted-foreground">关联项目</Label>
                <div className="mt-1 text-sm text-muted-foreground">未关联项目</div>
              </div>
            )}

            {/* 负责人 */}
            {requirement.assignee ? (
              <div>
                <Label className="text-sm text-muted-foreground">负责人</Label>
                <div className="mt-1 flex items-center space-x-3">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src="" />
                    <AvatarFallback>
                      {requirement.assignee.name.slice(0, 2)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="font-medium">{requirement.assignee.name}</div>
                    <div className="text-sm text-muted-foreground">{requirement.assignee.email}</div>
                  </div>
                </div>
              </div>
            ) : (
              <div>
                <Label className="text-sm text-muted-foreground">负责人</Label>
                <div className="mt-1 text-sm text-muted-foreground">未分配负责人</div>
              </div>
            )}

            {/* 创建人 */}
            <div>
              <Label className="text-sm text-muted-foreground">创建人</Label>
              <div className="mt-1 flex items-center space-x-3">
                <Avatar className="h-8 w-8">
                  <AvatarImage src="" />
                  <AvatarFallback>
                    {requirement.creator.name.slice(0, 2)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <div className="font-medium">{requirement.creator.name}</div>
                  <div className="text-sm text-muted-foreground">{requirement.creator.email}</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 标签 */}
      {requirement.tags.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center">
              <Tag className="h-5 w-5 mr-2" />
              标签
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {requirement.tags.map(({ tag }) => (
                <Badge
                  key={tag.id}
                  variant="outline"
                  style={{ 
                    backgroundColor: tag.color + '20', 
                    borderColor: tag.color 
                  }}
                >
                  {tag.name}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* 详细描述 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {requirement.acceptanceCriteria && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">验收标准</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="whitespace-pre-wrap text-sm">
                {requirement.acceptanceCriteria}
              </div>
            </CardContent>
          </Card>
        )}

        {requirement.businessRules && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">业务规则</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="whitespace-pre-wrap text-sm">
                {requirement.businessRules}
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {requirement.technicalNotes && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">技术说明</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="whitespace-pre-wrap text-sm">
              {requirement.technicalNotes}
            </div>
          </CardContent>
        </Card>
      )}

      {/* 依赖关系 */}
      {(requirement.dependencies.length > 0 || requirement.dependents.length > 0) && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center">
              <Link className="h-5 w-5 mr-2" />
              依赖关系
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {requirement.dependencies.length > 0 && (
              <div>
                <Label className="text-sm font-medium">依赖的需求</Label>
                <div className="mt-2 space-y-2">
                  {requirement.dependencies.map(({ dependency }) => (
                    <div key={dependency.id} className="flex items-center justify-between p-2 border rounded">
                      <span className="text-sm">{dependency.title}</span>
                      <Badge className={statusConfig[dependency.status as keyof typeof statusConfig].color}>
                        {statusConfig[dependency.status as keyof typeof statusConfig].label}
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {requirement.dependents.length > 0 && (
              <div>
                <Label className="text-sm font-medium">被依赖的需求</Label>
                <div className="mt-2 space-y-2">
                  {requirement.dependents.map(({ dependent }) => (
                    <div key={dependent.id} className="flex items-center justify-between p-2 border rounded">
                      <span className="text-sm">{dependent.title}</span>
                      <Badge className={statusConfig[dependent.status as keyof typeof statusConfig].color}>
                        {statusConfig[dependent.status as keyof typeof statusConfig].label}
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* 状态更新对话框 */}
      <Dialog open={showStatusUpdate} onOpenChange={setShowStatusUpdate}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>更新需求状态</DialogTitle>
            <DialogDescription>
              更新需求的状态并添加说明
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>新状态</Label>
              <Select value={newStatus} onValueChange={setNewStatus}>
                <SelectTrigger>
                  <SelectValue placeholder="选择新状态" />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(statusConfig).map(([value, config]) => (
                    <SelectItem key={value} value={value}>
                      {config.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>更新说明</Label>
              <Textarea
                placeholder="请输入状态更新的说明（可选）"
                value={statusComment}
                onChange={(e) => setStatusComment(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowStatusUpdate(false)}>
              取消
            </Button>
            <Button onClick={handleStatusUpdate} disabled={!newStatus || updating}>
              {updating ? '更新中...' : '确认更新'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}