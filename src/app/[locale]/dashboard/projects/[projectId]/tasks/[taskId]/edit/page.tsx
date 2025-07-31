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
import { Separator } from '@/components/ui/separator';
import { Heading } from '@/components/ui/heading';

import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/get-current-user';
import { hasProjectPermission } from '@/lib/permissions';
import { ArrowLeftIcon } from 'lucide-react';
import PageContainer from '@/components/layout/page-container';
import { TaskForm } from '@/features/project-management/components/task/task-form';

interface EditTaskPageProps {
  params: {
    locale: string;
    projectId: string;
    taskId: string;
  };
}

export async function generateMetadata({ params }: EditTaskPageProps) {
  const { locale, taskId, projectId } = await params;
  const t = await getTranslations({ locale, namespace: 'tasks' });

  const task = await prisma.task.findUnique({
    where: {
      id: taskId,
      projectId: projectId
    }
  });

  if (!task) {
    return {
      title: t('messages.notFound')
    };
  }

  return {
    title: `${t('edit')} ${t('title')} - ${task.title}`,
    description: `${t('edit')} ${t('title')}: ${task.title}`
  };
}

export default async function EditTaskPage({ params }: EditTaskPageProps) {
  const { locale, projectId, taskId } = await params;
  const t = await getTranslations({ locale, namespace: 'tasks' });
  const commonT = await getTranslations({ locale, namespace: 'common' });
  const user = await getCurrentUser();

  if (!user) {
    redirect('/auth/sign-in');
  }

  // 检查用户是否有更新任务的权限
  const hasPermission = await hasProjectPermission(
    projectId,
    'task.update',
    user.id
  );

  if (!hasPermission) {
    redirect(`/dashboard/projects/${projectId}/tasks/${taskId}`);
  }

  // 获取任务详情
  const task = await prisma.task.findUnique({
    where: {
      id: taskId,
      projectId
    }
  });

  if (!task) {
    notFound();
  }

  // 获取项目的迭代列表
  const sprints = await prisma.sprint.findMany({
    where: { projectId },
    orderBy: { startDate: 'desc' },
    select: {
      id: true,
      name: true,
      status: true
    }
  });

  // 获取项目的顶级任务，用于选择父任务
  const tasks = await prisma.task.findMany({
    where: {
      projectId,
      // 排除当前任务的子任务，防止循环引用
      NOT: {
        OR: [{ id: taskId }, { parentTaskId: taskId }]
      }
    },
    select: {
      id: true,
      title: true
    }
  });

  return (
    <PageContainer>
      <div className='mx-auto flex w-full max-w-7xl flex-1 flex-col space-y-6 px-4 md:px-6 lg:px-8'>
        <div className='flex items-center gap-2'>
          <Button variant='ghost' size='sm' asChild>
            <Link href={`/dashboard/projects/${projectId}/tasks/${taskId}`}>
              <ArrowLeftIcon className='mr-2 h-4 w-4' />
              {commonT('back')} {t('details')}
            </Link>
          </Button>
          <Heading
            title={t('edit')}
            description={`${t('edit')} ${t('details')}`}
          />
        </div>
        <Separator />

        <Card className='shadow-sm'>
          <CardHeader className='pb-6'>
            <CardTitle className='text-2xl'>
              {t('edit')} {t('title')}
            </CardTitle>
            <CardDescription>
              {commonT('update')} {t('details')}
            </CardDescription>
          </CardHeader>
          <CardContent className='px-6 py-6'>
            <TaskForm
              projectId={projectId}
              sprints={sprints}
              tasks={tasks}
              task={task}
            />
          </CardContent>
        </Card>
      </div>
    </PageContainer>
  );
}
