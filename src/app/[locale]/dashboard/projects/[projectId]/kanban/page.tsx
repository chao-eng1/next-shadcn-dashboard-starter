import { Metadata } from 'next';
import { redirect } from 'next/navigation';

import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { KanbanBoard } from '@/features/project-management/components/task/kanban-board';
import PageContainer from '@/components/layout/page-container';

import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/get-current-user';
import { hasProjectPermission } from '@/lib/permissions';
import { getTranslations } from 'next-intl/server';

export async function generateMetadata({
  params
}: {
  params: { projectId: string };
}): Promise<Metadata> {
  const { projectId } = await params;
  const t = await getTranslations('kanban');

  return {
    title: t('title'),
    description: '项目任务看板视图'
  };
}

export default async function ProjectKanbanPage({
  params
}: {
  params: { projectId: string };
}) {
  const { projectId } = await params;
  const user = await getCurrentUser();
  const t = await getTranslations('kanban');
  const tproj = await getTranslations('projects');

  if (!user) {
    redirect('/auth/sign-in');
  }

  // 检查用户是否有查看任务的权限
  const canViewTasks = await hasProjectPermission(
    projectId,
    'task.view',
    user.id
  );

  if (!canViewTasks) {
    redirect(`/dashboard/projects/${projectId}`);
  }

  // 获取项目信息
  const project = await prisma.project.findUnique({
    where: { id: projectId }
  });

  if (!project) {
    redirect('/dashboard/projects');
  }

  // 获取任务列表
  const tasks = await prisma.task.findMany({
    where: {
      projectId,
      parentTaskId: null // 只获取顶级任务
    },
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

  // 检查用户是否有创建任务的权限
  const canCreateTask = await hasProjectPermission(
    projectId,
    'task.create',
    user.id
  );

  return (
    <PageContainer>
      <div className='mx-auto flex w-full max-w-7xl flex-1 flex-col space-y-6 px-4 md:px-6 lg:px-8'>
        <Card className='shadow-sm'>
          <CardHeader className='flex flex-wrap items-center justify-between'>
            <h2 className='text-2xl font-semibold'>
              {project.name} - {t('title')}
            </h2>
          </CardHeader>
          <CardContent className='overflow-x-auto px-6'>
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
