import { Metadata } from 'next';
import { getCurrentUser } from '@/lib/get-current-user';
import { hasPermission } from '@/lib/permissions';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { MessageManagementPage } from '@/features/system-management/messages/components/message-management-page';

export const metadata: Metadata = {
  title: '系统消息管理',
  description: '管理和发送系统消息'
};

export default async function SystemMessagesPage() {
  const currentUser = await getCurrentUser();
  
  if (!currentUser) {
    redirect('/auth/login');
  }

  // 检查用户是否有消息管理权限
  const canManageMessages = await hasPermission(currentUser.id, 'message.manage');
  
  if (!canManageMessages) {
    redirect('/dashboard');
  }

  // 获取所有角色
  const roles = await prisma.role.findMany({
    select: {
      id: true,
      name: true,
      description: true
    },
    orderBy: {
      name: 'asc'
    }
  });

  // 获取所有用户
  const users = await prisma.user.findMany({
    select: {
      id: true,
      name: true,
      email: true,
      image: true
    },
    orderBy: {
      name: 'asc'
    }
  });

  return (
    <MessageManagementPage 
      roles={roles}
      users={users}
      currentUser={currentUser}
    />
  );
}