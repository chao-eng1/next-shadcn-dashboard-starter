'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { CalendarIcon, Loader2 } from 'lucide-react';
import { format } from 'date-fns';

import { Button } from '@/components/ui/button';
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
import { cn } from '@/lib/utils';
import { SPRINT_STATUS } from '@/constants/project';
import { toast } from 'sonner';

// 迭代表单验证
const sprintFormSchema = z
  .object({
    name: z.string().min(1, '迭代名称不能为空'),
    description: z.string().optional(),
    status: z
      .enum(['PLANNED', 'ACTIVE', 'COMPLETED', 'CANCELLED'])
      .default('PLANNED'),
    startDate: z.date().optional().nullable(),
    endDate: z.date().optional().nullable(),
    goal: z.string().optional()
  })
  .refine(
    (data) => {
      // 如果设置了结束日期，且设置了开始日期，则结束日期必须晚于开始日期
      if (data.startDate && data.endDate) {
        return data.endDate > data.startDate;
      }
      return true;
    },
    {
      message: '结束日期必须晚于开始日期',
      path: ['endDate']
    }
  );

type SprintFormValues = z.infer<typeof sprintFormSchema>;

interface SprintFormProps {
  projectId: string;
  sprint?: any; // 如果是编辑模式，传入迭代数据
}

export function SprintForm({ projectId, sprint }: SprintFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const t = useTranslations('sprints');

  // 默认值
  const defaultValues: Partial<SprintFormValues> = {
    name: sprint?.name || '',
    description: sprint?.description || '',
    status: sprint?.status || 'PLANNED',
    startDate: sprint?.startDate ? new Date(sprint.startDate) : null,
    endDate: sprint?.endDate ? new Date(sprint.endDate) : null,
    goal: sprint?.goal || ''
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

      // 根据是否有迭代ID决定是创建还是更新
      const url = sprint?.id
        ? `/api/projects/${projectId}/sprints/${sprint.id}`
        : `/api/projects/${projectId}/sprints`;

      const method = sprint?.id ? 'PATCH' : 'POST';

      // 发送请求
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });

      const data = await response.json();

      if (data.success) {
        toast.success(sprint?.id ? '迭代已更新' : '迭代已创建');

        // 创建成功后跳转到迭代详情页
        if (!sprint?.id && data.data?.id) {
          router.push(
            `/dashboard/projects/${projectId}/sprints/${data.data.id}`
          );
        } else {
          router.push(`/dashboard/projects/${projectId}/sprints`);
        }

        // 刷新页面数据
        router.refresh();
      } else {
        throw new Error(data.error?.message || '操作失败');
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : '未知错误');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-6'>
        <FormField
          control={form.control}
          name='name'
          render={({ field }) => (
            <FormItem>
              <FormLabel>迭代名称</FormLabel>
              <FormControl>
                <Input placeholder='输入迭代名称，例如：Sprint 1' {...field} />
              </FormControl>
              <FormDescription>迭代的显示名称</FormDescription>
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
                  placeholder='输入迭代目标，例如：完成用户认证功能'
                  {...field}
                  value={field.value || ''}
                />
              </FormControl>
              <FormDescription>迭代的主要目标</FormDescription>
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
                  placeholder='输入迭代描述'
                  className='min-h-[100px]'
                  {...field}
                  value={field.value || ''}
                />
              </FormControl>
              <FormDescription>详细说明迭代的内容、目标和要求</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className='grid grid-cols-1 gap-6 md:grid-cols-3'>
          <FormField
            control={form.control}
            name='status'
            render={({ field }) => (
              <FormItem>
                <FormLabel>迭代状态</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder='选择迭代状态' />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {Object.entries(SPRINT_STATUS).map(
                      ([key, { key: statusKey }]) => (
                        <SelectItem key={key} value={key}>
                          {t(`status.${statusKey}`)}
                        </SelectItem>
                      )
                    )}
                  </SelectContent>
                </Select>
                <FormDescription>迭代的当前状态</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

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
                          'pl-3 text-left font-normal',
                          !field.value && 'text-muted-foreground'
                        )}
                      >
                        {field.value ? (
                          format(field.value, 'yyyy-MM-dd')
                        ) : (
                          <span>选择日期</span>
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
                    />
                  </PopoverContent>
                </Popover>
                <FormDescription>迭代的计划开始日期</FormDescription>
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
                          'pl-3 text-left font-normal',
                          !field.value && 'text-muted-foreground'
                        )}
                      >
                        {field.value ? (
                          format(field.value, 'yyyy-MM-dd')
                        ) : (
                          <span>选择日期</span>
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
                    />
                  </PopoverContent>
                </Popover>
                <FormDescription>迭代的计划结束日期</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className='flex justify-end gap-4'>
          <Button
            type='button'
            variant='outline'
            onClick={() =>
              router.push(`/dashboard/projects/${projectId}/sprints`)
            }
            disabled={isSubmitting}
          >
            取消
          </Button>
          <Button type='submit' disabled={isSubmitting}>
            {isSubmitting && <Loader2 className='mr-2 h-4 w-4 animate-spin' />}
            {sprint?.id ? '更新迭代' : '创建迭代'}
          </Button>
        </div>
      </form>
    </Form>
  );
}
