import { Metadata } from 'next';
import { UserForm } from '@/features/system-management/users/components/user-form';
import { prisma } from '@/lib/prisma';

export const metadata: Metadata = {
  title: 'Create New User',
  description: 'Create a new system user'
};

export default async function NewUserPage() {
  const roles = await prisma.role.findMany({
    orderBy: {
      name: 'asc'
    }
  });

  return (
    <div className='container py-6'>
      <h1 className='mb-6 text-3xl font-bold tracking-tight'>
        Create New User
      </h1>
      <UserForm initialData={null} roles={roles} mode='create' />
    </div>
  );
}
