'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { EyeIcon, PencilIcon, Loader2, AlertCircleIcon } from 'lucide-react';
import { TASK_STATUS, TASK_PRIORITY } from '@/constants/project';
import { format } from 'date-fns';
import { useTranslations } from 'next-intl';

interface RecentTaskListProps {
  projectId: string;
  userId: string;
}

interface Task {
  id: string;
  title: string;
  description: string | null;
  status: keyof typeof TASK_STATUS;
  priority: keyof typeof TASK_PRIORITY;
  dueDate: string | null;
  estimatedHours: number | null;
  completedAt: string | null;
  parentTaskId: string | null;
  sprintId: string | null;
  createdAt: string;
  updatedAt: string;
  assignments: {
    id: string;
    member: {
      id: string;
      user: {
        id: string;
        name: string | null;
        email: string;
        image: string | null;
      };
    };
  }[];
  _count: {
    subtasks: number;
    comments: number;
    attachments: number;
  };
}

interface ApiResponse {
  success: boolean;
  data: {
    tasks: Task[];
    pagination: {
      total: number;
      page: number;
      limit: number;
      totalPages: number;
    };
  };
}

export function RecentTaskList({ projectId, userId }: RecentTaskListProps) {
  const router = useRouter();
  const t = useTranslations('tasks');
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 加载最近10条任务
  const loadRecentTasks = async () => {
    setLoading(true);
    setError(null);

    try {
      // 构建查询参数 - 获取最近更新的10条任务
      const params = new URLSearchParams();
      params.set('page', '1');
      params.set('limit', '10');
      params.set('sortBy', 'updatedAt');
      params.set('sortOrder', 'desc');

      const response = await fetch(
        `/api/projects/${projectId}/tasks?${params.toString()}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json'
          },
          credentials: 'include'
        }
      );

      if (!response.ok) {
        throw new Error('加载任务列表失败');
      }

      const data: ApiResponse = await response.json();

      if (data.success) {
        setTasks(data.data.tasks);
      } else {
        throw new Error('加载任务列表失败');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '未知错误');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRecentTasks();
  }, [projectId]);

  if (loading) {
    return (
      <div className='flex items-center justify-center py-8'>
        <Loader2 className='h-6 w-6 animate-spin' />
        <span className='ml-2'>加载中...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className='text-destructive flex items-center justify-center py-8'>
        <AlertCircleIcon className='h-6 w-6' />
        <span className='ml-2'>{error}</span>
      </div>
    );
  }

  if (tasks.length === 0) {
    return (
      <div className='text-muted-foreground py-8 text-center'>
        <p>暂无任务</p>
        <Button asChild className='mt-4'>
          <Link href={`/dashboard/projects/${projectId}/tasks/new`}>
            创建第一个任务
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <div className='space-y-4'>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>任务标题</TableHead>
            <TableHead>状态</TableHead>
            <TableHead>优先级</TableHead>
            <TableHead>截止日期</TableHead>
            <TableHead>分配给</TableHead>
            <TableHead className='text-right'>操作</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {tasks.map((task) => (
            <TableRow key={task.id}>
              <TableCell>
                <div className='space-y-1'>
                  <div className='font-medium'>{task.title}</div>
                  {task.description && (
                    <div className='text-muted-foreground line-clamp-1 text-sm'>
                      {task.description}
                    </div>
                  )}
                  {(task._count.subtasks > 0 ||
                    task._count.attachments > 0 ||
                    task._count.comments > 0) && (
                    <div className='flex gap-2'>
                      {task._count.subtasks > 0 && (
                        <span className='text-muted-foreground text-xs'>
                          {t('labels.subtasks')}: {task._count.subtasks}
                        </span>
                      )}
                      {task._count.attachments > 0 && (
                        <span className='text-muted-foreground text-xs'>
                          {t('labels.attachments')}: {task._count.attachments}
                        </span>
                      )}
                      {task._count.comments > 0 && (
                        <span className='text-muted-foreground text-xs'>
                          {t('labels.comments')}: {task._count.comments}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </TableCell>
              <TableCell>
                <Badge
                  variant='outline'
                  className={`bg-${TASK_STATUS[task.status].color}-100 text-${TASK_STATUS[task.status].color}-800 border-${TASK_STATUS[task.status].color}-200`}
                >
                  {TASK_STATUS[task.status].label}
                </Badge>
              </TableCell>
              <TableCell>
                <Badge
                  variant='outline'
                  className={`bg-${TASK_PRIORITY[task.priority].color}-100 text-${TASK_PRIORITY[task.priority].color}-800 border-${TASK_PRIORITY[task.priority].color}-200`}
                >
                  {TASK_PRIORITY[task.priority].label}
                </Badge>
              </TableCell>
              <TableCell>
                {task.dueDate ? (
                  <span
                    className={`${
                      new Date(task.dueDate) < new Date() &&
                      task.status !== 'DONE'
                        ? 'text-destructive'
                        : ''
                    }`}
                  >
                    {format(new Date(task.dueDate), 'yyyy-MM-dd')}
                  </span>
                ) : (
                  <span className='text-muted-foreground'>未设置</span>
                )}
              </TableCell>
              <TableCell>
                {task.assignments.length > 0 ? (
                  <div className='flex flex-wrap gap-1'>
                    {task.assignments.slice(0, 2).map((assignment) => (
                      <Badge
                        key={assignment.id}
                        variant='outline'
                        className={`${
                          assignment.member.user.id === userId
                            ? 'bg-primary/10 text-primary border-primary/20'
                            : ''
                        }`}
                      >
                        {assignment.member.user.name ||
                          assignment.member.user.email}
                      </Badge>
                    ))}
                    {task.assignments.length > 2 && (
                      <Badge
                        variant='outline'
                        className='text-muted-foreground'
                      >
                        +{task.assignments.length - 2}
                      </Badge>
                    )}
                  </div>
                ) : (
                  <span className='text-muted-foreground'>未分配</span>
                )}
              </TableCell>
              <TableCell className='text-right'>
                <div className='flex items-center justify-end space-x-1'>
                  <Button
                    variant='ghost'
                    size='icon'
                    className='h-8 w-8 p-0'
                    onClick={() =>
                      router.push(
                        `/dashboard/projects/${projectId}/tasks/${task.id}`
                      )
                    }
                    title='查看详情'
                  >
                    <EyeIcon className='h-4 w-4' />
                  </Button>
                  <Button
                    variant='ghost'
                    size='icon'
                    className='h-8 w-8 p-0'
                    onClick={() =>
                      router.push(
                        `/dashboard/projects/${projectId}/tasks/${task.id}/edit`
                      )
                    }
                    title='编辑任务'
                  >
                    <PencilIcon className='h-4 w-4' />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {/* 查看更多任务按钮 */}
      <div className='flex justify-center pt-4'>
        <Button variant='outline' asChild>
          <Link href={`/dashboard/tasks?projectId=${projectId}`}>
            查看更多任务
          </Link>
        </Button>
      </div>
    </div>
  );
}
