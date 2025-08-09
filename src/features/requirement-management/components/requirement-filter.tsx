'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import {
  Popover,
  PopoverContent,
  PopoverTrigger
} from '@/components/ui/popover';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar } from '@/components/ui/calendar';
import { Slider } from '@/components/ui/slider';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Filter,
  Search,
  X,
  Calendar as CalendarIcon,
  Users,
  Tag,
  BarChart3,
  Clock
} from 'lucide-react';
import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

interface FilterOptions {
  search?: string;
  status?: string[];
  priority?: string[];
  type?: string[];
  complexity?: string[];
  projectId?: string[];
  assigneeId?: string[];
  creatorId?: string[];
  tags?: string[];
  dueDateFrom?: Date;
  dueDateTo?: Date;
  createdFrom?: Date;
  createdTo?: Date;
  businessValueMin?: number;
  businessValueMax?: number;
  effortMin?: number;
  effortMax?: number;
}

interface RequirementFilterProps {
  filters: FilterOptions;
  onFiltersChange: (filters: FilterOptions) => void;
  onClearFilters: () => void;
}

const statusOptions = [
  { value: 'draft', label: 'Draft' },
  { value: 'review', label: 'Review' },
  { value: 'approved', label: 'Approved' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'completed', label: 'Completed' },
  { value: 'rejected', label: 'Rejected' }
];

const priorityOptions = [
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
  { value: 'critical', label: 'Critical' }
];

const typeOptions = [
  { value: 'functional', label: 'Functional' },
  { value: 'non_functional', label: 'Non-Functional' },
  { value: 'business', label: 'Business' },
  { value: 'technical', label: 'Technical' }
];

const complexityOptions = [
  { value: 'simple', label: 'Simple' },
  { value: 'medium', label: 'Medium' },
  { value: 'complex', label: 'Complex' },
  { value: 'very_complex', label: 'Very Complex' }
];

// Mock data for projects and users
const mockProjects = [
  { id: '1', name: 'Project Alpha' },
  { id: '2', name: 'Project Beta' },
  { id: '3', name: 'Project Gamma' }
];

const mockUsers = [
  { id: '1', name: 'John Doe' },
  { id: '2', name: 'Jane Smith' },
  { id: '3', name: 'Mike Johnson' }
];

const mockTags = [
  'security',
  'authentication',
  'user-management',
  'performance',
  'optimization',
  'ui',
  'ux',
  'api',
  'database',
  'testing'
];

export function RequirementFilter({
  filters,
  onFiltersChange,
  onClearFilters
}: RequirementFilterProps) {
  const t = useTranslations('requirements');
  const [isOpen, setIsOpen] = useState(false);
  const [businessValueRange, setBusinessValueRange] = useState([
    filters.businessValueMin || 0,
    filters.businessValueMax || 100
  ]);
  const [effortRange, setEffortRange] = useState([
    filters.effortMin || 0,
    filters.effortMax || 100
  ]);

  const updateFilter = (key: keyof FilterOptions, value: any) => {
    onFiltersChange({ ...filters, [key]: value });
  };

  const toggleArrayFilter = (key: keyof FilterOptions, value: string) => {
    const currentArray = (filters[key] as string[]) || [];
    const newArray = currentArray.includes(value)
      ? currentArray.filter((item) => item !== value)
      : [...currentArray, value];
    updateFilter(key, newArray.length > 0 ? newArray : undefined);
  };

  const getActiveFiltersCount = () => {
    let count = 0;
    if (filters.search) count++;
    if (filters.status?.length) count++;
    if (filters.priority?.length) count++;
    if (filters.type?.length) count++;
    if (filters.complexity?.length) count++;
    if (filters.projectId?.length) count++;
    if (filters.assigneeId?.length) count++;
    if (filters.creatorId?.length) count++;
    if (filters.tags?.length) count++;
    if (filters.dueDateFrom || filters.dueDateTo) count++;
    if (filters.createdFrom || filters.createdTo) count++;
    if (
      filters.businessValueMin !== undefined ||
      filters.businessValueMax !== undefined
    )
      count++;
    if (filters.effortMin !== undefined || filters.effortMax !== undefined)
      count++;
    return count;
  };

  const activeFiltersCount = getActiveFiltersCount();

  return (
    <div className='space-y-4'>
      {/* Search Bar */}
      <div className='relative'>
        <Search className='absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 transform text-gray-400' />
        <Input
          placeholder={t('searchPlaceholder')}
          value={filters.search || ''}
          onChange={(e) => updateFilter('search', e.target.value || undefined)}
          className='pl-10'
        />
      </div>

      {/* Filter Toggle */}
      <div className='flex items-center justify-between'>
        <Popover open={isOpen} onOpenChange={setIsOpen}>
          <PopoverTrigger asChild>
            <Button variant='outline' className='gap-2'>
              <Filter className='h-4 w-4' />
              {t('filters')}
              {activeFiltersCount > 0 && (
                <Badge variant='secondary' className='ml-1'>
                  {activeFiltersCount}
                </Badge>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className='w-96 p-0' align='start'>
            <Card className='border-0 shadow-none'>
              <CardHeader className='pb-3'>
                <div className='flex items-center justify-between'>
                  <CardTitle className='text-lg'>
                    {t('advancedFilters')}
                  </CardTitle>
                  {activeFiltersCount > 0 && (
                    <Button
                      variant='ghost'
                      size='sm'
                      onClick={onClearFilters}
                      className='text-red-600 hover:text-red-700'
                    >
                      <X className='mr-1 h-4 w-4' />
                      {t('clearAll')}
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent className='space-y-6'>
                {/* Status Filter */}
                <div className='space-y-2'>
                  <Label className='text-sm font-medium'>{t('status')}</Label>
                  <div className='grid grid-cols-2 gap-2'>
                    {statusOptions.map((option) => (
                      <div
                        key={option.value}
                        className='flex items-center space-x-2'
                      >
                        <Checkbox
                          id={`status-${option.value}`}
                          checked={
                            filters.status?.includes(option.value) || false
                          }
                          onCheckedChange={() =>
                            toggleArrayFilter('status', option.value)
                          }
                        />
                        <Label
                          htmlFor={`status-${option.value}`}
                          className='cursor-pointer text-sm font-normal'
                        >
                          {option.label}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Priority Filter */}
                <div className='space-y-2'>
                  <Label className='text-sm font-medium'>{t('priority')}</Label>
                  <div className='grid grid-cols-2 gap-2'>
                    {priorityOptions.map((option) => (
                      <div
                        key={option.value}
                        className='flex items-center space-x-2'
                      >
                        <Checkbox
                          id={`priority-${option.value}`}
                          checked={
                            filters.priority?.includes(option.value) || false
                          }
                          onCheckedChange={() =>
                            toggleArrayFilter('priority', option.value)
                          }
                        />
                        <Label
                          htmlFor={`priority-${option.value}`}
                          className='cursor-pointer text-sm font-normal'
                        >
                          {option.label}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Type Filter */}
                <div className='space-y-2'>
                  <Label className='text-sm font-medium'>{t('type')}</Label>
                  <div className='grid grid-cols-2 gap-2'>
                    {typeOptions.map((option) => (
                      <div
                        key={option.value}
                        className='flex items-center space-x-2'
                      >
                        <Checkbox
                          id={`type-${option.value}`}
                          checked={
                            filters.type?.includes(option.value) || false
                          }
                          onCheckedChange={() =>
                            toggleArrayFilter('type', option.value)
                          }
                        />
                        <Label
                          htmlFor={`type-${option.value}`}
                          className='cursor-pointer text-sm font-normal'
                        >
                          {option.label}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Complexity Filter */}
                <div className='space-y-2'>
                  <Label className='text-sm font-medium'>
                    {t('complexity')}
                  </Label>
                  <div className='grid grid-cols-2 gap-2'>
                    {complexityOptions.map((option) => (
                      <div
                        key={option.value}
                        className='flex items-center space-x-2'
                      >
                        <Checkbox
                          id={`complexity-${option.value}`}
                          checked={
                            filters.complexity?.includes(option.value) || false
                          }
                          onCheckedChange={() =>
                            toggleArrayFilter('complexity', option.value)
                          }
                        />
                        <Label
                          htmlFor={`complexity-${option.value}`}
                          className='cursor-pointer text-sm font-normal'
                        >
                          {option.label}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Project Filter */}
                <div className='space-y-2'>
                  <Label className='text-sm font-medium'>{t('project')}</Label>
                  <Select
                    value={filters.projectId?.[0] || ''}
                    onValueChange={(value) =>
                      updateFilter('projectId', value ? [value] : undefined)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={t('selectProject')} />
                    </SelectTrigger>
                    <SelectContent>
                      {mockProjects.map((project) => (
                        <SelectItem key={project.id} value={project.id}>
                          {project.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Assignee Filter */}
                <div className='space-y-2'>
                  <Label className='text-sm font-medium'>{t('assignee')}</Label>
                  <Select
                    value={filters.assigneeId?.[0] || ''}
                    onValueChange={(value) =>
                      updateFilter('assigneeId', value ? [value] : undefined)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={t('selectAssignee')} />
                    </SelectTrigger>
                    <SelectContent>
                      {mockUsers.map((user) => (
                        <SelectItem key={user.id} value={user.id}>
                          {user.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Business Value Range */}
                <div className='space-y-3'>
                  <Label className='text-sm font-medium'>
                    {t('businessValue')}: {businessValueRange[0]} -{' '}
                    {businessValueRange[1]}
                  </Label>
                  <Slider
                    value={businessValueRange}
                    onValueChange={(value) => {
                      setBusinessValueRange(value);
                      updateFilter('businessValueMin', value[0]);
                      updateFilter('businessValueMax', value[1]);
                    }}
                    max={100}
                    min={0}
                    step={5}
                    className='w-full'
                  />
                </div>

                {/* Effort Range */}
                <div className='space-y-3'>
                  <Label className='text-sm font-medium'>
                    {t('effort')}: {effortRange[0]} - {effortRange[1]}
                  </Label>
                  <Slider
                    value={effortRange}
                    onValueChange={(value) => {
                      setEffortRange(value);
                      updateFilter('effortMin', value[0]);
                      updateFilter('effortMax', value[1]);
                    }}
                    max={100}
                    min={0}
                    step={5}
                    className='w-full'
                  />
                </div>

                {/* Tags Filter */}
                <div className='space-y-2'>
                  <Label className='text-sm font-medium'>{t('tags')}</Label>
                  <div className='flex max-h-24 flex-wrap gap-1 overflow-y-auto'>
                    {mockTags.map((tag) => (
                      <Badge
                        key={tag}
                        variant={
                          filters.tags?.includes(tag) ? 'default' : 'outline'
                        }
                        className='cursor-pointer text-xs'
                        onClick={() => toggleArrayFilter('tags', tag)}
                      >
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </PopoverContent>
        </Popover>

        {/* Quick Actions */}
        <div className='flex items-center gap-2'>
          <Button variant='outline' size='sm'>
            <BarChart3 className='mr-1 h-4 w-4' />
            {t('analytics')}
          </Button>
          <Button variant='outline' size='sm'>
            <Users className='mr-1 h-4 w-4' />
            {t('assignees')}
          </Button>
        </div>
      </div>

      {/* Active Filters Display */}
      {activeFiltersCount > 0 && (
        <div className='flex flex-wrap gap-2'>
          {filters.search && (
            <Badge variant='secondary' className='gap-1'>
              Search: {filters.search}
              <X
                className='h-3 w-3 cursor-pointer'
                onClick={() => updateFilter('search', undefined)}
              />
            </Badge>
          )}
          {filters.status?.map((status) => (
            <Badge key={status} variant='secondary' className='gap-1'>
              Status: {statusOptions.find((s) => s.value === status)?.label}
              <X
                className='h-3 w-3 cursor-pointer'
                onClick={() => toggleArrayFilter('status', status)}
              />
            </Badge>
          ))}
          {filters.priority?.map((priority) => (
            <Badge key={priority} variant='secondary' className='gap-1'>
              Priority:{' '}
              {priorityOptions.find((p) => p.value === priority)?.label}
              <X
                className='h-3 w-3 cursor-pointer'
                onClick={() => toggleArrayFilter('priority', priority)}
              />
            </Badge>
          ))}
          {filters.type?.map((type) => (
            <Badge key={type} variant='secondary' className='gap-1'>
              Type: {typeOptions.find((t) => t.value === type)?.label}
              <X
                className='h-3 w-3 cursor-pointer'
                onClick={() => toggleArrayFilter('type', type)}
              />
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
}

export default RequirementFilter;
