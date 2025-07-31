'use client';

import { useState, useEffect } from 'react';
import { ProjectSelector } from '@/features/project-management/components/project/project-selector';
import { KanbanBoard } from '@/features/project-management/components/task/kanban-board';

interface Project {
  id: string;
  name: string;
  status: string;
}

interface Task {
  id: string;
  title: string;
  description: string | null;
  status: string;
  priority: string;
  dueDate: string | null;
  projectId: string;
  assignments: {
    id: string;
    member: {
      user: {
        id: string;
        name: string | null;
        email: string;
        image: string | null;
      };
    };
  }[];
  _count: {
    subtasks: number;
    comments: number;
    attachments: number;
  };
}

interface KanbanContainerProps {
  userId: string;
  projects: Project[];
  initialTasks: Task[];
  canCreateTask: boolean;
}

export function KanbanContainer({
  userId,
  projects,
  initialTasks,
  canCreateTask
}: KanbanContainerProps) {
  const [selectedProjectId, setSelectedProjectId] = useState<string>('');
  const [filteredTasks, setFilteredTasks] = useState<Task[]>(initialTasks);

  const handleProjectChange = (projectId: string) => {
    setSelectedProjectId(projectId === 'all' ? '' : projectId);
  };

  // Update filtered tasks when project selection or initialTasks change
  useEffect(() => {
    const filtered = selectedProjectId
      ? initialTasks.filter((task) => task.projectId === selectedProjectId)
      : initialTasks;
    setFilteredTasks(filtered);
  }, [selectedProjectId, initialTasks]);

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
      </div>
      <KanbanBoard
        projectId={selectedProjectId}
        userId={userId}
        initialTasks={filteredTasks}
        canCreateTask={canCreateTask}
      />
    </>
  );
}
