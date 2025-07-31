'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from '@/components/ui/dialog';
import { PlusIcon } from 'lucide-react';
import { ProjectForm } from './project-form';

interface CreateProjectDialogProps {
  userId: string;
}

export function CreateProjectDialog({ userId }: CreateProjectDialogProps) {
  const t = useTranslations('projects');
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <PlusIcon className='mr-2 h-4 w-4' />
          {t('create')}
        </Button>
      </DialogTrigger>
      <DialogContent className='max-h-[90vh] overflow-y-auto sm:max-w-[700px]'>
        <DialogHeader>
          <DialogTitle>{t('create')}</DialogTitle>
          <DialogDescription>{t('createDescription')}</DialogDescription>
        </DialogHeader>
        <div className='py-4'>
          <ProjectForm
            userId={userId}
            onSuccess={() => {
              setOpen(false);
              // Refresh the page data
              window.location.reload();
            }}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
