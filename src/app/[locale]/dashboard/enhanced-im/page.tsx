import { Metadata } from 'next';
import { getCurrentUser } from '@/lib/get-current-user';
import { redirect } from 'next/navigation';
import { EnhancedIMPage } from '@/features/user-messages/components/enhanced-im-page';

export const metadata: Metadata = {
  title: '增强版即时通讯 - 实时聊天系统',
  description: '功能完整的即时通讯系统，支持项目群聊、私聊、文件分享和实时消息',
};

export async function generateStaticParams() {
  return [
    { locale: 'en' },
    { locale: 'zh' }
  ];
}

export default async function EnhancedIMPageRoute() {
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

  return <EnhancedIMPage currentUser={currentUser} />;
}