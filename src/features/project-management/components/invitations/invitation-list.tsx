'use client';

import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import {
  Check,
  Clock,
  Loader2,
  MailQuestion,
  MoreHorizontal,
  RefreshCw,
  Send,
  Trash2,
  X
} from 'lucide-react';
import { toast } from 'sonner';

import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { INVITATION_STATUS } from '@/constants/project';

interface InvitationListProps {
  projectId: string;
  onInvitationUpdate?: () => void;
}

export function InvitationList({
  projectId,
  onInvitationUpdate
}: InvitationListProps) {
  const [invitations, setInvitations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 加载邀请列表
  const loadInvitations = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/projects/${projectId}/invitations`);

      if (!response.ok) {
        throw new Error('加载邀请列表失败');
      }

      const data = await response.json();

      if (data.success) {
        setInvitations(data.data);
      } else {
        throw new Error(data.error?.message || '加载邀请列表失败');
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : '未知错误');
    } finally {
      setLoading(false);
    }
  };

  // 初始加载
  useEffect(() => {
    loadInvitations();
  }, [projectId]);

  // 取消邀请
  const cancelInvitation = async (invitationId: string) => {
    try {
      const response = await fetch(
        `/api/projects/${projectId}/invitations/${invitationId}`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ action: 'cancel' })
        }
      );

      const data = await response.json();

      if (data.success) {
        toast.success('邀请已取消');

        // 更新列表
        loadInvitations();

        if (onInvitationUpdate) {
          onInvitationUpdate();
        }
      } else {
        throw new Error(data.error?.message || '取消邀请失败');
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : '取消邀请失败');
    }
  };

  // 重新发送邀请
  const resendInvitation = async (invitationId: string) => {
    try {
      const response = await fetch(
        `/api/projects/${projectId}/invitations/${invitationId}`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ action: 'resend' })
        }
      );

      const data = await response.json();

      if (data.success) {
        toast.success('邀请已重新发送');

        // 更新列表
        loadInvitations();

        if (onInvitationUpdate) {
          onInvitationUpdate();
        }
      } else {
        throw new Error(data.error?.message || '重新发送邀请失败');
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : '重新发送邀请失败');
    }
  };

  // 删除邀请
  const deleteInvitation = async (invitationId: string) => {
    if (!confirm('确定要删除此邀请记录吗？')) {
      return;
    }

    try {
      const response = await fetch(
        `/api/projects/${projectId}/invitations/${invitationId}`,
        {
          method: 'DELETE'
        }
      );

      const data = await response.json();

      if (data.success) {
        toast.success('邀请已删除');

        // 更新列表
        loadInvitations();

        if (onInvitationUpdate) {
          onInvitationUpdate();
        }
      } else {
        throw new Error(data.error?.message || '删除邀请失败');
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : '删除邀请失败');
    }
  };

  // 检查邀请是否已过期
  const isExpired = (expiresAt: string) => {
    return new Date() > new Date(expiresAt);
  };

  // 状态标记
  const getStatusBadge = (status: string, expiresAt: string) => {
    // 如果状态是 PENDING 但已过期，显示为过期
    if (status === 'PENDING' && isExpired(expiresAt)) {
      return (
        <Badge
          variant='outline'
          className='border-gray-200 bg-gray-100 text-gray-800'
        >
          <Clock className='mr-1 h-3 w-3' />
          已过期
        </Badge>
      );
    }

    const statusConfig =
      INVITATION_STATUS[status as keyof typeof INVITATION_STATUS];

    return (
      <Badge
        variant='outline'
        className={`bg-${statusConfig.color}-100 text-${statusConfig.color}-800 border-${statusConfig.color}-200`}
      >
        {status === 'PENDING' && <Clock className='mr-1 h-3 w-3' />}
        {status === 'ACCEPTED' && <Check className='mr-1 h-3 w-3' />}
        {status === 'REJECTED' && <X className='mr-1 h-3 w-3' />}
        {statusConfig.label}
      </Badge>
    );
  };

  if (loading) {
    return (
      <div className='flex justify-center py-8'>
        <Loader2 className='text-primary h-8 w-8 animate-spin' />
      </div>
    );
  }

  if (error) {
    return (
      <div className='text-destructive flex items-center justify-center py-8'>
        <p>{error}</p>
      </div>
    );
  }

  if (invitations.length === 0) {
    return (
      <div className='text-muted-foreground flex flex-col items-center justify-center py-8'>
        <MailQuestion className='mb-4 h-12 w-12' />
        <p>暂无邀请记录</p>
      </div>
    );
  }

  return (
    <Table>
      <TableCaption>项目邀请列表</TableCaption>
      <TableHeader>
        <TableRow>
          <TableHead>受邀者</TableHead>
          <TableHead>角色</TableHead>
          <TableHead>状态</TableHead>
          <TableHead>过期时间</TableHead>
          <TableHead>发送时间</TableHead>
          <TableHead className='text-right'>操作</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {invitations.map((invitation) => (
          <TableRow key={invitation.id}>
            <TableCell className='font-medium'>{invitation.email}</TableCell>
            <TableCell>
              {invitation.role === 'ADMIN' && '管理员'}
              {invitation.role === 'MEMBER' && '成员'}
              {invitation.role === 'VIEWER' && '观察者'}
            </TableCell>
            <TableCell>
              {getStatusBadge(invitation.status, invitation.expiresAt)}
            </TableCell>
            <TableCell>
              {format(new Date(invitation.expiresAt), 'yyyy-MM-dd HH:mm')}
            </TableCell>
            <TableCell>
              {format(new Date(invitation.createdAt), 'yyyy-MM-dd HH:mm')}
            </TableCell>
            <TableCell className='text-right'>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant='ghost' className='h-8 w-8 p-0'>
                    <span className='sr-only'>打开菜单</span>
                    <MoreHorizontal className='h-4 w-4' />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align='end'>
                  <DropdownMenuLabel>邀请操作</DropdownMenuLabel>

                  {/* 只有待处理或已过期的邀请才能重新发送 */}
                  {(invitation.status === 'PENDING' ||
                    (invitation.status === 'PENDING' &&
                      isExpired(invitation.expiresAt))) && (
                    <DropdownMenuItem
                      onClick={() => resendInvitation(invitation.id)}
                    >
                      <RefreshCw className='mr-2 h-4 w-4' />
                      重新发送
                    </DropdownMenuItem>
                  )}

                  {/* 只有待处理的邀请才能取消 */}
                  {invitation.status === 'PENDING' &&
                    !isExpired(invitation.expiresAt) && (
                      <DropdownMenuItem
                        onClick={() => cancelInvitation(invitation.id)}
                      >
                        <X className='mr-2 h-4 w-4' />
                        取消邀请
                      </DropdownMenuItem>
                    )}

                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => deleteInvitation(invitation.id)}
                  >
                    <Trash2 className='mr-2 h-4 w-4' />
                    删除记录
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
