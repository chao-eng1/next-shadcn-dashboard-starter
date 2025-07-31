import { Metadata } from 'next';
import { RoleForm } from '@/features/system-management/roles/components/role-form';
import { prisma } from '@/lib/prisma';
import { notFound } from 'next/navigation';

export const metadata: Metadata = {
  title: 'Edit Role',
  description: 'Edit system role'
};

interface EditRolePageProps {
  params: { roleId: string };
}

export default async function EditRolePage({ params }: EditRolePageProps) {
  const { roleId } = params;

  const role = await prisma.role.findUnique({
    where: {
      id: roleId
    },
    include: {
      permissions: true
    }
  });

  if (!role) {
    notFound();
  }

  const permissions = await prisma.permission.findMany({
    orderBy: {
      name: 'asc'
    }
  });

  // Format the role data for the form
  const formattedRole = {
    id: role.id,
    name: role.name,
    description: role.description || '',
    permissions: role.permissions.map((p) => p.permissionId)
  };

  return (
    <div className='container py-6'>
      <h1 className='mb-6 text-3xl font-bold tracking-tight'>Edit Role</h1>
      <RoleForm
        initialData={formattedRole}
        permissions={permissions}
        mode='edit'
      />
    </div>
  );
}
