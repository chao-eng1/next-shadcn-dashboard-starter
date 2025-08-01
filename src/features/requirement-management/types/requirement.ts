import { User, Project, Task, Tag } from '@prisma/client';

// 需求优先级
export enum RequirementPriority {
  CRITICAL = 'CRITICAL',
  HIGH = 'HIGH',
  MEDIUM = 'MEDIUM',
  LOW = 'LOW'
}

// 需求状态
export enum RequirementStatus {
  DRAFT = 'DRAFT',
  REVIEW = 'REVIEW',
  APPROVED = 'APPROVED',
  IN_PROGRESS = 'IN_PROGRESS',
  TESTING = 'TESTING',
  COMPLETED = 'COMPLETED',
  REJECTED = 'REJECTED',
  CANCELLED = 'CANCELLED'
}

// 需求类型
export enum RequirementType {
  FUNCTIONAL = 'FUNCTIONAL',
  NON_FUNCTIONAL = 'NON_FUNCTIONAL',
  TECHNICAL = 'TECHNICAL',
  BUSINESS = 'BUSINESS',
  UI_UX = 'UI_UX'
}

// 需求复杂度
export enum RequirementComplexity {
  SIMPLE = 'SIMPLE',
  MEDIUM = 'MEDIUM',
  COMPLEX = 'COMPLEX',
  VERY_COMPLEX = 'VERY_COMPLEX'
}

// 基础需求类型
export interface Requirement {
  id: string;
  title: string;
  description?: string;
  acceptanceCriteria?: string;
  businessValue?: string;
  userStory?: string;
  priority: RequirementPriority;
  status: RequirementStatus;
  type: RequirementType;
  complexity: RequirementComplexity;
  estimatedEffort?: number;
  actualEffort?: number;
  projectId: string;
  createdById: string;
  assignedToId?: string;
  parentId?: string;
  currentVersion: number;
  dueDate?: Date;
  createdAt: Date;
  updatedAt: Date;
}

// 带关联数据的需求类型
export interface RequirementWithRelations extends Requirement {
  project: Project;
  createdBy: User;
  assignedTo?: User;
  parent?: Requirement;
  children: Requirement[];
  tasks: RequirementTaskWithTask[];
  versions: RequirementVersion[];
  comments: RequirementCommentWithUser[];
  attachments: RequirementAttachment[];
  tags: RequirementTagWithTag[];
}

// 需求版本
export interface RequirementVersion {
  id: string;
  requirementId: string;
  versionNumber: number;
  title: string;
  description?: string;
  acceptanceCriteria?: string;
  businessValue?: string;
  changeReason?: string;
  createdById: string;
  createdAt: Date;
}

// 带用户信息的需求版本
export interface RequirementVersionWithUser extends RequirementVersion {
  createdBy: User;
}

// 需求任务关联
export interface RequirementTask {
  id: string;
  requirementId: string;
  taskId: string;
  createdAt: Date;
}

// 带任务信息的需求任务关联
export interface RequirementTaskWithTask extends RequirementTask {
  task: Task;
}

// 需求评论
export interface RequirementComment {
  id: string;
  content: string;
  requirementId: string;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
}

// 带用户信息的需求评论
export interface RequirementCommentWithUser extends RequirementComment {
  user: User;
}

// 需求附件
export interface RequirementAttachment {
  id: string;
  filename: string;
  filepath: string;
  mimetype: string;
  size: number;
  requirementId: string;
  uploaderId: string;
  createdAt: Date;
}

// 带用户信息的需求附件
export interface RequirementAttachmentWithUser extends RequirementAttachment {
  uploader: User;
}

// 需求标签
export interface RequirementTag {
  id: string;
  requirementId: string;
  tagId: string;
  createdAt: Date;
}

// 带标签信息的需求标签
export interface RequirementTagWithTag extends RequirementTag {
  tag: Tag;
}

// 需求创建表单数据
export interface CreateRequirementData {
  title: string;
  description?: string;
  acceptanceCriteria?: string;
  businessValue?: string;
  userStory?: string;
  priority: RequirementPriority;
  type: RequirementType;
  complexity: RequirementComplexity;
  estimatedEffort?: number;
  assignedToId?: string;
  parentId?: string;
  dueDate?: Date;
  tagIds?: string[];
}

// 需求更新表单数据
export interface UpdateRequirementData extends Partial<CreateRequirementData> {
  status?: RequirementStatus;
  actualEffort?: number;
}

// 需求统计数据
export interface RequirementStats {
  total: number;
  byStatus: Record<RequirementStatus, number>;
  byPriority: Record<RequirementPriority, number>;
  byType: Record<RequirementType, number>;
  byComplexity: Record<RequirementComplexity, number>;
  completionRate: number;
  averageEffort: number;
}

// 需求过滤器
export interface RequirementFilters {
  status?: RequirementStatus[];
  priority?: RequirementPriority[];
  type?: RequirementType[];
  complexity?: RequirementComplexity[];
  assignedToId?: string;
  createdById?: string;
  parentId?: string;
  search?: string;
  tagIds?: string[];
  dueDateFrom?: Date;
  dueDateTo?: Date;
}

// 需求排序选项
export interface RequirementSortOptions {
  field: 'title' | 'priority' | 'status' | 'createdAt' | 'updatedAt' | 'dueDate';
  direction: 'asc' | 'desc';
}

// API响应类型
export interface RequirementListResponse {
  requirements: RequirementWithRelations[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// 需求看板列
export interface RequirementKanbanColumn {
  status: RequirementStatus;
  title: string;
  requirements: RequirementWithRelations[];
  count: number;
}

// 需求层级树节点
export interface RequirementTreeNode extends RequirementWithRelations {
  level: number;
  isExpanded?: boolean;
  hasChildren: boolean;
}

// 需求变更历史
export interface RequirementChangeHistory {
  id: string;
  requirementId: string;
  field: string;
  oldValue: any;
  newValue: any;
  changedById: string;
  changedBy: User;
  changeReason?: string;
  createdAt: Date;
}

// 需求模板
export interface RequirementTemplate {
  id: string;
  name: string;
  description?: string;
  type: RequirementType;
  titleTemplate: string;
  descriptionTemplate?: string;
  acceptanceCriteriaTemplate?: string;
  businessValueTemplate?: string;
  userStoryTemplate?: string;
  defaultPriority: RequirementPriority;
  defaultComplexity: RequirementComplexity;
  createdById: string;
  projectId?: string;
  isGlobal: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// 需求导入/导出数据
export interface RequirementExportData {
  requirements: RequirementWithRelations[];
  exportedAt: Date;
  exportedBy: User;
  projectId: string;
  filters?: RequirementFilters;
}

export interface RequirementImportData {
  title: string;
  description?: string;
  acceptanceCriteria?: string;
  businessValue?: string;
  userStory?: string;
  priority: string;
  type: string;
  complexity: string;
  estimatedEffort?: number;
  assignedToEmail?: string;
  parentTitle?: string;
  tags?: string[];
  dueDate?: string;
}

// 需求依赖关系
export interface RequirementDependency {
  id: string;
  sourceRequirementId: string;
  targetRequirementId: string;
  dependencyType: 'BLOCKS' | 'DEPENDS_ON' | 'RELATES_TO';
  description?: string;
  createdAt: Date;
}

// 需求进度跟踪
export interface RequirementProgress {
  requirementId: string;
  totalTasks: number;
  completedTasks: number;
  inProgressTasks: number;
  blockedTasks: number;
  progressPercentage: number;
  estimatedCompletion?: Date;
  actualCompletion?: Date;
}