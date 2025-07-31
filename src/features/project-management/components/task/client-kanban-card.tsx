'use client';

import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { format } from 'date-fns';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { TASK_PRIORITY } from '@/constants/project';
import { CalendarIcon, MessageSquareIcon, FileIcon } from 'lucide-react';
import { getTaskPriorityLabel } from '@/lib/status-labels';
import { useTranslations } from 'next-intl';

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

interface KanbanCardProps {
  task: Task;
  projectId: string;
  userId: string;
}

export function ClientKanbanCard({ task, projectId, userId }: KanbanCardProps) {
  const tasksT = useTranslations('tasks');

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({
    id: task.id,
    data: {
      type: 'task',
      task
    }
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 10 : 1
  };

  // 检查任务是否已过期
  const isOverdue =
    task.dueDate &&
    new Date(task.dueDate) < new Date() &&
    task.status !== 'DONE';

  // 检查任务是否分配给当前用户
  const isAssignedToCurrentUser = task.assignments.some(
    (assignment) => assignment.member.user.id === userId
  );

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={`bg-background cursor-grab rounded-md border p-3 shadow-sm hover:shadow active:cursor-grabbing ${isDragging ? 'shadow-md' : ''} ${isAssignedToCurrentUser ? 'border-l-primary border-l-4' : ''} `}
    >
      <Link
        href={`/dashboard/projects/${projectId}/tasks/${task.id}`}
        className='block'
        onClick={(e) => e.stopPropagation()}
      >
        <div className='flex flex-col gap-2'>
          <div className='flex items-start justify-between'>
            <h4 className='line-clamp-2 text-sm font-medium'>{task.title}</h4>
            <Badge
              variant='outline'
              className={`bg-${TASK_PRIORITY[task.priority as keyof typeof TASK_PRIORITY].color}-100 text-${TASK_PRIORITY[task.priority as keyof typeof TASK_PRIORITY].color}-800 border-${TASK_PRIORITY[task.priority as keyof typeof TASK_PRIORITY].color}-200 ml-1 shrink-0`}
            >
              {getTaskPriorityLabel(
                task.priority as keyof typeof TASK_PRIORITY,
                tasksT
              )}
            </Badge>
          </div>

          {task.description && (
            <p className='text-muted-foreground line-clamp-2 text-xs'>
              {task.description}
            </p>
          )}

          <div className='text-muted-foreground mt-1 flex items-center gap-2 text-xs'>
            {task.dueDate && (
              <div
                className={`flex items-center gap-1 ${isOverdue ? 'text-destructive' : ''}`}
              >
                <CalendarIcon className='h-3 w-3' />
                <span>{format(new Date(task.dueDate), 'MM-dd')}</span>
              </div>
            )}

            {task._count.comments > 0 && (
              <div className='flex items-center gap-1'>
                <MessageSquareIcon className='h-3 w-3' />
                <span>{task._count.comments}</span>
              </div>
            )}

            {task._count.subtasks > 0 && (
              <div className='flex items-center gap-1'>
                <FileIcon className='h-3 w-3' />
                <span>{task._count.subtasks}</span>
              </div>
            )}
          </div>

          {task.assignments.length > 0 && (
            <div className='mt-1 flex items-center justify-end'>
              <div className='flex -space-x-2'>
                {task.assignments.slice(0, 3).map((assignment) => (
                  <Avatar
                    key={assignment.id}
                    className='border-background h-6 w-6 border-2'
                  >
                    <AvatarImage
                      src={assignment.member.user.image || ''}
                      alt={assignment.member.user.name || ''}
                    />
                    <AvatarFallback className='text-[10px]'>
                      {assignment.member.user.name?.charAt(0) ||
                        assignment.member.user.email.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                ))}

                {task.assignments.length > 3 && (
                  <Avatar className='border-background bg-muted h-6 w-6 border-2'>
                    <AvatarFallback className='text-[10px]'>
                      +{task.assignments.length - 3}
                    </AvatarFallback>
                  </Avatar>
                )}
              </div>
            </div>
          )}
        </div>
      </Link>
    </div>
  );
}
