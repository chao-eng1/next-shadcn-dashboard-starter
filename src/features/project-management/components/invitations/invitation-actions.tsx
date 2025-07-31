'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Check, Loader2, X } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
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

interface InvitationActionsProps {
  token: string;
  projectName: string;
}

export function InvitationActions({
  token,
  projectName
}: InvitationActionsProps) {
  const router = useRouter();
  const [isAccepting, setIsAccepting] = useState(false);
  const [isRejecting, setIsRejecting] = useState(false);
  const [showRejectDialog, setShowRejectDialog] = useState(false);

  // 接受邀请
  const handleAccept = async () => {
    setIsAccepting(true);

    try {
      const response = await fetch(`/api/invitations/${token}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ action: 'accept' })
      });

      const data = await response.json();

      if (data.success) {
        toast.success(`您已成功加入项目 ${projectName}`);

        // 重定向到项目页面
        setTimeout(() => {
          router.push(`/dashboard/projects/${data.data.membership.projectId}`);
        }, 1000);
      } else {
        throw new Error(data.error?.message || '处理邀请失败');
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : '接受邀请失败');
      setIsAccepting(false);
    }
  };

  // 拒绝邀请
  const handleReject = async () => {
    setIsRejecting(true);
    setShowRejectDialog(false);

    try {
      const response = await fetch(`/api/invitations/${token}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ action: 'reject' })
      });

      const data = await response.json();

      if (data.success) {
        toast.success('您已拒绝邀请');

        // 重定向到仪表盘
        setTimeout(() => {
          router.push('/dashboard');
        }, 1000);
      } else {
        throw new Error(data.error?.message || '处理邀请失败');
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : '拒绝邀请失败');
      setIsRejecting(false);
    }
  };

  return (
    <>
      <div className='flex w-full space-x-4'>
        <Button
          onClick={handleAccept}
          disabled={isAccepting || isRejecting}
          className='flex-1'
        >
          {isAccepting ? (
            <Loader2 className='mr-2 h-4 w-4 animate-spin' />
          ) : (
            <Check className='mr-2 h-4 w-4' />
          )}
          接受邀请
        </Button>

        <AlertDialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
          <AlertDialogTrigger asChild>
            <Button
              variant='outline'
              className='flex-1'
              disabled={isAccepting || isRejecting}
            >
              {isRejecting ? (
                <Loader2 className='mr-2 h-4 w-4 animate-spin' />
              ) : (
                <X className='mr-2 h-4 w-4' />
              )}
              拒绝邀请
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>确认拒绝邀请</AlertDialogTitle>
              <AlertDialogDescription>
                您确定要拒绝加入项目 "{projectName}" 的邀请吗？此操作不可撤销。
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>取消</AlertDialogCancel>
              <AlertDialogAction onClick={handleReject}>
                确认拒绝
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </>
  );
}
