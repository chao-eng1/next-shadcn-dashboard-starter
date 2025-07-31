'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2, UserPlus } from 'lucide-react';
import { toast } from 'sonner';

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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { PROJECT_MEMBER_ROLE } from '@/constants/project';

// 添加成员表单验证
const addMemberFormSchema = z.object({
  email: z.string().email('请输入有效的邮箱地址'),
  role: z.enum(['ADMIN', 'MEMBER', 'VIEWER']).default('MEMBER')
});

type AddMemberFormValues = z.infer<typeof addMemberFormSchema>;

interface AddMemberDialogProps {
  projectId: string;
  onMemberAdded?: () => void;
  variant?:
    | 'default'
    | 'outline'
    | 'secondary'
    | 'destructive'
    | 'ghost'
    | 'link';
  size?: 'default' | 'sm' | 'lg' | 'icon';
}

export function AddMemberDialog({
  projectId,
  onMemberAdded,
  variant = 'default',
  size = 'default'
}: AddMemberDialogProps) {
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 表单
  const form = useForm<AddMemberFormValues>({
    resolver: zodResolver(addMemberFormSchema),
    defaultValues: {
      email: '',
      role: 'MEMBER'
    },
    mode: 'onChange'
  });

  // 添加成员
  const onSubmit = async (values: AddMemberFormValues) => {
    setIsSubmitting(true);

    try {
      const response = await fetch(`/api/projects/${projectId}/members`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(values)
      });

      const data = await response.json();

      if (data.success) {
        toast.success('成员添加成功');
        setOpen(false);
        form.reset();

        // 确保调用回调函数，触发列表刷新
        if (onMemberAdded) {
          // 直接调用回调函数，不传递参数，保证父组件能够正确执行刷新逻辑
          onMemberAdded();
        }
      } else {
        throw new Error(data.error?.message || '添加成员失败');
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : '添加成员失败');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant={variant} size={size}>
          <UserPlus className='mr-2 h-4 w-4' />
          添加成员
        </Button>
      </DialogTrigger>
      <DialogContent className='sm:max-w-[425px]'>
        <DialogHeader>
          <DialogTitle>添加新成员</DialogTitle>
          <DialogDescription>
            添加用户到您的项目团队。将直接添加用户到项目中。
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-4'>
            <FormField
              control={form.control}
              name='email'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>电子邮箱</FormLabel>
                  <FormControl>
                    <Input placeholder='user@example.com' {...field} />
                  </FormControl>
                  <FormDescription>输入被添加人的电子邮箱地址</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name='role'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>角色</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder='选择角色' />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {Object.entries(PROJECT_MEMBER_ROLE)
                        .filter(([key]) => key !== 'OWNER') // 过滤掉 OWNER 角色，因为所有者只能有一个
                        .map(([key, { label, description }]) => (
                          <SelectItem key={key} value={key}>
                            {label} - {description}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                  <FormDescription>选择成员在项目中的角色</FormDescription>
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
                {isSubmitting && (
                  <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                )}
                添加成员
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
