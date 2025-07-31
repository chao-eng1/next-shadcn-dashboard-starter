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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Heading } from '@/components/ui/heading';
import PageContainer from '@/components/layout/page-container';
import { RecentTaskList } from '@/features/project-management/components/task/recent-task-list';
import { ProjectTaskSummary } from '@/features/project-management/components/task/project-task-summary';
import { PermissionGate } from '@/components/permission-gate';
import { ProjectPermissionGate } from '@/components/project-permission-gate';

import { format } from 'date-fns';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/get-current-user';
import { hasProjectPermission } from '@/lib/permissions';
import {
  ArrowLeftIcon,
  CalendarIcon,
  ClockIcon,
  UsersIcon
} from 'lucide-react';
import {
  PROJECT_STATUS,
  PROJECT_VISIBILITY,
  TASK_STATUS
} from '@/constants/project';
import { getTranslations } from 'next-intl/server';

interface ProjectPageProps {
  params: {
    projectId: string;
  };
}

export async function generateMetadata({
  params
}: ProjectPageProps): Promise<Metadata> {
  const { projectId } = await params;
  const t = await getTranslations('projects');

  const project = await prisma.project.findUnique({
    where: { id: projectId }
  });

  if (!project) {
    return {
      title: t('messages.notFound')
    };
  }

  return {
    title: project.name,
    description: project.description || `${t('details')}: ${project.name}`
  };
}

export default async function ProjectPage({ params }: ProjectPageProps) {
  const user = await getCurrentUser();
  const t = await getTranslations('projects');
  const tc = await getTranslations('common');
  const tnav = await getTranslations('navigation');
  const ttask = await getTranslations('tasks');
  const tsprint = await getTranslations('sprints');
  const tdoc = await getTranslations('documents');

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
    where: { id: projectId },
    include: {
      owner: {
        select: {
          id: true,
          name: true,
          email: true,
          image: true
        }
      },
      members: {
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              image: true
            }
          }
        }
      },
      _count: {
        select: {
          tasks: true,
          sprints: true,
          documents: true
        }
      }
    }
  });

  if (!project) {
    notFound();
  }

  // 检查用户的权限
  const canUpdateProject = await hasProjectPermission(
    projectId,
    'project.update',
    user.id
  );
  const canManageMembers = await hasProjectPermission(
    projectId,
    'project.member.manage',
    user.id
  );

  // 获取项目任务统计
  const taskStats = await prisma.task.groupBy({
    by: ['status'],
    where: {
      projectId,
      parentTaskId: null // 只统计父任务
    },
    _count: {
      id: true
    }
  });

  // 格式化任务统计数据
  const taskStatsByStatus = {
    TODO: 0,
    IN_PROGRESS: 0,
    REVIEW: 0,
    DONE: 0,
    BLOCKED: 0
  };

  taskStats.forEach((stat) => {
    taskStatsByStatus[stat.status] = stat._count.id;
  });

  // 计算总任务数和完成率
  const totalTasks = Object.values(taskStatsByStatus).reduce(
    (a, b) => a + b,
    0
  );
  const completedTasks = taskStatsByStatus.DONE;
  const completionRate =
    totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  // 获取最近活动的任务
  const recentTasks = await prisma.task.findMany({
    where: {
      projectId
    },
    orderBy: { updatedAt: 'desc' },
    take: 5,
    select: {
      id: true,
      title: true,
      status: true,
      updatedAt: true
    }
  });

  // 获取项目的迭代列表
  const sprints = await prisma.sprint.findMany({
    where: {
      projectId
    },
    select: {
      id: true,
      name: true,
      status: true
    },
    orderBy: {
      createdAt: 'desc'
    }
  });

  // 检查任务相关权限
  const canCreateTask = await hasProjectPermission(
    projectId,
    'task.create',
    user.id
  );
  const canViewTasks = await hasProjectPermission(
    projectId,
    'task.view',
    user.id
  );

  return (
    <PageContainer>
      <div className='mx-auto flex w-full max-w-7xl flex-1 flex-col space-y-6 px-4 md:px-6 lg:px-8'>
        <div className='flex flex-col gap-2'>
          <div className='flex items-center gap-2'>
            <Button variant='ghost' size='sm' asChild>
              <Link href='/dashboard/projects'>
                <ArrowLeftIcon className='mr-2 h-4 w-4' />
                {t('list')}
              </Link>
            </Button>
          </div>
        </div>

        <div className='flex flex-col justify-between gap-4 md:flex-row md:items-center'>
          <div>
            <h1 className='text-3xl font-bold tracking-tight'>
              {project.name}
            </h1>
            {project.description && (
              <p className='text-muted-foreground mt-1'>
                {project.description}
              </p>
            )}
          </div>

          <div className='flex flex-wrap items-center gap-2'>
            <Badge
              variant='outline'
              className={`bg-${PROJECT_STATUS[project.status].color}-100 text-${PROJECT_STATUS[project.status].color}-800 border-${PROJECT_STATUS[project.status].color}-200`}
            >
              {t(`status.${PROJECT_STATUS[project.status].key}`)}
            </Badge>

            <Badge variant='outline'>
              {t(`visibility.${PROJECT_VISIBILITY[project.visibility].key}`)}
            </Badge>

            {canUpdateProject && (
              <Button variant='outline' size='sm' asChild>
                <Link href={`/dashboard/projects/${project.id}/edit`}>
                  {t('edit')}
                </Link>
              </Button>
            )}
          </div>
        </div>

        <div className='text-muted-foreground mt-2 flex flex-wrap gap-6 text-sm'>
          <div className='flex items-center'>
            <CalendarIcon className='mr-1 h-4 w-4' />
            <span>
              {project.startDate
                ? `${t('form.startDate')}: ${format(new Date(project.startDate), 'yyyy-MM-dd')}`
                : `${t('form.startDate')}: ${tc('none')}`}
            </span>
          </div>

          <div className='flex items-center'>
            <CalendarIcon className='mr-1 h-4 w-4' />
            <span>
              {project.endDate
                ? `${t('form.endDate')}: ${format(new Date(project.endDate), 'yyyy-MM-dd')}`
                : `${t('form.endDate')}: ${tc('none')}`}
            </span>
          </div>

          <div className='flex items-center'>
            <ClockIcon className='mr-1 h-4 w-4' />
            <span>
              {tc('updated')}:{' '}
              {format(new Date(project.updatedAt), 'yyyy-MM-dd HH:mm')}
            </span>
          </div>

          <div className='flex items-center'>
            <UsersIcon className='mr-1 h-4 w-4' />
            <span>
              {project.members.length} {t('team.title')}
            </span>
          </div>
        </div>

        <Tabs defaultValue='overview' className='space-y-4'>
          <TabsList>
            <TabsTrigger value='overview'>{tnav('overview')}</TabsTrigger>
            <TabsTrigger value='tasks'>{tnav('tasks')}</TabsTrigger>
            <TabsTrigger value='sprints'>{t('overview.iterations')}</TabsTrigger>
            <TabsTrigger value='docs'>{tnav('documents')}</TabsTrigger>
            <TabsTrigger value='team'>{t('team.title')}</TabsTrigger>
          </TabsList>

          <TabsContent value='overview' className='space-y-4'>
            <div className='grid grid-cols-1 gap-4 md:grid-cols-3'>
              <Card>
                <CardHeader className='pb-2'>
                  <CardTitle className='text-base'>
                    {ttask('title')}{t('overview.statistics')}
                  </CardTitle>
                  <CardDescription>{t('overview.taskStats')}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className='text-2xl font-bold'>
                    {completedTasks}/{totalTasks} ({completionRate}%)
                  </div>
                  <p className='text-muted-foreground text-xs'>
                    {t('overview.completedTasks')}
                  </p>

                  <div className='mt-4 grid grid-cols-2 gap-2'>
                    <div className='flex flex-col'>
                      <span className='text-muted-foreground text-xs'>
                        {ttask('status.todo')}
                      </span>
                      <span className='font-medium'>
                        {taskStatsByStatus.TODO}
                      </span>
                    </div>
                    <div className='flex flex-col'>
                      <span className='text-muted-foreground text-xs'>
                        {ttask('status.inProgress')}
                      </span>
                      <span className='font-medium'>
                        {taskStatsByStatus.IN_PROGRESS}
                      </span>
                    </div>
                    <div className='flex flex-col'>
                      <span className='text-muted-foreground text-xs'>
                        {ttask('status.review')}
                      </span>
                      <span className='font-medium'>
                        {taskStatsByStatus.REVIEW}
                      </span>
                    </div>
                    <div className='flex flex-col'>
                      <span className='text-muted-foreground text-xs'>
                        {ttask('status.blocked')}
                      </span>
                      <span className='font-medium'>
                        {taskStatsByStatus.BLOCKED}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className='pb-2'>
                  <CardTitle className='text-base'>
                    {tsprint('title')}
                  </CardTitle>
                  <CardDescription>{t('overview.sprintPlan')}</CardDescription>
                </CardHeader>
                <CardContent className='space-y-2'>
                  <div className='text-2xl font-bold'>
                    {project._count.sprints}
                  </div>
                  <p className='text-muted-foreground text-xs'>{t('overview.totalSprints')}</p>

                  <div className='mt-4'>
                    <Button
                      variant='outline'
                      size='sm'
                      className='w-full'
                      asChild
                    >
                      <Link href={`/dashboard/projects/${project.id}/sprints`}>
                        {tsprint('view')}
                      </Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className='pb-2'>
                  <CardTitle className='text-base'>{tdoc('title')}</CardTitle>
                  <CardDescription>{t('overview.documentKnowledge')}</CardDescription>
                </CardHeader>
                <CardContent className='space-y-2'>
                  <div className='text-2xl font-bold'>
                    {project._count.documents}
                  </div>
                  <p className='text-muted-foreground text-xs'>{t('overview.totalDocuments')}</p>

                  <div className='mt-4'>
                    <Button
                      variant='outline'
                      size='sm'
                      className='w-full'
                      asChild
                    >
                      <Link
                        href={`/dashboard/projects/${project.id}/documents`}
                      >
                        {tdoc('view')}
                      </Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className='grid grid-cols-1 gap-4 md:grid-cols-2'>
              <Card>
                <CardHeader>
                  <CardTitle className='text-base'>
                    {t('overview.recentTasks')}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {recentTasks.length === 0 ? (
                    <p className='text-muted-foreground py-4 text-center text-sm'>
                      {t('overview.noTasks')}
                    </p>
                  ) : (
                    <div className='space-y-4'>
                      {recentTasks.map((task) => (
                        <div
                          key={task.id}
                          className='flex items-center justify-between'
                        >
                          <div className='flex flex-col'>
                            <Link
                              href={`/dashboard/projects/${project.id}/tasks/${task.id}`}
                              className='text-sm font-medium hover:underline'
                            >
                              {task.title}
                            </Link>
                            <span className='text-muted-foreground text-xs'>
                              {tc('updated')}{' '}
                              {format(
                                new Date(task.updatedAt),
                                'yyyy-MM-dd HH:mm'
                              )}
                            </span>
                          </div>
                          <Badge
                            variant='outline'
                            className={`bg-${TASK_STATUS[task.status as keyof typeof TASK_STATUS]?.color || 'gray'}-100 text-${TASK_STATUS[task.status as keyof typeof TASK_STATUS]?.color || 'gray'}-800 border-${TASK_STATUS[task.status as keyof typeof TASK_STATUS]?.color || 'gray'}-200`}
                          >
                            {ttask(
                              `status.${TASK_STATUS[task.status as keyof typeof TASK_STATUS]?.key}`
                            ) || task.status}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className='mt-4'>
                    <Button
                      variant='outline'
                      size='sm'
                      className='w-full'
                      asChild
                    >
                      <Link href={`/dashboard/projects/${project.id}/tasks`}>
                        {t('overview.viewAllTasks')}
                      </Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className='flex flex-row items-center justify-between'>
                  <div>
                    <CardTitle className='text-base'>
                      {t('team.title')}
                    </CardTitle>
                    <CardDescription>{t('overview.projectTeam')}</CardDescription>
                  </div>
                  {canManageMembers && (
                    <Button variant='outline' size='sm' asChild>
                      <Link href={`/dashboard/projects/${project.id}/team`}>
                        {t('team.invite')}
                      </Link>
                    </Button>
                  )}
                </CardHeader>
                <CardContent>
                  <div className='space-y-4'>
                    {project.members.slice(0, 5).map((member) => (
                      <div
                        key={member.id}
                        className='flex items-center justify-between'
                      >
                        <div className='flex items-center gap-3'>
                          <Avatar className='h-8 w-8'>
                            <AvatarImage
                              src={member.user.image || ''}
                              alt={member.user.name || ''}
                            />
                            <AvatarFallback>
                              {member.user.name?.charAt(0) ||
                                member.user.email.charAt(0)}
                            </AvatarFallback>
                          </Avatar>
                          <div className='flex flex-col'>
                            <span className='text-sm font-medium'>
                              {member.user.name || member.user.email}
                            </span>
                            <span className='text-muted-foreground text-xs'>
                              {member.role}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}

                    {project.members.length > 5 && (
                      <div className='pt-2'>
                        <Separator className='my-2' />
                        <p className='text-muted-foreground text-center text-sm'>
                          {t('overview.moreMembers', { count: project.members.length - 5 })}
                        </p>
                      </div>
                    )}
                  </div>

                  <div className='mt-4'>
                    <Button
                      variant='outline'
                      size='sm'
                      className='w-full'
                      asChild
                    >
                      <Link href={`/dashboard/projects/${project.id}/team`}>
                        {t('overview.viewAllMembers')}
                      </Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value='tasks'>
            <ProjectPermissionGate permission='task.view' projectId={projectId}>
              <Card>
                <CardHeader className='flex flex-row items-center justify-between'>
                  <div>
                    <CardTitle>{t('overview.taskManagement')}</CardTitle>
                    <CardDescription>
                      {t('overview.recentTasksDesc')}
                    </CardDescription>
                  </div>
                  <ProjectPermissionGate
                    permission='task.create'
                    projectId={projectId}
                  >
                    <Button asChild>
                      <Link
                        href={`/dashboard/projects/${project.id}/tasks/new`}
                      >
                        {ttask('create')}
                      </Link>
                    </Button>
                  </ProjectPermissionGate>
                </CardHeader>
                <CardContent>
                  <ProjectTaskSummary projectId={project.id} userId={user.id} />
                </CardContent>
              </Card>
            </ProjectPermissionGate>
          </TabsContent>

          <TabsContent value='sprints'>
            <Card>
              <CardHeader>
                <CardTitle>{t('overview.sprintManagement')}</CardTitle>
                <CardDescription>{t('overview.sprintPlan')}</CardDescription>
              </CardHeader>
              <CardContent>
                <p className='py-4 text-center'>
                  {t('overview.sprintComingSoon')}
                </p>
                <div className='flex justify-center'>
                  <Button asChild>
                    <Link
                      href={`/dashboard/projects/${project.id}/sprints/new`}
                    >
                      {tsprint('create')}
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value='docs'>
            <Card>
              <CardHeader>
                <CardTitle>{t('overview.documentManagement')}</CardTitle>
                <CardDescription>{t('overview.documentKnowledge')}</CardDescription>
              </CardHeader>
              <CardContent>
                <p className='py-4 text-center'>
                  {t('overview.documentComingSoon')}
                </p>
                <div className='flex justify-center'>
                  <Button asChild>
                    <Link
                      href={`/dashboard/projects/${project.id}/documents/new`}
                    >
                      {tdoc('create')}
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value='team'>
            <Card>
              <CardHeader>
                <CardTitle>{t('team.title')}</CardTitle>
                <CardDescription>{t('overview.teamManagement')}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className='py-4'>
                  {/* 显示简化版团队成员列表 */}
                  <div className='space-y-4'>
                    {project.members.slice(0, 5).map((member) => (
                      <div
                        key={member.id}
                        className='flex items-center justify-between'
                      >
                        <div className='flex items-center gap-3'>
                          <Avatar className='h-8 w-8'>
                            <AvatarImage
                              src={member.user.image || ''}
                              alt={member.user.name || ''}
                            />
                            <AvatarFallback>
                              {member.user.name?.charAt(0) ||
                                member.user.email.charAt(0)}
                            </AvatarFallback>
                          </Avatar>
                          <div className='flex flex-col'>
                            <span className='text-sm font-medium'>
                              {member.user.name || member.user.email}
                            </span>
                            <span className='text-muted-foreground text-xs'>
                              {member.role === 'OWNER' && t('team.owner')}
                              {member.role === 'ADMIN' && t('team.admin')}
                              {member.role === 'MEMBER' && t('team.member')}
                              {member.role === 'VIEWER' && t('team.viewer')}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}

                    {project.members.length > 5 && (
                      <div className='pt-2'>
                        <Separator className='my-2' />
                        <p className='text-muted-foreground text-center text-sm'>
                          {t('overview.moreMembers', { count: project.members.length - 5 })}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
                <div className='flex justify-center'>
                  <Button asChild>
                    <Link href={`/dashboard/projects/${project.id}/team`}>
                      {t('overview.manageTeam')}
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </PageContainer>
  );
}
