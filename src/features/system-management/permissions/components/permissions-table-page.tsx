import { Button } from '@/components/ui/button';
import { PermissionsTable } from './permissions-table';
import { prisma } from '@/lib/prisma';
import { IconPlus } from '@tabler/icons-react';
import { PermissionDialog } from './permission-dialog';

export async function PermissionsTablePage() {
  const permissions = await prisma.permission.findMany({
    include: {
      roles: {
        include: {
          role: true
        }
      },
      menus: {
        include: {
          menu: true
        }
      },
      _count: {
        select: {
          roles: true,
          menus: true
        }
      }
    },
    orderBy: {
      name: 'asc'
    }
  });

  return (
    <div className='container mx-auto max-w-7xl space-y-6 px-6 py-6 md:px-10'>
      <div className='flex items-center justify-between'>
        <div>
          <h1 className='text-3xl font-bold tracking-tight'>
            Permission Management
          </h1>
          <p className='text-muted-foreground'>
            Create and manage system permissions
          </p>
        </div>
        <PermissionDialog mode='create' />
      </div>
      <PermissionsTable permissions={permissions} />
    </div>
  );
}
