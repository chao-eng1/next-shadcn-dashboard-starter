import { Metadata } from 'next';
import { redirect } from 'next/navigation';
import Link from 'next/link';

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
import { SprintForm } from '@/features/project-management/components/sprint/sprint-form';

interface NewSprintPageProps {
  params: {
    projectId: string;
  };
}

export const metadata: Metadata = {
  title: '新建迭代',
  description: '创建新迭代'
};

export default async function NewSprintPage({ params }: NewSprintPageProps) {
  const user = await getCurrentUser();

  if (!user) {
    redirect('/auth/sign-in');
  }

  const { projectId } = await params;

  // 检查用户是否有创建迭代的权限
  const hasPermission = await hasProjectPermission(
    projectId,
    'sprint.create',
    user.id
  );

  if (!hasPermission) {
    redirect(`/dashboard/projects/${projectId}/sprints`);
  }

  // 获取项目详情
  const project = await prisma.project.findUnique({
    where: { id: projectId }
  });

  if (!project) {
    redirect('/dashboard/projects');
  }

  return (
    <PageContainer>
      <div className='mx-auto flex w-full max-w-7xl flex-1 flex-col space-y-6 px-4 md:px-6 lg:px-8'>
        <div className='flex items-center gap-2'>
          <Button variant='ghost' size='sm' asChild>
            <Link href={`/dashboard/projects/${projectId}/sprints`}>
              <ArrowLeftIcon className='mr-2 h-4 w-4' />
              返回迭代列表
            </Link>
          </Button>
          <Heading
            title='新建迭代'
            description={`为项目 "${project.name}" 创建新迭代`}
          />
        </div>
        <Separator />

        <Card className='shadow-sm'>
          <CardHeader className='pb-6'>
            <CardTitle className='text-2xl'>创建新迭代</CardTitle>
            <CardDescription>
              为项目 "{project.name}" 创建新迭代
            </CardDescription>
          </CardHeader>
          <CardContent className='px-6 py-6'>
            <SprintForm projectId={projectId} />
          </CardContent>
        </Card>
      </div>
    </PageContainer>
  );
}
