'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';
import { useTranslations } from 'next-intl';

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, EyeIcon, FileTextIcon, FolderIcon } from 'lucide-react';

import { getApiUrl } from '@/lib/utils';

interface Document {
  id: string;
  title: string;
  status: string;
  format: string;
  parentId: string | null;
  createdAt: string;
  updatedAt: string;
  createdBy: {
    id: string;
    name: string | null;
    image: string | null;
  };
  _count: {
    children: number;
    versions: number;
  };
}

interface ProjectDocumentSummaryProps {
  projectId: string;
  userId: string;
}

export function ProjectDocumentSummary({
  projectId,
  userId
}: ProjectDocumentSummaryProps) {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const t = useTranslations('documents');
  const tCommon = useTranslations('common');

  // 获取文档状态标签
  const getDocumentStatusLabel = (status: string) => {
    const statusMap: Record<string, { label: string; variant: any }> = {
      DRAFT: { label: t('status.draft'), variant: 'outline' },
      REVIEW: { label: t('status.review'), variant: 'secondary' },
      PUBLISHED: { label: t('status.published'), variant: 'default' },
      ARCHIVED: { label: t('status.archived'), variant: 'destructive' }
    };
    return statusMap[status] || { label: status, variant: 'outline' };
  };

  // 获取文档格式标签
  const getDocumentFormatLabel = (format: string) => {
    const formatMap: Record<string, string> = {
      MARKDOWN: t('format.markdown'),
      RICH_TEXT: t('format.richText'),
      PLAIN_TEXT: t('format.plainText')
    };
    return formatMap[format] || format;
  };

  // 获取文档列表
  const fetchDocuments = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(
        getApiUrl(`/api/projects/${projectId}/documents?limit=10`)
      );

      if (!response.ok) {
        throw new Error('获取文档列表失败');
      }

      const data = await response.json();
      if (data.success) {
        setDocuments(Array.isArray(data.data) ? data.data : []);
      } else {
        throw new Error(data.message || '获取文档列表失败');
      }
    } catch (err) {
      console.error('获取文档列表失败:', err);
      setError(err instanceof Error ? err.message : '获取文档列表失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDocuments();
  }, [projectId]);

  if (loading) {
    return (
      <div className='flex items-center justify-center py-8'>
        <Loader2 className='h-6 w-6 animate-spin' />
        <span className='ml-2'>{tCommon('loading')}</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className='py-8 text-center'>
        <p className='text-destructive mb-4'>{error}</p>
        <Button onClick={fetchDocuments} variant='outline'>
          {tCommon('retry')}
        </Button>
      </div>
    );
  }

  if (documents.length === 0) {
    return (
      <div className='py-8 text-center'>
        <FileTextIcon className='mx-auto mb-4 h-12 w-12 text-muted-foreground' />
        <p className='text-muted-foreground mb-4'>{t('empty.project')}</p>
        <Button asChild>
          <Link href={`/dashboard/projects/${projectId}/documents/new`}>
            {t('actions.new')}
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <div className='space-y-4'>
      {/* 统计信息 */}
      <div className='grid grid-cols-1 gap-4 md:grid-cols-3'>
        <div className='rounded-lg border p-4'>
          <div className='text-2xl font-bold'>{Array.isArray(documents) ? documents.length : 0}</div>
          <p className='text-muted-foreground text-sm'>{t('overview.totalDocuments')}</p>
        </div>
        <div className='rounded-lg border p-4'>
          <div className='text-2xl font-bold'>
            {Array.isArray(documents) ? documents.filter(doc => doc.status === 'PUBLISHED').length : 0}
          </div>
          <p className='text-muted-foreground text-sm'>{t('status.published')}</p>
        </div>
        <div className='rounded-lg border p-4'>
          <div className='text-2xl font-bold'>
            {Array.isArray(documents) ? documents.filter(doc => doc.status === 'DRAFT').length : 0}
          </div>
          <p className='text-muted-foreground text-sm'>{t('status.draft')}</p>
        </div>
      </div>

      {/* 文档列表 */}
      <div className='rounded-md border'>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t('table.title')}</TableHead>
              <TableHead>{t('table.status')}</TableHead>
              <TableHead>{t('form.format')}</TableHead>
              <TableHead>{t('table.author')}</TableHead>
              <TableHead>{t('table.createdAt')}</TableHead>
              <TableHead className='w-[100px]'>{t('table.actions')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {Array.isArray(documents) && documents.map((document) => {
              const statusInfo = getDocumentStatusLabel(document.status);
              return (
                <TableRow key={document.id}>
                  <TableCell>
                    <div className='flex items-center space-x-2'>
                      {document.parentId ? (
                        <FolderIcon className='h-4 w-4 text-muted-foreground' />
                      ) : (
                        <FileTextIcon className='h-4 w-4 text-muted-foreground' />
                      )}
                      <span className='font-medium'>{document.title}</span>
                      {document._count.children > 0 && (
                        <span className='text-muted-foreground text-xs'>
                          ({document._count.children})
                        </span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={statusInfo.variant}>
                      {statusInfo.label}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <span className='text-muted-foreground text-sm'>
                      {getDocumentFormatLabel(document.format)}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span className='text-sm'>
                      {document.createdBy.name || 'Unknown'}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span className='text-muted-foreground text-sm'>
                      {format(new Date(document.createdAt), 'yyyy-MM-dd')}
                    </span>
                  </TableCell>
                  <TableCell>
                    <Button
                      variant='ghost'
                      size='sm'
                      asChild
                    >
                      <Link href={`/dashboard/projects/${projectId}/documents/${document.id}`}>
                        <EyeIcon className='h-4 w-4' />
                      </Link>
                    </Button>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      {/* 查看更多 */}
      <div className='text-center'>
        <Button variant='outline' asChild>
          <Link href={`/dashboard/projects/${projectId}/documents`}>
            {t('actions.viewAll')}
          </Link>
        </Button>
      </div>
    </div>
  );
}