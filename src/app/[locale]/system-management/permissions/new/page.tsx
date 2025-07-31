import { Metadata } from 'next';
import { PermissionForm } from '@/features/system-management/permissions/components/permission-form';

export const metadata: Metadata = {
  title: 'Create New Permission',
  description: 'Create a new system permission'
};

export default function NewPermissionPage() {
  return (
    <div className='container py-6'>
      <h1 className='mb-6 text-3xl font-bold tracking-tight'>
        Create New Permission
      </h1>
      <PermissionForm initialData={null} mode='create' />
    </div>
  );
}
