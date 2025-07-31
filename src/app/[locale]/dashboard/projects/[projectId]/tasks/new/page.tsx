import { redirect } from 'next/navigation';
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
import { Heading } from '@/components/ui/heading';
import { Separator } from '@/components/ui/separator';
import PageContainer from '@/components/layout/page-container';

import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/get-current-user';
import { hasProjectPermission } from '@/lib/permissions';
import { ArrowLeftIcon } from 'lucide-react';
import { TaskForm } from '@/features/project-management/components/task/task-form';

interface NewTaskPageProps {
  params: {
    locale: string;
    projectId: string;
  };
  searchParams: {
    parentTaskId?: string;
    sprintId?: string;
    returnTo?: string;
  };
}

export async function generateMetadata({ params }: NewTaskPageProps) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'tasks' });

  return {
    title: t('create'),
    description: t('create')
  };
}

export default async function NewTaskPage({
  params,
  searchParams
}: NewTaskPageProps) {
  const { locale, projectId } = await params;
  const { parentTaskId, sprintId, returnTo } = await searchParams;
  const t = await getTranslations({ locale, namespace: 'tasks' });
  const commonT = await getTranslations({ locale, namespace: 'common' });
  const projectT = await getTranslations({ locale, namespace: 'projects' });
  const user = await getCurrentUser();

  if (!user) {
    redirect('/auth/sign-in');
  }

  // 检查用户是否有创建任务的权限
  const hasPermission = await hasProjectPermission(
    projectId,
    'task.create',
    user.id
  );

  if (!hasPermission) {
    redirect(`/dashboard/projects/${projectId}/tasks`);
  }

  // 获取项目详情
  const project = await prisma.project.findUnique({
    where: { id: projectId }
  });

  if (!project) {
    redirect('/dashboard/projects');
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

  // 获取项目的任务列表，用于选择父任务
  const tasks = await prisma.task.findMany({
    where: { projectId },
    select: {
      id: true,
      title: true
    }
  });

  // 如果提供了parentTaskId，验证其有效性
  let validParentTaskId = undefined;
  if (parentTaskId) {
    const parentTask = await prisma.task.findFirst({
      where: {
        id: parentTaskId,
        projectId
      }
    });

    if (parentTask) {
      validParentTaskId = parentTaskId;
    }
  }

  return (
    <PageContainer>
      <div className='mx-auto flex w-full max-w-7xl flex-1 flex-col space-y-6 px-4 md:px-6 lg:px-8'>
        <div className='flex items-center gap-2'>
          <Button variant='ghost' size='sm' asChild>
            <Link href={`/dashboard/projects/${projectId}/tasks`}>
              <ArrowLeftIcon className='mr-2 h-4 w-4' />
              {commonT('back')}
            </Link>
          </Button>
          {/* <Heading
            title='Create New Task'
            description={`Create a new task for project "${project.name}"`}
          /> */}
        </div>
        <Separator />

        <Card className='shadow-sm'>
          <CardHeader className='pb-6'>
            <CardTitle className='text-2xl'>{t('create')}</CardTitle>
            <CardDescription>
              {projectT('form.name')} "{project.name}" {t('create')}
            </CardDescription>
          </CardHeader>
          <CardContent className='px-6 py-6'>
            <TaskForm
              projectId={projectId}
              sprints={sprints}
              tasks={tasks}
              parentTaskId={validParentTaskId}
              returnTo={returnTo}
            />
          </CardContent>
        </Card>
      </div>
    </PageContainer>
  );
}
