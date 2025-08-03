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
import { Progress } from '@/components/ui/progress';
import { Loader2, EyeIcon, CalendarIcon, TargetIcon } from 'lucide-react';

import { SPRINT_STATUS } from '@/constants/project';
import { getApiUrl } from '@/lib/utils';
import { getSprintStatusLabel } from '@/lib/status-labels';

interface ProjectSprintSummaryProps {
  projectId: string;
  userId: string;
}

interface Sprint {
  id: string;
  name: string;
  goal?: string;
  description?: string;
  status: keyof typeof SPRINT_STATUS;
  startDate?: string;
  endDate?: string;
  projectId: string;
  _count: {
    tasks: number;
  };
  taskStats?: {
    total: number;
    completed: number;
    inProgress: number;
    todo: number;
  };
}

export function ProjectSprintSummary({
  projectId,
  userId
}: ProjectSprintSummaryProps) {
  const [sprints, setSprints] = useState<Sprint[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const t = useTranslations('sprints');
  const commonT = useTranslations('common');

  useEffect(() => {
    const fetchSprints = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch(
          getApiUrl(
            `/api/projects/${projectId}/sprints?limit=10&sortBy=createdAt&sortOrder=desc`
          )
        );

        if (!response.ok) {
          throw new Error('获取迭代列表失败');
        }

        const data = await response.json();
        if (data.success) {
          setSprints(data.data.sprints || []);
        } else {
          throw new Error(data.message || '获取迭代列表失败');
        }
      } catch (err) {
        console.error('获取迭代列表失败:', err);
        setError(err instanceof Error ? err.message : '获取迭代列表失败');
      } finally {
        setLoading(false);
      }
    };

    fetchSprints();
  }, [projectId]);

  // 计算迭代进度
  const calculateProgress = (sprint: Sprint) => {
    if (!sprint.taskStats || sprint.taskStats.total === 0) {
      return 0;
    }
    return Math.round(
      (sprint.taskStats.completed / sprint.taskStats.total) * 100
    );
  };

  // 计算剩余天数
  const calculateDaysRemaining = (endDate?: string) => {
    if (!endDate) return null;
    const today = new Date();
    const end = new Date(endDate);
    const diffTime = end.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
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
      {/* 迭代表格 */}
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{t('form.name')}</TableHead>
            <TableHead>{commonT('status')}</TableHead>
            <TableHead>{t('form.goal')}</TableHead>
            <TableHead>{t('table.progress')}</TableHead>
            <TableHead>{t('table.time')}</TableHead>
            <TableHead>{commonT('actions')}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sprints.length === 0 ? (
            <TableRow>
              <TableCell colSpan={6} className='py-8 text-center'>
                {t('empty.noSprints')}
              </TableCell>
            </TableRow>
          ) : (
            sprints.map((sprint) => {
              const progress = calculateProgress(sprint);
              const daysRemaining = calculateDaysRemaining(sprint.endDate);

              return (
                <TableRow key={sprint.id}>
                  <TableCell className='font-medium'>
                    <Link
                      href={`/dashboard/projects/${sprint.projectId}/sprints/${sprint.id}`}
                      className='hover:underline'
                    >
                      {sprint.name}
                    </Link>
                    {sprint.goal && (
                      <p className='text-muted-foreground line-clamp-1 text-sm'>
                        <TargetIcon className='mr-1 inline h-3 w-3' />
                        {sprint.goal}
                      </p>
                    )}
                    {/* 任务数量 */}
                    {sprint._count.tasks > 0 && (
                      <div className='mt-1 flex gap-2'>
                        <span className='text-muted-foreground text-xs'>
                          {t('table.tasks')}: {sprint._count.tasks}
                        </span>
                      </div>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant='outline'
                      className={`bg-${SPRINT_STATUS[sprint.status].color}-100 text-${SPRINT_STATUS[sprint.status].color}-800 border-${SPRINT_STATUS[sprint.status].color}-200`}
                    >
                      {getSprintStatusLabel(sprint.status, t)}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {sprint.goal ? (
                      <span className='line-clamp-1 text-sm'>
                        {sprint.goal}
                      </span>
                    ) : (
                      <span className='text-muted-foreground text-sm'>
                        {t('table.noGoal')}
                      </span>
                    )}
                  </TableCell>
                  <TableCell>
                    {sprint._count.tasks > 0 ? (
                      <div className='space-y-1'>
                        <div className='flex items-center justify-between text-sm'>
                          <span>{progress}%</span>
                          <span className='text-muted-foreground text-xs'>
                            {sprint.taskStats?.completed || 0}/
                            {sprint._count.tasks}
                          </span>
                        </div>
                        <Progress value={progress} className='h-2' />
                      </div>
                    ) : (
                      <span className='text-muted-foreground text-sm'>
                        {t('table.noTasks')}
                      </span>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className='space-y-1 text-sm'>
                      {sprint.startDate && (
                        <div className='flex items-center gap-1'>
                          <CalendarIcon className='h-3 w-3' />
                          <span className='text-xs'>
                            {format(new Date(sprint.startDate), 'MM/dd')}
                          </span>
                          {sprint.endDate && (
                            <span className='text-muted-foreground text-xs'>
                              - {format(new Date(sprint.endDate), 'MM/dd')}
                            </span>
                          )}
                        </div>
                      )}
                      {daysRemaining !== null && sprint.status === 'ACTIVE' && (
                        <div className='text-xs'>
                          {daysRemaining > 0 ? (
                            <span className='text-blue-600'>
                              {t('table.daysRemaining', {
                                days: daysRemaining
                              })}
                            </span>
                          ) : daysRemaining === 0 ? (
                            <span className='text-orange-600'>
                              {t('table.endToday')}
                            </span>
                          ) : (
                            <span className='text-red-600'>
                              {t('table.overdue', {
                                days: Math.abs(daysRemaining)
                              })}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Button
                      variant='ghost'
                      size='icon'
                      className='h-8 w-8 p-0'
                      onClick={() =>
                        router.push(
                          `/dashboard/projects/${sprint.projectId}/sprints/${sprint.id}`
                        )
                      }
                      title={t('view')}
                    >
                      <EyeIcon className='h-4 w-4' />
                    </Button>
                  </TableCell>
                </TableRow>
              );
            })
          )}
        </TableBody>
      </Table>

      {/* 查看更多迭代按钮 */}
      <div className='flex justify-center pt-4'>
        <Button asChild className='w-full'>
          <Link href={`/dashboard/projects/${projectId}/sprints`}>
            {t('actions.viewAll')}
          </Link>
        </Button>
      </div>
    </div>
  );
}
