import { Button } from '@/components/ui/button';
import { UsersTable } from './users-table';
import { prisma } from '@/lib/prisma';
import { IconPlus } from '@tabler/icons-react';
import { UserDialog } from './user-dialog';

export async function UsersTablePage() {
  const users = await prisma.user.findMany({
    include: {
      roles: {
        include: {
          role: true
        }
      }
    },
    orderBy: {
      createdAt: 'desc'
    }
  });

  // Get all roles for the form
  const roles = await prisma.role.findMany({
    orderBy: {
      name: 'asc'
    }
  });

  return (
    <div className='container mx-auto max-w-7xl space-y-6 px-6 py-6 md:px-10'>
      <div className='flex items-center justify-between'>
        <div>
          <h1 className='text-3xl font-bold tracking-tight'>User Management</h1>
          <p className='text-muted-foreground'>
            Create and manage users and their roles
          </p>
        </div>
        <UserDialog roles={roles} mode='create' />
      </div>
      <UsersTable users={users} roles={roles} />
    </div>
  );
}
