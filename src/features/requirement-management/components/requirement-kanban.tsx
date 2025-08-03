'use client';

import { useState, useEffect } from 'react';
import {
  DragDropContext,
  Droppable,
  Draggable,
  DropResult
} from '@hello-pangea/dnd';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  MoreHorizontal,
  Plus,
  Calendar,
  User,
  Tag,
  AlertCircle,
  Clock,
  Target,
  Circle,
  CheckCircle2,
  ArrowRight,
  Sparkles
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
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

interface KanbanColumn {
  id: string;
  title: string;
  status: string;
  color: string;
  requirements: Requirement[];
}

interface RequirementKanbanProps {
  projectId?: string;
}

const defaultColumns: Omit<KanbanColumn, 'requirements'>[] = [
  { id: 'draft', title: '草稿', status: 'DRAFT', color: 'bg-gray-100' },
  { id: 'pending', title: '待评估', status: 'PENDING', color: 'bg-yellow-100' },
  { id: 'approved', title: '已确认', status: 'APPROVED', color: 'bg-blue-100' },
  {
    id: 'in_progress',
    title: '开发中',
    status: 'IN_PROGRESS',
    color: 'bg-purple-100'
  },
  { id: 'testing', title: '测试中', status: 'TESTING', color: 'bg-orange-100' },
  {
    id: 'completed',
    title: '已完成',
    status: 'COMPLETED',
    color: 'bg-green-100'
  }
];

const priorityConfig = {
  LOW: { label: '低', color: 'bg-green-100 text-green-800', icon: '🟢' },
  MEDIUM: { label: '中', color: 'bg-yellow-100 text-yellow-800', icon: '🟡' },
  HIGH: { label: '高', color: 'bg-orange-100 text-orange-800', icon: '🟠' },
  URGENT: { label: '紧急', color: 'bg-red-100 text-red-800', icon: '🔴' }
};

const complexityConfig = {
  SIMPLE: { label: '简单', points: 1 },
  MEDIUM: { label: '中等', points: 3 },
  COMPLEX: { label: '复杂', points: 5 },
  VERY_COMPLEX: { label: '非常复杂', points: 8 }
};

export function RequirementKanban({ projectId }: RequirementKanbanProps) {
  const [columns, setColumns] = useState<KanbanColumn[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddColumn, setShowAddColumn] = useState(false);
  const [newColumnTitle, setNewColumnTitle] = useState('');
  const [newColumnStatus, setNewColumnStatus] = useState('');
  const { toast } = useToast();

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
      const requirements = Array.isArray(data.requirements)
        ? data.requirements
        : [];

      // 按状态分组需求
      const groupedRequirements = defaultColumns.map((col) => ({
        ...col,
        requirements: requirements.filter(
          (req: Requirement) => req.status === col.status
        )
      }));

      setColumns(groupedRequirements);
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

  const handleDragEnd = async (result: DropResult) => {
    const { destination, source, draggableId } = result;

    if (!destination) {
      return;
    }

    if (
      destination.droppableId === source.droppableId &&
      destination.index === source.index
    ) {
      return;
    }

    const sourceColumn = columns.find((col) => col.id === source.droppableId);
    const destColumn = columns.find(
      (col) => col.id === destination.droppableId
    );

    if (!sourceColumn || !destColumn) {
      return;
    }

    const requirement = sourceColumn.requirements.find(
      (req) => req.id === draggableId
    );
    if (!requirement) {
      return;
    }

    // 更新本地状态
    const newColumns = columns.map((col) => {
      if (col.id === source.droppableId) {
        return {
          ...col,
          requirements: col.requirements.filter((req) => req.id !== draggableId)
        };
      }
      if (col.id === destination.droppableId) {
        const newRequirements = [...col.requirements];
        newRequirements.splice(destination.index, 0, {
          ...requirement,
          status: col.status as any
        });
        return {
          ...col,
          requirements: newRequirements
        };
      }
      return col;
    });

    setColumns(newColumns);

    // 更新服务器
    try {
      const response = await fetch(`/api/requirements/${draggableId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          status: destColumn.status
        })
      });

      if (!response.ok) {
        throw new Error('更新需求状态失败');
      }

      toast({
        title: '成功',
        description: `需求状态已更新为「${destColumn.title}」`
      });
    } catch (error) {
      console.error('更新需求状态失败:', error);
      // 回滚本地状态
      fetchRequirements();
      toast({
        title: '错误',
        description: '更新需求状态失败，请稍后重试',
        variant: 'destructive'
      });
    }
  };

  const handleAddColumn = async () => {
    if (!newColumnTitle.trim() || !newColumnStatus) {
      return;
    }

    const newColumn: KanbanColumn = {
      id: `custom-${Date.now()}`,
      title: newColumnTitle,
      status: newColumnStatus,
      color: 'bg-gray-100',
      requirements: []
    };

    setColumns((prev) => [...prev, newColumn]);
    setShowAddColumn(false);
    setNewColumnTitle('');
    setNewColumnStatus('');

    toast({
      title: '成功',
      description: '看板列已添加'
    });
  };

  const getColumnStats = (column: KanbanColumn) => {
    const totalEffort = column.requirements.reduce(
      (sum, req) => sum + req.estimatedEffort,
      0
    );
    const totalValue = column.requirements.reduce(
      (sum, req) => sum + req.businessValue,
      0
    );
    const urgentCount = column.requirements.filter(
      (req) => req.priority === 'URGENT'
    ).length;

    return { totalEffort, totalValue, urgentCount };
  };

  const isOverdue = (dueDate?: Date) => {
    if (!dueDate) return false;
    return new Date(dueDate) < new Date();
  };

  if (loading) {
    return (
      <div className='grid grid-cols-1 gap-4 md:grid-cols-3 lg:grid-cols-6'>
        {[...Array(6)].map((_, i) => (
          <div key={i} className='h-96 animate-pulse rounded bg-gray-100' />
        ))}
      </div>
    );
  }

  return (
    <div className='space-y-4'>
      {/* 看板统计 */}
      <div className='grid grid-cols-2 gap-4 md:grid-cols-4'>
        <Card>
          <CardContent className='p-4'>
            <div className='text-2xl font-bold'>
              {columns.reduce((sum, col) => sum + col.requirements.length, 0)}
            </div>
            <div className='text-muted-foreground text-sm'>总需求数</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className='p-4'>
            <div className='text-2xl font-bold'>
              {columns.reduce(
                (sum, col) => sum + getColumnStats(col).totalEffort,
                0
              )}
            </div>
            <div className='text-muted-foreground text-sm'>
              总工作量（小时）
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className='p-4'>
            <div className='text-2xl font-bold'>
              {columns.reduce(
                (sum, col) => sum + getColumnStats(col).totalValue,
                0
              )}
            </div>
            <div className='text-muted-foreground text-sm'>总业务价值</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className='p-4'>
            <div className='text-2xl font-bold text-red-600'>
              {columns.reduce(
                (sum, col) => sum + getColumnStats(col).urgentCount,
                0
              )}
            </div>
            <div className='text-muted-foreground text-sm'>紧急需求</div>
          </CardContent>
        </Card>
      </div>

      {/* 看板 */}
      <DragDropContext onDragEnd={handleDragEnd}>
        <div className='flex space-x-6 overflow-x-auto pb-6'>
          {columns.map((column, columnIndex) => {
            const stats = getColumnStats(column);
            return (
              <div key={column.id} className='w-80 flex-shrink-0'>
                <Card
                  className={cn(
                    'h-full border-0 bg-gradient-to-br from-white to-gray-50/50 shadow-lg dark:from-gray-900 dark:to-gray-800/50',
                    column.color
                  )}
                >
                  <CardHeader className='pb-4'>
                    <div className='flex items-center justify-between'>
                      <div className='flex items-center space-x-3'>
                        <div className='flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-blue-100 to-indigo-100 dark:from-blue-900/20 dark:to-indigo-900/20'>
                          {columnIndex === 0 ? (
                            <Circle className='h-4 w-4 text-gray-500' />
                          ) : columnIndex === 1 ? (
                            <Clock className='h-4 w-4 text-yellow-500' />
                          ) : columnIndex === 2 ? (
                            <CheckCircle2 className='h-4 w-4 text-blue-500' />
                          ) : columnIndex === 3 ? (
                            <Clock className='h-4 w-4 text-purple-500' />
                          ) : columnIndex === 4 ? (
                            <AlertCircle className='h-4 w-4 text-orange-500' />
                          ) : (
                            <CheckCircle2 className='h-4 w-4 text-green-500' />
                          )}
                        </div>
                        <div>
                          <CardTitle className='text-foreground text-sm font-semibold'>
                            {column.title}
                          </CardTitle>
                          <Badge className='mt-1 border-blue-200 bg-blue-100 text-blue-800 dark:border-blue-800 dark:bg-blue-900/20 dark:text-blue-300'>
                            {column.requirements.length} 个需求
                          </Badge>
                        </div>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant='ghost' size='sm'>
                            <MoreHorizontal className='h-4 w-4' />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent>
                          <DropdownMenuItem>
                            <Plus className='mr-2 h-4 w-4' />
                            添加需求
                          </DropdownMenuItem>
                          <DropdownMenuItem>编辑列</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                    <div className='text-muted-foreground space-y-1 text-xs'>
                      <div className='flex items-center justify-between'>
                        <span className='flex items-center'>
                          <Clock className='mr-1 h-3 w-3' />
                          {stats.totalEffort}h
                        </span>
                        <span className='flex items-center'>
                          <Target className='mr-1 h-3 w-3' />
                          {stats.totalValue}
                        </span>
                      </div>
                      {stats.urgentCount > 0 && (
                        <div className='flex items-center text-red-600'>
                          <AlertCircle className='mr-1 h-3 w-3' />
                          {stats.urgentCount} 个紧急
                        </div>
                      )}
                    </div>
                  </CardHeader>
                  <Droppable droppableId={column.id}>
                    {(provided, snapshot) => (
                      <CardContent
                        ref={provided.innerRef}
                        {...provided.droppableProps}
                        className={cn(
                          'min-h-[400px] space-y-3 p-3',
                          snapshot.isDraggingOver && 'bg-blue-50'
                        )}
                      >
                        {column.requirements.map((requirement, index) => (
                          <Draggable
                            key={requirement.id}
                            draggableId={requirement.id}
                            index={index}
                          >
                            {(provided, snapshot) => (
                              <Card
                                ref={provided.innerRef}
                                {...provided.draggableProps}
                                {...provided.dragHandleProps}
                                className={cn(
                                  'group cursor-move border-0 bg-gradient-to-br from-white to-gray-50/30 shadow-md transition-all duration-300 hover:scale-[1.02] hover:shadow-xl dark:from-gray-900 dark:to-gray-800/30',
                                  snapshot.isDragging &&
                                    'scale-105 rotate-3 shadow-2xl ring-2 ring-blue-500/20'
                                )}
                              >
                                <CardContent className='space-y-4 p-4'>
                                  {/* 标题和优先级 */}
                                  <div className='space-y-3'>
                                    <div className='flex items-start justify-between'>
                                      <h4 className='line-clamp-2 text-sm font-semibold transition-colors group-hover:text-blue-600'>
                                        {requirement.title}
                                      </h4>
                                      <div className='flex items-center gap-1'>
                                        <span className='animate-pulse text-lg'>
                                          {
                                            priorityConfig[requirement.priority]
                                              .icon
                                          }
                                        </span>
                                        <Sparkles className='h-3 w-3 text-yellow-500 opacity-0 transition-opacity group-hover:opacity-100' />
                                      </div>
                                    </div>
                                    <p className='text-muted-foreground line-clamp-2 text-xs leading-relaxed'>
                                      {requirement.description}
                                    </p>
                                  </div>

                                  {/* 标签 */}
                                  {requirement.tags.length > 0 && (
                                    <div className='flex flex-wrap gap-2'>
                                      {requirement.tags
                                        .slice(0, 2)
                                        .map(({ tag }) => (
                                          <Badge
                                            key={tag.id}
                                            variant='outline'
                                            className='rounded-full px-2 py-1 text-xs font-medium transition-all hover:scale-105'
                                            style={{
                                              backgroundColor: tag.color + '15',
                                              borderColor: tag.color + '40',
                                              color: tag.color
                                            }}
                                          >
                                            <Tag className='mr-1 h-2 w-2' />
                                            {tag.name}
                                          </Badge>
                                        ))}
                                      {requirement.tags.length > 2 && (
                                        <Badge
                                          variant='outline'
                                          className='rounded-full bg-gradient-to-r from-gray-100 to-gray-200 px-2 py-1 text-xs dark:from-gray-800 dark:to-gray-700'
                                        >
                                          +{requirement.tags.length - 2}
                                        </Badge>
                                      )}
                                    </div>
                                  )}

                                  {/* 项目信息 */}
                                  {requirement.project && (
                                    <div className='text-muted-foreground flex items-center text-xs'>
                                      <Tag className='mr-1 h-3 w-3' />
                                      {requirement.project.name}
                                    </div>
                                  )}

                                  {/* 底部信息 */}
                                  <div className='space-y-3'>
                                    {/* 负责人信息 */}
                                    {requirement.assignee && (
                                      <div className='flex items-center space-x-2 rounded-lg border border-blue-100 bg-gradient-to-r from-blue-50 to-indigo-50 p-2 dark:border-blue-800/30 dark:from-blue-900/10 dark:to-indigo-900/10'>
                                        <Avatar className='h-6 w-6 shadow-sm ring-2 ring-white dark:ring-gray-800'>
                                          <AvatarImage src='' />
                                          <AvatarFallback className='bg-gradient-to-br from-blue-100 to-indigo-100 text-xs font-semibold text-blue-600 dark:from-blue-900/20 dark:to-indigo-900/20 dark:text-blue-400'>
                                            {requirement.assignee.name.slice(
                                              0,
                                              2
                                            )}
                                          </AvatarFallback>
                                        </Avatar>
                                        <div className='min-w-0 flex-1'>
                                          <div className='truncate text-xs font-medium text-blue-700 dark:text-blue-300'>
                                            {requirement.assignee.name}
                                          </div>
                                          <div className='text-xs text-blue-600/70 dark:text-blue-400/70'>
                                            负责人
                                          </div>
                                        </div>
                                      </div>
                                    )}

                                    {/* 工作量和复杂度 */}
                                    <div className='flex items-center justify-between'>
                                      <div className='flex items-center space-x-3'>
                                        <div className='text-muted-foreground bg-muted/50 flex items-center rounded-md px-2 py-1 text-xs'>
                                          <Clock className='mr-1 h-3 w-3' />
                                          {requirement.estimatedEffort}h
                                        </div>
                                        <Badge
                                          variant='outline'
                                          className='border-purple-200 bg-gradient-to-r from-purple-100 to-pink-100 text-xs text-purple-700 dark:border-purple-800 dark:from-purple-900/20 dark:to-pink-900/20 dark:text-purple-300'
                                        >
                                          {
                                            complexityConfig[
                                              requirement.complexity
                                            ].points
                                          }
                                          分
                                        </Badge>
                                      </div>

                                      {/* 截止日期 */}
                                      {requirement.dueDate && (
                                        <div
                                          className={cn(
                                            'flex items-center rounded-md px-2 py-1 text-xs',
                                            isOverdue(requirement.dueDate)
                                              ? 'border border-red-200 bg-red-50 text-red-600 dark:border-red-800 dark:bg-red-900/20'
                                              : 'text-muted-foreground bg-muted/50'
                                          )}
                                        >
                                          <Calendar className='mr-1 h-3 w-3' />
                                          {formatDistanceToNow(
                                            new Date(requirement.dueDate),
                                            {
                                              addSuffix: true,
                                              locale: zhCN
                                            }
                                          )}
                                        </div>
                                      )}
                                    </div>

                                    {/* 进度指示器 */}
                                    <div className='space-y-1'>
                                      <div className='flex items-center justify-between text-xs'>
                                        <span className='text-muted-foreground font-medium'>
                                          进度
                                        </span>
                                        <span className='text-muted-foreground'>
                                          {column.status === 'COMPLETED'
                                            ? '100%'
                                            : column.status === 'TESTING'
                                              ? '80%'
                                              : column.status === 'IN_PROGRESS'
                                                ? '60%'
                                                : column.status === 'APPROVED'
                                                  ? '40%'
                                                  : '20%'}
                                        </span>
                                      </div>
                                      <div className='bg-muted h-2 w-full overflow-hidden rounded-full'>
                                        <div
                                          className='h-full bg-gradient-to-r from-blue-500 to-indigo-500 transition-all duration-500 ease-out'
                                          style={{
                                            width:
                                              column.status === 'COMPLETED'
                                                ? '100%'
                                                : column.status === 'TESTING'
                                                  ? '80%'
                                                  : column.status ===
                                                      'IN_PROGRESS'
                                                    ? '60%'
                                                    : column.status ===
                                                        'APPROVED'
                                                      ? '40%'
                                                      : '20%'
                                          }}
                                        />
                                      </div>
                                    </div>
                                  </div>
                                </CardContent>
                              </Card>
                            )}
                          </Draggable>
                        ))}
                        {provided.placeholder}
                      </CardContent>
                    )}
                  </Droppable>
                </Card>
              </div>
            );
          })}

          {/* 添加新列 */}
          <div className='w-80 flex-shrink-0'>
            <Card className='h-full border-dashed'>
              <CardContent className='flex h-full items-center justify-center p-6'>
                <Button
                  variant='ghost'
                  onClick={() => setShowAddColumn(true)}
                  className='flex h-full w-full flex-col items-center space-y-2'
                >
                  <Plus className='text-muted-foreground h-8 w-8' />
                  <span className='text-muted-foreground'>添加列</span>
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </DragDropContext>

      {/* 添加列对话框 */}
      <Dialog open={showAddColumn} onOpenChange={setShowAddColumn}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>添加看板列</DialogTitle>
            <DialogDescription>创建一个新的看板列来组织需求</DialogDescription>
          </DialogHeader>
          <div className='space-y-4'>
            <div className='space-y-2'>
              <Label>列标题</Label>
              <Input
                placeholder='输入列标题'
                value={newColumnTitle}
                onChange={(e) => setNewColumnTitle(e.target.value)}
              />
            </div>
            <div className='space-y-2'>
              <Label>对应状态</Label>
              <Input
                placeholder='输入状态值（如：CUSTOM_STATUS）'
                value={newColumnStatus}
                onChange={(e) => setNewColumnStatus(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant='outline' onClick={() => setShowAddColumn(false)}>
              取消
            </Button>
            <Button onClick={handleAddColumn}>添加</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
