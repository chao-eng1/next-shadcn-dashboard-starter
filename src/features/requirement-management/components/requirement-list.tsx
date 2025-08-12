'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import {
  CalendarDays,
  User,
  Tag,
  AlertCircle,
  CheckCircle2,
  Clock,
  Trash2,
  MoreVertical
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';
import { useGlobalRequirements } from '../hooks/use-global-requirements';
import { DeleteConfirmDialog } from './delete-confirm-dialog';

interface RequirementListProps {
  filters?: {
    search?: string;
    status?: string[];
    priority?: string[];
    type?: string[];
    complexity?: string[];
    projectId?: string[];
    assigneeId?: string[];
    creatorId?: string[];
    tags?: string[];
    dueDateFrom?: Date;
    dueDateTo?: Date;
    createdFrom?: Date;
    createdTo?: Date;
  };
  onRequirementClick?: (requirementId: string) => void;
}

export function RequirementList({
  filters = {},
  onRequirementClick
}: RequirementListProps) {
  const t = useTranslations('requirements');
  const [currentPage, setCurrentPage] = useState(1);
  const [deleteDialog, setDeleteDialog] = useState<{
    open: boolean;
    requirement: { id: string; title: string; requirementId?: string } | null;
  }>({ open: false, requirement: null });
  const [deleting, setDeleting] = useState(false);

  // 转换过滤器参数
  const { requirements, loading, error, pagination, deleteRequirement } =
    useGlobalRequirements({
      page: currentPage,
      limit: 20,
      search: filters.search,
      status: filters.status,
      priority: filters.priority,
      type: filters.type,
      complexity: filters.complexity,
      projectId: filters.projectId?.[0],
      assignedToId: filters.assigneeId?.[0],
      createdById: filters.creatorId?.[0],
      sortField: 'createdAt',
      sortDirection: 'desc'
    });

  // 处理删除确认
  const handleDeleteConfirm = async () => {
    if (!deleteDialog.requirement) return;

    setDeleting(true);
    try {
      await deleteRequirement(deleteDialog.requirement.id);
      setDeleteDialog({ open: false, requirement: null });
    } catch (error) {
      // 错误已在hook中处理
    } finally {
      setDeleting(false);
    }
  };

  // 打开删除确认对话框
  const handleDeleteClick = (requirement: {
    id: string;
    title: string;
    requirementId?: string;
  }) => {
    setDeleteDialog({ open: true, requirement });
  };

  const statusConfig = {
    DRAFT: {
      label: t('statuses.draft'),
      color: 'bg-gray-100 text-gray-800',
      icon: Clock
    },
    REVIEW: {
      label: t('statuses.review'),
      color: 'bg-yellow-100 text-yellow-800',
      icon: AlertCircle
    },
    APPROVED: {
      label: t('statuses.approved'),
      color: 'bg-green-100 text-green-800',
      icon: CheckCircle2
    },
    IN_DEVELOPMENT: {
      label: t('statuses.inProgress'),
      color: 'bg-blue-100 text-blue-800',
      icon: Clock
    },
    COMPLETED: {
      label: t('statuses.completed'),
      color: 'bg-green-100 text-green-800',
      icon: CheckCircle2
    },
    REJECTED: {
      label: t('statuses.rejected'),
      color: 'bg-red-100 text-red-800',
      icon: AlertCircle
    }
  };

  const typeConfig = {
    FUNCTIONAL: {
      label: t('types.functional'),
      color: 'bg-blue-100 text-blue-800'
    },
    NON_FUNCTIONAL: {
      label: t('types.nonFunctional'),
      color: 'bg-purple-100 text-purple-800'
    },
    BUSINESS: {
      label: t('types.business'),
      color: 'bg-green-100 text-green-800'
    },
    TECHNICAL: {
      label: t('types.technical'),
      color: 'bg-gray-100 text-gray-800'
    }
  };

  if (loading) {
    return (
      <div className='space-y-4'>
        {[...Array(3)].map((_, i) => (
          <Card key={i} className='animate-pulse'>
            <CardHeader>
              <div className='h-4 w-3/4 rounded bg-gray-200'></div>
              <div className='h-3 w-1/2 rounded bg-gray-200'></div>
            </CardHeader>
            <CardContent>
              <div className='space-y-2'>
                <div className='h-3 rounded bg-gray-200'></div>
                <div className='h-3 w-5/6 rounded bg-gray-200'></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className='flex flex-col items-center justify-center py-12'>
          <AlertCircle className='mb-4 h-12 w-12 text-red-400' />
          <h3 className='mb-2 text-lg font-medium text-gray-900'>加载失败</h3>
          <p className='mb-4 text-center text-gray-500'>{error}</p>
          <Button onClick={() => window.location.reload()}>重试</Button>
        </CardContent>
      </Card>
    );
  }

  if (requirements.length === 0) {
    return (
      <Card>
        <CardContent className='flex flex-col items-center justify-center py-12'>
          <AlertCircle className='mb-4 h-12 w-12 text-gray-400' />
          <h3 className='mb-2 text-lg font-medium text-gray-900'>
            {t('noRequirements')}
          </h3>
          <p className='text-center text-gray-500'>
            {t('noRequirementsDescription')}
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <div className='space-y-4'>
        {requirements.map((requirement) => {
          const statusKey = requirement.status as keyof typeof statusConfig;
          const typeKey = requirement.type as keyof typeof typeConfig;

          const StatusIcon = statusConfig[statusKey]?.icon || Clock;

          // 计算进度（可以基于状态或其他逻辑）
          const getProgress = (status: string) => {
            switch (status) {
              case 'DRAFT':
                return 0;
              case 'REVIEW':
                return 25;
              case 'APPROVED':
                return 40;
              case 'IN_DEVELOPMENT':
                return 70;
              case 'COMPLETED':
                return 100;
              default:
                return 0;
            }
          };

          const progress = getProgress(requirement.status);

          return (
            <Card
              key={requirement.id}
              className='transition-shadow hover:shadow-md'
            >
              <CardHeader className='pb-3'>
                <div className='flex items-start justify-between'>
                  <div
                    className='flex-1 cursor-pointer'
                    onClick={() => onRequirementClick?.(requirement.id)}
                  >
                    <CardTitle className='mb-2 text-lg font-semibold'>
                      <div className='flex items-center gap-2'>
                        {requirement.requirementId && (
                          <Badge variant='outline' className='text-xs'>
                            {requirement.requirementId}
                          </Badge>
                        )}
                        {requirement.title}
                      </div>
                    </CardTitle>
                    <p className='line-clamp-2 text-sm text-gray-600'>
                      {requirement.description}
                    </p>
                  </div>
                  <div className='ml-4 flex items-center gap-2'>
                    {/* 状态标签 */}
                    <Badge
                      variant='secondary'
                      className={cn(
                        'text-xs',
                        statusConfig[statusKey]?.color ||
                          'bg-gray-100 text-gray-800'
                      )}
                    >
                      <StatusIcon className='mr-1 h-3 w-3' />
                      {statusConfig[statusKey]?.label || requirement.status}
                    </Badge>

                    {/* 类型标签 */}
                    <Badge
                      variant='outline'
                      className={cn(
                        'text-xs',
                        typeConfig[typeKey]?.color ||
                          'bg-gray-100 text-gray-800'
                      )}
                    >
                      {typeConfig[typeKey]?.label || requirement.type}
                    </Badge>

                    {/* 操作菜单 */}
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant='ghost'
                          size='sm'
                          className='h-8 w-8 flex-shrink-0 p-0'
                        >
                          <MoreVertical className='h-4 w-4' />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align='end'>
                        <DropdownMenuItem
                          className='cursor-pointer text-red-600'
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteClick({
                              id: requirement.id,
                              title: requirement.title,
                              requirementId: requirement.requirementId
                            });
                          }}
                        >
                          <Trash2 className='mr-2 h-4 w-4' />
                          删除需求
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              </CardHeader>

              <CardContent className='pt-0'>
                <div className='space-y-4'>
                  {/* Progress */}
                  {progress > 0 && (
                    <div className='space-y-1'>
                      <div className='flex justify-between text-sm'>
                        <span className='text-gray-600'>进度</span>
                        <span className='font-medium'>{progress}%</span>
                      </div>
                      <Progress value={progress} className='h-2' />
                    </div>
                  )}

                  {/* Metadata */}
                  <div className='flex flex-wrap items-center gap-4 text-sm text-gray-600'>
                    <div className='flex items-center gap-1'>
                      <Tag className='h-4 w-4' />
                      <Badge
                        variant='outline'
                        className={cn(
                          typeConfig[typeKey]?.color ||
                            'bg-gray-100 text-gray-800'
                        )}
                      >
                        {typeConfig[typeKey]?.label || requirement.type}
                      </Badge>
                    </div>

                    <div className='flex items-center gap-2'>
                      <span className='text-muted-foreground text-xs'>
                        项目: {requirement.project.name}
                      </span>
                    </div>

                    {requirement.assignedTo && (
                      <div className='flex items-center gap-2'>
                        <User className='h-4 w-4' />
                        <Avatar className='h-5 w-5'>
                          <AvatarImage src={requirement.assignedTo.image} />
                          <AvatarFallback className='text-xs'>
                            {requirement.assignedTo.name.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        <span>{requirement.assignedTo.name}</span>
                      </div>
                    )}

                    {requirement.dueDate && (
                      <div className='flex items-center gap-1'>
                        <CalendarDays className='h-4 w-4' />
                        <span>
                          {new Date(requirement.dueDate).toLocaleDateString()}
                        </span>
                      </div>
                    )}

                    {requirement.estimatedEffort && (
                      <div className='flex items-center gap-2'>
                        <span>工作量: {requirement.estimatedEffort}天</span>
                      </div>
                    )}
                  </div>

                  {/* Tags */}
                  {requirement.tags && requirement.tags.length > 0 && (
                    <div className='flex flex-wrap gap-1'>
                      {requirement.tags.map((tagItem) => (
                        <Badge
                          key={tagItem.tag.id}
                          variant='secondary'
                          className='text-xs'
                        >
                          {tagItem.tag.name}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className='flex items-center justify-center gap-2 pt-4'>
            <Button
              variant='outline'
              size='sm'
              onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
              disabled={currentPage <= 1}
            >
              上一页
            </Button>

            <span className='text-muted-foreground text-sm'>
              第 {pagination.page} 页，共 {pagination.totalPages} 页
            </span>

            <Button
              variant='outline'
              size='sm'
              onClick={() =>
                setCurrentPage((prev) =>
                  Math.min(pagination.totalPages, prev + 1)
                )
              }
              disabled={currentPage >= pagination.totalPages}
            >
              下一页
            </Button>
          </div>
        )}
      </div>

      {/* 删除确认对话框 */}
      <DeleteConfirmDialog
        open={deleteDialog.open}
        onOpenChange={(open) => setDeleteDialog({ open, requirement: null })}
        onConfirm={handleDeleteConfirm}
        title={deleteDialog.requirement?.title || ''}
        requirementId={deleteDialog.requirement?.requirementId}
        loading={deleting}
      />
    </>
  );
}

export default RequirementList;
