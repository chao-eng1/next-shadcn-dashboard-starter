'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
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
  Plus,
  Search,
  ExternalLink,
  MoreHorizontal,
  Unlink,
  Link2,
  GitBranch,
  Target,
  Calendar,
  Users,
  Filter,
  CheckCircle2,
  Clock,
  AlertCircle,
  X
} from 'lucide-react';
import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

interface Project {
  id: string;
  name: string;
  description?: string;
  status: 'planning' | 'active' | 'on_hold' | 'completed' | 'cancelled';
  progress: number;
  startDate?: Date;
  endDate?: Date;
  manager?: {
    id: string;
    name: string;
    avatar?: string;
  };
  teamSize?: number;
}

interface Task {
  id: string;
  title: string;
  description?: string;
  status: 'todo' | 'in_progress' | 'review' | 'done' | 'blocked';
  priority: 'low' | 'medium' | 'high' | 'critical';
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
}

interface ProjectRelation {
  id: string;
  project: Project;
  requirement: Requirement;
  relationType: 'implements' | 'supports' | 'depends_on' | 'blocks';
  description?: string;
  createdAt: Date;
  createdBy: {
    id: string;
    name: string;
    avatar?: string;
  };
}

interface TaskRelation {
  id: string;
  task: Task;
  requirement: Requirement;
  relationType: 'implements' | 'tests' | 'documents' | 'depends_on';
  description?: string;
  createdAt: Date;
  createdBy: {
    id: string;
    name: string;
    avatar?: string;
  };
}

interface RequirementRelationManagerProps {
  requirementId?: string;
  projectRelations?: ProjectRelation[];
  taskRelations?: TaskRelation[];
  loading?: boolean;
  canEdit?: boolean;
  onAddProjectRelation?: (
    projectId: string,
    relationType: string,
    description?: string
  ) => void;
  onAddTaskRelation?: (
    taskId: string,
    relationType: string,
    description?: string
  ) => void;
  onRemoveProjectRelation?: (relationId: string) => void;
  onRemoveTaskRelation?: (relationId: string) => void;
  onNavigateToProject?: (projectId: string) => void;
  onNavigateToTask?: (taskId: string) => void;
}

// Mock data
const mockProjectRelations: ProjectRelation[] = [
  {
    id: '1',
    project: {
      id: 'proj1',
      name: 'User Management System',
      description: 'Complete user authentication and profile management system',
      status: 'active',
      progress: 75,
      startDate: new Date('2024-01-01'),
      endDate: new Date('2024-03-31'),
      manager: {
        id: 'user1',
        name: 'Alice Johnson',
        avatar: '/avatars/alice.jpg'
      },
      teamSize: 5
    },
    requirement: {
      id: 'req1',
      title: 'User Authentication System',
      status: 'in_progress',
      priority: 'high',
      type: 'functional'
    },
    relationType: 'implements',
    description: 'This project implements the user authentication requirements',
    createdAt: new Date('2024-01-15'),
    createdBy: {
      id: 'user2',
      name: 'Bob Smith',
      avatar: '/avatars/bob.jpg'
    }
  },
  {
    id: '2',
    project: {
      id: 'proj2',
      name: 'E-commerce Platform',
      description: 'Online shopping platform with payment integration',
      status: 'planning',
      progress: 15,
      startDate: new Date('2024-02-01'),
      endDate: new Date('2024-06-30'),
      manager: {
        id: 'user3',
        name: 'Carol Davis',
        avatar: '/avatars/carol.jpg'
      },
      teamSize: 8
    },
    requirement: {
      id: 'req2',
      title: 'Payment Processing',
      status: 'review',
      priority: 'critical',
      type: 'functional'
    },
    relationType: 'depends_on',
    description:
      'E-commerce platform depends on secure payment processing requirements',
    createdAt: new Date('2024-01-20'),
    createdBy: {
      id: 'user1',
      name: 'Alice Johnson',
      avatar: '/avatars/alice.jpg'
    }
  }
];

const mockTaskRelations: TaskRelation[] = [
  {
    id: '1',
    task: {
      id: 'task1',
      title: 'Implement Login API',
      description: 'Create REST API endpoints for user login functionality',
      status: 'in_progress',
      priority: 'high',
      progress: 60,
      assignee: {
        id: 'user4',
        name: 'David Wilson',
        avatar: '/avatars/david.jpg'
      },
      dueDate: new Date('2024-02-15'),
      project: {
        id: 'proj1',
        name: 'User Management System'
      }
    },
    requirement: {
      id: 'req1',
      title: 'User Authentication System',
      status: 'in_progress',
      priority: 'high',
      type: 'functional'
    },
    relationType: 'implements',
    description:
      'This task implements the login functionality for user authentication',
    createdAt: new Date('2024-01-25'),
    createdBy: {
      id: 'user2',
      name: 'Bob Smith',
      avatar: '/avatars/bob.jpg'
    }
  },
  {
    id: '2',
    task: {
      id: 'task2',
      title: 'Write Authentication Tests',
      description: 'Create comprehensive test suite for authentication system',
      status: 'todo',
      priority: 'medium',
      progress: 0,
      assignee: {
        id: 'user5',
        name: 'Eve Brown',
        avatar: '/avatars/eve.jpg'
      },
      dueDate: new Date('2024-02-20'),
      project: {
        id: 'proj1',
        name: 'User Management System'
      }
    },
    requirement: {
      id: 'req1',
      title: 'User Authentication System',
      status: 'in_progress',
      priority: 'high',
      type: 'functional'
    },
    relationType: 'tests',
    description:
      'This task provides test coverage for authentication requirements',
    createdAt: new Date('2024-01-28'),
    createdBy: {
      id: 'user3',
      name: 'Carol Davis',
      avatar: '/avatars/carol.jpg'
    }
  }
];

const projectStatusConfig = {
  planning: {
    label: 'Planning',
    color: 'bg-yellow-100 text-yellow-800',
    icon: Clock
  },
  active: {
    label: 'Active',
    color: 'bg-blue-100 text-blue-800',
    icon: CheckCircle2
  },
  on_hold: {
    label: 'On Hold',
    color: 'bg-orange-100 text-orange-800',
    icon: AlertCircle
  },
  completed: {
    label: 'Completed',
    color: 'bg-green-100 text-green-800',
    icon: CheckCircle2
  },
  cancelled: { label: 'Cancelled', color: 'bg-red-100 text-red-800', icon: X }
};

const taskStatusConfig = {
  todo: { label: 'To Do', color: 'bg-gray-100 text-gray-800', icon: Clock },
  in_progress: {
    label: 'In Progress',
    color: 'bg-blue-100 text-blue-800',
    icon: Clock
  },
  review: {
    label: 'Review',
    color: 'bg-yellow-100 text-yellow-800',
    icon: AlertCircle
  },
  done: {
    label: 'Done',
    color: 'bg-green-100 text-green-800',
    icon: CheckCircle2
  },
  blocked: {
    label: 'Blocked',
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

const relationTypeConfig = {
  implements: { label: 'Implements', color: 'bg-green-100 text-green-800' },
  supports: { label: 'Supports', color: 'bg-blue-100 text-blue-800' },
  depends_on: { label: 'Depends On', color: 'bg-orange-100 text-orange-800' },
  blocks: { label: 'Blocks', color: 'bg-red-100 text-red-800' },
  tests: { label: 'Tests', color: 'bg-purple-100 text-purple-800' },
  documents: { label: 'Documents', color: 'bg-indigo-100 text-indigo-800' }
};

export function RequirementRelationManager({
  requirementId,
  projectRelations = mockProjectRelations,
  taskRelations = mockTaskRelations,
  loading = false,
  canEdit = true,
  onAddProjectRelation,
  onAddTaskRelation,
  onRemoveProjectRelation,
  onRemoveTaskRelation,
  onNavigateToProject,
  onNavigateToTask
}: RequirementRelationManagerProps) {
  const t = useTranslations('requirements');
  const [activeTab, setActiveTab] = useState<'projects' | 'tasks'>('projects');
  const [isAddProjectDialogOpen, setIsAddProjectDialogOpen] = useState(false);
  const [isAddTaskDialogOpen, setIsAddTaskDialogOpen] = useState(false);
  const [selectedRelationType, setSelectedRelationType] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');
  const [relationDescription, setRelationDescription] = useState('');

  const handleAddProjectRelation = () => {
    if (!selectedRelationType || !searchTerm) return;

    onAddProjectRelation?.(
      searchTerm,
      selectedRelationType,
      relationDescription
    );
    setIsAddProjectDialogOpen(false);
    setSelectedRelationType('');
    setSearchTerm('');
    setRelationDescription('');
  };

  const handleAddTaskRelation = () => {
    if (!selectedRelationType || !searchTerm) return;

    onAddTaskRelation?.(searchTerm, selectedRelationType, relationDescription);
    setIsAddTaskDialogOpen(false);
    setSelectedRelationType('');
    setSearchTerm('');
    setRelationDescription('');
  };

  const renderProjectCard = (relation: ProjectRelation) => {
    const { project } = relation;
    const StatusIcon = projectStatusConfig[project.status].icon;

    return (
      <div
        key={relation.id}
        className='space-y-3 rounded-lg border p-4 transition-shadow hover:shadow-md'
      >
        {/* Relation type and actions */}
        <div className='flex items-center justify-between'>
          <Badge
            className={cn(
              'text-xs',
              relationTypeConfig[relation.relationType].color
            )}
          >
            {relationTypeConfig[relation.relationType].label}
          </Badge>
          <div className='flex items-center gap-2'>
            <Button
              variant='ghost'
              size='sm'
              onClick={() => onNavigateToProject?.(project.id)}
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
                        <AlertDialogTitle>
                          Remove Project Relation
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                          Are you sure you want to remove this project relation?
                          This action cannot be undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => onRemoveProjectRelation?.(relation.id)}
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

        {/* Project info */}
        <div className='space-y-2'>
          <h4
            className='cursor-pointer font-medium hover:text-blue-600'
            onClick={() => onNavigateToProject?.(project.id)}
          >
            {project.name}
          </h4>

          {project.description && (
            <p className='text-sm text-gray-600'>{project.description}</p>
          )}
        </div>

        {/* Status and progress */}
        <div className='flex items-center gap-2'>
          <StatusIcon className='h-4 w-4' />
          <Badge
            className={cn('text-xs', projectStatusConfig[project.status].color)}
          >
            {projectStatusConfig[project.status].label}
          </Badge>
        </div>

        <div className='space-y-1'>
          <div className='flex justify-between text-xs'>
            <span className='text-gray-500'>Progress</span>
            <span>{project.progress}%</span>
          </div>
          <Progress value={project.progress} className='h-1' />
        </div>

        {/* Project details */}
        <div className='grid grid-cols-2 gap-4 text-xs'>
          {project.manager && (
            <div className='flex items-center gap-2'>
              <Avatar className='h-5 w-5'>
                <AvatarImage src={project.manager.avatar} />
                <AvatarFallback className='text-xs'>
                  {project.manager.name.charAt(0)}
                </AvatarFallback>
              </Avatar>
              <span className='text-gray-600'>{project.manager.name}</span>
            </div>
          )}

          {project.teamSize && (
            <div className='flex items-center gap-2 text-gray-500'>
              <Users className='h-4 w-4' />
              <span>{project.teamSize} members</span>
            </div>
          )}
        </div>

        {project.endDate && (
          <div className='flex items-center gap-2 text-xs text-gray-500'>
            <Calendar className='h-4 w-4' />
            <span>Due {format(project.endDate, 'MMM d, yyyy')}</span>
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

  const renderTaskCard = (relation: TaskRelation) => {
    const { task } = relation;
    const StatusIcon = taskStatusConfig[task.status].icon;

    return (
      <div
        key={relation.id}
        className='space-y-3 rounded-lg border p-4 transition-shadow hover:shadow-md'
      >
        {/* Relation type and actions */}
        <div className='flex items-center justify-between'>
          <Badge
            className={cn(
              'text-xs',
              relationTypeConfig[relation.relationType].color
            )}
          >
            {relationTypeConfig[relation.relationType].label}
          </Badge>
          <div className='flex items-center gap-2'>
            <Button
              variant='ghost'
              size='sm'
              onClick={() => onNavigateToTask?.(task.id)}
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
                        <AlertDialogTitle>
                          Remove Task Relation
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                          Are you sure you want to remove this task relation?
                          This action cannot be undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => onRemoveTaskRelation?.(relation.id)}
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

        {/* Task info */}
        <div className='space-y-2'>
          <h4
            className='cursor-pointer font-medium hover:text-blue-600'
            onClick={() => onNavigateToTask?.(task.id)}
          >
            {task.title}
          </h4>

          {task.description && (
            <p className='text-sm text-gray-600'>{task.description}</p>
          )}
        </div>

        {/* Status and priority */}
        <div className='flex items-center gap-2'>
          <StatusIcon className='h-4 w-4' />
          <Badge className={cn('text-xs', taskStatusConfig[task.status].color)}>
            {taskStatusConfig[task.status].label}
          </Badge>
          <Badge className={cn('text-xs', priorityConfig[task.priority].color)}>
            {priorityConfig[task.priority].label}
          </Badge>
        </div>

        {/* Progress */}
        {task.progress > 0 && (
          <div className='space-y-1'>
            <div className='flex justify-between text-xs'>
              <span className='text-gray-500'>Progress</span>
              <span>{task.progress}%</span>
            </div>
            <Progress value={task.progress} className='h-1' />
          </div>
        )}

        {/* Task details */}
        <div className='space-y-2'>
          {task.assignee && (
            <div className='flex items-center gap-2'>
              <Avatar className='h-5 w-5'>
                <AvatarImage src={task.assignee.avatar} />
                <AvatarFallback className='text-xs'>
                  {task.assignee.name.charAt(0)}
                </AvatarFallback>
              </Avatar>
              <span className='text-xs text-gray-600'>
                {task.assignee.name}
              </span>
            </div>
          )}

          {task.project && (
            <div className='flex items-center gap-2 text-xs text-gray-500'>
              <Target className='h-4 w-4' />
              <span>{task.project.name}</span>
            </div>
          )}
        </div>

        {task.dueDate && (
          <div className='flex items-center gap-2 text-xs text-gray-500'>
            <Calendar className='h-4 w-4' />
            <span>Due {format(task.dueDate, 'MMM d, yyyy')}</span>
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
      <div className='space-y-4'>
        {[...Array(3)].map((_, i) => (
          <Card key={i}>
            <CardContent className='p-4'>
              <div className='animate-pulse space-y-3'>
                <div className='h-4 w-1/4 rounded bg-gray-200'></div>
                <div className='h-4 w-3/4 rounded bg-gray-200'></div>
                <div className='h-4 w-1/2 rounded bg-gray-200'></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className='space-y-6'>
      {/* Projects Section */}
      <Card>
        <CardHeader>
          <div className='flex items-center justify-between'>
            <CardTitle className='flex items-center gap-2'>
              <Link2 className='h-5 w-5' />
              Project Relations ({projectRelations.length})
            </CardTitle>
            {canEdit && (
              <Dialog
                open={isAddProjectDialogOpen}
                onOpenChange={setIsAddProjectDialogOpen}
              >
                <DialogTrigger asChild>
                  <Button size='sm'>
                    <Plus className='mr-2 h-4 w-4' />
                    Add Project
                  </Button>
                </DialogTrigger>
                <DialogContent className='max-w-md'>
                  <DialogHeader>
                    <DialogTitle>Add Project Relation</DialogTitle>
                    <DialogDescription>
                      Link this requirement to a project.
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
                          <SelectItem value='implements'>Implements</SelectItem>
                          <SelectItem value='supports'>Supports</SelectItem>
                          <SelectItem value='depends_on'>Depends On</SelectItem>
                          <SelectItem value='blocks'>Blocks</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className='space-y-2'>
                      <label className='text-sm font-medium'>Project</label>
                      <div className='relative'>
                        <Search className='absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 transform text-gray-400' />
                        <Input
                          placeholder='Search projects...'
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
                      onClick={() => setIsAddProjectDialogOpen(false)}
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={handleAddProjectRelation}
                      disabled={!selectedRelationType || !searchTerm}
                    >
                      Add Relation
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            )}
          </div>
        </CardHeader>

        <CardContent>
          {projectRelations.length > 0 ? (
            <div className='grid gap-4'>
              {projectRelations.map((relation) => renderProjectCard(relation))}
            </div>
          ) : (
            <div className='py-8 text-center'>
              <Link2 className='mx-auto mb-4 h-12 w-12 text-gray-300' />
              <p className='mb-2 text-gray-500'>No project relations found</p>
              <p className='mb-4 text-sm text-gray-400'>
                This requirement is not linked to any projects.
              </p>
              {canEdit && (
                <Button
                  variant='outline'
                  onClick={() => setIsAddProjectDialogOpen(true)}
                >
                  <Plus className='mr-2 h-4 w-4' />
                  Add First Project
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Tasks Section */}
      <Card>
        <CardHeader>
          <div className='flex items-center justify-between'>
            <CardTitle className='flex items-center gap-2'>
              <GitBranch className='h-5 w-5' />
              Task Relations ({taskRelations.length})
            </CardTitle>
            {canEdit && (
              <Dialog
                open={isAddTaskDialogOpen}
                onOpenChange={setIsAddTaskDialogOpen}
              >
                <DialogTrigger asChild>
                  <Button size='sm'>
                    <Plus className='mr-2 h-4 w-4' />
                    Add Task
                  </Button>
                </DialogTrigger>
                <DialogContent className='max-w-md'>
                  <DialogHeader>
                    <DialogTitle>Add Task Relation</DialogTitle>
                    <DialogDescription>
                      Link this requirement to a task.
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
                          <SelectItem value='implements'>Implements</SelectItem>
                          <SelectItem value='tests'>Tests</SelectItem>
                          <SelectItem value='documents'>Documents</SelectItem>
                          <SelectItem value='depends_on'>Depends On</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className='space-y-2'>
                      <label className='text-sm font-medium'>Task</label>
                      <div className='relative'>
                        <Search className='absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 transform text-gray-400' />
                        <Input
                          placeholder='Search tasks...'
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
                      onClick={() => setIsAddTaskDialogOpen(false)}
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={handleAddTaskRelation}
                      disabled={!selectedRelationType || !searchTerm}
                    >
                      Add Relation
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            )}
          </div>
        </CardHeader>

        <CardContent>
          {taskRelations.length > 0 ? (
            <div className='grid gap-4'>
              {taskRelations.map((relation) => renderTaskCard(relation))}
            </div>
          ) : (
            <div className='py-8 text-center'>
              <GitBranch className='mx-auto mb-4 h-12 w-12 text-gray-300' />
              <p className='mb-2 text-gray-500'>No task relations found</p>
              <p className='mb-4 text-sm text-gray-400'>
                This requirement is not linked to any tasks.
              </p>
              {canEdit && (
                <Button
                  variant='outline'
                  onClick={() => setIsAddTaskDialogOpen(true)}
                >
                  <Plus className='mr-2 h-4 w-4' />
                  Add First Task
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default RequirementRelationManager;
