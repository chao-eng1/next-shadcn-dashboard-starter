'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Role, User } from '@prisma/client';
import { SearchIcon, X, Check } from 'lucide-react';

import { Button } from '@/components/ui/button';
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
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
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

import {
  messageFormSchema,
  MessageFormValues,
  defaultMessageValues
} from '../schemas/message-schema';

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
      // Only pass the watched values we need to avoid infinite loops
      onFormChange({
        title: watchedTitle || '',
        content: watchedContent || '',
        recipientType: recipientType,
        roleIds: form.getValues().roleIds,
        recipientIds: form.getValues().recipientIds
      });
    }
  }, [watchedTitle, watchedContent, recipientType, onFormChange]);

  async function onSubmit(data: MessageFormValues) {
    setIsLoading(true);

    try {
      // Prepare the request payload based on the recipient type
      const payload: any = {
        title: data.title,
        content: data.content,
        isGlobal: data.recipientType === 'global'
      };

      if (
        data.recipientType === 'roles' &&
        data.roleIds &&
        data.roleIds.length > 0
      ) {
        payload.roleIds = data.roleIds;
      } else if (
        data.recipientType === 'users' &&
        data.recipientIds &&
        data.recipientIds.length > 0
      ) {
        payload.recipientIds = data.recipientIds;
      }

      // We're not supporting editing messages anymore, only creating new ones
      const url = '/api/messages';
      const method = 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to send message');
      }

      toast.success('Message sent successfully');
      router.refresh();

      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error(
        error instanceof Error ? error.message : 'Failed to send message'
      );
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
                    接收者
                  </FormLabel>
                  <FormControl>
                    <RadioGroup
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      className='mt-2 flex flex-col space-y-3'
                    >
                      <div className='hover:bg-muted/50 flex items-center space-x-3 rounded-md p-2 transition-colors'>
                        <RadioGroupItem value='global' id='global' />
                        <label
                          htmlFor='global'
                          className='cursor-pointer text-sm font-medium'
                        >
                          所有用户
                        </label>
                      </div>
                      <div className='hover:bg-muted/50 flex items-center space-x-3 rounded-md p-2 transition-colors'>
                        <RadioGroupItem value='roles' id='roles' />
                        <label
                          htmlFor='roles'
                          className='cursor-pointer text-sm font-medium'
                        >
                          特定角色的用户
                        </label>
                      </div>
                      <div className='hover:bg-muted/50 flex items-center space-x-3 rounded-md p-2 transition-colors'>
                        <RadioGroupItem value='users' id='users' />
                        <label
                          htmlFor='users'
                          className='cursor-pointer text-sm font-medium'
                        >
                          指定用户
                        </label>
                      </div>
                    </RadioGroup>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          {recipientType === 'roles' && (
            <FormField
              control={form.control}
              name='roleIds'
              render={({ field }) => (
                <FormItem>
                  <div className='mb-4'>
                    <FormLabel className='text-base font-medium'>
                      选择角色
                    </FormLabel>
                  </div>
                  <div className='flex flex-col space-y-4'>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant='outline'
                            role='combobox'
                            className='w-full justify-between'
                          >
                            {field.value?.length > 0 ? (
                              <span className='text-sm'>
                                已选择 {field.value?.length} 个角色
                              </span>
                            ) : (
                              <span className='text-muted-foreground text-sm'>
                                搜索并选择角色
                              </span>
                            )}
                            <SearchIcon className='ml-2 h-4 w-4 shrink-0 opacity-50' />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className='w-full p-0' align='start'>
                        <Command>
                          <CommandInput placeholder='搜索角色...' />
                          <CommandEmpty>未找到角色</CommandEmpty>
                          <CommandList>
                            <CommandGroup>
                              <ScrollArea className='h-60'>
                                {roles.length > 0 ? (
                                  roles.map((role) => (
                                    <CommandItem
                                      key={role.id}
                                      value={role.name}
                                      onSelect={() => {
                                        const currentValues = field.value || [];
                                        const selected = currentValues.includes(
                                          role.id
                                        );
                                        return field.onChange(
                                          selected
                                            ? currentValues.filter(
                                                (value) => value !== role.id
                                              )
                                            : [...currentValues, role.id]
                                        );
                                      }}
                                    >
                                      <div className='flex w-full items-center gap-2'>
                                        <Checkbox
                                          checked={field.value?.includes(
                                            role.id
                                          )}
                                          className='data-[state=checked]:bg-primary'
                                        />
                                        <span>{role.name}</span>
                                      </div>
                                      <Check
                                        className={`ml-auto h-4 w-4 ${field.value?.includes(role.id) ? 'opacity-100' : 'opacity-0'}`}
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
                  </div>
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
                  <div className='mb-4'>
                    <FormLabel className='text-base font-medium'>
                      选择用户
                    </FormLabel>
                  </div>
                  <div className='flex flex-col space-y-4'>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant='outline'
                            role='combobox'
                            className='w-full justify-between'
                          >
                            {field.value?.length > 0 ? (
                              <span className='text-sm'>
                                已选择 {field.value?.length} 个用户
                              </span>
                            ) : (
                              <span className='text-muted-foreground text-sm'>
                                搜索并选择用户
                              </span>
                            )}
                            <SearchIcon className='ml-2 h-4 w-4 shrink-0 opacity-50' />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className='w-full p-0' align='start'>
                        <Command>
                          <CommandInput placeholder='搜索用户邮箱...' />
                          <CommandEmpty>未找到用户</CommandEmpty>
                          <CommandList>
                            <CommandGroup>
                              <ScrollArea className='h-60'>
                                {users.length > 0 ? (
                                  users.map((user) => (
                                    <CommandItem
                                      key={user.id}
                                      value={user.email || user.name || user.id}
                                      onSelect={() => {
                                        const currentValues = field.value || [];
                                        const selected = currentValues.includes(
                                          user.id
                                        );
                                        return field.onChange(
                                          selected
                                            ? currentValues.filter(
                                                (value) => value !== user.id
                                              )
                                            : [...currentValues, user.id]
                                        );
                                      }}
                                    >
                                      <div className='flex w-full items-center gap-2'>
                                        <Checkbox
                                          checked={field.value?.includes(
                                            user.id
                                          )}
                                          className='data-[state=checked]:bg-primary'
                                        />
                                        <span>
                                          {user.email || user.name || user.id}
                                        </span>
                                      </div>
                                      <Check
                                        className={`ml-auto h-4 w-4 ${field.value?.includes(user.id) ? 'opacity-100' : 'opacity-0'}`}
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
                              {user?.email || user?.name || userId}
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
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}

          <div className='mt-8 flex justify-end space-x-3'>
            {onCancel && (
              <Button variant='outline' type='button' onClick={onCancel}>
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
