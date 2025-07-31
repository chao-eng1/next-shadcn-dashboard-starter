import { Metadata } from 'next';
import { MenuForm } from '@/features/system-management/menus/components/menu-form';
import { prisma } from '@/lib/prisma';

export const metadata: Metadata = {
  title: 'Create New Menu',
  description: 'Create a new navigation menu'
};

export default async function NewMenuPage() {
  // Get all menus for parent selection
  const menus = await prisma.menu.findMany({
    orderBy: {
      name: 'asc'
    }
  });

  return (
    <div className='container py-6'>
      <h1 className='mb-6 text-3xl font-bold tracking-tight'>
        Create New Menu
      </h1>
      <MenuForm initialData={null} menus={menus} mode='create' />
    </div>
  );
}
