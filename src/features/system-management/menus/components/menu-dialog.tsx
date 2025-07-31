'use client';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose
} from '@/components/ui/dialog';
import { MenuForm } from './menu-form';
import { Menu, Permission } from '@prisma/client';
import { useState } from 'react';
import { IconPlus } from '@tabler/icons-react';
import { MenuFormValues } from '../schemas/menu-schema';

interface MenuDialogProps {
  initialData?: MenuFormValues & { id: string };
  permissions: Permission[];
  menus: Menu[];
  mode: 'create' | 'edit';
  trigger?: React.ReactNode;
  title?: string;
  description?: string;
  onComplete?: () => void;
}

export function MenuDialog({
  initialData,
  permissions,
  menus,
  mode,
  trigger,
  title,
  description,
  onComplete
}: MenuDialogProps) {
  const [open, setOpen] = useState(false);

  // Default trigger for create mode
  const defaultTrigger =
    mode === 'create' ? (
      <Button>
        <IconPlus className='mr-2 h-4 w-4' />
        Add Menu
      </Button>
    ) : undefined;

  // Default title and description based on mode
  const defaultTitle = mode === 'create' ? 'Add New Menu' : 'Edit Menu';
  const defaultDescription =
    mode === 'create'
      ? 'Create a new menu item with permissions'
      : 'Edit menu details and permissions';

  const handleComplete = () => {
    setOpen(false);
    if (onComplete) {
      onComplete();
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger || defaultTrigger}</DialogTrigger>
      <DialogContent className='max-h-[90vh] overflow-y-auto sm:max-w-[900px]'>
        <DialogHeader>
          <DialogTitle>{title || defaultTitle}</DialogTitle>
          <DialogDescription>
            {description || defaultDescription}
          </DialogDescription>
        </DialogHeader>

        <div className='py-4'>
          <MenuForm
            initialData={initialData}
            permissions={permissions}
            menus={menus}
            mode={mode}
            onSuccess={handleComplete}
            inDialog={true}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
