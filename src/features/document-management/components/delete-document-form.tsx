'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

interface DeleteDocumentFormProps {
  documentId: string;
  documentTitle: string;
  returnTo: string;
}

export function DeleteDocumentForm({
  documentId,
  documentTitle,
  returnTo
}: DeleteDocumentFormProps) {
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      const response = await fetch(`/api/documents/${documentId}`, {
        method: 'DELETE'
      });

      const data = await response.json();

      if (data.success) {
        toast.success('文档已成功删除');
        router.push(returnTo);
        router.refresh();
      } else {
        throw new Error(data.error?.message || '删除文档失败');
      }
    } catch (error) {
      console.error('删除文档失败:', error);
      toast.error(error instanceof Error ? error.message : '删除文档失败');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className='space-y-6'>
      <Alert variant='destructive'>
        <AlertTriangle className='h-4 w-4' />
        <AlertTitle>警告</AlertTitle>
        <AlertDescription>
          您即将删除文档 "{documentTitle}
          "。此操作将同时删除与该文档关联的所有附件、评论和版本历史记录，且无法恢复。
        </AlertDescription>
      </Alert>

      <div className='flex justify-end gap-4'>
        <Button
          variant='outline'
          onClick={() => router.back()}
          disabled={isDeleting}
        >
          取消
        </Button>
        <Button
          variant='destructive'
          onClick={handleDelete}
          disabled={isDeleting}
        >
          {isDeleting ? (
            <>
              <Loader2 className='mr-2 h-4 w-4 animate-spin' />
              删除中...
            </>
          ) : (
            '确认删除'
          )}
        </Button>
      </div>
    </div>
  );
}
