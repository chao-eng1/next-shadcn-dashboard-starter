'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Loader2, Calendar, Target, ExternalLink } from 'lucide-react';
import { getApiUrl } from '@/lib/utils';
import { formatDistanceToNow, differenceInDays } from 'date-fns';
import { zhCN } from 'date-fns/locale';

interface SprintOverview {
  id: string;
  name: string;
  goal: string | null;
  status: string;
  startDate: string;
  endDate: string;
  project: {
    id: string;
    name: string;
  };
  tasks: Array<{
    id: string;
    status: string;
  }>;
  createdAt: string;
  updatedAt: string;
}

const STATUS_COLORS = {
  PLANNING: 'bg-gray-100 text-gray-800',
  ACTIVE: 'bg-blue-100 text-blue-800',
  COMPLETED: 'bg-green-100 text-green-800',
  CANCELLED: 'bg-red-100 text-red-800'
};

const STATUS_LABELS = {
  PLANNING: '规划中',
  ACTIVE: '进行中',
  COMPLETED: '已完成',
  CANCELLED: '已取消'
};

export function SprintOverview() {
  const [sprints, setSprints] = useState<SprintOverview[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const t = useTranslations('dashboard.overview');

  useEffect(() => {
    const fetchSprintOverview = async () => {
      try {
        setLoading(true);
        setError(null);

        // 首先获取项目列表
        const projectsResponse = await fetch(
          getApiUrl('/api/projects?limit=50'),
          {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json'
            },
            credentials: 'include'
          }
        );

        if (!projectsResponse.ok) {
          throw new Error('Failed to fetch projects');
        }

        const projectsResult = await projectsResponse.json();
        if (!projectsResult.success) {
          throw new Error(projectsResult.error?.message || 'Failed to fetch projects');
        }

        const projects = projectsResult.data.projects || [];
        const allSprints: SprintOverview[] = [];

        // 为每个项目获取冲刺数据
        await Promise.all(
          projects.map(async (project: any) => {
            try {
              const sprintsResponse = await fetch(
                getApiUrl(`/api/projects/${project.id}/sprints?limit=10&sortBy=updatedAt&sortOrder=desc`),
                {
                  method: 'GET',
                  headers: {
                    'Content-Type': 'application/json'
                  },
                  credentials: 'include'
                }
              );

              if (sprintsResponse.ok) {
                const sprintsData = await sprintsResponse.json();
                if (sprintsData.success) {
                  const projectSprints = sprintsData.data.sprints || [];
                  projectSprints.forEach((sprint: any) => {
                    allSprints.push({
                      ...sprint,
                      project: {
                        id: project.id,
                        name: project.name
                      }
                    });
                  });
                }
              }
            } catch (err) {
              console.error(`Error fetching sprints for project ${project.id}:`, err);
            }
          })
        );

        // 按更新时间排序，取最近的10个
        const sortedSprints = allSprints
          .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
          .slice(0, 10);

        setSprints(sortedSprints);
      } catch (err) {
        console.error('Error fetching sprint overview:', err);
        setError(err instanceof Error ? err.message : '获取冲刺概览失败');
      } finally {
        setLoading(false);
      }
    };

    fetchSprintOverview();
  }, []);

  const calculateProgress = (tasks: Array<{ status: string }>) => {
    if (!tasks || tasks.length === 0) return 0;
    const completedTasks = tasks.filter(task => task.status === 'DONE').length;
    return Math.round((completedTasks / tasks.length) * 100);
  };

  const getRemainingDays = (endDate: string) => {
    const end = new Date(endDate);
    const now = new Date();
    const days = differenceInDays(end, now);
    
    if (days < 0) {
      return { text: `已逾期 ${Math.abs(days)} 天`, isOverdue: true };
    } else if (days === 0) {
      return { text: '今天结束', isOverdue: false };
    } else {
      return { text: `还有 ${days} 天`, isOverdue: false };
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>冲刺概览</CardTitle>
          <CardDescription>最近的冲刺进度</CardDescription>
        </CardHeader>
        <CardContent>
          <div className='flex h-[400px] items-center justify-center'>
            <Loader2 className='h-8 w-8 animate-spin text-primary' />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>冲刺概览</CardTitle>
          <CardDescription>最近的冲刺进度</CardDescription>
        </CardHeader>
        <CardContent>
          <div className='flex h-[400px] items-center justify-center'>
            <div className='text-center text-muted-foreground'>
              <p>{error}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (sprints.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>冲刺概览</CardTitle>
          <CardDescription>最近的冲刺进度</CardDescription>
        </CardHeader>
        <CardContent>
          <div className='flex h-[400px] items-center justify-center'>
            <div className='text-center text-muted-foreground'>
              <p>暂无冲刺数据</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>冲刺概览</CardTitle>
        <CardDescription>
          显示最近更新的 {sprints.length} 个冲刺
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className='space-y-6'>
          {sprints.map((sprint) => {
            const progress = calculateProgress(sprint.tasks);
            const remainingDays = getRemainingDays(sprint.endDate);
            
            return (
              <div key={sprint.id} className='space-y-3'>
                <div className='flex items-start justify-between'>
                  <div className='flex-1 space-y-1'>
                    <div className='flex items-center gap-2'>
                      <Link
                        href={`/dashboard/projects/${sprint.project.id}/sprints/${sprint.id}`}
                        className='font-medium hover:underline'
                      >
                        {sprint.name}
                      </Link>
                      <Badge
                        variant='secondary'
                        className={STATUS_COLORS[sprint.status as keyof typeof STATUS_COLORS]}
                      >
                        {STATUS_LABELS[sprint.status as keyof typeof STATUS_LABELS]}
                      </Badge>
                      <Link
                        href={`/dashboard/projects/${sprint.project.id}/sprints/${sprint.id}`}
                        className='hover:text-foreground'
                      >
                        <ExternalLink className='h-3 w-3' />
                      </Link>
                    </div>
                    
                    <div className='text-sm text-muted-foreground'>
                      <Link
                        href={`/dashboard/projects/${sprint.project.id}`}
                        className='hover:text-foreground hover:underline'
                      >
                        {sprint.project.name}
                      </Link>
                    </div>
                    
                    {sprint.goal && (
                      <div className='flex items-start gap-2 text-sm text-muted-foreground'>
                        <Target className='h-4 w-4 mt-0.5 flex-shrink-0' />
                        <span className='line-clamp-2'>{sprint.goal}</span>
                      </div>
                    )}
                  </div>
                  
                  <div className='text-right space-y-1'>
                    <div className='text-sm font-medium'>{progress}%</div>
                    <div className={`text-xs ${
                      remainingDays.isOverdue ? 'text-red-600' : 'text-muted-foreground'
                    }`}>
                      {remainingDays.text}
                    </div>
                  </div>
                </div>
                
                <Progress value={progress} className='h-2' />
                
                <div className='flex items-center justify-between text-xs text-muted-foreground'>
                  <div className='flex items-center gap-4'>
                    <span>
                      {(sprint.tasks || []).filter(t => t.status === 'DONE').length}/{(sprint.tasks || []).length} 任务完成
                    </span>
                    <div className='flex items-center gap-1'>
                      <Calendar className='h-3 w-3' />
                      <span>
                        {new Date(sprint.startDate).toLocaleDateString('zh-CN')} - {new Date(sprint.endDate).toLocaleDateString('zh-CN')}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        
        <div className='mt-6 text-center'>
          <Link
            href='/dashboard/sprints'
            className='text-sm text-primary hover:underline'
          >
            查看所有冲刺 →
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}