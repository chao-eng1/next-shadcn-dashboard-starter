'use client';

import { useState, useEffect } from 'react';
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
import { PencilIcon, Loader2 } from 'lucide-react';
import { ProjectForm } from './project-form';

interface EditProjectDialogProps {
  userId: string;
  projectId: string;
}

export function EditProjectDialog({
  userId,
  projectId
}: EditProjectDialogProps) {
  const t = useTranslations('projects');
  const tm = useTranslations('messages');
  const tCommon = useTranslations('common');

  const [open, setOpen] = useState(false);
  const [project, setProject] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch project data when dialog opens
  const fetchProject = async () => {
    if (!open) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/projects/${projectId}`);

      if (!response.ok) {
        throw new Error(tm('fetchError'));
      }

      const data = await response.json();

      if (data.success) {
        setProject(data.data);
      } else {
        throw new Error(
          data.error?.message || tm('fetchError')
        );
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  // Fetch project when dialog opens
  useEffect(() => {
    if (open) {
      fetchProject();
    }
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant='outline' size='sm' className='h-8 w-8 p-0'>
          <PencilIcon className='h-4 w-4' />
        </Button>
      </DialogTrigger>
      <DialogContent className='max-h-[90vh] overflow-y-auto sm:max-w-[700px]'>
        <DialogHeader>
          <DialogTitle>编辑项目</DialogTitle>
          <DialogDescription>修改项目信息</DialogDescription>
        </DialogHeader>

        {loading && (
          <div className='flex justify-center py-8'>
            <Loader2 className='text-primary h-8 w-8 animate-spin' />
          </div>
        )}

        {error && (
          <div className='bg-destructive/15 text-destructive my-4 rounded-md p-4'>
            {error}
          </div>
        )}

        {!loading && !error && project && (
          <div className='py-4'>
            <ProjectForm
              userId={userId}
              project={project}
              onSuccess={() => {
                setOpen(false);
                // Refresh the page data
                window.location.reload();
              }}
            />
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
