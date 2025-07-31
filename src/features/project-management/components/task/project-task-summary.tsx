'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';
import { useTranslations } from 'next-intl';

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
import { Checkbox } from '@/components/ui/checkbox';
import { Loader2, EyeIcon } from 'lucide-react';

import { TASK_STATUS, TASK_PRIORITY } from '@/constants/project';
import { getApiUrl } from '@/lib/utils';
import { getTaskStatusLabel, getTaskPriorityLabel } from '@/lib/status-labels';

interface Task {
  id: string;
  title: string;
  description?: string;
  status: string;
  priority: string;
  dueDate?: string;
  projectId: string;
  _count: {
    subtasks: number;
    comments: number;
  };
  assignments: Array<{
    id: string;
    member: {
      user: {
        id: string;
        name?: string;
        email: string;
      };
    };
  }>;
  project: {
    name: string;
  };
}

interface ProjectTaskSummaryProps {
  projectId: string;
  userId: string;
}

export function ProjectTaskSummary({
  projectId,
  userId
}: ProjectTaskSummaryProps) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const t = useTranslations('tasks');
  const commonT = useTranslations('common');

  // 加载任务数据
  const loadTasks = async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams({
        page: '1',
        limit: '10',
        sortBy: 'updatedAt',
        sortOrder: 'desc'
      });

      const response = await fetch(
        getApiUrl(`/api/projects/${projectId}/tasks?${params.toString()}`),
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json'
          },
          credentials: 'include'
        }
      );

      if (!response.ok) {
        throw new Error('Failed to fetch tasks');
      }

      const data = await response.json();
      if (data.success) {
        setTasks(data.data.tasks || []);
      } else {
        throw new Error(data.error?.message || 'Failed to fetch tasks');
      }
    } catch (err) {
      console.error('ProjectTaskSummary: 加载任务时出错:', err);
      setError(err instanceof Error ? err.message : '加载任务失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTasks();
  }, [projectId]);

  // 处理任务完成状态切换
  const handleTaskCompletion = async (task: Task, checked: boolean) => {
    try {
      const newStatus = checked ? 'DONE' : 'TODO';

      const response = await fetch(
        getApiUrl(`/api/projects/${projectId}/tasks/${task.id}`),
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json'
          },
          credentials: 'include',
          body: JSON.stringify({ status: newStatus })
        }
      );

      if (!response.ok) {
        throw new Error('Failed to update task status');
      }

      // 重新加载任务列表
      loadTasks();
    } catch (err) {
      console.error('Error updating task:', err);
    }
  };

  if (loading) {
    return (
      <div className='flex items-center justify-center py-8'>
        <Loader2 className='text-primary h-8 w-8 animate-spin' />
      </div>
    );
  }

  if (error) {
    return (
      <div className='bg-destructive/15 text-destructive flex items-center rounded-md p-4'>
        <p>{error}</p>
      </div>
    );
  }

  return (
    <div className='space-y-4'>
      {/* 任务表格 */}
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className='w-[40px]'></TableHead>
            <TableHead>{t('labels.taskTitle')}</TableHead>
            <TableHead>{commonT('status')}</TableHead>
            <TableHead>{t('form.priority')}</TableHead>
            <TableHead>{t('labels.dueDate')}</TableHead>
            <TableHead>{t('labels.assignedTo')}</TableHead>
            <TableHead>{commonT('actions')}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {tasks.length === 0 ? (
            <TableRow>
              <TableCell colSpan={7} className='py-8 text-center'>
                {t('messages.noTasksFound')}
              </TableCell>
            </TableRow>
          ) : (
            tasks.map((task) => (
              <TableRow key={task.id}>
                {/* <TableCell>
                  <Checkbox
                    checked={task.status === 'DONE'}
                    onCheckedChange={(checked) =>
                      handleTaskCompletion(task, checked as boolean)
                    }
                  />
                </TableCell> */}
                <TableCell className='font-medium'>
                  <Link
                    href={`/dashboard/projects/${task.projectId}/tasks/${task.id}`}
                    className='hover:underline'
                  >
                    {task.title}
                  </Link>
                  {task.description && (
                    <p className='text-muted-foreground line-clamp-1 text-sm'>
                      {task.description}
                    </p>
                  )}
                  {/* 子任务和评论数量 */}
                  {(task._count.subtasks > 0 || task._count.comments > 0) && (
                    <div className='mt-1 flex gap-2'>
                      {task._count.subtasks > 0 && (
                        <span className='text-muted-foreground text-xs'>
                          {t('labels.subtasks')}: {task._count.subtasks}
                        </span>
                      )}
                      {task._count.comments > 0 && (
                        <span className='text-muted-foreground text-xs'>
                          {t('labels.comments')}: {task._count.comments}
                        </span>
                      )}
                    </div>
                  )}
                </TableCell>
                <TableCell>
                  <Badge
                    variant='outline'
                    className={`bg-${TASK_STATUS[task.status].color}-100 text-${TASK_STATUS[task.status].color}-800 border-${TASK_STATUS[task.status].color}-200`}
                  >
                    {getTaskStatusLabel(task.status, t)}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge
                    variant='outline'
                    className={`bg-${TASK_PRIORITY[task.priority].color}-100 text-${TASK_PRIORITY[task.priority].color}-800 border-${TASK_PRIORITY[task.priority].color}-200`}
                  >
                    {getTaskPriorityLabel(task.priority, t)}
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
                    <span className='text-muted-foreground'>
                      {t('labels.notSet')}
                    </span>
                  )}
                </TableCell>
                <TableCell>
                  {task.assignments.length > 0 ? (
                    <div className='flex flex-wrap gap-1'>
                      {task.assignments.map((assignment) => (
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
                    </div>
                  ) : (
                    <span className='text-muted-foreground'>
                      {t('labels.unassigned')}
                    </span>
                  )}
                </TableCell>
                <TableCell>
                  <Button
                    variant='ghost'
                    size='icon'
                    className='h-8 w-8 p-0'
                    onClick={() =>
                      router.push(
                        `/dashboard/projects/${task.projectId}/tasks/${task.id}`
                      )
                    }
                    title={t('labels.viewDetails')}
                  >
                    <EyeIcon className='h-4 w-4' />
                  </Button>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>

      {/* 查看更多任务按钮 */}
      <div className='flex justify-center pt-4'>
        <Button asChild className='w-full'>
          <Link href={`/dashboard/tasks?projectId=${projectId}`}>
            {t('viewMoreTasks')}
          </Link>
        </Button>
      </div>
    </div>
  );
}
