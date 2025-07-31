import { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Heading } from '@/components/ui/heading';
import { Separator } from '@/components/ui/separator';
import PageContainer from '@/components/layout/page-container';
import { TaskContainer } from '@/features/project-management/components/task/task-container';

import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/get-current-user';
import { hasPermission } from '@/lib/permissions';
import { PlusIcon } from 'lucide-react';
import { getTranslations } from 'next-intl/server';

export async function generateMetadata({
  params
}: {
  params: { projectId: string };
}): Promise<Metadata> {
  const { projectId } = await params;
  const t = await getTranslations('tasks');
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: { name: true }
  });

  return {
    title: `${project?.name || t('title')} - ${t('title')}管理`,
    description: `查看和管理 ${project?.name || t('title')} 中的${t('title')}`
  };
}

export default async function ProjectTasksPage({
  params
}: {
  params: { projectId: string };
}) {
  const user = await getCurrentUser();

  if (!user) {
    redirect('/auth/sign-in');
  }

  // 检查用户是否有查看任务的权限
  const canViewTasks = await hasPermission(user.id, 'task.view');

  if (!canViewTasks) {
    redirect('/dashboard');
  }

  const { projectId } = await params;

  // 验证用户是否是项目成员
  const projectMember = await prisma.projectMember.findFirst({
    where: {
      projectId: projectId,
      userId: user.id
    }
  });

  if (!projectMember) {
    redirect('/dashboard/projects');
  }

  // 获取当前项目信息
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: {
      id: true,
      name: true,
      status: true
    }
  });

  if (!project) {
    redirect('/dashboard/projects');
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

  // 获取当前项目的迭代
  const sprints = await prisma.sprint.findMany({
    where: {
      projectId: params.projectId
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
