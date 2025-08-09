'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import {
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
  createdAt: Date;
  updatedAt: Date;
}

interface RequirementListProps {
  requirements?: Requirement[];
  loading?: boolean;
  onRequirementClick?: (requirement: Requirement) => void;
  onStatusChange?: (
    requirementId: string,
    status: Requirement['status']
  ) => void;
}

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

const typeConfig = {
  functional: { label: 'Functional', color: 'bg-blue-100 text-blue-800' },
  non_functional: {
    label: 'Non-Functional',
    color: 'bg-purple-100 text-purple-800'
  },
  business: { label: 'Business', color: 'bg-green-100 text-green-800' },
  technical: { label: 'Technical', color: 'bg-gray-100 text-gray-800' }
};

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
    tags: ['security', 'authentication', 'user-management'],
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
  }
];

export function RequirementList({
  requirements = mockRequirements,
  loading = false,
  onRequirementClick,
  onStatusChange
}: RequirementListProps) {
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
      <Card>
        <CardContent className='flex flex-col items-center justify-center py-12'>
          <AlertCircle className='mb-4 h-12 w-12 text-gray-400' />
          <h3 className='mb-2 text-lg font-medium text-gray-900'>
            {t('noRequirements')}
          </h3>
          <p className='text-center text-gray-500'>
            {t('noRequirementsDescription')}
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className='space-y-4'>
      {requirements.map((requirement) => {
        const StatusIcon = statusConfig[requirement.status].icon;

        return (
          <Card
            key={requirement.id}
            className='cursor-pointer transition-shadow hover:shadow-md'
            onClick={() => onRequirementClick?.(requirement)}
          >
            <CardHeader className='pb-3'>
              <div className='flex items-start justify-between'>
                <div className='flex-1'>
                  <CardTitle className='mb-2 text-lg font-semibold'>
                    {requirement.title}
                  </CardTitle>
                  <p className='line-clamp-2 text-sm text-gray-600'>
                    {requirement.description}
                  </p>
                </div>
                <div className='ml-4 flex flex-col items-end space-y-2'>
                  <Badge
                    variant='secondary'
                    className={cn(statusConfig[requirement.status].color)}
                  >
                    <StatusIcon className='mr-1 h-3 w-3' />
                    {statusConfig[requirement.status].label}
                  </Badge>
                  <Badge
                    variant='outline'
                    className={cn(priorityConfig[requirement.priority].color)}
                  >
                    {priorityConfig[requirement.priority].label}
                  </Badge>
                </div>
              </div>
            </CardHeader>

            <CardContent className='pt-0'>
              <div className='space-y-4'>
                {/* Progress */}
                {requirement.progress > 0 && (
                  <div className='space-y-1'>
                    <div className='flex justify-between text-sm'>
                      <span className='text-gray-600'>Progress</span>
                      <span className='font-medium'>
                        {requirement.progress}%
                      </span>
                    </div>
                    <Progress value={requirement.progress} className='h-2' />
                  </div>
                )}

                {/* Metadata */}
                <div className='flex flex-wrap items-center gap-4 text-sm text-gray-600'>
                  <div className='flex items-center gap-1'>
                    <Tag className='h-4 w-4' />
                    <Badge
                      variant='outline'
                      className={cn(typeConfig[requirement.type].color)}
                    >
                      {typeConfig[requirement.type].label}
                    </Badge>
                  </div>

                  {requirement.assignee && (
                    <div className='flex items-center gap-2'>
                      <User className='h-4 w-4' />
                      <Avatar className='h-5 w-5'>
                        <AvatarImage src={requirement.assignee.avatar} />
                        <AvatarFallback className='text-xs'>
                          {requirement.assignee.name.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <span>{requirement.assignee.name}</span>
                    </div>
                  )}

                  {requirement.dueDate && (
                    <div className='flex items-center gap-1'>
                      <CalendarDays className='h-4 w-4' />
                      <span>{requirement.dueDate.toLocaleDateString()}</span>
                    </div>
                  )}

                  <div className='flex items-center gap-2'>
                    <span>Value: {requirement.businessValue}</span>
                    <span>•</span>
                    <span>Effort: {requirement.effort}</span>
                  </div>
                </div>

                {/* Tags */}
                {requirement.tags.length > 0 && (
                  <div className='flex flex-wrap gap-1'>
                    {requirement.tags.map((tag) => (
                      <Badge key={tag} variant='secondary' className='text-xs'>
                        {tag}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

export default RequirementList;
