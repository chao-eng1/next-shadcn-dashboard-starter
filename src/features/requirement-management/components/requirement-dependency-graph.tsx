'use client';

import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  GitBranch,
  Search,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Download,
  Settings,
  Filter,
  Maximize,
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  Clock,
  MoreHorizontal
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Node {
  id: string;
  title: string;
  status: 'DRAFT' | 'PENDING' | 'APPROVED' | 'IN_PROGRESS' | 'TESTING' | 'COMPLETED' | 'REJECTED' | 'CANCELLED';
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  type: 'FUNCTIONAL' | 'NON_FUNCTIONAL' | 'BUSINESS' | 'TECHNICAL';
  assignee?: {
    id: string;
    name: string;
    avatar?: string;
  };
  project?: {
    id: string;
    name: string;
  };
  effort?: number;
  businessValue?: number;
  dueDate?: string;
  x?: number;
  y?: number;
}

interface Edge {
  id: string;
  source: string;
  target: string;
  type: 'DEPENDS_ON' | 'BLOCKS' | 'RELATES_TO' | 'DUPLICATES' | 'PARENT_OF' | 'CHILD_OF';
  description?: string;
}

interface GraphData {
  nodes: Node[];
  edges: Edge[];
}

interface RequirementDependencyGraphProps {
  projectId?: string;
  requirementId?: string;
  onNodeClick?: (node: Node) => void;
  onEdgeClick?: (edge: Edge) => void;
}

const STATUS_CONFIG = {
  DRAFT: { label: '草稿', color: '#6B7280', bgColor: '#F3F4F6' },
  PENDING: { label: '待评估', color: '#F59E0B', bgColor: '#FEF3C7' },
  APPROVED: { label: '已确认', color: '#3B82F6', bgColor: '#DBEAFE' },
  IN_PROGRESS: { label: '开发中', color: '#8B5CF6', bgColor: '#EDE9FE' },
  TESTING: { label: '测试中', color: '#F97316', bgColor: '#FED7AA' },
  COMPLETED: { label: '已完成', color: '#10B981', bgColor: '#D1FAE5' },
  REJECTED: { label: '已拒绝', color: '#EF4444', bgColor: '#FEE2E2' },
  CANCELLED: { label: '已取消', color: '#6B7280', bgColor: '#F3F4F6' }
};

const PRIORITY_CONFIG = {
  LOW: { label: '低', color: '#10B981' },
  MEDIUM: { label: '中', color: '#F59E0B' },
  HIGH: { label: '高', color: '#F97316' },
  URGENT: { label: '紧急', color: '#EF4444' }
};

const EDGE_TYPE_CONFIG = {
  DEPENDS_ON: { label: '依赖于', color: '#3B82F6', style: 'solid' },
  BLOCKS: { label: '阻塞', color: '#EF4444', style: 'solid' },
  RELATES_TO: { label: '关联', color: '#6B7280', style: 'dashed' },
  DUPLICATES: { label: '重复', color: '#F59E0B', style: 'dotted' },
  PARENT_OF: { label: '父级', color: '#8B5CF6', style: 'solid' },
  CHILD_OF: { label: '子级', color: '#8B5CF6', style: 'solid' }
};

export function RequirementDependencyGraph({
  projectId,
  requirementId,
  onNodeClick,
  onEdgeClick
}: RequirementDependencyGraphProps) {
  const [graphData, setGraphData] = useState<GraphData>({ nodes: [], edges: [] });
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterPriority, setFilterPriority] = useState<string>('all');
  const [layoutType, setLayoutType] = useState<'hierarchical' | 'force' | 'circular'>('hierarchical');
  const [zoom, setZoom] = useState(1);
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [selectedEdge, setSelectedEdge] = useState<string | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchGraphData();
  }, [projectId, requirementId]);

  const fetchGraphData = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (projectId) {
        params.append('projectId', projectId);
      }
      if (requirementId) {
        params.append('requirementId', requirementId);
      }
      
      const response = await fetch(`/api/requirements/dependency-graph?${params}`);
      if (!response.ok) {
        throw new Error('获取依赖图数据失败');
      }
      
      const data = await response.json();
      setGraphData(data.data);
      calculateLayout(data.data);
    } catch (error) {
      console.error('获取依赖图数据失败:', error);
      toast({
        title: '错误',
        description: '获取依赖图数据失败，请稍后重试',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const calculateLayout = (data: GraphData) => {
    const { nodes, edges } = data;
    const width = 800;
    const height = 600;
    
    if (layoutType === 'hierarchical') {
      // 层次布局
      const levels = new Map<string, number>();
      const visited = new Set<string>();
      
      // 计算节点层级
      const calculateLevel = (nodeId: string, level: number = 0) => {
        if (visited.has(nodeId)) return;
        visited.add(nodeId);
        levels.set(nodeId, Math.max(levels.get(nodeId) || 0, level));
        
        const outgoingEdges = edges.filter(e => e.source === nodeId);
        outgoingEdges.forEach(edge => {
          calculateLevel(edge.target, level + 1);
        });
      };
      
      // 找到根节点（没有入边的节点）
      const rootNodes = nodes.filter(node => 
        !edges.some(edge => edge.target === node.id)
      );
      
      rootNodes.forEach(node => calculateLevel(node.id));
      
      // 按层级分组
      const levelGroups = new Map<number, string[]>();
      levels.forEach((level, nodeId) => {
        if (!levelGroups.has(level)) {
          levelGroups.set(level, []);
        }
        levelGroups.get(level)!.push(nodeId);
      });
      
      // 计算位置
      const maxLevel = Math.max(...levels.values());
      const levelHeight = height / (maxLevel + 1);
      
      nodes.forEach(node => {
        const level = levels.get(node.id) || 0;
        const nodesInLevel = levelGroups.get(level) || [];
        const indexInLevel = nodesInLevel.indexOf(node.id);
        const levelWidth = width / (nodesInLevel.length + 1);
        
        node.x = levelWidth * (indexInLevel + 1);
        node.y = levelHeight * (level + 1);
      });
    } else if (layoutType === 'force') {
      // 力导向布局（简化版）
      nodes.forEach((node, index) => {
        const angle = (2 * Math.PI * index) / nodes.length;
        const radius = Math.min(width, height) / 3;
        node.x = width / 2 + radius * Math.cos(angle);
        node.y = height / 2 + radius * Math.sin(angle);
      });
    } else if (layoutType === 'circular') {
      // 圆形布局
      nodes.forEach((node, index) => {
        const angle = (2 * Math.PI * index) / nodes.length;
        const radius = Math.min(width, height) / 3;
        node.x = width / 2 + radius * Math.cos(angle);
        node.y = height / 2 + radius * Math.sin(angle);
      });
    }
    
    setGraphData({ ...data, nodes });
  };

  const filteredNodes = graphData.nodes.filter(node => {
    const matchesSearch = node.title.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || node.status === filterStatus;
    const matchesPriority = filterPriority === 'all' || node.priority === filterPriority;
    return matchesSearch && matchesStatus && matchesPriority;
  });

  const filteredEdges = graphData.edges.filter(edge => {
    const sourceVisible = filteredNodes.some(node => node.id === edge.source);
    const targetVisible = filteredNodes.some(node => node.id === edge.target);
    return sourceVisible && targetVisible;
  });

  const handleNodeClick = (node: Node) => {
    setSelectedNode(node.id === selectedNode ? null : node.id);
    onNodeClick?.(node);
  };

  const handleEdgeClick = (edge: Edge) => {
    setSelectedEdge(edge.id === selectedEdge ? null : edge.id);
    onEdgeClick?.(edge);
  };

  const handleZoomIn = () => {
    setZoom(prev => Math.min(prev * 1.2, 3));
  };

  const handleZoomOut = () => {
    setZoom(prev => Math.max(prev / 1.2, 0.3));
  };

  const handleReset = () => {
    setZoom(1);
    setSelectedNode(null);
    setSelectedEdge(null);
  };

  const handleExport = async (format: 'svg' | 'png' | 'pdf') => {
    try {
      const svgElement = svgRef.current;
      if (!svgElement) return;
      
      const svgData = new XMLSerializer().serializeToString(svgElement);
      const blob = new Blob([svgData], { type: 'image/svg+xml' });
      const url = URL.createObjectURL(blob);
      
      const a = document.createElement('a');
      a.href = url;
      a.download = `dependency-graph.${format}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      toast({
        title: '成功',
        description: '依赖图已导出'
      });
    } catch (error) {
      console.error('导出失败:', error);
      toast({
        title: '错误',
        description: '导出失败，请稍后重试',
        variant: 'destructive'
      });
    }
  };

  const getNodeIcon = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return <CheckCircle className="h-4 w-4" />;
      case 'IN_PROGRESS':
      case 'TESTING':
        return <Clock className="h-4 w-4" />;
      case 'REJECTED':
      case 'CANCELLED':
        return <AlertTriangle className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto mb-4" />
            <p className="text-muted-foreground">加载依赖图...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* 控制面板 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="搜索需求..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8 w-64"
            />
          </div>
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-32">
              <SelectValue placeholder="状态" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">全部状态</SelectItem>
              {Object.entries(STATUS_CONFIG).map(([key, config]) => (
                <SelectItem key={key} value={key}>{config.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={filterPriority} onValueChange={setFilterPriority}>
            <SelectTrigger className="w-32">
              <SelectValue placeholder="优先级" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">全部优先级</SelectItem>
              {Object.entries(PRIORITY_CONFIG).map(([key, config]) => (
                <SelectItem key={key} value={key}>{config.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        <div className="flex items-center space-x-2">
          <Select value={layoutType} onValueChange={(value: any) => setLayoutType(value)}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="hierarchical">层次布局</SelectItem>
              <SelectItem value="force">力导向</SelectItem>
              <SelectItem value="circular">圆形布局</SelectItem>
            </SelectContent>
          </Select>
          
          <Button variant="outline" size="sm" onClick={handleZoomIn}>
            <ZoomIn className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={handleZoomOut}>
            <ZoomOut className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={handleReset}>
            <RotateCcw className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={fetchGraphData}>
            <RefreshCw className="h-4 w-4" />
          </Button>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <Download className="h-4 w-4 mr-1" />
                导出
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={() => handleExport('svg')}>
                导出为 SVG
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleExport('png')}>
                导出为 PNG
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleExport('pdf')}>
                导出为 PDF
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* 图表区域 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <GitBranch className="h-5 w-5 mr-2" />
            需求依赖关系图
          </CardTitle>
          <CardDescription>
            可视化展示需求之间的依赖关系和影响范围
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="relative overflow-hidden border rounded-lg" style={{ height: '600px' }}>
            <svg
              ref={svgRef}
              width="100%"
              height="100%"
              viewBox={`0 0 800 600`}
              style={{ transform: `scale(${zoom})` }}
            >
              {/* 定义箭头标记 */}
              <defs>
                {Object.entries(EDGE_TYPE_CONFIG).map(([type, config]) => (
                  <marker
                    key={type}
                    id={`arrow-${type}`}
                    viewBox="0 0 10 10"
                    refX="9"
                    refY="3"
                    markerWidth="6"
                    markerHeight="6"
                    orient="auto"
                  >
                    <path d="M0,0 L0,6 L9,3 z" fill={config.color} />
                  </marker>
                ))}
              </defs>
              
              {/* 渲染边 */}
              {filteredEdges.map(edge => {
                const sourceNode = filteredNodes.find(n => n.id === edge.source);
                const targetNode = filteredNodes.find(n => n.id === edge.target);
                if (!sourceNode || !targetNode) return null;
                
                const config = EDGE_TYPE_CONFIG[edge.type];
                const isSelected = selectedEdge === edge.id;
                
                return (
                  <TooltipProvider key={edge.id}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <line
                          x1={sourceNode.x}
                          y1={sourceNode.y}
                          x2={targetNode.x}
                          y2={targetNode.y}
                          stroke={config.color}
                          strokeWidth={isSelected ? 3 : 2}
                          strokeDasharray={config.style === 'dashed' ? '5,5' : config.style === 'dotted' ? '2,2' : 'none'}
                          markerEnd={`url(#arrow-${edge.type})`}
                          className="cursor-pointer hover:stroke-width-3"
                          onClick={() => handleEdgeClick(edge)}
                        />
                      </TooltipTrigger>
                      <TooltipContent>
                        <div className="text-sm">
                          <p className="font-medium">{config.label}</p>
                          {edge.description && <p className="text-muted-foreground">{edge.description}</p>}
                        </div>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                );
              })}
              
              {/* 渲染节点 */}
              {filteredNodes.map(node => {
                const statusConfig = STATUS_CONFIG[node.status];
                const priorityConfig = PRIORITY_CONFIG[node.priority];
                const isSelected = selectedNode === node.id;
                const isHighlighted = requirementId === node.id;
                
                return (
                  <TooltipProvider key={node.id}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <g
                          transform={`translate(${node.x! - 60}, ${node.y! - 30})`}
                          className="cursor-pointer"
                          onClick={() => handleNodeClick(node)}
                        >
                          {/* 节点背景 */}
                          <rect
                            width="120"
                            height="60"
                            rx="8"
                            fill={statusConfig.bgColor}
                            stroke={isSelected || isHighlighted ? '#3B82F6' : statusConfig.color}
                            strokeWidth={isSelected || isHighlighted ? 3 : 1}
                            className="hover:stroke-2"
                          />
                          
                          {/* 优先级指示器 */}
                          <rect
                            width="4"
                            height="60"
                            rx="2"
                            fill={priorityConfig.color}
                          />
                          
                          {/* 状态图标 */}
                          <foreignObject x="8" y="8" width="16" height="16">
                            <div style={{ color: statusConfig.color }}>
                              {getNodeIcon(node.status)}
                            </div>
                          </foreignObject>
                          
                          {/* 节点标题 */}
                          <text
                            x="30"
                            y="20"
                            fontSize="12"
                            fontWeight="500"
                            fill={statusConfig.color}
                            className="pointer-events-none"
                          >
                            {node.title.length > 12 ? `${node.title.slice(0, 12)}...` : node.title}
                          </text>
                          
                          {/* 负责人 */}
                          {node.assignee && (
                            <text
                              x="8"
                              y="40"
                              fontSize="10"
                              fill="#6B7280"
                              className="pointer-events-none"
                            >
                              {node.assignee.name}
                            </text>
                          )}
                          
                          {/* 工作量 */}
                          {node.effort && (
                            <text
                              x="8"
                              y="52"
                              fontSize="10"
                              fill="#6B7280"
                              className="pointer-events-none"
                            >
                              {node.effort}h
                            </text>
                          )}
                        </g>
                      </TooltipTrigger>
                      <TooltipContent>
                        <div className="text-sm space-y-1">
                          <p className="font-medium">{node.title}</p>
                          <p className="text-muted-foreground">状态: {statusConfig.label}</p>
                          <p className="text-muted-foreground">优先级: {priorityConfig.label}</p>
                          {node.assignee && (
                            <p className="text-muted-foreground">负责人: {node.assignee.name}</p>
                          )}
                          {node.project && (
                            <p className="text-muted-foreground">项目: {node.project.name}</p>
                          )}
                          {node.effort && (
                            <p className="text-muted-foreground">工作量: {node.effort}小时</p>
                          )}
                          {node.businessValue && (
                            <p className="text-muted-foreground">业务价值: {node.businessValue}分</p>
                          )}
                        </div>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                );
              })}
            </svg>
            
            {/* 缩放控制 */}
            <div className="absolute bottom-4 right-4 bg-white rounded-lg shadow-lg p-2">
              <div className="text-xs text-muted-foreground text-center mb-1">
                {Math.round(zoom * 100)}%
              </div>
            </div>
            
            {/* 图例 */}
            <div className="absolute top-4 left-4 bg-white rounded-lg shadow-lg p-3 space-y-2">
              <h4 className="text-sm font-medium">图例</h4>
              <div className="space-y-1">
                {Object.entries(EDGE_TYPE_CONFIG).map(([type, config]) => (
                  <div key={type} className="flex items-center space-x-2">
                    <div
                      className="w-4 h-0.5"
                      style={{
                        backgroundColor: config.color,
                        borderStyle: config.style === 'dashed' ? 'dashed' : config.style === 'dotted' ? 'dotted' : 'solid',
                        borderWidth: config.style !== 'solid' ? '1px' : '0',
                        borderColor: config.color
                      }}
                    />
                    <span className="text-xs">{config.label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* 统计信息 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <p className="text-2xl font-bold">{filteredNodes.length}</p>
              <p className="text-sm text-muted-foreground">需求节点</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <p className="text-2xl font-bold">{filteredEdges.length}</p>
              <p className="text-sm text-muted-foreground">依赖关系</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <p className="text-2xl font-bold">
                {filteredEdges.filter(e => e.type === 'BLOCKS').length}
              </p>
              <p className="text-sm text-muted-foreground">阻塞关系</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <p className="text-2xl font-bold">
                {filteredNodes.filter(n => 
                  !filteredEdges.some(e => e.target === n.id)
                ).length}
              </p>
              <p className="text-sm text-muted-foreground">独立需求</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}