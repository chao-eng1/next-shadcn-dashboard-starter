import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import { RequirementDetail } from '@/features/requirement-management/components/requirement-detail';
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
            <RequirementDetail requirement={requirement} />
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
