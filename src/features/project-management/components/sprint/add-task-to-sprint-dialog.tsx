'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  PlusIcon,
  SearchIcon,
  AlertTriangleIcon,
  MoveIcon,
  Loader2
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { TASK_STATUS, TASK_PRIORITY } from '@/constants/project';
import { toast } from 'sonner';
import { useTranslations } from 'next-intl';

interface Task {
  id: string;
  title: string;
  description: string | null;
  status: string;
  priority: string;
  sprintId: string | null;
  sprint?: {
    id: string;
    name: string;
  } | null;
  assignments: Array<{
    member: {
      user: {
        id: string;
        name: string | null;
        email: string;
        image: string | null;
      };
    };
  }>;
}

interface AddTaskToSprintDialogProps {
  projectId: string;
  sprintId: string;
  sprintName: string;
  availableTasks: Task[];
  children?: React.ReactNode;
}

export function AddTaskToSprintDialog({
  projectId,
  sprintId,
  sprintName,
  availableTasks,
  children
}: AddTaskToSprintDialogProps) {
  const router = useRouter();
  const t = useTranslations('sprints');
  const tc = useTranslations('common');
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTasks, setSelectedTasks] = useState<string[]>([]);
  const [taskToMove, setTaskToMove] = useState<Task | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 过滤任务
  const filteredTasks = availableTasks.filter(
    (task) =>
      task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      task.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // 未分配到迭代的任务
  const unassignedTasks = filteredTasks.filter((task) => !task.sprintId);

  // 分配到其他迭代的任务
  const assignedTasks = filteredTasks.filter(
    (task) => task.sprintId && task.sprintId !== sprintId
  );

  const handleTaskSelection = (taskId: string) => {
    setSelectedTasks((prev) =>
      prev.includes(taskId)
        ? prev.filter((id) => id !== taskId)
        : [...prev, taskId]
    );
  };

  const handleMoveTask = (task: Task) => {
    setTaskToMove(task);
  };

  const confirmMoveTask = async () => {
    if (!taskToMove) return;

    setIsSubmitting(true);
    try {
      const response = await fetch(
        `/api/projects/${projectId}/tasks/${taskToMove.id}`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            sprintId: sprintId
          })
        }
      );

      const data = await response.json();
      if (data.success) {
        toast.success(`任务已移入迭代 &ldquo;${sprintName}&rdquo;`);
        setTaskToMove(null);
        router.refresh();
      } else {
        throw new Error(data.error?.message || '移动任务失败');
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : '未知错误');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddTasks = async () => {
    if (selectedTasks.length === 0) return;

    setIsSubmitting(true);
    try {
      const promises = selectedTasks.map((taskId) =>
        fetch(`/api/projects/${projectId}/tasks/${taskId}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            sprintId: sprintId
          })
        })
      );

      const responses = await Promise.all(promises);
      const results = await Promise.all(responses.map((r) => r.json()));

      const successCount = results.filter((r) => r.success).length;
      const failureCount = results.length - successCount;

      if (successCount > 0) {
        toast.success(`成功添加 ${successCount} 个任务到迭代`);
      }
      if (failureCount > 0) {
        toast.error(`${failureCount} 个任务添加失败`);
      }

      setSelectedTasks([]);
      setOpen(false);
      router.refresh();
    } catch (error) {
      toast.error('添加任务失败');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCreateNewTask = () => {
    router.push(
      `/dashboard/projects/${projectId}/tasks/new?sprintId=${sprintId}`
    );
  };

  return (
    <>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          {children || (
            <Button>
              <PlusIcon className='mr-2 h-4 w-4' />
              添加任务
            </Button>
          )}
        </DialogTrigger>
        <DialogContent className='flex max-h-[80vh] flex-col overflow-hidden sm:max-w-[700px]'>
          <DialogHeader>
            <DialogTitle>添加任务到迭代</DialogTitle>
            <DialogDescription>
              选择已有任务或创建新任务添加到迭代 &ldquo;{sprintName}&rdquo;
            </DialogDescription>
          </DialogHeader>

          <Tabs
            defaultValue='existing'
            className='flex flex-1 flex-col overflow-hidden'
          >
            <TabsList className='grid w-full grid-cols-2'>
              <TabsTrigger value='existing'>选择已有任务</TabsTrigger>
              <TabsTrigger value='new'>创建新任务</TabsTrigger>
            </TabsList>

            <TabsContent
              value='existing'
              className='flex flex-1 flex-col space-y-4 overflow-hidden'
            >
              {/* 搜索框 */}
              <div className='relative'>
                <SearchIcon className='text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 transform' />
                <Input
                  placeholder='搜索任务...'
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className='pl-10'
                />
              </div>

              <div className='flex-1 space-y-4 overflow-y-auto'>
                {/* 未分配的任务 */}
                {unassignedTasks.length > 0 && (
                  <div className='space-y-2'>
                    <h3 className='text-muted-foreground text-sm font-medium'>
                      {t('unassignedTasks')} ({unassignedTasks.length})
                    </h3>
                    <div className='space-y-2'>
                      {unassignedTasks.map((task) => (
                        <TaskCard
                          key={task.id}
                          task={task}
                          isSelected={selectedTasks.includes(task.id)}
                          onSelect={() => handleTaskSelection(task.id)}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {/* 分配到其他迭代的任务 */}
                {assignedTasks.length > 0 && (
                  <div className='space-y-2'>
                    <h3 className='text-muted-foreground text-sm font-medium'>
                      {t('otherSprintTasks')} ({assignedTasks.length})
                    </h3>
                    <div className='space-y-2'>
                      {assignedTasks.map((task) => (
                        <TaskCard
                          key={task.id}
                          task={task}
                          showMoveAction={true}
                          onMove={() => handleMoveTask(task)}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {filteredTasks.length === 0 && (
                  <div className='text-muted-foreground py-8 text-center'>
                    {searchQuery
                      ? t('noMatchingTasks')
                      : t('noAvailableTasks')}
                  </div>
                )}
              </div>

              {selectedTasks.length > 0 && (
                <div className='flex items-center justify-between border-t pt-4'>
                  <span className='text-muted-foreground text-sm'>
                    {t('selectedTasks', { count: selectedTasks.length })}
                  </span>
                  <Button onClick={handleAddTasks} disabled={isSubmitting}>
                    {isSubmitting && (
                      <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                    )}
                    添加到迭代
                  </Button>
                </div>
              )}
            </TabsContent>

            <TabsContent
              value='new'
              className='flex flex-1 flex-col items-center justify-center space-y-4'
            >
              <div className='space-y-4 text-center'>
                <div className='bg-primary/10 mx-auto flex h-16 w-16 items-center justify-center rounded-full'>
                  <PlusIcon className='text-primary h-8 w-8' />
                </div>
                <div>
                  <h3 className='text-lg font-semibold'>创建新任务</h3>
                  <p className='text-muted-foreground'>
                    创建一个新任务并直接添加到当前迭代
                  </p>
                </div>
                <Button onClick={handleCreateNewTask} size='lg'>
                  <PlusIcon className='mr-2 h-4 w-4' />
                  创建新任务
                </Button>
              </div>
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>

      {/* 移动任务确认对话框 */}
      {taskToMove && (
        <Dialog open={!!taskToMove} onOpenChange={() => setTaskToMove(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className='flex items-center gap-2'>
                <MoveIcon className='h-5 w-5 text-orange-500' />
                移动任务到当前迭代
              </DialogTitle>
              <DialogDescription>
                确认将任务移动到迭代 &ldquo;{sprintName}&rdquo; 吗？
              </DialogDescription>
            </DialogHeader>

            <div className='space-y-4'>
              <Alert>
                <AlertTriangleIcon className='h-4 w-4' />
                <AlertDescription>
                  任务 &ldquo;{taskToMove.title}&rdquo; 当前属于迭代 &ldquo;
                  {taskToMove.sprint?.name}&rdquo;， 移动后将从原迭代中移除。
                </AlertDescription>
              </Alert>

              <div className='bg-muted/50 rounded-lg border p-4'>
                <div className='space-y-2'>
                  <h4 className='font-medium'>{taskToMove.title}</h4>
                  {taskToMove.description && (
                    <p className='text-muted-foreground line-clamp-2 text-sm'>
                      {taskToMove.description}
                    </p>
                  )}
                  <div className='flex items-center gap-2'>
                    <Badge variant='outline'>
                      {
                        TASK_STATUS[
                          taskToMove.status as keyof typeof TASK_STATUS
                        ]?.label
                      }
                    </Badge>
                    <Badge variant='outline'>
                      {
                        TASK_PRIORITY[
                          taskToMove.priority as keyof typeof TASK_PRIORITY
                        ]?.label
                      }
                    </Badge>
                  </div>
                </div>
              </div>
            </div>

            <div className='flex justify-end gap-2'>
              <Button variant='outline' onClick={() => setTaskToMove(null)}>
                取消
              </Button>
              <Button onClick={confirmMoveTask} disabled={isSubmitting}>
                {isSubmitting && (
                  <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                )}
                <MoveIcon className='mr-2 h-4 w-4' />
                确认移动
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}

// 任务卡片组件
function TaskCard({
  task,
  isSelected = false,
  showMoveAction = false,
  onSelect,
  onMove
}: {
  task: Task;
  isSelected?: boolean;
  showMoveAction?: boolean;
  onSelect?: () => void;
  onMove?: () => void;
}) {
  return (
    <div
      className={`cursor-pointer rounded-lg border p-3 transition-colors ${
        isSelected
          ? 'border-primary bg-primary/5'
          : 'border-border hover:bg-muted/50'
      }`}
      onClick={onSelect}
    >
      <div className='flex items-start justify-between gap-3'>
        <div className='min-w-0 flex-1'>
          <div className='mb-2 flex items-center gap-2'>
            <h4 className='truncate font-medium'>{task.title}</h4>
            {showMoveAction && task.sprint && (
              <Badge variant='secondary' className='text-xs'>
                {task.sprint.name}
              </Badge>
            )}
          </div>

          {task.description && (
            <p className='text-muted-foreground mb-2 line-clamp-2 text-sm'>
              {task.description}
            </p>
          )}

          <div className='flex items-center gap-2'>
            <Badge variant='outline' className='text-xs'>
              {TASK_STATUS[task.status as keyof typeof TASK_STATUS]?.label}
            </Badge>
            <Badge variant='outline' className='text-xs'>
              {
                TASK_PRIORITY[task.priority as keyof typeof TASK_PRIORITY]
                  ?.label
              }
            </Badge>
          </div>
        </div>

        <div className='flex items-center gap-2'>
          {task.assignments.length > 0 && (
            <div className='flex -space-x-1'>
              {task.assignments.slice(0, 2).map((assignment, index) => (
                <Avatar
                  key={index}
                  className='border-background h-6 w-6 border-2'
                >
                  {assignment.member.user.image ? (
                    <AvatarImage src={assignment.member.user.image} />
                  ) : (
                    <AvatarFallback className='text-xs'>
                      {(
                        assignment.member.user.name ||
                        assignment.member.user.email
                      )
                        .charAt(0)
                        .toUpperCase()}
                    </AvatarFallback>
                  )}
                </Avatar>
              ))}
              {task.assignments.length > 2 && (
                <div className='bg-muted border-background flex h-6 w-6 items-center justify-center rounded-full border-2 text-xs'>
                  +{task.assignments.length - 2}
                </div>
              )}
            </div>
          )}

          {showMoveAction && (
            <Button
              size='sm'
              variant='outline'
              onClick={(e) => {
                e.stopPropagation();
                onMove?.();
              }}
            >
              <MoveIcon className='h-3 w-3' />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
