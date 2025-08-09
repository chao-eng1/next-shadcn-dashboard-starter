'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger
} from '@/components/ui/collapsible';
import {
  ChevronDown,
  ChevronRight,
  Plus,
  MoreHorizontal,
  Edit,
  Trash2,
  Eye,
  Link2,
  CalendarDays,
  User,
  Tag,
  AlertCircle,
  CheckCircle2,
  Clock
} from 'lucide-react';
import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';

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
  };
  creator: {
    id: string;
    name: string;
    avatar?: string;
  };
  tags: string[];
  children?: Requirement[];
  parentId?: string;
  createdAt: Date;
  updatedAt: Date;
}

interface RequirementTreeProps {
  requirements?: Requirement[];
  loading?: boolean;
  onRequirementClick?: (requirement: Requirement) => void;
  onRequirementEdit?: (requirement: Requirement) => void;
  onRequirementDelete?: (requirementId: string) => void;
  onAddChild?: (parentId: string) => void;
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

// Mock hierarchical data for demonstration
const mockRequirements: Requirement[] = [
  {
    id: '1',
    title: 'User Management System',
    description:
      'Complete user management functionality including authentication, authorization, and profile management.',
    status: 'in_progress',
    priority: 'high',
    type: 'functional',
    complexity: 'complex',
    businessValue: 90,
    effort: 60,
    progress: 45,
    dueDate: new Date('2024-03-15'),
    assignee: {
      id: 'user1',
      name: 'John Doe',
      avatar: '/avatars/john.jpg'
    },
    creator: {
      id: 'user2',
      name: 'Jane Smith',
      avatar: '/avatars/jane.jpg'
    },
    tags: ['authentication', 'user-management'],
    createdAt: new Date('2024-01-10'),
    updatedAt: new Date('2024-01-20'),
    children: [
      {
        id: '1-1',
        title: 'User Registration',
        description: 'Allow new users to register with email and password.',
        status: 'completed',
        priority: 'high',
        type: 'functional',
        complexity: 'medium',
        businessValue: 80,
        effort: 20,
        progress: 100,
        parentId: '1',
        assignee: {
          id: 'user1',
          name: 'John Doe',
          avatar: '/avatars/john.jpg'
        },
        creator: {
          id: 'user2',
          name: 'Jane Smith',
          avatar: '/avatars/jane.jpg'
        },
        tags: ['registration', 'authentication'],
        createdAt: new Date('2024-01-10'),
        updatedAt: new Date('2024-01-25')
      },
      {
        id: '1-2',
        title: 'User Login',
        description:
          'Secure user login with email/password and remember me functionality.',
        status: 'completed',
        priority: 'high',
        type: 'functional',
        complexity: 'medium',
        businessValue: 85,
        effort: 15,
        progress: 100,
        parentId: '1',
        assignee: {
          id: 'user1',
          name: 'John Doe',
          avatar: '/avatars/john.jpg'
        },
        creator: {
          id: 'user2',
          name: 'Jane Smith',
          avatar: '/avatars/jane.jpg'
        },
        tags: ['login', 'authentication'],
        createdAt: new Date('2024-01-12'),
        updatedAt: new Date('2024-01-28')
      },
      {
        id: '1-3',
        title: 'Password Reset',
        description: 'Allow users to reset their password via email.',
        status: 'in_progress',
        priority: 'medium',
        type: 'functional',
        complexity: 'medium',
        businessValue: 60,
        effort: 12,
        progress: 70,
        parentId: '1',
        assignee: {
          id: 'user3',
          name: 'Mike Johnson',
          avatar: '/avatars/mike.jpg'
        },
        creator: {
          id: 'user2',
          name: 'Jane Smith',
          avatar: '/avatars/jane.jpg'
        },
        tags: ['password', 'reset'],
        createdAt: new Date('2024-01-15'),
        updatedAt: new Date('2024-02-01')
      },
      {
        id: '1-4',
        title: 'Profile Management',
        description: 'Allow users to view and edit their profile information.',
        status: 'draft',
        priority: 'medium',
        type: 'functional',
        complexity: 'simple',
        businessValue: 50,
        effort: 8,
        progress: 0,
        parentId: '1',
        creator: {
          id: 'user2',
          name: 'Jane Smith',
          avatar: '/avatars/jane.jpg'
        },
        tags: ['profile', 'user-data'],
        createdAt: new Date('2024-01-20'),
        updatedAt: new Date('2024-01-20')
      }
    ]
  },
  {
    id: '2',
    title: 'Project Management',
    description:
      'Core project management features including project creation, task management, and team collaboration.',
    status: 'review',
    priority: 'high',
    type: 'functional',
    complexity: 'very_complex',
    businessValue: 95,
    effort: 80,
    progress: 25,
    dueDate: new Date('2024-04-30'),
    assignee: {
      id: 'user4',
      name: 'Sarah Wilson',
      avatar: '/avatars/sarah.jpg'
    },
    creator: {
      id: 'user2',
      name: 'Jane Smith',
      avatar: '/avatars/jane.jpg'
    },
    tags: ['project-management', 'collaboration'],
    createdAt: new Date('2024-01-15'),
    updatedAt: new Date('2024-02-05'),
    children: [
      {
        id: '2-1',
        title: 'Project Creation',
        description:
          'Allow users to create new projects with basic information.',
        status: 'approved',
        priority: 'high',
        type: 'functional',
        complexity: 'medium',
        businessValue: 75,
        effort: 18,
        progress: 0,
        parentId: '2',
        assignee: {
          id: 'user4',
          name: 'Sarah Wilson',
          avatar: '/avatars/sarah.jpg'
        },
        creator: {
          id: 'user2',
          name: 'Jane Smith',
          avatar: '/avatars/jane.jpg'
        },
        tags: ['project', 'creation'],
        createdAt: new Date('2024-01-15'),
        updatedAt: new Date('2024-02-05')
      },
      {
        id: '2-2',
        title: 'Task Management',
        description: 'Create, assign, and track tasks within projects.',
        status: 'draft',
        priority: 'high',
        type: 'functional',
        complexity: 'complex',
        businessValue: 85,
        effort: 35,
        progress: 0,
        parentId: '2',
        creator: {
          id: 'user2',
          name: 'Jane Smith',
          avatar: '/avatars/jane.jpg'
        },
        tags: ['tasks', 'management'],
        createdAt: new Date('2024-01-18'),
        updatedAt: new Date('2024-01-18')
      }
    ]
  },
  {
    id: '3',
    title: 'Reporting Dashboard',
    description: 'Analytics and reporting dashboard for project insights.',
    status: 'draft',
    priority: 'medium',
    type: 'functional',
    complexity: 'complex',
    businessValue: 70,
    effort: 45,
    progress: 0,
    dueDate: new Date('2024-05-15'),
    creator: {
      id: 'user5',
      name: 'David Brown',
      avatar: '/avatars/david.jpg'
    },
    tags: ['reporting', 'analytics', 'dashboard'],
    createdAt: new Date('2024-01-25'),
    updatedAt: new Date('2024-01-25')
  }
];

interface RequirementNodeProps {
  requirement: Requirement;
  level: number;
  onRequirementClick?: (requirement: Requirement) => void;
  onRequirementEdit?: (requirement: Requirement) => void;
  onRequirementDelete?: (requirementId: string) => void;
  onAddChild?: (parentId: string) => void;
}

function RequirementNode({
  requirement,
  level,
  onRequirementClick,
  onRequirementEdit,
  onRequirementDelete,
  onAddChild
}: RequirementNodeProps) {
  const t = useTranslations('requirements');
  const [isOpen, setIsOpen] = useState(level < 2); // Auto-expand first two levels
  const hasChildren = requirement.children && requirement.children.length > 0;
  const StatusIcon = statusConfig[requirement.status].icon;

  return (
    <div
      className={cn(
        'space-y-2',
        level > 0 && 'ml-6 border-l-2 border-gray-200 pl-4'
      )}
    >
      <Card className='cursor-pointer transition-shadow hover:shadow-md'>
        <CardHeader className='pb-3'>
          <div className='flex items-start justify-between'>
            <div className='flex flex-1 items-start gap-3'>
              {/* Expand/Collapse Button */}
              {hasChildren ? (
                <Collapsible open={isOpen} onOpenChange={setIsOpen}>
                  <CollapsibleTrigger asChild>
                    <Button variant='ghost' size='sm' className='h-6 w-6 p-0'>
                      {isOpen ? (
                        <ChevronDown className='h-4 w-4' />
                      ) : (
                        <ChevronRight className='h-4 w-4' />
                      )}
                    </Button>
                  </CollapsibleTrigger>
                </Collapsible>
              ) : (
                <div className='w-6' /> // Spacer for alignment
              )}

              {/* Requirement Content */}
              <div
                className='flex-1 space-y-2'
                onClick={() => onRequirementClick?.(requirement)}
              >
                <div className='flex items-start justify-between'>
                  <CardTitle className='line-clamp-2 text-base font-medium'>
                    {requirement.title}
                  </CardTitle>
                  <div className='flex items-center gap-2'>
                    <StatusIcon className='h-4 w-4' />
                    <Badge
                      className={cn(
                        'text-xs',
                        statusConfig[requirement.status].color
                      )}
                    >
                      {statusConfig[requirement.status].label}
                    </Badge>
                  </div>
                </div>

                <p className='line-clamp-2 text-sm text-gray-600'>
                  {requirement.description}
                </p>

                {/* Metadata */}
                <div className='flex items-center justify-between text-xs text-gray-500'>
                  <div className='flex items-center gap-4'>
                    <Badge
                      variant='outline'
                      className={cn(
                        'text-xs',
                        priorityConfig[requirement.priority].color
                      )}
                    >
                      {priorityConfig[requirement.priority].label}
                    </Badge>
                    <span>{requirement.type}</span>
                    <span>Value: {requirement.businessValue}</span>
                    <span>Effort: {requirement.effort}</span>
                  </div>

                  {requirement.assignee && (
                    <div className='flex items-center gap-1'>
                      <Avatar className='h-4 w-4'>
                        <AvatarImage src={requirement.assignee.avatar} />
                        <AvatarFallback className='text-xs'>
                          {requirement.assignee.name.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <span>{requirement.assignee.name}</span>
                    </div>
                  )}
                </div>

                {/* Progress */}
                {requirement.progress > 0 && (
                  <div className='space-y-1'>
                    <div className='flex justify-between text-xs'>
                      <span className='text-gray-600'>Progress</span>
                      <span className='font-medium'>
                        {requirement.progress}%
                      </span>
                    </div>
                    <Progress value={requirement.progress} className='h-1' />
                  </div>
                )}

                {/* Tags */}
                {requirement.tags.length > 0 && (
                  <div className='flex flex-wrap gap-1'>
                    {requirement.tags.slice(0, 3).map((tag) => (
                      <Badge
                        key={tag}
                        variant='secondary'
                        className='px-1 py-0 text-xs'
                      >
                        {tag}
                      </Badge>
                    ))}
                    {requirement.tags.length > 3 && (
                      <Badge variant='secondary' className='px-1 py-0 text-xs'>
                        +{requirement.tags.length - 3}
                      </Badge>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Actions Menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant='ghost'
                  size='sm'
                  className='h-6 w-6 p-0'
                  onClick={(e) => e.stopPropagation()}
                >
                  <MoreHorizontal className='h-4 w-4' />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align='end'>
                <DropdownMenuItem
                  onClick={() => onRequirementEdit?.(requirement)}
                >
                  <Edit className='mr-2 h-4 w-4' />
                  {t('edit')}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onAddChild?.(requirement.id)}>
                  <Plus className='mr-2 h-4 w-4' />
                  Add Child
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => onRequirementClick?.(requirement)}
                >
                  <Eye className='mr-2 h-4 w-4' />
                  {t('view')}
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => onRequirementDelete?.(requirement.id)}
                  className='text-red-600 focus:text-red-600'
                >
                  <Trash2 className='mr-2 h-4 w-4' />
                  {t('delete')}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </CardHeader>
      </Card>

      {/* Children */}
      {hasChildren && (
        <Collapsible open={isOpen} onOpenChange={setIsOpen}>
          <CollapsibleContent className='space-y-2'>
            {requirement.children!.map((child) => (
              <RequirementNode
                key={child.id}
                requirement={child}
                level={level + 1}
                onRequirementClick={onRequirementClick}
                onRequirementEdit={onRequirementEdit}
                onRequirementDelete={onRequirementDelete}
                onAddChild={onAddChild}
              />
            ))}
          </CollapsibleContent>
        </Collapsible>
      )}
    </div>
  );
}

export function RequirementTree({
  requirements = mockRequirements,
  loading = false,
  onRequirementClick,
  onRequirementEdit,
  onRequirementDelete,
  onAddChild
}: RequirementTreeProps) {
  const t = useTranslations('requirements');

  if (loading) {
    return (
      <div className='space-y-4'>
        {[...Array(3)].map((_, i) => (
          <Card key={i} className='animate-pulse'>
            <CardHeader>
              <div className='h-4 w-3/4 rounded bg-gray-200'></div>
              <div className='h-3 w-1/2 rounded bg-gray-200'></div>
            </CardHeader>
            <CardContent>
              <div className='space-y-2'>
                <div className='h-3 rounded bg-gray-200'></div>
                <div className='h-3 w-5/6 rounded bg-gray-200'></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (requirements.length === 0) {
    return (
      <div className='flex flex-col items-center justify-center py-12 text-gray-400'>
        <AlertCircle className='mb-4 h-12 w-12' />
        <h3 className='mb-2 text-lg font-medium'>No Requirements Found</h3>
        <p className='max-w-md text-center text-sm'>
          No requirements have been created yet. Start by creating your first
          requirement.
        </p>
      </div>
    );
  }

  return (
    <div className='space-y-4'>
      {requirements.map((requirement) => (
        <RequirementNode
          key={requirement.id}
          requirement={requirement}
          level={0}
          onRequirementClick={onRequirementClick}
          onRequirementEdit={onRequirementEdit}
          onRequirementDelete={onRequirementDelete}
          onAddChild={onAddChild}
        />
      ))}
    </div>
  );
}

export default RequirementTree;
