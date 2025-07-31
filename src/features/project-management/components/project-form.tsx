'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
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
import { PROJECT_STATUS, PROJECT_VISIBILITY } from '@/constants/project';
import { toast } from 'sonner';

// 创建表单验证函数，接受翻译函数作为参数
const createProjectFormSchema = (t: (key: string) => string) =>
  z
    .object({
      name: z.string().min(1, t('form.validation.nameRequired')),
      description: z.string().optional(),
      status: z
        .enum(['PLANNING', 'ACTIVE', 'COMPLETED', 'ARCHIVED'])
        .default('PLANNING'),
      visibility: z.enum(['PRIVATE', 'TEAM', 'PUBLIC']).default('PRIVATE'),
      startDate: z.date().optional().nullable(),
      endDate: z.date().optional().nullable()
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
        message: t('form.validation.endDateAfterStart'),
        path: ['endDate']
      }
    );

type ProjectFormValues = z.infer<ReturnType<typeof createProjectFormSchema>>;

interface ProjectFormProps {
  userId: string;
  project?: any; // 如果是编辑模式，传入项目数据
  onSuccess?: (project?: any) => void; // 成功后的回调函数
}

export function ProjectForm({ userId, project, onSuccess }: ProjectFormProps) {
  const router = useRouter();
  const t = useTranslations('projects');
  const tCommon = useTranslations('common');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 创建表单验证schema
  const projectFormSchema = createProjectFormSchema(t);

  // 默认值
  const defaultValues: Partial<ProjectFormValues> = {
    name: project?.name || '',
    description: project?.description || '',
    status: project?.status || 'PLANNING',
    visibility: project?.visibility || 'PRIVATE',
    startDate: project?.startDate ? new Date(project.startDate) : null,
    endDate: project?.endDate ? new Date(project.endDate) : null
  };

  // 表单
  const form = useForm<ProjectFormValues>({
    resolver: zodResolver(projectFormSchema),
    defaultValues,
    mode: 'onChange'
  });

  // 提交表单
  const onSubmit = async (values: ProjectFormValues) => {
    setIsSubmitting(true);

    try {
      // 格式化日期
      const formData = {
        ...values,
        startDate: values.startDate ? values.startDate.toISOString() : null,
        endDate: values.endDate ? values.endDate.toISOString() : null
      };

      // 根据是否有项目ID决定是创建还是更新
      const url = project?.id ? `/api/projects/${project.id}` : '/api/projects';

      const method = project?.id ? 'PATCH' : 'POST';

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
        toast.success(
          project?.id ? t('messages.updated') : t('messages.created')
        );

        // 调用成功回调函数
        if (onSuccess) {
          onSuccess(data.data);
        } else {
          // 创建成功后跳转到项目详情页
          if (!project?.id && data.data?.id) {
            router.push(`/dashboard/projects/${data.data.id}`);
          } else {
            router.push('/dashboard/projects');
          }
        }

        // 刷新页面数据
        router.refresh();
      } else {
        throw new Error(data.error?.message || t('messages.createFailed'));
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : tCommon('error'));
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
              <FormLabel>{t('form.name')}</FormLabel>
              <FormControl>
                <Input placeholder={t('form.placeholder.name')} {...field} />
              </FormControl>
              <FormDescription>{t('form.description.name')}</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name='description'
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('form.description')}</FormLabel>
              <FormControl>
                <Textarea
                  placeholder={t('form.placeholder.description')}
                  className='min-h-[100px]'
                  {...field}
                  value={field.value || ''}
                />
              </FormControl>
              <FormDescription>
                {t('form.description.description')}
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className='grid grid-cols-1 gap-6 md:grid-cols-2'>
          <FormField
            control={form.control}
            name='status'
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('form.status')}</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue
                        placeholder={t('form.placeholder.selectStatus')}
                      />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {Object.entries(PROJECT_STATUS).map(
                      ([key, { key: statusKey }]) => (
                        <SelectItem key={key} value={key}>
                          {t(`status.${statusKey}`)}
                        </SelectItem>
                      )
                    )}
                  </SelectContent>
                </Select>
                <FormDescription>
                  {t('form.description.status')}
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name='visibility'
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('form.visibility')}</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue
                        placeholder={t('form.placeholder.selectVisibility')}
                      />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {Object.entries(PROJECT_VISIBILITY).map(
                      ([key, { key: visibilityKey, descriptionKey }]) => (
                        <SelectItem key={key} value={key}>
                          {t(`visibility.${visibilityKey}`)}
                        </SelectItem>
                      )
                    )}
                  </SelectContent>
                </Select>
                <FormDescription>
                  {t('form.description.visibility')}
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className='grid grid-cols-1 gap-6 md:grid-cols-2'>
          <FormField
            control={form.control}
            name='startDate'
            render={({ field }) => (
              <FormItem className='flex flex-col'>
                <FormLabel>{t('form.startDate')}</FormLabel>
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
                          <span>{t('form.placeholder.selectDate')}</span>
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
                <FormDescription>
                  {t('form.description.startDate')}
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name='endDate'
            render={({ field }) => (
              <FormItem className='flex flex-col'>
                <FormLabel>{t('form.endDate')}</FormLabel>
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
                          <span>{t('form.placeholder.selectDate')}</span>
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
                <FormDescription>
                  {t('form.description.endDate')}
                </FormDescription>
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
              onSuccess ? onSuccess() : router.push('/dashboard/projects')
            }
            disabled={isSubmitting}
          >
            {tCommon('cancel')}
          </Button>
          <Button type='submit' disabled={isSubmitting}>
            {isSubmitting && <Loader2 className='mr-2 h-4 w-4 animate-spin' />}
            {project?.id ? t('edit') : t('create')}
          </Button>
        </div>
      </form>
    </Form>
  );
}
