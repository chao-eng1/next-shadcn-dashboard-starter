'use client';

import { useMemo } from 'react';
import { useTranslations } from 'next-intl';
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, rectSortingStrategy } from '@dnd-kit/sortable';
import { KanbanCard } from './kanban-card';

interface Task {
  id: string;
  title: string;
  description: string | null;
  status: string;
  priority: string;
  dueDate: string | null;
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

interface KanbanColumnProps {
  id: string;
  title: string;
  color: string;
  tasks: Task[];
  projectId: string;
}

export function KanbanColumn({
  id,
  title,
  color,
  tasks,
  projectId
}: KanbanColumnProps) {
  const { setNodeRef, isOver } = useDroppable({
    id
  });

  const t = useTranslations('kanban');

  // 提取任务ID用于SortableContext
  const taskIds = useMemo(() => tasks.map((task) => task.id), [tasks]);

  // 计算列表样式
  const columnStyle = isOver
    ? { backgroundColor: `bg-${color}-50` }
    : { backgroundColor: 'bg-gray-50 dark:bg-gray-900' };

  return (
    <div
      ref={setNodeRef}
      className={`flex h-[calc(100vh-320px)] flex-col ${isOver ? `bg-${color}-50` : 'bg-gray-50 dark:bg-gray-900'} rounded-md border p-3`}
    >
      <div className='mb-3 flex items-center justify-between'>
        <div className='flex items-center gap-2'>
          <div className={`h-3 w-3 rounded-full bg-${color}-500`} />
          <h3 className='text-sm font-medium'>{title}</h3>
        </div>
        <span className='rounded-full bg-gray-200 px-2 py-1 text-xs font-medium dark:bg-gray-800'>
          {tasks.length}
        </span>
      </div>

      <div className='min-h-[100px] flex-1 space-y-2 overflow-y-auto'>
        <SortableContext items={taskIds} strategy={rectSortingStrategy}>
          {tasks.map((task) => (
            <KanbanCard
              key={task.id}
              task={task}
              projectId={projectId}
              userId={task.assignments[0]?.member.user.id || ''}
            />
          ))}
        </SortableContext>

        {tasks.length === 0 && (
          <div className='text-muted-foreground flex h-24 items-center justify-center rounded-md border border-dashed text-sm'>
            {t('noTasks')}
          </div>
        )}
      </div>
    </div>
  );
}
