import { Metadata } from 'next';
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
import { KanbanContainer } from '@/features/project-management/components/task/kanban-container';

import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/get-current-user';
import { hasPermission } from '@/lib/permissions';

interface PageProps {
  params: { locale: string };
}

export async function generateMetadata({
  params
}: PageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'kanban' });

  return {
    title: t('title'),
    description: t('description')
  };
}

export default async function KanbanPage({ params }: PageProps) {
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

  // 检查用户是否有创建任务的权限
  const canCreateTask = await hasPermission(user.id, 'task.create');

  // 获取任务列表
  const tasks = await prisma.task.findMany({
    where: {
      projectId: {
        in: projects.map((p) => p.id)
      },
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

  return (
    <PageContainer>
      <div className='mx-auto flex w-full max-w-7xl flex-1 flex-col space-y-6 px-4 md:px-6 lg:px-8'>
        <Separator />

        <Card className='shadow-sm'>
          <CardContent className='px-6 py-6'>
            <KanbanContainer
              userId={user.id}
              projects={projects}
              initialTasks={tasks}
              canCreateTask={canCreateTask}
            />
          </CardContent>
        </Card>
      </div>
    </PageContainer>
  );
}
