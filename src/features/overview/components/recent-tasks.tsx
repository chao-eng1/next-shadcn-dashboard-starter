'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Loader2, Calendar, User, ExternalLink } from 'lucide-react';
import { getApiUrl } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { zhCN } from 'date-fns/locale/zh-CN';

interface RecentTask {
  id: string;
  title: string;
  status: string;
  priority: string;
  dueDate: string | null;
  project: {
    id: string;
    name: string;
  };
  assignedMembers?: Array<{
    user: {
      id: string;
      name: string;
      email: string;
      avatar?: string;
    };
  }>;
  createdAt: string;
  updatedAt: string;
}

const STATUS_COLORS = {
  TODO: 'bg-gray-100 text-gray-800',
  IN_PROGRESS: 'bg-blue-100 text-blue-800',
  IN_REVIEW: 'bg-yellow-100 text-yellow-800',
  DONE: 'bg-green-100 text-green-800',
  CANCELLED: 'bg-red-100 text-red-800'
};

const STATUS_LABELS = {
  TODO: '待办',
  IN_PROGRESS: '进行中',
  IN_REVIEW: '审核中',
  DONE: '已完成',
  CANCELLED: '已取消'
};

const PRIORITY_COLORS = {
  LOW: 'bg-green-100 text-green-800',
  MEDIUM: 'bg-yellow-100 text-yellow-800',
  HIGH: 'bg-orange-100 text-orange-800',
  URGENT: 'bg-red-100 text-red-800'
};

const PRIORITY_LABELS = {
  LOW: '低',
  MEDIUM: '中',
  HIGH: '高',
  URGENT: '紧急'
};

export function RecentTasks() {
  const [tasks, setTasks] = useState<RecentTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const t = useTranslations('dashboard.overview');

  useEffect(() => {
    const fetchRecentTasks = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch(
          getApiUrl('/api/tasks?limit=10&sortBy=updatedAt&sortOrder=desc'),
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

        const result = await response.json();
        if (result.success) {
          setTasks(result.data.tasks || []);
        } else {
          throw new Error(result.error?.message || 'Failed to fetch tasks');
        }
      } catch (err) {
        console.error('Error fetching recent tasks:', err);
        setError(err instanceof Error ? err.message : '获取最近任务失败');
      } finally {
        setLoading(false);
      }
    };

    fetchRecentTasks();
  }, []);

  const formatDueDate = (dueDate: string | null) => {
    if (!dueDate) return null;

    const date = new Date(dueDate);
    const now = new Date();
    const isOverdue = date < now;

    return {
      text: formatDistanceToNow(date, { addSuffix: true, locale: zhCN }),
      isOverdue
    };
  };

  const getUserInitials = (name: string) => {
    return name
      .split(' ')
      .map((word) => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>最近任务</CardTitle>
          <CardDescription>最近更新的任务列表</CardDescription>
        </CardHeader>
        <CardContent>
          <div className='flex h-[400px] items-center justify-center'>
            <Loader2 className='text-primary h-8 w-8 animate-spin' />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>最近任务</CardTitle>
          <CardDescription>最近更新的任务列表</CardDescription>
        </CardHeader>
        <CardContent>
          <div className='flex h-[400px] items-center justify-center'>
            <div className='text-muted-foreground text-center'>
              <p>{error}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (tasks.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>最近任务</CardTitle>
          <CardDescription>最近更新的任务列表</CardDescription>
        </CardHeader>
        <CardContent>
          <div className='flex h-[400px] items-center justify-center'>
            <div className='text-muted-foreground text-center'>
              <p>暂无任务数据</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>最近任务</CardTitle>
        <CardDescription>显示最近更新的 {tasks.length} 个任务</CardDescription>
      </CardHeader>
      <CardContent>
        <div className='space-y-4'>
          {tasks.map((task) => {
            const dueDateInfo = formatDueDate(task.dueDate);

            return (
              <div
                key={task.id}
                className='hover:bg-muted/50 flex items-start justify-between space-x-4 rounded-lg border p-4 transition-colors'
              >
                <div className='flex-1 space-y-2'>
                  <div className='flex items-center gap-2'>
                    <Link
                      href={`/dashboard/projects/${task.project.id}/tasks/${task.id}`}
                      className='line-clamp-1 font-medium hover:underline'
                    >
                      {task.title}
                    </Link>
                    <Link
                      href={`/dashboard/projects/${task.project.id}/tasks/${task.id}`}
                      className='hover:text-foreground'
                    >
                      <ExternalLink className='h-3 w-3' />
                    </Link>
                  </div>

                  <div className='text-muted-foreground flex items-center gap-2 text-sm'>
                    <Link
                      href={`/dashboard/projects/${task.project.id}`}
                      className='hover:text-foreground hover:underline'
                    >
                      {task.project.name}
                    </Link>
                  </div>

                  <div className='flex items-center gap-2'>
                    <Badge
                      variant='secondary'
                      className={
                        STATUS_COLORS[task.status as keyof typeof STATUS_COLORS]
                      }
                    >
                      {STATUS_LABELS[task.status as keyof typeof STATUS_LABELS]}
                    </Badge>

                    <Badge
                      variant='outline'
                      className={
                        PRIORITY_COLORS[
                          task.priority as keyof typeof PRIORITY_COLORS
                        ]
                      }
                    >
                      {
                        PRIORITY_LABELS[
                          task.priority as keyof typeof PRIORITY_LABELS
                        ]
                      }
                    </Badge>

                    {dueDateInfo && (
                      <div
                        className={`flex items-center gap-1 text-xs ${
                          dueDateInfo.isOverdue
                            ? 'text-red-600'
                            : 'text-muted-foreground'
                        }`}
                      >
                        <Calendar className='h-3 w-3' />
                        <span>{dueDateInfo.text}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className='flex items-center gap-2'>
                  {task.assignedMembers && task.assignedMembers.length > 0 ? (
                    <div className='flex -space-x-2'>
                      {task.assignedMembers.slice(0, 3).map((member, index) => (
                        <Avatar
                          key={member.user.id}
                          className='border-background h-6 w-6 border-2'
                        >
                          <AvatarImage
                            src={member.user.avatar}
                            alt={member.user.name}
                          />
                          <AvatarFallback className='text-xs'>
                            {getUserInitials(member.user.name)}
                          </AvatarFallback>
                        </Avatar>
                      ))}
                      {task.assignedMembers.length > 3 && (
                        <div className='border-background bg-muted text-muted-foreground flex h-6 w-6 items-center justify-center rounded-full border-2 text-xs'>
                          +{task.assignedMembers.length - 3}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className='text-muted-foreground flex items-center gap-1 text-xs'>
                      <User className='h-3 w-3' />
                      <span>未分配</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        <div className='mt-6 text-center'>
          <Link
            href='/dashboard/tasks'
            className='text-primary text-sm hover:underline'
          >
            查看所有任务 →
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
