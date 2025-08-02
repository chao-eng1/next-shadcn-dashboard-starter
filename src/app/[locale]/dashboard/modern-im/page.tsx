import { Metadata } from 'next';
import { getCurrentUser } from '@/lib/get-current-user';
import { redirect } from 'next/navigation';
import { ModernIMPage } from '@/features/user-messages/components/modern-im-page';

export const metadata: Metadata = {
  title: '即时通讯 - 现代化聊天界面',
  description: '与团队成员进行实时沟通，支持项目群聊、私聊和系统消息',
};

export default async function ModernIMPageRoute() {
  const user = await getCurrentUser();
  
  if (!user) {
    redirect('/auth/signin');
  }

  // 转换用户数据格式
  const currentUser = {
    id: user.id,
    name: user.name || user.email,
    email: user.email,
    image: user.image || undefined,
    status: 'online' as const
  };

  return <ModernIMPage currentUser={currentUser} />;
}