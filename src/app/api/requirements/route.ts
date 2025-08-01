import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/get-current-user';
import {
  apiResponse,
  apiError,
  apiUnauthorized,
  apiValidationError
} from '@/lib/api-response';
import {
  RequirementStatus,
  RequirementPriority,
  RequirementType,
  RequirementComplexity
} from '@/features/requirement-management/types/requirement';
import { createRequirementSchema } from '@/features/requirement-management/schemas/requirement-schema';
import { z } from 'zod';

// 获取全局需求列表
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return apiUnauthorized();
    }

    // 解析查询参数
    const { searchParams } = new URL(request.url);
    
    // 分页参数
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const skip = (page - 1) * limit;

    // 过滤参数
    const status = searchParams.get('status')?.split(',') as RequirementStatus[];
    const priority = searchParams.get('priority')?.split(',') as RequirementPriority[];
    const type = searchParams.get('type')?.split(',') as RequirementType[];
    const complexity = searchParams.get('complexity')?.split(',') as RequirementComplexity[];
    const assignedToId = searchParams.get('assignedToId');
    const createdById = searchParams.get('createdById');
    const search = searchParams.get('search');
    const projectId = searchParams.get('projectId');

    // 排序参数
    const sortField = searchParams.get('sortField') || 'createdAt';
    const sortDirection = searchParams.get('sortDirection') || 'desc';

    // 构建查询条件
    const where: any = {};

    // 只显示用户有权限查看的需求（用户创建的或分配给用户的或用户参与的项目）
    where.OR = [
      { createdById: user.id },
      { assignedToId: user.id },
      {
        project: {
          OR: [
            { ownerId: user.id },
            {
              members: {
                some: {
                  userId: user.id
                }
              }
            }
          ]
        }
      }
    ];

    // 应用过滤条件
    if (status && status.length > 0) {
      where.status = { in: status };
    }
    
    if (priority && priority.length > 0) {
      where.priority = { in: priority };
    }
    
    if (type && type.length > 0) {
      where.type = { in: type };
    }
    
    if (complexity && complexity.length > 0) {
      where.complexity = { in: complexity };
    }
    
    if (assignedToId) {
      where.assignedToId = assignedToId;
    }
    
    if (createdById) {
      where.createdById = createdById;
    }
    
    if (projectId) {
      where.projectId = projectId;
    }
    
    if (search) {
      where.AND = where.AND || [];
      where.AND.push({
        OR: [
          { title: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } },
          { acceptanceCriteria: { contains: search, mode: 'insensitive' } },
          { businessValue: { contains: search, mode: 'insensitive' } },
          { userStory: { contains: search, mode: 'insensitive' } }
        ]
      });
    }

    // 构建排序条件
    const orderBy: any = {};
    orderBy[sortField] = sortDirection;

    // 查询需求总数
    const total = await prisma.requirement.count({ where });

    // 查询需求列表
    const requirements = await prisma.requirement.findMany({
      where,
      include: {
        project: {
          select: {
            id: true,
            name: true
          }
        },
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

// 创建全局需求
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return apiUnauthorized();
    }

    const body = await request.json();
    
    // 验证请求数据
    const validationResult = createRequirementSchema.safeParse(body);
    if (!validationResult.success) {
      return apiValidationError(validationResult.error.errors);
    }

    const data = validationResult.data;

    // 生成需求ID
    const count = await prisma.requirement.count();
    const requirementId = `REQ-${String(count + 1).padStart(4, '0')}`;

    // 创建需求
    const requirement = await prisma.requirement.create({
      data: {
        title: data.title,
        description: data.description,
        acceptanceCriteria: data.acceptanceCriteria,
        businessValue: data.businessValue,
        userStory: data.userStory,
        priority: data.priority || 'MEDIUM',
        status: 'DRAFT',
        type: data.type || 'FUNCTIONAL',
        complexity: data.complexity || 'MEDIUM',
        estimatedEffort: data.estimatedEffort,
        dueDate: data.dueDate,
        projectId: data.projectId,
        assignedToId: data.assignedToId,
        parentId: data.parentId,
        createdById: user.id
      },
      include: {
        project: {
          select: {
            id: true,
            name: true
          }
        },
        assignedTo: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        tags: {
          include: {
            tag: true
          }
        }
      }
    });

    // 处理标签关联
    if (data.tagIds && data.tagIds.length > 0) {
      await prisma.requirementTag.createMany({
        data: data.tagIds.map(tagId => ({
          requirementId: requirement.id,
          tagId
        })),
        skipDuplicates: true
      });
    }

    return apiResponse(requirement, '需求创建成功');
  } catch (error) {
    console.error('创建需求失败:', error);
    return apiError('创建需求失败');
  }
}