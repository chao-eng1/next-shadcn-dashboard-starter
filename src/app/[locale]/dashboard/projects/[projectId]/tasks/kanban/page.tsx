import { notFound, redirect } from 'next/navigation';
import Link from 'next/link';
import { getTranslations } from 'next-intl/server';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import { KanbanBoard } from '@/features/project-management/components/task/kanban-board';
import { Heading } from '@/components/ui/heading';
import { Separator } from '@/components/ui/separator';
import PageContainer from '@/components/layout/page-container';

import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/get-current-user';
import { hasProjectPermission } from '@/lib/permissions';
import { ArrowLeftIcon } from 'lucide-react';

interface KanbanPageProps {
  params: {
    locale: string;
    projectId: string;
  };
}

export async function generateMetadata({ params }: KanbanPageProps) {
  const { locale, projectId } = await params;
  const t = await getTranslations({ locale, namespace: 'kanban' });
  const projectT = await getTranslations({ locale, namespace: 'projects' });

  const project = await prisma.project.findUnique({
    where: { id: projectId }
  });

  if (!project) {
    return {
      title: projectT('messages.notFound')
    };
  }

  return {
    title: `${project.name} - ${t('title')}`,
    description: `${project.name} ${projectT('title')} ${t('title')}`
  };
}

export default async function KanbanPage({ params }: KanbanPageProps) {
  const { locale, projectId } = await params;
  const t = await getTranslations({ locale, namespace: 'kanban' });
  const commonT = await getTranslations({ locale, namespace: 'common' });
  const projectT = await getTranslations({ locale, namespace: 'projects' });
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

  // 获取项目详情
  const project = await prisma.project.findUnique({
    where: { id: projectId }
  });

  if (!project) {
    notFound();
  }

  // 检查用户是否有创建任务的权限
  const canCreateTask = await hasProjectPermission(
    projectId,
    'task.create',
    user.id
  );

  // 获取项目任务
  const tasks = await prisma.task.findMany({
    where: {
      projectId,
      parentTaskId: null // 只显示顶级任务
    },
    orderBy: { updatedAt: 'desc' },
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
      },
      _count: {
        select: {
          subtasks: true,
          comments: true,
          attachments: true
        }
      }
    }
  });

  return (
    <PageContainer>
      <div className='mx-auto flex w-full max-w-7xl flex-1 flex-col space-y-6 px-4 md:px-6 lg:px-8'>
        <div className='flex flex-col justify-between gap-4 md:flex-row md:items-center'>
          <div className='flex items-center gap-2'>
            <Button variant='ghost' size='sm' asChild>
              <Link href={`/dashboard/projects/${projectId}`}>
                <ArrowLeftIcon className='mr-2 h-4 w-4' />
                {commonT('back')} {projectT('title')}
              </Link>
            </Button>
            <Heading
              title={`${project.name} - ${t('title')}`}
              description={t('dragHint')}
            />
          </div>

          <div className='flex gap-2'>
            <Button variant='outline' size='sm' asChild>
              <Link href={`/dashboard/projects/${projectId}/tasks`}>
                {commonT('view')}
              </Link>
            </Button>
          </div>
        </div>
        <Separator />

        <Card className='shadow-sm'>
          <CardHeader className='pb-6'>
            <CardTitle className='text-2xl'>{t('title')}</CardTitle>
            <CardDescription>{t('dragHint')}</CardDescription>
          </CardHeader>
          <CardContent className='px-6 py-6'>
            <KanbanBoard
              projectId={projectId}
              userId={user.id}
              initialTasks={tasks}
              canCreateTask={canCreateTask}
            />
          </CardContent>
        </Card>
      </div>
    </PageContainer>
  );
}
