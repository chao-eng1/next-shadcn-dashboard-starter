'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { ProjectSelector } from '@/features/project-management/components/project/project-selector';
import Link from 'next/link';
import { PlusIcon } from 'lucide-react';
import { GlobalTaskList } from '@/features/project-management/components/task/global-task-list';

interface Project {
  id: string;
  name: string;
  status: string;
}

interface Sprint {
  id: string;
  name: string;
  status: string;
  projectId: string;
  project: {
    name: string;
  };
}

interface TaskContainerProps {
  userId: string;
  projects: Project[];
  sprints: Sprint[];
  canCreateTask: boolean;
}

export function TaskContainer({
  userId,
  projects,
  sprints,
  canCreateTask
}: TaskContainerProps) {
  const t = useTranslations('tasks');
  const searchParams = useSearchParams();
  const [selectedProjectId, setSelectedProjectId] = useState<
    string | undefined
  >(undefined);

  // 从URL参数中读取projectId
  useEffect(() => {
    const projectIdFromUrl = searchParams.get('projectId');
    if (projectIdFromUrl && projects.some((p) => p.id === projectIdFromUrl)) {
      setSelectedProjectId(projectIdFromUrl);
    }
  }, [searchParams, projects]);

  const handleProjectChange = (projectId: string) => {
    setSelectedProjectId(projectId === 'all' ? undefined : projectId);
  };

  return (
    <>
      <div className='mb-4 flex flex-wrap items-center justify-between gap-2'>
        <div className='flex items-center gap-2'>
          <ProjectSelector
            projects={projects}
            currentProjectId={selectedProjectId || 'all'}
            onProjectChange={handleProjectChange}
          />
        </div>
        {canCreateTask && (
          <Button asChild>
            <Link href={`/dashboard/tasks/new`}>
              <PlusIcon className='mr-2 h-4 w-4' />
              {t('create')}
            </Link>
          </Button>
        )}
      </div>
      <GlobalTaskList
        userId={userId}
        projects={projects}
        sprints={sprints}
        defaultProjectId={selectedProjectId}
      />
    </>
  );
}
