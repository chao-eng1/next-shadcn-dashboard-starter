'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { format } from 'date-fns';
import { zhCN } from 'date-fns/locale/zh-CN';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger
} from '@/components/ui/collapsible';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/components/ui/use-toast';

import {
  ChevronRightIcon,
  ChevronDownIcon,
  MoreHorizontalIcon,
  EditIcon,
  TrashIcon,
  EyeIcon,
  PlusIcon,
  FolderIcon,
  FileTextIcon
} from 'lucide-react';

import {
  Requirement,
  RequirementTreeNode,
  RequirementPriority,
  RequirementStatus,
  RequirementType,
  RequirementComplexity
} from '../types/requirement';
import {
  getRequirementPriorityConfig,
  getRequirementStatusConfig,
  getRequirementTypeConfig,
  getRequirementComplexityConfig,
  buildRequirementTree
} from '../utils/requirement-helpers';

interface RequirementTreeProps {
  projectId: string;
  requirements: Requirement[];
  loading?: boolean;
  onRequirementSelect?: (requirement: Requirement) => void;
  onRequirementUpdate?: (requirement: Requirement) => void;
  onRequirementDelete?: (requirementId: string) => void;
  canEdit?: boolean;
  canDelete?: boolean;
  showActions?: boolean;
  expandAll?: boolean;
}

export function RequirementTree({
  projectId,
  requirements,
  loading = false,
  onRequirementSelect,
  onRequirementUpdate,
  onRequirementDelete,
  canEdit = false,
  canDelete = false,
  showActions = true,
  expandAll = false
}: RequirementTreeProps) {
  const { toast } = useToast();
  const [treeData, setTreeData] = useState<RequirementTreeNode[]>([]);
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());
  const [selectedNode, setSelectedNode] = useState<string | null>(null);

  // 构建树形数据
  useEffect(() => {
    const tree = buildRequirementTree(requirements);
    setTreeData(tree);

    // 如果设置了全部展开
    if (expandAll) {
      const allNodeIds = new Set<string>();
      const collectNodeIds = (nodes: RequirementTreeNode[]) => {
        nodes.forEach((node) => {
          allNodeIds.add(node.id);
          if (node.children.length > 0) {
            collectNodeIds(node.children);
          }
        });
      };
      collectNodeIds(tree);
      setExpandedNodes(allNodeIds);
    }
  }, [requirements, expandAll]);

  // 切换节点展开状态
  const toggleNode = (nodeId: string) => {
    setExpandedNodes((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(nodeId)) {
        newSet.delete(nodeId);
      } else {
        newSet.add(nodeId);
      }
      return newSet;
    });
  };

  // 选择节点
  const selectNode = (requirement: Requirement) => {
    setSelectedNode(requirement.id);
    if (onRequirementSelect) {
      onRequirementSelect(requirement);
    }
  };

  // 处理删除
  const handleDelete = async (requirementId: string) => {
    if (onRequirementDelete) {
      try {
        await onRequirementDelete(requirementId);
        toast({
          title: '删除成功',
          description: '需求已成功删除'
        });
      } catch (error) {
        toast({
          title: '删除失败',
          description: '删除需求时发生错误',
          variant: 'destructive'
        });
      }
    }
  };

  // 渲染需求节点
  const renderRequirementNode = (
    node: RequirementTreeNode,
    level: number = 0
  ) => {
    const requirement = node.requirement;
    const hasChildren = node.children.length > 0;
    const isExpanded = expandedNodes.has(node.id);
    const isSelected = selectedNode === node.id;

    const priorityConfig = getRequirementPriorityConfig(requirement.priority);
    const statusConfig = getRequirementStatusConfig(requirement.status);
    const typeConfig = getRequirementTypeConfig(requirement.type);
    const complexityConfig = getRequirementComplexityConfig(
      requirement.complexity
    );

    return (
      <div key={node.id} className='w-full'>
        <Collapsible open={isExpanded} onOpenChange={() => toggleNode(node.id)}>
          <div
            className={`group hover:bg-muted/50 flex cursor-pointer items-center gap-2 rounded-md p-2 transition-colors ${
              isSelected ? 'bg-primary/10 border-primary/20 border' : ''
            }`}
            style={{ paddingLeft: `${level * 24 + 8}px` }}
            onClick={() => selectNode(requirement)}
          >
            {/* 展开/收起按钮 */}
            <div className='flex h-4 w-4 items-center justify-center'>
              {hasChildren ? (
                <CollapsibleTrigger asChild>
                  <Button
                    variant='ghost'
                    size='sm'
                    className='h-4 w-4 p-0 hover:bg-transparent'
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleNode(node.id);
                    }}
                  >
                    {isExpanded ? (
                      <ChevronDownIcon className='h-3 w-3' />
                    ) : (
                      <ChevronRightIcon className='h-3 w-3' />
                    )}
                  </Button>
                </CollapsibleTrigger>
              ) : (
                <div className='h-3 w-3' />
              )}
            </div>

            {/* 图标 */}
            <div className='flex h-4 w-4 items-center justify-center'>
              {hasChildren ? (
                <FolderIcon className='h-4 w-4 text-blue-500' />
              ) : (
                <FileTextIcon className='h-4 w-4 text-gray-500' />
              )}
            </div>

            {/* 需求信息 */}
            <div className='flex min-w-0 flex-1 items-center gap-2'>
              <span className='text-muted-foreground font-mono text-xs'>
                {requirement.requirementId}
              </span>
              <span className='truncate font-medium'>{requirement.title}</span>
            </div>

            {/* 状态和优先级徽章 */}
            <div className='flex items-center gap-1'>
              <Badge
                variant='outline'
                className={`text-xs ${statusConfig.bgColor} ${statusConfig.textColor} ${statusConfig.borderColor}`}
              >
                {statusConfig.label}
              </Badge>
              <Badge
                variant='outline'
                className={`text-xs ${priorityConfig.bgColor} ${priorityConfig.textColor} ${priorityConfig.borderColor}`}
              >
                {priorityConfig.label}
              </Badge>
            </div>

            {/* 分配人 */}
            <div className='flex min-w-0 items-center gap-1'>
              {requirement.assignedTo ? (
                <>
                  <Avatar className='h-5 w-5'>
                    <AvatarImage
                      src={requirement.assignedTo.image || ''}
                      alt={requirement.assignedTo.name || ''}
                    />
                    <AvatarFallback className='text-xs'>
                      {requirement.assignedTo.name?.charAt(0) ||
                        requirement.assignedTo.email.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <span className='max-w-[60px] truncate text-xs'>
                    {requirement.assignedTo.name ||
                      requirement.assignedTo.email}
                  </span>
                </>
              ) : (
                <span className='text-muted-foreground text-xs'>未分配</span>
              )}
            </div>

            {/* 创建时间 */}
            <span className='text-muted-foreground min-w-[60px] text-xs'>
              {format(new Date(requirement.createdAt), 'MM-dd', {
                locale: zhCN
              })}
            </span>

            {/* 操作菜单 */}
            {showActions && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant='ghost'
                    className='h-6 w-6 p-0 opacity-0 transition-opacity group-hover:opacity-100'
                    onClick={(e) => e.stopPropagation()}
                  >
                    <MoreHorizontalIcon className='h-4 w-4' />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align='end'>
                  <DropdownMenuLabel>操作</DropdownMenuLabel>
                  <DropdownMenuItem asChild>
                    <Link
                      href={`/dashboard/projects/${projectId}/requirements/${requirement.id}`}
                    >
                      <EyeIcon className='mr-2 h-4 w-4' />
                      查看详情
                    </Link>
                  </DropdownMenuItem>
                  {canEdit && (
                    <DropdownMenuItem asChild>
                      <Link
                        href={`/dashboard/projects/${projectId}/requirements/${requirement.id}/edit`}
                      >
                        <EditIcon className='mr-2 h-4 w-4' />
                        编辑
                      </Link>
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuItem>
                    <PlusIcon className='mr-2 h-4 w-4' />
                    添加子需求
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  {canDelete && (
                    <DropdownMenuItem
                      className='text-destructive'
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(requirement.id);
                      }}
                    >
                      <TrashIcon className='mr-2 h-4 w-4' />
                      删除
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>

          {/* 子节点 */}
          {hasChildren && (
            <CollapsibleContent className='space-y-0'>
              {node.children.map((childNode) =>
                renderRequirementNode(childNode, level + 1)
              )}
            </CollapsibleContent>
          )}
        </Collapsible>
      </div>
    );
  };

  // 渲染详情面板
  const renderDetailPanel = () => {
    if (!selectedNode) {
      return (
        <Card className='h-full'>
          <CardContent className='flex h-full items-center justify-center'>
            <div className='text-muted-foreground text-center'>
              <FileTextIcon className='mx-auto mb-4 h-12 w-12 opacity-50' />
              <p>选择一个需求查看详情</p>
            </div>
          </CardContent>
        </Card>
      );
    }

    const selectedRequirement = requirements.find(
      (req) => req.id === selectedNode
    );
    if (!selectedRequirement) {
      return null;
    }

    const priorityConfig = getPriorityConfig(selectedRequirement.priority);
    const statusConfig = getStatusConfig(selectedRequirement.status);
    const typeConfig = getTypeConfig(selectedRequirement.type);
    const complexityConfig = getComplexityConfig(
      selectedRequirement.complexity
    );

    return (
      <Card className='h-full'>
        <CardHeader>
          <div className='flex items-start justify-between'>
            <div className='min-w-0 flex-1'>
              <div className='mb-2 flex items-center gap-2'>
                <span className='text-muted-foreground font-mono text-sm'>
                  {selectedRequirement.requirementId}
                </span>
                <Badge
                  variant='outline'
                  className={`text-xs ${statusConfig.bgColor} ${statusConfig.textColor} ${statusConfig.borderColor}`}
                >
                  {statusConfig.label}
                </Badge>
              </div>
              <CardTitle className='text-lg'>
                {selectedRequirement.title}
              </CardTitle>
              {selectedRequirement.description && (
                <CardDescription className='mt-2'>
                  {selectedRequirement.description}
                </CardDescription>
              )}
            </div>
            <div className='flex gap-2'>
              <Button variant='outline' size='sm' asChild>
                <Link
                  href={`/dashboard/projects/${projectId}/requirements/${selectedRequirement.id}`}
                >
                  <EyeIcon className='mr-2 h-4 w-4' />
                  查看详情
                </Link>
              </Button>
              {canEdit && (
                <Button variant='outline' size='sm' asChild>
                  <Link
                    href={`/dashboard/projects/${projectId}/requirements/${selectedRequirement.id}/edit`}
                  >
                    <EditIcon className='mr-2 h-4 w-4' />
                    编辑
                  </Link>
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className='space-y-4'>
          {/* 基本信息 */}
          <div className='grid grid-cols-2 gap-4'>
            <div>
              <label className='text-muted-foreground text-sm font-medium'>
                优先级
              </label>
              <div className='mt-1'>
                <Badge
                  variant='outline'
                  className={`${priorityConfig.bgColor} ${priorityConfig.textColor} ${priorityConfig.borderColor}`}
                >
                  {priorityConfig.label}
                </Badge>
              </div>
            </div>
            <div>
              <label className='text-muted-foreground text-sm font-medium'>
                类型
              </label>
              <div className='mt-1'>
                <Badge
                  variant='outline'
                  className={`${typeConfig.bgColor} ${typeConfig.textColor} ${typeConfig.borderColor}`}
                >
                  {typeConfig.label}
                </Badge>
              </div>
            </div>
            <div>
              <label className='text-muted-foreground text-sm font-medium'>
                复杂度
              </label>
              <div className='mt-1'>
                <Badge
                  variant='outline'
                  className={`${complexityConfig.bgColor} ${complexityConfig.textColor} ${complexityConfig.borderColor}`}
                >
                  {complexityConfig.label}
                </Badge>
              </div>
            </div>
            <div>
              <label className='text-muted-foreground text-sm font-medium'>
                分配人
              </label>
              <div className='mt-1'>
                {selectedRequirement.assignedTo ? (
                  <div className='flex items-center gap-2'>
                    <Avatar className='h-6 w-6'>
                      <AvatarImage
                        src={selectedRequirement.assignedTo.image || ''}
                        alt={selectedRequirement.assignedTo.name || ''}
                      />
                      <AvatarFallback className='text-xs'>
                        {selectedRequirement.assignedTo.name?.charAt(0) ||
                          selectedRequirement.assignedTo.email.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <span className='text-sm'>
                      {selectedRequirement.assignedTo.name ||
                        selectedRequirement.assignedTo.email}
                    </span>
                  </div>
                ) : (
                  <span className='text-muted-foreground text-sm'>未分配</span>
                )}
              </div>
            </div>
          </div>

          {/* 工作量信息 */}
          {(selectedRequirement.estimatedHours ||
            selectedRequirement.actualHours) && (
            <div>
              <label className='text-muted-foreground text-sm font-medium'>
                工作量
              </label>
              <div className='mt-2 space-y-2'>
                {selectedRequirement.estimatedHours && (
                  <div className='flex justify-between text-sm'>
                    <span>预估工时</span>
                    <span>{selectedRequirement.estimatedHours}h</span>
                  </div>
                )}
                {selectedRequirement.actualHours && (
                  <div className='flex justify-between text-sm'>
                    <span>实际工时</span>
                    <span>{selectedRequirement.actualHours}h</span>
                  </div>
                )}
                {selectedRequirement.estimatedHours &&
                  selectedRequirement.actualHours && (
                    <div className='bg-muted h-2 w-full rounded-full'>
                      <div
                        className='bg-primary h-2 rounded-full transition-all'
                        style={{
                          width: `${Math.min(100, (selectedRequirement.actualHours / selectedRequirement.estimatedHours) * 100)}%`
                        }}
                      />
                    </div>
                  )}
              </div>
            </div>
          )}

          {/* 验收标准 */}
          {selectedRequirement.acceptanceCriteria && (
            <div>
              <label className='text-muted-foreground text-sm font-medium'>
                验收标准
              </label>
              <div className='bg-muted/50 mt-1 rounded-md p-3 text-sm'>
                {selectedRequirement.acceptanceCriteria}
              </div>
            </div>
          )}

          {/* 商业价值 */}
          {selectedRequirement.businessValue && (
            <div>
              <label className='text-muted-foreground text-sm font-medium'>
                商业价值
              </label>
              <div className='bg-muted/50 mt-1 rounded-md p-3 text-sm'>
                {selectedRequirement.businessValue}
              </div>
            </div>
          )}

          {/* 时间信息 */}
          <div className='text-muted-foreground grid grid-cols-2 gap-4 text-sm'>
            <div>
              <span className='font-medium'>创建时间</span>
              <div>
                {format(
                  new Date(selectedRequirement.createdAt),
                  'yyyy-MM-dd HH:mm',
                  { locale: zhCN }
                )}
              </div>
            </div>
            <div>
              <span className='font-medium'>更新时间</span>
              <div>
                {format(
                  new Date(selectedRequirement.updatedAt),
                  'yyyy-MM-dd HH:mm',
                  { locale: zhCN }
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  if (loading) {
    return (
      <div className='grid h-full grid-cols-1 gap-6 lg:grid-cols-3'>
        <div className='space-y-2 lg:col-span-2'>
          {Array.from({ length: 8 }).map((_, index) => (
            <div key={index} className='flex items-center gap-2 p-2'>
              <Skeleton className='h-4 w-4' />
              <Skeleton className='h-4 w-4' />
              <Skeleton className='h-4 w-[100px]' />
              <Skeleton className='h-4 w-[200px]' />
              <Skeleton className='h-4 w-[80px]' />
              <Skeleton className='h-4 w-[80px]' />
            </div>
          ))}
        </div>
        <div className='lg:col-span-1'>
          <Card className='h-full'>
            <CardHeader>
              <Skeleton className='h-6 w-3/4' />
              <Skeleton className='h-4 w-full' />
            </CardHeader>
            <CardContent className='space-y-4'>
              <Skeleton className='h-4 w-full' />
              <Skeleton className='h-4 w-2/3' />
              <Skeleton className='h-20 w-full' />
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className='grid h-full grid-cols-1 gap-6 lg:grid-cols-3'>
      {/* 树形视图 */}
      <div className='lg:col-span-2'>
        <Card className='h-full'>
          <CardHeader>
            <div className='flex items-center justify-between'>
              <CardTitle>需求层级结构</CardTitle>
              <div className='flex gap-2'>
                <Button
                  variant='outline'
                  size='sm'
                  onClick={() => {
                    const allNodeIds = new Set<string>();
                    const collectNodeIds = (nodes: RequirementTreeNode[]) => {
                      nodes.forEach((node) => {
                        allNodeIds.add(node.id);
                        if (node.children.length > 0) {
                          collectNodeIds(node.children);
                        }
                      });
                    };
                    collectNodeIds(treeData);
                    setExpandedNodes(allNodeIds);
                  }}
                >
                  全部展开
                </Button>
                <Button
                  variant='outline'
                  size='sm'
                  onClick={() => setExpandedNodes(new Set())}
                >
                  全部收起
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className='p-0'>
            <div className='max-h-[600px] overflow-y-auto'>
              {treeData.length === 0 ? (
                <div className='text-muted-foreground flex h-32 items-center justify-center'>
                  暂无需求数据
                </div>
              ) : (
                <div className='space-y-0'>
                  {treeData.map((node) => renderRequirementNode(node))}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 详情面板 */}
      <div className='lg:col-span-1'>{renderDetailPanel()}</div>
    </div>
  );
}
