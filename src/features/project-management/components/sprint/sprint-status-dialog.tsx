'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Loader2,
  AlertTriangleIcon,
  PlayIcon,
  CheckIcon,
  XIcon,
  CalendarDaysIcon
} from 'lucide-react';

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
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { SPRINT_STATUS } from '@/constants/project';
import { toast } from 'sonner';

interface SprintStatusDialogProps {
  projectId: string;
  sprintId: string;
  sprintName: string;
  currentStatus: string;
  targetStatus: 'ACTIVE' | 'COMPLETED' | 'CANCELLED';
  children: React.ReactNode;
}

export function SprintStatusDialog({
  projectId,
  sprintId,
  sprintName,
  currentStatus,
  targetStatus,
  children
}: SprintStatusDialogProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 获取状态信息
  const getStatusInfo = (status: string) => {
    switch (status) {
      case 'PLANNED':
        return { icon: CalendarDaysIcon, color: 'gray', label: '计划中' };
      case 'ACTIVE':
        return { icon: PlayIcon, color: 'green', label: '进行中' };
      case 'COMPLETED':
        return { icon: CheckIcon, color: 'emerald', label: '已完成' };
      case 'CANCELLED':
        return { icon: XIcon, color: 'red', label: '已取消' };
      default:
        return { icon: CalendarDaysIcon, color: 'gray', label: '未知' };
    }
  };

  const currentStatusInfo = getStatusInfo(currentStatus);
  const targetStatusInfo = getStatusInfo(targetStatus);

  // 获取操作描述
  const getActionDescription = () => {
    switch (targetStatus) {
      case 'ACTIVE':
        return {
          title: '开始迭代',
          description: '将迭代状态从计划中更改为进行中',
          warning: '开始迭代后，团队成员将能够开始处理迭代中的任务。',
          confirmText: '开始迭代',
          variant: 'default' as const
        };
      case 'COMPLETED':
        return {
          title: '完成迭代',
          description: '将迭代状态从进行中更改为已完成',
          warning:
            '完成迭代后，将无法再向此迭代添加新任务，所有未完成的任务将需要重新分配。',
          confirmText: '完成迭代',
          variant: 'default' as const
        };
      case 'CANCELLED':
        return {
          title: '取消迭代',
          description: `将迭代状态从${currentStatusInfo.label}更改为已取消`,
          warning:
            '取消迭代后，迭代中的所有任务将变为未分配状态，此操作不可撤销。',
          confirmText: '取消迭代',
          variant: 'destructive' as const
        };
      default:
        return {
          title: '更改状态',
          description: '更改迭代状态',
          warning: '此操作将更改迭代状态。',
          confirmText: '确认更改',
          variant: 'default' as const
        };
    }
  };

  const actionInfo = getActionDescription();

  const handleStatusChange = async () => {
    setIsSubmitting(true);

    try {
      const response = await fetch(
        `/api/projects/${projectId}/sprints/${sprintId}`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            status: targetStatus
          })
        }
      );

      const data = await response.json();

      if (data.success) {
        toast.success(`迭代已${actionInfo.confirmText}`);
        setOpen(false);
        router.refresh();
      } else {
        throw new Error(data.error?.message || '状态更改失败');
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : '未知错误');
    } finally {
      setIsSubmitting(false);
    }
  };

  const CurrentStatusIcon = currentStatusInfo.icon;
  const TargetStatusIcon = targetStatusInfo.icon;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className='sm:max-w-[500px]'>
        <DialogHeader>
          <DialogTitle className='flex items-center gap-2'>
            <TargetStatusIcon
              className={`h-5 w-5 text-${targetStatusInfo.color}-500`}
            />
            {actionInfo.title}
          </DialogTitle>
          <DialogDescription>{actionInfo.description}</DialogDescription>
        </DialogHeader>

        <div className='space-y-4 py-4'>
          {/* 状态变更预览 */}
          <div className='bg-muted/50 rounded-lg border p-4'>
            <div className='flex items-center justify-between'>
              <div className='flex items-center gap-3'>
                <div className='flex items-center gap-2'>
                  <CurrentStatusIcon
                    className={`h-4 w-4 text-${currentStatusInfo.color}-500`}
                  />
                  <Badge
                    variant='outline'
                    className={`bg-${currentStatusInfo.color}-50 text-${currentStatusInfo.color}-700 border-${currentStatusInfo.color}-200 dark:bg-${currentStatusInfo.color}-900/20`}
                  >
                    {
                      SPRINT_STATUS[currentStatus as keyof typeof SPRINT_STATUS]
                        ?.label
                    }
                  </Badge>
                </div>
                <span className='text-muted-foreground'>→</span>
                <div className='flex items-center gap-2'>
                  <TargetStatusIcon
                    className={`h-4 w-4 text-${targetStatusInfo.color}-500`}
                  />
                  <Badge
                    variant='outline'
                    className={`bg-${targetStatusInfo.color}-50 text-${targetStatusInfo.color}-700 border-${targetStatusInfo.color}-200 dark:bg-${targetStatusInfo.color}-900/20`}
                  >
                    {
                      SPRINT_STATUS[targetStatus as keyof typeof SPRINT_STATUS]
                        ?.label
                    }
                  </Badge>
                </div>
              </div>
            </div>
            <div className='text-muted-foreground mt-2 text-sm'>
              迭代: <span className='font-medium'>{sprintName}</span>
            </div>
          </div>

          <Separator />

          {/* 警告信息 */}
          <Alert
            className={
              targetStatus === 'CANCELLED'
                ? 'border-destructive/50'
                : 'border-blue-200'
            }
          >
            <AlertTriangleIcon
              className={`h-4 w-4 ${targetStatus === 'CANCELLED' ? 'text-destructive' : 'text-blue-500'}`}
            />
            <AlertDescription className='text-sm'>
              {actionInfo.warning}
            </AlertDescription>
          </Alert>

          {/* 额外提示信息 */}
          {targetStatus === 'COMPLETED' && (
            <div className='rounded-lg border border-green-200 bg-green-50 p-3 dark:border-green-800 dark:bg-green-900/10'>
              <div className='flex items-start gap-2'>
                <CheckIcon className='mt-0.5 h-4 w-4 flex-shrink-0 text-green-600 dark:text-green-400' />
                <div className='text-sm'>
                  <p className='mb-1 font-medium text-green-800 dark:text-green-200'>
                    完成迭代后
                  </p>
                  <ul className='space-y-1 text-xs text-green-700 dark:text-green-300'>
                    <li>• 迭代将被标记为已完成</li>
                    <li>• 可以查看迭代统计数据和报告</li>
                    <li>• 未完成的任务需要重新分配到其他迭代</li>
                  </ul>
                </div>
              </div>
            </div>
          )}

          {targetStatus === 'ACTIVE' && (
            <div className='rounded-lg border border-blue-200 bg-blue-50 p-3 dark:border-blue-800 dark:bg-blue-900/10'>
              <div className='flex items-start gap-2'>
                <PlayIcon className='mt-0.5 h-4 w-4 flex-shrink-0 text-blue-600 dark:text-blue-400' />
                <div className='text-sm'>
                  <p className='mb-1 font-medium text-blue-800 dark:text-blue-200'>
                    开始迭代后
                  </p>
                  <ul className='space-y-1 text-xs text-blue-700 dark:text-blue-300'>
                    <li>• 团队成员可以开始处理任务</li>
                    <li>• 可以跟踪迭代进度和统计</li>
                    <li>• 迭代将出现在活动迭代列表中</li>
                  </ul>
                </div>
              </div>
            </div>
          )}
        </div>

        <DialogFooter className='gap-2'>
          <Button
            type='button'
            variant='outline'
            onClick={() => setOpen(false)}
            disabled={isSubmitting}
          >
            取消
          </Button>
          <Button
            type='button'
            variant={actionInfo.variant}
            onClick={handleStatusChange}
            disabled={isSubmitting}
          >
            {isSubmitting && <Loader2 className='mr-2 h-4 w-4 animate-spin' />}
            <TargetStatusIcon className='mr-2 h-4 w-4' />
            {actionInfo.confirmText}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
