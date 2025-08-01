import { RequirementPriority, RequirementStatus, RequirementType, RequirementComplexity, RequirementWithRelations } from '../types/requirement';
import { cn } from '@/lib/utils';

// 需求优先级配置
export const REQUIREMENT_PRIORITY_CONFIG = {
  [RequirementPriority.CRITICAL]: {
    label: '关键',
    color: 'bg-red-100 text-red-800 border-red-200',
    badgeColor: 'bg-red-500',
    icon: '🔥',
    order: 4
  },
  [RequirementPriority.HIGH]: {
    label: '高',
    color: 'bg-orange-100 text-orange-800 border-orange-200',
    badgeColor: 'bg-orange-500',
    icon: '⬆️',
    order: 3
  },
  [RequirementPriority.MEDIUM]: {
    label: '中',
    color: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    badgeColor: 'bg-yellow-500',
    icon: '➡️',
    order: 2
  },
  [RequirementPriority.LOW]: {
    label: '低',
    color: 'bg-green-100 text-green-800 border-green-200',
    badgeColor: 'bg-green-500',
    icon: '⬇️',
    order: 1
  }
};

// 需求状态配置
export const REQUIREMENT_STATUS_CONFIG = {
  [RequirementStatus.DRAFT]: {
    label: '草稿',
    color: 'bg-gray-100 text-gray-800 border-gray-200',
    badgeColor: 'bg-gray-500',
    icon: '📝',
    order: 1
  },
  [RequirementStatus.REVIEW]: {
    label: '评审中',
    color: 'bg-blue-100 text-blue-800 border-blue-200',
    badgeColor: 'bg-blue-500',
    icon: '👀',
    order: 2
  },
  [RequirementStatus.APPROVED]: {
    label: '已批准',
    color: 'bg-green-100 text-green-800 border-green-200',
    badgeColor: 'bg-green-500',
    icon: '✅',
    order: 3
  },
  [RequirementStatus.IN_PROGRESS]: {
    label: '开发中',
    color: 'bg-purple-100 text-purple-800 border-purple-200',
    badgeColor: 'bg-purple-500',
    icon: '🚧',
    order: 4
  },
  [RequirementStatus.TESTING]: {
    label: '测试中',
    color: 'bg-indigo-100 text-indigo-800 border-indigo-200',
    badgeColor: 'bg-indigo-500',
    icon: '🧪',
    order: 5
  },
  [RequirementStatus.COMPLETED]: {
    label: '已完成',
    color: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    badgeColor: 'bg-emerald-500',
    icon: '🎉',
    order: 6
  },
  [RequirementStatus.REJECTED]: {
    label: '已拒绝',
    color: 'bg-red-100 text-red-800 border-red-200',
    badgeColor: 'bg-red-500',
    icon: '❌',
    order: 7
  },
  [RequirementStatus.CANCELLED]: {
    label: '已取消',
    color: 'bg-slate-100 text-slate-800 border-slate-200',
    badgeColor: 'bg-slate-500',
    icon: '🚫',
    order: 8
  }
};

// 需求类型配置
export const REQUIREMENT_TYPE_CONFIG = {
  [RequirementType.FUNCTIONAL]: {
    label: '功能性需求',
    color: 'bg-blue-100 text-blue-800 border-blue-200',
    icon: '⚙️',
    description: '描述系统应该做什么的需求'
  },
  [RequirementType.NON_FUNCTIONAL]: {
    label: '非功能性需求',
    color: 'bg-purple-100 text-purple-800 border-purple-200',
    icon: '📊',
    description: '描述系统性能、安全性等质量属性的需求'
  },
  [RequirementType.TECHNICAL]: {
    label: '技术需求',
    color: 'bg-green-100 text-green-800 border-green-200',
    icon: '🔧',
    description: '技术架构、开发工具等技术相关需求'
  },
  [RequirementType.BUSINESS]: {
    label: '业务需求',
    color: 'bg-orange-100 text-orange-800 border-orange-200',
    icon: '💼',
    description: '业务流程、业务规则等业务相关需求'
  },
  [RequirementType.UI_UX]: {
    label: '界面/用户体验',
    color: 'bg-pink-100 text-pink-800 border-pink-200',
    icon: '🎨',
    description: '用户界面设计和用户体验相关需求'
  }
};

// 需求复杂度配置
export const REQUIREMENT_COMPLEXITY_CONFIG = {
  [RequirementComplexity.SIMPLE]: {
    label: '简单',
    color: 'bg-green-100 text-green-800 border-green-200',
    icon: '🟢',
    estimatedDays: '1-3天',
    order: 1
  },
  [RequirementComplexity.MEDIUM]: {
    label: '中等',
    color: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    icon: '🟡',
    estimatedDays: '3-7天',
    order: 2
  },
  [RequirementComplexity.COMPLEX]: {
    label: '复杂',
    color: 'bg-orange-100 text-orange-800 border-orange-200',
    icon: '🟠',
    estimatedDays: '1-2周',
    order: 3
  },
  [RequirementComplexity.VERY_COMPLEX]: {
    label: '非常复杂',
    color: 'bg-red-100 text-red-800 border-red-200',
    icon: '🔴',
    estimatedDays: '2周以上',
    order: 4
  }
};

// 获取需求优先级配置
export function getRequirementPriorityConfig(priority: RequirementPriority) {
  return REQUIREMENT_PRIORITY_CONFIG[priority];
}

// 获取需求状态配置
export function getRequirementStatusConfig(status: RequirementStatus) {
  return REQUIREMENT_STATUS_CONFIG[status];
}

// 获取需求类型配置
export function getRequirementTypeConfig(type: RequirementType) {
  return REQUIREMENT_TYPE_CONFIG[type];
}

// 获取需求复杂度配置
export function getRequirementComplexityConfig(complexity: RequirementComplexity) {
  return REQUIREMENT_COMPLEXITY_CONFIG[complexity];
}

// 格式化需求优先级
export function formatRequirementPriority(priority: RequirementPriority): string {
  return REQUIREMENT_PRIORITY_CONFIG[priority]?.label || priority;
}

// 格式化需求状态
export function formatRequirementStatus(status: RequirementStatus): string {
  return REQUIREMENT_STATUS_CONFIG[status]?.label || status;
}

// 格式化需求类型
export function formatRequirementType(type: RequirementType): string {
  return REQUIREMENT_TYPE_CONFIG[type]?.label || type;
}

// 格式化需求复杂度
export function formatRequirementComplexity(complexity: RequirementComplexity): string {
  return REQUIREMENT_COMPLEXITY_CONFIG[complexity]?.label || complexity;
}

// 获取需求优先级样式类名
export function getRequirementPriorityClassName(priority: RequirementPriority, variant: 'default' | 'badge' = 'default'): string {
  const config = REQUIREMENT_PRIORITY_CONFIG[priority];
  if (!config) return '';
  
  if (variant === 'badge') {
    return cn('inline-flex items-center rounded-full px-2 py-1 text-xs font-medium', config.color);
  }
  
  return config.color;
}

// 获取需求状态样式类名
export function getRequirementStatusClassName(status: RequirementStatus, variant: 'default' | 'badge' = 'default'): string {
  const config = REQUIREMENT_STATUS_CONFIG[status];
  if (!config) return '';
  
  if (variant === 'badge') {
    return cn('inline-flex items-center rounded-full px-2 py-1 text-xs font-medium', config.color);
  }
  
  return config.color;
}

// 获取需求类型样式类名
export function getRequirementTypeClassName(type: RequirementType, variant: 'default' | 'badge' = 'default'): string {
  const config = REQUIREMENT_TYPE_CONFIG[type];
  if (!config) return '';
  
  if (variant === 'badge') {
    return cn('inline-flex items-center rounded-full px-2 py-1 text-xs font-medium', config.color);
  }
  
  return config.color;
}

// 获取需求复杂度样式类名
export function getRequirementComplexityClassName(complexity: RequirementComplexity, variant: 'default' | 'badge' = 'default'): string {
  const config = REQUIREMENT_COMPLEXITY_CONFIG[complexity];
  if (!config) return '';
  
  if (variant === 'badge') {
    return cn('inline-flex items-center rounded-full px-2 py-1 text-xs font-medium', config.color);
  }
  
  return config.color;
}

// 计算需求进度
export function calculateRequirementProgress(requirement: RequirementWithRelations): {
  totalTasks: number;
  completedTasks: number;
  inProgressTasks: number;
  progressPercentage: number;
} {
  const totalTasks = requirement.tasks.length;
  
  if (totalTasks === 0) {
    return {
      totalTasks: 0,
      completedTasks: 0,
      inProgressTasks: 0,
      progressPercentage: 0
    };
  }
  
  const completedTasks = requirement.tasks.filter(rt => rt.task.status === 'DONE').length;
  const inProgressTasks = requirement.tasks.filter(rt => rt.task.status === 'IN_PROGRESS').length;
  const progressPercentage = Math.round((completedTasks / totalTasks) * 100);
  
  return {
    totalTasks,
    completedTasks,
    inProgressTasks,
    progressPercentage
  };
}

// 检查需求是否可以删除
export function canDeleteRequirement(requirement: RequirementWithRelations): boolean {
  // 如果有子需求，不能删除
  if (requirement.children.length > 0) {
    return false;
  }
  
  // 如果有关联的任务，不能删除
  if (requirement.tasks.length > 0) {
    return false;
  }
  
  // 如果状态是已完成，不能删除
  if (requirement.status === RequirementStatus.COMPLETED) {
    return false;
  }
  
  return true;
}

// 检查需求是否可以编辑
export function canEditRequirement(requirement: RequirementWithRelations, userId: string): boolean {
  // 创建者可以编辑
  if (requirement.createdById === userId) {
    return true;
  }
  
  // 分配给的用户可以编辑
  if (requirement.assignedToId === userId) {
    return true;
  }
  
  // 已完成或已取消的需求不能编辑
  if ([RequirementStatus.COMPLETED, RequirementStatus.CANCELLED].includes(requirement.status)) {
    return false;
  }
  
  return false;
}

// 获取需求状态变更选项
export function getRequirementStatusTransitions(currentStatus: RequirementStatus): RequirementStatus[] {
  const transitions: Record<RequirementStatus, RequirementStatus[]> = {
    [RequirementStatus.DRAFT]: [RequirementStatus.REVIEW, RequirementStatus.CANCELLED],
    [RequirementStatus.REVIEW]: [RequirementStatus.APPROVED, RequirementStatus.REJECTED, RequirementStatus.DRAFT],
    [RequirementStatus.APPROVED]: [RequirementStatus.IN_PROGRESS, RequirementStatus.CANCELLED],
    [RequirementStatus.IN_PROGRESS]: [RequirementStatus.TESTING, RequirementStatus.APPROVED, RequirementStatus.CANCELLED],
    [RequirementStatus.TESTING]: [RequirementStatus.COMPLETED, RequirementStatus.IN_PROGRESS],
    [RequirementStatus.COMPLETED]: [], // 已完成的需求不能再变更状态
    [RequirementStatus.REJECTED]: [RequirementStatus.DRAFT],
    [RequirementStatus.CANCELLED]: [RequirementStatus.DRAFT]
  };
  
  return transitions[currentStatus] || [];
}

// 格式化工作量
export function formatEffort(effort?: number): string {
  if (!effort) return '-';
  
  if (effort < 1) {
    return `${Math.round(effort * 8)}小时`;
  }
  
  return `${effort}人天`;
}

// 格式化需求编号
export function formatRequirementId(requirement: RequirementWithRelations): string {
  const typePrefix = {
    [RequirementType.FUNCTIONAL]: 'FR',
    [RequirementType.NON_FUNCTIONAL]: 'NFR',
    [RequirementType.TECHNICAL]: 'TR',
    [RequirementType.BUSINESS]: 'BR',
    [RequirementType.UI_UX]: 'UR'
  };
  
  const prefix = typePrefix[requirement.type] || 'REQ';
  const shortId = requirement.id.slice(-6).toUpperCase();
  
  return `${prefix}-${shortId}`;
}

// 生成需求层级路径
export function generateRequirementPath(requirement: RequirementWithRelations, allRequirements: RequirementWithRelations[]): string[] {
  const path: string[] = [];
  let current: RequirementWithRelations | undefined = requirement;
  
  while (current) {
    path.unshift(current.title);
    current = current.parentId ? allRequirements.find(r => r.id === current!.parentId) : undefined;
  }
  
  return path;
}

// 构建需求树结构
export function buildRequirementTree(requirements: RequirementWithRelations[]): RequirementWithRelations[] {
  const requirementMap = new Map<string, RequirementWithRelations>();
  const rootRequirements: RequirementWithRelations[] = [];
  
  // 创建映射
  requirements.forEach(req => {
    requirementMap.set(req.id, { ...req, children: [] });
  });
  
  // 构建树结构
  requirements.forEach(req => {
    const requirement = requirementMap.get(req.id)!;
    
    if (req.parentId) {
      const parent = requirementMap.get(req.parentId);
      if (parent) {
        parent.children.push(requirement);
      } else {
        // 父需求不存在，作为根需求
        rootRequirements.push(requirement);
      }
    } else {
      rootRequirements.push(requirement);
    }
  });
  
  return rootRequirements;
}

// 扁平化需求树
export function flattenRequirementTree(requirements: RequirementWithRelations[], level = 0): Array<RequirementWithRelations & { level: number }> {
  const result: Array<RequirementWithRelations & { level: number }> = [];
  
  requirements.forEach(req => {
    result.push({ ...req, level });
    if (req.children.length > 0) {
      result.push(...flattenRequirementTree(req.children, level + 1));
    }
  });
  
  return result;
}

// 搜索需求
export function searchRequirements(
  requirements: RequirementWithRelations[],
  query: string,
  fields: string[] = ['title', 'description']
): RequirementWithRelations[] {
  if (!query.trim()) return requirements;
  
  const searchTerm = query.toLowerCase();
  
  return requirements.filter(req => {
    return fields.some(field => {
      const value = (req as any)[field];
      return value && typeof value === 'string' && value.toLowerCase().includes(searchTerm);
    });
  });
}

// 排序需求
export function sortRequirements(
  requirements: RequirementWithRelations[],
  field: string,
  direction: 'asc' | 'desc' = 'asc'
): RequirementWithRelations[] {
  return [...requirements].sort((a, b) => {
    let aValue = (a as any)[field];
    let bValue = (b as any)[field];
    
    // 处理特殊字段
    if (field === 'priority') {
      aValue = REQUIREMENT_PRIORITY_CONFIG[a.priority]?.order || 0;
      bValue = REQUIREMENT_PRIORITY_CONFIG[b.priority]?.order || 0;
    } else if (field === 'status') {
      aValue = REQUIREMENT_STATUS_CONFIG[a.status]?.order || 0;
      bValue = REQUIREMENT_STATUS_CONFIG[b.status]?.order || 0;
    } else if (field === 'complexity') {
      aValue = REQUIREMENT_COMPLEXITY_CONFIG[a.complexity]?.order || 0;
      bValue = REQUIREMENT_COMPLEXITY_CONFIG[b.complexity]?.order || 0;
    }
    
    // 处理日期
    if (aValue instanceof Date) aValue = aValue.getTime();
    if (bValue instanceof Date) bValue = bValue.getTime();
    
    // 处理空值
    if (aValue == null && bValue == null) return 0;
    if (aValue == null) return direction === 'asc' ? 1 : -1;
    if (bValue == null) return direction === 'asc' ? -1 : 1;
    
    // 比较
    if (aValue < bValue) return direction === 'asc' ? -1 : 1;
    if (aValue > bValue) return direction === 'asc' ? 1 : -1;
    return 0;
  });
}

// 过滤需求
export function filterRequirements(
  requirements: RequirementWithRelations[],
  filters: {
    status?: RequirementStatus[];
    priority?: RequirementPriority[];
    type?: RequirementType[];
    complexity?: RequirementComplexity[];
    assignedToId?: string;
    createdById?: string;
    parentId?: string;
    tagIds?: string[];
  }
): RequirementWithRelations[] {
  return requirements.filter(req => {
    // 状态过滤
    if (filters.status && filters.status.length > 0 && !filters.status.includes(req.status)) {
      return false;
    }
    
    // 优先级过滤
    if (filters.priority && filters.priority.length > 0 && !filters.priority.includes(req.priority)) {
      return false;
    }
    
    // 类型过滤
    if (filters.type && filters.type.length > 0 && !filters.type.includes(req.type)) {
      return false;
    }
    
    // 复杂度过滤
    if (filters.complexity && filters.complexity.length > 0 && !filters.complexity.includes(req.complexity)) {
      return false;
    }
    
    // 分配人过滤
    if (filters.assignedToId && req.assignedToId !== filters.assignedToId) {
      return false;
    }
    
    // 创建人过滤
    if (filters.createdById && req.createdById !== filters.createdById) {
      return false;
    }
    
    // 父需求过滤
    if (filters.parentId !== undefined && req.parentId !== filters.parentId) {
      return false;
    }
    
    // 标签过滤
    if (filters.tagIds && filters.tagIds.length > 0) {
      const reqTagIds = req.tags.map(rt => rt.tagId);
      const hasMatchingTag = filters.tagIds.some(tagId => reqTagIds.includes(tagId));
      if (!hasMatchingTag) {
        return false;
      }
    }
    
    return true;
  });
}

// 验证需求数据
export function validateRequirementData(data: any): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  if (!data.title || data.title.trim().length === 0) {
    errors.push('需求标题不能为空');
  }
  
  if (data.title && data.title.length > 200) {
    errors.push('需求标题不能超过200个字符');
  }
  
  if (data.description && data.description.length > 5000) {
    errors.push('需求描述不能超过5000个字符');
  }
  
  if (data.estimatedEffort && (data.estimatedEffort < 0 || data.estimatedEffort > 1000)) {
    errors.push('预估工作量必须在0-1000人天之间');
  }
  
  if (data.dueDate && new Date(data.dueDate) < new Date()) {
    errors.push('截止日期不能早于当前日期');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}