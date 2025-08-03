'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
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
  Popover,
  PopoverContent,
  PopoverTrigger
} from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import {
  Calendar as CalendarIcon,
  Save,
  X,
  Plus,
  FileText,
  Link,
  Tag
} from 'lucide-react';
import { format } from 'date-fns';
import { zhCN } from 'date-fns/locale/zh-CN';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

const requirementSchema = z.object({
  title: z
    .string()
    .min(1, '需求标题不能为空')
    .max(200, '需求标题不能超过200个字符'),
  description: z.string().min(1, '需求描述不能为空'),
  status: z.enum([
    'DRAFT',
    'PENDING',
    'APPROVED',
    'IN_PROGRESS',
    'TESTING',
    'COMPLETED',
    'REJECTED',
    'CANCELLED'
  ]),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']),
  type: z.enum(['FUNCTIONAL', 'NON_FUNCTIONAL', 'TECHNICAL', 'BUSINESS']),
  complexity: z.enum(['SIMPLE', 'MEDIUM', 'COMPLEX', 'VERY_COMPLEX']),
  businessValue: z
    .number()
    .min(0, '业务价值不能为负数')
    .max(100, '业务价值不能超过100'),
  estimatedEffort: z.number().min(0, '预估工作量不能为负数'),
  dueDate: z.date().optional(),
  projectId: z.string().optional(),
  assigneeId: z.string().optional(),
  tags: z.array(z.string()).optional(),
  acceptanceCriteria: z.string().optional(),
  businessRules: z.string().optional(),
  technicalNotes: z.string().optional(),
  dependencies: z.array(z.string()).optional(),
  attachments: z.array(z.string()).optional()
});

type RequirementFormData = z.infer<typeof requirementSchema>;

interface RequirementFormProps {
  initialData?: Partial<RequirementFormData>;
  requirementId?: string;
  projectId?: string;
  onSuccess?: () => void;
}

const statusOptions = [
  { value: 'DRAFT', label: '草稿' },
  { value: 'PENDING', label: '待评估' },
  { value: 'APPROVED', label: '已确认' },
  { value: 'IN_PROGRESS', label: '开发中' },
  { value: 'TESTING', label: '测试中' },
  { value: 'COMPLETED', label: '已完成' },
  { value: 'REJECTED', label: '已拒绝' },
  { value: 'CANCELLED', label: '已取消' }
];

const priorityOptions = [
  { value: 'LOW', label: '低' },
  { value: 'MEDIUM', label: '中' },
  { value: 'HIGH', label: '高' },
  { value: 'URGENT', label: '紧急' }
];

const typeOptions = [
  { value: 'FUNCTIONAL', label: '功能性需求' },
  { value: 'NON_FUNCTIONAL', label: '非功能性需求' },
  { value: 'TECHNICAL', label: '技术性需求' },
  { value: 'BUSINESS', label: '业务性需求' }
];

const complexityOptions = [
  { value: 'SIMPLE', label: '简单（1-2天）' },
  { value: 'MEDIUM', label: '中等（3-5天）' },
  { value: 'COMPLEX', label: '复杂（1-2周）' },
  { value: 'VERY_COMPLEX', label: '非常复杂（2周以上）' }
];

export function RequirementForm({
  initialData,
  requirementId,
  projectId,
  onSuccess
}: RequirementFormProps) {
  const [loading, setLoading] = useState(false);
  const [projects, setProjects] = useState<Array<{ id: string; name: string }>>(
    []
  );
  const [users, setUsers] = useState<
    Array<{ id: string; name: string; email: string }>
  >([]);
  const [tags, setTags] = useState<
    Array<{ id: string; name: string; color: string }>
  >([]);
  const [requirements, setRequirements] = useState<
    Array<{ id: string; title: string }>
  >([]);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [selectedDependencies, setSelectedDependencies] = useState<string[]>(
    []
  );
  const router = useRouter();
  const { toast } = useToast();

  const form = useForm<RequirementFormData>({
    resolver: zodResolver(requirementSchema),
    defaultValues: {
      title: '',
      description: '',
      status: 'DRAFT',
      priority: 'MEDIUM',
      type: 'FUNCTIONAL',
      complexity: 'MEDIUM',
      businessValue: 50,
      estimatedEffort: 8,
      projectId: projectId || '',
      tags: [],
      dependencies: [],
      ...initialData
    }
  });

  useEffect(() => {
    fetchFormData();
    if (initialData?.tags) {
      setSelectedTags(initialData.tags);
    }
    if (initialData?.dependencies) {
      setSelectedDependencies(initialData.dependencies);
    }
  }, [initialData]);

  const fetchFormData = async () => {
    try {
      // 获取项目列表
      const projectsResponse = await fetch('/api/projects');
      if (projectsResponse.ok) {
        const projectsData = await projectsResponse.json();
        const projectsList = Array.isArray(projectsData.data)
          ? projectsData.data
          : Array.isArray(projectsData)
            ? projectsData
            : [];
        setProjects(projectsList);
      }

      // 获取用户列表
      const usersResponse = await fetch('/api/users');
      if (usersResponse.ok) {
        const usersData = await usersResponse.json();
        const usersList = Array.isArray(usersData.data)
          ? usersData.data
          : Array.isArray(usersData)
            ? usersData
            : [];
        setUsers(usersList);
      }

      // 获取标签列表
      const tagsResponse = await fetch('/api/tags');
      if (tagsResponse.ok) {
        const tagsData = await tagsResponse.json();
        const tagsList = Array.isArray(tagsData.data)
          ? tagsData.data
          : Array.isArray(tagsData)
            ? tagsData
            : [];
        setTags(tagsList);
      }

      // 获取需求列表（用于依赖关系）
      const requirementsResponse = await fetch('/api/requirements');
      if (requirementsResponse.ok) {
        const requirementsData = await requirementsResponse.json();
        const requirementsList = Array.isArray(requirementsData.data)
          ? requirementsData.data
          : Array.isArray(requirementsData)
            ? requirementsData
            : [];
        setRequirements(requirementsList);
      }
    } catch (error) {
      console.error('获取表单数据失败:', error);
      // 确保在错误情况下也设置为空数组
      setProjects([]);
      setUsers([]);
      setTags([]);
      setRequirements([]);
    }
  };

  const onSubmit = async (data: RequirementFormData) => {
    try {
      setLoading(true);

      const submitData = {
        ...data,
        tags: selectedTags,
        dependencies: selectedDependencies
      };

      let url: string;
      let method: string;

      if (requirementId) {
        // 更新需求
        if (projectId) {
          url = `/api/projects/${projectId}/requirements/${requirementId}`;
        } else {
          url = `/api/requirements/${requirementId}`;
        }
        method = 'PATCH';
      } else {
        // 创建需求
        if (projectId) {
          url = `/api/projects/${projectId}/requirements`;
        } else {
          url = '/api/requirements';
        }
        method = 'POST';
      }

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(submitData)
      });

      if (!response.ok) {
        throw new Error(requirementId ? '更新需求失败' : '创建需求失败');
      }

      const result = await response.json();

      toast({
        title: '成功',
        description: requirementId ? '需求已更新' : '需求已创建'
      });

      if (onSuccess) {
        onSuccess();
      } else {
        router.push(`/dashboard/requirements/${result.data.id}`);
      }
    } catch (error) {
      console.error('提交失败:', error);
      toast({
        title: '错误',
        description: requirementId
          ? '更新需求失败，请稍后重试'
          : '创建需求失败，请稍后重试',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleTagToggle = (tagId: string) => {
    setSelectedTags((prev) =>
      prev.includes(tagId)
        ? prev.filter((id) => id !== tagId)
        : [...prev, tagId]
    );
  };

  const handleDependencyToggle = (reqId: string) => {
    setSelectedDependencies((prev) =>
      prev.includes(reqId)
        ? prev.filter((id) => id !== reqId)
        : [...prev, reqId]
    );
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-6'>
        {/* 基本信息 */}
        <Card>
          <CardHeader>
            <CardTitle className='flex items-center'>
              <FileText className='mr-2 h-5 w-5' />
              基本信息
            </CardTitle>
            <CardDescription>填写需求的基本信息和描述</CardDescription>
          </CardHeader>
          <CardContent className='space-y-4'>
            <FormField
              control={form.control}
              name='title'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>需求标题 *</FormLabel>
                  <FormControl>
                    <Input placeholder='请输入需求标题' {...field} />
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
                  <FormLabel>需求描述 *</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder='请详细描述需求内容、背景和目标'
                      className='min-h-[120px]'
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className='grid grid-cols-1 gap-4 md:grid-cols-2'>
              <FormField
                control={form.control}
                name='type'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>需求类型 *</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder='选择需求类型' />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {typeOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
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
                    <FormLabel>优先级 *</FormLabel>
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
                        {priorityOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className='grid grid-cols-1 gap-4 md:grid-cols-2'>
              <FormField
                control={form.control}
                name='complexity'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>复杂度 *</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder='选择复杂度' />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {complexityOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name='status'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>状态 *</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder='选择状态' />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {statusOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </CardContent>
        </Card>

        {/* 项目和人员 */}
        <Card>
          <CardHeader>
            <CardTitle>项目和人员</CardTitle>
            <CardDescription>关联项目和分配负责人</CardDescription>
          </CardHeader>
          <CardContent className='space-y-4'>
            <div className='grid grid-cols-1 gap-4 md:grid-cols-2'>
              <FormField
                control={form.control}
                name='projectId'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>关联项目</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder='选择项目' />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value=''>不关联项目</SelectItem>
                        {projects.map((project) => (
                          <SelectItem key={project.id} value={project.id}>
                            {project.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name='assigneeId'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>负责人</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder='选择负责人' />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value=''>暂不分配</SelectItem>
                        {users.map((user) => (
                          <SelectItem key={user.id} value={user.id}>
                            {user.name} ({user.email})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </CardContent>
        </Card>

        {/* 评估信息 */}
        <Card>
          <CardHeader>
            <CardTitle>评估信息</CardTitle>
            <CardDescription>
              设置业务价值、工作量估算和截止日期
            </CardDescription>
          </CardHeader>
          <CardContent className='space-y-4'>
            <div className='grid grid-cols-1 gap-4 md:grid-cols-3'>
              <FormField
                control={form.control}
                name='businessValue'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>业务价值 (0-100)</FormLabel>
                    <FormControl>
                      <Input
                        type='number'
                        min='0'
                        max='100'
                        {...field}
                        onChange={(e) => field.onChange(Number(e.target.value))}
                      />
                    </FormControl>
                    <FormDescription>
                      评估该需求对业务的价值程度
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name='estimatedEffort'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>预估工作量 (小时)</FormLabel>
                    <FormControl>
                      <Input
                        type='number'
                        min='0'
                        step='0.5'
                        {...field}
                        onChange={(e) => field.onChange(Number(e.target.value))}
                      />
                    </FormControl>
                    <FormDescription>
                      预估完成该需求所需的工作时间
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name='dueDate'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>截止日期</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant='outline'
                            className={cn(
                              'w-full pl-3 text-left font-normal',
                              !field.value && 'text-muted-foreground'
                            )}
                          >
                            {field.value
                              ? format(field.value, 'PPP', { locale: zhCN })
                              : '选择日期'}
                            <CalendarIcon className='ml-auto h-4 w-4 opacity-50' />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className='w-auto p-0' align='start'>
                        <Calendar
                          mode='single'
                          selected={field.value}
                          onSelect={field.onChange}
                          disabled={(date) => date < new Date()}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </CardContent>
        </Card>

        {/* 详细信息 */}
        <Card>
          <CardHeader>
            <CardTitle>详细信息</CardTitle>
            <CardDescription>补充验收标准、业务规则和技术说明</CardDescription>
          </CardHeader>
          <CardContent className='space-y-4'>
            <FormField
              control={form.control}
              name='acceptanceCriteria'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>验收标准</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder='请描述该需求的验收标准和测试要点'
                      className='min-h-[100px]'
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name='businessRules'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>业务规则</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder='请描述相关的业务规则和约束条件'
                      className='min-h-[100px]'
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name='technicalNotes'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>技术说明</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder='请描述技术实现要点、架构考虑等'
                      className='min-h-[100px]'
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        {/* 标签和依赖 */}
        <Card>
          <CardHeader>
            <CardTitle className='flex items-center'>
              <Tag className='mr-2 h-5 w-5' />
              标签和依赖
            </CardTitle>
            <CardDescription>为需求添加标签和设置依赖关系</CardDescription>
          </CardHeader>
          <CardContent className='space-y-6'>
            {/* 标签 */}
            <div className='space-y-3'>
              <Label>标签</Label>
              <div className='flex flex-wrap gap-2'>
                {tags.map((tag) => (
                  <div key={tag.id} className='flex items-center space-x-2'>
                    <Checkbox
                      id={`tag-${tag.id}`}
                      checked={selectedTags.includes(tag.id)}
                      onCheckedChange={() => handleTagToggle(tag.id)}
                    />
                    <Label htmlFor={`tag-${tag.id}`}>
                      <Badge
                        variant='outline'
                        style={{
                          backgroundColor: tag.color + '20',
                          borderColor: tag.color
                        }}
                      >
                        {tag.name}
                      </Badge>
                    </Label>
                  </div>
                ))}
              </div>
            </div>

            <Separator />

            {/* 依赖关系 */}
            <div className='space-y-3'>
              <Label className='flex items-center'>
                <Link className='mr-2 h-4 w-4' />
                依赖需求
              </Label>
              <div className='max-h-40 space-y-2 overflow-y-auto'>
                {requirements
                  .filter((req) => req.id !== requirementId)
                  .map((requirement) => (
                    <div
                      key={requirement.id}
                      className='flex items-center space-x-2'
                    >
                      <Checkbox
                        id={`dep-${requirement.id}`}
                        checked={selectedDependencies.includes(requirement.id)}
                        onCheckedChange={() =>
                          handleDependencyToggle(requirement.id)
                        }
                      />
                      <Label
                        htmlFor={`dep-${requirement.id}`}
                        className='text-sm'
                      >
                        {requirement.title}
                      </Label>
                    </div>
                  ))}
                {requirements.length === 0 && (
                  <p className='text-muted-foreground text-sm'>
                    暂无其他需求可选择
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 操作按钮 */}
        <div className='flex items-center justify-end space-x-4'>
          <Button type='button' variant='outline' onClick={() => router.back()}>
            <X className='mr-2 h-4 w-4' />
            取消
          </Button>
          <Button type='submit' disabled={loading}>
            <Save className='mr-2 h-4 w-4' />
            {loading ? '保存中...' : requirementId ? '更新需求' : '创建需求'}
          </Button>
        </div>
      </form>
    </Form>
  );
}
