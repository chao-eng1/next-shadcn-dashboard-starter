'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2, MessageSquare } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage
} from '@/components/ui/form';
import { Textarea } from '@/components/ui/textarea';

// 评论表单验证
const commentFormSchema = z.object({
  content: z
    .string()
    .min(1, '评论内容不能为空')
    .max(1000, '评论内容不能超过1000个字符')
});

type CommentFormValues = z.infer<typeof commentFormSchema>;

interface CommentFormProps {
  projectId: string;
  taskId: string;
  onSuccess?: () => void;
}

export function CommentForm({
  projectId,
  taskId,
  onSuccess
}: CommentFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 表单
  const form = useForm<CommentFormValues>({
    resolver: zodResolver(commentFormSchema),
    defaultValues: {
      content: ''
    },
    mode: 'onChange'
  });

  // 提交表单
  const onSubmit = async (values: CommentFormValues) => {
    setIsSubmitting(true);

    try {
      // 构建API路径
      const url = `/api/projects/${projectId}/tasks/${taskId}/comments`;

      // 发送请求
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(values)
      });

      const data = await response.json();

      if (data.success) {
        toast.success('评论已添加');
        // 重置表单
        form.reset();
        // 刷新页面数据
        router.refresh();
        // 调用成功回调
        if (onSuccess) {
          onSuccess();
        }
      } else {
        throw new Error(data.error?.message || '添加评论失败');
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : '未知错误');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-4'>
        <FormField
          control={form.control}
          name='content'
          render={({ field }) => (
            <FormItem>
              <FormControl>
                <Textarea
                  placeholder='添加评论...'
                  className='min-h-[100px] resize-y'
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type='submit' className='w-full' disabled={isSubmitting}>
          {isSubmitting ? (
            <Loader2 className='mr-2 h-4 w-4 animate-spin' />
          ) : (
            <MessageSquare className='mr-2 h-4 w-4' />
          )}
          添加评论
        </Button>
      </form>
    </Form>
  );
}
