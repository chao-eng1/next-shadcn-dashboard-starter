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
import { TaskForm } from '@/features/project-management/components/task/task-form';

import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/get-current-user';
import { hasPermission } from '@/lib/permissions';
import { ArrowLeftIcon } from 'lucide-react';

interface PageProps {
  params: { locale: string };
  searchParams: { returnTo?: string };
}

export async function generateMetadata({ params }: PageProps) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'tasks' });

  return {
    title: t('create'),
    description: t('create')
  };
}

export default async function NewTaskPage({ params, searchParams }: PageProps) {
  const { locale } = await params;
  const { returnTo } = await searchParams;
  const t = await getTranslations({ locale, namespace: 'tasks' });
  const commonT = await getTranslations({ locale, namespace: 'common' });
  const user = await getCurrentUser();

  if (!user) {
    redirect('/auth/sign-in');
  }

  // 检查用户是否有创建任务的权限
  const canCreateTask = await hasPermission(user.id, 'task.create');

  if (!canCreateTask) {
    redirect('/dashboard/tasks');
  }

  // 获取用户有权限的项目
  const userProjects = await prisma.projectMember.findMany({
    where: {
      userId: user.id
    },
    include: {
      project: {
        select: {
          id: true,
          name: true,
          status: true
        }
      }
    }
  });

  const projects = userProjects.map((member) => member.project);

  // 获取所有迭代
  const sprints = await prisma.sprint.findMany({
    where: {
      projectId: {
        in: projects.map((p) => p.id)
      }
    },
    orderBy: { startDate: 'desc' },
    select: {
      id: true,
      name: true,
      status: true,
      projectId: true,
      project: {
        select: {
          name: true
        }
      }
    }
  });

  // 获取所有任务（用于设置父任务）
  const tasks = await prisma.task.findMany({
    where: {
      projectId: {
        in: projects.map((p) => p.id)
      }
    },
    select: {
      id: true,
      title: true,
      projectId: true,
      project: {
        select: {
          name: true
        }
      }
    }
  });

  // 获取每个项目的成员
  const projectMembers = await prisma.projectMember.findMany({
    where: {
      projectId: {
        in: projects.map((p) => p.id)
      }
    },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          image: true
        }
      },
      project: {
        select: {
          id: true,
          name: true
        }
      }
    }
  });

  return (
    <PageContainer>
      <div className='mx-auto flex w-full max-w-5xl flex-1 flex-col space-y-6 px-4 md:px-6 lg:px-8'>
        <div className='flex items-center gap-2'>
          <Button variant='ghost' size='sm' asChild>
            <Link href='/dashboard/tasks'>
              <ArrowLeftIcon className='mr-2 h-4 w-4' />
              {commonT('back')}
            </Link>
          </Button>
          {/* Heading removed - CardTitle now shows the create task title */}
        </div>
        <Separator />

        <Card className='shadow-sm'>
          <CardHeader className='pb-6'>
            <CardTitle className='text-xl'>{t('details')}</CardTitle>
            <CardDescription>
              {t('form.placeholder.description')}
            </CardDescription>
          </CardHeader>
          <CardContent className='px-6 py-6'>
            <TaskForm
              projects={projects}
              sprints={sprints}
              tasks={tasks}
              projectMembers={projectMembers}
              currentUserId={user.id}
              returnTo={returnTo}
            />
          </CardContent>
        </Card>
      </div>
    </PageContainer>
  );
}
