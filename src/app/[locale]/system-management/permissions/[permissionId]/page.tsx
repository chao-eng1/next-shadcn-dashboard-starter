import { Metadata } from 'next';
import { PermissionForm } from '@/features/system-management/permissions/components/permission-form';
import { prisma } from '@/lib/prisma';
import { notFound } from 'next/navigation';

export const metadata: Metadata = {
  title: 'Edit Permission',
  description: 'Edit system permission'
};

interface EditPermissionPageProps {
  params: { permissionId: string };
}

export default async function EditPermissionPage({
  params
}: EditPermissionPageProps) {
  const { permissionId } = params;

  const permission = await prisma.permission.findUnique({
    where: {
      id: permissionId
    }
  });

  if (!permission) {
    notFound();
  }

  // Format the permission data for the form
  const formattedPermission = {
    id: permission.id,
    name: permission.name,
    description: permission.description || ''
  };

  return (
    <div className='container py-6'>
      <h1 className='mb-6 text-3xl font-bold tracking-tight'>
        Edit Permission
      </h1>
      <PermissionForm initialData={formattedPermission} mode='edit' />
    </div>
  );
}
