import { Metadata } from 'next';
import { MenuForm } from '@/features/system-management/menus/components/menu-form';
import { prisma } from '@/lib/prisma';
import { notFound } from 'next/navigation';

export const metadata: Metadata = {
  title: 'Edit Menu',
  description: 'Edit navigation menu'
};

interface EditMenuPageProps {
  params: { menuId: string };
}

export default async function EditMenuPage({ params }: EditMenuPageProps) {
  const { menuId } = params;

  const menu = await prisma.menu.findUnique({
    where: {
      id: menuId
    },
    include: {
      permissions: true
    }
  });

  if (!menu) {
    notFound();
  }

  const menus = await prisma.menu.findMany({
    where: {
      id: {
        not: menuId // Exclude current menu from parent options
      }
    },
    orderBy: {
      name: 'asc'
    }
  });

  const permissions = await prisma.permission.findMany({
    orderBy: {
      name: 'asc'
    }
  });

  // Format the menu data for the form
  const formattedMenu = {
    id: menu.id,
    name: menu.name,
    path: menu.path || '',
    icon: menu.icon || '',
    order: menu.order,
    isVisible: menu.isVisible,
    parentId: menu.parentId || '',
    permissions: menu.permissions.map((p) => p.permissionId)
  };

  return (
    <div className='container py-6'>
      <h1 className='mb-6 text-3xl font-bold tracking-tight'>Edit Menu</h1>
      <MenuForm
        initialData={formattedMenu}
        menus={menus}
        permissions={permissions}
        mode='edit'
      />
    </div>
  );
}
