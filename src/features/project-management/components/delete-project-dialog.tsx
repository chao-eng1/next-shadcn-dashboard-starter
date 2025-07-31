'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { TrashIcon, Loader2 } from 'lucide-react';

interface DeleteProjectDialogProps {
  projectId: string;
  projectName: string;
  onSuccess?: () => void;
}

export function DeleteProjectDialog({
  projectId,
  projectName,
  onSuccess
}: DeleteProjectDialogProps) {
  const t = useTranslations('projects');
  const tCommon = useTranslations('common');

  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDelete = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/projects/${projectId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || '删除项目失败');
      }

      // Close the dialog
      setOpen(false);

      // Trigger success callback if provided
      if (onSuccess) {
        onSuccess();
      } else {
        // Default behavior: refresh the page
        window.location.reload();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '未知错误');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        <Button
          variant='outline'
          size='sm'
          className='text-destructive hover:text-destructive hover:bg-destructive/10 h-8 w-8 p-0'
        >
          <TrashIcon className='h-4 w-4' />
          <span className='sr-only'>删除项目</span>
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>确认删除项目</AlertDialogTitle>
          <AlertDialogDescription>
            您确定要删除项目 &quot;{projectName}&quot;
            吗？此操作不可撤销，项目中的所有数据都将被永久删除。
          </AlertDialogDescription>
        </AlertDialogHeader>

        {error && (
          <div className='bg-destructive/15 text-destructive my-2 rounded-md p-3'>
            {error}
          </div>
        )}

        <AlertDialogFooter>
          <AlertDialogCancel disabled={loading}>取消</AlertDialogCancel>
          <AlertDialogAction
            onClick={(e) => {
              e.preventDefault();
              handleDelete();
            }}
            disabled={loading}
            className='bg-destructive text-destructive-foreground hover:bg-destructive/90'
          >
            {loading ? (
              <>
                <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                删除中...
              </>
            ) : (
              '确认删除'
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
