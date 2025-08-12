'use client';

import { useState, useEffect, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger
} from '@/components/ui/popover';
import { Checkbox } from '@/components/ui/checkbox';
import { Slider } from '@/components/ui/slider';
import {
  CalendarIcon,
  Plus,
  X,
  Upload,
  FileText,
  Users,
  Target,
  Zap,
  AlertCircle,
  CheckCircle2,
  Clock,
  Tag,
  Link,
  Save,
  Send,
  Loader2
} from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { useTranslations } from 'next-intl';
import { createRequirementSchema } from '../schemas/requirement-schema';
import {
  RequirementPriority,
  RequirementType,
  RequirementComplexity,
  RequirementStatus
} from '../types/requirement';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

type RequirementFormData = z.infer<typeof createRequirementSchema>;

interface RequirementFormProps {
  initialData?: Partial<RequirementFormData>;
  onSubmit?: (data: RequirementFormData, isDraft?: boolean) => void;
  onCancel?: () => void;
  loading?: boolean;
  mode?: 'create' | 'edit';
}

// 接口类型定义
interface Project {
  id: string;
  name: string;
  description?: string;
  status: string;
  memberCount: number;
  role?: string;
}

interface User {
  id: string;
  name: string;
  email: string;
  image?: string;
  onlineStatus?: {
    isOnline: boolean;
    lastSeenAt: string;
  };
}

// 动态导入Markdown编辑器，避免SSR问题
const MDEditor = dynamic(
  () => import('@uiw/react-md-editor').then((mod) => mod.default),
  {
    ssr: false,
    loading: () => (
      <div className='bg-muted flex h-64 w-full items-center justify-center rounded-md'>
        <Loader2 className='text-primary h-8 w-8 animate-spin' />
        <span className='ml-2'>加载编辑器...</span>
      </div>
    )
  }
);

const mockTags = [
  'authentication',
  'security',
  'ui/ux',
  'performance',
  'api',
  'database',
  'mobile',
  'integration',
  'testing',
  'documentation'
];

export function RequirementForm({
  initialData,
  onSubmit,
  onCancel,
  loading = false,
  mode = 'create'
}: RequirementFormProps) {
  const t = useTranslations('requirements');
  const router = useRouter();

  // 状态管理
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [projects, setProjects] = useState<Project[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [loadingProjects, setLoadingProjects] = useState(true);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [newAcceptanceCriteria, setNewAcceptanceCriteria] = useState('');
  const [description, setDescription] = useState<string>('');
  const [userStory, setUserStory] = useState<string>('');
  const [acceptanceCriteriaList, setAcceptanceCriteriaList] = useState<
    string[]
  >([]);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(
    null
  );

  // 获取项目列表
  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const response = await fetch('/api/projects/selector');
        if (response.ok) {
          const data = await response.json();
          setProjects(data);
        } else {
          toast.error('获取项目列表失败');
        }
      } catch (error) {
        console.error('Error fetching projects:', error);
        toast.error('获取项目列表失败');
      } finally {
        setLoadingProjects(false);
      }
    };

    fetchProjects();
  }, []);

  // 获取项目成员
  const fetchProjectMembers = useCallback(async (projectId: string) => {
    console.log('fetchProjectMembers called with:', projectId);

    if (!projectId) {
      setUsers([]);
      setFilteredUsers([]);
      return;
    }

    setLoadingUsers(true);
    try {
      const response = await fetch(
        `/api/users/search?projectId=${projectId}&limit=50`
      );
      console.log('API response status:', response.status);

      if (response.ok) {
        const data = await response.json();
        console.log('Received users data:', data);

        setUsers(data.data);
        setFilteredUsers(data.data); // 初始时显示所有成员
        console.log('Updated users state:', data.length, 'users');
      } else {
        console.error('Failed to fetch project members', response.status);
        setUsers([]);
        setFilteredUsers([]);
      }
    } catch (error) {
      console.error('Error fetching project members:', error);
      setUsers([]);
      setFilteredUsers([]);
    } finally {
      setLoadingUsers(false);
      console.log('Loading users finished');
    }
  }, []);

  // 在已加载的项目成员中搜索
  const handleUserSearch = (query: string) => {
    if (!query || query.trim().length === 0) {
      // 没有搜索词时显示所有成员
      setFilteredUsers(users);
      return;
    }

    const filtered = users.filter(
      (user) =>
        user.name?.toLowerCase().includes(query.toLowerCase()) ||
        user.email?.toLowerCase().includes(query.toLowerCase())
    );
    setFilteredUsers(filtered);
  };

  // 初始化描述内容
  useEffect(() => {
    setDescription(initialData?.description || '');
  }, [initialData?.description]);

  // 初始化用户故事内容
  useEffect(() => {
    setUserStory(initialData?.userStory || '');
  }, [initialData?.userStory]);

  // 当描述内容变化时更新表单值
  useEffect(() => {
    form.setValue('description', description);
  }, [description]);

  // 当用户故事内容变化时更新表单值
  useEffect(() => {
    form.setValue('userStory', userStory);
  }, [userStory]);

  const form = useForm<RequirementFormData>({
    resolver: zodResolver(createRequirementSchema),
    defaultValues: {
      title: '',
      description: '',
      type: RequirementType.FUNCTIONAL,
      priority: RequirementPriority.MEDIUM,
      complexity: RequirementComplexity.MEDIUM,
      estimatedEffort: 1,
      acceptanceCriteria: '',
      businessValue: 5,
      userStory: '',
      assignedToId: '', // 确保默认值是空字符串
      ...initialData
    }
  });

  // 当选择项目时获取项目成员并清空已选择的分配人
  const handleProjectChange = useCallback(
    (projectId: string) => {
      console.log('handleProjectChange called with:', projectId);
      setSelectedProjectId(projectId);

      // 清空分配人选择
      form.setValue('assignedToId', '');
      form.trigger('assignedToId'); // 触发验证更新

      // 获取项目成员
      fetchProjectMembers(projectId);
    },
    [form, fetchProjectMembers]
  );

  const typeConfig = {
    FUNCTIONAL: {
      label: t('types.functional'),
      color: 'bg-blue-100 text-blue-800',
      icon: Target
    },
    NON_FUNCTIONAL: {
      label: t('types.nonFunctional'),
      color: 'bg-purple-100 text-purple-800',
      icon: Zap
    },
    BUSINESS: {
      label: t('types.business'),
      color: 'bg-green-100 text-green-800',
      icon: Users
    },
    TECHNICAL: {
      label: t('types.technical'),
      color: 'bg-orange-100 text-orange-800',
      icon: FileText
    }
  };

  const priorityConfig = {
    LOW: { label: t('priorities.low'), color: 'bg-gray-100 text-gray-800' },
    MEDIUM: {
      label: t('priorities.medium'),
      color: 'bg-yellow-100 text-yellow-800'
    },
    HIGH: {
      label: t('priorities.high'),
      color: 'bg-orange-100 text-orange-800'
    },
    CRITICAL: {
      label: t('priorities.critical'),
      color: 'bg-red-100 text-red-800'
    }
  };

  const complexityConfig = {
    SIMPLE: {
      label: t('complexities.simple'),
      color: 'bg-green-100 text-green-800'
    },
    MEDIUM: {
      label: t('complexities.medium'),
      color: 'bg-yellow-100 text-yellow-800'
    },
    COMPLEX: {
      label: t('complexities.complex'),
      color: 'bg-orange-100 text-orange-800'
    },
    VERY_COMPLEX: {
      label: t('complexities.veryComplex'),
      color: 'bg-red-100 text-red-800'
    }
  };

  // 初始化选中的项目ID并获取成员
  useEffect(() => {
    if (initialData?.projectId) {
      setSelectedProjectId(initialData.projectId);
      fetchProjectMembers(initialData.projectId);
    }
  }, [initialData?.projectId, fetchProjectMembers]);

  // 提交表单
  const handleSubmit = async (data: RequirementFormData) => {
    // 确保使用最新的描述和用户故事内容
    data.description = description;
    data.userStory = userStory;
    setIsSubmitting(true);
    try {
      // 验证必填字段
      if (!data.projectId) {
        toast.error('请选择一个项目');
        setIsSubmitting(false);
        return;
      }

      // 构建提交数据
      const submitData = {
        ...data,
        acceptanceCriteria:
          acceptanceCriteriaList.length > 0
            ? acceptanceCriteriaList.join('\n')
            : undefined,
        // 确保空字符串转换为 undefined
        assignedToId: data.assignedToId || undefined,
        parentId: data.parentId || undefined,
        dueDate: data.dueDate || undefined
        // TODO: 需要实现标签ID转换，暂时不提交标签数据
        // tagIds: selectedTags // 这些是标签名称，不是CUID格式的ID
      };

      const response = await fetch('/api/requirements', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(submitData)
      });

      if (response.ok) {
        await response.json(); // Consume the response
        toast.success(mode === 'create' ? '需求创建成功' : '需求更新成功');

        // 如果有自定义回调，调用它
        if (onSubmit) {
          onSubmit(data);
        } else {
          // 否则跳转到需求列表
          router.push('/dashboard/requirements');
        }
      } else {
        const error = await response.json();
        if (error.details && Array.isArray(error.details)) {
          // 处理验证错误
          error.details.forEach((detail: any) => {
            if (detail.path) {
              const fieldName = detail.path[0];
              form.setError(fieldName as any, {
                message: detail.message
              });
            }
          });
          toast.error('请检查表单中的错误');
        } else {
          toast.error(error.message || '操作失败');
        }
      }
    } catch (error) {
      console.error('Error submitting requirement:', error);
      toast.error('提交失败，请重试');
    } finally {
      setIsSubmitting(false);
    }
  };

  const addAcceptanceCriteria = () => {
    if (newAcceptanceCriteria.trim()) {
      setAcceptanceCriteriaList([
        ...acceptanceCriteriaList,
        newAcceptanceCriteria.trim()
      ]);
      setNewAcceptanceCriteria('');
    }
  };

  const removeAcceptanceCriteria = (index: number) => {
    setAcceptanceCriteriaList(
      acceptanceCriteriaList.filter((_, i) => i !== index)
    );
  };

  const addTag = (tagName: string) => {
    if (tagName.trim() && !selectedTags.includes(tagName.trim())) {
      setSelectedTags([...selectedTags, tagName.trim()]);
    }
  };

  const removeTag = (tag: string) => {
    setSelectedTags(selectedTags.filter((t) => t !== tag));
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className='space-y-6'>
        <div className='space-y-6'>
          {/* 基本信息卡片 */}
          <Card>
            <CardHeader>
              <CardTitle>{t('form.basicInfo')}</CardTitle>
              <CardDescription>
                {t('form.basicInfoDescription')}
              </CardDescription>
            </CardHeader>
            <CardContent className='space-y-4'>
              <FormField
                control={form.control}
                name='title'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('form.titleLabel')}</FormLabel>
                    <FormControl>
                      <Input
                        placeholder={t('form.titlePlaceholder')}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name='description'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('form.descriptionLabel')}</FormLabel>
                    <FormControl>
                      <div data-color-mode='light' className='w-full'>
                        <MDEditor
                          value={description}
                          onChange={(value) => setDescription(value || '')}
                          height={300}
                          preview='edit'
                          data-color-mode='light'
                          visibleDragbar={false}
                        />
                      </div>
                    </FormControl>
                    <FormDescription>
                      {t('form.descriptionHelp')}
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className='grid grid-cols-2 gap-4'>
                <FormField
                  control={form.control}
                  name='type'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('form.typeLabel')}</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue
                              placeholder={t('form.typePlaceholder')}
                            />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {Object.entries(typeConfig).map(([key, config]) => {
                            const Icon = config.icon;
                            return (
                              <SelectItem key={key} value={key}>
                                <div className='flex items-center gap-2'>
                                  <Icon className='h-4 w-4' />
                                  {config.label}
                                </div>
                              </SelectItem>
                            );
                          })}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name='priority'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('form.priorityLabel')}</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue
                              placeholder={t('form.priorityPlaceholder')}
                            />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {Object.entries(priorityConfig).map(
                            ([key, config]) => (
                              <SelectItem key={key} value={key}>
                                <Badge className={cn('text-xs', config.color)}>
                                  {config.label}
                                </Badge>
                              </SelectItem>
                            )
                          )}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className='grid grid-cols-2 gap-4'>
                <FormField
                  control={form.control}
                  name='complexity'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('form.complexityLabel')}</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue
                              placeholder={t('form.complexityPlaceholder')}
                            />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {Object.entries(complexityConfig).map(
                            ([key, config]) => (
                              <SelectItem key={key} value={key}>
                                <Badge className={cn('text-xs', config.color)}>
                                  {config.label}
                                </Badge>
                              </SelectItem>
                            )
                          )}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name='estimatedEffort'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('form.effortEstimateLabel')}</FormLabel>
                      <FormControl>
                        <Input
                          type='number'
                          min='0.1'
                          max='1000'
                          step='0.1'
                          placeholder='预估工作量(天)'
                          {...field}
                          onChange={(e) =>
                            field.onChange(Number(e.target.value))
                          }
                        />
                      </FormControl>
                      <FormDescription>
                        {t('form.effortEstimateHelp')}
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </CardContent>
          </Card>

          {/* 分配和时间线卡片 */}
          <Card>
            <CardHeader>
              <CardTitle>{t('form.assignmentTimeline')}</CardTitle>
              <CardDescription>
                {t('form.assignmentTimelineDescription')}
              </CardDescription>
            </CardHeader>
            <CardContent className='space-y-4'>
              <div className='grid grid-cols-2 gap-4'>
                <FormField
                  control={form.control}
                  name='projectId'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('form.projectLabel')}</FormLabel>
                      <Select
                        onValueChange={(value) => {
                          field.onChange(value);
                          handleProjectChange(value);
                        }}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue
                              placeholder={
                                loadingProjects
                                  ? '加载中...'
                                  : t('form.projectPlaceholder')
                              }
                            />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {projects.map((project) => (
                            <SelectItem key={project.id} value={project.id}>
                              <div className='flex items-center gap-2'>
                                <span>{project.name}</span>
                              </div>
                            </SelectItem>
                          ))}
                          {projects.length === 0 && !loadingProjects && (
                            <SelectItem value='' disabled>
                              没有可用的项目
                            </SelectItem>
                          )}
                        </SelectContent>
                      </Select>
                      <FormDescription>需求必须关联到一个项目</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name='assignedToId'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('form.assigneeLabel')}</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value || ''}
                        disabled={!selectedProjectId || loadingUsers}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue
                              placeholder={
                                !selectedProjectId
                                  ? '请先选择项目'
                                  : loadingUsers
                                    ? '加载成员中...'
                                    : filteredUsers.length === 0
                                      ? '该项目暂无成员'
                                      : t('form.assigneePlaceholder')
                              }
                            />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {selectedProjectId && !loadingUsers && (
                            <div className='p-2'>
                              <Input
                                placeholder='输入姓名或邮箱搜索...'
                                onChange={(e) =>
                                  handleUserSearch(e.target.value)
                                }
                                className='mb-2'
                              />
                            </div>
                          )}
                          {loadingUsers ? (
                            <div className='p-4 text-center'>
                              <Loader2 className='mx-auto mb-2 h-4 w-4 animate-spin' />
                              <span className='text-muted-foreground text-sm'>
                                加载项目成员中...
                              </span>
                            </div>
                          ) : selectedProjectId ? (
                            filteredUsers.length > 0 ? (
                              filteredUsers.map((user) => (
                                <SelectItem key={user.id} value={user.id}>
                                  <div className='flex items-center gap-2'>
                                    <Avatar className='h-5 w-5'>
                                      <AvatarImage src={user.image} />
                                      <AvatarFallback className='text-xs'>
                                        {user.name?.charAt(0)}
                                      </AvatarFallback>
                                    </Avatar>
                                    <div className='flex flex-col'>
                                      <span>{user.name}</span>
                                      <span className='text-muted-foreground text-xs'>
                                        {user.email}
                                      </span>
                                    </div>
                                    {user.onlineStatus?.isOnline && (
                                      <div className='ml-auto'>
                                        <div className='h-2 w-2 rounded-full bg-green-500'></div>
                                      </div>
                                    )}
                                  </div>
                                </SelectItem>
                              ))
                            ) : (
                              <SelectItem value='' disabled>
                                {users.length === 0
                                  ? '该项目暂无成员'
                                  : '未找到匹配的成员'}
                              </SelectItem>
                            )
                          ) : (
                            <SelectItem value='' disabled>
                              请先选择项目
                            </SelectItem>
                          )}
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        {!selectedProjectId
                          ? '先选择项目后，可以分配给项目成员'
                          : loadingUsers
                            ? '正在加载项目成员...'
                            : `项目成员 (${users.length})`}
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name='dueDate'
                render={({ field }) => (
                  <FormItem className='flex flex-col'>
                    <FormLabel>{t('form.dueDateLabel')}</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant={'outline'}
                            className={cn(
                              'w-[240px] pl-3 text-left font-normal',
                              !field.value && 'text-muted-foreground'
                            )}
                          >
                            {field.value ? (
                              format(new Date(field.value), 'PPP')
                            ) : (
                              <span>{t('form.dueDatePlaceholder')}</span>
                            )}
                            <CalendarIcon className='ml-auto h-4 w-4 opacity-50' />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className='w-auto p-0' align='start'>
                        <Calendar
                          mode='single'
                          selected={
                            field.value ? new Date(field.value) : undefined
                          }
                          onSelect={(date) =>
                            field.onChange(date?.toISOString())
                          }
                          disabled={(date) => date < new Date()}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* 业务价值和用户故事 */}
              <div className='grid grid-cols-1 gap-4'>
                <FormField
                  control={form.control}
                  name='businessValue'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>业务价值 ({field.value}/10)</FormLabel>
                      <FormControl>
                        <div className='space-y-3'>
                          <Slider
                            min={1}
                            max={10}
                            step={1}
                            value={[field.value]}
                            onValueChange={(values) =>
                              field.onChange(values[0])
                            }
                            className='w-full'
                          />
                          <div className='text-muted-foreground flex justify-between text-xs'>
                            <span>1 (低)</span>
                            <span>5 (中等)</span>
                            <span>10 (高)</span>
                          </div>
                        </div>
                      </FormControl>
                      <FormDescription>
                        评估该需求对业务的价值程度，1为最低，10为最高
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name='userStory'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>用户故事</FormLabel>
                      <FormControl>
                        <div data-color-mode='light' className='w-full'>
                          <MDEditor
                            value={userStory}
                            onChange={(value) => setUserStory(value || '')}
                            height={200}
                            preview='edit'
                            data-color-mode='light'
                            visibleDragbar={false}
                          />
                        </div>
                      </FormControl>
                      <FormDescription>
                        用标准的用户故事格式描述需求，支持Markdown格式
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </CardContent>
          </Card>

          {/* 验收标准卡片 */}
          <Card>
            <CardHeader>
              <CardTitle>{t('form.acceptanceCriteriaLabel')}</CardTitle>
              <CardDescription>
                {t('form.acceptanceCriteriaDescription')}
              </CardDescription>
            </CardHeader>
            <CardContent className='space-y-4'>
              <div className='space-y-2'>
                {acceptanceCriteriaList.map((criteria, index) => (
                  <div
                    key={index}
                    className='flex items-center gap-2 rounded-lg border p-3'
                  >
                    <CheckCircle2 className='h-4 w-4 text-green-600' />
                    <span className='flex-1 text-sm'>{criteria}</span>
                    <Button
                      type='button'
                      variant='ghost'
                      size='sm'
                      onClick={() => removeAcceptanceCriteria(index)}
                      className='h-8 w-8 p-0'
                    >
                      <X className='h-4 w-4' />
                    </Button>
                  </div>
                ))}
              </div>

              <div className='flex gap-2'>
                <Input
                  placeholder={t('form.acceptanceCriteriaPlaceholder')}
                  value={newAcceptanceCriteria}
                  onChange={(e) => setNewAcceptanceCriteria(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      addAcceptanceCriteria();
                    }
                  }}
                />
                <Button
                  type='button'
                  variant='outline'
                  onClick={addAcceptanceCriteria}
                  disabled={!newAcceptanceCriteria.trim()}
                >
                  <Plus className='h-4 w-4' />
                </Button>
              </div>

              {acceptanceCriteriaList.length === 0 && (
                <p className='text-sm text-red-600'>请至少添加一个验收标准</p>
              )}
            </CardContent>
          </Card>

          {/* 标签和元数据卡片 */}
          <Card>
            <CardHeader>
              <CardTitle>{t('form.tagsMetadata')}</CardTitle>
              <CardDescription>
                {t('form.tagsMetadataDescription')}
              </CardDescription>
            </CardHeader>
            <CardContent className='space-y-4'>
              <div className='space-y-2'>
                <Label>{t('form.tagsLabel')}</Label>
                <div className='mb-2 flex flex-wrap gap-2'>
                  {selectedTags.map((tag) => (
                    <Badge
                      key={tag}
                      variant='secondary'
                      className='flex items-center gap-1'
                    >
                      <Tag className='h-3 w-3' />
                      {tag}
                      <Button
                        type='button'
                        variant='ghost'
                        size='sm'
                        onClick={() => removeTag(tag)}
                        className='ml-1 h-4 w-4 p-0'
                      >
                        <X className='h-3 w-3' />
                      </Button>
                    </Badge>
                  ))}
                </div>

                <div className='space-y-2'>
                  <Label className='text-sm text-gray-600'>
                    {t('form.suggestedTags')}
                  </Label>
                  <div className='flex flex-wrap gap-2'>
                    {mockTags
                      .filter((tag) => !selectedTags.includes(tag))
                      .map((tag) => (
                        <Button
                          key={tag}
                          type='button'
                          variant='outline'
                          size='sm'
                          onClick={() => addTag(tag)}
                          className='h-7 text-xs'
                        >
                          <Plus className='mr-1 h-3 w-3' />
                          {tag}
                        </Button>
                      ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className='flex items-center justify-between border-t pt-6'>
          <div className='flex gap-2'>
            {onCancel && (
              <Button type='button' variant='outline' onClick={onCancel}>
                {t('form.cancel')}
              </Button>
            )}
          </div>

          <div className='flex gap-2'>
            <Button
              type='submit'
              disabled={isSubmitting || loading}
              className='min-w-[120px]'
            >
              {isSubmitting ? (
                <Loader2 className='mr-2 h-4 w-4 animate-spin' />
              ) : (
                <Send className='mr-2 h-4 w-4' />
              )}
              {mode === 'create'
                ? t('form.createRequirement')
                : t('form.updateRequirement')}
            </Button>
          </div>
        </div>
      </form>
    </Form>
  );
}

export default RequirementForm;
