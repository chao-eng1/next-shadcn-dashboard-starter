import { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';
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
import PageContainer from '@/components/layout/page-container';
import { getCurrentUser } from '@/lib/get-current-user';
import { prisma } from '@/lib/prisma';
import { ArrowLeftIcon } from 'lucide-react';
import {
  canCreateRequirement
} from '@/features/requirement-management/utils/requirement-permissions';
import { RequirementFormWrapper } from './requirement-form-wrapper';

interface NewRequirementPageProps {
  params: Promise<{
    projectId: string;
  }>;
  searchParams: Promise<{
    parentId?: string;
  }>;
}

export async function generateMetadata({
  params
}: NewRequirementPageProps): Promise<Metadata> {
  const { projectId } = await params;
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: { name: true }
  });

  return {
    title: `创建需求 - ${project?.name || '项目'}`,
    description: '创建新的项目需求'
  };
}

export default async function NewRequirementPage({
  params,
  searchParams
}: NewRequirementPageProps) {
  const user = await getCurrentUser();

  if (!user) {
    redirect('/auth/sign-in');
  }

  const { projectId } = await params;
  const { parentId } = await searchParams;

  // 检查用户是否有创建需求的权限
  const hasCreatePermission = await canCreateRequirement(projectId, user.id);

  if (!hasCreatePermission) {
    redirect(`/dashboard/projects/${projectId}`);
  }

  // 获取项目信息
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: {
      id: true,
      name: true,
      description: true
    }
  });

  if (!project) {
    notFound();
  }

  // 如果有父需求ID，获取父需求信息
  let parentRequirement = null;
  if (parentId) {
    parentRequirement = await prisma.requirement.findUnique({
      where: {
        id: parentId,
        projectId
      },
      select: {
        id: true,
        title: true,
        identifier: true
      }
    });
  }

  // 获取项目成员列表（用于分配需求）
  const projectMembers = await prisma.projectMember.findMany({
    where: { projectId },
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
  });

  // 获取项目标签
  const projectTags = await prisma.tag.findMany({
    where: {
      tasks: {
        some: {
          task: {
            projectId
          }
        }
      }
    },
    select: {
      id: true,
      name: true,
      color: true
    }
  });

  return (
    <PageContainer scrollable>
      <div className='space-y-4'>
        {/* 面包屑导航 */}
        <div className='flex items-center space-x-2'>
          <Button variant='ghost' size='sm' asChild>
            <Link href={`/dashboard/projects/${projectId}/requirements`}>
              <ArrowLeftIcon className='mr-2 h-4 w-4' />
              返回需求列表
            </Link>
          </Button>
        </div>

        {/* 页面标题 */}
        <div className='flex items-center justify-between'>
          <Heading
            title={parentRequirement ? '创建子需求' : '创建需求'}
            description={
              parentRequirement
                ? `为需求 "${parentRequirement.title}" 创建子需求`
                : `在项目 "${project.name}" 中创建新需求`
            }
          />
        </div>

        {/* 父需求信息 */}
        {parentRequirement && (
          <Card>
            <CardHeader>
              <CardTitle className='text-base'>父需求信息</CardTitle>
            </CardHeader>
            <CardContent>
              <div className='flex items-center space-x-2'>
                <span className='text-sm font-medium'>
                  {parentRequirement.identifier}
                </span>
                <span className='text-sm text-muted-foreground'>
                  {parentRequirement.title}
                </span>
              </div>
            </CardContent>
          </Card>
        )}

        {/* 需求表单 */}
        <Card>
          <CardHeader>
            <CardTitle>需求信息</CardTitle>
            <CardDescription>
              填写需求的基本信息，包括标题、描述、优先级等
            </CardDescription>
          </CardHeader>
          <CardContent>
            <RequirementFormWrapper
              projectId={projectId}
              parentId={parentId}
              projectMembers={projectMembers.map(member => ({
                id: member.user.id,
                name: member.user.name || member.user.email,
                email: member.user.email,
                image: member.user.image
              }))}
              projectTags={projectTags}
            />
          </CardContent>
        </Card>
      </div>
    </PageContainer>
  );
}