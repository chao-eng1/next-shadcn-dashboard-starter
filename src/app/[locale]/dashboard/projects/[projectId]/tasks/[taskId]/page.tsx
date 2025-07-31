import { notFound, redirect } from 'next/navigation';
import Link from 'next/link';
import { format } from 'date-fns';
import { getTranslations } from 'next-intl/server';

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
import { Heading } from '@/components/ui/heading';
import { CommentForm } from '@/features/project-management/components/comment/comment-form';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import PageContainer from '@/components/layout/page-container';
import { TaskHistoryTimeline } from '@/features/task-management/components/task-history-timeline';
import { TaskAssignmentActions } from '@/features/task-management/components/task-assignment-actions';

import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/get-current-user';
import { hasProjectPermission } from '@/lib/permissions';
import {
  ArrowLeftIcon,
  CalendarIcon,
  ClockIcon,
  Edit2Icon,
  MessageSquareIcon,
  AlertCircleIcon,
  FileIcon,
  LinkIcon,
  HistoryIcon
} from 'lucide-react';
import { TASK_STATUS, TASK_PRIORITY } from '@/constants/project';

interface TaskPageProps {
  params: {
    locale: string;
    projectId: string;
    taskId: string;
  };
}

export async function generateMetadata({ params }: TaskPageProps) {
  const { locale, projectId, taskId } = await params;
  const t = await getTranslations({ locale, namespace: 'tasks' });

  const task = await prisma.task.findUnique({
    where: {
      id: taskId,
      projectId
    }
  });

  if (!task) {
    return {
      title: t('messages.notFound')
    };
  }

  return {
    title: `${task.title} - ${t('details')}`,
    description: task.description || `${t('details')}: ${task.title}`
  };
}

export default async function TaskPage({ params }: TaskPageProps) {
  const { locale, projectId, taskId } = await params;
  const t = await getTranslations({ locale, namespace: 'tasks' });
  const commonT = await getTranslations({ locale, namespace: 'common' });
  const user = await getCurrentUser();

  if (!user) {
    redirect('/auth/sign-in');
  }

  // 检查用户是否有查看项目的权限
  const hasPermission = await hasProjectPermission(
    projectId,
    'project.view',
    user.id
  );

  if (!hasPermission) {
    redirect('/dashboard/projects');
  }

  // 获取任务详情和项目成员
  const [task, projectMembers] = await Promise.all([
    prisma.task.findUnique({
      where: {
        id: taskId,
        projectId
      },
      include: {
        project: {
          select: {
            id: true,
            name: true
          }
        },
        sprint: {
          select: {
            id: true,
            name: true,
            status: true
          }
        },
        parentTask: {
          select: {
            id: true,
            title: true
          }
        },
        subtasks: {
          select: {
            id: true,
            title: true,
            status: true,
            priority: true
          },
          orderBy: {
            createdAt: 'desc'
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
        },
        comments: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                image: true
              }
            }
          },
          orderBy: {
            createdAt: 'desc'
          }
        },
        attachments: true,
        _count: {
          select: {
            subtasks: true,
            comments: true,
            attachments: true
          }
        }
      }
    }),
    prisma.projectMember.findMany({
      where: {
        projectId
      },
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
    })
  ]);

  if (!task) {
    notFound();
  }

  // 检查用户的权限
  const canUpdateTask = await hasProjectPermission(
    projectId,
    'task.update',
    user.id
  );
  const canDeleteTask = await hasProjectPermission(
    projectId,
    'task.delete',
    user.id
  );

  return (
    <PageContainer>
      <div className='mx-auto flex w-full max-w-7xl flex-1 flex-col space-y-6 px-4 md:px-6 lg:px-8'>
        <div className='flex flex-col gap-2'>
          <div className='flex items-center gap-2'>
            <Button variant='ghost' size='sm' asChild>
              <Link href={`/dashboard/projects/${projectId}/tasks`}>
                <ArrowLeftIcon className='mr-2 h-4 w-4' />
                {commonT('back')}
              </Link>
            </Button>
            <Heading title={task.title} description={t('details')} />
          </div>
          <Separator />

          <div className='flex flex-col justify-between gap-4 md:flex-row md:items-start'>
            <div>
              <div className='flex items-center gap-2'>
                <Badge
                  variant='outline'
                  className={`bg-${TASK_STATUS[task.status].color}-100 text-${TASK_STATUS[task.status].color}-800 border-${TASK_STATUS[task.status].color}-200`}
                >
                  {TASK_STATUS[task.status].label}
                </Badge>
                <Badge
                  variant='outline'
                  className={`bg-${TASK_PRIORITY[task.priority].color}-100 text-${TASK_PRIORITY[task.priority].color}-800 border-${TASK_PRIORITY[task.priority].color}-200`}
                >
                  {TASK_PRIORITY[task.priority].label}
                </Badge>
              </div>

              {task.description && (
                <div className='text-muted-foreground mt-3 whitespace-pre-wrap'>
                  {task.description}
                </div>
              )}
            </div>

            <div className='flex items-center gap-2 self-start'>
              {canUpdateTask && (
                <Button asChild>
                  <Link
                    href={`/dashboard/projects/${projectId}/tasks/${taskId}/edit`}
                  >
                    <Edit2Icon className='mr-2 h-4 w-4' />
                    {commonT('edit')} {t('title')}
                  </Link>
                </Button>
              )}
            </div>
          </div>

          <div className='text-muted-foreground mt-2 flex flex-wrap gap-4 text-sm'>
            <div className='flex items-center'>
              <CalendarIcon className='mr-1 h-4 w-4' />
              <span>
                {task.dueDate
                  ? `${commonT('date')} ${format(new Date(task.dueDate), 'yyyy-MM-dd')}`
                  : t('filters.overdue')}
              </span>
            </div>

            {task.estimatedHours && (
              <div className='flex items-center'>
                <ClockIcon className='mr-1 h-4 w-4' />
                <span>
                  {t('form.estimatedHours')} {task.estimatedHours}{' '}
                  {commonT('time')}
                </span>
              </div>
            )}

            <div className='flex items-center'>
              <ClockIcon className='mr-1 h-4 w-4' />
              <span>
                {commonT('updated')}{' '}
                {format(new Date(task.updatedAt), 'yyyy-MM-dd HH:mm')}
              </span>
            </div>

            {task.completedAt && (
              <div className='flex items-center'>
                <ClockIcon className='mr-1 h-4 w-4' />
                <span>
                  {commonT('status')} {commonT('completed')}{' '}
                  {format(new Date(task.completedAt), 'yyyy-MM-dd HH:mm')}
                </span>
              </div>
            )}
          </div>
        </div>

        <div className='grid grid-cols-1 gap-6 md:grid-cols-3'>
          <div className='space-y-6 md:col-span-2'>
            <Card className='shadow-sm'>
              <CardContent className='px-6 py-6'>
                <Tabs defaultValue='comments' className='w-full'>
                  <TabsList>
                    <TabsTrigger value='comments'>
                      {t('comments')} ({task._count.comments})
                    </TabsTrigger>
                    <TabsTrigger value='subtasks'>
                      {t('form.placeholder.title')} ({task._count.subtasks})
                    </TabsTrigger>
                    <TabsTrigger value='attachments'>
                      {t('attachments')} ({task._count.attachments})
                    </TabsTrigger>
                    <TabsTrigger value='history'>{t('history')}</TabsTrigger>
                  </TabsList>

                  <TabsContent value='comments' className='mt-4'>
                    <Card>
                      <CardHeader>
                        <CardTitle className='text-lg'>
                          {t('comments')}
                        </CardTitle>
                        <CardDescription>{t('comments')}</CardDescription>
                      </CardHeader>
                      <CardContent>
                        {task.comments.length === 0 ? (
                          <div className='text-muted-foreground py-6 text-center'>
                            {t('messages.noComments')}
                          </div>
                        ) : (
                          <div className='space-y-4'>
                            {task.comments.map((comment) => (
                              <div
                                key={comment.id}
                                className='rounded-lg border p-4'
                              >
                                <div className='mb-2 flex items-center gap-2'>
                                  <Avatar className='h-8 w-8'>
                                    <AvatarImage
                                      src={comment.user.image || ''}
                                      alt={comment.user.name || ''}
                                    />
                                    <AvatarFallback>
                                      {comment.user.name?.charAt(0) ||
                                        comment.user.email.charAt(0)}
                                    </AvatarFallback>
                                  </Avatar>
                                  <div>
                                    <p className='text-sm font-medium'>
                                      {comment.user.name || comment.user.email}
                                    </p>
                                    <p className='text-muted-foreground text-xs'>
                                      {format(
                                        new Date(comment.createdAt),
                                        'yyyy-MM-dd HH:mm'
                                      )}
                                    </p>
                                  </div>
                                </div>
                                <div className='whitespace-pre-wrap'>
                                  {comment.content}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}

                        <div className='mt-6'>
                          <CommentForm projectId={projectId} taskId={taskId} />
                        </div>
                      </CardContent>
                    </Card>
                  </TabsContent>

                  <TabsContent value='subtasks' className='mt-4'>
                    <Card>
                      <CardHeader>
                        <CardTitle className='text-lg'>
                          {t('form.placeholder.title')}
                        </CardTitle>
                        <CardDescription>
                          {t('form.placeholder.title')}
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        {task.subtasks.length === 0 ? (
                          <div className='text-muted-foreground py-6 text-center'>
                            {t('messages.noSubtasks')}
                          </div>
                        ) : (
                          <div className='space-y-2'>
                            {task.subtasks.map((subtask) => (
                              <div
                                key={subtask.id}
                                className='flex items-center justify-between rounded-lg border p-3'
                              >
                                <div className='flex items-center gap-3'>
                                  <Badge
                                    variant='outline'
                                    className={`bg-${TASK_STATUS[subtask.status].color}-100 text-${TASK_STATUS[subtask.status].color}-800 border-${TASK_STATUS[subtask.status].color}-200`}
                                  >
                                    {TASK_STATUS[subtask.status].label}
                                  </Badge>
                                  <Link
                                    href={`/dashboard/projects/${projectId}/tasks/${subtask.id}`}
                                    className='font-medium hover:underline'
                                  >
                                    {subtask.title}
                                  </Link>
                                </div>
                                <Badge
                                  variant='outline'
                                  className={`bg-${TASK_PRIORITY[subtask.priority].color}-100 text-${TASK_PRIORITY[subtask.priority].color}-800 border-${TASK_PRIORITY[subtask.priority].color}-200`}
                                >
                                  {TASK_PRIORITY[subtask.priority].label}
                                </Badge>
                              </div>
                            ))}
                          </div>
                        )}

                        <div className='mt-6'>
                          <Button className='w-full' asChild>
                            <Link
                              href={`/dashboard/projects/${projectId}/tasks/new?parentTaskId=${taskId}`}
                            >
                              {t('create')} {t('form.placeholder.title')}
                            </Link>
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  </TabsContent>

                  <TabsContent value='attachments' className='mt-4'>
                    <Card>
                      <CardHeader>
                        <CardTitle className='text-lg'>
                          {t('attachments')}
                        </CardTitle>
                        <CardDescription>{t('attachments')}</CardDescription>
                      </CardHeader>
                      <CardContent>
                        {task.attachments.length === 0 ? (
                          <div className='text-muted-foreground py-6 text-center'>
                            {t('messages.noAttachments')}
                          </div>
                        ) : (
                          <div className='space-y-2'>
                            {task.attachments.map((attachment) => (
                              <div
                                key={attachment.id}
                                className='flex items-center justify-between rounded-lg border p-3'
                              >
                                <div className='flex items-center gap-3'>
                                  <FileIcon className='text-muted-foreground h-5 w-5' />
                                  <div>
                                    <p className='font-medium'>
                                      {attachment.name}
                                    </p>
                                    <p className='text-muted-foreground text-xs'>
                                      {commonT('upload')} {commonT('date')}{' '}
                                      {format(
                                        new Date(attachment.createdAt),
                                        'yyyy-MM-dd HH:mm'
                                      )}
                                    </p>
                                  </div>
                                </div>
                                <Button variant='outline' size='sm' asChild>
                                  <Link
                                    href={attachment.url}
                                    target='_blank'
                                    rel='noopener noreferrer'
                                  >
                                    <LinkIcon className='mr-2 h-4 w-4' />
                                    {commonT('view')}
                                  </Link>
                                </Button>
                              </div>
                            ))}
                          </div>
                        )}

                        <div className='mt-6'>
                          <Button className='w-full'>
                            {commonT('upload')} {t('attachments')}
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  </TabsContent>

                  <TabsContent value='history' className='mt-4'>
                    <Card>
                      <CardHeader>
                        <CardTitle className='text-lg'>
                          {t('title')} {t('history')}
                        </CardTitle>
                        <CardDescription>
                          {t('title')} {commonT('status')} {commonT('updated')}
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <TaskHistoryTimeline
                          projectId={projectId}
                          taskId={taskId}
                        />
                      </CardContent>
                    </Card>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </div>

          <div className='space-y-6'>
            <Card className='shadow-sm'>
              <CardHeader>
                <CardTitle className='text-lg'>
                  {t('title')} {commonT('status')} & {t('assign')}
                </CardTitle>
                <CardDescription>
                  {commonT('update')} {t('title')} {commonT('status')} 或{' '}
                  {t('assign')} {t('title')}
                </CardDescription>
              </CardHeader>
              <CardContent className='space-y-4'>
                <TaskAssignmentActions
                  projectId={projectId}
                  taskId={taskId}
                  currentStatus={task.status}
                  projectMembers={projectMembers}
                />
              </CardContent>
            </Card>

            <Card className='shadow-sm'>
              <CardHeader>
                <CardTitle className='text-lg'>
                  {commonT('description')}
                </CardTitle>
              </CardHeader>
              <CardContent className='space-y-4'>
                <div>
                  <p className='mb-1 text-sm font-medium'>{commonT('name')}</p>
                  <Link
                    href={`/dashboard/projects/${task.project.id}`}
                    className='text-muted-foreground text-sm hover:underline'
                  >
                    {task.project.name}
                  </Link>
                </div>

                {task.parentTask && (
                  <div>
                    <p className='mb-1 text-sm font-medium'>
                      {t('form.parentTask')}
                    </p>
                    <Link
                      href={`/dashboard/projects/${projectId}/tasks/${task.parentTask.id}`}
                      className='text-muted-foreground text-sm hover:underline'
                    >
                      {task.parentTask.title}
                    </Link>
                  </div>
                )}

                {task.sprint && (
                  <div>
                    <p className='mb-1 text-sm font-medium'>
                      {commonT('status')}
                    </p>
                    <Link
                      href={`/dashboard/projects/${projectId}/sprints/${task.sprint.id}`}
                      className='text-muted-foreground text-sm hover:underline'
                    >
                      {task.sprint.name}
                    </Link>
                  </div>
                )}

                <Separator />

                <div>
                  <p className='mb-2 text-sm font-medium'>
                    {t('form.assignee')}
                  </p>
                  {task.assignments.length === 0 ? (
                    <p className='text-muted-foreground text-sm'>
                      {t('unassign')}
                    </p>
                  ) : (
                    <div className='space-y-2'>
                      {task.assignments.map((assignment) => (
                        <div
                          key={assignment.id}
                          className='flex items-center gap-2'
                        >
                          <Avatar className='h-8 w-8'>
                            <AvatarImage
                              src={assignment.member.user.image || ''}
                              alt={assignment.member.user.name || ''}
                            />
                            <AvatarFallback>
                              {assignment.member.user.name?.charAt(0) ||
                                assignment.member.user.email.charAt(0)}
                            </AvatarFallback>
                          </Avatar>
                          <p className='text-sm'>
                            {assignment.member.user.name ||
                              assignment.member.user.email}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {canDeleteTask && (
                  <>
                    <Separator />

                    <div>
                      <p className='text-destructive mb-2 text-sm font-medium'>
                        {commonT('delete')} {t('title')}
                      </p>
                      <Button variant='destructive' className='w-full' asChild>
                        <Link
                          href={`/dashboard/projects/${projectId}/tasks/${taskId}/delete`}
                        >
                          <AlertCircleIcon className='mr-2 h-4 w-4' />
                          {commonT('delete')} {t('title')}
                        </Link>
                      </Button>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </PageContainer>
  );
}
