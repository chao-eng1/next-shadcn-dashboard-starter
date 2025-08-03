import { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';
import Link from 'next/link';
import { Suspense } from 'react';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Heading } from '@/components/ui/heading';
import PageContainer from '@/components/layout/page-container';
import { ProjectPermissionGate } from '@/components/project-permission-gate';
import { RequirementList } from '@/features/requirement-management/components/requirement-list';
import { RequirementKanban } from '@/features/requirement-management/components/requirement-kanban';
import { RequirementTree } from '@/features/requirement-management/components/requirement-tree';

import { format } from 'date-fns';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/get-current-user';
import { hasProjectPermission } from '@/lib/permissions';
import {
  canViewRequirements,
  canCreateRequirement,
  canEditRequirement,
  canDeleteRequirement
} from '@/features/requirement-management/utils/requirement-permissions';
import {
  ArrowLeftIcon,
  PlusIcon,
  ListIcon,
  KanbanIcon,
  TreePineIcon,
  BarChart3Icon,
  FilterIcon,
  SearchIcon
} from 'lucide-react';
import { getTranslations } from 'next-intl/server';

interface RequirementsPageProps {
  params: {
    projectId: string;
  };
  searchParams: {
    view?: 'list' | 'kanban' | 'tree';
    status?: string;
    priority?: string;
    assignee?: string;
    search?: string;
  };
}

export async function generateMetadata({
  params
}: RequirementsPageProps): Promise<Metadata> {
  const { projectId } = await params;

  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: { name: true }
  });

  return {
    title: `需求管理 - ${project?.name || '项目'}`,
    description: '管理项目需求，跟踪需求状态和进度'
  };
}

export default async function RequirementsPage({
  params,
  searchParams
}: RequirementsPageProps) {
  const user = await getCurrentUser();
  const t = await getTranslations('requirements');
  const tc = await getTranslations('common');
  const tnav = await getTranslations('navigation');
  const tproject = await getTranslations('projects');

  if (!user) {
    redirect('/auth/sign-in');
  }

  const { projectId } = await params;
  const {
    view = 'list',
    status,
    priority,
    assignee,
    search
  } = await searchParams;

  // 检查用户是否有查看需求的权限
  const hasViewPermission = await canViewRequirements(projectId, user.id);

  if (!hasViewPermission) {
    redirect('/dashboard/projects');
  }

  // 获取项目详情
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: {
      id: true,
      name: true,
      description: true,
      status: true
    }
  });

  if (!project) {
    notFound();
  }

  // 检查用户的权限
  const canCreate = await canCreateRequirement(projectId, user.id);

  // 对于编辑和删除权限，我们需要在组件中针对具体需求进行检查
  // 这里先检查基础的项目权限
  const canEdit = await hasProjectPermission(
    projectId,
    'project.view',
    user.id
  );

  const canDelete = await hasProjectPermission(
    projectId,
    'project.view',
    user.id
  );

  // 获取需求统计
  const requirementStats = await prisma.requirement.groupBy({
    by: ['status'],
    where: {
      projectId
    },
    _count: {
      id: true
    }
  });

  // 转换统计数据
  const statsByStatus = requirementStats.reduce(
    (acc, stat) => {
      acc[stat.status] = stat._count.id;
      return acc;
    },
    {} as Record<string, number>
  );

  const totalRequirements = Object.values(statsByStatus).reduce(
    (sum, count) => sum + count,
    0
  );
  const completedRequirements = statsByStatus.COMPLETED || 0;
  const completionRate =
    totalRequirements > 0
      ? Math.round((completedRequirements / totalRequirements) * 100)
      : 0;

  // 获取优先级统计
  const priorityStats = await prisma.requirement.groupBy({
    by: ['priority'],
    where: {
      projectId
    },
    _count: {
      id: true
    }
  });

  const statsByPriority = priorityStats.reduce(
    (acc, stat) => {
      acc[stat.priority] = stat._count.id;
      return acc;
    },
    {} as Record<string, number>
  );

  // 获取需求列表数据
  const requirements = await prisma.requirement.findMany({
    where: {
      projectId
    },
    include: {
      createdBy: {
        select: {
          id: true,
          name: true,
          email: true,
          image: true
        }
      },
      assignedTo: {
        select: {
          id: true,
          name: true,
          email: true,
          image: true
        }
      },
      parent: {
        select: {
          id: true,
          requirementId: true,
          title: true
        }
      },
      children: {
        select: {
          id: true,
          requirementId: true,
          title: true,
          status: true
        }
      },
      tags: {
        include: {
          tag: true
        }
      },
      _count: {
        select: {
          comments: true,
          attachments: true,
          tasks: true,
          children: true
        }
      }
    },
    orderBy: {
      createdAt: 'desc'
    }
  });

  return (
    <PageContainer>
      <div className='mx-auto flex w-full max-w-7xl flex-1 flex-col space-y-6 px-4 md:px-6 lg:px-8'>
        {/* 面包屑导航 */}
        <div className='flex flex-col gap-2'>
          <div className='flex items-center gap-2'>
            <Button variant='ghost' size='sm' asChild>
              <Link href={`/dashboard/projects/${projectId}`}>
                <ArrowLeftIcon className='mr-2 h-4 w-4' />
                {project.name}
              </Link>
            </Button>
          </div>
        </div>

        {/* 页面标题和操作 */}
        <div className='flex flex-col justify-between gap-4 md:flex-row md:items-center'>
          <div>
            <h1 className='text-3xl font-bold tracking-tight'>{t('title')}</h1>
            <p className='text-muted-foreground mt-1'>{t('description')}</p>
          </div>

          <div className='flex flex-wrap items-center gap-2'>
            {canCreate && (
              <Button asChild>
                <Link
                  href={`/dashboard/projects/${projectId}/requirements/new`}
                >
                  <PlusIcon className='mr-2 h-4 w-4' />
                  {t('create')}
                </Link>
              </Button>
            )}
          </div>
        </div>

        {/* 统计卡片 */}
        <div className='grid grid-cols-1 gap-4 md:grid-cols-4'>
          <Card>
            <CardHeader className='pb-2'>
              <CardTitle className='text-base'>{t('stats.total')}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className='text-2xl font-bold'>{totalRequirements}</div>
              <p className='text-muted-foreground text-xs'>
                {t('stats.totalDesc')}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className='pb-2'>
              <CardTitle className='text-base'>
                {t('stats.completed')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className='text-2xl font-bold'>
                {completedRequirements}/{totalRequirements} ({completionRate}%)
              </div>
              <p className='text-muted-foreground text-xs'>
                {t('stats.completedDesc')}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className='pb-2'>
              <CardTitle className='text-base'>
                {t('stats.highPriority')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className='text-2xl font-bold'>
                {(statsByPriority.HIGH || 0) + (statsByPriority.URGENT || 0)}
              </div>
              <p className='text-muted-foreground text-xs'>
                {t('stats.highPriorityDesc')}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className='pb-2'>
              <CardTitle className='text-base'>
                {t('stats.inProgress')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className='text-2xl font-bold'>
                {(statsByStatus.IN_PROGRESS || 0) +
                  (statsByStatus.IN_REVIEW || 0)}
              </div>
              <p className='text-muted-foreground text-xs'>
                {t('stats.inProgressDesc')}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* 主要内容区域 */}
        <Tabs defaultValue='list' value={view} className='space-y-4'>
          <div className='flex flex-col gap-4 md:flex-row md:items-center md:justify-between'>
            <TabsList>
              <TabsTrigger value='list' asChild>
                <Link
                  href={`/dashboard/projects/${projectId}/requirements?view=list`}
                >
                  <ListIcon className='mr-2 h-4 w-4' />
                  {t('views.list')}
                </Link>
              </TabsTrigger>
              <TabsTrigger value='kanban' asChild>
                <Link
                  href={`/dashboard/projects/${projectId}/requirements?view=kanban`}
                >
                  <KanbanIcon className='mr-2 h-4 w-4' />
                  {t('views.kanban')}
                </Link>
              </TabsTrigger>
              <TabsTrigger value='tree' asChild>
                <Link
                  href={`/dashboard/projects/${projectId}/requirements?view=tree`}
                >
                  <TreePineIcon className='mr-2 h-4 w-4' />
                  {t('views.tree')}
                </Link>
              </TabsTrigger>
            </TabsList>

            {/* 过滤和搜索 */}
            <div className='flex items-center gap-2'>
              <Button variant='outline' size='sm'>
                <FilterIcon className='mr-2 h-4 w-4' />
                {tc('filter')}
              </Button>
              <Button variant='outline' size='sm'>
                <SearchIcon className='mr-2 h-4 w-4' />
                {tc('search')}
              </Button>
            </div>
          </div>

          {/* 列表视图 */}
          <TabsContent value='list'>
            <Card>
              <CardHeader>
                <CardTitle>{t('views.list')}</CardTitle>
                <CardDescription>{t('views.listDesc')}</CardDescription>
              </CardHeader>
              <CardContent>
                <Suspense
                  fallback={
                    <div className='py-8 text-center'>{tc('loading')}</div>
                  }
                >
                  <RequirementList
                    projectId={projectId}
                    requirements={requirements}
                    canEdit={canEdit}
                    canDelete={canDelete}
                    showActions={true}
                    showFilters={true}
                    showSearch={true}
                  />
                </Suspense>
              </CardContent>
            </Card>
          </TabsContent>

          {/* 看板视图 */}
          <TabsContent value='kanban'>
            <Card>
              <CardHeader>
                <CardTitle>{t('views.kanban')}</CardTitle>
                <CardDescription>{t('views.kanbanDesc')}</CardDescription>
              </CardHeader>
              <CardContent>
                <Suspense
                  fallback={
                    <div className='py-8 text-center'>{tc('loading')}</div>
                  }
                >
                  <RequirementKanban
                    projectId={projectId}
                    requirements={requirements}
                    canEdit={canEdit}
                    canDelete={canDelete}
                    canDrag={canEdit}
                  />
                </Suspense>
              </CardContent>
            </Card>
          </TabsContent>

          {/* 树形视图 */}
          <TabsContent value='tree'>
            <Suspense
              fallback={<div className='py-8 text-center'>{tc('loading')}</div>}
            >
              <RequirementTree
                projectId={projectId}
                requirements={requirements}
                canEdit={canEdit}
                canDelete={canDelete}
                showActions={true}
                expandAll={false}
              />
            </Suspense>
          </TabsContent>
        </Tabs>
      </div>
    </PageContainer>
  );
}
