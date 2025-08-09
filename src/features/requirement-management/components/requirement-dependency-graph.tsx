'use client';

import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from '@/components/ui/tooltip';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import {
  Search,
  Filter,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Download,
  Maximize2,
  MoreHorizontal,
  GitBranch,
  ArrowRight,
  Circle,
  Square,
  Triangle,
  Diamond,
  Eye,
  EyeOff,
  Settings
} from 'lucide-react';
import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';

interface RequirementNode {
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
  complexity: 'simple' | 'medium' | 'complex';
  businessValue: number;
  effort: number;
  progress: number;
  assignee?: {
    id: string;
    name: string;
    avatar?: string;
  };
  project?: {
    id: string;
    name: string;
  };
  x?: number;
  y?: number;
}

interface DependencyEdge {
  id: string;
  source: string;
  target: string;
  type: 'depends_on' | 'blocks' | 'relates_to' | 'implements' | 'tests';
  strength: 'weak' | 'medium' | 'strong';
  description?: string;
}

interface RequirementDependencyGraphProps {
  nodes?: RequirementNode[];
  edges?: DependencyEdge[];
  loading?: boolean;
  onNodeClick?: (nodeId: string) => void;
  onNodeDoubleClick?: (nodeId: string) => void;
  onEdgeClick?: (edgeId: string) => void;
  onExport?: (format: 'png' | 'svg' | 'json') => void;
}

// Mock data
const mockNodes: RequirementNode[] = [
  {
    id: 'req1',
    title: 'User Authentication System',
    status: 'in_progress',
    priority: 'high',
    type: 'functional',
    complexity: 'medium',
    businessValue: 85,
    effort: 13,
    progress: 60,
    assignee: {
      id: 'user1',
      name: 'Alice Johnson',
      avatar: '/avatars/alice.jpg'
    },
    project: {
      id: 'proj1',
      name: 'User Management'
    },
    x: 200,
    y: 100
  },
  {
    id: 'req2',
    title: 'Password Reset Functionality',
    status: 'approved',
    priority: 'medium',
    type: 'functional',
    complexity: 'simple',
    businessValue: 70,
    effort: 5,
    progress: 0,
    assignee: {
      id: 'user2',
      name: 'Bob Smith',
      avatar: '/avatars/bob.jpg'
    },
    project: {
      id: 'proj1',
      name: 'User Management'
    },
    x: 400,
    y: 200
  },
  {
    id: 'req3',
    title: 'Two-Factor Authentication',
    status: 'draft',
    priority: 'high',
    type: 'functional',
    complexity: 'complex',
    businessValue: 90,
    effort: 21,
    progress: 0,
    assignee: {
      id: 'user3',
      name: 'Carol Davis',
      avatar: '/avatars/carol.jpg'
    },
    project: {
      id: 'proj1',
      name: 'User Management'
    },
    x: 600,
    y: 100
  },
  {
    id: 'req4',
    title: 'User Profile Management',
    status: 'review',
    priority: 'medium',
    type: 'functional',
    complexity: 'medium',
    businessValue: 75,
    effort: 8,
    progress: 0,
    assignee: {
      id: 'user1',
      name: 'Alice Johnson',
      avatar: '/avatars/alice.jpg'
    },
    project: {
      id: 'proj1',
      name: 'User Management'
    },
    x: 200,
    y: 300
  },
  {
    id: 'req5',
    title: 'Session Management',
    status: 'completed',
    priority: 'high',
    type: 'technical',
    complexity: 'medium',
    businessValue: 80,
    effort: 13,
    progress: 100,
    assignee: {
      id: 'user4',
      name: 'David Wilson',
      avatar: '/avatars/david.jpg'
    },
    project: {
      id: 'proj1',
      name: 'User Management'
    },
    x: 400,
    y: 50
  },
  {
    id: 'req6',
    title: 'Security Audit Requirements',
    status: 'approved',
    priority: 'critical',
    type: 'non_functional',
    complexity: 'complex',
    businessValue: 95,
    effort: 34,
    progress: 0,
    assignee: {
      id: 'user5',
      name: 'Eve Brown',
      avatar: '/avatars/eve.jpg'
    },
    project: {
      id: 'proj2',
      name: 'Security'
    },
    x: 800,
    y: 200
  }
];

const mockEdges: DependencyEdge[] = [
  {
    id: 'edge1',
    source: 'req5',
    target: 'req1',
    type: 'depends_on',
    strength: 'strong',
    description: 'Authentication requires session management'
  },
  {
    id: 'edge2',
    source: 'req1',
    target: 'req2',
    type: 'relates_to',
    strength: 'medium',
    description: 'Password reset is part of authentication flow'
  },
  {
    id: 'edge3',
    source: 'req1',
    target: 'req3',
    type: 'blocks',
    strength: 'weak',
    description: 'Basic auth must be completed before 2FA'
  },
  {
    id: 'edge4',
    source: 'req1',
    target: 'req4',
    type: 'depends_on',
    strength: 'medium',
    description: 'Profile management requires user authentication'
  },
  {
    id: 'edge5',
    source: 'req3',
    target: 'req6',
    type: 'implements',
    strength: 'strong',
    description: '2FA implements security audit requirements'
  },
  {
    id: 'edge6',
    source: 'req1',
    target: 'req6',
    type: 'implements',
    strength: 'medium',
    description: 'Authentication implements security requirements'
  }
];

const statusConfig = {
  draft: { label: 'Draft', color: '#6b7280', bgColor: '#f3f4f6' },
  review: { label: 'Review', color: '#d97706', bgColor: '#fef3c7' },
  approved: { label: 'Approved', color: '#059669', bgColor: '#d1fae5' },
  in_progress: { label: 'In Progress', color: '#2563eb', bgColor: '#dbeafe' },
  completed: { label: 'Completed', color: '#16a34a', bgColor: '#dcfce7' },
  rejected: { label: 'Rejected', color: '#dc2626', bgColor: '#fee2e2' }
};

const priorityConfig = {
  low: { label: 'Low', color: '#6b7280' },
  medium: { label: 'Medium', color: '#d97706' },
  high: { label: 'High', color: '#ea580c' },
  critical: { label: 'Critical', color: '#dc2626' }
};

const typeConfig = {
  functional: { label: 'Functional', shape: 'circle', color: '#2563eb' },
  non_functional: {
    label: 'Non-Functional',
    shape: 'square',
    color: '#7c3aed'
  },
  business: { label: 'Business', shape: 'triangle', color: '#059669' },
  technical: { label: 'Technical', shape: 'diamond', color: '#dc2626' }
};

const edgeTypeConfig = {
  depends_on: { label: 'Depends On', color: '#dc2626', style: 'solid' },
  blocks: { label: 'Blocks', color: '#ea580c', style: 'dashed' },
  relates_to: { label: 'Relates To', color: '#6b7280', style: 'dotted' },
  implements: { label: 'Implements', color: '#059669', style: 'solid' },
  tests: { label: 'Tests', color: '#7c3aed', style: 'solid' }
};

const strengthConfig = {
  weak: { width: 1, opacity: 0.5 },
  medium: { width: 2, opacity: 0.7 },
  strong: { width: 3, opacity: 1 }
};

export function RequirementDependencyGraph({
  nodes = mockNodes,
  edges = mockEdges,
  loading = false,
  onNodeClick,
  onNodeDoubleClick,
  onEdgeClick,
  onExport
}: RequirementDependencyGraphProps) {
  const t = useTranslations('requirements');
  const svgRef = useRef<SVGSVGElement>(null);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [selectedEdge, setSelectedEdge] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [showLabels, setShowLabels] = useState(true);
  const [showEdgeLabels, setShowEdgeLabels] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  // Filter nodes based on search and filters
  const filteredNodes = nodes.filter((node) => {
    const matchesSearch = node.title
      .toLowerCase()
      .includes(searchTerm.toLowerCase());
    const matchesStatus =
      statusFilter === 'all' || node.status === statusFilter;
    const matchesType = typeFilter === 'all' || node.type === typeFilter;
    const matchesPriority =
      priorityFilter === 'all' || node.priority === priorityFilter;

    return matchesSearch && matchesStatus && matchesType && matchesPriority;
  });

  // Filter edges to only show those connected to visible nodes
  const filteredEdges = edges.filter((edge) => {
    const sourceVisible = filteredNodes.some((node) => node.id === edge.source);
    const targetVisible = filteredNodes.some((node) => node.id === edge.target);
    return sourceVisible && targetVisible;
  });

  const handleZoomIn = () => {
    setZoom((prev) => Math.min(prev * 1.2, 3));
  };

  const handleZoomOut = () => {
    setZoom((prev) => Math.max(prev / 1.2, 0.3));
  };

  const handleReset = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
    setSelectedNode(null);
    setSelectedEdge(null);
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.target === svgRef.current) {
      setIsDragging(true);
      setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging) {
      setPan({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y
      });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleNodeClick = (nodeId: string) => {
    setSelectedNode(nodeId === selectedNode ? null : nodeId);
    setSelectedEdge(null);
    onNodeClick?.(nodeId);
  };

  const handleNodeDoubleClick = (nodeId: string) => {
    onNodeDoubleClick?.(nodeId);
  };

  const handleEdgeClick = (edgeId: string) => {
    setSelectedEdge(edgeId === selectedEdge ? null : edgeId);
    setSelectedNode(null);
    onEdgeClick?.(edgeId);
  };

  const getNodeShape = (type: string) => {
    const config = typeConfig[type as keyof typeof typeConfig];
    switch (config.shape) {
      case 'circle':
        return <Circle className='h-full w-full' />;
      case 'square':
        return <Square className='h-full w-full' />;
      case 'triangle':
        return <Triangle className='h-full w-full' />;
      case 'diamond':
        return <Diamond className='h-full w-full' />;
      default:
        return <Circle className='h-full w-full' />;
    }
  };

  const renderNode = (node: RequirementNode) => {
    const isSelected = selectedNode === node.id;
    const statusConf = statusConfig[node.status];
    const priorityConf = priorityConfig[node.priority];
    const typeConf = typeConfig[node.type];

    return (
      <g
        key={node.id}
        transform={`translate(${(node.x || 0) * zoom + pan.x}, ${(node.y || 0) * zoom + pan.y})`}
        className='cursor-pointer'
        onClick={() => handleNodeClick(node.id)}
        onDoubleClick={() => handleNodeDoubleClick(node.id)}
      >
        {/* Node background */}
        <circle
          r={30 * zoom}
          fill={statusConf.bgColor}
          stroke={isSelected ? '#2563eb' : statusConf.color}
          strokeWidth={isSelected ? 3 : 2}
          className='transition-all duration-200'
        />

        {/* Priority indicator */}
        <circle
          r={8 * zoom}
          cx={20 * zoom}
          cy={-20 * zoom}
          fill={priorityConf.color}
          className='opacity-80'
        />

        {/* Progress indicator */}
        {node.progress > 0 && (
          <circle
            r={25 * zoom}
            fill='none'
            stroke={statusConf.color}
            strokeWidth={4 * zoom}
            strokeDasharray={`${(node.progress / 100) * 157} 157`}
            strokeDashoffset='-39.25'
            transform='rotate(-90)'
            className='opacity-60'
          />
        )}

        {/* Node icon/shape */}
        <g transform={`scale(${zoom * 0.8})`} fill={typeConf.color}>
          {getNodeShape(node.type)}
        </g>

        {/* Node label */}
        {showLabels && (
          <text
            y={45 * zoom}
            textAnchor='middle'
            className='pointer-events-none fill-gray-700 text-xs font-medium'
            fontSize={12 * zoom}
          >
            {node.title.length > 20
              ? `${node.title.substring(0, 20)}...`
              : node.title}
          </text>
        )}
      </g>
    );
  };

  const renderEdge = (edge: DependencyEdge) => {
    const sourceNode = nodes.find((n) => n.id === edge.source);
    const targetNode = nodes.find((n) => n.id === edge.target);

    if (!sourceNode || !targetNode) return null;

    const isSelected = selectedEdge === edge.id;
    const edgeConf = edgeTypeConfig[edge.type];
    const strengthConf = strengthConfig[edge.strength];

    const x1 = (sourceNode.x || 0) * zoom + pan.x;
    const y1 = (sourceNode.y || 0) * zoom + pan.y;
    const x2 = (targetNode.x || 0) * zoom + pan.x;
    const y2 = (targetNode.y || 0) * zoom + pan.y;

    // Calculate arrow position
    const angle = Math.atan2(y2 - y1, x2 - x1);
    const arrowX = x2 - Math.cos(angle) * 35 * zoom;
    const arrowY = y2 - Math.sin(angle) * 35 * zoom;

    // Calculate label position
    const labelX = (x1 + x2) / 2;
    const labelY = (y1 + y2) / 2;

    return (
      <g
        key={edge.id}
        className='cursor-pointer'
        onClick={() => handleEdgeClick(edge.id)}
      >
        {/* Edge line */}
        <line
          x1={x1}
          y1={y1}
          x2={arrowX}
          y2={arrowY}
          stroke={isSelected ? '#2563eb' : edgeConf.color}
          strokeWidth={strengthConf.width * zoom}
          strokeOpacity={strengthConf.opacity}
          strokeDasharray={
            edgeConf.style === 'dashed'
              ? '5,5'
              : edgeConf.style === 'dotted'
                ? '2,2'
                : 'none'
          }
          className='transition-all duration-200'
        />

        {/* Arrow head */}
        <polygon
          points={`${arrowX},${arrowY} ${arrowX - 10 * zoom},${arrowY - 5 * zoom} ${arrowX - 10 * zoom},${arrowY + 5 * zoom}`}
          fill={isSelected ? '#2563eb' : edgeConf.color}
          opacity={strengthConf.opacity}
        />

        {/* Edge label */}
        {showEdgeLabels && (
          <text
            x={labelX}
            y={labelY - 5}
            textAnchor='middle'
            className='pointer-events-none fill-gray-600 text-xs font-medium'
            fontSize={10 * zoom}
          >
            {edgeConf.label}
          </text>
        )}
      </g>
    );
  };

  if (loading) {
    return (
      <Card className='h-[600px]'>
        <CardContent className='flex h-full items-center justify-center'>
          <div className='text-center'>
            <div className='mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-b-2 border-blue-600'></div>
            <p className='text-gray-500'>Loading dependency graph...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className='space-y-4'>
      {/* Controls */}
      <Card>
        <CardHeader>
          <div className='flex items-center justify-between'>
            <CardTitle className='flex items-center gap-2'>
              <GitBranch className='h-5 w-5' />
              Requirement Dependency Graph
            </CardTitle>

            <div className='flex items-center gap-2'>
              {/* Zoom controls */}
              <div className='flex items-center gap-1 rounded-md border'>
                <Button variant='ghost' size='sm' onClick={handleZoomOut}>
                  <ZoomOut className='h-4 w-4' />
                </Button>
                <span className='px-2 text-sm'>{Math.round(zoom * 100)}%</span>
                <Button variant='ghost' size='sm' onClick={handleZoomIn}>
                  <ZoomIn className='h-4 w-4' />
                </Button>
              </div>

              <Button variant='outline' size='sm' onClick={handleReset}>
                <RotateCcw className='h-4 w-4' />
              </Button>

              {/* View options */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant='outline' size='sm'>
                    <Settings className='h-4 w-4' />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align='end'>
                  <DropdownMenuItem onClick={() => setShowLabels(!showLabels)}>
                    {showLabels ? (
                      <EyeOff className='mr-2 h-4 w-4' />
                    ) : (
                      <Eye className='mr-2 h-4 w-4' />
                    )}
                    {showLabels ? 'Hide' : 'Show'} Node Labels
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => setShowEdgeLabels(!showEdgeLabels)}
                  >
                    {showEdgeLabels ? (
                      <EyeOff className='mr-2 h-4 w-4' />
                    ) : (
                      <Eye className='mr-2 h-4 w-4' />
                    )}
                    {showEdgeLabels ? 'Hide' : 'Show'} Edge Labels
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Export */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant='outline' size='sm'>
                    <Download className='h-4 w-4' />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align='end'>
                  <DropdownMenuItem onClick={() => onExport?.('png')}>
                    Export as PNG
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => onExport?.('svg')}>
                    Export as SVG
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => onExport?.('json')}>
                    Export as JSON
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          {/* Filters */}
          <div className='mb-4 flex flex-wrap items-center gap-4'>
            <div className='flex items-center gap-2'>
              <Search className='h-4 w-4 text-gray-400' />
              <Input
                placeholder='Search requirements...'
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className='w-64'
              />
            </div>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className='w-32'>
                <SelectValue placeholder='Status' />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='all'>All Status</SelectItem>
                <SelectItem value='draft'>Draft</SelectItem>
                <SelectItem value='review'>Review</SelectItem>
                <SelectItem value='approved'>Approved</SelectItem>
                <SelectItem value='in_progress'>In Progress</SelectItem>
                <SelectItem value='completed'>Completed</SelectItem>
                <SelectItem value='rejected'>Rejected</SelectItem>
              </SelectContent>
            </Select>

            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className='w-32'>
                <SelectValue placeholder='Type' />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='all'>All Types</SelectItem>
                <SelectItem value='functional'>Functional</SelectItem>
                <SelectItem value='non_functional'>Non-Functional</SelectItem>
                <SelectItem value='business'>Business</SelectItem>
                <SelectItem value='technical'>Technical</SelectItem>
              </SelectContent>
            </Select>

            <Select value={priorityFilter} onValueChange={setPriorityFilter}>
              <SelectTrigger className='w-32'>
                <SelectValue placeholder='Priority' />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='all'>All Priorities</SelectItem>
                <SelectItem value='low'>Low</SelectItem>
                <SelectItem value='medium'>Medium</SelectItem>
                <SelectItem value='high'>High</SelectItem>
                <SelectItem value='critical'>Critical</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Legend */}
          <div className='mb-4 flex flex-wrap items-center gap-6 text-xs'>
            <div className='flex items-center gap-2'>
              <span className='font-medium'>Node Types:</span>
              {Object.entries(typeConfig).map(([key, config]) => (
                <div key={key} className='flex items-center gap-1'>
                  <div className='h-4 w-4' style={{ color: config.color }}>
                    {getNodeShape(key)}
                  </div>
                  <span>{config.label}</span>
                </div>
              ))}
            </div>

            <div className='flex items-center gap-2'>
              <span className='font-medium'>Edge Types:</span>
              {Object.entries(edgeTypeConfig).map(([key, config]) => (
                <div key={key} className='flex items-center gap-1'>
                  <div
                    className='h-0.5 w-4'
                    style={{
                      backgroundColor: config.color,
                      borderStyle:
                        config.style === 'dashed'
                          ? 'dashed'
                          : config.style === 'dotted'
                            ? 'dotted'
                            : 'solid'
                    }}
                  />
                  <span>{config.label}</span>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Graph */}
      <Card className='h-[600px]'>
        <CardContent className='h-full p-0'>
          <svg
            ref={svgRef}
            width='100%'
            height='100%'
            className='cursor-move border-0'
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
          >
            {/* Grid pattern */}
            <defs>
              <pattern
                id='grid'
                width={20 * zoom}
                height={20 * zoom}
                patternUnits='userSpaceOnUse'
              >
                <path
                  d={`M ${20 * zoom} 0 L 0 0 0 ${20 * zoom}`}
                  fill='none'
                  stroke='#f3f4f6'
                  strokeWidth='1'
                />
              </pattern>
            </defs>
            <rect width='100%' height='100%' fill='url(#grid)' />

            {/* Edges */}
            <g>{filteredEdges.map((edge) => renderEdge(edge))}</g>

            {/* Nodes */}
            <g>{filteredNodes.map((node) => renderNode(node))}</g>
          </svg>

          {/* Empty state */}
          {filteredNodes.length === 0 && (
            <div className='absolute inset-0 flex items-center justify-center'>
              <div className='text-center'>
                <GitBranch className='mx-auto mb-4 h-12 w-12 text-gray-300' />
                <p className='mb-2 text-gray-500'>No requirements found</p>
                <p className='text-sm text-gray-400'>
                  Try adjusting your search or filter criteria.
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Selected item details */}
      {(selectedNode || selectedEdge) && (
        <Card>
          <CardHeader>
            <CardTitle className='text-sm'>
              {selectedNode ? 'Requirement Details' : 'Dependency Details'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {selectedNode && (
              <div className='space-y-2'>
                {(() => {
                  const node = nodes.find((n) => n.id === selectedNode);
                  if (!node) return null;

                  return (
                    <>
                      <div>
                        <span className='font-medium'>{node.title}</span>
                        <div className='mt-1 flex items-center gap-2'>
                          <Badge
                            className={cn(
                              'text-xs',
                              `bg-${statusConfig[node.status].color.replace('#', '')}-100 text-${statusConfig[node.status].color.replace('#', '')}-800`
                            )}
                          >
                            {statusConfig[node.status].label}
                          </Badge>
                          <Badge
                            className={cn(
                              'text-xs',
                              `bg-${priorityConfig[node.priority].color.replace('#', '')}-100 text-${priorityConfig[node.priority].color.replace('#', '')}-800`
                            )}
                          >
                            {priorityConfig[node.priority].label}
                          </Badge>
                          <Badge variant='outline' className='text-xs'>
                            {typeConfig[node.type].label}
                          </Badge>
                        </div>
                      </div>

                      <div className='grid grid-cols-3 gap-4 text-sm'>
                        <div>
                          <span className='text-gray-500'>Business Value:</span>
                          <div className='font-medium'>
                            {node.businessValue}/100
                          </div>
                        </div>
                        <div>
                          <span className='text-gray-500'>Effort:</span>
                          <div className='font-medium'>
                            {node.effort} points
                          </div>
                        </div>
                        <div>
                          <span className='text-gray-500'>Progress:</span>
                          <div className='font-medium'>{node.progress}%</div>
                        </div>
                      </div>

                      {node.assignee && (
                        <div className='text-sm'>
                          <span className='text-gray-500'>Assignee:</span>
                          <span className='ml-2 font-medium'>
                            {node.assignee.name}
                          </span>
                        </div>
                      )}

                      {node.project && (
                        <div className='text-sm'>
                          <span className='text-gray-500'>Project:</span>
                          <span className='ml-2 font-medium'>
                            {node.project.name}
                          </span>
                        </div>
                      )}
                    </>
                  );
                })()}
              </div>
            )}

            {selectedEdge && (
              <div className='space-y-2'>
                {(() => {
                  const edge = edges.find((e) => e.id === selectedEdge);
                  const sourceNode = nodes.find((n) => n.id === edge?.source);
                  const targetNode = nodes.find((n) => n.id === edge?.target);

                  if (!edge || !sourceNode || !targetNode) return null;

                  return (
                    <>
                      <div>
                        <div className='mb-2 flex items-center gap-2'>
                          <Badge
                            className={cn(
                              'text-xs',
                              `bg-${edgeTypeConfig[edge.type].color.replace('#', '')}-100 text-${edgeTypeConfig[edge.type].color.replace('#', '')}-800`
                            )}
                          >
                            {edgeTypeConfig[edge.type].label}
                          </Badge>
                          <Badge variant='outline' className='text-xs'>
                            {edge.strength} strength
                          </Badge>
                        </div>

                        <div className='text-sm'>
                          <span className='font-medium'>
                            {sourceNode.title}
                          </span>
                          <ArrowRight className='mx-2 inline h-4 w-4' />
                          <span className='font-medium'>
                            {targetNode.title}
                          </span>
                        </div>
                      </div>

                      {edge.description && (
                        <div className='text-sm'>
                          <span className='text-gray-500'>Description:</span>
                          <p className='mt-1'>{edge.description}</p>
                        </div>
                      )}
                    </>
                  );
                })()}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export default RequirementDependencyGraph;
