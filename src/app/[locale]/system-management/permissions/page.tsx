import { Metadata } from 'next';
import { PermissionsTablePage } from '@/features/system-management/permissions/components/permissions-table-page';

export const metadata: Metadata = {
  title: 'Permissions Management',
  description: 'Manage system permissions'
};

export default function PermissionsPage() {
  return <PermissionsTablePage />;
}
