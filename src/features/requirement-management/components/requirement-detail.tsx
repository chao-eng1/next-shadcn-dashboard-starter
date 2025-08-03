'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
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
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
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
import { zhCN } from 'date-fns/locale/zh-CN';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface Requirement {
  id: string;
  title: string;
  description: string;
  status:
    | 'DRAFT'
    | 'PENDING'
    | 'APPROVED'
    | 'IN_PROGRESS'
    | 'TESTING'
    | 'COMPLETED'
    | 'REJECTED'
    | 'CANCELLED';
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
  PENDING: {
    label: '待评估',
    color: 'bg-yellow-100 text-yellow-800',
    icon: Clock
  },
  APPROVED: {
    label: '已确认',
    color: 'bg-blue-100 text-blue-800',
    icon: CheckCircle
  },
  IN_PROGRESS: {
    label: '开发中',
    color: 'bg-purple-100 text-purple-800',
    icon: Clock
  },
  TESTING: {
    label: '测试中',
    color: 'bg-orange-100 text-orange-800',
    icon: AlertCircle
  },
  COMPLETED: {
    label: '已完成',
    color: 'bg-green-100 text-green-800',
    icon: CheckCircle
  },
  REJECTED: {
    label: '已拒绝',
    color: 'bg-red-100 text-red-800',
    icon: XCircle
  },
  CANCELLED: {
    label: '已取消',
    color: 'bg-gray-100 text-gray-800',
    icon: XCircle
  }
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
  VERY_COMPLEX: {
    label: '非常复杂',
    points: 8,
    color: 'bg-red-100 text-red-800'
  }
};

export function RequirementDetail({ requirementId }: RequirementDetailProps) {
  const [requirement, setRequirement] = useState<Requirement | null>(null);
  const [loading, setLoading] = useState(true);
  const [showStatusUpdate, setShowStatusUpdate] = useState(false);
  const [newStatus, setNewStatus] = useState('');
  const [updating, setUpdating] = useState(false);
  const { toast } = useToast();
  const router = useRouter();

  useEffect(() => {
    fetchRequirement();
  }, [requirementId]);

  const fetchRequirement = async () => {
    try {
      const response = await fetch(`/api/requirements/${requirementId}`);
      if (response.ok) {
        const data = await response.json();
        setRequirement(data);
      } else {
        toast({
          title: '错误',
          description: '获取需求详情失败',
          variant: 'destructive'
        });
      }
    } catch (error) {
      console.error('Error fetching requirement:', error);
      toast({
        title: '错误',
        description: '获取需求详情失败',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async () => {
    if (!newStatus || !requirement) return;

    setUpdating(true);
    try {
      const response = await fetch(`/api/requirements/${requirementId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status: newStatus })
      });

      if (response.ok) {
        const updatedRequirement = await response.json();
        setRequirement(updatedRequirement);
        setShowStatusUpdate(false);
        setNewStatus('');
        toast({
          title: '成功',
          description: '需求状态已更新'
        });
      } else {
        toast({
          title: '错误',
          description: '更新需求状态失败',
          variant: 'destructive'
        });
      }
    } catch (error) {
      console.error('Error updating requirement status:', error);
      toast({
        title: '错误',
        description: '更新需求状态失败',
        variant: 'destructive'
      });
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return (
      <div className='space-y-6'>
        {[...Array(3)].map((_, i) => (
          <div key={i} className='h-48 animate-pulse rounded bg-gray-100' />
        ))}
      </div>
    );
  }

  if (!requirement) {
    return (
      <Card>
        <CardContent className='flex flex-col items-center justify-center py-12'>
          <div className='space-y-2 text-center'>
            <h3 className='text-lg font-medium'>需求不存在</h3>
            <p className='text-muted-foreground'>找不到指定的需求</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const StatusIcon = statusConfig[requirement.status].icon;
  const progress =
    requirement.status === 'COMPLETED'
      ? 100
      : requirement.status === 'IN_PROGRESS'
        ? 60
        : requirement.status === 'TESTING'
          ? 80
          : requirement.status === 'APPROVED'
            ? 20
            : 0;

  return (
    <div className='space-y-6'>
      {/* Header */}
      <div className='flex items-start justify-between'>
        <div className='space-y-1'>
          <h1 className='text-2xl font-bold'>{requirement.title}</h1>
          <div className='text-muted-foreground flex items-center space-x-4 text-sm'>
            <span>ID: {requirement.id}</span>
            <span>
              创建于{' '}
              {format(new Date(requirement.createdAt), 'yyyy-MM-dd HH:mm', {
                locale: zhCN
              })}
            </span>
            <span>
              更新于{' '}
              {formatDistanceToNow(new Date(requirement.updatedAt), {
                addSuffix: true,
                locale: zhCN
              })}
            </span>
          </div>
        </div>
        <div className='flex items-center space-x-2'>
          <Button
            variant='outline'
            size='sm'
            onClick={() =>
              router.push(`/dashboard/requirements/${requirementId}/edit`)
            }
          >
            <Edit className='mr-2 h-4 w-4' />
            编辑
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant='outline' size='sm'>
                <MoreHorizontal className='h-4 w-4' />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align='end'>
              <DropdownMenuLabel>操作</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => setShowStatusUpdate(true)}>
                <Edit className='mr-2 h-4 w-4' />
                更新状态
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Copy className='mr-2 h-4 w-4' />
                复制链接
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Share2 className='mr-2 h-4 w-4' />
                分享
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                <Archive className='mr-2 h-4 w-4' />
                归档
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Status and Progress */}
      <Card>
        <CardContent className='pt-6'>
          <div className='mb-4 flex items-center justify-between'>
            <div className='flex items-center space-x-2'>
              <StatusIcon className='h-5 w-5' />
              <Badge className={statusConfig[requirement.status].color}>
                {statusConfig[requirement.status].label}
              </Badge>
            </div>
            <span className='text-muted-foreground text-sm'>
              {progress}% 完成
            </span>
          </div>
          <Progress value={progress} className='h-2' />
        </CardContent>
      </Card>

      {/* Basic Info */}
      <div className='grid grid-cols-1 gap-6 md:grid-cols-2'>
        <Card>
          <CardHeader>
            <CardTitle className='text-lg'>基本信息</CardTitle>
          </CardHeader>
          <CardContent className='space-y-4'>
            <div className='grid grid-cols-2 gap-4'>
              <div>
                <Label className='text-muted-foreground text-sm font-medium'>
                  优先级
                </Label>
                <Badge
                  className={`mt-1 ${priorityConfig[requirement.priority].color}`}
                >
                  {priorityConfig[requirement.priority].label}
                </Badge>
              </div>
              <div>
                <Label className='text-muted-foreground text-sm font-medium'>
                  类型
                </Label>
                <Badge className={`mt-1 ${typeConfig[requirement.type].color}`}>
                  {typeConfig[requirement.type].label}
                </Badge>
              </div>
              <div>
                <Label className='text-muted-foreground text-sm font-medium'>
                  复杂度
                </Label>
                <Badge
                  className={`mt-1 ${complexityConfig[requirement.complexity].color}`}
                >
                  {complexityConfig[requirement.complexity].label} (
                  {complexityConfig[requirement.complexity].points}分)
                </Badge>
              </div>
              <div>
                <Label className='text-muted-foreground text-sm font-medium'>
                  商业价值
                </Label>
                <div className='mt-1 text-sm'>
                  {requirement.businessValue}/10
                </div>
              </div>
            </div>

            <Separator />

            <div className='grid grid-cols-2 gap-4'>
              <div>
                <Label className='text-muted-foreground text-sm font-medium'>
                  预估工时
                </Label>
                <div className='mt-1 text-sm'>
                  {requirement.estimatedEffort} 小时
                </div>
              </div>
              {requirement.actualEffort && (
                <div>
                  <Label className='text-muted-foreground text-sm font-medium'>
                    实际工时
                  </Label>
                  <div className='mt-1 text-sm'>
                    {requirement.actualEffort} 小时
                  </div>
                </div>
              )}
              {requirement.dueDate && (
                <div>
                  <Label className='text-muted-foreground text-sm font-medium'>
                    截止日期
                  </Label>
                  <div className='mt-1 flex items-center text-sm'>
                    <Calendar className='mr-1 h-4 w-4' />
                    {format(new Date(requirement.dueDate), 'yyyy-MM-dd', {
                      locale: zhCN
                    })}
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className='text-lg'>人员信息</CardTitle>
          </CardHeader>
          <CardContent className='space-y-4'>
            <div>
              <Label className='text-muted-foreground text-sm font-medium'>
                创建者
              </Label>
              <div className='mt-2 flex items-center space-x-2'>
                <Avatar className='h-8 w-8'>
                  <AvatarFallback>
                    {requirement.creator.name.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <div className='text-sm font-medium'>
                    {requirement.creator.name}
                  </div>
                  <div className='text-muted-foreground text-xs'>
                    {requirement.creator.email}
                  </div>
                </div>
              </div>
            </div>

            {requirement.assignee && (
              <div>
                <Label className='text-muted-foreground text-sm font-medium'>
                  负责人
                </Label>
                <div className='mt-2 flex items-center space-x-2'>
                  <Avatar className='h-8 w-8'>
                    <AvatarFallback>
                      {requirement.assignee.name.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <div className='text-sm font-medium'>
                      {requirement.assignee.name}
                    </div>
                    <div className='text-muted-foreground text-xs'>
                      {requirement.assignee.email}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {requirement.project && (
              <div>
                <Label className='text-muted-foreground text-sm font-medium'>
                  所属项目
                </Label>
                <div className='mt-1 text-sm'>{requirement.project.name}</div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Description */}
      <Card>
        <CardHeader>
          <CardTitle className='text-lg'>需求描述</CardTitle>
        </CardHeader>
        <CardContent>
          <div className='prose max-w-none'>
            <p className='text-sm leading-relaxed'>{requirement.description}</p>
          </div>
        </CardContent>
      </Card>

      {/* Additional Details */}
      {(requirement.acceptanceCriteria ||
        requirement.businessRules ||
        requirement.technicalNotes) && (
        <div className='grid grid-cols-1 gap-6'>
          {requirement.acceptanceCriteria && (
            <Card>
              <CardHeader>
                <CardTitle className='flex items-center text-lg'>
                  <CheckCircle className='mr-2 h-5 w-5' />
                  验收标准
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className='prose max-w-none'>
                  <p className='text-sm leading-relaxed'>
                    {requirement.acceptanceCriteria}
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {requirement.businessRules && (
            <Card>
              <CardHeader>
                <CardTitle className='flex items-center text-lg'>
                  <Target className='mr-2 h-5 w-5' />
                  业务规则
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className='prose max-w-none'>
                  <p className='text-sm leading-relaxed'>
                    {requirement.businessRules}
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {requirement.technicalNotes && (
            <Card>
              <CardHeader>
                <CardTitle className='flex items-center text-lg'>
                  <Zap className='mr-2 h-5 w-5' />
                  技术说明
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className='prose max-w-none'>
                  <p className='text-sm leading-relaxed'>
                    {requirement.technicalNotes}
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Tags */}
      {requirement.tags.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className='flex items-center text-lg'>
              <Tag className='mr-2 h-5 w-5' />
              标签
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className='flex flex-wrap gap-2'>
              {requirement.tags.map((tagRelation) => (
                <Badge
                  key={tagRelation.tag.id}
                  variant='outline'
                  style={{
                    backgroundColor: tagRelation.tag.color + '20',
                    borderColor: tagRelation.tag.color
                  }}
                >
                  {tagRelation.tag.name}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Dependencies */}
      {(requirement.dependencies.length > 0 ||
        requirement.dependents.length > 0) && (
        <Card>
          <CardHeader>
            <CardTitle className='flex items-center text-lg'>
              <Link className='mr-2 h-5 w-5' />
              依赖关系
            </CardTitle>
          </CardHeader>
          <CardContent className='space-y-4'>
            {requirement.dependencies.length > 0 && (
              <div>
                <Label className='text-muted-foreground text-sm font-medium'>
                  依赖需求
                </Label>
                <div className='mt-2 space-y-2'>
                  {requirement.dependencies.map((dep) => (
                    <div
                      key={dep.dependency.id}
                      className='flex items-center justify-between rounded border p-2'
                    >
                      <span className='text-sm'>{dep.dependency.title}</span>
                      <Badge
                        className={
                          statusConfig[
                            dep.dependency.status as keyof typeof statusConfig
                          ]?.color || 'bg-gray-100 text-gray-800'
                        }
                      >
                        {statusConfig[
                          dep.dependency.status as keyof typeof statusConfig
                        ]?.label || dep.dependency.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {requirement.dependents.length > 0 && (
              <div>
                <Label className='text-muted-foreground text-sm font-medium'>
                  被依赖需求
                </Label>
                <div className='mt-2 space-y-2'>
                  {requirement.dependents.map((dep) => (
                    <div
                      key={dep.dependent.id}
                      className='flex items-center justify-between rounded border p-2'
                    >
                      <span className='text-sm'>{dep.dependent.title}</span>
                      <Badge
                        className={
                          statusConfig[
                            dep.dependent.status as keyof typeof statusConfig
                          ]?.color || 'bg-gray-100 text-gray-800'
                        }
                      >
                        {statusConfig[
                          dep.dependent.status as keyof typeof statusConfig
                        ]?.label || dep.dependent.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Status Update Dialog */}
      <Dialog open={showStatusUpdate} onOpenChange={setShowStatusUpdate}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>更新需求状态</DialogTitle>
            <DialogDescription>选择新的状态来更新需求进度</DialogDescription>
          </DialogHeader>
          <div className='space-y-4'>
            <div>
              <Label htmlFor='status'>状态</Label>
              <Select value={newStatus} onValueChange={setNewStatus}>
                <SelectTrigger>
                  <SelectValue placeholder='选择状态' />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(statusConfig).map(([key, config]) => (
                    <SelectItem key={key} value={key}>
                      <div className='flex items-center space-x-2'>
                        <config.icon className='h-4 w-4' />
                        <span>{config.label}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant='outline'
              onClick={() => setShowStatusUpdate(false)}
            >
              取消
            </Button>
            <Button
              onClick={handleStatusUpdate}
              disabled={!newStatus || updating}
            >
              {updating ? '更新中...' : '确认更新'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default RequirementDetail;
