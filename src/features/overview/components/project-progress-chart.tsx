'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Loader2, ExternalLink } from 'lucide-react';
import { getApiUrl } from '@/lib/utils';

interface ProjectProgress {
  id: string;
  name: string;
  status: string;
  progress: number;
  totalTasks: number;
  completedTasks: number;
  memberCount: number;
}

const STATUS_COLORS = {
  PLANNING: 'bg-gray-100 text-gray-800',
  ACTIVE: 'bg-blue-100 text-blue-800',
  COMPLETED: 'bg-green-100 text-green-800',
  ARCHIVED: 'bg-gray-100 text-gray-600'
};

const STATUS_LABELS = {
  PLANNING: '规划中',
  ACTIVE: '进行中',
  COMPLETED: '已完成',
  ARCHIVED: '已归档'
};

export function ProjectProgressChart() {
  const [projects, setProjects] = useState<ProjectProgress[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const t = useTranslations('dashboard.overview');

  useEffect(() => {
    const fetchProjectProgress = async () => {
      try {
        setLoading(true);
        setError(null);

        // 获取项目数据
        const response = await fetch(getApiUrl('/api/projects?limit=10&sortBy=updatedAt&sortOrder=desc'), {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json'
          },
          credentials: 'include'
        });

        if (!response.ok) {
          throw new Error('Failed to fetch projects');
        }

        const result = await response.json();
        if (result.success) {
          const projectsData = result.data.projects || [];
          
          // 为每个项目获取任务统计
          const projectsWithProgress = await Promise.all(
            projectsData.map(async (project: any) => {
              try {
                // 获取项目的任务数据
                const tasksResponse = await fetch(
                  getApiUrl(`/api/projects/${project.id}/tasks?limit=1000`),
                  {
                    method: 'GET',
                    headers: {
                      'Content-Type': 'application/json'
                    },
                    credentials: 'include'
                  }
                );

                let totalTasks = 0;
                let completedTasks = 0;

                if (tasksResponse.ok) {
                  const tasksData = await tasksResponse.json();
                  if (tasksData.success) {
                    const tasks = tasksData.data.tasks || [];
                    totalTasks = tasks.length;
                    completedTasks = tasks.filter((task: any) => task.status === 'DONE').length;
                  }
                }

                const progress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

                return {
                  id: project.id,
                  name: project.name,
                  status: project.status,
                  progress,
                  totalTasks,
                  completedTasks,
                  memberCount: project._count?.members || 0
                };
              } catch (err) {
                console.error(`Error fetching tasks for project ${project.id}:`, err);
                return {
                  id: project.id,
                  name: project.name,
                  status: project.status,
                  progress: 0,
                  totalTasks: 0,
                  completedTasks: 0,
                  memberCount: project._count?.members || 0
                };
              }
            })
          );

          setProjects(projectsWithProgress);
        } else {
          throw new Error(result.error?.message || 'Failed to fetch projects');
        }
      } catch (err) {
        console.error('Error fetching project progress:', err);
        setError(err instanceof Error ? err.message : '获取项目进度失败');
      } finally {
        setLoading(false);
      }
    };

    fetchProjectProgress();
  }, []);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>项目进度概览</CardTitle>
          <CardDescription>各项目的完成进度</CardDescription>
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
          <CardTitle>项目进度概览</CardTitle>
          <CardDescription>各项目的完成进度</CardDescription>
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

  if (projects.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>项目进度概览</CardTitle>
          <CardDescription>各项目的完成进度</CardDescription>
        </CardHeader>
        <CardContent>
          <div className='flex h-[400px] items-center justify-center'>
            <div className='text-center text-muted-foreground'>
              <p>暂无项目数据</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>项目进度概览</CardTitle>
        <CardDescription>
          显示最近更新的 {projects.length} 个项目的完成进度
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className='space-y-6'>
          {projects.map((project) => (
            <div key={project.id} className='space-y-2'>
              <div className='flex items-center justify-between'>
                <div className='flex items-center gap-3'>
                  <Link
                    href={`/dashboard/projects/${project.id}`}
                    className='font-medium hover:underline'
                  >
                    {project.name}
                  </Link>
                  <Badge
                    variant='secondary'
                    className={STATUS_COLORS[project.status as keyof typeof STATUS_COLORS]}
                  >
                    {STATUS_LABELS[project.status as keyof typeof STATUS_LABELS]}
                  </Badge>
                </div>
                <div className='flex items-center gap-2 text-sm text-muted-foreground'>
                  <span>{project.progress}%</span>
                  <Link
                    href={`/dashboard/projects/${project.id}`}
                    className='hover:text-foreground'
                  >
                    <ExternalLink className='h-4 w-4' />
                  </Link>
                </div>
              </div>
              
              <Progress value={project.progress} className='h-2' />
              
              <div className='flex items-center justify-between text-xs text-muted-foreground'>
                <span>
                  {project.completedTasks}/{project.totalTasks} 任务完成
                </span>
                <span>
                  {project.memberCount} 名成员
                </span>
              </div>
            </div>
          ))}
        </div>
        
        <div className='mt-6 text-center'>
          <Link
            href='/dashboard/projects'
            className='text-sm text-primary hover:underline'
          >
            查看所有项目 →
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}