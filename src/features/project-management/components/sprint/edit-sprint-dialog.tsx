'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  CalendarIcon,
  Loader2,
  Edit2Icon,
  TargetIcon,
  CalendarDaysIcon,
  PlayIcon,
  CheckIcon,
  XIcon,
  AlertTriangleIcon
} from 'lucide-react';
import { format } from 'date-fns';
import { zhCN } from 'date-fns/locale/zh-CN';

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
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import {
  Popover,
  PopoverContent,
  PopoverTrigger
} from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import { SPRINT_STATUS } from '@/constants/project';
import { toast } from 'sonner';

// 迭代表单验证
const sprintFormSchema = z
  .object({
    name: z.string().min(1, '迭代名称不能为空'),
    description: z.string().optional(),
    goal: z.string().optional(),
    status: z
      .enum(['PLANNED', 'ACTIVE', 'COMPLETED', 'CANCELLED'])
      .default('PLANNED'),
    startDate: z.date().optional().nullable(),
    endDate: z.date().optional().nullable()
  })
  .refine(
    (data) => {
      if (data.startDate && data.endDate) {
        return data.startDate <= data.endDate;
      }
      return true;
    },
    {
      message: '结束日期不能早于开始日期',
      path: ['endDate']
    }
  );

type SprintFormValues = z.infer<typeof sprintFormSchema>;

interface EditSprintDialogProps {
  projectId: string;
  sprint: {
    id: string;
    name: string;
    description: string | null;
    goal: string | null;
    status: string;
    startDate: Date | null;
    endDate: Date | null;
  };
  children?: React.ReactNode;
  triggerClassName?: string;
}

export function EditSprintDialog({
  projectId,
  sprint,
  children,
  triggerClassName
}: EditSprintDialogProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 默认值
  const defaultValues: Partial<SprintFormValues> = {
    name: sprint.name,
    description: sprint.description || '',
    goal: sprint.goal || '',
    status: sprint.status as any,
    startDate: sprint.startDate ? new Date(sprint.startDate) : null,
    endDate: sprint.endDate ? new Date(sprint.endDate) : null
  };

  // 表单
  const form = useForm<SprintFormValues>({
    resolver: zodResolver(sprintFormSchema),
    defaultValues,
    mode: 'onChange'
  });

  // 提交表单
  const onSubmit = async (values: SprintFormValues) => {
    setIsSubmitting(true);

    try {
      // 格式化日期
      const formData = {
        ...values,
        startDate: values.startDate ? values.startDate.toISOString() : null,
        endDate: values.endDate ? values.endDate.toISOString() : null
      };

      const response = await fetch(
        `/api/projects/${projectId}/sprints/${sprint.id}`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(formData)
        }
      );

      const data = await response.json();

      if (data.success) {
        toast.success('迭代已更新');
        setOpen(false);
        router.refresh();
      } else {
        throw new Error(data.error?.message || '更新失败');
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : '未知错误');
    } finally {
      setIsSubmitting(false);
    }
  };

  // 获取状态图标和颜色
  const getStatusInfo = (status: string) => {
    switch (status) {
      case 'PLANNED':
        return { icon: CalendarDaysIcon, color: 'blue' };
      case 'ACTIVE':
        return { icon: PlayIcon, color: 'green' };
      case 'COMPLETED':
        return { icon: CheckIcon, color: 'emerald' };
      case 'CANCELLED':
        return { icon: XIcon, color: 'red' };
      default:
        return { icon: CalendarDaysIcon, color: 'gray' };
    }
  };

  const statusInfo = getStatusInfo(form.watch('status'));
  const StatusIcon = statusInfo.icon;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children || (
          <Button className={triggerClassName}>
            <Edit2Icon className='mr-2 h-4 w-4' />
            编辑迭代
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className='max-h-[90vh] overflow-y-auto sm:max-w-[600px]'>
        <DialogHeader>
          <DialogTitle className='flex items-center gap-2 text-xl'>
            <Edit2Icon className='text-primary h-5 w-5' />
            编辑迭代
          </DialogTitle>
          <DialogDescription>
            修改迭代的基本信息、状态和时间安排
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-6'>
            {/* 基本信息区域 */}
            <div className='space-y-4'>
              <div className='text-muted-foreground flex items-center gap-2 text-sm font-medium'>
                <TargetIcon className='h-4 w-4' />
                基本信息
              </div>

              <div className='grid gap-4'>
                <FormField
                  control={form.control}
                  name='name'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>迭代名称 *</FormLabel>
                      <FormControl>
                        <Input
                          placeholder='输入迭代名称'
                          {...field}
                          className='focus:ring-primary/20 transition-all focus:ring-2'
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name='goal'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>迭代目标</FormLabel>
                      <FormControl>
                        <Input
                          placeholder='输入迭代目标（可选）'
                          {...field}
                          value={field.value || ''}
                          className='focus:ring-primary/20 transition-all focus:ring-2'
                        />
                      </FormControl>
                      <FormDescription>简明扼要的迭代目标</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name='description'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>迭代描述</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder='输入迭代描述（可选）'
                          className='focus:ring-primary/20 min-h-[80px] transition-all focus:ring-2'
                          {...field}
                          value={field.value || ''}
                        />
                      </FormControl>
                      <FormDescription>
                        详细说明迭代的内容和要求
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            <Separator />

            {/* 状态和时间区域 */}
            <div className='space-y-4'>
              <div className='text-muted-foreground flex items-center gap-2 text-sm font-medium'>
                <StatusIcon className='h-4 w-4' />
                状态和时间
              </div>

              <div className='grid gap-4'>
                <FormField
                  control={form.control}
                  name='status'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>迭代状态</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger className='focus:ring-primary/20 transition-all focus:ring-2'>
                            <SelectValue placeholder='选择迭代状态' />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {Object.entries(SPRINT_STATUS).map(
                            ([key, { label }]) => {
                              const info = getStatusInfo(key);
                              const Icon = info.icon;
                              return (
                                <SelectItem key={key} value={key}>
                                  <div className='flex items-center gap-2'>
                                    <Icon
                                      className={`h-4 w-4 text-${info.color}-500`}
                                    />
                                    <span>{label}</span>
                                  </div>
                                </SelectItem>
                              );
                            }
                          )}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className='grid grid-cols-1 gap-4 sm:grid-cols-2'>
                  <FormField
                    control={form.control}
                    name='startDate'
                    render={({ field }) => (
                      <FormItem className='flex flex-col'>
                        <FormLabel>开始日期</FormLabel>
                        <Popover>
                          <PopoverTrigger asChild>
                            <FormControl>
                              <Button
                                variant={'outline'}
                                className={cn(
                                  'focus:ring-primary/20 pl-3 text-left font-normal transition-all focus:ring-2',
                                  !field.value && 'text-muted-foreground'
                                )}
                              >
                                {field.value ? (
                                  format(field.value, 'yyyy年MM月dd日', {
                                    locale: zhCN
                                  })
                                ) : (
                                  <span>选择开始日期</span>
                                )}
                                <CalendarIcon className='ml-auto h-4 w-4 opacity-50' />
                              </Button>
                            </FormControl>
                          </PopoverTrigger>
                          <PopoverContent className='w-auto p-0' align='start'>
                            <Calendar
                              mode='single'
                              selected={field.value || undefined}
                              onSelect={(date) => field.onChange(date)}
                              initialFocus
                              locale={zhCN}
                            />
                          </PopoverContent>
                        </Popover>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name='endDate'
                    render={({ field }) => (
                      <FormItem className='flex flex-col'>
                        <FormLabel>结束日期</FormLabel>
                        <Popover>
                          <PopoverTrigger asChild>
                            <FormControl>
                              <Button
                                variant={'outline'}
                                className={cn(
                                  'focus:ring-primary/20 pl-3 text-left font-normal transition-all focus:ring-2',
                                  !field.value && 'text-muted-foreground'
                                )}
                              >
                                {field.value ? (
                                  format(field.value, 'yyyy年MM月dd日', {
                                    locale: zhCN
                                  })
                                ) : (
                                  <span>选择结束日期</span>
                                )}
                                <CalendarIcon className='ml-auto h-4 w-4 opacity-50' />
                              </Button>
                            </FormControl>
                          </PopoverTrigger>
                          <PopoverContent className='w-auto p-0' align='start'>
                            <Calendar
                              mode='single'
                              selected={field.value || undefined}
                              onSelect={(date) => field.onChange(date)}
                              initialFocus
                              locale={zhCN}
                            />
                          </PopoverContent>
                        </Popover>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* 状态预览 */}
                <div className='bg-muted/50 rounded-lg p-4'>
                  <div className='flex items-center justify-between'>
                    <span className='text-sm font-medium'>当前状态预览</span>
                    <Badge
                      variant='outline'
                      className={`bg-${statusInfo.color}-50 text-${statusInfo.color}-700 border-${statusInfo.color}-200 dark:bg-${statusInfo.color}-900/20 dark:text-${statusInfo.color}-400`}
                    >
                      {
                        SPRINT_STATUS[
                          form.watch('status') as keyof typeof SPRINT_STATUS
                        ]?.label
                      }
                    </Badge>
                  </div>
                </div>
              </div>
            </div>

            <DialogFooter className='gap-2 pt-4'>
              <Button
                type='button'
                variant='outline'
                onClick={() => setOpen(false)}
                disabled={isSubmitting}
              >
                取消
              </Button>
              <Button type='submit' disabled={isSubmitting}>
                {isSubmitting && (
                  <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                )}
                保存更改
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
