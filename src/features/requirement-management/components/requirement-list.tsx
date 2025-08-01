'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Checkbox } from '@/components/ui/checkbox';
import { Progress } from '@/components/ui/progress';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Eye, Edit, Trash2, MoreHorizontal, ExternalLink, Calendar, User, Clock, CheckCircle2, AlertCircle, XCircle } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import { useToast } from '@/hooks/use-toast';

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
}

interface RequirementListProps {
  projectId?: string;
  filters?: any;
}

const statusConfig = {
  DRAFT: { label: '草稿', color: 'bg-gray-100 text-gray-800' },
  PENDING: { label: '待评估', color: 'bg-yellow-100 text-yellow-800' },
  APPROVED: { label: '已确认', color: 'bg-blue-100 text-blue-800' },
  IN_PROGRESS: { label: '开发中', color: 'bg-purple-100 text-purple-800' },
  TESTING: { label: '测试中', color: 'bg-orange-100 text-orange-800' },
  COMPLETED: { label: '已完成', color: 'bg-green-100 text-green-800' },
  REJECTED: { label: '已拒绝', color: 'bg-red-100 text-red-800' },
  CANCELLED: { label: '已取消', color: 'bg-gray-100 text-gray-800' }
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

export function RequirementList({ projectId, filters }: RequirementListProps) {
  const [requirements, setRequirements] = useState<Requirement[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const router = useRouter();
  const { toast } = useToast();

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return <CheckCircle2 className="h-3 w-3" />;
      case 'IN_PROGRESS':
        return <Clock className="h-3 w-3" />;
      case 'PENDING':
        return <AlertCircle className="h-3 w-3" />;
      case 'CANCELLED':
        return <XCircle className="h-3 w-3" />;
      default:
        return <AlertCircle className="h-3 w-3" />;
    }
  };

  const getPriorityIcon = (priority: string) => {
    return null;
  };

  useEffect(() => {
    fetchRequirements();
  }, [projectId]);

  const fetchRequirements = async () => {
    try {
      setLoading(true);
      const url = projectId 
        ? `/api/projects/${projectId}/requirements`
        : '/api/requirements';
      
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error('获取需求列表失败');
      }
      
      const data = await response.json();
      if (data.success) {
        setRequirements(data.data.requirements || []);
      } else {
        throw new Error(data.message || '获取需求列表失败');
      }
    } catch (error) {
      console.error('获取需求列表失败:', error);
      toast({
        title: '错误',
        description: '获取需求列表失败，请稍后重试',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedItems(requirements.map(req => req.id));
    } else {
      setSelectedItems([]);
    }
  };

  const handleSelectItem = (id: string, checked: boolean) => {
    if (checked) {
      setSelectedItems(prev => [...prev, id]);
    } else {
      setSelectedItems(prev => prev.filter(item => item !== id));
    }
  };

  const handleView = (id: string) => {
    router.push(`/dashboard/requirements/${id}`);
  };

  const handleEdit = (id: string) => {
    router.push(`/dashboard/requirements/${id}/edit`);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('确定要删除这个需求吗？')) {
      return;
    }

    try {
      const response = await fetch(`/api/requirements/${id}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        throw new Error('删除需求失败');
      }

      toast({
        title: '成功',
        description: '需求已删除'
      });

      fetchRequirements();
    } catch (error) {
      console.error('删除需求失败:', error);
      toast({
        title: '错误',
        description: '删除需求失败，请稍后重试',
        variant: 'destructive'
      });
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-16 bg-gray-100 rounded animate-pulse" />
        ))}
      </div>
    );
  }

  if (requirements.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <div className="text-center space-y-2">
            <h3 className="text-lg font-medium">暂无需求</h3>
            <p className="text-muted-foreground">
              {projectId ? '该项目还没有需求' : '还没有创建任何需求'}
            </p>
            <Button onClick={() => router.push('/dashboard/requirements/new')}>
              创建第一个需求
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {selectedItems.length > 0 && (
        <Card>
          <CardContent className="py-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">
                已选择 {selectedItems.length} 个需求
              </span>
              <div className="flex items-center space-x-2">
                <Button variant="outline" size="sm">
                  批量更新状态
                </Button>
                <Button variant="outline" size="sm">
                  批量分配
                </Button>
                <Button variant="destructive" size="sm">
                  批量删除
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">
                <Checkbox
                  checked={selectedItems.length === requirements.length}
                  onCheckedChange={handleSelectAll}
                />
              </TableHead>
              <TableHead>需求信息</TableHead>
              <TableHead>状态</TableHead>
              <TableHead>优先级</TableHead>
              <TableHead>类型</TableHead>
              <TableHead>项目</TableHead>
              <TableHead>负责人</TableHead>
              <TableHead>进度</TableHead>
              <TableHead>创建时间</TableHead>
              <TableHead className="w-12"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {requirements.map((requirement, index) => (
              <TableRow key={requirement.id}>
                <TableCell>
                  <Checkbox
                    checked={selectedItems.includes(requirement.id)}
                    onCheckedChange={(checked) => 
                      handleSelectItem(requirement.id, checked as boolean)
                    }
                  />
                </TableCell>
                <TableCell>
                  <div className="space-y-1">
                    <div className="font-medium">{requirement.title}</div>
                    <div className="text-sm text-muted-foreground">
                      {requirement.description}
                    </div>
                    {requirement.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {requirement.tags.map(({ tag }) => (
                          <Badge key={tag.id} variant="outline" className="text-xs">
                            {tag.name}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <Badge className={statusConfig[requirement.status].color}>
                    {statusConfig[requirement.status].label}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge className={priorityConfig[requirement.priority].color}>
                    {priorityConfig[requirement.priority].label}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge variant="outline" className={typeConfig[requirement.type].color}>
                    {typeConfig[requirement.type].label}
                  </Badge>
                </TableCell>
                <TableCell>
                  {requirement.project ? (
                    <span className="text-sm">{requirement.project.name}</span>
                  ) : (
                    <span className="text-muted-foreground text-sm">未关联</span>
                  )}
                </TableCell>
                <TableCell>
                  {requirement.assignee ? (
                    <div className="flex items-center space-x-2">
                      <Avatar className="h-6 w-6">
                        <AvatarFallback className="text-xs">
                          {requirement.assignee.name.slice(0, 2)}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-sm">{requirement.assignee.name}</span>
                    </div>
                  ) : (
                    <span className="text-muted-foreground text-sm">未分配</span>
                  )}
                </TableCell>
                <TableCell>
                  <div className="space-y-1">
                    <div className="text-xs text-muted-foreground">
                      {Math.floor(Math.random() * 100)}%
                    </div>
                    <Progress value={Math.floor(Math.random() * 100)} className="h-2" />
                  </div>
                </TableCell>
                <TableCell>
                  <div className="text-sm text-muted-foreground">
                    {formatDistanceToNow(new Date(requirement.createdAt), {
                      addSuffix: true,
                      locale: zhCN
                    })}
                  </div>
                </TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="h-8 w-8 p-0">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuLabel>操作</DropdownMenuLabel>
                      <DropdownMenuItem onClick={() => handleView(requirement.id)}>
                        <Eye className="h-4 w-4 mr-2" />
                        查看详情
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleEdit(requirement.id)}>
                        <Edit className="h-4 w-4 mr-2" />
                        编辑需求
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem 
                        onClick={() => handleDelete(requirement.id)}
                        className="text-red-600"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        删除需求
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}