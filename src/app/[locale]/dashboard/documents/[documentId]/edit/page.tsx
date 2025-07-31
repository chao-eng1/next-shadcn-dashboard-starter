import { Metadata } from 'next';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { notFound } from 'next/navigation';
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

export async function generateMetadata({
  params
}: {
  params: { locale: string; documentId: string };
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'documents' });

  return {
    title: t('edit'),
    description: t('messages.updated')
  };
}

export default async function EditDocumentPage({
  params
}: {
  params: { locale: string; documentId: string };
}) {
  const { locale, documentId } = await params;
  const t = await getTranslations({ locale, namespace: 'documents' });
  const tCommon = await getTranslations({ locale, namespace: 'common' });

  const user = await getCurrentUser();

  if (!user) {
    redirect('/auth/sign-in');
  }

  // 检查用户是否有编辑文档的权限
  const canEditDocument = await hasPermission(user.id, 'document.update');

  if (!canEditDocument) {
    redirect('/dashboard/documents');
  }

  // 获取文档详情
  const document = await prisma.document.findUnique({
    where: {
      id: documentId,
      projectId: null,
      authorId: user.id // 使用authorId而不是createdById，确保只能编辑自己的个人文档
    }
  });

  if (!document) {
    notFound();
  }

  // 获取用户的文件夹
  const folders = await prisma.documentFolder.findMany({
    where: {
      ownerId: user.id,
      type: 'PERSONAL'
    },
    select: {
      id: true,
      name: true
    },
    orderBy: {
      name: 'asc'
    }
  });

  const returnTo = `/dashboard/documents/${documentId}`;

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
            <Heading title={t('edit')} description={document.title} />
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
              documentId={documentId}
              folders={folders}
              type='PERSONAL'
              document={document}
              returnTo={returnTo}
            />
          </CardContent>
        </Card>
      </div>
    </PageContainer>
  );
}
