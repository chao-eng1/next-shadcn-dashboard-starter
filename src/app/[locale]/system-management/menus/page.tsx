import { Metadata } from 'next';
import { MenusTablePage } from '@/features/system-management/menus/components/menus-table-page';

export const metadata: Metadata = {
  title: 'Menus Management',
  description: 'Manage system menus'
};

export default function MenusPage() {
  return <MenusTablePage />;
}
