import { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';
import Link from 'next/link';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Heading } from '@/components/ui/heading';
import { Separator } from '@/components/ui/separator';
import PageContainer from '@/components/layout/page-container';

import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/get-current-user';
import { hasProjectPermission } from '@/lib/permissions';
import { ArrowLeftIcon, PlusIcon, CalendarIcon } from 'lucide-react';
import { SPRINT_STATUS } from '@/constants/project';
import { format } from 'date-fns';
import { getTranslations } from 'next-intl/server';

interface SprintsPageProps {
  params: {
    projectId: string;
  };
}

export async function generateMetadata({
  params
}: SprintsPageProps): Promise<Metadata> {
  const { projectId } = await params;
  const t = await getTranslations('sprints');

  const project = await prisma.project.findUnique({
    where: { id: projectId }
  });

  if (!project) {
    return {
      title: t('title') + '不存在'
    };
  }

  return {
    title: `${project.name} - ${t('title')}管理`,
    description: `${project.name} 项目的${t('title')}管理`
  };
}

export default async function SprintsPage({ params }: SprintsPageProps) {
  const user = await getCurrentUser();
  const t = await getTranslations('sprints');
  const tc = await getTranslations('common');

  if (!user) {
    redirect('/auth/sign-in');
  }

  const { projectId } = await params;

  // 检查用户是否有查看项目的权限
  const hasPermission = await hasProjectPermission(
    projectId,
    'project.view',
    user.id
  );

  if (!hasPermission) {
    redirect('/dashboard/projects');
  }

  // 获取项目详情
  const project = await prisma.project.findUnique({
    where: { id: projectId }
  });

  if (!project) {
    notFound();
  }

  // 检查用户是否有{t('create')}的权限
  const canCreateSprint = await hasProjectPermission(
    projectId,
    'sprint.create',
    user.id
  );

  // 获取项目迭代列表
  const sprints = await prisma.sprint.findMany({
    where: { projectId },
    orderBy: [{ status: 'asc' }, { endDate: 'desc' }],
    include: {
      _count: {
        select: {
          tasks: true
        }
      }
    }
  });

  // 当前活动迭代
  const activeSprint = sprints.find((sprint) => sprint.status === 'ACTIVE');

  // 规划中的迭代
  const plannedSprints = sprints.filter(
    (sprint) => sprint.status === 'PLANNED'
  );

  // 已完成或已取消的迭代
  const completedSprints = sprints.filter(
    (sprint) => sprint.status === 'COMPLETED' || sprint.status === 'CANCELLED'
  );

  return (
    <PageContainer>
      <div className='mx-auto flex w-full max-w-7xl flex-1 flex-col space-y-6 px-4 md:px-6 lg:px-8'>
        <div className='flex flex-col justify-between gap-4 md:flex-row md:items-center'>
          <div className='flex items-center gap-2'>
            <Button variant='ghost' size='sm' asChild>
              <Link href={`/dashboard/projects/${projectId}`}>
                <ArrowLeftIcon className='mr-2 h-4 w-4' />
                {tc('back')}项目
              </Link>
            </Button>
            <Heading
              title={`${project.name} - ${t('title')}管理`}
              description={`管理项目的${t('title')}计划`}
            />
          </div>

          {canCreateSprint && (
            <Button asChild>
              <Link href={`/dashboard/projects/${projectId}/sprints/new`}>
                <PlusIcon className='mr-2 h-4 w-4' />
                {t('create')}
              </Link>
            </Button>
          )}
        </div>
        <Separator />

        {/* 活动迭代 */}
        <div className='space-y-4'>
          <h2 className='text-xl font-semibold'>当前活动{t('title')}</h2>

          {activeSprint ? (
            <Card className='shadow-sm'>
              <CardHeader className='pb-2'>
                <div className='flex items-start justify-between'>
                  <div>
                    <CardTitle className='text-lg'>
                      <Link
                        href={`/dashboard/projects/${projectId}/sprints/${activeSprint.id}`}
                        className='hover:underline'
                      >
                        {activeSprint.name}
                      </Link>
                    </CardTitle>
                    <CardDescription>
                      {activeSprint.goal || `无${t('title')}目标`}
                    </CardDescription>
                  </div>
                  <Badge
                    variant='outline'
                    className='border-green-200 bg-green-100 text-green-800'
                  >
                    {SPRINT_STATUS.ACTIVE.label}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className='flex flex-wrap gap-6 text-sm'>
                  <div className='text-muted-foreground flex items-center'>
                    <CalendarIcon className='mr-1 h-4 w-4' />
                    <span>
                      {activeSprint.startDate
                        ? format(new Date(activeSprint.startDate), 'yyyy-MM-dd')
                        : '未设置开始日期'}
                      {' - '}
                      {activeSprint.endDate
                        ? format(new Date(activeSprint.endDate), 'yyyy-MM-dd')
                        : '未设置结束日期'}
                    </span>
                  </div>
                  <div className='text-muted-foreground'>
                    任务数量: {activeSprint._count.tasks}
                  </div>
                </div>

                {activeSprint.description && (
                  <div className='mt-4'>
                    <p className='text-muted-foreground line-clamp-2 text-sm'>
                      {activeSprint.description}
                    </p>
                  </div>
                )}

                <div className='mt-4'>
                  <Button variant='outline' size='sm' asChild>
                    <Link
                      href={`/dashboard/projects/${projectId}/sprints/${activeSprint.id}`}
                    >
                      {tc('view')}详情
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className='py-6'>
                <div className='text-muted-foreground text-center'>
                  <p>当前没有活动的{t('title')}</p>
                  {canCreateSprint && (
                    <div className='mt-4'>
                      <Button asChild>
                        <Link
                          href={`/dashboard/projects/${projectId}/sprints/new`}
                        >
                          <PlusIcon className='mr-2 h-4 w-4' />
                          {t('create')}
                        </Link>
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* 规划中的迭代 */}
        <div className='space-y-4'>
          <h2 className='text-xl font-semibold'>规划中的{t('title')}</h2>

          {plannedSprints.length === 0 ? (
            <Card>
              <CardContent className='py-6'>
                <div className='text-muted-foreground text-center'>
                  <p>没有规划中的{t('title')}</p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className='grid grid-cols-1 gap-4 md:grid-cols-2'>
              {plannedSprints.map((sprint) => (
                <Card key={sprint.id}>
                  <CardHeader className='pb-2'>
                    <div className='flex items-start justify-between'>
                      <div>
                        <CardTitle className='text-lg'>
                          <Link
                            href={`/dashboard/projects/${projectId}/sprints/${sprint.id}`}
                            className='hover:underline'
                          >
                            {sprint.name}
                          </Link>
                        </CardTitle>
                        <CardDescription>
                          {sprint.goal || `无${t('title')}目标`}
                        </CardDescription>
                      </div>
                      <Badge
                        variant='outline'
                        className='border-gray-200 bg-gray-100 text-gray-800'
                      >
                        {SPRINT_STATUS.PLANNED.label}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className='flex flex-wrap gap-6 text-sm'>
                      <div className='text-muted-foreground flex items-center'>
                        <CalendarIcon className='mr-1 h-4 w-4' />
                        <span>
                          {sprint.startDate
                            ? format(new Date(sprint.startDate), 'yyyy-MM-dd')
                            : '未设置开始日期'}
                          {' - '}
                          {sprint.endDate
                            ? format(new Date(sprint.endDate), 'yyyy-MM-dd')
                            : '未设置结束日期'}
                        </span>
                      </div>
                      <div className='text-muted-foreground'>
                        任务数量: {sprint._count.tasks}
                      </div>
                    </div>

                    <div className='mt-4'>
                      <Button variant='outline' size='sm' asChild>
                        <Link
                          href={`/dashboard/projects/${projectId}/sprints/${sprint.id}`}
                        >
                          {tc('view')}详情
                        </Link>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* 已完成/已取消的迭代 */}
        {completedSprints.length > 0 && (
          <div className='space-y-4'>
            <h2 className='text-xl font-semibold'>
              已完成/已取消的{t('title')}
            </h2>

            <div className='grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3'>
              {completedSprints.map((sprint) => (
                <Card key={sprint.id}>
                  <CardHeader className='pb-2'>
                    <div className='flex items-start justify-between'>
                      <div>
                        <CardTitle className='text-base'>
                          <Link
                            href={`/dashboard/projects/${projectId}/sprints/${sprint.id}`}
                            className='hover:underline'
                          >
                            {sprint.name}
                          </Link>
                        </CardTitle>
                      </div>
                      <Badge
                        variant='outline'
                        className={` ${
                          sprint.status === 'COMPLETED'
                            ? 'border-blue-200 bg-blue-100 text-blue-800'
                            : 'border-red-200 bg-red-100 text-red-800'
                        } `}
                      >
                        {
                          SPRINT_STATUS[
                            sprint.status as keyof typeof SPRINT_STATUS
                          ].label
                        }
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className='flex flex-wrap gap-6 text-sm'>
                      <div className='text-muted-foreground flex items-center'>
                        <CalendarIcon className='mr-1 h-4 w-4' />
                        <span>
                          {sprint.startDate
                            ? format(new Date(sprint.startDate), 'yyyy-MM-dd')
                            : '未设置'}
                          {' - '}
                          {sprint.endDate
                            ? format(new Date(sprint.endDate), 'yyyy-MM-dd')
                            : '未设置'}
                        </span>
                      </div>
                      <div className='text-muted-foreground'>
                        任务数量: {sprint._count.tasks}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>
    </PageContainer>
  );
}
