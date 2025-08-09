'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger
} from '@/components/ui/alert-dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import {
  GitBranch,
  Plus,
  ArrowRight,
  ArrowDown,
  ArrowUp,
  Link,
  Unlink,
  MoreHorizontal,
  Search,
  ExternalLink,
  AlertCircle,
  CheckCircle2,
  Clock,
  Target,
  Zap,
  Users,
  Calendar,
  Filter,
  X
} from 'lucide-react';
import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

interface Requirement {
  id: string;
  title: string;
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
  progress: number;
  assignee?: {
    id: string;
    name: string;
    avatar?: string;
  };
  dueDate?: Date;
  project?: {
    id: string;
    name: string;
  };
}

interface RequirementRelation {
  id: string;
  type:
    | 'blocks'
    | 'blocked_by'
    | 'depends_on'
    | 'dependency_of'
    | 'relates_to'
    | 'duplicates'
    | 'duplicated_by'
    | 'parent_of'
    | 'child_of';
  requirement: Requirement;
  description?: string;
  createdAt: Date;
  createdBy: {
    id: string;
    name: string;
    avatar?: string;
  };
}

interface RequirementRelationsProps {
  requirementId: string;
  relations?: RequirementRelation[];
  loading?: boolean;
  canEdit?: boolean;
  onAddRelation?: (
    type: string,
    targetId: string,
    description?: string
  ) => void;
  onRemoveRelation?: (relationId: string) => void;
  onNavigateToRequirement?: (requirementId: string) => void;
}

// Mock data for demonstration
const mockRelations: RequirementRelation[] = [
  {
    id: '1',
    type: 'depends_on',
    requirement: {
      id: 'req-001',
      title: 'User Registration System',
      status: 'completed',
      priority: 'high',
      type: 'functional',
      complexity: 'medium',
      progress: 100,
      assignee: {
        id: 'user1',
        name: 'Alice Johnson',
        avatar: '/avatars/alice.jpg'
      },
      project: {
        id: 'proj1',
        name: 'User Management'
      }
    },
    description:
      'Authentication system requires user registration to be implemented first',
    createdAt: new Date('2024-01-10T10:00:00'),
    createdBy: {
      id: 'user2',
      name: 'Bob Smith',
      avatar: '/avatars/bob.jpg'
    }
  },
  {
    id: '2',
    type: 'blocks',
    requirement: {
      id: 'req-002',
      title: 'Password Reset Functionality',
      status: 'in_progress',
      priority: 'medium',
      type: 'functional',
      complexity: 'simple',
      progress: 30,
      assignee: {
        id: 'user3',
        name: 'Carol Davis',
        avatar: '/avatars/carol.jpg'
      },
      dueDate: new Date('2024-02-20'),
      project: {
        id: 'proj1',
        name: 'User Management'
      }
    },
    description:
      'Password reset depends on authentication system being completed',
    createdAt: new Date('2024-01-12T14:30:00'),
    createdBy: {
      id: 'user2',
      name: 'Bob Smith',
      avatar: '/avatars/bob.jpg'
    }
  },
  {
    id: '3',
    type: 'relates_to',
    requirement: {
      id: 'req-003',
      title: 'User Profile Management',
      status: 'review',
      priority: 'medium',
      type: 'functional',
      complexity: 'medium',
      progress: 0,
      assignee: {
        id: 'user4',
        name: 'David Wilson',
        avatar: '/avatars/david.jpg'
      },
      project: {
        id: 'proj1',
        name: 'User Management'
      }
    },
    description: 'Both features are part of the user management system',
    createdAt: new Date('2024-01-15T09:15:00'),
    createdBy: {
      id: 'user1',
      name: 'Alice Johnson',
      avatar: '/avatars/alice.jpg'
    }
  },
  {
    id: '4',
    type: 'parent_of',
    requirement: {
      id: 'req-004',
      title: 'Two-Factor Authentication',
      status: 'draft',
      priority: 'high',
      type: 'functional',
      complexity: 'complex',
      progress: 0,
      project: {
        id: 'proj1',
        name: 'User Management'
      }
    },
    description: '2FA is a sub-requirement of the authentication system',
    createdAt: new Date('2024-01-18T16:45:00'),
    createdBy: {
      id: 'user2',
      name: 'Bob Smith',
      avatar: '/avatars/bob.jpg'
    }
  }
];

const relationTypeConfig = {
  blocks: {
    label: 'Blocks',
    description: 'This requirement blocks the related requirement',
    icon: ArrowRight,
    color: 'bg-red-100 text-red-800 border-red-200',
    direction: 'outgoing'
  },
  blocked_by: {
    label: 'Blocked by',
    description: 'This requirement is blocked by the related requirement',
    icon: ArrowRight,
    color: 'bg-red-100 text-red-800 border-red-200',
    direction: 'incoming'
  },
  depends_on: {
    label: 'Depends on',
    description: 'This requirement depends on the related requirement',
    icon: ArrowUp,
    color: 'bg-orange-100 text-orange-800 border-orange-200',
    direction: 'incoming'
  },
  dependency_of: {
    label: 'Dependency of',
    description: 'This requirement is a dependency of the related requirement',
    icon: ArrowDown,
    color: 'bg-orange-100 text-orange-800 border-orange-200',
    direction: 'outgoing'
  },
  relates_to: {
    label: 'Relates to',
    description: 'This requirement is related to the other requirement',
    icon: Link,
    color: 'bg-blue-100 text-blue-800 border-blue-200',
    direction: 'bidirectional'
  },
  duplicates: {
    label: 'Duplicates',
    description: 'This requirement duplicates the related requirement',
    icon: Link,
    color: 'bg-gray-100 text-gray-800 border-gray-200',
    direction: 'outgoing'
  },
  duplicated_by: {
    label: 'Duplicated by',
    description: 'This requirement is duplicated by the related requirement',
    icon: Link,
    color: 'bg-gray-100 text-gray-800 border-gray-200',
    direction: 'incoming'
  },
  parent_of: {
    label: 'Parent of',
    description: 'This requirement is a parent of the related requirement',
    icon: ArrowDown,
    color: 'bg-green-100 text-green-800 border-green-200',
    direction: 'outgoing'
  },
  child_of: {
    label: 'Child of',
    description: 'This requirement is a child of the related requirement',
    icon: ArrowUp,
    color: 'bg-green-100 text-green-800 border-green-200',
    direction: 'incoming'
  }
};

const statusConfig = {
  draft: { label: 'Draft', color: 'bg-gray-100 text-gray-800', icon: Clock },
  review: {
    label: 'Review',
    color: 'bg-yellow-100 text-yellow-800',
    icon: AlertCircle
  },
  approved: {
    label: 'Approved',
    color: 'bg-green-100 text-green-800',
    icon: CheckCircle2
  },
  in_progress: {
    label: 'In Progress',
    color: 'bg-blue-100 text-blue-800',
    icon: Clock
  },
  completed: {
    label: 'Completed',
    color: 'bg-green-100 text-green-800',
    icon: CheckCircle2
  },
  rejected: {
    label: 'Rejected',
    color: 'bg-red-100 text-red-800',
    icon: AlertCircle
  }
};

const priorityConfig = {
  low: { label: 'Low', color: 'bg-gray-100 text-gray-800' },
  medium: { label: 'Medium', color: 'bg-yellow-100 text-yellow-800' },
  high: { label: 'High', color: 'bg-orange-100 text-orange-800' },
  critical: { label: 'Critical', color: 'bg-red-100 text-red-800' }
};

export function RequirementRelations({
  requirementId,
  relations = mockRelations,
  loading = false,
  canEdit = true,
  onAddRelation,
  onRemoveRelation,
  onNavigateToRequirement
}: RequirementRelationsProps) {
  const t = useTranslations('requirements');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [selectedRelationType, setSelectedRelationType] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');
  const [relationDescription, setRelationDescription] = useState('');
  const [filterType, setFilterType] = useState<string>('all');

  const handleAddRelation = () => {
    if (!selectedRelationType || !searchTerm) return;

    onAddRelation?.(selectedRelationType, searchTerm, relationDescription);
    setIsAddDialogOpen(false);
    setSelectedRelationType('');
    setSearchTerm('');
    setRelationDescription('');
  };

  const handleRemoveRelation = (relationId: string) => {
    onRemoveRelation?.(relationId);
  };

  const filteredRelations = relations.filter((relation) => {
    if (filterType === 'all') return true;
    return relation.type === filterType;
  });

  const groupedRelations = filteredRelations.reduce(
    (groups, relation) => {
      const type = relation.type;
      if (!groups[type]) {
        groups[type] = [];
      }
      groups[type].push(relation);
      return groups;
    },
    {} as Record<string, RequirementRelation[]>
  );

  const renderRequirementCard = (relation: RequirementRelation) => {
    const { requirement } = relation;
    const StatusIcon = statusConfig[requirement.status].icon;
    const RelationIcon = relationTypeConfig[relation.type].icon;

    return (
      <div
        key={relation.id}
        className='space-y-3 rounded-lg border p-4 transition-shadow hover:shadow-md'
      >
        {/* Relation type and actions */}
        <div className='flex items-center justify-between'>
          <div className='flex items-center gap-2'>
            <RelationIcon className='h-4 w-4' />
            <Badge
              className={cn('text-xs', relationTypeConfig[relation.type].color)}
            >
              {relationTypeConfig[relation.type].label}
            </Badge>
          </div>
          <div className='flex items-center gap-2'>
            <Button
              variant='ghost'
              size='sm'
              onClick={() => onNavigateToRequirement?.(requirement.id)}
              className='h-8 px-2'
            >
              <ExternalLink className='h-4 w-4' />
            </Button>
            {canEdit && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant='ghost' size='sm' className='h-8 w-8 p-0'>
                    <MoreHorizontal className='h-4 w-4' />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align='end'>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                        <Unlink className='mr-2 h-4 w-4' />
                        Remove Relation
                      </DropdownMenuItem>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Remove Relation</AlertDialogTitle>
                        <AlertDialogDescription>
                          Are you sure you want to remove this relation? This
                          action cannot be undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => handleRemoveRelation(relation.id)}
                        >
                          Remove
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </div>

        {/* Requirement info */}
        <div className='space-y-2'>
          <h4
            className='cursor-pointer text-sm font-medium hover:text-blue-600'
            onClick={() => onNavigateToRequirement?.(requirement.id)}
          >
            {requirement.title}
          </h4>

          <div className='flex items-center gap-2 text-xs'>
            <span className='text-gray-500'>ID:</span>
            <span className='font-mono'>{requirement.id}</span>
          </div>

          {requirement.project && (
            <div className='flex items-center gap-2 text-xs'>
              <span className='text-gray-500'>Project:</span>
              <span>{requirement.project.name}</span>
            </div>
          )}
        </div>

        {/* Status and priority */}
        <div className='flex items-center gap-2'>
          <StatusIcon className='h-4 w-4' />
          <Badge
            className={cn('text-xs', statusConfig[requirement.status].color)}
          >
            {statusConfig[requirement.status].label}
          </Badge>
          <Badge
            className={cn(
              'text-xs',
              priorityConfig[requirement.priority].color
            )}
          >
            {priorityConfig[requirement.priority].label}
          </Badge>
        </div>

        {/* Progress */}
        {requirement.progress > 0 && (
          <div className='space-y-1'>
            <div className='flex justify-between text-xs'>
              <span className='text-gray-500'>Progress</span>
              <span>{requirement.progress}%</span>
            </div>
            <Progress value={requirement.progress} className='h-1' />
          </div>
        )}

        {/* Assignee */}
        {requirement.assignee && (
          <div className='flex items-center gap-2'>
            <Avatar className='h-5 w-5'>
              <AvatarImage src={requirement.assignee.avatar} />
              <AvatarFallback className='text-xs'>
                {requirement.assignee.name.charAt(0)}
              </AvatarFallback>
            </Avatar>
            <span className='text-xs text-gray-600'>
              {requirement.assignee.name}
            </span>
          </div>
        )}

        {/* Due date */}
        {requirement.dueDate && (
          <div className='flex items-center gap-2 text-xs text-gray-500'>
            <Calendar className='h-4 w-4' />
            <span>Due {format(requirement.dueDate, 'MMM d, yyyy')}</span>
          </div>
        )}

        {/* Relation description */}
        {relation.description && (
          <div className='rounded bg-gray-50 p-2'>
            <p className='text-xs text-gray-600'>{relation.description}</p>
          </div>
        )}

        {/* Relation metadata */}
        <div className='flex items-center gap-2 border-t pt-2 text-xs text-gray-400'>
          <span>Added by {relation.createdBy.name}</span>
          <span>•</span>
          <span>{format(relation.createdAt, 'MMM d, yyyy')}</span>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className='flex items-center gap-2'>
            <GitBranch className='h-5 w-5' />
            Relations
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className='space-y-4'>
            {[...Array(3)].map((_, i) => (
              <div key={i} className='animate-pulse rounded-lg border p-4'>
                <div className='space-y-3'>
                  <div className='h-4 w-1/4 rounded bg-gray-200'></div>
                  <div className='h-4 w-3/4 rounded bg-gray-200'></div>
                  <div className='h-4 w-1/2 rounded bg-gray-200'></div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className='flex items-center justify-between'>
          <CardTitle className='flex items-center gap-2'>
            <GitBranch className='h-5 w-5' />
            Relations ({relations.length})
          </CardTitle>
          <div className='flex items-center gap-2'>
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className='w-40'>
                <SelectValue placeholder='Filter by type' />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='all'>All Types</SelectItem>
                {Object.entries(relationTypeConfig).map(([key, config]) => (
                  <SelectItem key={key} value={key}>
                    {config.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {canEdit && (
              <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                <DialogTrigger asChild>
                  <Button size='sm'>
                    <Plus className='mr-2 h-4 w-4' />
                    Add Relation
                  </Button>
                </DialogTrigger>
                <DialogContent className='max-w-md'>
                  <DialogHeader>
                    <DialogTitle>Add Requirement Relation</DialogTitle>
                    <DialogDescription>
                      Create a relationship between this requirement and another
                      requirement.
                    </DialogDescription>
                  </DialogHeader>
                  <div className='space-y-4'>
                    <div className='space-y-2'>
                      <label className='text-sm font-medium'>
                        Relation Type
                      </label>
                      <Select
                        value={selectedRelationType}
                        onValueChange={setSelectedRelationType}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder='Select relation type' />
                        </SelectTrigger>
                        <SelectContent>
                          {Object.entries(relationTypeConfig).map(
                            ([key, config]) => (
                              <SelectItem key={key} value={key}>
                                <div className='flex items-center gap-2'>
                                  <config.icon className='h-4 w-4' />
                                  <div>
                                    <div>{config.label}</div>
                                    <div className='text-xs text-gray-500'>
                                      {config.description}
                                    </div>
                                  </div>
                                </div>
                              </SelectItem>
                            )
                          )}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className='space-y-2'>
                      <label className='text-sm font-medium'>
                        Target Requirement
                      </label>
                      <div className='relative'>
                        <Search className='absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 transform text-gray-400' />
                        <Input
                          placeholder='Search requirements...'
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          className='pl-10'
                        />
                      </div>
                    </div>

                    <div className='space-y-2'>
                      <label className='text-sm font-medium'>
                        Description (Optional)
                      </label>
                      <Input
                        placeholder='Describe the relationship...'
                        value={relationDescription}
                        onChange={(e) => setRelationDescription(e.target.value)}
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button
                      variant='outline'
                      onClick={() => setIsAddDialogOpen(false)}
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={handleAddRelation}
                      disabled={!selectedRelationType || !searchTerm}
                    >
                      Add Relation
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent>
        {filteredRelations.length > 0 ? (
          <div className='space-y-6'>
            {Object.entries(groupedRelations).map(([type, typeRelations]) => (
              <div key={type} className='space-y-3'>
                <div className='flex items-center gap-2'>
                  <Badge
                    className={cn(
                      'text-sm',
                      relationTypeConfig[
                        type as keyof typeof relationTypeConfig
                      ].color
                    )}
                  >
                    {
                      relationTypeConfig[
                        type as keyof typeof relationTypeConfig
                      ].label
                    }{' '}
                    ({typeRelations.length})
                  </Badge>
                </div>
                <div className='grid gap-4'>
                  {typeRelations.map((relation) =>
                    renderRequirementCard(relation)
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className='py-8 text-center'>
            <GitBranch className='mx-auto mb-4 h-12 w-12 text-gray-300' />
            <p className='mb-2 text-gray-500'>
              {filterType === 'all'
                ? 'No relations found'
                : `No ${relationTypeConfig[filterType as keyof typeof relationTypeConfig]?.label.toLowerCase()} relations found`}
            </p>
            <p className='mb-4 text-sm text-gray-400'>
              {filterType === 'all'
                ? 'This requirement has no relationships with other requirements.'
                : 'Try changing the filter or add a new relation.'}
            </p>
            {canEdit && (
              <Button
                variant='outline'
                onClick={() => setIsAddDialogOpen(true)}
              >
                <Plus className='mr-2 h-4 w-4' />
                Add First Relation
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default RequirementRelations;
