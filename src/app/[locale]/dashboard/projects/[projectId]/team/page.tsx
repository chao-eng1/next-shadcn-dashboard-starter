import { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';
import Link from 'next/link';

import { Button } from '@/components/ui/button';
import { Heading } from '@/components/ui/heading';
import PageContainer from '@/components/layout/page-container';
import { MembersAndInvitations } from '@/features/project-management/components/invitations/members-and-invitations';

import { ArrowLeftIcon } from 'lucide-react';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/get-current-user';
import { hasProjectPermission } from '@/lib/permissions';
import { getTranslations } from 'next-intl/server';

interface ProjectTeamPageProps {
  params: {
    projectId: string;
  };
}

export async function generateMetadata({
  params
}: ProjectTeamPageProps): Promise<Metadata> {
  const { projectId } = await params;
  const t = await getTranslations('projects');

  const project = await prisma.project.findUnique({
    where: { id: projectId }
  });

  if (!project) {
    return {
      title: t('messages.notFound')
    };
  }

  return {
    title: `${project.name} - ${t('team.title')}`,
    description: `管理 ${project.name} 的${t('team.title')}和邀请`
  };
}

export default async function ProjectTeamPage({
  params
}: ProjectTeamPageProps) {
  const user = await getCurrentUser();
  const t = await getTranslations('projects');

  if (!user) {
    redirect('/auth/sign-in');
  }

  const { projectId } = await params;

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
    where: { id: projectId },
    include: {
      owner: {
        select: {
          id: true,
          name: true,
          email: true,
          image: true
        }
      }
    }
  });

  if (!project) {
    notFound();
  }

  // 检查用户是否是项目所有者
  const isOwner = project.ownerId === user.id;

  // 检查用户是否有管理项目成员的权限
  const canManageMembers = await hasProjectPermission(
    projectId,
    'project.members.manage',
    user.id
  );

  return (
    <PageContainer>
      <div className='mx-auto flex w-full max-w-7xl flex-1 flex-col space-y-6 px-4 md:px-6 lg:px-8'>
        <div className='flex flex-col gap-2'>
          <div className='flex items-center gap-2'>
            <Button variant='ghost' size='sm' asChild>
              <Link href={`/dashboard/projects/${projectId}`}>
                <ArrowLeftIcon className='mr-2 h-4 w-4' />
                返回项目详情
              </Link>
            </Button>
          </div>

          <div className='flex flex-col justify-between gap-4 md:flex-row md:items-center'>
            <div>
              <Heading
                title={t('team.title')}
                description={`管理 ${project.name} 的成员和邀请`}
              />
            </div>
          </div>
        </div>

        <MembersAndInvitations
          projectId={projectId}
          userId={user.id}
          isOwner={isOwner}
          hasManagePermission={canManageMembers}
        />
      </div>
    </PageContainer>
  );
}
