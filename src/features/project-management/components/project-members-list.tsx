'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { format } from 'date-fns';
import {
  Award,
  Crown,
  Eye,
  Loader2,
  MoreHorizontal,
  Shield,
  UserRound,
  UserX
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
import { Button } from '@/components/ui/button';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { PROJECT_MEMBER_ROLE } from '@/constants/project';

interface ProjectMembersListProps {
  projectId: string;
  userId: string;
  isOwner: boolean;
  hasManagePermission: boolean;
  onMemberChange?: () => void;
}

export function ProjectMembersList({
  projectId,
  userId,
  isOwner,
  hasManagePermission,
  onMemberChange
}: ProjectMembersListProps) {
  const [members, setMembers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 加载项目成员
  const loadMembers = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/projects/${projectId}/members`);

      if (!response.ok) {
        throw new Error('加载项目成员失败');
      }

      const data = await response.json();

      if (data.success) {
        setMembers(data.data || []);
      } else {
        throw new Error(data.error?.message || '加载项目成员失败');
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : '未知错误');
    } finally {
      setLoading(false);
    }
  };

  // 初始加载和响应onMemberChange
  useEffect(() => {
    loadMembers();
  }, [projectId, onMemberChange]);

  // 更新成员角色
  const updateMemberRole = async (memberId: string, role: string) => {
    try {
      const response = await fetch(
        `/api/projects/${projectId}/members/${memberId}`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ role })
        }
      );

      const data = await response.json();

      if (data.success) {
        toast.success('成员角色已更新');

        // 更新列表
        loadMembers();

        if (onMemberChange) {
          onMemberChange();
        }
      } else {
        throw new Error(data.error?.message || '更新成员角色失败');
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : '更新成员角色失败');
    }
  };

  // 移除成员
  const removeMember = async (memberId: string) => {
    if (!confirm('确定要移除该成员吗？')) {
      return;
    }

    try {
      const response = await fetch(
        `/api/projects/${projectId}/members/${memberId}`,
        {
          method: 'DELETE'
        }
      );

      const data = await response.json();

      if (data.success) {
        toast.success('成员已移除');

        // 更新列表
        loadMembers();

        if (onMemberChange) {
          onMemberChange();
        }
      } else {
        throw new Error(data.error?.message || '移除成员失败');
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : '移除成员失败');
    }
  };

  // 渲染角色图标
  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'OWNER':
        return <Crown className='h-4 w-4 text-yellow-500' />;
      case 'ADMIN':
        return <Shield className='h-4 w-4 text-blue-500' />;
      case 'MEMBER':
        return <UserRound className='h-4 w-4 text-green-500' />;
      case 'VIEWER':
        return <Eye className='h-4 w-4 text-purple-500' />;
      default:
        return null;
    }
  };

  // 渲染角色选择器
  const renderRoleSelector = (member: any) => {
    // 如果是项目所有者，不允许更改角色
    if (member.role === 'OWNER') {
      return (
        <div className='flex items-center space-x-1'>
          <Crown className='h-4 w-4 text-yellow-500' />
          <span>所有者</span>
        </div>
      );
    }

    // 如果当前用户是自己，不允许更改自己的角色
    if (member.user.id === userId && !isOwner) {
      return (
        <div className='flex items-center space-x-1'>
          {getRoleIcon(member.role)}
          <span>
            {member.role === 'ADMIN' && '管理员'}
            {member.role === 'MEMBER' && '成员'}
            {member.role === 'VIEWER' && '观察者'}
          </span>
        </div>
      );
    }

    // 如果有管理权限，允许更改其他成员的角色
    if (hasManagePermission) {
      return (
        <Select
          value={member.role}
          onValueChange={(value) => updateMemberRole(member.id, value)}
        >
          <SelectTrigger className='w-[130px]'>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {Object.entries(PROJECT_MEMBER_ROLE)
              .filter(([key]) => key !== 'OWNER') // 过滤掉 OWNER 角色
              .map(([key, _]) => (
                <SelectItem key={key} value={key}>
                  <div className='flex items-center'>
                    {getRoleIcon(key)}
                    <span className='ml-2'>
                      {key === 'ADMIN' && '管理员'}
                      {key === 'MEMBER' && '成员'}
                      {key === 'VIEWER' && '观察者'}
                    </span>
                  </div>
                </SelectItem>
              ))}
          </SelectContent>
        </Select>
      );
    }

    // 如果没有管理权限，只显示角色
    return (
      <div className='flex items-center space-x-1'>
        {getRoleIcon(member.role)}
        <span>
          {member.role === 'ADMIN' && '管理员'}
          {member.role === 'MEMBER' && '成员'}
          {member.role === 'VIEWER' && '观察者'}
        </span>
      </div>
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

  if (members.length === 0) {
    return (
      <div className='text-muted-foreground flex flex-col items-center justify-center py-8'>
        <UserRound className='mb-4 h-12 w-12' />
        <p>暂无项目成员</p>
      </div>
    );
  }

  return (
    <Table>
      <TableCaption>项目成员列表</TableCaption>
      <TableHeader>
        <TableRow>
          <TableHead>成员</TableHead>
          <TableHead>角色</TableHead>
          <TableHead>加入时间</TableHead>
          <TableHead className='text-right'>操作</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {members.map((member) => (
          <TableRow key={member.id}>
            <TableCell>
              <div className='flex items-center space-x-3'>
                <Avatar>
                  {member.user.image ? (
                    <AvatarImage
                      src={member.user.image}
                      alt={member.user.name || member.user.email}
                    />
                  ) : (
                    <AvatarFallback>
                      {(member.user.name || member.user.email)
                        .charAt(0)
                        .toUpperCase()}
                    </AvatarFallback>
                  )}
                </Avatar>
                <div>
                  <div className='font-medium'>
                    {member.user.name || '未设置姓名'}
                  </div>
                  <div className='text-muted-foreground text-sm'>
                    {member.user.email}
                  </div>
                </div>
                {member.user.id === userId && (
                  <div className='bg-secondary text-secondary-foreground rounded-md px-1.5 py-0.5 text-xs'>
                    你
                  </div>
                )}
              </div>
            </TableCell>
            <TableCell>{renderRoleSelector(member)}</TableCell>
            <TableCell>
              {format(new Date(member.joinedAt), 'yyyy-MM-dd HH:mm')}
            </TableCell>
            <TableCell className='text-right'>
              {/* 所有者不能被移除，用户不能移除自己 */}
              {member.role !== 'OWNER' &&
                member.user.id !== userId &&
                hasManagePermission && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant='ghost' className='h-8 w-8 p-0'>
                        <span className='sr-only'>打开菜单</span>
                        <MoreHorizontal className='h-4 w-4' />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align='end'>
                      <DropdownMenuLabel>成员操作</DropdownMenuLabel>
                      <DropdownMenuItem onClick={() => removeMember(member.id)}>
                        <UserX className='mr-2 h-4 w-4' />
                        移除成员
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
