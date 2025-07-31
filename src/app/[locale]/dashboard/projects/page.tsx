import { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { ProjectList } from '@/features/project-management/components/project-list';
import { CreateProjectDialog } from '@/features/project-management/components/create-project-dialog';
import { getCurrentUser } from '@/lib/get-current-user';
import { hasPermission } from '@/lib/permissions';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import { PlusIcon } from 'lucide-react';
import { Heading } from '@/components/ui/heading';
import { Separator } from '@/components/ui/separator';
import PageContainer from '@/components/layout/page-container';
import { getTranslations } from 'next-intl/server';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('projects');

  return {
    title: t('list'),
    description: t('title')
  };
}

export default async function ProjectsPage() {
  // 获取当前用户
  const user = await getCurrentUser();

  // 如果用户未登录，重定向到登录页面
  if (!user) {
    redirect('/auth/sign-in');
  }

  // 检查用户是否有查看项目的权限
  const canViewProjects = await hasPermission(user.id, 'project.view');
  const canCreateProject = await hasPermission(user.id, 'project.create');

  // 如果用户无权查看项目，重定向到仪表盘
  if (!canViewProjects) {
    redirect('/dashboard');
  }

  return (
    <PageContainer>
      <div className='mx-auto flex w-full max-w-7xl flex-1 flex-col space-y-6 px-4 md:px-6 lg:px-8'>
        {/* <Separator /> */}

        <Card className='shadow-sm'>
          <CardHeader className='flex flex-row items-center justify-between'>
            {canCreateProject && <CreateProjectDialog userId={user.id} />}
          </CardHeader>
          <CardContent className='px-6'>
            <ProjectList userId={user.id} />
          </CardContent>
        </Card>
      </div>
    </PageContainer>
  );
}
