import { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';
import Link from 'next/link';
import { format } from 'date-fns';
import { zhCN } from 'date-fns/locale';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from '@/components/ui/tooltip';

import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/get-current-user';
import { hasProjectPermission } from '@/lib/permissions';
import {
  ArrowLeftIcon,
  CalendarIcon,
  Edit2Icon,
  AlertTriangleIcon,
  ClockIcon,
  ListIcon,
  CheckIcon,
  XIcon,
  Play,
  PlusIcon,
  UserIcon,
  TrendingUpIcon,
  TargetIcon
} from 'lucide-react';
import { SPRINT_STATUS, TASK_STATUS, TASK_PRIORITY } from '@/constants/project';
import { EditSprintDialog } from '@/features/project-management/components/sprint/edit-sprint-dialog';
import { SprintStatusDialog } from '@/features/project-management/components/sprint/sprint-status-dialog';
import { DeleteSprintDialog } from '@/features/project-management/components/sprint/delete-sprint-dialog';
import { AddTaskToSprintDialog } from '@/features/project-management/components/sprint/add-task-to-sprint-dialog';

interface SprintPageProps {
  params: {
    projectId: string;
    sprintId: string;
  };
}

export async function generateMetadata({
  params
}: SprintPageProps): Promise<Metadata> {
  const sprint = await prisma.sprint.findUnique({
    where: {
      id: (await params).sprintId,
      projectId: (await params).projectId
    }
  });

  if (!sprint) {
    return {
      title: '迭代不存在'
    };
  }

  return {
    title: `${sprint.name} - 迭代详情`,
    description: sprint.description || `迭代详情：${sprint.name}`
  };
}

export default async function SprintPage({ params }: SprintPageProps) {
  const user = await getCurrentUser();

  if (!user) {
    redirect('/auth/sign-in');
  }

  const { projectId, sprintId } = params;

  // 检查用户是否有查看项目的权限
  const hasPermission = await hasProjectPermission(
    projectId,
    'project.view',
    user.id
  );

  if (!hasPermission) {
    redirect('/dashboard/projects');
  }

  // 获取迭代详情
  const sprint = await prisma.sprint.findUnique({
    where: {
      id: sprintId,
      projectId
    },
    include: {
      project: {
        select: {
          id: true,
          name: true
        }
      },
      tasks: {
        include: {
          assignments: {
            include: {
              member: {
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
              }
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        }
      },
      _count: {
        select: {
          tasks: true
        }
      }
    }
  });

  if (!sprint) {
    notFound();
  }

  // 获取项目中的所有任务（用于添加到迭代）
  const availableTasks = await prisma.task.findMany({
    where: {
      projectId: projectId
    },
    include: {
      sprint: {
        select: {
          id: true,
          name: true
        }
      },
      assignments: {
        include: {
          member: {
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
          }
        }
      }
    },
    orderBy: {
      createdAt: 'desc'
    }
  });

  // 检查用户的权限
  const canUpdateSprint = await hasProjectPermission(
    projectId,
    'sprint.update',
    user.id
  );
  const canDeleteSprint = await hasProjectPermission(
    projectId,
    'sprint.delete',
    user.id
  );

  // 计算迭代统计数据
  const tasksByStatus = Object.keys(TASK_STATUS).reduce(
    (acc, status) => {
      acc[status] = sprint.tasks.filter(
        (task) => task.status === status
      ).length;
      return acc;
    },
    {} as Record<string, number>
  );

  const totalTasks = sprint._count.tasks;
  const completedTasks = tasksByStatus['DONE'] || 0;
  const inProgressTasks = tasksByStatus['IN_PROGRESS'] || 0;
  const reviewTasks = tasksByStatus['REVIEW'] || 0;
  const blockedTasks = tasksByStatus['BLOCKED'] || 0;
  const completionRate =
    totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  // 计算迭代健康度
  const healthScore =
    totalTasks > 0
      ? ((completedTasks * 1.0 + reviewTasks * 0.8 + inProgressTasks * 0.5) /
          totalTasks) *
        100
      : 0;

  // 获取唯一的任务分配者
  const uniqueAssignees = Array.from(
    new Set(
      sprint.tasks
        .flatMap((task) => task.assignments)
        .map((assignment) => assignment.member.user.id)
    )
  )
    .map((userId) => {
      const assignment = sprint.tasks
        .flatMap((task) => task.assignments)
        .find((assignment) => assignment.member.user.id === userId);
      return assignment?.member.user;
    })
    .filter(Boolean);

  // 检查迭代日期
  const today = new Date();
  const isActive = sprint.status === 'ACTIVE';
  const hasStarted = sprint.startDate
    ? new Date(sprint.startDate) <= today
    : false;
  const hasEnded = sprint.endDate ? new Date(sprint.endDate) < today : false;

  // 计算剩余天数
  const daysRemaining = sprint.endDate
    ? Math.ceil(
        (new Date(sprint.endDate).getTime() - today.getTime()) /
          (1000 * 60 * 60 * 24)
      )
    : null;

  // 计算持续时间
  const duration =
    sprint.startDate && sprint.endDate
      ? Math.ceil(
          (new Date(sprint.endDate).getTime() -
            new Date(sprint.startDate).getTime()) /
            (1000 * 60 * 60 * 24)
        )
      : null;

  // 迭代警告提示
  let sprintWarning = null;
  if (isActive && hasEnded) {
    sprintWarning = '迭代已超过计划结束日期，但仍处于活动状态。';
  } else if (sprint.status === 'PLANNED' && hasStarted) {
    sprintWarning = '迭代计划开始日期已过，但尚未激活。';
  }

  return (
    <div className='w-full'>
      <div className='container mx-auto max-w-7xl space-y-6 px-4 py-6 sm:px-6 lg:px-8'>
        {/* 顶部导航和标题 */}
        <div className='flex flex-col gap-4'>
          <div className='flex items-center gap-2'>
            <Button variant='ghost' size='sm' asChild>
              <Link href={`/dashboard/projects/${projectId}/sprints`}>
                <ArrowLeftIcon className='mr-2 h-4 w-4' />
                返回迭代列表
              </Link>
            </Button>
          </div>

          <div className='flex flex-col justify-between gap-4 md:flex-row md:items-start'>
            <div className='flex-1'>
              <div className='mb-2 flex items-center gap-3'>
                <h1 className='text-3xl font-bold tracking-tight'>
                  {sprint.name}
                </h1>
                <Badge
                  variant='outline'
                  className={`px-3 py-1 text-sm ${
                    sprint.status === 'ACTIVE'
                      ? 'border-green-200 bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400'
                      : sprint.status === 'PLANNED'
                        ? 'border-blue-200 bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400'
                        : sprint.status === 'COMPLETED'
                          ? 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400'
                          : 'border-red-200 bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400'
                  }`}
                >
                  {
                    SPRINT_STATUS[sprint.status as keyof typeof SPRINT_STATUS]
                      .label
                  }
                </Badge>
              </div>

              {sprint.goal && (
                <div className='mb-4 flex items-start gap-2'>
                  <TargetIcon className='text-muted-foreground mt-0.5 h-4 w-4 flex-shrink-0' />
                  <p className='text-muted-foreground font-medium'>
                    {sprint.goal}
                  </p>
                </div>
              )}

              {/* 迭代关键信息 */}
              <div className='text-muted-foreground flex flex-wrap gap-6 text-sm'>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className='flex items-center gap-1.5'>
                        <CalendarIcon className='h-4 w-4' />
                        <span>
                          {sprint.startDate
                            ? format(new Date(sprint.startDate), 'MM月dd日', {
                                locale: zhCN
                              })
                            : '未设置'}
                          {' - '}
                          {sprint.endDate
                            ? format(new Date(sprint.endDate), 'MM月dd日', {
                                locale: zhCN
                              })
                            : '未设置'}
                        </span>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>迭代时间范围</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>

                {duration && (
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className='flex items-center gap-1.5'>
                          <ClockIcon className='h-4 w-4' />
                          <span>{duration} 天</span>
                        </div>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>迭代持续时间</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                )}

                {daysRemaining !== null && isActive && (
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div
                          className={`flex items-center gap-1.5 ${
                            daysRemaining < 0
                              ? 'text-red-500'
                              : daysRemaining <= 3
                                ? 'text-orange-500'
                                : ''
                          }`}
                        >
                          <TrendingUpIcon className='h-4 w-4' />
                          <span>
                            {daysRemaining < 0
                              ? `已超期 ${Math.abs(daysRemaining)} 天`
                              : daysRemaining === 0
                                ? '今天结束'
                                : `剩余 ${daysRemaining} 天`}
                          </span>
                        </div>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>距离迭代结束时间</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                )}

                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className='flex items-center gap-1.5'>
                        <ListIcon className='h-4 w-4' />
                        <span>{totalTasks} 个任务</span>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>迭代任务总数</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>

                {uniqueAssignees.length > 0 && (
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className='flex items-center gap-2'>
                          <UserIcon className='h-4 w-4' />
                          <div className='flex -space-x-1'>
                            {uniqueAssignees.slice(0, 3).map((user, index) => (
                              <Avatar
                                key={user.id}
                                className='border-background h-5 w-5 border-2'
                              >
                                {user.image ? (
                                  <AvatarImage
                                    src={user.image}
                                    alt={user.name || user.email}
                                  />
                                ) : (
                                  <AvatarFallback className='text-xs'>
                                    {(user.name || user.email)
                                      .charAt(0)
                                      .toUpperCase()}
                                  </AvatarFallback>
                                )}
                              </Avatar>
                            ))}
                            {uniqueAssignees.length > 3 && (
                              <div className='bg-muted border-background flex h-5 w-5 items-center justify-center rounded-full border-2 text-xs'>
                                +{uniqueAssignees.length - 3}
                              </div>
                            )}
                          </div>
                        </div>
                      </TooltipTrigger>
                      <TooltipContent>
                        <div className='space-y-1'>
                          <p>参与成员:</p>
                          {uniqueAssignees.map((user) => (
                            <p key={user.id} className='text-sm'>
                              {user.name || user.email}
                            </p>
                          ))}
                        </div>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                )}
              </div>
            </div>

            <div className='flex gap-2'>
              {canUpdateSprint && (
                <EditSprintDialog
                  projectId={projectId}
                  sprint={{
                    id: sprint.id,
                    name: sprint.name,
                    description: sprint.description,
                    goal: sprint.goal,
                    status: sprint.status,
                    startDate: sprint.startDate,
                    endDate: sprint.endDate
                  }}
                />
              )}
            </div>
          </div>
        </div>

        {/* 警告提示 */}
        {sprintWarning && (
          <Alert variant='destructive'>
            <AlertTriangleIcon className='h-4 w-4' />
            <AlertTitle>注意</AlertTitle>
            <AlertDescription>{sprintWarning}</AlertDescription>
          </Alert>
        )}

        {/* 主要内容区域 */}
        <div className='grid grid-cols-1 gap-6 lg:grid-cols-4'>
          {/* 左侧内容区 */}
          <div className='space-y-6 lg:col-span-3'>
            {/* 迭代统计卡片 */}
            <div className='grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4'>
              <Card>
                <CardContent className='p-4'>
                  <div className='flex items-center justify-between'>
                    <div>
                      <p className='text-muted-foreground text-sm font-medium'>
                        完成率
                      </p>
                      <p className='text-2xl font-bold'>{completionRate}%</p>
                    </div>
                    <div className='rounded-full bg-green-100 p-2 dark:bg-green-900/20'>
                      <CheckIcon className='h-4 w-4 text-green-600 dark:text-green-400' />
                    </div>
                  </div>
                  <Progress value={completionRate} className='mt-2' />
                </CardContent>
              </Card>

              <Card>
                <CardContent className='p-4'>
                  <div className='flex items-center justify-between'>
                    <div>
                      <p className='text-muted-foreground text-sm font-medium'>
                        健康度
                      </p>
                      <p className='text-2xl font-bold'>
                        {Math.round(healthScore)}%
                      </p>
                    </div>
                    <div
                      className={`rounded-full p-2 ${
                        healthScore >= 80
                          ? 'bg-green-100 dark:bg-green-900/20'
                          : healthScore >= 60
                            ? 'bg-yellow-100 dark:bg-yellow-900/20'
                            : 'bg-red-100 dark:bg-red-900/20'
                      }`}
                    >
                      <TrendingUpIcon
                        className={`h-4 w-4 ${
                          healthScore >= 80
                            ? 'text-green-600 dark:text-green-400'
                            : healthScore >= 60
                              ? 'text-yellow-600 dark:text-yellow-400'
                              : 'text-red-600 dark:text-red-400'
                        }`}
                      />
                    </div>
                  </div>
                  <Progress value={healthScore} className='mt-2' />
                </CardContent>
              </Card>

              <Card>
                <CardContent className='p-4'>
                  <div className='flex items-center justify-between'>
                    <div>
                      <p className='text-muted-foreground text-sm font-medium'>
                        总任务
                      </p>
                      <p className='text-2xl font-bold'>{totalTasks}</p>
                    </div>
                    <div className='rounded-full bg-blue-100 p-2 dark:bg-blue-900/20'>
                      <ListIcon className='h-4 w-4 text-blue-600 dark:text-blue-400' />
                    </div>
                  </div>
                  <div className='text-muted-foreground mt-2 text-xs'>
                    {completedTasks} 已完成
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className='p-4'>
                  <div className='flex items-center justify-between'>
                    <div>
                      <p className='text-muted-foreground text-sm font-medium'>
                        参与人员
                      </p>
                      <p className='text-2xl font-bold'>
                        {uniqueAssignees.length}
                      </p>
                    </div>
                    <div className='rounded-full bg-purple-100 p-2 dark:bg-purple-900/20'>
                      <UserIcon className='h-4 w-4 text-purple-600 dark:text-purple-400' />
                    </div>
                  </div>
                  <div className='mt-2 flex -space-x-1'>
                    {uniqueAssignees.slice(0, 3).map((user) => (
                      <Avatar
                        key={user.id}
                        className='border-background h-5 w-5 border-2'
                      >
                        {user.image ? (
                          <AvatarImage
                            src={user.image}
                            alt={user.name || user.email}
                          />
                        ) : (
                          <AvatarFallback className='text-xs'>
                            {(user.name || user.email).charAt(0).toUpperCase()}
                          </AvatarFallback>
                        )}
                      </Avatar>
                    ))}
                    {uniqueAssignees.length > 3 && (
                      <div className='bg-muted border-background flex h-5 w-5 items-center justify-center rounded-full border-2 text-xs'>
                        +{uniqueAssignees.length - 3}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
            {/* 迭代描述 */}
            {sprint.description && (
              <Card>
                <CardHeader>
                  <CardTitle className='flex items-center gap-2'>
                    <TargetIcon className='h-5 w-5' />
                    迭代描述
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className='prose prose-sm dark:prose-invert max-w-none'>
                    <p className='leading-relaxed whitespace-pre-wrap'>
                      {sprint.description}
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* 任务列表 */}
            <Card>
              <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-4'>
                <div>
                  <CardTitle className='flex items-center gap-2'>
                    <ListIcon className='h-5 w-5' />
                    迭代任务
                    <Badge variant='secondary' className='ml-2'>
                      {totalTasks}
                    </Badge>
                  </CardTitle>
                  <CardDescription>迭代中的任务列表</CardDescription>
                </div>
                <AddTaskToSprintDialog
                  projectId={projectId}
                  sprintId={sprintId}
                  sprintName={sprint.name}
                  availableTasks={availableTasks}
                >
                  <Button variant='outline' size='sm'>
                    <PlusIcon className='mr-2 h-4 w-4' />
                    添加任务
                  </Button>
                </AddTaskToSprintDialog>
              </CardHeader>
              <CardContent>
                {sprint.tasks.length === 0 ? (
                  <div className='flex flex-col items-center justify-center py-12 text-center'>
                    <div className='bg-muted mx-auto flex h-16 w-16 items-center justify-center rounded-full'>
                      <ListIcon className='text-muted-foreground h-8 w-8' />
                    </div>
                    <h3 className='mt-4 text-lg font-semibold'>暂无任务</h3>
                    <p className='text-muted-foreground mb-4'>
                      迭代中还没有任务，开始添加第一个任务吧
                    </p>
                    <AddTaskToSprintDialog
                      projectId={projectId}
                      sprintId={sprintId}
                      sprintName={sprint.name}
                      availableTasks={availableTasks}
                    >
                      <Button>
                        <PlusIcon className='mr-2 h-4 w-4' />
                        添加任务
                      </Button>
                    </AddTaskToSprintDialog>
                  </div>
                ) : (
                  <div className='space-y-6'>
                    {Object.entries(TASK_STATUS).map(
                      ([status, { label, color }]) => {
                        const tasksWithStatus = sprint.tasks.filter(
                          (task) => task.status === status
                        );
                        if (tasksWithStatus.length === 0) return null;

                        return (
                          <div key={status} className='space-y-3'>
                            <div className='flex items-center gap-2 border-b pb-2'>
                              <div
                                className={`h-3 w-3 rounded-full bg-${color}-500`}
                              />
                              <h3 className='text-lg font-semibold'>{label}</h3>
                              <Badge variant='secondary' className='ml-auto'>
                                {tasksWithStatus.length}
                              </Badge>
                            </div>

                            <div className='grid gap-3'>
                              {tasksWithStatus.map((task) => (
                                <div
                                  key={task.id}
                                  className='group bg-card hover:bg-muted/50 rounded-lg border p-4 transition-colors'
                                >
                                  <div className='flex items-start justify-between gap-4'>
                                    <div className='min-w-0 flex-1'>
                                      <div className='mb-2 flex items-center gap-2'>
                                        <Badge
                                          variant='outline'
                                          className={`bg-${TASK_PRIORITY[task.priority as keyof typeof TASK_PRIORITY].color}-50 text-${TASK_PRIORITY[task.priority as keyof typeof TASK_PRIORITY].color}-700 border-${TASK_PRIORITY[task.priority as keyof typeof TASK_PRIORITY].color}-200 dark:bg-${TASK_PRIORITY[task.priority as keyof typeof TASK_PRIORITY].color}-900/20`}
                                        >
                                          {
                                            TASK_PRIORITY[
                                              task.priority as keyof typeof TASK_PRIORITY
                                            ].label
                                          }
                                        </Badge>
                                        {task.estimatedHours && (
                                          <Badge
                                            variant='secondary'
                                            className='text-xs'
                                          >
                                            {task.estimatedHours}h
                                          </Badge>
                                        )}
                                      </div>
                                      <Link
                                        href={`/dashboard/projects/${projectId}/tasks/${task.id}`}
                                        className='text-foreground hover:text-primary line-clamp-2 font-medium transition-colors'
                                      >
                                        {task.title}
                                      </Link>
                                      {task.description && (
                                        <p className='text-muted-foreground mt-1 line-clamp-2 text-sm'>
                                          {task.description}
                                        </p>
                                      )}
                                    </div>

                                    <div className='flex flex-col items-end gap-2'>
                                      {task.assignments.length > 0 && (
                                        <TooltipProvider>
                                          <Tooltip>
                                            <TooltipTrigger asChild>
                                              <div className='flex items-center gap-1'>
                                                <Avatar className='h-6 w-6'>
                                                  {task.assignments[0].member
                                                    .user.image ? (
                                                    <AvatarImage
                                                      src={
                                                        task.assignments[0]
                                                          .member.user.image
                                                      }
                                                      alt={
                                                        task.assignments[0]
                                                          .member.user.name ||
                                                        task.assignments[0]
                                                          .member.user.email
                                                      }
                                                    />
                                                  ) : (
                                                    <AvatarFallback className='text-xs'>
                                                      {(
                                                        task.assignments[0]
                                                          .member.user.name ||
                                                        task.assignments[0]
                                                          .member.user.email
                                                      )
                                                        .charAt(0)
                                                        .toUpperCase()}
                                                    </AvatarFallback>
                                                  )}
                                                </Avatar>
                                              </div>
                                            </TooltipTrigger>
                                            <TooltipContent>
                                              <p>
                                                {task.assignments[0].member.user
                                                  .name ||
                                                  task.assignments[0].member
                                                    .user.email}
                                              </p>
                                            </TooltipContent>
                                          </Tooltip>
                                        </TooltipProvider>
                                      )}
                                      {task.dueDate && (
                                        <div
                                          className={`flex items-center gap-1 text-xs ${
                                            new Date(task.dueDate) < today
                                              ? 'text-red-500'
                                              : new Date(
                                                    task.dueDate
                                                  ).getTime() -
                                                    today.getTime() <=
                                                  3 * 24 * 60 * 60 * 1000
                                                ? 'text-orange-500'
                                                : 'text-muted-foreground'
                                          }`}
                                        >
                                          <CalendarIcon className='h-3 w-3' />
                                          {format(
                                            new Date(task.dueDate),
                                            'MM/dd'
                                          )}
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        );
                      }
                    )}
                  </div>
                )}

                <div className='mt-6 border-t pt-4'>
                  <Button variant='outline' className='w-full' asChild>
                    <Link
                      href={`/dashboard/projects/${projectId}/tasks?sprintId=${sprintId}`}
                    >
                      查看所有任务
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* 右侧边栏 */}
          <div className='space-y-6'>
            {/* 迭代进度 */}
            <Card>
              <CardHeader>
                <CardTitle className='flex items-center gap-2'>
                  <TrendingUpIcon className='h-5 w-5' />
                  迭代进度
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className='space-y-4'>
                  <div>
                    <div className='mb-2 flex justify-between'>
                      <span className='text-sm font-medium'>完成进度</span>
                      <span className='text-primary text-sm font-bold'>
                        {completionRate}%
                      </span>
                    </div>
                    <Progress value={completionRate} className='h-3' />
                    <div className='text-muted-foreground mt-1 text-xs'>
                      {completedTasks} / {totalTasks} 已完成
                    </div>
                  </div>

                  <Separator />

                  <div className='grid grid-cols-2 gap-4'>
                    <div className='bg-muted/50 flex flex-col items-center rounded-lg p-3'>
                      <span className='text-muted-foreground mb-1 text-xs'>
                        待处理
                      </span>
                      <span className='text-lg font-bold text-gray-600'>
                        {tasksByStatus['TODO'] || 0}
                      </span>
                    </div>
                    <div className='flex flex-col items-center rounded-lg bg-blue-50 p-3 dark:bg-blue-900/20'>
                      <span className='mb-1 text-xs text-blue-600 dark:text-blue-400'>
                        进行中
                      </span>
                      <span className='text-lg font-bold text-blue-600 dark:text-blue-400'>
                        {tasksByStatus['IN_PROGRESS'] || 0}
                      </span>
                    </div>
                    <div className='flex flex-col items-center rounded-lg bg-yellow-50 p-3 dark:bg-yellow-900/20'>
                      <span className='mb-1 text-xs text-yellow-600 dark:text-yellow-400'>
                        审核中
                      </span>
                      <span className='text-lg font-bold text-yellow-600 dark:text-yellow-400'>
                        {tasksByStatus['REVIEW'] || 0}
                      </span>
                    </div>
                    <div className='flex flex-col items-center rounded-lg bg-green-50 p-3 dark:bg-green-900/20'>
                      <span className='mb-1 text-xs text-green-600 dark:text-green-400'>
                        已完成
                      </span>
                      <span className='text-lg font-bold text-green-600 dark:text-green-400'>
                        {tasksByStatus['DONE'] || 0}
                      </span>
                    </div>
                  </div>

                  {blockedTasks > 0 && (
                    <div className='flex items-center justify-between rounded-lg bg-red-50 p-3 dark:bg-red-900/20'>
                      <span className='text-sm font-medium text-red-600 dark:text-red-400'>
                        被阻塞任务
                      </span>
                      <span className='text-lg font-bold text-red-600 dark:text-red-400'>
                        {blockedTasks}
                      </span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* 迭代操作 */}
            <Card>
              <CardHeader>
                <CardTitle className='flex items-center gap-2'>
                  <Edit2Icon className='h-5 w-5' />
                  迭代操作
                </CardTitle>
              </CardHeader>
              <CardContent className='space-y-3'>
                {sprint.status === 'PLANNED' && (
                  <SprintStatusDialog
                    projectId={projectId}
                    sprintId={sprintId}
                    sprintName={sprint.name}
                    currentStatus={sprint.status}
                    targetStatus='ACTIVE'
                  >
                    <Button className='w-full' variant='default'>
                      <Play className='mr-2 h-4 w-4' />
                      开始迭代
                    </Button>
                  </SprintStatusDialog>
                )}

                {sprint.status === 'ACTIVE' && (
                  <SprintStatusDialog
                    projectId={projectId}
                    sprintId={sprintId}
                    sprintName={sprint.name}
                    currentStatus={sprint.status}
                    targetStatus='COMPLETED'
                  >
                    <Button className='w-full' variant='default'>
                      <CheckIcon className='mr-2 h-4 w-4' />
                      完成迭代
                    </Button>
                  </SprintStatusDialog>
                )}

                {(sprint.status === 'PLANNED' ||
                  sprint.status === 'ACTIVE') && (
                  <SprintStatusDialog
                    projectId={projectId}
                    sprintId={sprintId}
                    sprintName={sprint.name}
                    currentStatus={sprint.status}
                    targetStatus='CANCELLED'
                  >
                    <Button className='w-full' variant='outline'>
                      <XIcon className='mr-2 h-4 w-4' />
                      取消迭代
                    </Button>
                  </SprintStatusDialog>
                )}

                {canDeleteSprint && sprint.tasks.length === 0 && (
                  <>
                    <Separator />
                    <div className='space-y-2'>
                      <p className='text-destructive flex items-center gap-2 text-sm font-medium'>
                        <AlertTriangleIcon className='h-4 w-4' />
                        危险操作
                      </p>
                      <DeleteSprintDialog
                        projectId={projectId}
                        sprintId={sprintId}
                        sprintName={sprint.name}
                      >
                        <Button variant='destructive' className='w-full'>
                          <AlertTriangleIcon className='mr-2 h-4 w-4' />
                          删除迭代
                        </Button>
                      </DeleteSprintDialog>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
