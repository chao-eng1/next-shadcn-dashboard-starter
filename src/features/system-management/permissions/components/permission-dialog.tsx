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
import { PermissionForm } from './permission-form';
import { useState } from 'react';
import { IconPlus } from '@tabler/icons-react';
import { PermissionFormValues } from '../schemas/permission-schema';

interface PermissionDialogProps {
  initialData?: PermissionFormValues & { id: string };
  mode: 'create' | 'edit';
  trigger?: React.ReactNode;
  title?: string;
  description?: string;
  onComplete?: () => void;
}

export function PermissionDialog({
  initialData,
  mode,
  trigger,
  title,
  description,
  onComplete
}: PermissionDialogProps) {
  const [open, setOpen] = useState(false);

  // Default trigger for create mode
  const defaultTrigger =
    mode === 'create' ? (
      <Button>
        <IconPlus className='mr-2 h-4 w-4' />
        Add Permission
      </Button>
    ) : undefined;

  // Default title and description based on mode
  const defaultTitle =
    mode === 'create' ? 'Add New Permission' : 'Edit Permission';
  const defaultDescription =
    mode === 'create' ? 'Create a new permission' : 'Edit permission details';

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
          <PermissionForm
            initialData={initialData}
            mode={mode}
            onSuccess={handleComplete}
            inDialog={true}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
