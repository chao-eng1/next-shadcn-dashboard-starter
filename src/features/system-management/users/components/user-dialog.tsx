'use client';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from '@/components/ui/dialog';
import { UserForm } from './user-form';
import { Role } from '@prisma/client';
import { useState } from 'react';
import { IconPlus } from '@tabler/icons-react';
import { UserFormValues } from '../schemas/user-schema';

interface UserDialogProps {
  initialData?: UserFormValues & { id: string };
  roles: Role[];
  mode: 'create' | 'edit';
  trigger?: React.ReactNode;
  title?: string;
  description?: string;
  onComplete?: () => void;
}

export function UserDialog({
  initialData,
  roles,
  mode,
  trigger,
  title,
  description,
  onComplete
}: UserDialogProps) {
  const [open, setOpen] = useState(false);

  // Default trigger for create mode
  const defaultTrigger =
    mode === 'create' ? (
      <Button>
        <IconPlus className='mr-2 h-4 w-4' />
        Add User
      </Button>
    ) : undefined;

  // Default title and description based on mode
  const defaultTitle = mode === 'create' ? 'Add New User' : 'Edit User';
  const defaultDescription =
    mode === 'create'
      ? 'Create a new user with roles'
      : 'Edit user details and roles';

  const handleComplete = () => {
    setOpen(false);
    if (onComplete) {
      onComplete();
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger || defaultTrigger}</DialogTrigger>
      <DialogContent className='max-h-[90vh] overflow-y-auto sm:max-w-[600px]'>
        <DialogHeader>
          <DialogTitle>{title || defaultTitle}</DialogTitle>
          <DialogDescription>
            {description || defaultDescription}
          </DialogDescription>
        </DialogHeader>

        <div className='py-4'>
          <UserForm
            initialData={initialData}
            roles={roles}
            mode={mode}
            onSuccess={handleComplete}
            inDialog={true}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
