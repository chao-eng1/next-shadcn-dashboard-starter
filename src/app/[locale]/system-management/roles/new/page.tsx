import { Metadata } from 'next';
import { RoleForm } from '@/features/system-management/roles/components/role-form';
import { prisma } from '@/lib/prisma';

export const metadata: Metadata = {
  title: 'Create New Role',
  description: 'Create a new system role'
};

export default async function NewRolePage() {
  const permissions = await prisma.permission.findMany({
    orderBy: {
      name: 'asc'
    }
  });

  return (
    <div className='container py-6'>
      <h1 className='mb-6 text-3xl font-bold tracking-tight'>
        Create New Role
      </h1>
      <RoleForm initialData={null} permissions={permissions} mode='create' />
    </div>
  );
}
