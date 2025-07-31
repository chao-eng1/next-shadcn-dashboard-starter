import { Metadata } from 'next';
import { RolesTablePage } from '@/features/system-management/roles/components/roles-table-page';

export const metadata: Metadata = {
  title: 'Roles Management',
  description: 'Manage system roles'
};

export default function RolesPage() {
  return <RolesTablePage />;
}
