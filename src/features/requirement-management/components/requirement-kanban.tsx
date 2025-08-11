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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import {
  CalendarDays,
  User,
  Tag,
  AlertCircle,
  CheckCircle2,
  Clock,
  MoreHorizontal,
  Plus,
  Edit,
  Trash2,
  Eye
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
  createdAt: Date;
  updatedAt: Date;
}

interface KanbanColumn {
  id: string;
  title: string;
  status: Requirement['status'];
  color: string;
  requirements: Requirement[];
}

interface RequirementKanbanProps {
  requirements?: Requirement[];
  loading?: boolean;
  onRequirementClick?: (requirement: Requirement) => void;
  onStatusChange?: (
    requirementId: string,
    newStatus: Requirement['status']
  ) => void;
  onRequirementEdit?: (requirement: Requirement) => void;
  onRequirementDelete?: (requirementId: string) => void;
}

// Move config objects inside component to access translations

// Mock data for demonstration
const mockRequirements: Requirement[] = [
  {
    id: '1',
    title: 'User Authentication System',
    description:
      'Implement secure user login and registration functionality with multi-factor authentication support.',
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
      avatar: '/avatars/john.jpg'
    },
    creator: {
      id: 'user2',
      name: 'Jane Smith',
      avatar: '/avatars/jane.jpg'
    },
    tags: ['security', 'authentication'],
    createdAt: new Date('2024-01-10'),
    updatedAt: new Date('2024-01-20')
  },
  {
    id: '2',
    title: 'Performance Optimization',
    description:
      'Optimize application performance to achieve sub-2-second page load times.',
    status: 'review',
    priority: 'medium',
    type: 'non_functional',
    complexity: 'medium',
    businessValue: 70,
    effort: 25,
    progress: 30,
    dueDate: new Date('2024-03-01'),
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
    tags: ['performance', 'optimization'],
    createdAt: new Date('2024-01-15'),
    updatedAt: new Date('2024-01-25')
  },
  {
    id: '3',
    title: 'Mobile Responsive Design',
    description: 'Ensure the application works seamlessly on mobile devices.',
    status: 'draft',
    priority: 'medium',
    type: 'functional',
    complexity: 'simple',
    businessValue: 60,
    effort: 15,
    progress: 0,
    creator: {
      id: 'user4',
      name: 'Sarah Wilson',
      avatar: '/avatars/sarah.jpg'
    },
    tags: ['mobile', 'responsive', 'ui'],
    createdAt: new Date('2024-01-20'),
    updatedAt: new Date('2024-01-20')
  },
  {
    id: '4',
    title: 'API Documentation',
    description: 'Create comprehensive API documentation for developers.',
    status: 'completed',
    priority: 'low',
    type: 'technical',
    complexity: 'simple',
    businessValue: 40,
    effort: 10,
    progress: 100,
    assignee: {
      id: 'user5',
      name: 'David Brown',
      avatar: '/avatars/david.jpg'
    },
    creator: {
      id: 'user2',
      name: 'Jane Smith',
      avatar: '/avatars/jane.jpg'
    },
    tags: ['documentation', 'api'],
    createdAt: new Date('2024-01-05'),
    updatedAt: new Date('2024-01-30')
  }
];

export function RequirementKanban({
  requirements = mockRequirements,
  loading = false,
  onRequirementClick,
  onStatusChange,
  onRequirementEdit,
  onRequirementDelete
}: RequirementKanbanProps) {
  const t = useTranslations('requirements');
  const [selectedRequirement, setSelectedRequirement] =
    useState<Requirement | null>(null);
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);

  const statusConfig = {
    draft: { label: t('statuses.draft'), color: 'border-gray-200' },
    review: { label: t('statuses.review'), color: 'border-yellow-200' },
    approved: { label: t('statuses.approved'), color: 'border-purple-200' },
    in_progress: { label: t('statuses.inProgress'), color: 'border-blue-200' },
    completed: { label: t('statuses.completed'), color: 'border-green-200' },
    rejected: { label: t('statuses.rejected'), color: 'border-red-200' }
  };

  const priorityConfig = {
    low: { label: t('priorities.low'), color: 'bg-gray-100 text-gray-800' },
    medium: {
      label: t('priorities.medium'),
      color: 'bg-yellow-100 text-yellow-800'
    },
    high: {
      label: t('priorities.high'),
      color: 'bg-orange-100 text-orange-800'
    },
    critical: {
      label: t('priorities.critical'),
      color: 'bg-red-100 text-red-800'
    }
  };

  // Group requirements by status
  const columns: KanbanColumn[] = [
    {
      id: 'draft',
      title: statusConfig.draft.label,
      status: 'draft',
      color: statusConfig.draft.color,
      requirements: requirements.filter((req) => req.status === 'draft')
    },
    {
      id: 'review',
      title: statusConfig.review.label,
      status: 'review',
      color: statusConfig.review.color,
      requirements: requirements.filter((req) => req.status === 'review')
    },
    {
      id: 'approved',
      title: statusConfig.approved.label,
      status: 'approved',
      color: statusConfig.approved.color,
      requirements: requirements.filter((req) => req.status === 'approved')
    },
    {
      id: 'in_progress',
      title: statusConfig.in_progress.label,
      status: 'in_progress',
      color: statusConfig.in_progress.color,
      requirements: requirements.filter((req) => req.status === 'in_progress')
    },
    {
      id: 'completed',
      title: statusConfig.completed.label,
      status: 'completed',
      color: statusConfig.completed.color,
      requirements: requirements.filter((req) => req.status === 'completed')
    },
    {
      id: 'rejected',
      title: statusConfig.rejected.label,
      status: 'rejected',
      color: statusConfig.rejected.color,
      requirements: requirements.filter((req) => req.status === 'rejected')
    }
  ];

  const handleRequirementClick = (requirement: Requirement) => {
    setSelectedRequirement(requirement);
    setIsDetailDialogOpen(true);
    onRequirementClick?.(requirement);
  };

  const handleStatusChange = (
    requirementId: string,
    newStatus: Requirement['status']
  ) => {
    onStatusChange?.(requirementId, newStatus);
  };

  if (loading) {
    return (
      <div className='grid grid-cols-1 gap-4 md:grid-cols-3 lg:grid-cols-6'>
        {[...Array(6)].map((_, i) => (
          <div key={i} className='space-y-4'>
            <div className='h-8 animate-pulse rounded bg-gray-200'></div>
            {[...Array(2)].map((_, j) => (
              <Card key={j} className='animate-pulse'>
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
        ))}
      </div>
    );
  }

  return (
    <>
      <div className='grid h-full grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6'>
        {columns.map((column) => {
          const StatusIcon = statusConfig[column.status].icon;

          return (
            <div key={column.id} className='flex h-full flex-col'>
              {/* Column Header */}
              <div
                className={cn(
                  'mb-4 flex items-center justify-between border-b-2 p-3',
                  column.color
                )}
              >
                <div className='flex items-center gap-2'>
                  <StatusIcon className='h-4 w-4' />
                  <h3 className='text-sm font-semibold'>{column.title}</h3>
                  <Badge variant='secondary' className='text-xs'>
                    {column.requirements.length}
                  </Badge>
                </div>
                <Button variant='ghost' size='sm' className='h-6 w-6 p-0'>
                  <Plus className='h-3 w-3' />
                </Button>
              </div>

              {/* Requirements Cards */}
              <div className='flex-1 space-y-3 overflow-y-auto'>
                {column.requirements.map((requirement) => (
                  <Card
                    key={requirement.id}
                    className='cursor-pointer transition-shadow hover:shadow-md'
                    onClick={() => handleRequirementClick(requirement)}
                  >
                    <CardHeader className='pb-2'>
                      <div className='flex items-start justify-between'>
                        <CardTitle className='line-clamp-2 text-sm font-medium'>
                          {requirement.title}
                        </CardTitle>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant='ghost'
                              size='sm'
                              className='h-6 w-6 p-0'
                              onClick={(e) => e.stopPropagation()}
                            >
                              <MoreHorizontal className='h-3 w-3' />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align='end'>
                            <DropdownMenuItem
                              onClick={() => onRequirementEdit?.(requirement)}
                            >
                              <Edit className='mr-2 h-4 w-4' />
                              {t('edit')}
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() =>
                                handleRequirementClick(requirement)
                              }
                            >
                              <Eye className='mr-2 h-4 w-4' />
                              {t('view')}
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() =>
                                onRequirementDelete?.(requirement.id)
                              }
                              className='text-red-600 focus:text-red-600'
                            >
                              <Trash2 className='mr-2 h-4 w-4' />
                              {t('delete')}
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </CardHeader>

                    <CardContent className='space-y-3 pt-0'>
                      {/* Priority and Type */}
                      <div className='flex items-center gap-2'>
                        <Badge
                          variant='outline'
                          className={cn(
                            'text-xs',
                            priorityConfig[requirement.priority].color
                          )}
                        >
                          {priorityConfig[requirement.priority].label}
                        </Badge>
                        <Badge variant='secondary' className='text-xs'>
                          {requirement.type}
                        </Badge>
                      </div>

                      {/* Description */}
                      <p className='line-clamp-2 text-xs text-gray-600'>
                        {requirement.description}
                      </p>

                      {/* Progress */}
                      {requirement.progress > 0 && (
                        <div className='space-y-1'>
                          <div className='flex justify-between text-xs'>
                            <span className='text-gray-600'>Progress</span>
                            <span className='font-medium'>
                              {requirement.progress}%
                            </span>
                          </div>
                          <Progress
                            value={requirement.progress}
                            className='h-1'
                          />
                        </div>
                      )}

                      {/* Assignee and Due Date */}
                      <div className='flex items-center justify-between text-xs text-gray-600'>
                        {requirement.assignee ? (
                          <div className='flex items-center gap-1'>
                            <Avatar className='h-4 w-4'>
                              <AvatarImage src={requirement.assignee.avatar} />
                              <AvatarFallback className='text-xs'>
                                {requirement.assignee.name.charAt(0)}
                              </AvatarFallback>
                            </Avatar>
                            <span className='truncate'>
                              {requirement.assignee.name}
                            </span>
                          </div>
                        ) : (
                          <span className='text-gray-400'>Unassigned</span>
                        )}

                        {requirement.dueDate && (
                          <div className='flex items-center gap-1'>
                            <CalendarDays className='h-3 w-3' />
                            <span>
                              {requirement.dueDate.toLocaleDateString()}
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Tags */}
                      {requirement.tags.length > 0 && (
                        <div className='flex flex-wrap gap-1'>
                          {requirement.tags.slice(0, 2).map((tag) => (
                            <Badge
                              key={tag}
                              variant='secondary'
                              className='px-1 py-0 text-xs'
                            >
                              {tag}
                            </Badge>
                          ))}
                          {requirement.tags.length > 2 && (
                            <Badge
                              variant='secondary'
                              className='px-1 py-0 text-xs'
                            >
                              +{requirement.tags.length - 2}
                            </Badge>
                          )}
                        </div>
                      )}

                      {/* Business Value and Effort */}
                      <div className='flex justify-between text-xs text-gray-600'>
                        <span>Value: {requirement.businessValue}</span>
                        <span>Effort: {requirement.effort}</span>
                      </div>
                    </CardContent>
                  </Card>
                ))}

                {/* Empty State */}
                {column.requirements.length === 0 && (
                  <div className='flex flex-col items-center justify-center py-8 text-gray-400'>
                    <AlertCircle className='mb-2 h-8 w-8' />
                    <p className='text-center text-sm'>
                      No requirements in {column.title.toLowerCase()}
                    </p>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Requirement Detail Dialog */}
      <Dialog open={isDetailDialogOpen} onOpenChange={setIsDetailDialogOpen}>
        <DialogContent className='max-w-2xl'>
          <DialogHeader>
            <DialogTitle>{selectedRequirement?.title}</DialogTitle>
            <DialogDescription>
              {selectedRequirement?.description}
            </DialogDescription>
          </DialogHeader>
          {selectedRequirement && (
            <div className='space-y-4'>
              <div className='grid grid-cols-2 gap-4'>
                <div>
                  <Label className='text-sm font-medium'>Status</Label>
                  <Badge
                    className={cn(
                      'mt-1',
                      statusConfig[selectedRequirement.status].color
                    )}
                  >
                    {statusConfig[selectedRequirement.status].label}
                  </Badge>
                </div>
                <div>
                  <Label className='text-sm font-medium'>Priority</Label>
                  <Badge
                    className={cn(
                      'mt-1',
                      priorityConfig[selectedRequirement.priority].color
                    )}
                  >
                    {priorityConfig[selectedRequirement.priority].label}
                  </Badge>
                </div>
                <div>
                  <Label className='text-sm font-medium'>Type</Label>
                  <p className='text-sm'>{selectedRequirement.type}</p>
                </div>
                <div>
                  <Label className='text-sm font-medium'>Complexity</Label>
                  <p className='text-sm'>{selectedRequirement.complexity}</p>
                </div>
                <div>
                  <Label className='text-sm font-medium'>Business Value</Label>
                  <p className='text-sm'>{selectedRequirement.businessValue}</p>
                </div>
                <div>
                  <Label className='text-sm font-medium'>Effort</Label>
                  <p className='text-sm'>{selectedRequirement.effort}</p>
                </div>
              </div>

              {selectedRequirement.progress > 0 && (
                <div>
                  <Label className='text-sm font-medium'>Progress</Label>
                  <div className='mt-2'>
                    <Progress
                      value={selectedRequirement.progress}
                      className='h-2'
                    />
                    <p className='mt-1 text-sm text-gray-600'>
                      {selectedRequirement.progress}%
                    </p>
                  </div>
                </div>
              )}

              {selectedRequirement.tags.length > 0 && (
                <div>
                  <Label className='text-sm font-medium'>Tags</Label>
                  <div className='mt-2 flex flex-wrap gap-1'>
                    {selectedRequirement.tags.map((tag) => (
                      <Badge key={tag} variant='secondary'>
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}

export default RequirementKanban;
