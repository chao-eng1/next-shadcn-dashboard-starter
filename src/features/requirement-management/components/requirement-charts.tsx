'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
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
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  Area,
  AreaChart,
  Legend,
  ScatterChart,
  Scatter,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ComposedChart,
  ReferenceLine
} from 'recharts';
import {
  BarChart3,
  PieChart as PieChartIcon,
  TrendingUp,
  Activity,
  Target,
  Users,
  Calendar,
  Filter,
  Download,
  RefreshCw,
  Maximize2,
  Settings,
  Eye,
  EyeOff
} from 'lucide-react';
import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';
import { format, subDays, subWeeks, subMonths } from 'date-fns';

interface ChartDataPoint {
  date: string;
  [key: string]: any;
}

interface RequirementChartsData {
  velocityChart: {
    date: string;
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
  cumulativeFlowChart: {
    date: string;
    backlog: number;
    inProgress: number;
    testing: number;
    done: number;
  }[];
  leadTimeChart: {
    date: string;
    leadTime: number;
    cycleTime: number;
    average: number;
  }[];
  effortVsValueChart: {
    requirement: string;
    effort: number;
    businessValue: number;
    priority: string;
    status: string;
  }[];
  complexityDistribution: {
    complexity: string;
    count: number;
    averageEffort: number;
    averageValue: number;
  }[];
  teamPerformance: {
    team: string;
    velocity: number;
    quality: number;
    efficiency: number;
    satisfaction: number;
  }[];
  riskAnalysis: {
    category: string;
    probability: number;
    impact: number;
    riskScore: number;
  }[];
  dependencyNetwork: {
    source: string;
    target: string;
    type: string;
    strength: number;
  }[];
  timeToMarket: {
    feature: string;
    estimatedDays: number;
    actualDays: number;
    variance: number;
  }[];
}

interface RequirementChartsProps {
  data?: RequirementChartsData;
  loading?: boolean;
  timeRange?: '7d' | '30d' | '90d' | '1y';
  onTimeRangeChange?: (range: '7d' | '30d' | '90d' | '1y') => void;
  onRefresh?: () => void;
  onExport?: (chartType: string, format: 'png' | 'svg' | 'pdf') => void;
}

// Mock data
const mockData: RequirementChartsData = {
  velocityChart: [
    { date: '2024-01-01', completed: 8, planned: 10, velocity: 8 },
    { date: '2024-01-08', completed: 12, planned: 10, velocity: 10 },
    { date: '2024-01-15', completed: 9, planned: 12, velocity: 9.7 },
    { date: '2024-01-22', completed: 15, planned: 12, velocity: 11 },
    { date: '2024-01-29', completed: 11, planned: 15, velocity: 11.2 },
    { date: '2024-02-05', completed: 13, planned: 11, velocity: 11.6 },
    { date: '2024-02-12', completed: 14, planned: 13, velocity: 12 }
  ],
  burndownChart: [
    { date: '2024-01-01', remaining: 120, ideal: 120, actual: 120 },
    { date: '2024-01-08', remaining: 108, ideal: 105, actual: 108 },
    { date: '2024-01-15', remaining: 99, ideal: 90, actual: 96 },
    { date: '2024-01-22', remaining: 84, ideal: 75, actual: 81 },
    { date: '2024-01-29', remaining: 73, ideal: 60, actual: 70 },
    { date: '2024-02-05', remaining: 60, ideal: 45, actual: 57 },
    { date: '2024-02-12', remaining: 46, ideal: 30, actual: 43 },
    { date: '2024-02-19', remaining: 32, ideal: 15, actual: 29 },
    { date: '2024-02-26', remaining: 18, ideal: 0, actual: 15 }
  ],
  cumulativeFlowChart: [
    { date: '2024-01-01', backlog: 45, inProgress: 12, testing: 8, done: 15 },
    { date: '2024-01-08', backlog: 42, inProgress: 15, testing: 10, done: 23 },
    { date: '2024-01-15', backlog: 38, inProgress: 18, testing: 12, done: 32 },
    { date: '2024-01-22', backlog: 35, inProgress: 16, testing: 14, done: 45 },
    { date: '2024-01-29', backlog: 32, inProgress: 19, testing: 11, done: 58 },
    { date: '2024-02-05', backlog: 28, inProgress: 21, testing: 13, done: 68 },
    { date: '2024-02-12', backlog: 25, inProgress: 17, testing: 15, done: 83 }
  ],
  leadTimeChart: [
    { date: '2024-01-01', leadTime: 12.5, cycleTime: 8.2, average: 10.3 },
    { date: '2024-01-08', leadTime: 11.8, cycleTime: 7.9, average: 9.8 },
    { date: '2024-01-15', leadTime: 13.2, cycleTime: 9.1, average: 11.1 },
    { date: '2024-01-22', leadTime: 10.9, cycleTime: 7.5, average: 9.2 },
    { date: '2024-01-29', leadTime: 14.1, cycleTime: 10.3, average: 12.2 },
    { date: '2024-02-05', leadTime: 12.3, cycleTime: 8.7, average: 10.5 },
    { date: '2024-02-12', leadTime: 11.5, cycleTime: 8.1, average: 9.8 }
  ],
  effortVsValueChart: [
    {
      requirement: 'User Auth',
      effort: 13,
      businessValue: 85,
      priority: 'High',
      status: 'Completed'
    },
    {
      requirement: 'Payment Gateway',
      effort: 21,
      businessValue: 95,
      priority: 'Critical',
      status: 'In Progress'
    },
    {
      requirement: 'Dashboard',
      effort: 8,
      businessValue: 60,
      priority: 'Medium',
      status: 'Completed'
    },
    {
      requirement: 'Notifications',
      effort: 5,
      businessValue: 40,
      priority: 'Low',
      status: 'Pending'
    },
    {
      requirement: 'Analytics',
      effort: 34,
      businessValue: 75,
      priority: 'High',
      status: 'In Progress'
    },
    {
      requirement: 'Mobile App',
      effort: 55,
      businessValue: 90,
      priority: 'High',
      status: 'Planning'
    },
    {
      requirement: 'API Gateway',
      effort: 18,
      businessValue: 70,
      priority: 'Medium',
      status: 'Completed'
    },
    {
      requirement: 'Search Feature',
      effort: 12,
      businessValue: 55,
      priority: 'Medium',
      status: 'Testing'
    }
  ],
  complexityDistribution: [
    { complexity: 'Simple', count: 45, averageEffort: 3.2, averageValue: 42 },
    { complexity: 'Medium', count: 38, averageEffort: 8.7, averageValue: 65 },
    { complexity: 'Complex', count: 23, averageEffort: 18.5, averageValue: 82 },
    {
      complexity: 'Very Complex',
      count: 8,
      averageEffort: 35.2,
      averageValue: 95
    }
  ],
  teamPerformance: [
    {
      team: 'Frontend Team',
      velocity: 85,
      quality: 92,
      efficiency: 78,
      satisfaction: 88
    },
    {
      team: 'Backend Team',
      velocity: 78,
      quality: 89,
      efficiency: 85,
      satisfaction: 82
    },
    {
      team: 'Mobile Team',
      velocity: 72,
      quality: 85,
      efficiency: 80,
      satisfaction: 90
    },
    {
      team: 'DevOps Team',
      velocity: 88,
      quality: 95,
      efficiency: 92,
      satisfaction: 85
    },
    {
      team: 'QA Team',
      velocity: 82,
      quality: 98,
      efficiency: 88,
      satisfaction: 87
    }
  ],
  riskAnalysis: [
    {
      category: 'Technical Debt',
      probability: 0.7,
      impact: 0.8,
      riskScore: 0.56
    },
    {
      category: 'Resource Constraints',
      probability: 0.6,
      impact: 0.9,
      riskScore: 0.54
    },
    { category: 'Scope Creep', probability: 0.8, impact: 0.6, riskScore: 0.48 },
    {
      category: 'Integration Issues',
      probability: 0.5,
      impact: 0.7,
      riskScore: 0.35
    },
    {
      category: 'Performance Issues',
      probability: 0.4,
      impact: 0.8,
      riskScore: 0.32
    },
    {
      category: 'Security Vulnerabilities',
      probability: 0.3,
      impact: 0.9,
      riskScore: 0.27
    }
  ],
  dependencyNetwork: [
    { source: 'User Auth', target: 'Dashboard', type: 'blocks', strength: 0.9 },
    {
      source: 'Payment Gateway',
      target: 'Order Management',
      type: 'enables',
      strength: 0.8
    },
    {
      source: 'API Gateway',
      target: 'Mobile App',
      type: 'supports',
      strength: 0.7
    },
    {
      source: 'Database Schema',
      target: 'Analytics',
      type: 'required',
      strength: 0.95
    },
    {
      source: 'Search Feature',
      target: 'Recommendations',
      type: 'enhances',
      strength: 0.6
    }
  ],
  timeToMarket: [
    {
      feature: 'User Registration',
      estimatedDays: 10,
      actualDays: 12,
      variance: 20
    },
    {
      feature: 'Product Catalog',
      estimatedDays: 15,
      actualDays: 13,
      variance: -13.3
    },
    {
      feature: 'Shopping Cart',
      estimatedDays: 8,
      actualDays: 10,
      variance: 25
    },
    {
      feature: 'Checkout Process',
      estimatedDays: 12,
      actualDays: 14,
      variance: 16.7
    },
    {
      feature: 'Payment Integration',
      estimatedDays: 20,
      actualDays: 18,
      variance: -10
    },
    {
      feature: 'Order Tracking',
      estimatedDays: 6,
      actualDays: 8,
      variance: 33.3
    }
  ]
};

const COLORS = {
  primary: '#2563eb',
  secondary: '#64748b',
  success: '#16a34a',
  warning: '#d97706',
  danger: '#dc2626',
  info: '#0891b2',
  purple: '#7c3aed',
  pink: '#db2777',
  indigo: '#4f46e5',
  teal: '#0d9488'
};

const CHART_COLORS = [
  COLORS.primary,
  COLORS.success,
  COLORS.warning,
  COLORS.danger,
  COLORS.purple,
  COLORS.info,
  COLORS.pink,
  COLORS.indigo,
  COLORS.teal
];

export function RequirementCharts({
  data = mockData,
  loading = false,
  timeRange = '30d',
  onTimeRangeChange,
  onRefresh,
  onExport
}: RequirementChartsProps) {
  const t = useTranslations('requirements');
  const [activeTab, setActiveTab] = useState('velocity');
  const [visibleSeries, setVisibleSeries] = useState<Record<string, boolean>>(
    {}
  );

  const toggleSeries = (seriesName: string) => {
    setVisibleSeries((prev) => ({
      ...prev,
      [seriesName]: !prev[seriesName]
    }));
  };

  const renderVelocityChart = () => (
    <Card>
      <CardHeader className='flex flex-row items-center justify-between'>
        <CardTitle className='text-lg'>Team Velocity</CardTitle>
        <div className='flex items-center gap-2'>
          <Button
            variant='outline'
            size='sm'
            onClick={() => onExport?.('velocity', 'png')}
          >
            <Download className='h-4 w-4' />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className='h-80'>
          <ResponsiveContainer width='100%' height='100%'>
            <ComposedChart data={data.velocityChart}>
              <CartesianGrid strokeDasharray='3 3' />
              <XAxis
                dataKey='date'
                tickFormatter={(value) => format(new Date(value), 'MMM d')}
              />
              <YAxis />
              <Tooltip
                labelFormatter={(value) =>
                  format(new Date(value), 'MMM d, yyyy')
                }
              />
              <Legend />
              <Bar dataKey='completed' fill={COLORS.success} name='Completed' />
              <Bar dataKey='planned' fill={COLORS.warning} name='Planned' />
              <Line
                type='monotone'
                dataKey='velocity'
                stroke={COLORS.primary}
                strokeWidth={3}
                name='Velocity Trend'
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );

  const renderBurndownChart = () => (
    <Card>
      <CardHeader className='flex flex-row items-center justify-between'>
        <CardTitle className='text-lg'>Sprint Burndown</CardTitle>
        <div className='flex items-center gap-2'>
          <Button
            variant='outline'
            size='sm'
            onClick={() => onExport?.('burndown', 'png')}
          >
            <Download className='h-4 w-4' />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className='h-80'>
          <ResponsiveContainer width='100%' height='100%'>
            <LineChart data={data.burndownChart}>
              <CartesianGrid strokeDasharray='3 3' />
              <XAxis
                dataKey='date'
                tickFormatter={(value) => format(new Date(value), 'MMM d')}
              />
              <YAxis />
              <Tooltip
                labelFormatter={(value) =>
                  format(new Date(value), 'MMM d, yyyy')
                }
              />
              <Legend />
              <Line
                type='monotone'
                dataKey='ideal'
                stroke={COLORS.secondary}
                strokeDasharray='5 5'
                name='Ideal'
              />
              <Line
                type='monotone'
                dataKey='actual'
                stroke={COLORS.primary}
                strokeWidth={3}
                name='Actual'
              />
              <Line
                type='monotone'
                dataKey='remaining'
                stroke={COLORS.warning}
                strokeWidth={2}
                name='Remaining'
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );

  const renderCumulativeFlowChart = () => (
    <Card>
      <CardHeader className='flex flex-row items-center justify-between'>
        <CardTitle className='text-lg'>Cumulative Flow Diagram</CardTitle>
        <div className='flex items-center gap-2'>
          <Button
            variant='outline'
            size='sm'
            onClick={() => onExport?.('cfd', 'png')}
          >
            <Download className='h-4 w-4' />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className='h-80'>
          <ResponsiveContainer width='100%' height='100%'>
            <AreaChart data={data.cumulativeFlowChart}>
              <CartesianGrid strokeDasharray='3 3' />
              <XAxis
                dataKey='date'
                tickFormatter={(value) => format(new Date(value), 'MMM d')}
              />
              <YAxis />
              <Tooltip
                labelFormatter={(value) =>
                  format(new Date(value), 'MMM d, yyyy')
                }
              />
              <Legend />
              <Area
                type='monotone'
                dataKey='done'
                stackId='1'
                stroke={COLORS.success}
                fill={COLORS.success}
                name='Done'
              />
              <Area
                type='monotone'
                dataKey='testing'
                stackId='1'
                stroke={COLORS.info}
                fill={COLORS.info}
                name='Testing'
              />
              <Area
                type='monotone'
                dataKey='inProgress'
                stackId='1'
                stroke={COLORS.warning}
                fill={COLORS.warning}
                name='In Progress'
              />
              <Area
                type='monotone'
                dataKey='backlog'
                stackId='1'
                stroke={COLORS.secondary}
                fill={COLORS.secondary}
                name='Backlog'
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );

  const renderLeadTimeChart = () => (
    <Card>
      <CardHeader className='flex flex-row items-center justify-between'>
        <CardTitle className='text-lg'>Lead Time & Cycle Time</CardTitle>
        <div className='flex items-center gap-2'>
          <Button
            variant='outline'
            size='sm'
            onClick={() => onExport?.('leadtime', 'png')}
          >
            <Download className='h-4 w-4' />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className='h-80'>
          <ResponsiveContainer width='100%' height='100%'>
            <LineChart data={data.leadTimeChart}>
              <CartesianGrid strokeDasharray='3 3' />
              <XAxis
                dataKey='date'
                tickFormatter={(value) => format(new Date(value), 'MMM d')}
              />
              <YAxis />
              <Tooltip
                labelFormatter={(value) =>
                  format(new Date(value), 'MMM d, yyyy')
                }
                formatter={(value: any) => [`${value} days`, '']}
              />
              <Legend />
              <Line
                type='monotone'
                dataKey='leadTime'
                stroke={COLORS.primary}
                strokeWidth={2}
                name='Lead Time'
              />
              <Line
                type='monotone'
                dataKey='cycleTime'
                stroke={COLORS.success}
                strokeWidth={2}
                name='Cycle Time'
              />
              <Line
                type='monotone'
                dataKey='average'
                stroke={COLORS.secondary}
                strokeDasharray='5 5'
                name='Average'
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );

  const renderEffortVsValueChart = () => (
    <Card>
      <CardHeader className='flex flex-row items-center justify-between'>
        <CardTitle className='text-lg'>Effort vs Business Value</CardTitle>
        <div className='flex items-center gap-2'>
          <Button
            variant='outline'
            size='sm'
            onClick={() => onExport?.('effortvalue', 'png')}
          >
            <Download className='h-4 w-4' />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className='h-80'>
          <ResponsiveContainer width='100%' height='100%'>
            <ScatterChart data={data.effortVsValueChart}>
              <CartesianGrid strokeDasharray='3 3' />
              <XAxis type='number' dataKey='effort' name='Effort' unit=' pts' />
              <YAxis
                type='number'
                dataKey='businessValue'
                name='Business Value'
                unit='%'
              />
              <Tooltip
                cursor={{ strokeDasharray: '3 3' }}
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload;
                    return (
                      <div className='rounded-lg border bg-white p-3 shadow-lg'>
                        <p className='font-medium'>{data.requirement}</p>
                        <p className='text-sm text-gray-600'>
                          Effort: {data.effort} pts
                        </p>
                        <p className='text-sm text-gray-600'>
                          Value: {data.businessValue}%
                        </p>
                        <Badge
                          variant={
                            data.priority === 'Critical'
                              ? 'destructive'
                              : data.priority === 'High'
                                ? 'default'
                                : 'secondary'
                          }
                        >
                          {data.priority}
                        </Badge>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Scatter
                name='Requirements'
                dataKey='businessValue'
                fill={COLORS.primary}
              />
              <ReferenceLine
                x={20}
                stroke={COLORS.warning}
                strokeDasharray='5 5'
              />
              <ReferenceLine
                y={70}
                stroke={COLORS.warning}
                strokeDasharray='5 5'
              />
            </ScatterChart>
          </ResponsiveContainer>
        </div>

        <div className='mt-4 text-sm text-gray-600'>
          <p>
            • Top-right quadrant: High value, high effort (strategic
            initiatives)
          </p>
          <p>• Top-left quadrant: High value, low effort (quick wins)</p>
          <p>• Bottom-right quadrant: Low value, high effort (avoid)</p>
        </div>
      </CardContent>
    </Card>
  );

  const renderComplexityChart = () => (
    <Card>
      <CardHeader className='flex flex-row items-center justify-between'>
        <CardTitle className='text-lg'>Complexity Analysis</CardTitle>
        <div className='flex items-center gap-2'>
          <Button
            variant='outline'
            size='sm'
            onClick={() => onExport?.('complexity', 'png')}
          >
            <Download className='h-4 w-4' />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className='h-80'>
          <ResponsiveContainer width='100%' height='100%'>
            <ComposedChart data={data.complexityDistribution}>
              <CartesianGrid strokeDasharray='3 3' />
              <XAxis dataKey='complexity' />
              <YAxis yAxisId='left' />
              <YAxis yAxisId='right' orientation='right' />
              <Tooltip />
              <Legend />
              <Bar
                yAxisId='left'
                dataKey='count'
                fill={COLORS.primary}
                name='Count'
              />
              <Line
                yAxisId='right'
                type='monotone'
                dataKey='averageEffort'
                stroke={COLORS.warning}
                strokeWidth={3}
                name='Avg Effort'
              />
              <Line
                yAxisId='right'
                type='monotone'
                dataKey='averageValue'
                stroke={COLORS.success}
                strokeWidth={3}
                name='Avg Value'
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );

  const renderTeamPerformanceChart = () => (
    <Card>
      <CardHeader className='flex flex-row items-center justify-between'>
        <CardTitle className='text-lg'>Team Performance Radar</CardTitle>
        <div className='flex items-center gap-2'>
          <Button
            variant='outline'
            size='sm'
            onClick={() => onExport?.('teamperf', 'png')}
          >
            <Download className='h-4 w-4' />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className='h-80'>
          <ResponsiveContainer width='100%' height='100%'>
            <RadarChart data={data.teamPerformance}>
              <PolarGrid />
              <PolarAngleAxis dataKey='team' />
              <PolarRadiusAxis angle={90} domain={[0, 100]} />
              <Radar
                name='Velocity'
                dataKey='velocity'
                stroke={COLORS.primary}
                fill={COLORS.primary}
                fillOpacity={0.1}
              />
              <Radar
                name='Quality'
                dataKey='quality'
                stroke={COLORS.success}
                fill={COLORS.success}
                fillOpacity={0.1}
              />
              <Radar
                name='Efficiency'
                dataKey='efficiency'
                stroke={COLORS.warning}
                fill={COLORS.warning}
                fillOpacity={0.1}
              />
              <Radar
                name='Satisfaction'
                dataKey='satisfaction'
                stroke={COLORS.purple}
                fill={COLORS.purple}
                fillOpacity={0.1}
              />
              <Legend />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );

  const renderRiskAnalysisChart = () => (
    <Card>
      <CardHeader className='flex flex-row items-center justify-between'>
        <CardTitle className='text-lg'>Risk Analysis Matrix</CardTitle>
        <div className='flex items-center gap-2'>
          <Button
            variant='outline'
            size='sm'
            onClick={() => onExport?.('risk', 'png')}
          >
            <Download className='h-4 w-4' />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className='h-80'>
          <ResponsiveContainer width='100%' height='100%'>
            <ScatterChart data={data.riskAnalysis}>
              <CartesianGrid strokeDasharray='3 3' />
              <XAxis
                type='number'
                dataKey='probability'
                name='Probability'
                domain={[0, 1]}
                tickFormatter={(value) => `${(value * 100).toFixed(0)}%`}
              />
              <YAxis
                type='number'
                dataKey='impact'
                name='Impact'
                domain={[0, 1]}
                tickFormatter={(value) => `${(value * 100).toFixed(0)}%`}
              />
              <Tooltip
                cursor={{ strokeDasharray: '3 3' }}
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload;
                    return (
                      <div className='rounded-lg border bg-white p-3 shadow-lg'>
                        <p className='font-medium'>{data.category}</p>
                        <p className='text-sm text-gray-600'>
                          Probability: {(data.probability * 100).toFixed(1)}%
                        </p>
                        <p className='text-sm text-gray-600'>
                          Impact: {(data.impact * 100).toFixed(1)}%
                        </p>
                        <p className='text-sm font-medium'>
                          Risk Score: {(data.riskScore * 100).toFixed(1)}%
                        </p>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Scatter
                name='Risk Categories'
                dataKey='impact'
                fill={COLORS.danger}
              />
              <ReferenceLine
                x={0.5}
                stroke={COLORS.warning}
                strokeDasharray='5 5'
              />
              <ReferenceLine
                y={0.5}
                stroke={COLORS.warning}
                strokeDasharray='5 5'
              />
            </ScatterChart>
          </ResponsiveContainer>
        </div>

        <div className='mt-4 grid grid-cols-2 gap-4 text-sm'>
          <div>
            <h4 className='mb-2 font-medium'>Risk Quadrants:</h4>
            <div className='space-y-1 text-gray-600'>
              <p>• High Impact, High Probability: Critical</p>
              <p>• High Impact, Low Probability: Monitor</p>
              <p>• Low Impact, High Probability: Manage</p>
              <p>• Low Impact, Low Probability: Accept</p>
            </div>
          </div>
          <div>
            <h4 className='mb-2 font-medium'>Top Risks:</h4>
            <div className='space-y-1'>
              {data.riskAnalysis
                .sort((a, b) => b.riskScore - a.riskScore)
                .slice(0, 3)
                .map((risk, index) => (
                  <div key={index} className='flex justify-between text-sm'>
                    <span>{risk.category}</span>
                    <Badge variant='destructive' className='text-xs'>
                      {(risk.riskScore * 100).toFixed(1)}%
                    </Badge>
                  </div>
                ))}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  const renderTimeToMarketChart = () => (
    <Card>
      <CardHeader className='flex flex-row items-center justify-between'>
        <CardTitle className='text-lg'>Time to Market Analysis</CardTitle>
        <div className='flex items-center gap-2'>
          <Button
            variant='outline'
            size='sm'
            onClick={() => onExport?.('timetomarket', 'png')}
          >
            <Download className='h-4 w-4' />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className='h-80'>
          <ResponsiveContainer width='100%' height='100%'>
            <BarChart data={data.timeToMarket}>
              <CartesianGrid strokeDasharray='3 3' />
              <XAxis
                dataKey='feature'
                angle={-45}
                textAnchor='end'
                height={80}
              />
              <YAxis />
              <Tooltip
                formatter={(value: any, name: any) => {
                  if (name === 'variance') {
                    return [
                      `${value > 0 ? '+' : ''}${value.toFixed(1)}%`,
                      'Variance'
                    ];
                  }
                  return [`${value} days`, name];
                }}
              />
              <Legend />
              <Bar
                dataKey='estimatedDays'
                fill={COLORS.secondary}
                name='Estimated'
              />
              <Bar dataKey='actualDays' fill={COLORS.primary} name='Actual' />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className='mt-4'>
          <h4 className='mb-2 font-medium'>Estimation Accuracy:</h4>
          <div className='grid grid-cols-3 gap-4 text-sm'>
            <div className='text-center'>
              <p className='text-2xl font-bold text-green-600'>
                {
                  data.timeToMarket.filter((f) => Math.abs(f.variance) <= 10)
                    .length
                }
              </p>
              <p className='text-gray-600'>Within 10%</p>
            </div>
            <div className='text-center'>
              <p className='text-2xl font-bold text-orange-600'>
                {
                  data.timeToMarket.filter(
                    (f) =>
                      Math.abs(f.variance) > 10 && Math.abs(f.variance) <= 25
                  ).length
                }
              </p>
              <p className='text-gray-600'>10-25% variance</p>
            </div>
            <div className='text-center'>
              <p className='text-2xl font-bold text-red-600'>
                {
                  data.timeToMarket.filter((f) => Math.abs(f.variance) > 25)
                    .length
                }
              </p>
              <p className='text-gray-600'>&gt;25% variance</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  if (loading) {
    return (
      <div className='space-y-6'>
        {[...Array(4)].map((_, i) => (
          <Card key={i}>
            <CardContent className='p-6'>
              <div className='animate-pulse space-y-3'>
                <div className='h-4 w-1/4 rounded bg-gray-200'></div>
                <div className='h-64 rounded bg-gray-200'></div>
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
      <div className='flex items-center justify-between'>
        <div>
          <h1 className='text-2xl font-bold'>Requirement Charts</h1>
          <p className='text-gray-600'>Advanced analytics and visualizations</p>
        </div>

        <div className='flex items-center gap-2'>
          <Select value={timeRange} onValueChange={onTimeRangeChange}>
            <SelectTrigger className='w-32'>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value='7d'>Last 7 days</SelectItem>
              <SelectItem value='30d'>Last 30 days</SelectItem>
              <SelectItem value='90d'>Last 90 days</SelectItem>
              <SelectItem value='1y'>Last year</SelectItem>
            </SelectContent>
          </Select>

          <Button variant='outline' size='sm' onClick={onRefresh}>
            <RefreshCw className='h-4 w-4' />
          </Button>
        </div>
      </div>

      {/* Charts */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className='grid w-full grid-cols-4'>
          <TabsTrigger value='velocity'>Velocity & Flow</TabsTrigger>
          <TabsTrigger value='analysis'>Analysis</TabsTrigger>
          <TabsTrigger value='performance'>Performance</TabsTrigger>
          <TabsTrigger value='risk'>Risk & Quality</TabsTrigger>
        </TabsList>

        <TabsContent value='velocity' className='space-y-6'>
          <div className='grid grid-cols-1 gap-6 lg:grid-cols-2'>
            {renderVelocityChart()}
            {renderBurndownChart()}
          </div>

          <div className='grid grid-cols-1 gap-6'>
            {renderCumulativeFlowChart()}
          </div>

          <div className='grid grid-cols-1 gap-6'>{renderLeadTimeChart()}</div>
        </TabsContent>

        <TabsContent value='analysis' className='space-y-6'>
          <div className='grid grid-cols-1 gap-6 lg:grid-cols-2'>
            {renderEffortVsValueChart()}
            {renderComplexityChart()}
          </div>

          <div className='grid grid-cols-1 gap-6'>
            {renderTimeToMarketChart()}
          </div>
        </TabsContent>

        <TabsContent value='performance' className='space-y-6'>
          <div className='grid grid-cols-1 gap-6'>
            {renderTeamPerformanceChart()}
          </div>
        </TabsContent>

        <TabsContent value='risk' className='space-y-6'>
          <div className='grid grid-cols-1 gap-6'>
            {renderRiskAnalysisChart()}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default RequirementCharts;
