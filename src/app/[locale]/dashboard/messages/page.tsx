import { Metadata } from 'next';
import { getCurrentUser } from '@/lib/get-current-user';
import { redirect } from 'next/navigation';
import { UserMessagesPage } from '@/features/user-messages/components/user-messages-page';

export const metadata: Metadata = {
  title: '我的消息',
  description: '查看和管理您收到的系统消息'
};

export default async function MessagesPage() {
  const user = await getCurrentUser();
  
  if (!user) {
    redirect('/auth/sign-in');
  }

  return (
    <UserMessagesPage 
      currentUser={{
        id: user.id,
        name: user.name || '',
        email: user.email
      }}
    />
  );
}