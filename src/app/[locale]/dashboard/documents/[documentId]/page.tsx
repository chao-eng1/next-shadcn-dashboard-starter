import { Metadata } from 'next';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { format } from 'date-fns';
import ReactMarkdown from 'react-markdown';
import { getTranslations } from 'next-intl/server';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Heading } from '@/components/ui/heading';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import PageContainer from '@/components/layout/page-container';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/get-current-user';
import { hasPermission } from '@/lib/permissions';
import { ArrowLeftIcon, FileIcon, Edit, Download, Trash2 } from 'lucide-react';

export async function generateMetadata({
  params
}: {
  params: Promise<{ locale: string; documentId: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'documents' });

  return {
    title: t('view'),
    description: t('messages.created')
  };
}

export default async function DocumentPage({
  params
}: {
  params: Promise<{ locale: string; documentId: string }>;
}) {
  const { locale, documentId } = await params;
  const t = await getTranslations({ locale, namespace: 'documents' });
  const tCommon = await getTranslations({ locale, namespace: 'common' });

  // 文档状态映射
  const statusMap = {
    DRAFT: { label: t('status.draft'), variant: 'outline' },
    REVIEW: { label: t('status.review'), variant: 'secondary' },
    PUBLISHED: { label: t('status.published'), variant: 'default' },
    ARCHIVED: { label: t('status.archived'), variant: 'destructive' }
  };

  const user = await getCurrentUser();

  if (!user) {
    redirect('/auth/sign-in');
  }

  // 检查用户是否有查看文档的权限
  const canViewDocument = await hasPermission(user.id, 'document.view');

  if (!canViewDocument) {
    redirect('/dashboard/documents');
  }

  // 获取文档详情
  const document = await prisma.document.findUnique({
    where: {
      id: documentId
    },
    include: {
      author: {
        select: {
          id: true,
          name: true,
          email: true,
          image: true
        }
      },
      folder: {
        select: {
          id: true,
          name: true
        }
      },
      attachments: true,
      _count: {
        select: {
          comments: true,
          attachments: true
        }
      }
    }
  });

  if (!document) {
    notFound();
  }

  // 检查用户是否有编辑文档的权限
  const canEditDocument = await hasPermission(user.id, 'document.update');

  // 检查用户是否有删除文档的权限
  const canDeleteDocument = await hasPermission(user.id, 'document.delete');

  return (
    <PageContainer>
      <div className='mx-auto flex w-full max-w-5xl flex-1 flex-col space-y-6 px-4 md:px-6 lg:px-8'>
        <div className='flex items-center justify-between'>
          <div className='flex items-center gap-2'>
            <Button variant='ghost' size='sm' asChild>
              <Link
                href={
                  document.projectId
                    ? `/dashboard/documents?tab=project&projectId=${document.projectId}`
                    : '/dashboard/documents'
                }
              >
                <ArrowLeftIcon className='mr-2 h-4 w-4' />
                {tCommon('back')} {document.projectId ? t('title') : t('title')}
              </Link>
            </Button>
          </div>
          <div className='flex gap-2'>
            {canEditDocument && (
              <Button size='sm' asChild>
                <Link href={`/dashboard/documents/${documentId}/edit`}>
                  <Edit className='mr-2 h-4 w-4' />
                  {tCommon('edit')}
                </Link>
              </Button>
            )}
            {canDeleteDocument && (
              <Button variant='destructive' size='sm' asChild>
                <Link href={`/dashboard/documents/${documentId}/delete`}>
                  <Trash2 className='mr-2 h-4 w-4' />
                  {tCommon('delete')}
                </Link>
              </Button>
            )}
          </div>
        </div>

        <div className='flex flex-col gap-1'>
          <Heading
            title={document.title}
            description={`${t('title')} ID: ${document.id}`}
          />
          <div className='text-muted-foreground flex items-center gap-3 text-sm'>
            <span>
              {tCommon('created')}{' '}
              {format(new Date(document.createdAt), 'yyyy-MM-dd HH:mm')}
            </span>
            <span>|</span>
            <span>
              {tCommon('name')}: {document.author.name}
            </span>
            {document.folder && (
              <>
                <span>|</span>
                <span>
                  {t('form.category')}: {document.folder.name}
                </span>
              </>
            )}
            <span>|</span>
            <Badge
              variant={
                (statusMap[document.status as keyof typeof statusMap]
                  ?.variant as any) || 'default'
              }
            >
              {statusMap[document.status as keyof typeof statusMap]?.label ||
                document.status}
            </Badge>
            {document.isPrivate && (
              <Badge variant='outline'>{tCommon('private') || 'Private'}</Badge>
            )}
          </div>
        </div>

        <Separator />

        {/* 文档内容 */}
        <Card className='shadow-sm'>
          <CardContent className='prose max-w-none px-6 py-6'>
            {document.format === 'MARKDOWN' ? (
              <div className='markdown-body'>
                <ReactMarkdown>{document.content}</ReactMarkdown>
              </div>
            ) : (
              <div dangerouslySetInnerHTML={{ __html: document.content }} />
            )}
          </CardContent>
        </Card>

        {/* 标签 */}
        {document.tags && document.tags.trim().length > 0 && (
          <div className='space-y-2'>
            <h3 className='text-sm font-medium'>{t('form.tags')}</h3>
            <div className='flex flex-wrap gap-2'>
              {document.tags
                .split(',')
                .filter(Boolean)
                .map((tag: string) => (
                  <Badge key={tag} variant='secondary'>
                    {tag}
                  </Badge>
                ))}
            </div>
          </div>
        )}

        {/* 附件 */}
        <div className='space-y-2'>
          <h3 className='text-sm font-medium'>
            {t('attachments.title')} ({document._count.attachments})
          </h3>
          {document.attachments.length > 0 ? (
            <div className='space-y-2'>
              {document.attachments.map((attachment: any) => (
                <div
                  key={attachment.id}
                  className='flex items-center justify-between rounded border p-2'
                >
                  <div className='flex items-center'>
                    <FileIcon className='text-muted-foreground mr-2 h-4 w-4' />
                    <a
                      href={attachment.filePath}
                      target='_blank'
                      rel='noopener noreferrer'
                      className='text-blue-600 hover:underline'
                    >
                      {attachment.name}
                    </a>
                    <span className='ml-2 text-xs text-gray-500'>
                      ({Math.round(attachment.fileSize / 1024)} KB)
                    </span>
                  </div>
                  <div className='flex gap-2'>
                    <Button variant='ghost' size='sm' asChild>
                      <a
                        href={attachment.filePath}
                        download={attachment.name}
                        className='flex items-center'
                      >
                        <Download className='h-4 w-4' />
                      </a>
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className='text-muted-foreground rounded border py-4 text-center'>
              {t('attachments.add')}
            </div>
          )}
        </div>
      </div>
    </PageContainer>
  );
}
