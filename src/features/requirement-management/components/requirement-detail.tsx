'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
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
  Zap
} from 'lucide-react';
import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

interface Requirement {
  id: string;
  title: string;
  description: string;
  status:
    | 'draft'
    | 'review'
    | 'approved'
    | 'in_progress'
    | 'completed'
    | 'rejected';
  priority: 'low' | 'medium' | 'high' | 'critical';
  type: 'functional' | 'non_functional' | 'business' | 'technical';
  complexity: 'simple' | 'medium' | 'complex' | 'very_complex';
  businessValue: number;
  effort: number;
  progress: number;
  dueDate?: Date;
  assignee?: {
    id: string;
    name: string;
    avatar?: string;
    email?: string;
  };
  creator: {
    id: string;
    name: string;
    avatar?: string;
    email?: string;
  };
  tags: string[];
  acceptanceCriteria?: string[];
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

const statusConfig = {
  draft: {
    label: 'Draft',
    color: 'bg-gray-100 text-gray-800 border-gray-200',
    icon: Clock
  },
  review: {
    label: 'Review',
    color: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    icon: AlertCircle
  },
  approved: {
    label: 'Approved',
    color: 'bg-green-100 text-green-800 border-green-200',
    icon: CheckCircle2
  },
  in_progress: {
    label: 'In Progress',
    color: 'bg-blue-100 text-blue-800 border-blue-200',
    icon: Clock
  },
  completed: {
    label: 'Completed',
    color: 'bg-green-100 text-green-800 border-green-200',
    icon: CheckCircle2
  },
  rejected: {
    label: 'Rejected',
    color: 'bg-red-100 text-red-800 border-red-200',
    icon: AlertCircle
  }
};

const priorityConfig = {
  low: { label: 'Low', color: 'bg-gray-100 text-gray-800' },
  medium: { label: 'Medium', color: 'bg-yellow-100 text-yellow-800' },
  high: { label: 'High', color: 'bg-orange-100 text-orange-800' },
  critical: { label: 'Critical', color: 'bg-red-100 text-red-800' }
};

const typeConfig = {
  functional: { label: 'Functional', icon: Target },
  non_functional: { label: 'Non-Functional', icon: Zap },
  business: { label: 'Business', icon: BarChart3 },
  technical: { label: 'Technical', icon: FileText }
};

const complexityConfig = {
  simple: { label: 'Simple', color: 'bg-green-100 text-green-800' },
  medium: { label: 'Medium', color: 'bg-yellow-100 text-yellow-800' },
  complex: { label: 'Complex', color: 'bg-orange-100 text-orange-800' },
  very_complex: { label: 'Very Complex', color: 'bg-red-100 text-red-800' }
};

// Mock data for demonstration
const mockRequirement: Requirement = {
  id: '1',
  title: 'User Authentication System',
  description:
    'Implement a comprehensive user authentication system with multi-factor authentication support, password policies, and session management. The system should support various authentication methods including email/password, social login, and enterprise SSO integration.',
  status: 'in_progress',
  priority: 'high',
  type: 'functional',
  complexity: 'complex',
  businessValue: 85,
  effort: 40,
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

  const StatusIcon = statusConfig[requirement.status].icon;
  const TypeIcon = typeConfig[requirement.type].icon;

  const handleEdit = () => {
    setIsEditing(true);
    setEditedRequirement(requirement);
    onEdit?.();
  };

  const handleSave = () => {
    onSave?.(editedRequirement);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditedRequirement(requirement);
    onCancel?.();
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
      {/* Header */}
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
                  <Badge className={cn(statusConfig[requirement.status].color)}>
                    {statusConfig[requirement.status].label}
                  </Badge>
                )}
              </div>
            </div>
            <div className='flex items-center gap-2'>
              {isEditing ? (
                <>
                  <Button onClick={handleSave} size='sm'>
                    <Save className='mr-2 h-4 w-4' />
                    Save
                  </Button>
                  <Button onClick={handleCancel} variant='outline' size='sm'>
                    <X className='mr-2 h-4 w-4' />
                    Cancel
                  </Button>
                </>
              ) : (
                <Button onClick={handleEdit} size='sm'>
                  <Edit className='mr-2 h-4 w-4' />
                  Edit
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className='space-y-4'>
            {/* Description */}
            <div>
              <Label className='text-sm font-medium'>Description</Label>
              {isEditing ? (
                <Textarea
                  value={editedRequirement.description}
                  onChange={(e) =>
                    setEditedRequirement({
                      ...editedRequirement,
                      description: e.target.value
                    })
                  }
                  className='mt-2'
                  rows={4}
                />
              ) : (
                <p className='mt-2 text-sm text-gray-600'>
                  {requirement.description}
                </p>
              )}
            </div>

            {/* Progress */}
            {requirement.progress > 0 && (
              <div>
                <div className='mb-2 flex items-center justify-between'>
                  <Label className='text-sm font-medium'>Progress</Label>
                  <span className='text-sm font-medium'>
                    {requirement.progress}%
                  </span>
                </div>
                <Progress value={requirement.progress} className='h-2' />
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Metadata */}
      <div className='grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3'>
        {/* Priority */}
        <Card>
          <CardHeader className='pb-3'>
            <CardTitle className='flex items-center gap-2 text-sm font-medium'>
              <AlertCircle className='h-4 w-4' />
              Priority
            </CardTitle>
          </CardHeader>
          <CardContent>
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
                <SelectTrigger>
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
              <Badge className={cn(priorityConfig[requirement.priority].color)}>
                {priorityConfig[requirement.priority].label}
              </Badge>
            )}
          </CardContent>
        </Card>

        {/* Type */}
        <Card>
          <CardHeader className='pb-3'>
            <CardTitle className='flex items-center gap-2 text-sm font-medium'>
              <TypeIcon className='h-4 w-4' />
              Type
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isEditing ? (
              <Select
                value={editedRequirement.type}
                onValueChange={(value: any) =>
                  setEditedRequirement({ ...editedRequirement, type: value })
                }
              >
                <SelectTrigger>
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
              <span className='text-sm'>
                {typeConfig[requirement.type].label}
              </span>
            )}
          </CardContent>
        </Card>

        {/* Complexity */}
        <Card>
          <CardHeader className='pb-3'>
            <CardTitle className='flex items-center gap-2 text-sm font-medium'>
              <BarChart3 className='h-4 w-4' />
              Complexity
            </CardTitle>
          </CardHeader>
          <CardContent>
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
                <SelectTrigger>
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
                className={cn(complexityConfig[requirement.complexity].color)}
              >
                {complexityConfig[requirement.complexity].label}
              </Badge>
            )}
          </CardContent>
        </Card>

        {/* Business Value */}
        <Card>
          <CardHeader className='pb-3'>
            <CardTitle className='flex items-center gap-2 text-sm font-medium'>
              <Target className='h-4 w-4' />
              Business Value
            </CardTitle>
          </CardHeader>
          <CardContent>
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
              />
            ) : (
              <span className='text-2xl font-bold text-green-600'>
                {requirement.businessValue}
              </span>
            )}
          </CardContent>
        </Card>

        {/* Effort */}
        <Card>
          <CardHeader className='pb-3'>
            <CardTitle className='flex items-center gap-2 text-sm font-medium'>
              <Zap className='h-4 w-4' />
              Effort
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isEditing ? (
              <Input
                type='number'
                min='0'
                value={editedRequirement.effort}
                onChange={(e) =>
                  setEditedRequirement({
                    ...editedRequirement,
                    effort: parseInt(e.target.value)
                  })
                }
              />
            ) : (
              <span className='text-2xl font-bold text-blue-600'>
                {requirement.effort}
              </span>
            )}
          </CardContent>
        </Card>

        {/* Due Date */}
        <Card>
          <CardHeader className='pb-3'>
            <CardTitle className='flex items-center gap-2 text-sm font-medium'>
              <Calendar className='h-4 w-4' />
              Due Date
            </CardTitle>
          </CardHeader>
          <CardContent>
            {requirement.dueDate ? (
              <span className='text-sm'>
                {format(requirement.dueDate, 'PPP')}
              </span>
            ) : (
              <span className='text-sm text-gray-400'>Not set</span>
            )}
          </CardContent>
        </Card>
      </div>

      {/* People */}
      <div className='grid grid-cols-1 gap-4 md:grid-cols-2'>
        {/* Assignee */}
        <Card>
          <CardHeader className='pb-3'>
            <CardTitle className='flex items-center gap-2 text-sm font-medium'>
              <User className='h-4 w-4' />
              Assignee
            </CardTitle>
          </CardHeader>
          <CardContent>
            {requirement.assignee ? (
              <div className='flex items-center gap-3'>
                <Avatar className='h-8 w-8'>
                  <AvatarImage src={requirement.assignee.avatar} />
                  <AvatarFallback>
                    {requirement.assignee.name.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className='text-sm font-medium'>
                    {requirement.assignee.name}
                  </p>
                  <p className='text-xs text-gray-500'>
                    {requirement.assignee.email}
                  </p>
                </div>
              </div>
            ) : (
              <span className='text-sm text-gray-400'>Unassigned</span>
            )}
          </CardContent>
        </Card>

        {/* Creator */}
        <Card>
          <CardHeader className='pb-3'>
            <CardTitle className='flex items-center gap-2 text-sm font-medium'>
              <Users className='h-4 w-4' />
              Creator
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className='flex items-center gap-3'>
              <Avatar className='h-8 w-8'>
                <AvatarImage src={requirement.creator.avatar} />
                <AvatarFallback>
                  {requirement.creator.name.charAt(0)}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className='text-sm font-medium'>
                  {requirement.creator.name}
                </p>
                <p className='text-xs text-gray-500'>
                  {requirement.creator.email}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tags */}
      {requirement.tags.length > 0 && (
        <Card>
          <CardHeader className='pb-3'>
            <CardTitle className='flex items-center gap-2 text-sm font-medium'>
              <Tag className='h-4 w-4' />
              Tags
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className='flex flex-wrap gap-2'>
              {requirement.tags.map((tag) => (
                <Badge key={tag} variant='secondary'>
                  {tag}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Acceptance Criteria */}
      {requirement.acceptanceCriteria &&
        requirement.acceptanceCriteria.length > 0 && (
          <Card>
            <CardHeader className='pb-3'>
              <CardTitle className='flex items-center gap-2 text-sm font-medium'>
                <CheckCircle2 className='h-4 w-4' />
                Acceptance Criteria
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className='space-y-2'>
                {requirement.acceptanceCriteria.map((criteria, index) => (
                  <li key={index} className='flex items-start gap-2 text-sm'>
                    <CheckCircle2 className='mt-0.5 h-4 w-4 flex-shrink-0 text-green-500' />
                    {criteria}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}

      {/* Dependencies */}
      {requirement.dependencies && requirement.dependencies.length > 0 && (
        <Card>
          <CardHeader className='pb-3'>
            <CardTitle className='flex items-center gap-2 text-sm font-medium'>
              <AlertCircle className='h-4 w-4' />
              Dependencies
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className='space-y-2'>
              {requirement.dependencies.map((dependency, index) => (
                <li key={index} className='flex items-start gap-2 text-sm'>
                  <AlertCircle className='mt-0.5 h-4 w-4 flex-shrink-0 text-orange-500' />
                  {dependency}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* Attachments */}
      {requirement.attachments && requirement.attachments.length > 0 && (
        <Card>
          <CardHeader className='pb-3'>
            <CardTitle className='flex items-center gap-2 text-sm font-medium'>
              <FileText className='h-4 w-4' />
              Attachments
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className='space-y-2'>
              {requirement.attachments.map((attachment) => (
                <div
                  key={attachment.id}
                  className='flex items-center justify-between rounded border p-2'
                >
                  <div className='flex items-center gap-2'>
                    <FileText className='h-4 w-4 text-gray-500' />
                    <div>
                      <p className='text-sm font-medium'>{attachment.name}</p>
                      <p className='text-xs text-gray-500'>
                        {formatFileSize(attachment.size)}
                      </p>
                    </div>
                  </div>
                  <Button variant='outline' size='sm'>
                    Download
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Timestamps */}
      <Card>
        <CardHeader className='pb-3'>
          <CardTitle className='flex items-center gap-2 text-sm font-medium'>
            <CalendarDays className='h-4 w-4' />
            Timeline
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className='grid grid-cols-1 gap-4 text-sm md:grid-cols-2'>
            <div>
              <Label className='text-xs text-gray-500'>Created</Label>
              <p>{format(requirement.createdAt, 'PPP p')}</p>
            </div>
            <div>
              <Label className='text-xs text-gray-500'>Last Updated</Label>
              <p>{format(requirement.updatedAt, 'PPP p')}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default RequirementDetail;
