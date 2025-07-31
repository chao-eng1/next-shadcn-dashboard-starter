import { prisma } from '@/lib/prisma';
import { UserForm } from './user-form';
import { notFound } from 'next/navigation';

interface UserViewPageProps {
  userId: string;
}

export async function UserViewPage({ userId }: UserViewPageProps) {
  const user = await prisma.user.findUnique({
    where: {
      id: userId
    },
    include: {
      roles: true
    }
  });

  if (!user) {
    notFound();
  }

  const roles = await prisma.role.findMany({
    orderBy: {
      name: 'asc'
    }
  });

  // Format the user data for the form
  const formattedUser = {
    id: user.id,
    name: user.name || '',
    email: user.email,
    password: '',
    image: user.image || '',
    roles: user.roles.map((role) => role.roleId)
  };

  return (
    <div className='container py-6'>
      <h1 className='mb-6 text-3xl font-bold tracking-tight'>Edit User</h1>
      <UserForm initialData={formattedUser} roles={roles} mode='edit' />
    </div>
  );
}
