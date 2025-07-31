import { Metadata } from 'next';
import { UsersTablePage } from '@/features/system-management/users/components/users-table-page';

export const metadata: Metadata = {
  title: 'Users Management',
  description: 'Manage system users'
};

export default function UsersPage() {
  return <UsersTablePage />;
}
