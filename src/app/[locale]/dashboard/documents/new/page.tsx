import { Metadata } from 'next';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { getTranslations } from 'next-intl/server';

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
import { DocumentForm } from '@/features/document-management/components/document-form';

import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/get-current-user';
import { hasPermission } from '@/lib/permissions';
import { ArrowLeftIcon } from 'lucide-react';
import { ProjectStatus } from '@prisma/client';

export async function generateMetadata({
  params
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'documents' });

  return {
    title: t('create'),
    description: t('messages.created')
  };
}

export default async function NewDocumentPage({
  params,
  searchParams
}: {
  params: Promise<{ locale: string }>;
  searchParams: { returnTo?: string; type?: string };
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'documents' });
  const tCommon = await getTranslations({ locale, namespace: 'common' });
  const tProjects = await getTranslations({ locale, namespace: 'projects' });

  const user = await getCurrentUser();
  const documentType = searchParams.type === 'project' ? 'PROJECT' : 'PERSONAL';

  if (!user) {
    redirect('/auth/sign-in');
  }

  // 检查用户是否有创建文档的权限
  const canCreateDocument = await hasPermission(user.id, 'document.create');

  if (!canCreateDocument) {
    redirect('/dashboard/documents');
  }

  // 获取用户的文件夹，根据文档类型获取不同的文件夹
  const folders = await prisma.documentFolder.findMany({
    where: {
      ownerId: user.id,
      type: documentType
    },
    select: {
      id: true,
      name: true
    },
    orderBy: {
      name: 'asc'
    }
  });

  // 获取用户的项目列表（仅项目文档需要）
  const projects =
    documentType === 'PROJECT'
      ? await prisma.project.findMany({
          where: {
            OR: [
              { ownerId: user.id },
              { members: { some: { userId: user.id } } }
            ],
            status: { not: 'ARCHIVED' as ProjectStatus }
          },
          select: {
            id: true,
            name: true,
            status: true
          },
          orderBy: {
            updatedAt: 'desc'
          }
        })
      : [];

  const returnTo = searchParams.returnTo || '/dashboard/documents';

  return (
    <PageContainer>
      <div className='mx-auto flex w-full max-w-5xl flex-1 flex-col space-y-6 px-4 md:px-6 lg:px-8'>
        <div className='flex items-center justify-between'>
          <div className='flex items-center gap-2'>
            <Button variant='ghost' size='sm' asChild>
              <Link href={returnTo}>
                <ArrowLeftIcon className='mr-2 h-4 w-4' />
                {tCommon('back')}
              </Link>
            </Button>
            <Heading
              title={t('create')}
              description={
                documentType === 'PROJECT'
                  ? tProjects('form.description') + ' - ' + t('title')
                  : t('form.placeholder.content')
              }
            />
          </div>
        </div>
        <Separator />

        <Card className='shadow-sm'>
          <CardHeader className='pb-6'>
            <CardTitle className='text-xl'>{t('form.title')}</CardTitle>
            <CardDescription>{t('form.placeholder.title')}</CardDescription>
          </CardHeader>
          <CardContent className='px-6 py-6'>
            <DocumentForm
              folders={folders}
              type={documentType}
              returnTo={returnTo}
              projects={documentType === 'PROJECT' ? projects : []}
              enableAttachmentCreation={true}
              showProjectSelector={documentType === 'PROJECT'}
            />
          </CardContent>
        </Card>
      </div>
    </PageContainer>
  );
}
