'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2, UserPlus } from 'lucide-react';
import { toast } from 'sonner';
import { useTranslations } from 'next-intl';

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
import { getProjectMemberRoleLabels } from '@/constants/project';

// 添加成员表单验证
const createAddMemberFormSchema = (t: (key: string) => string) => z.object({
  email: z.string().email(t('validation.invalidEmail')),
  role: z.enum(['ADMIN', 'MEMBER', 'VIEWER']).default('MEMBER')
});

type AddMemberFormValues = z.infer<ReturnType<typeof createAddMemberFormSchema>>;

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
  const t = useTranslations();

  // 获取国际化的角色标签
  const roleLabels = getProjectMemberRoleLabels(t);
  
  // 创建带有翻译的表单验证 schema
  const addMemberFormSchema = createAddMemberFormSchema(t);

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
        toast.success(t('projects.messages.created'));
        setOpen(false);
        form.reset();

        // 确保调用回调函数，触发列表刷新
        if (onMemberAdded) {
          // 直接调用回调函数，不传递参数，保证父组件能够正确执行刷新逻辑
          onMemberAdded();
        }
      } else {
        throw new Error(data.error?.message || t('projects.messages.createFailed'));
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t('projects.messages.createFailed'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant={variant} size={size}>
          <UserPlus className='mr-2 h-4 w-4' />
          {t('projects.team.add')}
        </Button>
      </DialogTrigger>
      <DialogContent className='sm:max-w-[425px]'>
        <DialogHeader>
          <DialogTitle>{t('projects.team.addNewMember')}</DialogTitle>
          <DialogDescription>
            {t('projects.team.addMemberDescription')}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-4'>
            <FormField
              control={form.control}
              name='email'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('common.email')}</FormLabel>
                  <FormControl>
                    <Input placeholder='user@example.com' {...field} />
                  </FormControl>
                  <FormDescription>{t('projects.team.emailDescription')}</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name='role'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('projects.team.role')}</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder={t('forms.placeholder.select')} />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {Object.entries(roleLabels)
                        .filter(([key]) => key !== 'OWNER') // 过滤掉 OWNER 角色，因为所有者只能有一个
                        .map(([key, { label, description }]) => (
                          <SelectItem key={key} value={key}>
                            {label} - {description}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                  <FormDescription>{t('projects.team.roleDescription')}</FormDescription>
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
                {t('common.cancel')}
              </Button>
              <Button type='submit' disabled={isSubmitting}>
                {isSubmitting && (
                  <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                )}
                {t('projects.team.add')}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
