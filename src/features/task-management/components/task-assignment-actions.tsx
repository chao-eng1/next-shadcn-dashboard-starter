'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage
} from '@/components/ui/form';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/use-toast';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Settings, User, RefreshCw } from 'lucide-react';

const statusUpdateFormSchema = z.object({
  toStatus: z.enum(['TODO', 'IN_PROGRESS', 'REVIEW', 'DONE', 'BLOCKED']),
  comment: z.string().optional(),
  assignToId: z.string().optional()
});

type StatusUpdateFormValues = z.infer<typeof statusUpdateFormSchema>;

interface ProjectMember {
  id: string;
  userId: string;
  user: {
    id: string;
    name: string;
    email: string;
    image?: string;
  };
}

interface TaskAssignmentActionsProps {
  projectId: string;
  taskId: string;
  currentStatus: string;
  onStatusUpdate?: () => void;
  projectMembers: ProjectMember[];
}

export function TaskAssignmentActions({
  projectId,
  taskId,
  currentStatus,
  onStatusUpdate,
  projectMembers
}: TaskAssignmentActionsProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [open, setOpen] = useState(false);
  const { toast } = useToast();

  const form = useForm<StatusUpdateFormValues>({
    resolver: zodResolver(statusUpdateFormSchema),
    defaultValues: {
      toStatus: currentStatus as any,
      comment: '',
      assignToId: undefined
    }
  });

  // 所有可用状态选项（无工作流限制）
  const statusOptions = [
    {
      value: 'TODO',
      label: '待办',
      color: 'bg-gray-100 text-gray-800',
      icon: '📋'
    },
    {
      value: 'IN_PROGRESS',
      label: '进行中',
      color: 'bg-blue-100 text-blue-800',
      icon: '🔄'
    },
    {
      value: 'REVIEW',
      label: '待审核',
      color: 'bg-yellow-100 text-yellow-800',
      icon: '👀'
    },
    {
      value: 'DONE',
      label: '已完成',
      color: 'bg-green-100 text-green-800',
      icon: '✅'
    },
    {
      value: 'BLOCKED',
      label: '受阻',
      color: 'bg-red-100 text-red-800',
      icon: '🚫'
    }
  ];

  const getCurrentStatusInfo = () => {
    return statusOptions.find((option) => option.value === currentStatus);
  };

  async function onSubmit(data: StatusUpdateFormValues) {
    setIsSubmitting(true);

    try {
      const response = await fetch(
        `/api/projects/${projectId}/tasks/${taskId}/transitions`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          credentials: 'include',
          body: JSON.stringify(data)
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.message || '更新失败');
      }

      const result = await response.json();

      toast({
        title: '更新成功',
        description: result.message || '任务状态已更新'
      });

      setOpen(false);
      onStatusUpdate?.();

      // 重置表单但保持新状态
      form.reset({
        toStatus: data.toStatus,
        comment: '',
        assignToId: undefined
      });
    } catch (error) {
      console.error('更新任务状态失败:', error);
      toast({
        title: '更新失败',
        description: error instanceof Error ? error.message : '未知错误',
        variant: 'destructive'
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  const currentStatusInfo = getCurrentStatusInfo();

  return (
    <div className='space-y-4'>
      {/* 当前状态显示 */}
      <div className='space-y-2'>
        <h4 className='text-sm font-medium text-gray-700'>当前状态</h4>
        <div className='flex items-center gap-2'>
          <Badge className={currentStatusInfo?.color}>
            <span className='mr-1'>{currentStatusInfo?.icon}</span>
            {currentStatusInfo?.label || currentStatus}
          </Badge>
        </div>
      </div>

      {/* 操作按钮 */}
      <div className='space-y-2'>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button variant='outline' className='w-full'>
              <Settings className='mr-2 h-4 w-4' />
              更新状态与分配
            </Button>
          </DialogTrigger>

          <DialogContent className='sm:max-w-md'>
            <DialogHeader>
              <DialogTitle className='flex items-center gap-2'>
                <RefreshCw className='h-5 w-5' />
                任务状态更新与分配
              </DialogTitle>
              <DialogDescription>
                手动更新任务状态或重新分配任务给团队成员
              </DialogDescription>
            </DialogHeader>

            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className='space-y-4'
              >
                {/* 状态选择 */}
                <FormField
                  control={form.control}
                  name='toStatus'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>新状态</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder='选择任务状态' />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {statusOptions.map((status) => (
                            <SelectItem key={status.value} value={status.value}>
                              <div className='flex items-center gap-2'>
                                <span>{status.icon}</span>
                                <span>{status.label}</span>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* 分配给 */}
                <FormField
                  control={form.control}
                  name='assignToId'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        <div className='flex items-center gap-2'>
                          <User className='h-4 w-4' />
                          重新分配给（可选）
                        </div>
                      </FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder='选择项目成员' />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value=''>不更改分配</SelectItem>
                          {projectMembers.map((member) => (
                            <SelectItem key={member.id} value={member.userId}>
                              <div className='flex items-center gap-2'>
                                <div className='flex h-6 w-6 items-center justify-center rounded-full bg-blue-100 text-xs font-medium text-blue-800'>
                                  {member.user.name?.[0]?.toUpperCase() || 'U'}
                                </div>
                                <div>
                                  <div className='font-medium'>
                                    {member.user.name}
                                  </div>
                                  <div className='text-xs text-gray-500'>
                                    {member.user.email}
                                  </div>
                                </div>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* 备注 */}
                <FormField
                  control={form.control}
                  name='comment'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>备注（可选）</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder='添加状态更新或分配变更的说明...'
                          className='min-h-[80px]'
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <DialogFooter>
                  <Button
                    type='button'
                    variant='outline'
                    onClick={() => setOpen(false)}
                    disabled={isSubmitting}
                  >
                    取消
                  </Button>
                  <Button type='submit' disabled={isSubmitting}>
                    {isSubmitting ? '更新中...' : '确认更新'}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      {/* 快速状态切换按钮 */}
      <div className='space-y-2'>
        <h4 className='text-sm font-medium text-gray-700'>快速状态切换</h4>
        <div className='grid grid-cols-2 gap-2'>
          {statusOptions
            .filter((option) => option.value !== currentStatus)
            .map((status) => (
              <Button
                key={status.value}
                variant='outline'
                size='sm'
                onClick={() => {
                  form.setValue('toStatus', status.value as any);
                  form.setValue('comment', `快速切换到${status.label}`);
                  form.handleSubmit(onSubmit)();
                }}
                disabled={isSubmitting}
                className='justify-start text-xs'
              >
                <span className='mr-1'>{status.icon}</span>
                {status.label}
              </Button>
            ))}
        </div>
      </div>
    </div>
  );
}
