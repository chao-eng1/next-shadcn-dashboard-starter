'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { ProjectSelector } from '@/features/project-management/components/project/project-selector';
import Link from 'next/link';
import { PlusIcon, FileTextIcon } from 'lucide-react';

interface Project {
  id: string;
  name: string;
  status: string;
}

interface DocumentContainerProps {
  projects: Project[];
  canCreateDocument: boolean;
}

export function DocumentContainer({
  projects,
  canCreateDocument
}: DocumentContainerProps) {
  const [selectedProjectId, setSelectedProjectId] = useState<string>('');

  const handleProjectChange = (projectId: string) => {
    setSelectedProjectId(projectId === 'all' ? '' : projectId);
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
        {canCreateDocument && (
          <Button asChild>
            <Link href={`/dashboard/documents/new`}>
              <PlusIcon className='mr-2 h-4 w-4' />
              创建文档
            </Link>
          </Button>
        )}
      </div>
      <div className='flex flex-col items-center justify-center p-10'>
        <FileTextIcon className='text-muted-foreground/60 mb-6 h-16 w-16' />
        <h3 className='mb-2 text-2xl font-medium'>文档管理功能</h3>
        <p className='text-muted-foreground mb-6 max-w-md text-center'>
          {selectedProjectId
            ? `您当前选择了一个项目。这里将显示该项目的文档列表。`
            : '选择一个项目以查看或创建文档。您可以使用上方的项目选择器来切换不同的项目。'}
        </p>
        <Button variant='outline' asChild>
          <Link
            href={
              selectedProjectId
                ? `/dashboard/projects/${selectedProjectId}`
                : '/dashboard/projects'
            }
          >
            {selectedProjectId ? '查看项目详情' : '浏览项目'}
          </Link>
        </Button>
      </div>
    </>
  );
}
