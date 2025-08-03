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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
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
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle
} from '@/components/ui/alert-dialog';
import {
  Plus,
  Search,
  Link,
  Unlink,
  MoreHorizontal,
  ExternalLink,
  GitBranch,
  Users,
  FolderOpen,
  CheckSquare,
  AlertTriangle,
  Clock,
  CheckCircle,
  X
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { zhCN } from 'date-fns/locale/zh-CN';

interface Relation {
  id: string;
  type:
    | 'DEPENDS_ON'
    | 'BLOCKS'
    | 'RELATES_TO'
    | 'DUPLICATES'
    | 'PARENT_OF'
    | 'CHILD_OF';
  sourceId: string;
  targetId: string;
  description?: string;
  createdAt: string;
  createdBy: {
    id: string;
    name: string;
    avatar?: string;
  };
  target: {
    id: string;
    title: string;
    status: string;
    priority: string;
    type: 'requirement' | 'task' | 'project';
    assignee?: {
      id: string;
      name: string;
      avatar?: string;
    };
    project?: {
      id: string;
      name: string;
    };
    dueDate?: string;
  };
}

interface SearchResult {
  id: string;
  title: string;
  status: string;
  priority: string;
  type: 'requirement' | 'task' | 'project';
  assignee?: {
    id: string;
    name: string;
    avatar?: string;
  };
  project?: {
    id: string;
    name: string;
  };
  description?: string;
}

interface RequirementRelationManagerProps {
  requirementId: string;
  relationType: 'requirement' | 'task' | 'project';
  onRelationChange?: () => void;
}

const RELATION_TYPE_CONFIG = {
  DEPENDS_ON: {
    label: '依赖于',
    description: '当前需求依赖于目标项',
    color: 'bg-blue-100 text-blue-800',
    icon: GitBranch
  },
  BLOCKS: {
    label: '阻塞',
    description: '当前需求阻塞目标项',
    color: 'bg-red-100 text-red-800',
    icon: AlertTriangle
  },
  RELATES_TO: {
    label: '关联',
    description: '与目标项相关',
    color: 'bg-gray-100 text-gray-800',
    icon: Link
  },
  DUPLICATES: {
    label: '重复',
    description: '与目标项重复',
    color: 'bg-yellow-100 text-yellow-800',
    icon: CheckSquare
  },
  PARENT_OF: {
    label: '父级',
    description: '是目标项的父级',
    color: 'bg-purple-100 text-purple-800',
    icon: FolderOpen
  },
  CHILD_OF: {
    label: '子级',
    description: '是目标项的子级',
    color: 'bg-green-100 text-green-800',
    icon: Users
  }
};

const STATUS_CONFIG = {
  DRAFT: { label: '草稿', color: 'bg-gray-100 text-gray-800' },
  PENDING: { label: '待评估', color: 'bg-yellow-100 text-yellow-800' },
  APPROVED: { label: '已确认', color: 'bg-blue-100 text-blue-800' },
  IN_PROGRESS: { label: '开发中', color: 'bg-purple-100 text-purple-800' },
  TESTING: { label: '测试中', color: 'bg-orange-100 text-orange-800' },
  COMPLETED: { label: '已完成', color: 'bg-green-100 text-green-800' },
  REJECTED: { label: '已拒绝', color: 'bg-red-100 text-red-800' },
  CANCELLED: { label: '已取消', color: 'bg-gray-100 text-gray-800' }
};

const PRIORITY_CONFIG = {
  LOW: { label: '低', color: 'bg-green-100 text-green-800' },
  MEDIUM: { label: '中', color: 'bg-yellow-100 text-yellow-800' },
  HIGH: { label: '高', color: 'bg-orange-100 text-orange-800' },
  URGENT: { label: '紧急', color: 'bg-red-100 text-red-800' }
};

export function RequirementRelationManager({
  requirementId,
  relationType,
  onRelationChange
}: RequirementRelationManagerProps) {
  const [relations, setRelations] = useState<Relation[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [selectedRelationType, setSelectedRelationType] = useState<string>('');
  const [selectedTarget, setSelectedTarget] = useState<SearchResult | null>(
    null
  );
  const [relationDescription, setRelationDescription] = useState('');
  const [deleteRelationId, setDeleteRelationId] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchRelations();
  }, [requirementId, relationType]);

  useEffect(() => {
    if (searchTerm.length >= 2) {
      searchItems();
    } else {
      setSearchResults([]);
    }
  }, [searchTerm, relationType]);

  const fetchRelations = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `/api/requirements/${requirementId}/relations?type=${relationType}`
      );
      if (!response.ok) {
        throw new Error('获取关联关系失败');
      }

      const data = await response.json();
      setRelations(data.data);
    } catch (error) {
      console.error('获取关联关系失败:', error);
      toast({
        title: '错误',
        description: '获取关联关系失败，请稍后重试',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const searchItems = async () => {
    try {
      setSearchLoading(true);
      const params = new URLSearchParams({
        q: searchTerm,
        type: relationType,
        exclude: requirementId
      });

      const response = await fetch(`/api/search/items?${params}`);
      if (!response.ok) {
        throw new Error('搜索失败');
      }

      const data = await response.json();
      setSearchResults(data.data);
    } catch (error) {
      console.error('搜索失败:', error);
      toast({
        title: '错误',
        description: '搜索失败，请稍后重试',
        variant: 'destructive'
      });
    } finally {
      setSearchLoading(false);
    }
  };

  const handleAddRelation = async () => {
    if (!selectedTarget || !selectedRelationType) {
      toast({
        title: '错误',
        description: '请选择关联类型和目标项',
        variant: 'destructive'
      });
      return;
    }

    try {
      const response = await fetch(
        `/api/requirements/${requirementId}/relations`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            type: selectedRelationType,
            targetId: selectedTarget.id,
            targetType: selectedTarget.type,
            description: relationDescription
          })
        }
      );

      if (!response.ok) {
        throw new Error('添加关联关系失败');
      }

      toast({
        title: '成功',
        description: '关联关系已添加'
      });

      setShowAddDialog(false);
      setSelectedTarget(null);
      setSelectedRelationType('');
      setRelationDescription('');
      setSearchTerm('');
      fetchRelations();
      onRelationChange?.();
    } catch (error) {
      console.error('添加关联关系失败:', error);
      toast({
        title: '错误',
        description: '添加关联关系失败，请稍后重试',
        variant: 'destructive'
      });
    }
  };

  const handleDeleteRelation = async (relationId: string) => {
    try {
      const response = await fetch(
        `/api/requirements/${requirementId}/relations/${relationId}`,
        {
          method: 'DELETE'
        }
      );

      if (!response.ok) {
        throw new Error('删除关联关系失败');
      }

      toast({
        title: '成功',
        description: '关联关系已删除'
      });

      fetchRelations();
      onRelationChange?.();
    } catch (error) {
      console.error('删除关联关系失败:', error);
      toast({
        title: '错误',
        description: '删除关联关系失败，请稍后重试',
        variant: 'destructive'
      });
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'requirement':
        return <CheckSquare className='h-4 w-4' />;
      case 'task':
        return <CheckCircle className='h-4 w-4' />;
      case 'project':
        return <FolderOpen className='h-4 w-4' />;
      default:
        return <CheckSquare className='h-4 w-4' />;
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'requirement':
        return '需求';
      case 'task':
        return '任务';
      case 'project':
        return '项目';
      default:
        return '未知';
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className='flex items-center justify-center py-8'>
          <div className='text-center'>
            <div className='border-primary mx-auto mb-2 h-6 w-6 animate-spin rounded-full border-2 border-t-transparent' />
            <p className='text-muted-foreground text-sm'>加载关联关系...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className='space-y-4'>
      {/* 添加关联按钮 */}
      <div className='flex items-center justify-between'>
        <div>
          <h3 className='text-lg font-medium'>
            {getTypeLabel(relationType)}关联
          </h3>
          <p className='text-muted-foreground text-sm'>
            管理与{getTypeLabel(relationType)}的关联关系
          </p>
        </div>
        <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
          <DialogTrigger asChild>
            <Button>
              <Plus className='mr-2 h-4 w-4' />
              添加关联
            </Button>
          </DialogTrigger>
          <DialogContent className='max-w-2xl'>
            <DialogHeader>
              <DialogTitle>添加{getTypeLabel(relationType)}关联</DialogTitle>
              <DialogDescription>
                搜索并选择要关联的{getTypeLabel(relationType)}，然后选择关联类型
              </DialogDescription>
            </DialogHeader>

            <div className='space-y-4'>
              {/* 搜索框 */}
              <div className='space-y-2'>
                <Label>搜索{getTypeLabel(relationType)}</Label>
                <div className='relative'>
                  <Search className='text-muted-foreground absolute top-2.5 left-2 h-4 w-4' />
                  <Input
                    placeholder={`搜索${getTypeLabel(relationType)}...`}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className='pl-8'
                  />
                </div>
              </div>

              {/* 搜索结果 */}
              {searchTerm.length >= 2 && (
                <div className='space-y-2'>
                  <Label>搜索结果</Label>
                  <div className='max-h-48 overflow-y-auto rounded-md border'>
                    {searchLoading ? (
                      <div className='flex items-center justify-center py-4'>
                        <div className='border-primary h-4 w-4 animate-spin rounded-full border-2 border-t-transparent' />
                      </div>
                    ) : searchResults.length > 0 ? (
                      <div className='space-y-1 p-2'>
                        {searchResults.map((item) => (
                          <div
                            key={item.id}
                            className={`cursor-pointer rounded p-2 hover:bg-gray-50 ${
                              selectedTarget?.id === item.id
                                ? 'border border-blue-200 bg-blue-50'
                                : ''
                            }`}
                            onClick={() => setSelectedTarget(item)}
                          >
                            <div className='flex items-center justify-between'>
                              <div className='flex items-center space-x-2'>
                                {getTypeIcon(item.type)}
                                <div>
                                  <p className='text-sm font-medium'>
                                    {item.title}
                                  </p>
                                  {item.project && (
                                    <p className='text-muted-foreground text-xs'>
                                      项目: {item.project.name}
                                    </p>
                                  )}
                                </div>
                              </div>
                              <div className='flex items-center space-x-1'>
                                <Badge
                                  className={
                                    STATUS_CONFIG[
                                      item.status as keyof typeof STATUS_CONFIG
                                    ]?.color || 'bg-gray-100 text-gray-800'
                                  }
                                >
                                  {STATUS_CONFIG[
                                    item.status as keyof typeof STATUS_CONFIG
                                  ]?.label || item.status}
                                </Badge>
                                <Badge
                                  className={
                                    PRIORITY_CONFIG[
                                      item.priority as keyof typeof PRIORITY_CONFIG
                                    ]?.color || 'bg-gray-100 text-gray-800'
                                  }
                                >
                                  {PRIORITY_CONFIG[
                                    item.priority as keyof typeof PRIORITY_CONFIG
                                  ]?.label || item.priority}
                                </Badge>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className='text-muted-foreground py-4 text-center text-sm'>
                        未找到相关{getTypeLabel(relationType)}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* 关联类型选择 */}
              {selectedTarget && (
                <div className='space-y-2'>
                  <Label>关联类型</Label>
                  <Select
                    value={selectedRelationType}
                    onValueChange={setSelectedRelationType}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder='选择关联类型' />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(RELATION_TYPE_CONFIG).map(
                        ([key, config]) => (
                          <SelectItem key={key} value={key}>
                            <div className='flex items-center space-x-2'>
                              <config.icon className='h-4 w-4' />
                              <div>
                                <p className='font-medium'>{config.label}</p>
                                <p className='text-muted-foreground text-xs'>
                                  {config.description}
                                </p>
                              </div>
                            </div>
                          </SelectItem>
                        )
                      )}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* 关联描述 */}
              {selectedTarget && selectedRelationType && (
                <div className='space-y-2'>
                  <Label>关联描述（可选）</Label>
                  <Textarea
                    placeholder='描述关联关系的具体内容...'
                    value={relationDescription}
                    onChange={(e) => setRelationDescription(e.target.value)}
                    rows={3}
                  />
                </div>
              )}
            </div>

            <DialogFooter>
              <Button variant='outline' onClick={() => setShowAddDialog(false)}>
                取消
              </Button>
              <Button
                onClick={handleAddRelation}
                disabled={!selectedTarget || !selectedRelationType}
              >
                添加关联
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* 关联关系列表 */}
      <Card>
        <CardHeader>
          <CardTitle className='flex items-center'>
            <Link className='mr-2 h-5 w-5' />
            关联关系 ({relations.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {relations.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>关联类型</TableHead>
                  <TableHead>目标{getTypeLabel(relationType)}</TableHead>
                  <TableHead>状态</TableHead>
                  <TableHead>负责人</TableHead>
                  <TableHead>创建时间</TableHead>
                  <TableHead>操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {relations.map((relation) => {
                  const config = RELATION_TYPE_CONFIG[relation.type];
                  const IconComponent = config.icon;

                  return (
                    <TableRow key={relation.id}>
                      <TableCell>
                        <div className='flex items-center space-x-2'>
                          <IconComponent className='h-4 w-4' />
                          <Badge className={config.color}>{config.label}</Badge>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className='space-y-1'>
                          <div className='flex items-center space-x-2'>
                            {getTypeIcon(relation.target.type)}
                            <span className='font-medium'>
                              {relation.target.title}
                            </span>
                          </div>
                          {relation.target.project && (
                            <p className='text-muted-foreground text-xs'>
                              项目: {relation.target.project.name}
                            </p>
                          )}
                          {relation.description && (
                            <p className='text-muted-foreground text-xs'>
                              {relation.description}
                            </p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          className={
                            STATUS_CONFIG[
                              relation.target
                                .status as keyof typeof STATUS_CONFIG
                            ]?.color || 'bg-gray-100 text-gray-800'
                          }
                        >
                          {STATUS_CONFIG[
                            relation.target.status as keyof typeof STATUS_CONFIG
                          ]?.label || relation.target.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {relation.target.assignee ? (
                          <div className='flex items-center space-x-2'>
                            <Avatar className='h-6 w-6'>
                              <AvatarImage
                                src={relation.target.assignee.avatar}
                              />
                              <AvatarFallback className='text-xs'>
                                {relation.target.assignee.name.slice(0, 1)}
                              </AvatarFallback>
                            </Avatar>
                            <span className='text-sm'>
                              {relation.target.assignee.name}
                            </span>
                          </div>
                        ) : (
                          <span className='text-muted-foreground text-sm'>
                            未分配
                          </span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className='text-sm'>
                          <p>
                            {format(
                              new Date(relation.createdAt),
                              'yyyy-MM-dd',
                              { locale: zhCN }
                            )}
                          </p>
                          <p className='text-muted-foreground text-xs'>
                            by {relation.createdBy.name}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant='ghost' size='sm'>
                              <MoreHorizontal className='h-4 w-4' />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align='end'>
                            <DropdownMenuItem>
                              <ExternalLink className='mr-2 h-4 w-4' />
                              查看详情
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className='text-red-600'
                              onClick={() => setDeleteRelationId(relation.id)}
                            >
                              <Unlink className='mr-2 h-4 w-4' />
                              移除关联
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          ) : (
            <div className='py-8 text-center'>
              <Link className='text-muted-foreground mx-auto mb-4 h-12 w-12' />
              <h3 className='mb-2 text-lg font-medium'>暂无关联关系</h3>
              <p className='text-muted-foreground mb-4'>
                还没有与{getTypeLabel(relationType)}建立关联关系
              </p>
              <Button onClick={() => setShowAddDialog(true)}>
                <Plus className='mr-2 h-4 w-4' />
                添加关联
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 删除确认对话框 */}
      <AlertDialog
        open={!!deleteRelationId}
        onOpenChange={() => setDeleteRelationId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确认移除关联</AlertDialogTitle>
            <AlertDialogDescription>
              确定要移除这个关联关系吗？此操作无法撤销。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (deleteRelationId) {
                  handleDeleteRelation(deleteRelationId);
                  setDeleteRelationId(null);
                }
              }}
            >
              确认移除
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
