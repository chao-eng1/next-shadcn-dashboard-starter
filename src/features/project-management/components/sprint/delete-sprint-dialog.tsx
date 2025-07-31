'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, AlertTriangleIcon, Trash2Icon } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from '@/components/ui/dialog';
import { toast } from 'sonner';

interface DeleteSprintDialogProps {
  projectId: string;
  sprintId: string;
  sprintName: string;
  children: React.ReactNode;
}

export function DeleteSprintDialog({
  projectId,
  sprintId,
  sprintName,
  children
}: DeleteSprintDialogProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [confirmText, setConfirmText] = useState('');

  const handleDelete = async () => {
    if (confirmText !== sprintName) {
      toast.error('请输入正确的迭代名称以确认删除');
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch(
        `/api/projects/${projectId}/sprints/${sprintId}`,
        {
          method: 'DELETE'
        }
      );

      const data = await response.json();

      if (data.success) {
        toast.success('迭代已删除');
        setOpen(false);
        router.push(`/dashboard/projects/${projectId}/sprints`);
        router.refresh();
      } else {
        throw new Error(data.error?.message || '删除失败');
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : '未知错误');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className='sm:max-w-[425px]'>
        <DialogHeader>
          <DialogTitle className='text-destructive flex items-center gap-2'>
            <AlertTriangleIcon className='h-5 w-5' />
            删除迭代
          </DialogTitle>
          <DialogDescription>
            此操作无法撤销。这将永久删除迭代及其所有相关数据。
          </DialogDescription>
        </DialogHeader>

        <div className='space-y-4 py-4'>
          <div className='bg-destructive/10 border-destructive/20 rounded-lg border p-4'>
            <div className='flex items-start gap-3'>
              <AlertTriangleIcon className='text-destructive mt-0.5 h-5 w-5 flex-shrink-0' />
              <div className='space-y-2'>
                <h4 className='text-destructive font-medium'>警告</h4>
                <div className='text-muted-foreground space-y-1 text-sm'>
                  <p>删除迭代将会:</p>
                  <ul className='ml-4 list-inside list-disc space-y-1'>
                    <li>永久删除迭代 "{sprintName}"</li>
                    <li>移除所有关联的任务分配</li>
                    <li>清除迭代相关的统计数据</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          <div className='space-y-2'>
            <label className='text-sm font-medium'>确认删除</label>
            <p className='text-muted-foreground text-sm'>
              请输入迭代名称{' '}
              <span className='bg-muted rounded px-1 font-mono'>
                {sprintName}
              </span>{' '}
              以确认删除:
            </p>
            <input
              type='text'
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              placeholder='输入迭代名称'
              className='border-input focus:ring-ring w-full rounded-md border px-3 py-2 focus:border-transparent focus:ring-2 focus:outline-none'
            />
          </div>
        </div>

        <DialogFooter>
          <Button
            type='button'
            variant='outline'
            onClick={() => {
              setOpen(false);
              setConfirmText('');
            }}
            disabled={isSubmitting}
          >
            取消
          </Button>
          <Button
            type='button'
            variant='destructive'
            onClick={handleDelete}
            disabled={isSubmitting || confirmText !== sprintName}
          >
            {isSubmitting && <Loader2 className='mr-2 h-4 w-4 animate-spin' />}
            <Trash2Icon className='mr-2 h-4 w-4' />
            删除迭代
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
