import { redirect } from 'next/navigation';
import { getTranslations } from 'next-intl/server';

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
import { TaskContainer } from '@/features/project-management/components/task/task-container';

import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/get-current-user';
import { hasPermission } from '@/lib/permissions';

interface PageProps {
  params: { locale: string };
}

export async function generateMetadata({ params }: PageProps) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'tasks' });

  return {
    title: t('title'),
    description: t('list')
  };
}

export default async function TasksPage({ params }: PageProps) {
  const user = await getCurrentUser();

  if (!user) {
    redirect('/auth/sign-in');
  }

  // 检查用户是否有查看任务的权限
  const canViewTasks = await hasPermission(user.id, 'task.view');

  if (!canViewTasks) {
    redirect('/dashboard');
  }

  // 获取所有用户有权限查看的项目
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

  // 获取所有迭代（按项目分组）
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

  // 检查用户是否有创建任务的权限
  const canCreateTask = await hasPermission(user.id, 'task.create');

  return (
    <PageContainer>
      <div className='mx-auto flex w-full max-w-7xl flex-1 flex-col space-y-6 px-4 md:px-6 lg:px-8'>
        <Separator />

        <Card className='shadow-sm'>
          <CardContent className='px-6 py-6'>
            <TaskContainer
              userId={user.id}
              projects={projects}
              sprints={sprints}
              canCreateTask={canCreateTask}
            />
          </CardContent>
        </Card>
      </div>
    </PageContainer>
  );
}
