import { Metadata } from 'next';
import { UserViewPage } from '@/features/system-management/users/components/user-view-page';

export const metadata: Metadata = {
  title: 'User Details',
  description: 'View and edit user details'
};

interface UserPageProps {
  params: { userId: string };
}

export default function UserPage({ params }: UserPageProps) {
  return <UserViewPage userId={params.userId} />;
}
