'use client';

import dynamic from 'next/dynamic';
import { Skeleton } from '@/components/ui/skeleton';

// Import the client-side component with dynamic import and disable SSR
const ClientKanbanCard = dynamic(
  () => import('./client-kanban-card').then((mod) => mod.ClientKanbanCard),
  {
    ssr: false,
    loading: () => (
      <div className='bg-background rounded-md border p-3 shadow-sm'>
        <div className='flex flex-col gap-2'>
          <div className='flex items-start justify-between'>
            <Skeleton className='h-4 w-[70%]' />
            <Skeleton className='h-4 w-[20%]' />
          </div>
          <Skeleton className='h-3 w-full' />
          <div className='mt-1 flex items-center gap-2'>
            <Skeleton className='h-3 w-[20%]' />
            <Skeleton className='h-3 w-[20%]' />
          </div>
          <div className='mt-1 flex items-center justify-end'>
            <div className='flex -space-x-2'>
              <Skeleton className='h-6 w-6 rounded-full' />
              <Skeleton className='h-6 w-6 rounded-full' />
            </div>
          </div>
        </div>
      </div>
    )
  }
);

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

export function KanbanCard(props: KanbanCardProps) {
  return <ClientKanbanCard {...props} />;
}
