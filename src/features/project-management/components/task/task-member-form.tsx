'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { CalendarIcon, Loader2, Users } from 'lucide-react';
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
import { TASK_STATUS, TASK_PRIORITY } from '@/constants/project';
import { toast } from 'sonner';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList
} from '@/components/ui/command';

// 任务表单验证
const taskFormSchema = z.object({
  title: z.string().min(1, '任务标题不能为空'),
  description: z.string().optional(),
  status: z
    .enum(['TODO', 'IN_PROGRESS', 'REVIEW', 'DONE', 'BLOCKED'])
    .default('TODO'),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).default('MEDIUM'),
  dueDate: z.date().optional().nullable(),
  estimatedHours: z.coerce.number().min(0).optional().nullable(),
  parentTaskId: z.string().optional().nullable(),
  sprintId: z.string().optional().nullable(),
  assignToMemberId: z.string().optional().nullable(),
  assignSelf: z.boolean().default(false)
});

type TaskFormValues = z.infer<typeof taskFormSchema>;

interface ProjectMember {
  id: string;
  userId: string;
  role: string;
  user: {
    id: string;
    name: string;
    email?: string;
    image?: string;
  };
}

interface TaskMemberFormProps {
  projectId?: string;
  projects?: {
    id: string;
    name: string;
    status: string;
  }[];
  projectMembers: ProjectMember[];
  sprints: {
    id: string;
    name: string;
    status: string;
    projectId?: string;
    project?: {
      name: string;
    };
  }[];
  tasks?: {
    id: string;
    title: string;
    projectId?: string;
    project?: {
      name: string;
    };
  }[];
  parentTaskId?: string;
  task?: any; // 如果是编辑模式，传入任务数据
  returnTo?: string; // 创建任务后的返回地址
}

export function TaskMemberForm({
  projectId,
  projects = [],
  projectMembers = [],
  sprints,
  tasks = [],
  parentTaskId,
  task,
  returnTo
}: TaskMemberFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [memberCommandOpen, setMemberCommandOpen] = useState(false);

  // 添加项目ID到表单验证模式
  const taskFormWithProject = taskFormSchema.extend({
    projectId: projectId
      ? z.literal(projectId)
      : z.string().min(1, '请选择项目')
  });

  // 默认值
  const defaultValues: Partial<z.infer<typeof taskFormWithProject>> = {
    title: task?.title || '',
    description: task?.description || '',
    status: task?.status || 'TODO',
    priority: task?.priority || 'MEDIUM',
    dueDate: task?.dueDate ? new Date(task.dueDate) : null,
    estimatedHours: task?.estimatedHours || null,
    parentTaskId: parentTaskId || task?.parentTaskId || null,
    sprintId: task?.sprintId || null,
    projectId: projectId || task?.projectId || '',
    assignToMemberId: null,
    assignSelf: false
  };

  // 表单
  const form = useForm<z.infer<typeof taskFormWithProject>>({
    resolver: zodResolver(taskFormWithProject),
    defaultValues,
    mode: 'onChange'
  });

  // 提交表单
  const onSubmit = async (values: TaskFormValues) => {
    setIsSubmitting(true);

    try {
      // 格式化日期和处理空值
      const formData = {
        ...values,
        dueDate: values.dueDate ? values.dueDate.toISOString() : null,
        // 确保父任务ID和迭代ID在为null时传送为字符串"null"或删除该字段
        parentTaskId: values.parentTaskId || undefined,
        sprintId: values.sprintId || undefined,
        estimatedHours: values.estimatedHours || undefined
      };

      // 删除前端控制项，这些不需要发送到后端
      const { assignSelf, assignToMemberId, ...baseData } = formData;

      // 构建要发送的数据
      const dataToSend = {
        ...baseData,
        assignToMemberId: assignSelf ? undefined : assignToMemberId || undefined
      };

      // 根据是否有任务ID决定是创建还是更新
      const url = task?.id
        ? `/api/projects/${values.projectId}/tasks/${task.id}`
        : `/api/projects/${values.projectId}/tasks`;

      const method = task?.id ? 'PATCH' : 'POST';

      // 发送请求
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(dataToSend)
      });

      const data = await response.json();

      if (data.success) {
        toast.success(task?.id ? '任务已更新' : '任务已创建');

        // 创建或更新成功后跳转
        if (task?.id) {
          router.push(
            `/dashboard/projects/${values.projectId}/tasks/${task.id}`
          );
        } else if (returnTo) {
          router.push(returnTo);
        } else {
          router.push(`/dashboard/tasks`);
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
          name='title'
          render={({ field }) => (
            <FormItem>
              <FormLabel>任务标题</FormLabel>
              <FormControl>
                <Input placeholder='输入任务标题' {...field} />
              </FormControl>
              <FormDescription>简明扼要的任务标题</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name='description'
          render={({ field }) => (
            <FormItem>
              <FormLabel>任务描述</FormLabel>
              <FormControl>
                <Textarea
                  placeholder='输入任务描述'
                  className='min-h-[100px]'
                  {...field}
                  value={field.value || ''}
                />
              </FormControl>
              <FormDescription>详细说明任务的内容、目标和要求</FormDescription>
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
                <FormLabel>任务状态</FormLabel>
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
                    {Object.entries(TASK_STATUS).map(([key, { label }]) => (
                      <SelectItem key={key} value={key}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormDescription>任务的当前状态</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name='priority'
            render={({ field }) => (
              <FormItem>
                <FormLabel>优先级</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder='选择优先级' />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {Object.entries(TASK_PRIORITY).map(([key, { label }]) => (
                      <SelectItem key={key} value={key}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormDescription>任务的优先级</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className='grid grid-cols-1 gap-6 md:grid-cols-2'>
          <FormField
            control={form.control}
            name='dueDate'
            render={({ field }) => (
              <FormItem className='flex flex-col'>
                <FormLabel>截止日期</FormLabel>
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
                <FormDescription>任务的截止日期</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name='estimatedHours'
            render={({ field }) => (
              <FormItem>
                <FormLabel>预计工时</FormLabel>
                <FormControl>
                  <Input
                    type='number'
                    placeholder='输入预计工时'
                    {...field}
                    value={field.value === null ? '' : field.value}
                    min={0}
                    step={0.5}
                  />
                </FormControl>
                <FormDescription>完成任务的预计工作小时数</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className='grid grid-cols-1 gap-6 md:grid-cols-2'>
          {/* 项目选择 - 仅当未提供projectId时显示 */}
          {!projectId && projects.length > 0 && (
            <FormField
              control={form.control}
              name='projectId'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>项目</FormLabel>
                  <Select
                    onValueChange={(value) => {
                      field.onChange(value);
                      // 重置迭代和父任务，因为它们与项目相关
                      form.setValue('sprintId', null);
                      form.setValue('parentTaskId', null);
                      form.setValue('assignToMemberId', null);
                    }}
                    value={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder='选择项目' />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {projects.map((project) => (
                        <SelectItem key={project.id} value={project.id}>
                          {project.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormDescription>任务所属的项目</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}

          <FormField
            control={form.control}
            name='sprintId'
            render={({ field }) => (
              <FormItem>
                <FormLabel>迭代</FormLabel>
                <Select
                  onValueChange={(value) => {
                    // 当选择'none'时设置为null，但在提交表单时会被转换为undefined
                    field.onChange(value === 'none' ? null : value);
                  }}
                  value={field.value || 'none'}
                  disabled={!projectId && !form.getValues('projectId')} // 如果没有选择项目，禁用迭代选择
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder='选择迭代' />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value='none'>不分配迭代</SelectItem>
                    {sprints
                      .filter((sprint) => {
                        const formProjectId = form.getValues('projectId');
                        return projectId
                          ? true
                          : formProjectId
                            ? sprint.projectId === formProjectId
                            : false;
                      })
                      .map((sprint) => (
                        <SelectItem key={sprint.id} value={sprint.id}>
                          {sprint.name}
                          {sprint.project ? ` (${sprint.project.name})` : ''}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
                <FormDescription>任务所属的迭代</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name='parentTaskId'
            render={({ field }) => (
              <FormItem>
                <FormLabel>父任务</FormLabel>
                <Select
                  onValueChange={(value) => {
                    // 当选择'none'时设置为null，但在提交表单时会被转换为undefined
                    field.onChange(value === 'none' ? null : value);
                  }}
                  value={field.value || 'none'}
                  disabled={
                    !!parentTaskId ||
                    (!projectId && !form.getValues('projectId'))
                  } // 如果已指定父任务或未选择项目，则禁用选择
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder='选择父任务' />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value='none'>无父任务</SelectItem>
                    {tasks
                      .filter((t) => {
                        const formProjectId = form.getValues('projectId');
                        // 排除当前任务，防止自引用
                        const isNotCurrent = t.id !== task?.id;
                        // 如果提供了projectId，或者表单有选择的projectId，确保任务属于同一项目
                        const isSameProject = projectId
                          ? true
                          : formProjectId
                            ? t.projectId === formProjectId
                            : false;
                        return isNotCurrent && isSameProject;
                      })
                      .map((parentTask) => (
                        <SelectItem key={parentTask.id} value={parentTask.id}>
                          {parentTask.title}
                          {parentTask.project
                            ? ` (${parentTask.project.name})`
                            : ''}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
                <FormDescription>任务的父任务</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className='grid grid-cols-1 gap-6 md:grid-cols-2'>
          {/* 项目成员选择器 */}
          <FormField
            control={form.control}
            name='assignToMemberId'
            render={({ field }) => (
              <FormItem className='flex flex-col'>
                <FormLabel>分配给</FormLabel>
                <Popover
                  open={memberCommandOpen}
                  onOpenChange={setMemberCommandOpen}
                >
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant='outline'
                        role='combobox'
                        className={cn(
                          'w-full justify-between',
                          !field.value && 'text-muted-foreground'
                        )}
                        disabled={!projectId && !form.getValues('projectId')} // 如果没有选择项目，禁用成员选择
                      >
                        {field.value
                          ? projectMembers.find(
                              (member) => member.id === field.value
                            )?.user.name || '选择成员'
                          : '选择成员'}
                        <Users className='ml-2 h-4 w-4 shrink-0 opacity-50' />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className='w-[300px] p-0'>
                    <Command>
                      <CommandInput placeholder='搜索成员...' />
                      <CommandEmpty>未找到成员</CommandEmpty>
                      <CommandGroup>
                        {projectMembers
                          .filter((member) => {
                            const formProjectId = form.getValues('projectId');
                            // 确保只显示当前项目的成员
                            return projectId
                              ? member.projectId === projectId
                              : formProjectId
                                ? member.projectId === formProjectId
                                : false;
                          })
                          .map((member) => (
                            <CommandItem
                              key={member.id}
                              value={member.id}
                              onSelect={() => {
                                form.setValue('assignToMemberId', member.id);
                                form.setValue('assignSelf', false);
                                setMemberCommandOpen(false);
                              }}
                            >
                              {member.user.name}
                              {member.user.email
                                ? ` (${member.user.email})`
                                : ''}
                            </CommandItem>
                          ))}
                      </CommandGroup>
                    </Command>
                  </PopoverContent>
                </Popover>
                <FormDescription>选择要分配任务的项目成员</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* 自己选项 */}
          <FormField
            control={form.control}
            name='assignSelf'
            render={({ field }) => (
              <FormItem className='flex flex-row items-start space-y-0 space-x-3 rounded-md border p-4'>
                <FormControl>
                  <Checkbox
                    checked={field.value}
                    onCheckedChange={(checked) => {
                      field.onChange(checked);
                      if (checked) {
                        // 如果选择分配给自己，清除成员选择
                        form.setValue('assignToMemberId', null);
                      }
                    }}
                    disabled={!projectId && !form.getValues('projectId')} // 如果没有选择项目，禁用自己选择
                  />
                </FormControl>
                <div className='space-y-1 leading-none'>
                  <FormLabel>分配给自己</FormLabel>
                  <FormDescription>
                    创建任务后自动将任务分配给自己
                  </FormDescription>
                </div>
              </FormItem>
            )}
          />
        </div>

        <div className='flex justify-end gap-4'>
          <Button
            type='button'
            variant='outline'
            onClick={() => router.back()}
            disabled={isSubmitting}
          >
            取消
          </Button>
          <Button type='submit' disabled={isSubmitting}>
            {isSubmitting && <Loader2 className='mr-2 h-4 w-4 animate-spin' />}
            {task?.id ? '更新任务' : '创建任务'}
          </Button>
        </div>
      </form>
    </Form>
  );
}
