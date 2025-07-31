'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import {
  DndContext,
  DragOverlay,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragStartEvent,
  DragEndEvent,
  DragOverEvent
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  rectSortingStrategy
} from '@dnd-kit/sortable';
import { restrictToWindowEdges } from '@dnd-kit/modifiers';

import { KanbanColumn } from './kanban-column';
import { KanbanCard } from './kanban-card';
import { TASK_STATUS } from '@/constants/project';
import { getTaskStatusLabel } from '@/lib/status-labels';
import { Button } from '@/components/ui/button';
import { PlusIcon, RefreshCwIcon } from 'lucide-react';
import { toast } from 'sonner';
import Link from 'next/link';

interface Task {
  id: string;
  title: string;
  description: string | null;
  status: keyof typeof TASK_STATUS;
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

interface KanbanBoardProps {
  projectId: string;
  userId: string;
  initialTasks: Task[];
  canCreateTask: boolean;
}

export function KanbanBoard({
  projectId,
  userId,
  initialTasks,
  canCreateTask
}: KanbanBoardProps) {
  const [tasks, setTasks] = useState<Task[]>(initialTasks);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const t = useTranslations('kanban');
  const commonT = useTranslations('common');
  const tasksT = useTranslations('tasks');

  // 按状态分组任务
  const columns = Object.keys(TASK_STATUS) as (keyof typeof TASK_STATUS)[];
  const tasksByStatus = columns.reduce(
    (acc, status) => {
      acc[status] = tasks.filter((task) => task.status === status);
      return acc;
    },
    {} as Record<keyof typeof TASK_STATUS, Task[]>
  );

  // 定义拖拽传感器
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8
      }
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates
    })
  );

  // 拖拽开始
  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    setActiveId(active.id as string);
  };

  // 拖拽结束
  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over) {
      setActiveId(null);
      return;
    }

    // 找到被拖拽的任务
    const taskId = active.id as string;
    const task = tasks.find((t) => t.id === taskId);

    if (!task) {
      setActiveId(null);
      return;
    }

    // 获取目标列ID（状态）
    const targetStatus = over.id as keyof typeof TASK_STATUS;

    // 如果状态没有改变，不做任何操作
    if (task.status === targetStatus) {
      setActiveId(null);
      return;
    }

    // 乐观地更新UI
    setTasks((prevTasks) =>
      prevTasks.map((t) =>
        t.id === taskId ? { ...t, status: targetStatus } : t
      )
    );

    setActiveId(null);

    // 获取任务的实际项目 ID
    const taskProjectId = task.projectId || projectId;

    // 向API发送更新请求
    try {
      const response = await fetch(
        `/api/projects/${taskProjectId}/tasks/${taskId}`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            status: targetStatus,
            ...(targetStatus === 'DONE'
              ? { completedAt: new Date().toISOString() }
              : {})
          })
        }
      );

      if (!response.ok) {
        throw new Error(t('messages.updateFailed'));
      }

      // 更新成功，显示提示
      toast.success(
        t('messages.taskMoved', {
          status: getTaskStatusLabel(targetStatus, tasksT)
        })
      );
    } catch (error) {
      // 如果失败，恢复原始状态
      setTasks((prevTasks) =>
        prevTasks.map((t) =>
          t.id === taskId ? { ...t, status: task.status } : t
        )
      );

      toast.error(t('messages.updateFailed'));
      console.error(t('messages.updateFailed'), error);
    }
  };

  // 刷新任务列表
  const refreshTasks = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/projects/${projectId}/tasks`);

      if (!response.ok) {
        throw new Error(t('messages.loadFailed'));
      }

      const data = await response.json();

      if (data.success) {
        setTasks(data.data.tasks);
      } else {
        throw new Error(t('messages.loadFailed'));
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : commonT('error'));
    } finally {
      setIsLoading(false);
    }
  };

  // 当projectId变化时刷新任务列表
  useEffect(() => {
    // 重置刷新加载状态
    setTasks(initialTasks);

    // 如果有具体的项目 ID，加载该项目的任务
    if (projectId) {
      refreshTasks();
    }
  }, [projectId, initialTasks]);

  // 获取当前活动任务
  const activeTask = activeId
    ? tasks.find((task) => task.id === activeId)
    : null;

  return (
    <div className='space-y-4'>
      <div className='flex items-center justify-between'>
        <h3 className='text-lg font-medium'>{t('taskBoard')}</h3>
        <div className='flex gap-2'>
          <Button
            variant='outline'
            size='sm'
            onClick={refreshTasks}
            disabled={isLoading}
          >
            <RefreshCwIcon
              className={`mr-2 h-4 w-4 ${isLoading ? 'animate-spin' : ''}`}
            />
            {commonT('refresh')}
          </Button>

          {canCreateTask && (
            <Button size='sm' asChild>
              <Link
                href={
                  projectId
                    ? `/dashboard/projects/${projectId}/tasks/new?returnTo=/dashboard/kanban`
                    : `/dashboard/tasks/new?returnTo=/dashboard/kanban`
                }
              >
                <PlusIcon className='mr-2 h-4 w-4' />
                {t('createTask')}
              </Link>
            </Button>
          )}
        </div>
      </div>

      {error && (
        <div className='bg-destructive/15 text-destructive rounded-md p-4'>
          {error}
        </div>
      )}

      <div className='grid grid-cols-1 gap-4 md:grid-cols-3 lg:grid-cols-5'>
        <DndContext
          sensors={sensors}
          collisionDetection={closestCorners}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          {columns.map((status) => (
            <KanbanColumn
              key={status}
              id={status}
              title={getTaskStatusLabel(status, tasksT)}
              color={TASK_STATUS[status].color}
              tasks={tasksByStatus[status] || []}
              projectId={projectId}
            />
          ))}

          <DragOverlay modifiers={[restrictToWindowEdges]}>
            {activeId && activeTask ? (
              <div className='w-[250px]'>
                <KanbanCard
                  task={activeTask}
                  projectId={projectId}
                  userId={userId}
                />
              </div>
            ) : null}
          </DragOverlay>
        </DndContext>
      </div>
    </div>
  );
}
