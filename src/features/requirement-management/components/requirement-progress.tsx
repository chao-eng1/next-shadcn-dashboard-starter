'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  Area,
  AreaChart,
  Legend
} from 'recharts';
import {
  TrendingUp,
  Clock,
  CheckCircle2,
  AlertCircle,
  Target,
  Calendar,
  Users,
  Activity,
  Filter,
  RefreshCw,
  ChevronRight,
  PlayCircle,
  PauseCircle,
  CheckCircle
} from 'lucide-react';
import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';
import { format, addDays, subDays } from 'date-fns';

interface ProjectProgress {
  id: string;
  name: string;
  totalRequirements: number;
  completedRequirements: number;
  inProgressRequirements: number;
  pendingRequirements: number;
  progressPercentage: number;
  estimatedCompletion: Date;
  assignees: {
    id: string;
    name: string;
    avatar?: string;
  }[];
  status: 'on_track' | 'at_risk' | 'delayed' | 'completed';
  milestones: {
    id: string;
    name: string;
    dueDate: Date;
    completed: boolean;
    requirements: number;
  }[];
}

interface RequirementProgressData {
  projects: ProjectProgress[];
  overallProgress: {
    totalRequirements: number;
    completedRequirements: number;
    progressPercentage: number;
    estimatedCompletion: Date;
  };
  progressTimeline: {
    date: string;
    completed: number;
    inProgress: number;
    pending: number;
    cumulative: number;
  }[];
  velocityChart: {
    week: string;
    completed: number;
    planned: number;
    velocity: number;
  }[];
  burndownChart: {
    date: string;
    remaining: number;
    ideal: number;
    actual: number;
  }[];
}

interface RequirementProgressProps {
  data?: RequirementProgressData;
  loading?: boolean;
  timeRange?: '7d' | '30d' | '90d';
  onTimeRangeChange?: (range: '7d' | '30d' | '90d') => void;
  onRefresh?: () => void;
}

// Mock data for demonstration
const mockData: RequirementProgressData = {
  projects: [
    {
      id: 'proj1',
      name: 'User Management System',
      totalRequirements: 45,
      completedRequirements: 32,
      inProgressRequirements: 8,
      pendingRequirements: 5,
      progressPercentage: 71,
      estimatedCompletion: addDays(new Date(), 14),
      status: 'on_track',
      assignees: [
        { id: '1', name: 'Alice Johnson', avatar: '/avatars/alice.jpg' },
        { id: '2', name: 'Bob Smith', avatar: '/avatars/bob.jpg' },
        { id: '3', name: 'Carol Davis', avatar: '/avatars/carol.jpg' }
      ],
      milestones: [
        {
          id: 'm1',
          name: 'Authentication Module',
          dueDate: subDays(new Date(), 5),
          completed: true,
          requirements: 12
        },
        {
          id: 'm2',
          name: 'User Profile Management',
          dueDate: addDays(new Date(), 7),
          completed: false,
          requirements: 18
        },
        {
          id: 'm3',
          name: 'Admin Dashboard',
          dueDate: addDays(new Date(), 21),
          completed: false,
          requirements: 15
        }
      ]
    },
    {
      id: 'proj2',
      name: 'E-commerce Platform',
      totalRequirements: 38,
      completedRequirements: 22,
      inProgressRequirements: 12,
      pendingRequirements: 4,
      progressPercentage: 58,
      estimatedCompletion: addDays(new Date(), 28),
      status: 'at_risk',
      assignees: [
        { id: '4', name: 'David Wilson', avatar: '/avatars/david.jpg' },
        { id: '5', name: 'Eve Brown', avatar: '/avatars/eve.jpg' }
      ],
      milestones: [
        {
          id: 'm4',
          name: 'Product Catalog',
          dueDate: subDays(new Date(), 10),
          completed: true,
          requirements: 15
        },
        {
          id: 'm5',
          name: 'Shopping Cart',
          dueDate: addDays(new Date(), 5),
          completed: false,
          requirements: 12
        },
        {
          id: 'm6',
          name: 'Payment Integration',
          dueDate: addDays(new Date(), 20),
          completed: false,
          requirements: 11
        }
      ]
    },
    {
      id: 'proj3',
      name: 'Analytics Dashboard',
      totalRequirements: 28,
      completedRequirements: 25,
      inProgressRequirements: 3,
      pendingRequirements: 0,
      progressPercentage: 89,
      estimatedCompletion: addDays(new Date(), 7),
      status: 'on_track',
      assignees: [
        { id: '6', name: 'Frank Miller', avatar: '/avatars/frank.jpg' }
      ],
      milestones: [
        {
          id: 'm7',
          name: 'Data Visualization',
          dueDate: subDays(new Date(), 15),
          completed: true,
          requirements: 20
        },
        {
          id: 'm8',
          name: 'Real-time Updates',
          dueDate: addDays(new Date(), 5),
          completed: false,
          requirements: 8
        }
      ]
    }
  ],
  overallProgress: {
    totalRequirements: 111,
    completedRequirements: 79,
    progressPercentage: 71,
    estimatedCompletion: addDays(new Date(), 21)
  },
  progressTimeline: [
    {
      date: '2024-01-01',
      completed: 45,
      inProgress: 12,
      pending: 54,
      cumulative: 45
    },
    {
      date: '2024-01-08',
      completed: 52,
      inProgress: 15,
      pending: 44,
      cumulative: 52
    },
    {
      date: '2024-01-15',
      completed: 61,
      inProgress: 18,
      pending: 32,
      cumulative: 61
    },
    {
      date: '2024-01-22',
      completed: 68,
      inProgress: 22,
      pending: 21,
      cumulative: 68
    },
    {
      date: '2024-01-29',
      completed: 75,
      inProgress: 25,
      pending: 11,
      cumulative: 75
    },
    {
      date: '2024-02-05',
      completed: 79,
      inProgress: 23,
      pending: 9,
      cumulative: 79
    }
  ],
  velocityChart: [
    { week: 'Week 1', completed: 8, planned: 10, velocity: 0.8 },
    { week: 'Week 2', completed: 12, planned: 10, velocity: 1.2 },
    { week: 'Week 3', completed: 9, planned: 10, velocity: 0.9 },
    { week: 'Week 4', completed: 11, planned: 10, velocity: 1.1 },
    { week: 'Week 5', completed: 7, planned: 10, velocity: 0.7 },
    { week: 'Week 6', completed: 13, planned: 10, velocity: 1.3 }
  ],
  burndownChart: [
    { date: '2024-01-01', remaining: 111, ideal: 111, actual: 111 },
    { date: '2024-01-08', remaining: 104, ideal: 95, actual: 104 },
    { date: '2024-01-15', remaining: 93, ideal: 79, actual: 93 },
    { date: '2024-01-22', remaining: 82, ideal: 63, actual: 82 },
    { date: '2024-01-29', remaining: 68, ideal: 47, actual: 68 },
    { date: '2024-02-05', remaining: 55, ideal: 31, actual: 55 },
    { date: '2024-02-12', remaining: 32, ideal: 15, actual: 32 }
  ]
};

const statusConfig = {
  on_track: {
    label: '按计划进行',
    color: 'bg-green-100 text-green-800 border-green-200',
    icon: CheckCircle2
  },
  at_risk: {
    label: '存在风险',
    color: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    icon: AlertCircle
  },
  delayed: {
    label: '进度延迟',
    color: 'bg-red-100 text-red-800 border-red-200',
    icon: Clock
  },
  completed: {
    label: '已完成',
    color: 'bg-blue-100 text-blue-800 border-blue-200',
    icon: CheckCircle
  }
};

export function RequirementProgress({
  data = mockData,
  loading = false,
  timeRange = '30d',
  onTimeRangeChange,
  onRefresh
}: RequirementProgressProps) {
  const [selectedProject, setSelectedProject] = useState<string>('all');
  const t = useTranslations('requirements');

  if (loading) {
    return (
      <div className='space-y-4'>
        <div className='h-8 animate-pulse rounded bg-gray-200' />
        <div className='h-64 animate-pulse rounded bg-gray-200' />
      </div>
    );
  }

  return (
    <div className='space-y-6'>
      {/* Header Controls */}
      <div className='flex items-center justify-between'>
        <div className='flex items-center space-x-4'>
          <Select value={selectedProject} onValueChange={setSelectedProject}>
            <SelectTrigger className='w-48'>
              <SelectValue placeholder='选择项目' />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value='all'>所有项目</SelectItem>
              {data.projects.map((project) => (
                <SelectItem key={project.id} value={project.id}>
                  {project.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={timeRange} onValueChange={onTimeRangeChange}>
            <SelectTrigger className='w-32'>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value='7d'>7天</SelectItem>
              <SelectItem value='30d'>30天</SelectItem>
              <SelectItem value='90d'>90天</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Button variant='outline' size='sm' onClick={onRefresh}>
          <RefreshCw className='mr-2 h-4 w-4' />
          刷新
        </Button>
      </div>

      {/* Overall Progress Summary */}
      <Card>
        <CardHeader>
          <CardTitle className='flex items-center gap-2'>
            <Target className='h-5 w-5' />
            整体进度概览
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className='mb-6 grid grid-cols-1 gap-4 md:grid-cols-4'>
            <div className='text-center'>
              <div className='text-2xl font-bold text-blue-600'>
                {data.overallProgress.totalRequirements}
              </div>
              <div className='text-sm text-gray-600'>总需求数</div>
            </div>
            <div className='text-center'>
              <div className='text-2xl font-bold text-green-600'>
                {data.overallProgress.completedRequirements}
              </div>
              <div className='text-sm text-gray-600'>已完成</div>
            </div>
            <div className='text-center'>
              <div className='text-2xl font-bold text-purple-600'>
                {data.overallProgress.progressPercentage}%
              </div>
              <div className='text-sm text-gray-600'>完成率</div>
            </div>
            <div className='text-center'>
              <div className='text-2xl font-bold text-orange-600'>
                {format(data.overallProgress.estimatedCompletion, 'MM/dd')}
              </div>
              <div className='text-sm text-gray-600'>预计完成</div>
            </div>
          </div>

          <div className='space-y-2'>
            <div className='flex justify-between text-sm'>
              <span>整体进度</span>
              <span className='font-medium'>
                {data.overallProgress.progressPercentage}%
              </span>
            </div>
            <Progress
              value={data.overallProgress.progressPercentage}
              className='h-3'
            />
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue='projects' className='space-y-4'>
        <TabsList>
          <TabsTrigger value='projects' className='flex items-center gap-2'>
            <Target className='h-4 w-4' />
            项目进度
          </TabsTrigger>
          <TabsTrigger value='timeline' className='flex items-center gap-2'>
            <Activity className='h-4 w-4' />
            进度时间线
          </TabsTrigger>
          <TabsTrigger value='velocity' className='flex items-center gap-2'>
            <TrendingUp className='h-4 w-4' />
            团队速度
          </TabsTrigger>
          <TabsTrigger value='burndown' className='flex items-center gap-2'>
            <Calendar className='h-4 w-4' />
            燃尽图
          </TabsTrigger>
        </TabsList>

        {/* Projects Progress */}
        <TabsContent value='projects' className='space-y-4'>
          <div className='grid gap-4'>
            {data.projects.map((project) => {
              const StatusIcon = statusConfig[project.status].icon;

              return (
                <Card key={project.id}>
                  <CardHeader className='pb-3'>
                    <div className='flex items-center justify-between'>
                      <CardTitle className='text-lg'>{project.name}</CardTitle>
                      <Badge
                        variant='secondary'
                        className={cn(statusConfig[project.status].color)}
                      >
                        <StatusIcon className='mr-1 h-3 w-3' />
                        {statusConfig[project.status].label}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className='space-y-4'>
                    {/* Progress Bar */}
                    <div className='space-y-2'>
                      <div className='flex justify-between text-sm'>
                        <span>项目进度</span>
                        <span className='font-medium'>
                          {project.progressPercentage}%
                        </span>
                      </div>
                      <Progress
                        value={project.progressPercentage}
                        className='h-2'
                      />
                    </div>

                    {/* Stats */}
                    <div className='grid grid-cols-4 gap-4 text-center'>
                      <div>
                        <div className='text-lg font-semibold text-blue-600'>
                          {project.totalRequirements}
                        </div>
                        <div className='text-xs text-gray-600'>总计</div>
                      </div>
                      <div>
                        <div className='text-lg font-semibold text-green-600'>
                          {project.completedRequirements}
                        </div>
                        <div className='text-xs text-gray-600'>已完成</div>
                      </div>
                      <div>
                        <div className='text-lg font-semibold text-orange-600'>
                          {project.inProgressRequirements}
                        </div>
                        <div className='text-xs text-gray-600'>进行中</div>
                      </div>
                      <div>
                        <div className='text-lg font-semibold text-gray-600'>
                          {project.pendingRequirements}
                        </div>
                        <div className='text-xs text-gray-600'>待处理</div>
                      </div>
                    </div>

                    {/* Team and Timeline */}
                    <div className='flex items-center justify-between border-t pt-2'>
                      <div className='flex items-center space-x-2'>
                        <Users className='h-4 w-4 text-gray-500' />
                        <div className='flex -space-x-1'>
                          {project.assignees.slice(0, 3).map((assignee) => (
                            <Avatar
                              key={assignee.id}
                              className='h-6 w-6 border-2 border-white'
                            >
                              <AvatarImage src={assignee.avatar} />
                              <AvatarFallback className='text-xs'>
                                {assignee.name.charAt(0)}
                              </AvatarFallback>
                            </Avatar>
                          ))}
                          {project.assignees.length > 3 && (
                            <div className='flex h-6 w-6 items-center justify-center rounded-full border-2 border-white bg-gray-100'>
                              <span className='text-xs text-gray-600'>
                                +{project.assignees.length - 3}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className='flex items-center text-sm text-gray-600'>
                        <Calendar className='mr-1 h-4 w-4' />
                        预计 {format(project.estimatedCompletion, 'MM/dd')}
                      </div>
                    </div>

                    {/* Milestones */}
                    <div className='space-y-2'>
                      <div className='text-sm font-medium text-gray-700'>
                        里程碑
                      </div>
                      <div className='space-y-1'>
                        {project.milestones.map((milestone) => (
                          <div
                            key={milestone.id}
                            className='flex items-center justify-between py-1'
                          >
                            <div className='flex items-center space-x-2'>
                              {milestone.completed ? (
                                <CheckCircle className='h-4 w-4 text-green-500' />
                              ) : (
                                <Clock className='h-4 w-4 text-gray-400' />
                              )}
                              <span
                                className={cn(
                                  'text-sm',
                                  milestone.completed
                                    ? 'text-gray-600 line-through'
                                    : 'text-gray-900'
                                )}
                              >
                                {milestone.name}
                              </span>
                            </div>
                            <div className='text-xs text-gray-500'>
                              {format(milestone.dueDate, 'MM/dd')}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        {/* Progress Timeline */}
        <TabsContent value='timeline' className='space-y-4'>
          <Card>
            <CardHeader>
              <CardTitle>进度时间线</CardTitle>
            </CardHeader>
            <CardContent>
              <div className='h-80'>
                <ResponsiveContainer width='100%' height='100%'>
                  <AreaChart data={data.progressTimeline}>
                    <CartesianGrid strokeDasharray='3 3' />
                    <XAxis
                      dataKey='date'
                      tickFormatter={(value) =>
                        format(new Date(value), 'MM/dd')
                      }
                    />
                    <YAxis />
                    <Tooltip
                      labelFormatter={(value) =>
                        format(new Date(value), 'yyyy-MM-dd')
                      }
                    />
                    <Legend />
                    <Area
                      type='monotone'
                      dataKey='completed'
                      stackId='1'
                      stroke='#16a34a'
                      fill='#16a34a'
                      name='已完成'
                    />
                    <Area
                      type='monotone'
                      dataKey='inProgress'
                      stackId='1'
                      stroke='#2563eb'
                      fill='#2563eb'
                      name='进行中'
                    />
                    <Area
                      type='monotone'
                      dataKey='pending'
                      stackId='1'
                      stroke='#d97706'
                      fill='#d97706'
                      name='待处理'
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Team Velocity */}
        <TabsContent value='velocity' className='space-y-4'>
          <Card>
            <CardHeader>
              <CardTitle>团队速度分析</CardTitle>
            </CardHeader>
            <CardContent>
              <div className='h-80'>
                <ResponsiveContainer width='100%' height='100%'>
                  <BarChart data={data.velocityChart}>
                    <CartesianGrid strokeDasharray='3 3' />
                    <XAxis dataKey='week' />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey='planned' fill='#e5e7eb' name='计划完成' />
                    <Bar dataKey='completed' fill='#2563eb' name='实际完成' />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Burndown Chart */}
        <TabsContent value='burndown' className='space-y-4'>
          <Card>
            <CardHeader>
              <CardTitle>燃尽图</CardTitle>
            </CardHeader>
            <CardContent>
              <div className='h-80'>
                <ResponsiveContainer width='100%' height='100%'>
                  <LineChart data={data.burndownChart}>
                    <CartesianGrid strokeDasharray='3 3' />
                    <XAxis
                      dataKey='date'
                      tickFormatter={(value) =>
                        format(new Date(value), 'MM/dd')
                      }
                    />
                    <YAxis />
                    <Tooltip
                      labelFormatter={(value) =>
                        format(new Date(value), 'yyyy-MM-dd')
                      }
                    />
                    <Legend />
                    <Line
                      type='monotone'
                      dataKey='ideal'
                      stroke='#d97706'
                      strokeDasharray='5 5'
                      name='理想进度'
                    />
                    <Line
                      type='monotone'
                      dataKey='actual'
                      stroke='#2563eb'
                      strokeWidth={2}
                      name='实际进度'
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default RequirementProgress;
