import { Button } from '@/components/ui/button';
import { MenusTable } from './menus-table';
import { prisma } from '@/lib/prisma';
import { IconPlus } from '@tabler/icons-react';
import { MenuDialog } from './menu-dialog';

// Function to build a menu tree from flat list
function buildMenuTree(menus: any[]) {
  const menuMap = new Map();
  const rootMenus: any[] = [];

  // First pass: Create a map of all menus
  menus.forEach((menu) => {
    menuMap.set(menu.id, { ...menu, children: [] });
  });

  // Second pass: Build the tree structure
  menus.forEach((menu) => {
    const menuWithChildren = menuMap.get(menu.id);

    if (menu.parentId) {
      const parent = menuMap.get(menu.parentId);
      if (parent) {
        parent.children.push(menuWithChildren);
      } else {
        rootMenus.push(menuWithChildren);
      }
    } else {
      rootMenus.push(menuWithChildren);
    }
  });

  return rootMenus;
}

export async function MenusTablePage() {
  const menus = await prisma.menu.findMany({
    include: {
      parent: true,
      permissions: {
        include: {
          permission: true
        }
      }
    },
    orderBy: [
      {
        parentId: 'asc'
      },
      {
        order: 'asc'
      }
    ]
  });

  // Get all permissions for the form
  const permissions = await prisma.permission.findMany({
    orderBy: {
      name: 'asc'
    }
  });

  // Build menu tree
  const menuTree = buildMenuTree(menus);

  return (
    <div className='container mx-auto max-w-7xl space-y-6 px-6 py-6 md:px-10'>
      <div className='flex items-center justify-between'>
        <div>
          <h1 className='text-3xl font-bold tracking-tight'>Menu Management</h1>
          <p className='text-muted-foreground'>
            Create and manage navigation menus
          </p>
        </div>
        <MenuDialog menus={menus} permissions={permissions} mode='create' />
      </div>
      <MenusTable menus={menuTree} permissions={permissions} />
    </div>
  );
}
