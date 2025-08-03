import { z } from 'zod';
import {
  RequirementPriority,
  RequirementStatus,
  RequirementType,
  RequirementComplexity
} from '../types/requirement';

// 需求优先级验证
export const requirementPrioritySchema = z.nativeEnum(RequirementPriority);

// 需求状态验证
export const requirementStatusSchema = z.nativeEnum(RequirementStatus);

// 需求类型验证
export const requirementTypeSchema = z.nativeEnum(RequirementType);

// 需求复杂度验证
export const requirementComplexitySchema = z.nativeEnum(RequirementComplexity);

// 创建需求验证模式
export const createRequirementSchema = z.object({
  title: z
    .string()
    .min(1, '需求标题不能为空')
    .max(200, '需求标题不能超过200个字符'),
  description: z.string().max(5000, '需求描述不能超过5000个字符').optional(),
  acceptanceCriteria: z
    .string()
    .max(3000, '验收标准不能超过3000个字符')
    .optional(),
  businessValue: z
    .string()
    .max(2000, '业务价值描述不能超过2000个字符')
    .optional(),
  userStory: z.string().max(1000, '用户故事不能超过1000个字符').optional(),
  priority: requirementPrioritySchema.default(RequirementPriority.MEDIUM),
  type: requirementTypeSchema.default(RequirementType.FUNCTIONAL),
  complexity: requirementComplexitySchema.default(RequirementComplexity.MEDIUM),
  estimatedEffort: z
    .number()
    .min(0, '预估工作量不能为负数')
    .max(1000, '预估工作量不能超过1000人天')
    .optional(),
  assignedToId: z.string().cuid().optional(),
  parentId: z.string().cuid().optional(),
  dueDate: z
    .string()
    .datetime()
    .transform((val) => new Date(val))
    .optional(),
  tagIds: z.array(z.string().cuid()).optional()
});

// 更新需求验证模式
export const updateRequirementSchema = createRequirementSchema
  .partial()
  .extend({
    status: requirementStatusSchema.optional(),
    actualEffort: z
      .number()
      .min(0, '实际工作量不能为负数')
      .max(1000, '实际工作量不能超过1000人天')
      .optional()
  });

// 需求过滤器验证模式
export const requirementFiltersSchema = z.object({
  status: z.array(requirementStatusSchema).optional(),
  priority: z.array(requirementPrioritySchema).optional(),
  type: z.array(requirementTypeSchema).optional(),
  complexity: z.array(requirementComplexitySchema).optional(),
  assignedToId: z.string().cuid().optional(),
  createdById: z.string().cuid().optional(),
  parentId: z.string().cuid().optional(),
  search: z.string().max(100, '搜索关键词不能超过100个字符').optional(),
  tagIds: z.array(z.string().cuid()).optional(),
  dueDateFrom: z
    .string()
    .datetime()
    .transform((val) => new Date(val))
    .optional(),
  dueDateTo: z
    .string()
    .datetime()
    .transform((val) => new Date(val))
    .optional()
});

// 需求排序验证模式
export const requirementSortSchema = z.object({
  field: z.enum([
    'title',
    'priority',
    'status',
    'createdAt',
    'updatedAt',
    'dueDate'
  ]),
  direction: z.enum(['asc', 'desc'])
});

// 需求分页验证模式
export const requirementPaginationSchema = z.object({
  page: z
    .string()
    .transform((val) => parseInt(val, 10))
    .pipe(z.number().min(1, '页码必须大于0'))
    .default('1'),
  limit: z
    .string()
    .transform((val) => parseInt(val, 10))
    .pipe(
      z.number().min(1, '每页数量必须大于0').max(100, '每页数量不能超过100')
    )
    .default('20')
});

// 需求评论验证模式
export const requirementCommentSchema = z.object({
  content: z
    .string()
    .min(1, '评论内容不能为空')
    .max(2000, '评论内容不能超过2000个字符')
});

// 需求版本验证模式
export const requirementVersionSchema = z.object({
  title: z
    .string()
    .min(1, '需求标题不能为空')
    .max(200, '需求标题不能超过200个字符'),
  description: z.string().max(5000, '需求描述不能超过5000个字符').optional(),
  acceptanceCriteria: z
    .string()
    .max(3000, '验收标准不能超过3000个字符')
    .optional(),
  businessValue: z
    .string()
    .max(2000, '业务价值描述不能超过2000个字符')
    .optional(),
  changeReason: z
    .string()
    .min(1, '变更原因不能为空')
    .max(500, '变更原因不能超过500个字符')
});

// 需求任务关联验证模式
export const requirementTaskSchema = z.object({
  taskIds: z.array(z.string().cuid()).min(1, '至少选择一个任务')
});

// 需求附件验证模式
export const requirementAttachmentSchema = z.object({
  filename: z
    .string()
    .min(1, '文件名不能为空')
    .max(255, '文件名不能超过255个字符'),
  mimetype: z.string().min(1, '文件类型不能为空'),
  size: z
    .number()
    .min(1, '文件大小必须大于0')
    .max(50 * 1024 * 1024, '文件大小不能超过50MB') // 50MB
});

// 需求模板验证模式
export const requirementTemplateSchema = z.object({
  name: z
    .string()
    .min(1, '模板名称不能为空')
    .max(100, '模板名称不能超过100个字符'),
  description: z.string().max(500, '模板描述不能超过500个字符').optional(),
  type: requirementTypeSchema,
  titleTemplate: z
    .string()
    .min(1, '标题模板不能为空')
    .max(200, '标题模板不能超过200个字符'),
  descriptionTemplate: z
    .string()
    .max(5000, '描述模板不能超过5000个字符')
    .optional(),
  acceptanceCriteriaTemplate: z
    .string()
    .max(3000, '验收标准模板不能超过3000个字符')
    .optional(),
  businessValueTemplate: z
    .string()
    .max(2000, '业务价值模板不能超过2000个字符')
    .optional(),
  userStoryTemplate: z
    .string()
    .max(1000, '用户故事模板不能超过1000个字符')
    .optional(),
  defaultPriority: requirementPrioritySchema,
  defaultComplexity: requirementComplexitySchema,
  isGlobal: z.boolean().default(false)
});

// 需求导入验证模式
export const requirementImportSchema = z.object({
  title: z
    .string()
    .min(1, '需求标题不能为空')
    .max(200, '需求标题不能超过200个字符'),
  description: z.string().max(5000, '需求描述不能超过5000个字符').optional(),
  acceptanceCriteria: z
    .string()
    .max(3000, '验收标准不能超过3000个字符')
    .optional(),
  businessValue: z
    .string()
    .max(2000, '业务价值描述不能超过2000个字符')
    .optional(),
  userStory: z.string().max(1000, '用户故事不能超过1000个字符').optional(),
  priority: z.string().transform((val) => {
    const upperVal = val.toUpperCase();
    if (
      Object.values(RequirementPriority).includes(
        upperVal as RequirementPriority
      )
    ) {
      return upperVal as RequirementPriority;
    }
    return RequirementPriority.MEDIUM;
  }),
  type: z.string().transform((val) => {
    const upperVal = val.toUpperCase();
    if (Object.values(RequirementType).includes(upperVal as RequirementType)) {
      return upperVal as RequirementType;
    }
    return RequirementType.FUNCTIONAL;
  }),
  complexity: z.string().transform((val) => {
    const upperVal = val.toUpperCase();
    if (
      Object.values(RequirementComplexity).includes(
        upperVal as RequirementComplexity
      )
    ) {
      return upperVal as RequirementComplexity;
    }
    return RequirementComplexity.MEDIUM;
  }),
  estimatedEffort: z
    .string()
    .transform((val) => {
      const num = parseFloat(val);
      return isNaN(num) ? undefined : num;
    })
    .optional(),
  assignedToEmail: z.string().email().optional(),
  parentTitle: z.string().optional(),
  tags: z.array(z.string()).optional(),
  dueDate: z
    .string()
    .transform((val) => {
      const date = new Date(val);
      return isNaN(date.getTime()) ? undefined : date;
    })
    .optional()
});

// 需求依赖验证模式
export const requirementDependencySchema = z.object({
  targetRequirementId: z.string().cuid(),
  dependencyType: z.enum(['BLOCKS', 'DEPENDS_ON', 'RELATES_TO']),
  description: z.string().max(500, '依赖描述不能超过500个字符').optional()
});

// 需求状态变更验证模式
export const requirementStatusChangeSchema = z.object({
  status: requirementStatusSchema,
  comment: z.string().max(500, '状态变更备注不能超过500个字符').optional()
});

// 批量操作验证模式
export const batchRequirementOperationSchema = z.object({
  requirementIds: z.array(z.string().cuid()).min(1, '至少选择一个需求'),
  operation: z.enum([
    'delete',
    'updateStatus',
    'updatePriority',
    'updateAssignee'
  ]),
  data: z.record(z.any()).optional()
});

// 需求搜索验证模式
export const requirementSearchSchema = z.object({
  query: z
    .string()
    .min(1, '搜索关键词不能为空')
    .max(100, '搜索关键词不能超过100个字符'),
  fields: z
    .array(
      z.enum([
        'title',
        'description',
        'acceptanceCriteria',
        'businessValue',
        'userStory'
      ])
    )
    .default(['title', 'description']),
  projectId: z.string().cuid().optional()
});

// 导出类型
export type CreateRequirementInput = z.infer<typeof createRequirementSchema>;
export type UpdateRequirementInput = z.infer<typeof updateRequirementSchema>;
export type RequirementFiltersInput = z.infer<typeof requirementFiltersSchema>;
export type RequirementSortInput = z.infer<typeof requirementSortSchema>;
export type RequirementPaginationInput = z.infer<
  typeof requirementPaginationSchema
>;
export type RequirementCommentInput = z.infer<typeof requirementCommentSchema>;
export type RequirementVersionInput = z.infer<typeof requirementVersionSchema>;
export type RequirementTaskInput = z.infer<typeof requirementTaskSchema>;
export type RequirementAttachmentInput = z.infer<
  typeof requirementAttachmentSchema
>;
export type RequirementTemplateInput = z.infer<
  typeof requirementTemplateSchema
>;
export type RequirementImportInput = z.infer<typeof requirementImportSchema>;
export type RequirementDependencyInput = z.infer<
  typeof requirementDependencySchema
>;
export type RequirementStatusChangeInput = z.infer<
  typeof requirementStatusChangeSchema
>;
export type BatchRequirementOperationInput = z.infer<
  typeof batchRequirementOperationSchema
>;
export type RequirementSearchInput = z.infer<typeof requirementSearchSchema>;
