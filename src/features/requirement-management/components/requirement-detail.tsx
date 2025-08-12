'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';
import ReactMarkdown from 'react-markdown';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import {
  CalendarDays,
  User,
  Tag,
  AlertCircle,
  CheckCircle2,
  Clock,
  Edit,
  Save,
  X,
  FileText,
  BarChart3,
  Calendar,
  Users,
  Target,
  Zap,
  Plus,
  Loader2
} from 'lucide-react';
import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

// 动态导入Markdown编辑器，避免SSR问题
const MDEditor = dynamic(
  () => import('@uiw/react-md-editor').then((mod) => mod.default),
  {
    ssr: false,
    loading: () => (
      <div className='bg-muted flex h-32 w-full items-center justify-center rounded-md'>
        <Loader2 className='text-primary h-6 w-6 animate-spin' />
        <span className='ml-2'>加载编辑器...</span>
      </div>
    )
  }
);

interface Requirement {
  id: string;
  title: string;
  description: string;
  status:
    | 'DRAFT'
    | 'REVIEW'
    | 'APPROVED'
    | 'IN_PROGRESS'
    | 'TESTING'
    | 'COMPLETED'
    | 'REJECTED'
    | 'CANCELLED';
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  type: 'FUNCTIONAL' | 'NON_FUNCTIONAL' | 'BUSINESS' | 'TECHNICAL';
  complexity: 'SIMPLE' | 'MEDIUM' | 'COMPLEX' | 'VERY_COMPLEX';
  businessValue: number; // 转换后的数字
  estimatedEffort: number; // 数据库中的 Float 值
  progress: number; // 计算得出的进度
  dueDate?: Date | null;
  assignee?: {
    id: string;
    name: string;
    avatar?: string;
    email?: string;
  };
  creator?: {
    id: string;
    name: string;
    avatar?: string;
    email?: string;
  };
  tags: string[];
  acceptanceCriteria?: string[] | string;
  userStory?: string;
  dependencies?: string[];
  attachments?: {
    id: string;
    name: string;
    url: string;
    type: string;
    size: number;
  }[];
  createdAt: Date;
  updatedAt: Date;
}

interface RequirementDetailProps {
  requirement?: Requirement;
  loading?: boolean;
  editable?: boolean;
  onSave?: (requirement: Partial<Requirement>) => void;
  onEdit?: () => void;
  onCancel?: () => void;
}

// Mock data for demonstration
const mockRequirement: Requirement = {
  id: '1',
  title: 'User Authentication System',
  description:
    'Implement a comprehensive user authentication system with multi-factor authentication support, password policies, and session management. The system should support various authentication methods including email/password, social login, and enterprise SSO integration.',
  status: 'IN_PROGRESS',
  priority: 'HIGH',
  type: 'FUNCTIONAL',
  complexity: 'COMPLEX',
  businessValue: 85,
  estimatedEffort: 40,
  progress: 65,
  dueDate: new Date('2024-02-15'),
  assignee: {
    id: 'user1',
    name: 'John Doe',
    avatar: '/avatars/john.jpg',
    email: 'john.doe@example.com'
  },
  creator: {
    id: 'user2',
    name: 'Jane Smith',
    avatar: '/avatars/jane.jpg',
    email: 'jane.smith@example.com'
  },
  tags: ['security', 'authentication', 'user-management', 'backend'],
  acceptanceCriteria: [
    'Users can register with email and password',
    'Users can login with valid credentials',
    'Password must meet security requirements',
    'Failed login attempts are tracked and limited',
    'Users can reset password via email',
    'Session timeout after 30 minutes of inactivity',
    'Support for 2FA via SMS or authenticator app'
  ],
  userStory:
    '作为一个平台用户，我希望能够安全地注册和登录我的账户，以便我可以访问个人数据和使用平台的各种功能，同时确保我的账户信息受到保护。',
  dependencies: [
    'Email service integration',
    'Database user schema',
    'Security policy definition'
  ],
  attachments: [
    {
      id: 'att1',
      name: 'Authentication Flow Diagram.pdf',
      url: '/attachments/auth-flow.pdf',
      type: 'application/pdf',
      size: 2048576
    },
    {
      id: 'att2',
      name: 'Security Requirements.docx',
      url: '/attachments/security-req.docx',
      type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      size: 1024000
    }
  ],
  createdAt: new Date('2024-01-10'),
  updatedAt: new Date('2024-01-20')
};

export function RequirementDetail({
  requirement = mockRequirement,
  loading = false,
  editable = false,
  onSave,
  onEdit,
  onCancel
}: RequirementDetailProps) {
  const t = useTranslations('requirements');
  const [isEditing, setIsEditing] = useState(editable);
  const [editedRequirement, setEditedRequirement] = useState(requirement);

  // Markdown 编辑器状态
  const [description, setDescription] = useState(requirement.description);
  const [userStory, setUserStory] = useState(requirement.userStory || '');

  // 验收标准列表状态 - 智能处理数组和字符串格式
  const [acceptanceCriteriaList, setAcceptanceCriteriaList] = useState<
    string[]
  >(() => {
    if (!requirement.acceptanceCriteria) return [];
    if (Array.isArray(requirement.acceptanceCriteria)) {
      return requirement.acceptanceCriteria;
    }
    // 如果是字符串，按换行符分割并过滤空行
    return requirement.acceptanceCriteria
      .split('\n')
      .filter((criteria) => criteria.trim());
  });
  const [newAcceptanceCriteria, setNewAcceptanceCriteria] = useState('');

  const statusConfig = {
    DRAFT: {
      label: t('statuses.draft'),
      color: 'bg-gray-100 text-gray-800 border-gray-200',
      icon: Clock
    },
    REVIEW: {
      label: t('statuses.review'),
      color: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      icon: AlertCircle
    },
    APPROVED: {
      label: t('statuses.approved'),
      color: 'bg-green-100 text-green-800 border-green-200',
      icon: CheckCircle2
    },
    IN_PROGRESS: {
      label: t('statuses.inProgress'),
      color: 'bg-blue-100 text-blue-800',
      icon: Clock
    },
    TESTING: {
      label: t('statuses.testing'),
      color: 'bg-purple-100 text-purple-800',
      icon: AlertCircle
    },
    COMPLETED: {
      label: t('statuses.completed'),
      color: 'bg-green-100 text-green-800 border-green-200',
      icon: CheckCircle2
    },
    REJECTED: {
      label: t('statuses.rejected'),
      color: 'bg-red-100 text-red-800 border-red-200',
      icon: AlertCircle
    },
    CANCELLED: {
      label: t('statuses.cancelled'),
      color: 'bg-gray-100 text-gray-800 border-gray-200',
      icon: AlertCircle
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

  const typeConfig = {
    FUNCTIONAL: { label: t('types.functional'), icon: Target },
    NON_FUNCTIONAL: { label: t('types.nonFunctional'), icon: Zap },
    BUSINESS: { label: t('types.business'), icon: BarChart3 },
    TECHNICAL: { label: t('types.technical'), icon: FileText },
    UI_UX: { label: t('types.uiUx'), icon: FileText }
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

  const StatusIcon = statusConfig[requirement.status]?.icon || Clock;
  const TypeIcon = typeConfig[requirement.type]?.icon || FileText;

  const handleEdit = () => {
    setIsEditing(true);
    // 确保 editedRequirement 包含正确的字段
    setEditedRequirement({
      ...requirement,
      // 确保数字字段是数字类型
      businessValue: requirement.businessValue || 5,
      estimatedEffort: requirement.estimatedEffort || 0,
      progress: requirement.progress || 0
    });
    setDescription(requirement.description || '');
    setUserStory(requirement.userStory || '');
    setAcceptanceCriteriaList(() => {
      if (!requirement.acceptanceCriteria) return [];
      if (Array.isArray(requirement.acceptanceCriteria)) {
        return requirement.acceptanceCriteria;
      }
      // 如果是字符串，按换行符分割并过滤空行
      return requirement.acceptanceCriteria
        .split('\n')
        .filter((criteria) => criteria.trim());
    });
    onEdit?.();
  };

  const handleSave = () => {
    const updatedRequirement = {
      ...editedRequirement,
      description,
      userStory,
      // 将验收标准数组转换为换行符分隔的字符串，与创建表单保持一致
      acceptanceCriteria:
        acceptanceCriteriaList.length > 0
          ? acceptanceCriteriaList.join('\n')
          : undefined
    };
    onSave?.(updatedRequirement);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditedRequirement(requirement);
    setDescription(requirement.description || '');
    setUserStory(requirement.userStory || '');
    setAcceptanceCriteriaList(() => {
      if (!requirement.acceptanceCriteria) return [];
      if (Array.isArray(requirement.acceptanceCriteria)) {
        return requirement.acceptanceCriteria;
      }
      // 如果是字符串，按换行符分割并过滤空行
      return requirement.acceptanceCriteria
        .split('\n')
        .filter((criteria) => criteria.trim());
    });
    setNewAcceptanceCriteria('');
    onCancel?.();
  };

  // 验收标准操作函数
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

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  if (loading) {
    return (
      <div className='space-y-6'>
        {[...Array(4)].map((_, i) => (
          <Card key={i} className='animate-pulse'>
            <CardHeader>
              <div className='h-6 w-1/3 rounded bg-gray-200'></div>
            </CardHeader>
            <CardContent>
              <div className='space-y-3'>
                <div className='h-4 rounded bg-gray-200'></div>
                <div className='h-4 w-5/6 rounded bg-gray-200'></div>
                <div className='h-4 w-2/3 rounded bg-gray-200'></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className='space-y-6'>
      {/* Compact Banner/Header Style */}
      <Card>
        <CardHeader>
          <div className='flex items-start justify-between'>
            <div className='space-y-2'>
              {isEditing ? (
                <Input
                  value={editedRequirement.title}
                  onChange={(e) =>
                    setEditedRequirement({
                      ...editedRequirement,
                      title: e.target.value
                    })
                  }
                  className='text-2xl font-bold'
                />
              ) : (
                <CardTitle className='text-2xl'>{requirement.title}</CardTitle>
              )}
              <div className='flex items-center gap-2'>
                <StatusIcon className='h-4 w-4' />
                {isEditing ? (
                  <Select
                    value={editedRequirement.status}
                    onValueChange={(value: any) =>
                      setEditedRequirement({
                        ...editedRequirement,
                        status: value
                      })
                    }
                  >
                    <SelectTrigger className='w-32'>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(statusConfig).map(([key, config]) => (
                        <SelectItem key={key} value={key}>
                          {config.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <Badge
                    className={cn(
                      statusConfig[requirement.status]?.color ||
                        'bg-gray-100 text-gray-800'
                    )}
                  >
                    {statusConfig[requirement.status]?.label ||
                      requirement.status}
                  </Badge>
                )}
              </div>
            </div>
            <div className='flex items-center gap-2'>
              {isEditing ? (
                <>
                  <Button onClick={handleSave} size='sm'>
                    <Save className='mr-2 h-4 w-4' />
                    保存
                  </Button>
                  <Button onClick={handleCancel} variant='outline' size='sm'>
                    <X className='mr-2 h-4 w-4' />
                    取消
                  </Button>
                </>
              ) : (
                <Button onClick={handleEdit} size='sm'>
                  <Edit className='mr-2 h-4 w-4' />
                  编辑
                </Button>
              )}
            </div>
          </div>
        </CardHeader>

        <CardContent>
          {/* Compact Info Banner */}
          <div className='mb-6 space-y-4 rounded-lg bg-gray-50 p-4'>
            {/* Top Row: Basic Info */}
            <div className='grid grid-cols-2 gap-x-8 gap-y-3 sm:grid-cols-4 lg:grid-cols-6'>
              {/* Priority */}
              <div className='flex items-center gap-2'>
                <AlertCircle className='text-muted-foreground h-3 w-3' />
                <span className='text-muted-foreground text-xs'>优先级:</span>
                {isEditing ? (
                  <Select
                    value={editedRequirement.priority}
                    onValueChange={(value: any) =>
                      setEditedRequirement({
                        ...editedRequirement,
                        priority: value
                      })
                    }
                  >
                    <SelectTrigger className='h-6 w-20 text-xs'>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(priorityConfig).map(([key, config]) => (
                        <SelectItem key={key} value={key}>
                          {config.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <Badge
                    className={cn(
                      priorityConfig[requirement.priority]?.color ||
                        'bg-gray-100 text-gray-800',
                      'px-1.5 py-0.5 text-xs'
                    )}
                  >
                    {priorityConfig[requirement.priority]?.label ||
                      requirement.priority}
                  </Badge>
                )}
              </div>

              {/* Type */}
              <div className='flex items-center gap-2'>
                <TypeIcon className='text-muted-foreground h-3 w-3' />
                <span className='text-muted-foreground text-xs'>类型:</span>
                {isEditing ? (
                  <Select
                    value={editedRequirement.type}
                    onValueChange={(value: any) =>
                      setEditedRequirement({
                        ...editedRequirement,
                        type: value
                      })
                    }
                  >
                    <SelectTrigger className='h-6 w-20 text-xs'>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(typeConfig).map(([key, config]) => (
                        <SelectItem key={key} value={key}>
                          {config.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <span className='text-xs font-medium'>
                    {typeConfig[requirement.type]?.label || requirement.type}
                  </span>
                )}
              </div>

              {/* Complexity */}
              <div className='flex items-center gap-2'>
                <BarChart3 className='text-muted-foreground h-3 w-3' />
                <span className='text-muted-foreground text-xs'>复杂度:</span>
                {isEditing ? (
                  <Select
                    value={editedRequirement.complexity}
                    onValueChange={(value: any) =>
                      setEditedRequirement({
                        ...editedRequirement,
                        complexity: value
                      })
                    }
                  >
                    <SelectTrigger className='h-6 w-20 text-xs'>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(complexityConfig).map(([key, config]) => (
                        <SelectItem key={key} value={key}>
                          {config.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <Badge
                    className={cn(
                      complexityConfig[requirement.complexity]?.color ||
                        'bg-gray-100 text-gray-800',
                      'px-1.5 py-0.5 text-xs'
                    )}
                  >
                    {complexityConfig[requirement.complexity]?.label ||
                      requirement.complexity}
                  </Badge>
                )}
              </div>

              {/* Due Date */}
              <div className='flex items-center gap-2'>
                <Calendar className='text-muted-foreground h-3 w-3' />
                <span className='text-muted-foreground text-xs'>截止:</span>
                {requirement.dueDate ? (
                  <span className='text-xs font-medium'>
                    {format(requirement.dueDate, 'MM/dd')}
                  </span>
                ) : (
                  <span className='text-xs text-gray-400'>未设置</span>
                )}
              </div>

              {/* Assignee */}
              <div className='flex items-center gap-2'>
                <User className='text-muted-foreground h-3 w-3' />
                <span className='text-muted-foreground text-xs'>负责人:</span>
                {requirement.assignee ? (
                  <div className='flex items-center gap-1'>
                    <Avatar className='h-4 w-4'>
                      <AvatarImage src={requirement.assignee.avatar} />
                      <AvatarFallback className='text-xs'>
                        {requirement.assignee.name.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <span className='text-xs font-medium'>
                      {requirement.assignee.name}
                    </span>
                  </div>
                ) : (
                  <span className='text-xs text-gray-400'>未分配</span>
                )}
              </div>

              {/* Progress */}
              <div className='flex items-center gap-2'>
                <BarChart3 className='text-muted-foreground h-3 w-3' />
                <span className='text-muted-foreground text-xs'>进度:</span>
                <div className='flex items-center gap-1'>
                  <span className='text-xs font-medium text-purple-600'>
                    {requirement.progress}%
                  </span>
                  <Progress value={requirement.progress} className='h-1 w-12' />
                </div>
              </div>
            </div>

            {/* Bottom Row: Metrics */}
            <div className='grid grid-cols-3 gap-4 border-t border-gray-200 pt-2'>
              <div className='flex items-center gap-2'>
                <Target className='h-3 w-3 text-green-600' />
                <span className='text-muted-foreground text-xs'>商业价值:</span>
                {isEditing ? (
                  <Input
                    type='number'
                    min='0'
                    max='100'
                    value={editedRequirement.businessValue}
                    onChange={(e) =>
                      setEditedRequirement({
                        ...editedRequirement,
                        businessValue: parseInt(e.target.value)
                      })
                    }
                    className='h-6 w-12 text-xs'
                  />
                ) : (
                  <span className='text-xs font-bold text-green-600'>
                    {requirement.businessValue}/100
                  </span>
                )}
              </div>

              <div className='flex items-center gap-2'>
                <Zap className='h-3 w-3 text-blue-600' />
                <span className='text-muted-foreground text-xs'>工作量:</span>
                {isEditing ? (
                  <Input
                    type='number'
                    min='0'
                    value={editedRequirement.estimatedEffort}
                    onChange={(e) =>
                      setEditedRequirement({
                        ...editedRequirement,
                        estimatedEffort: parseInt(e.target.value)
                      })
                    }
                    className='h-6 w-12 text-xs'
                  />
                ) : (
                  <span className='text-xs font-bold text-blue-600'>
                    {requirement.estimatedEffort}天
                  </span>
                )}
              </div>

              <div className='flex items-center gap-2'>
                <CalendarDays className='text-muted-foreground h-3 w-3' />
                <span className='text-muted-foreground text-xs'>创建:</span>
                <span className='text-xs'>
                  {format(requirement.createdAt, 'MM/dd/yyyy')}
                </span>
              </div>
            </div>

            {/* Tags */}
            {requirement.tags.length > 0 && (
              <div className='flex items-center gap-2 pt-2'>
                <Tag className='text-muted-foreground h-3 w-3' />
                <span className='text-muted-foreground text-xs'>标签:</span>
                <div className='flex flex-wrap gap-1'>
                  {requirement.tags.map((tag) => (
                    <Badge
                      key={tag}
                      variant='secondary'
                      className='px-1.5 py-0.5 text-xs'
                    >
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Attachments */}
            {requirement.attachments && requirement.attachments.length > 0 && (
              <div className='flex items-center gap-2 pt-2'>
                <FileText className='text-muted-foreground h-3 w-3' />
                <span className='text-muted-foreground text-xs'>附件:</span>
                <div className='flex items-center gap-2'>
                  {requirement.attachments.slice(0, 2).map((attachment) => (
                    <div
                      key={attachment.id}
                      className='flex items-center gap-1'
                    >
                      <span className='max-w-20 truncate text-xs font-medium'>
                        {attachment.name}
                      </span>
                      <Button
                        variant='outline'
                        size='sm'
                        className='h-5 px-1.5 text-xs'
                      >
                        下载
                      </Button>
                    </div>
                  ))}
                  {requirement.attachments.length > 2 && (
                    <span className='text-muted-foreground text-xs'>
                      +{requirement.attachments.length - 2}个
                    </span>
                  )}
                </div>
              </div>
            )}

            {/* Dependencies */}
            {requirement.dependencies &&
              requirement.dependencies.length > 0 && (
                <div className='flex items-start gap-2 pt-2'>
                  <AlertCircle className='mt-0.5 h-3 w-3 text-orange-500' />
                  <span className='text-muted-foreground text-xs'>依赖:</span>
                  <div className='flex flex-wrap gap-1'>
                    {requirement.dependencies
                      .slice(0, 3)
                      .map((dependency, index) => (
                        <span
                          key={index}
                          className='rounded bg-orange-50 px-2 py-0.5 text-xs text-orange-700'
                        >
                          {dependency}
                        </span>
                      ))}
                    {requirement.dependencies.length > 3 && (
                      <span className='text-muted-foreground text-xs'>
                        +{requirement.dependencies.length - 3}个
                      </span>
                    )}
                  </div>
                </div>
              )}
          </div>

          {/* Description Section */}
          <div className='space-y-4'>
            <div>
              <Label className='mb-2 block text-sm font-medium'>需求描述</Label>
              {isEditing ? (
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
              ) : (
                <div className='rounded-lg bg-gray-50 p-4'>
                  {description ? (
                    <div className='prose prose-sm prose-headings:font-semibold prose-h1:text-lg prose-h2:text-base prose-h3:text-sm prose-p:mb-2 prose-p:leading-relaxed prose-p:text-gray-700 prose-ul:mb-2 prose-ul:list-disc prose-ul:pl-4 prose-ol:mb-2 prose-ol:list-decimal prose-ol:pl-4 prose-li:text-gray-700 prose-blockquote:border-l-4 prose-blockquote:border-gray-300 prose-blockquote:pl-4 prose-blockquote:italic prose-blockquote:text-gray-600 prose-code:rounded prose-code:bg-gray-200 prose-code:px-1 prose-code:text-sm prose-pre:overflow-x-auto prose-pre:rounded prose-pre:bg-gray-100 prose-pre:p-2 max-w-none'>
                      <ReactMarkdown>{description}</ReactMarkdown>
                    </div>
                  ) : (
                    <div className='text-sm text-gray-500 italic'>暂无描述</div>
                  )}
                </div>
              )}
            </div>

            {/* User Story */}
            <div>
              <Label className='mb-2 block flex items-center gap-2 text-sm font-medium'>
                <Users className='h-4 w-4 text-blue-600' />
                用户故事
              </Label>
              {isEditing ? (
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
              ) : (
                <div className='rounded-lg bg-blue-50 p-4'>
                  {userStory ? (
                    <div className='prose prose-sm prose-headings:font-semibold prose-headings:text-blue-900 prose-h1:text-lg prose-h2:text-base prose-h3:text-sm prose-p:mb-2 prose-p:leading-relaxed prose-p:text-blue-800 prose-ul:mb-2 prose-ul:list-disc prose-ul:pl-4 prose-ol:mb-2 prose-ol:list-decimal prose-ol:pl-4 prose-li:text-blue-800 prose-blockquote:border-l-4 prose-blockquote:border-blue-300 prose-blockquote:pl-4 prose-blockquote:italic prose-blockquote:text-blue-700 prose-code:rounded prose-code:bg-blue-200 prose-code:px-1 prose-code:text-sm prose-code:text-blue-900 prose-pre:overflow-x-auto prose-pre:rounded prose-pre:bg-blue-100 prose-pre:p-2 max-w-none'>
                      <ReactMarkdown>{userStory}</ReactMarkdown>
                    </div>
                  ) : (
                    <div className='flex items-center gap-2 text-blue-600'>
                      <Users className='h-4 w-4' />
                      <span className='text-sm italic'>暂无用户故事</span>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Acceptance Criteria */}
            {(acceptanceCriteriaList.length > 0 || isEditing) && (
              <div>
                <Label className='mb-2 block flex items-center gap-2 text-sm font-medium'>
                  <CheckCircle2 className='h-4 w-4 text-green-600' />
                  验收标准
                </Label>
                {isEditing ? (
                  <div className='space-y-4'>
                    {/* 现有的验收标准列表 */}
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
                            className='h-8 w-8 p-0 text-red-500 hover:text-red-700'
                          >
                            <X className='h-4 w-4' />
                          </Button>
                        </div>
                      ))}
                    </div>

                    {/* 添加新验收标准 */}
                    <div className='flex gap-2'>
                      <Input
                        placeholder='请输入验收标准...'
                        value={newAcceptanceCriteria}
                        onChange={(e) =>
                          setNewAcceptanceCriteria(e.target.value)
                        }
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
                        className='shrink-0'
                      >
                        <Plus className='h-4 w-4' />
                      </Button>
                    </div>

                    {acceptanceCriteriaList.length === 0 && (
                      <p className='text-sm text-amber-600'>
                        建议至少添加一个验收标准
                      </p>
                    )}
                  </div>
                ) : acceptanceCriteriaList.length > 0 ? (
                  <div className='rounded-lg bg-gray-50 p-4'>
                    <ul className='space-y-2'>
                      {acceptanceCriteriaList.map((criteria, index) => (
                        <li
                          key={index}
                          className='flex items-start gap-3 text-sm'
                        >
                          <CheckCircle2 className='mt-0.5 h-4 w-4 flex-shrink-0 text-green-500' />
                          <span className='text-gray-700'>{criteria}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : (
                  <div className='rounded-lg bg-gray-50 p-4'>
                    <div className='flex items-center gap-2 text-gray-500'>
                      <CheckCircle2 className='h-4 w-4' />
                      <span className='text-sm italic'>暂无验收标准</span>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default RequirementDetail;
