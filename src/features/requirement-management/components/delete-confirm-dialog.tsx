'use client';

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle
} from '@/components/ui/alert-dialog';

interface DeleteConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  title: string;
  requirementId?: string;
  loading?: boolean;
}

export function DeleteConfirmDialog({
  open,
  onOpenChange,
  onConfirm,
  title,
  requirementId,
  loading = false
}: DeleteConfirmDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>确认删除需求</AlertDialogTitle>
          <AlertDialogDescription>
            您即将删除需求 &quot;{title}&quot;
            {requirementId && (
              <span className='text-muted-foreground mt-1 block text-sm'>
                ID: {requirementId}
              </span>
            )}
            <span className='mt-2 block text-sm font-medium text-red-600'>
              此操作不可撤销！删除后，该需求的所有相关数据（评论、附件、版本历史等）都会被永久删除。
            </span>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>取消</AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            className={`${
              loading
                ? 'cursor-not-allowed bg-red-400'
                : 'bg-red-600 hover:bg-red-700'
            } text-white transition-colors`}
            disabled={loading}
          >
            {loading ? (
              <div className='flex items-center gap-2'>
                <div className='h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent'></div>
                删除中...
              </div>
            ) : (
              '确认删除'
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
