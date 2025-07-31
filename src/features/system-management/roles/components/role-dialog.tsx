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
import { RoleForm } from './role-form';
import { Permission } from '@prisma/client';
import { useState } from 'react';
import { IconPlus } from '@tabler/icons-react';
import { RoleFormValues } from '../schemas/role-schema';

interface RoleDialogProps {
  initialData?: RoleFormValues & { id: string };
  permissions: Permission[];
  mode: 'create' | 'edit';
  trigger?: React.ReactNode;
  title?: string;
  description?: string;
  onComplete?: () => void;
}

export function RoleDialog({
  initialData,
  permissions,
  mode,
  trigger,
  title,
  description,
  onComplete
}: RoleDialogProps) {
  const [open, setOpen] = useState(false);

  // Default trigger for create mode
  const defaultTrigger =
    mode === 'create' ? (
      <Button>
        <IconPlus className='mr-2 h-4 w-4' />
        Add Role
      </Button>
    ) : undefined;

  // Default title and description based on mode
  const defaultTitle = mode === 'create' ? 'Add New Role' : 'Edit Role';
  const defaultDescription =
    mode === 'create'
      ? 'Create a new role with permissions'
      : 'Edit role details and permissions';

  const handleComplete = () => {
    setOpen(false);
    if (onComplete) {
      onComplete();
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger || defaultTrigger}</DialogTrigger>
      <DialogContent className='max-h-[90vh] overflow-y-auto sm:max-w-[800px]'>
        <DialogHeader>
          <DialogTitle>{title || defaultTitle}</DialogTitle>
          <DialogDescription>
            {description || defaultDescription}
          </DialogDescription>
        </DialogHeader>

        <div className='py-4'>
          <RoleForm
            initialData={initialData}
            permissions={permissions}
            mode={mode}
            onSuccess={handleComplete}
            inDialog={true}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
