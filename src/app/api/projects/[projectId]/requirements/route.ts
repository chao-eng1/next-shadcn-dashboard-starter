import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/get-current-user';
import {
  apiResponse,
  apiError,
  apiUnauthorized,
  apiNotFound,
  apiForbidden,
  apiValidationError
} from '@/lib/api-response';
import { isProjectMember } from '@/features/project-management/utils/project-auth';
import {
  createRequirementSchema,
  requirementFiltersSchema,
  requirementSortSchema,
  requirementPaginationSchema
} from '@/features/requirement-management/schemas/requirement-schema';
import {
  RequirementStatus,
  RequirementPriority,
  RequirementType,
  RequirementComplexity
} from '@/features/requirement-management/types/requirement';
import {
  canViewRequirements,
  canCreateRequirement
} from '@/features/requirement-management/utils/requirement-permissions';

// 生成需求ID的函数
async function generateRequirementId(projectId: string): Promise<string> {
  const count = await prisma.requirement.count({
    where: { projectId }
  });
  return `REQ-${String(count + 1).padStart(4, '0')}`;
}

// 获取项目需求列表
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return apiUnauthorized();
    }

    const { projectId } = await params;

    // 检查用户是否有查看需求的权限
    const hasViewPermission = await canViewRequirements(projectId, user.id);
    if (!hasViewPermission) {
      return apiForbidden('您没有权限查看此项目的需求');
    }

    // 解析查询参数
    const { searchParams } = new URL(request.url);

    // 分页参数
    const paginationResult = requirementPaginationSchema.safeParse({
      page: searchParams.get('page') || '1',
      limit: searchParams.get('limit') || '20'
    });

    if (!paginationResult.success) {
      return apiValidationError(paginationResult.error.errors);
    }

    const { page, limit } = paginationResult.data;
    const skip = (page - 1) * limit;

    // 过滤参数
    const filtersResult = requirementFiltersSchema.safeParse({
      status: searchParams.get('status')?.split(',') as RequirementStatus[],
      priority: searchParams
        .get('priority')
        ?.split(',') as RequirementPriority[],
      type: searchParams.get('type')?.split(',') as RequirementType[],
      complexity: searchParams
        .get('complexity')
        ?.split(',') as RequirementComplexity[],
      assignedToId: searchParams.get('assignedToId') || undefined,
      createdById: searchParams.get('createdById') || undefined,
      parentId: searchParams.get('parentId') || undefined,
      search: searchParams.get('search') || undefined,
      tagIds: searchParams.get('tagIds')?.split(',') || undefined
    });

    if (!filtersResult.success) {
      return apiValidationError(filtersResult.error.errors);
    }

    const filters = filtersResult.data;

    // 排序参数
    const sortResult = requirementSortSchema.safeParse({
      field: searchParams.get('sortField') || 'createdAt',
      direction: searchParams.get('sortDirection') || 'desc'
    });

    if (!sortResult.success) {
      return apiValidationError(sortResult.error.errors);
    }

    const { field, direction } = sortResult.data;

    // 构建查询条件
    const where: any = {
      projectId
    };

    // 应用过滤条件
    if (filters.status && filters.status.length > 0) {
      where.status = { in: filters.status };
    }

    if (filters.priority && filters.priority.length > 0) {
      where.priority = { in: filters.priority };
    }

    if (filters.type && filters.type.length > 0) {
      where.type = { in: filters.type };
    }

    if (filters.complexity && filters.complexity.length > 0) {
      where.complexity = { in: filters.complexity };
    }

    if (filters.assignedToId) {
      where.assignedToId = filters.assignedToId;
    }

    if (filters.createdById) {
      where.createdById = filters.createdById;
    }

    if (filters.parentId !== undefined) {
      where.parentId = filters.parentId || null;
    }

    if (filters.search) {
      where.OR = [
        { title: { contains: filters.search, mode: 'insensitive' } },
        { description: { contains: filters.search, mode: 'insensitive' } },
        {
          acceptanceCriteria: { contains: filters.search, mode: 'insensitive' }
        },
        { businessValue: { contains: filters.search, mode: 'insensitive' } },
        { userStory: { contains: filters.search, mode: 'insensitive' } }
      ];
    }

    if (filters.tagIds && filters.tagIds.length > 0) {
      where.tags = {
        some: {
          tagId: { in: filters.tagIds }
        }
      };
    }

    // 构建排序条件
    const orderBy: any = {};
    orderBy[field] = direction;

    // 查询需求总数
    const total = await prisma.requirement.count({ where });

    // 查询需求列表
    const requirements = await prisma.requirement.findMany({
      where,
      include: {
        project: true,
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true
          }
        },
        assignedTo: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true
          }
        },
        parent: {
          select: {
            id: true,
            title: true,
            status: true
          }
        },
        children: {
          select: {
            id: true,
            title: true,
            status: true,
            priority: true
          }
        },
        tasks: {
          include: {
            task: {
              select: {
                id: true,
                title: true,
                status: true,
                priority: true
              }
            }
          }
        },
        comments: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                image: true
              }
            }
          },
          orderBy: {
            createdAt: 'desc'
          },
          take: 3 // 只返回最新的3条评论
        },
        attachments: {
          include: {
            uploader: {
              select: {
                id: true,
                name: true,
                email: true
              }
            }
          }
        },
        tags: {
          include: {
            tag: true
          }
        },
        _count: {
          select: {
            comments: true,
            attachments: true,
            versions: true
          }
        }
      },
      orderBy,
      skip,
      take: limit
    });

    // 计算总页数
    const totalPages = Math.ceil(total / limit);

    return apiResponse({
      requirements,
      pagination: {
        total,
        page,
        limit,
        totalPages
      }
    });
  } catch (error) {
    console.error('获取需求列表失败:', error);
    return apiError('获取需求列表失败');
  }
}

// 创建新需求
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return apiUnauthorized();
    }

    const { projectId } = await params;

    // 检查用户是否有创建需求的权限
    const hasCreatePermission = await canCreateRequirement(projectId, user.id);
    if (!hasCreatePermission) {
      return apiForbidden('您没有权限在此项目中创建需求');
    }

    // 验证项目是否存在
    const project = await prisma.project.findUnique({
      where: { id: projectId }
    });

    if (!project) {
      return apiNotFound('项目');
    }

    // 解析请求体
    const body = await request.json();

    // 验证请求数据
    const validationResult = createRequirementSchema.safeParse(body);
    if (!validationResult.success) {
      return apiValidationError(validationResult.error.errors);
    }

    const data = validationResult.data;

    // 如果指定了父需求，验证父需求是否存在且属于同一项目
    if (data.parentId) {
      const parentRequirement = await prisma.requirement.findUnique({
        where: { id: data.parentId }
      });

      if (!parentRequirement || parentRequirement.projectId !== projectId) {
        return apiValidationError([
          { message: '指定的父需求不存在或不属于当前项目' }
        ]);
      }
    }

    // 如果指定了分配人，验证分配人是否为项目成员
    if (data.assignedToId) {
      const isAssigneeMember = await isProjectMember(
        projectId,
        data.assignedToId
      );
      if (!isAssigneeMember) {
        return apiValidationError([{ message: '指定的分配人不是项目成员' }]);
      }
    }

    // 生成需求ID
    const requirementId = await generateRequirementId(projectId);

    // 创建需求
    const requirement = await prisma.requirement.create({
      data: {
        ...data,
        requirementId,
        projectId,
        createdById: user.id
      },
      include: {
        project: true,
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true
          }
        },
        assignedTo: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true
          }
        },
        parent: {
          select: {
            id: true,
            title: true,
            status: true
          }
        },
        children: true,
        tasks: {
          include: {
            task: true
          }
        },
        comments: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                image: true
              }
            }
          }
        },
        attachments: {
          include: {
            uploader: {
              select: {
                id: true,
                name: true,
                email: true
              }
            }
          }
        },
        tags: {
          include: {
            tag: true
          }
        },
        versions: true
      }
    });

    // 如果指定了标签，创建标签关联
    if (data.tagIds && data.tagIds.length > 0) {
      await prisma.requirementTag.createMany({
        data: data.tagIds.map((tagId) => ({
          requirementId: requirement.id,
          tagId
        }))
      });
    }

    // 创建初始版本
    await prisma.requirementVersion.create({
      data: {
        requirementId: requirement.id,
        versionNumber: 1,
        title: requirement.title,
        description: requirement.description,
        acceptanceCriteria: requirement.acceptanceCriteria,
        businessValue: requirement.businessValue,
        createdById: user.id
      }
    });

    return apiResponse(requirement, { status: 201 });
  } catch (error) {
    console.error('创建需求失败:', error);
    return apiError('创建需求失败');
  }
}
