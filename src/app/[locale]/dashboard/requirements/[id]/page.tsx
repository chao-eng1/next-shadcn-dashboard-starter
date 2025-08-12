import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import { RequirementDetailWrapper } from '@/features/requirement-management/components/requirement-detail-wrapper';
import { RequirementComments } from '@/features/requirement-management/components/requirement-comments';
import { RequirementHistory } from '@/features/requirement-management/components/requirement-history';
import { RequirementRelations } from '@/features/requirement-management/components/requirement-relations';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft, MessageSquare, History, Link2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { prisma } from '@/lib/prisma';

interface RequirementDetailPageProps {
  params: Promise<{
    id: string;
    locale: string;
  }>;
}

export async function generateMetadata({
  params
}: RequirementDetailPageProps): Promise<Metadata> {
  const { id, locale } = await params;
  const t = await getTranslations({ locale, namespace: 'requirements' });

  const requirement = await prisma.requirement.findUnique({
    where: { id },
    select: { title: true }
  });

  if (!requirement) {
    return {
      title: t('messages.notFound')
    };
  }

  return {
    title: `${requirement.title} - ${t('view')}`,
    description: `${t('view')} ${requirement.title}`
  };
}

export default async function RequirementDetailPage({
  params
}: RequirementDetailPageProps) {
  const { id, locale } = await params;
  const t = await getTranslations({ locale, namespace: 'requirements' });
  const tCommon = await getTranslations({ locale, namespace: 'common' });

  const requirement = await prisma.requirement.findUnique({
    where: { id },
    include: {
      project: {
        select: {
          id: true,
          name: true
        }
      },
      assignedTo: {
        select: {
          id: true,
          name: true,
          email: true
        }
      },
      createdBy: {
        select: {
          id: true,
          name: true,
          email: true
        }
      },
      tags: {
        include: {
          tag: true
        }
      },
      attachments: true, // 添加附件查询
      _count: {
        select: {
          comments: true,
          versions: true,
          attachments: true
        }
      }
    }
  });

  if (!requirement) {
    notFound();
  }

  // 转换数据库数据为组件期望的格式
  const transformedRequirement: any = {
    id: requirement.id,
    title: requirement.title,
    description: requirement.description || '',
    status: requirement.status,
    priority: requirement.priority,
    type: requirement.type,
    complexity: requirement.complexity,
    // 将数据库的字段名映射为组件期望的格式
    assignee: requirement.assignedTo
      ? {
          id: requirement.assignedTo.id,
          name: requirement.assignedTo.name || requirement.assignedTo.email,
          email: requirement.assignedTo.email,
          avatar: undefined // 数据库中可能没有头像字段
        }
      : undefined,
    creator: requirement.createdBy
      ? {
          id: requirement.createdBy.id,
          name: requirement.createdBy.name || requirement.createdBy.email,
          email: requirement.createdBy.email,
          avatar: undefined
        }
      : undefined,
    // 将 businessValue 从字符串转换为数字，如果是数字则保持，如果无效则用默认值
    businessValue: requirement.businessValue
      ? typeof requirement.businessValue === 'string'
        ? parseInt(requirement.businessValue) || 5
        : requirement.businessValue
      : 5,
    // estimatedEffort 已经是 Float，直接使用
    estimatedEffort: requirement.estimatedEffort || 0,
    // 计算进度 - 如果没有实际进度字段，可以根据状态计算
    progress:
      requirement.status === 'COMPLETED'
        ? 100
        : requirement.status === 'IN_PROGRESS'
          ? 50
          : requirement.status === 'APPROVED'
            ? 25
            : 0,
    // 处理标签 - 将关联的标签对象转换为字符串数组
    tags: requirement.tags ? requirement.tags.map((t) => t.tag.name) : [],
    // 处理附件 - 转换为组件期望的格式
    attachments: requirement.attachments
      ? requirement.attachments.map((att) => ({
          id: att.id,
          name: att.filename,
          url: att.filepath,
          type: att.mimetype,
          size: att.size
        }))
      : [],
    // 处理依赖项 - 这里可能需要根据实际数据结构调整
    dependencies: [], // 暂时为空，可能需要单独查询依赖关系
    // 处理可能为 null 的字段
    acceptanceCriteria: requirement.acceptanceCriteria
      ? requirement.acceptanceCriteria
          .split('\n')
          .filter((criteria) => criteria.trim())
      : undefined,
    userStory: requirement.userStory || undefined,
    dueDate: requirement.dueDate,
    createdAt: requirement.createdAt,
    updatedAt: requirement.updatedAt
  };

  return (
    <div className='flex-1 space-y-4 p-4 pt-6 md:p-8'>
      <div className='flex items-center space-x-4'>
        <Link href='/dashboard/requirements'>
          <Button variant='ghost' size='sm'>
            <ArrowLeft className='mr-2 h-4 w-4' />
            {t('backToList')}
          </Button>
        </Link>
      </div>

      <div className='space-y-4'>
        <div>
          <h2 className='text-3xl font-bold tracking-tight'>
            {requirement.title}
          </h2>
          <p className='text-muted-foreground'>
            {t('requirementInfo')}: {requirement.id} • {t('project')}:{' '}
            {requirement.project?.name || tCommon('none')}
          </p>
        </div>

        <Tabs defaultValue='detail' className='space-y-4'>
          <TabsList>
            <TabsTrigger value='detail'>{t('details')}</TabsTrigger>
            <TabsTrigger value='relations' className='flex items-center gap-2'>
              <Link2 className='h-4 w-4' />
              {t('relationTypes.relatesTo')}
            </TabsTrigger>
            <TabsTrigger value='comments' className='flex items-center gap-2'>
              <MessageSquare className='h-4 w-4' />
              {t('comments')} ({requirement._count.comments})
            </TabsTrigger>
            <TabsTrigger value='history' className='flex items-center gap-2'>
              <History className='h-4 w-4' />
              {t('history')} ({requirement._count.versions})
            </TabsTrigger>
          </TabsList>

          <TabsContent value='detail' className='space-y-4'>
            <RequirementDetailWrapper
              projectId={requirement.project?.id || ''}
              requirementId={requirement.id}
              initialRequirement={transformedRequirement}
            />
          </TabsContent>

          <TabsContent value='relations' className='space-y-4'>
            <Card>
              <CardHeader>
                <CardTitle>{t('relationTypes.relatesTo')}</CardTitle>
                <CardDescription>{t('relationManagement')}</CardDescription>
              </CardHeader>
              <CardContent>
                <RequirementRelations requirementId={requirement.id} />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value='comments' className='space-y-4'>
            <Card>
              <CardHeader>
                <CardTitle>{t('comments')}</CardTitle>
                <CardDescription>{t('commentsDescription')}</CardDescription>
              </CardHeader>
              <CardContent>
                <RequirementComments requirementId={requirement.id} />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value='history' className='space-y-4'>
            <Card>
              <CardHeader>
                <CardTitle>{t('history')}</CardTitle>
                <CardDescription>{t('historyDescription')}</CardDescription>
              </CardHeader>
              <CardContent>
                <RequirementHistory requirementId={requirement.id} />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
