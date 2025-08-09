'use client';

import { useState } from 'react';
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
  Send
} from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { useTranslations } from 'next-intl';

const requirementFormSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200, 'Title too long'),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  type: z.enum(['functional', 'non_functional', 'business', 'technical']),
  priority: z.enum(['low', 'medium', 'high', 'critical']),
  complexity: z.enum(['simple', 'medium', 'complex', 'very_complex']),
  status: z.enum([
    'draft',
    'review',
    'approved',
    'in_progress',
    'completed',
    'rejected'
  ]),
  projectId: z.string().optional(),
  assigneeId: z.string().optional(),
  dueDate: z.date().optional(),
  businessValue: z.number().min(1).max(10),
  effort: z.number().min(1).max(10),
  acceptanceCriteria: z
    .array(z.string())
    .min(1, 'At least one acceptance criteria is required'),
  tags: z.array(z.string()),
  attachments: z.array(z.string()),
  relatedRequirements: z.array(z.string()),
  stakeholders: z.array(z.string())
});

type RequirementFormData = z.infer<typeof requirementFormSchema>;

interface RequirementFormProps {
  initialData?: Partial<RequirementFormData>;
  onSubmit?: (data: RequirementFormData, isDraft?: boolean) => void;
  onCancel?: () => void;
  loading?: boolean;
  mode?: 'create' | 'edit';
}

// Mock data
const mockProjects = [
  { id: 'proj1', name: 'User Management System' },
  { id: 'proj2', name: 'E-commerce Platform' },
  { id: 'proj3', name: 'Analytics Dashboard' }
];

const mockUsers = [
  { id: 'user1', name: 'Alice Johnson', avatar: '/avatars/alice.jpg' },
  { id: 'user2', name: 'Bob Smith', avatar: '/avatars/bob.jpg' },
  { id: 'user3', name: 'Carol Davis', avatar: '/avatars/carol.jpg' },
  { id: 'user4', name: 'David Wilson', avatar: '/avatars/david.jpg' }
];

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

const typeConfig = {
  functional: {
    label: 'Functional',
    color: 'bg-blue-100 text-blue-800',
    icon: Target
  },
  non_functional: {
    label: 'Non-Functional',
    color: 'bg-purple-100 text-purple-800',
    icon: Zap
  },
  business: {
    label: 'Business',
    color: 'bg-green-100 text-green-800',
    icon: Users
  },
  technical: {
    label: 'Technical',
    color: 'bg-orange-100 text-orange-800',
    icon: FileText
  }
};

const priorityConfig = {
  low: { label: 'Low', color: 'bg-gray-100 text-gray-800' },
  medium: { label: 'Medium', color: 'bg-yellow-100 text-yellow-800' },
  high: { label: 'High', color: 'bg-orange-100 text-orange-800' },
  critical: { label: 'Critical', color: 'bg-red-100 text-red-800' }
};

const complexityConfig = {
  simple: { label: 'Simple', color: 'bg-green-100 text-green-800' },
  medium: { label: 'Medium', color: 'bg-yellow-100 text-yellow-800' },
  complex: { label: 'Complex', color: 'bg-orange-100 text-orange-800' },
  very_complex: { label: 'Very Complex', color: 'bg-red-100 text-red-800' }
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

export function RequirementForm({
  initialData,
  onSubmit,
  onCancel,
  loading = false,
  mode = 'create'
}: RequirementFormProps) {
  const t = useTranslations('requirements');
  const [newAcceptanceCriteria, setNewAcceptanceCriteria] = useState('');
  const [newTag, setNewTag] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>(
    initialData?.tags || []
  );

  const form = useForm<RequirementFormData>({
    resolver: zodResolver(requirementFormSchema),
    defaultValues: {
      title: '',
      description: '',
      type: 'functional',
      priority: 'medium',
      complexity: 'medium',
      status: 'draft',
      businessValue: 5,
      effort: 5,
      acceptanceCriteria: [],
      tags: [],
      attachments: [],
      relatedRequirements: [],
      stakeholders: [],
      ...initialData
    }
  });

  const watchedAcceptanceCriteria = form.watch('acceptanceCriteria');

  const handleSubmit = (data: RequirementFormData, isDraft = false) => {
    const formData = {
      ...data,
      tags: selectedTags
    };
    onSubmit?.(formData, isDraft);
  };

  const addAcceptanceCriteria = () => {
    if (newAcceptanceCriteria.trim()) {
      const current = form.getValues('acceptanceCriteria');
      form.setValue('acceptanceCriteria', [
        ...current,
        newAcceptanceCriteria.trim()
      ]);
      setNewAcceptanceCriteria('');
    }
  };

  const removeAcceptanceCriteria = (index: number) => {
    const current = form.getValues('acceptanceCriteria');
    form.setValue(
      'acceptanceCriteria',
      current.filter((_, i) => i !== index)
    );
  };

  const addTag = () => {
    if (newTag.trim() && !selectedTags.includes(newTag.trim())) {
      setSelectedTags([...selectedTags, newTag.trim()]);
      setNewTag('');
    }
  };

  const removeTag = (tag: string) => {
    setSelectedTags(selectedTags.filter((t) => t !== tag));
  };

  const addPredefinedTag = (tag: string) => {
    if (!selectedTags.includes(tag)) {
      setSelectedTags([...selectedTags, tag]);
    }
  };

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit((data) => handleSubmit(data, false))}
        className='space-y-6'
      >
        <Tabs defaultValue='basic' className='w-full'>
          <TabsList className='grid w-full grid-cols-4'>
            <TabsTrigger value='basic'>Basic Info</TabsTrigger>
            <TabsTrigger value='details'>Details</TabsTrigger>
            <TabsTrigger value='criteria'>Acceptance</TabsTrigger>
            <TabsTrigger value='metadata'>Metadata</TabsTrigger>
          </TabsList>

          <TabsContent value='basic' className='space-y-6'>
            <Card>
              <CardHeader>
                <CardTitle>Basic Information</CardTitle>
                <CardDescription>
                  Provide the essential information about the requirement
                </CardDescription>
              </CardHeader>
              <CardContent className='space-y-4'>
                <FormField
                  control={form.control}
                  name='title'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Title *</FormLabel>
                      <FormControl>
                        <Input
                          placeholder='Enter requirement title...'
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
                      <FormLabel>Description *</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder='Describe the requirement in detail...'
                          className='min-h-[120px]'
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        Provide a clear and detailed description of what needs
                        to be implemented
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
                        <FormLabel>Type</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder='Select type' />
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
                        <FormLabel>Priority</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder='Select priority' />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {Object.entries(priorityConfig).map(
                              ([key, config]) => (
                                <SelectItem key={key} value={key}>
                                  <Badge
                                    className={cn('text-xs', config.color)}
                                  >
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
                        <FormLabel>Complexity</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder='Select complexity' />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {Object.entries(complexityConfig).map(
                              ([key, config]) => (
                                <SelectItem key={key} value={key}>
                                  <Badge
                                    className={cn('text-xs', config.color)}
                                  >
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
                    name='status'
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Status</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder='Select status' />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {Object.entries(statusConfig).map(
                              ([key, config]) => {
                                const Icon = config.icon;
                                return (
                                  <SelectItem key={key} value={key}>
                                    <div className='flex items-center gap-2'>
                                      <Icon className='h-4 w-4' />
                                      <Badge
                                        className={cn('text-xs', config.color)}
                                      >
                                        {config.label}
                                      </Badge>
                                    </div>
                                  </SelectItem>
                                );
                              }
                            )}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value='details' className='space-y-6'>
            <Card>
              <CardHeader>
                <CardTitle>Assignment & Timeline</CardTitle>
                <CardDescription>
                  Assign the requirement and set timeline
                </CardDescription>
              </CardHeader>
              <CardContent className='space-y-4'>
                <div className='grid grid-cols-2 gap-4'>
                  <FormField
                    control={form.control}
                    name='projectId'
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Project</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder='Select project' />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {mockProjects.map((project) => (
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
                        <FormLabel>Assignee</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder='Select assignee' />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {mockUsers.map((user) => (
                              <SelectItem key={user.id} value={user.id}>
                                <div className='flex items-center gap-2'>
                                  <Avatar className='h-5 w-5'>
                                    <AvatarImage src={user.avatar} />
                                    <AvatarFallback className='text-xs'>
                                      {user.name.charAt(0)}
                                    </AvatarFallback>
                                  </Avatar>
                                  {user.name}
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
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
                      <FormLabel>Due Date</FormLabel>
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
                                format(field.value, 'PPP')
                              ) : (
                                <span>Pick a date</span>
                              )}
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

                <div className='grid grid-cols-2 gap-4'>
                  <FormField
                    control={form.control}
                    name='businessValue'
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Business Value: {field.value}</FormLabel>
                        <FormControl>
                          <Slider
                            min={1}
                            max={10}
                            step={1}
                            value={[field.value]}
                            onValueChange={(value) => field.onChange(value[0])}
                            className='w-full'
                          />
                        </FormControl>
                        <FormDescription>
                          Rate the business value from 1 (low) to 10 (high)
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name='effort'
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Effort Estimate: {field.value}</FormLabel>
                        <FormControl>
                          <Slider
                            min={1}
                            max={10}
                            step={1}
                            value={[field.value]}
                            onValueChange={(value) => field.onChange(value[0])}
                            className='w-full'
                          />
                        </FormControl>
                        <FormDescription>
                          Estimate the effort from 1 (easy) to 10 (very hard)
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value='criteria' className='space-y-6'>
            <Card>
              <CardHeader>
                <CardTitle>Acceptance Criteria</CardTitle>
                <CardDescription>
                  Define the conditions that must be met for this requirement to
                  be considered complete
                </CardDescription>
              </CardHeader>
              <CardContent className='space-y-4'>
                <div className='space-y-2'>
                  {watchedAcceptanceCriteria.map((criteria, index) => (
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
                    placeholder='Add acceptance criteria...'
                    value={newAcceptanceCriteria}
                    onChange={(e) => setNewAcceptanceCriteria(e.target.value)}
                    onKeyPress={(e) => {
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

                {form.formState.errors.acceptanceCriteria && (
                  <p className='text-sm text-red-600'>
                    {form.formState.errors.acceptanceCriteria.message}
                  </p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value='metadata' className='space-y-6'>
            <Card>
              <CardHeader>
                <CardTitle>Tags & Metadata</CardTitle>
                <CardDescription>
                  Add tags and additional metadata to help organize and
                  categorize this requirement
                </CardDescription>
              </CardHeader>
              <CardContent className='space-y-4'>
                <div className='space-y-2'>
                  <Label>Tags</Label>
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

                  <div className='flex gap-2'>
                    <Input
                      placeholder='Add custom tag...'
                      value={newTag}
                      onChange={(e) => setNewTag(e.target.value)}
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          addTag();
                        }
                      }}
                    />
                    <Button
                      type='button'
                      variant='outline'
                      onClick={addTag}
                      disabled={!newTag.trim()}
                    >
                      <Plus className='h-4 w-4' />
                    </Button>
                  </div>

                  <div className='space-y-2'>
                    <Label className='text-sm text-gray-600'>
                      Suggested Tags:
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
                            onClick={() => addPredefinedTag(tag)}
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
          </TabsContent>
        </Tabs>

        <div className='flex items-center justify-between border-t pt-6'>
          <div className='flex gap-2'>
            {onCancel && (
              <Button type='button' variant='outline' onClick={onCancel}>
                Cancel
              </Button>
            )}
          </div>

          <div className='flex gap-2'>
            <Button
              type='button'
              variant='outline'
              onClick={() => handleSubmit(form.getValues(), true)}
              disabled={loading}
            >
              <Save className='mr-2 h-4 w-4' />
              Save as Draft
            </Button>
            <Button type='submit' disabled={loading}>
              <Send className='mr-2 h-4 w-4' />
              {mode === 'create' ? 'Create Requirement' : 'Update Requirement'}
            </Button>
          </div>
        </div>
      </form>
    </Form>
  );
}

export default RequirementForm;
