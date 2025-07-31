import { Button } from '@/components/ui/button';
import { RolesTable } from './roles-table';
import { prisma } from '@/lib/prisma';
import { IconPlus } from '@tabler/icons-react';
import { RoleDialog } from './role-dialog';

export async function RolesTablePage() {
  const roles = await prisma.role.findMany({
    include: {
      permissions: {
        include: {
          permission: true
        }
      },
      _count: {
        select: {
          users: true
        }
      }
    },
    orderBy: {
      name: 'asc'
    }
  });

  // Get all permissions for the form
  const permissions = await prisma.permission.findMany({
    orderBy: {
      name: 'asc'
    }
  });

  return (
    <div className='container mx-auto max-w-7xl space-y-6 px-6 py-6 md:px-10'>
      <div className='flex items-center justify-between'>
        <div>
          <h1 className='text-3xl font-bold tracking-tight'>Role Management</h1>
          <p className='text-muted-foreground'>
            Create and manage roles and their permissions
          </p>
        </div>
        <RoleDialog permissions={permissions} mode='create' />
      </div>
      <RolesTable roles={roles} permissions={permissions} />
    </div>
  );
}
