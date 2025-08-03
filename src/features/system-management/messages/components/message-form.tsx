'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { Check, X, ChevronDown, Users, UserCheck, Globe } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Form,
  FormControl,
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
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger
} from '@/components/ui/popover';
import { useRealtime } from '@/components/realtime/realtime-provider';

import {
  messageFormSchema,
  MessageFormValues,
  defaultMessageValues
} from '../schemas/message-schema';

interface Role {
  id: string;
  name: string;
  description?: string;
}

interface User {
  id: string;
  name: string;
  email: string;
  image?: string;
}

interface MessageFormProps {
  roles?: Role[];
  users?: User[];
  initialData?: MessageFormValues;
  onSuccess?: () => void;
  onCancel?: () => void;
  onFormChange?: (values: MessageFormValues) => void;
}

export function MessageForm({
  roles = [],
  users = [],
  initialData,
  onSuccess,
  onCancel,
  onFormChange
}: MessageFormProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [previewData, setPreviewData] = useState({ title: '', content: '' });
  const [rolePopoverOpen, setRolePopoverOpen] = useState(false);
  const [userPopoverOpen, setUserPopoverOpen] = useState(false);
  const { refreshMessages } = useRealtime();

  const form = useForm<MessageFormValues>({
    resolver: zodResolver(messageFormSchema),
    defaultValues: initialData || defaultMessageValues
  });

  const recipientType = form.watch('recipientType');
  const watchedTitle = form.watch('title');
  const watchedContent = form.watch('content');

  // Update preview data and notify parent when form values change
  useEffect(() => {
    setPreviewData({
      title: watchedTitle || '',
      content: watchedContent || ''
    });

    if (onFormChange) {
      onFormChange({
        title: watchedTitle || '',
        content: watchedContent || '',
        recipientType: recipientType,
        roleIds: form.getValues().roleIds,
        recipientIds: form.getValues().recipientIds
      });
    }
  }, [watchedTitle, watchedContent, recipientType, onFormChange, form]);

  async function onSubmit(data: MessageFormValues) {
    setIsLoading(true);

    try {
      // Prepare the request payload based on the recipient type
      const payload: any = {
        title: data.title,
        content: data.content,
        isGlobal: data.recipientType === 'global',
        includeSender: data.includeSender
      };

      if (data.recipientType === 'roles' && data.roleIds?.length) {
        payload.roleIds = data.roleIds;
      } else if (data.recipientType === 'users' && data.recipientIds?.length) {
        payload.recipientIds = data.recipientIds;
      }

      const response = await fetch('/api/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to send message');
      }

      toast.success('消息发送成功');

      // 立即刷新消息通知
      refreshMessages();

      router.refresh();

      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error(error instanceof Error ? error.message : '发送消息失败');
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className='w-full space-y-8'>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <div className='space-y-6 px-0 py-3'>
            <FormField
              control={form.control}
              name='title'
              render={({ field }) => (
                <FormItem>
                  <FormLabel className='text-base font-medium'>标题</FormLabel>
                  <FormControl>
                    <Input
                      placeholder='请输入消息标题'
                      {...field}
                      className='h-10'
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name='content'
              render={({ field }) => (
                <FormItem>
                  <FormLabel className='text-base font-medium'>内容</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder='请输入消息内容'
                      className='h-40 resize-y'
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className='mt-6 space-y-6 border-t px-0 py-3 pt-6'>
            <FormField
              control={form.control}
              name='recipientType'
              render={({ field }) => (
                <FormItem>
                  <FormLabel className='text-base font-medium'>
                    接收者类型
                  </FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder='选择接收者类型' />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value='global'>
                        <div className='flex items-center gap-2'>
                          <Globe className='h-4 w-4' />
                          <span>全体用户</span>
                        </div>
                      </SelectItem>
                      <SelectItem value='roles'>
                        <div className='flex items-center gap-2'>
                          <Users className='h-4 w-4' />
                          <span>按角色发送</span>
                        </div>
                      </SelectItem>
                      <SelectItem value='users'>
                        <div className='flex items-center gap-2'>
                          <UserCheck className='h-4 w-4' />
                          <span>指定用户</span>
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {recipientType === 'roles' && (
              <FormField
                control={form.control}
                name='roleIds'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className='text-base font-medium'>
                      选择角色
                    </FormLabel>
                    <Popover
                      open={rolePopoverOpen}
                      onOpenChange={setRolePopoverOpen}
                    >
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant='outline'
                            role='combobox'
                            className='w-full justify-between'
                          >
                            {field.value?.length
                              ? `已选择 ${field.value.length} 个角色`
                              : '选择角色'}
                            <ChevronDown className='ml-2 h-4 w-4 shrink-0 opacity-50' />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className='w-full p-0'>
                        <Command>
                          <CommandInput placeholder='搜索角色...' />
                          <CommandList>
                            <CommandEmpty>没有找到角色</CommandEmpty>
                            <CommandGroup>
                              <ScrollArea className='h-64'>
                                {roles.length > 0 ? (
                                  roles.map((role) => (
                                    <CommandItem
                                      key={role.id}
                                      onSelect={() => {
                                        const currentValue = field.value || [];
                                        const newValue = currentValue.includes(
                                          role.id
                                        )
                                          ? currentValue.filter(
                                              (id) => id !== role.id
                                            )
                                          : [...currentValue, role.id];
                                        field.onChange(newValue);
                                      }}
                                    >
                                      <div className='flex items-center space-x-2'>
                                        <span>{role.name}</span>
                                      </div>
                                      <Check
                                        className={`ml-auto h-4 w-4 ${
                                          field.value?.includes(role.id)
                                            ? 'opacity-100'
                                            : 'opacity-0'
                                        }`}
                                      />
                                    </CommandItem>
                                  ))
                                ) : (
                                  <div className='text-muted-foreground py-6 text-center text-sm'>
                                    <p>没有角色数据或您没有权限查看角色</p>
                                    <p className='mt-2'>请联系系统管理员</p>
                                  </div>
                                )}
                              </ScrollArea>
                            </CommandGroup>
                          </CommandList>
                        </Command>
                      </PopoverContent>
                    </Popover>

                    {field.value?.length > 0 && (
                      <div className='mt-2 flex flex-wrap gap-2'>
                        {field.value.map((roleId) => {
                          const role = roles.find((r) => r.id === roleId);
                          return (
                            <Badge
                              key={roleId}
                              variant='secondary'
                              className='px-3 py-1'
                            >
                              {role?.name}
                              <X
                                className='ml-2 h-3 w-3 cursor-pointer'
                                onClick={() => {
                                  field.onChange(
                                    field.value?.filter((id) => id !== roleId)
                                  );
                                }}
                              />
                            </Badge>
                          );
                        })}
                      </div>
                    )}
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {recipientType === 'users' && (
              <FormField
                control={form.control}
                name='recipientIds'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className='text-base font-medium'>
                      选择用户
                    </FormLabel>
                    <Popover
                      open={userPopoverOpen}
                      onOpenChange={setUserPopoverOpen}
                    >
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant='outline'
                            role='combobox'
                            className='w-full justify-between'
                          >
                            {field.value?.length
                              ? `已选择 ${field.value.length} 个用户`
                              : '选择用户'}
                            <ChevronDown className='ml-2 h-4 w-4 shrink-0 opacity-50' />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className='w-full p-0'>
                        <Command>
                          <CommandInput placeholder='搜索用户...' />
                          <CommandList>
                            <CommandEmpty>没有找到用户</CommandEmpty>
                            <CommandGroup>
                              <ScrollArea className='h-64'>
                                {users.length > 0 ? (
                                  users.map((user) => (
                                    <CommandItem
                                      key={user.id}
                                      onSelect={() => {
                                        const currentValue = field.value || [];
                                        const newValue = currentValue.includes(
                                          user.id
                                        )
                                          ? currentValue.filter(
                                              (id) => id !== user.id
                                            )
                                          : [...currentValue, user.id];
                                        field.onChange(newValue);
                                      }}
                                    >
                                      <div className='flex items-center space-x-2'>
                                        <span>{user.name}</span>
                                        <span className='text-muted-foreground text-sm'>
                                          ({user.email})
                                        </span>
                                      </div>
                                      <Check
                                        className={`ml-auto h-4 w-4 ${
                                          field.value?.includes(user.id)
                                            ? 'opacity-100'
                                            : 'opacity-0'
                                        }`}
                                      />
                                    </CommandItem>
                                  ))
                                ) : (
                                  <div className='text-muted-foreground py-6 text-center text-sm'>
                                    <p>没有用户数据或您没有权限查看用户</p>
                                    <p className='mt-2'>请联系系统管理员</p>
                                  </div>
                                )}
                              </ScrollArea>
                            </CommandGroup>
                          </CommandList>
                        </Command>
                      </PopoverContent>
                    </Popover>

                    {field.value?.length > 0 && (
                      <div className='mt-2 flex flex-wrap gap-2'>
                        {field.value.map((userId) => {
                          const user = users.find((u) => u.id === userId);
                          return (
                            <Badge
                              key={userId}
                              variant='secondary'
                              className='px-3 py-1'
                            >
                              {user?.name}
                              <X
                                className='ml-2 h-3 w-3 cursor-pointer'
                                onClick={() => {
                                  field.onChange(
                                    field.value?.filter((id) => id !== userId)
                                  );
                                }}
                              />
                            </Badge>
                          );
                        })}
                      </div>
                    )}
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}
          </div>

          {/* 发送者选项 */}
          <div className='mt-6 space-y-4 border-t px-0 py-3 pt-6'>
            <FormField
              control={form.control}
              name='includeSender'
              render={({ field }) => (
                <FormItem className='flex flex-row items-start space-y-0 space-x-3'>
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <div className='space-y-1 leading-none'>
                    <FormLabel className='text-sm font-medium'>
                      给自己也发送一份
                    </FormLabel>
                    <p className='text-xs text-gray-500'>
                      勾选此项，您也会收到自己发送的消息副本
                    </p>
                  </div>
                </FormItem>
              )}
            />
          </div>

          <div className='flex justify-end space-x-4 pt-6'>
            {onCancel && (
              <Button type='button' variant='outline' onClick={onCancel}>
                取消
              </Button>
            )}
            <Button type='submit' disabled={isLoading}>
              {isLoading ? '发送中...' : '发送消息'}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
