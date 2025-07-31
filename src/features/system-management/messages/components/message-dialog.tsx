'use client';

import { useState } from 'react';
import { Role, User } from '@prisma/client';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from '@/components/ui/dialog';
import { MessageForm } from './message-form';

interface MessageDialogProps {
  trigger: React.ReactNode;
  title?: string;
  description?: string;
  roles?: Role[];
  users?: User[];
}

export function MessageDialog({
  trigger,
  title = 'Send Message',
  description = 'Send a message to users on the platform.',
  roles = [],
  users = []
}: MessageDialogProps) {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className='sm:max-w-[600px]'>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <MessageForm
          roles={roles}
          users={users}
          onSuccess={() => setOpen(false)}
          onCancel={() => setOpen(false)}
        />
      </DialogContent>
    </Dialog>
  );
}
