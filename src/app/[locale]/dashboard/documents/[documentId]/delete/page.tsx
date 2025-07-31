import { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { notFound } from 'next/navigation';
import { getTranslations } from 'next-intl/server';

import { DeleteDocumentForm } from '@/features/document-management/components/delete-document-form';
import PageContainer from '@/components/layout/page-container';
import { Heading } from '@/components/ui/heading';
import { Separator } from '@/components/ui/separator';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/get-current-user';
import { hasPermission } from '@/lib/permissions';

export async function generateMetadata({
  params
}: {
  params: { locale: string; documentId: string };
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'documents' });

  return {
    title: t('delete'),
    description: t('messages.confirmDelete')
  };
}

export default async function DeleteDocumentPage({
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

  // 检查用户是否有删除文档的权限
  const canDeleteDocument = await hasPermission(user.id, 'document.delete');

  if (!canDeleteDocument) {
    redirect('/dashboard/documents');
  }

  // 获取文档详情
  const document = await prisma.document.findUnique({
    where: {
      id: documentId,
      projectId: null,
      createdById: user.id // 确保只能删除自己的个人文档
    }
  });

  if (!document) {
    notFound();
  }

  return (
    <PageContainer>
      <div className='mx-auto flex w-full max-w-5xl flex-1 flex-col space-y-6 px-4 md:px-6 lg:px-8'>
        <Heading
          title={t('delete')}
          description={t('messages.confirmDelete')}
        />
        <Separator />

        <Card className='shadow-sm'>
          <CardHeader className='pb-6'>
            <CardTitle className='text-xl'>{tCommon('confirm')}</CardTitle>
            <CardDescription>{t('messages.confirmDelete')}</CardDescription>
          </CardHeader>
          <CardContent className='px-6 py-6'>
            <DeleteDocumentForm
              documentId={documentId}
              documentTitle={document.title}
              returnTo='/dashboard/documents'
            />
          </CardContent>
        </Card>
      </div>
    </PageContainer>
  );
}
