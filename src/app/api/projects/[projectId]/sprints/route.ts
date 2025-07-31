import { NextRequest } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/get-current-user';
import {
  apiResponse,
  apiError,
  apiUnauthorized,
  apiForbidden
} from '@/lib/api-response';
import { hasProjectPermission } from '@/lib/permissions';

// 创建迭代请求验证
const createSprintSchema = z.object({
  name: z.string().min(1, '迭代名称不能为空'),
  description: z.string().optional(),
  status: z
    .enum(['PLANNED', 'ACTIVE', 'COMPLETED', 'CANCELLED'])
    .default('PLANNED'),
  startDate: z.string().datetime().optional().nullable(),
  endDate: z.string().datetime().optional().nullable(),
  goal: z.string().optional()
});

// 查询参数验证
const getSprintsQuerySchema = z.object({
  status: z.enum(['PLANNED', 'ACTIVE', 'COMPLETED', 'CANCELLED']).optional(),
  search: z.string().optional(),
  limit: z.coerce.number().min(1).max(100).default(10),
  page: z.coerce.number().min(1).default(1),
  sortBy: z
    .enum(['name', 'createdAt', 'updatedAt', 'startDate', 'endDate'])
    .default('startDate'),
  sortOrder: z.enum(['asc', 'desc']).default('desc')
});

// 获取项目迭代列表
export async function GET(
  request: NextRequest,
  { params }: { params: { projectId: string } }
) {
  const user = await getCurrentUser();

  if (!user) {
    return apiUnauthorized();
  }

  const projectId = (await params).projectId;

  // 检查用户是否有查看项目的权限
  const hasPermission = await hasProjectPermission(
    projectId,
    'project.view',
    user.id
  );

  if (!hasPermission) {
    return apiForbidden('您没有权限查看此项目');
  }

  // 解析查询参数
  const { searchParams } = new URL(request.url);

  try {
    const query = getSprintsQuerySchema.parse({
      status: searchParams.get('status') || undefined,
      search: searchParams.get('search') || undefined,
      limit: searchParams.get('limit') || 10,
      page: searchParams.get('page') || 1,
      sortBy: searchParams.get('sortBy') || 'startDate',
      sortOrder: searchParams.get('sortOrder') || 'desc'
    });

    // 构建查询条件
    const where: any = { projectId };

    // 状态过滤
    if (query.status) {
      where.status = query.status;
    }

    // 搜索过滤
    if (query.search) {
      where.OR = [
        { name: { contains: query.search, mode: 'insensitive' } },
        { description: { contains: query.search, mode: 'insensitive' } },
        { goal: { contains: query.search, mode: 'insensitive' } }
      ];
    }

    // 分页和排序
    const skip = (query.page - 1) * query.limit;
    const take = query.limit;
    const orderBy = { [query.sortBy]: query.sortOrder };

    // 查询迭代总数
    const total = await prisma.sprint.count({ where });

    // 查询迭代列表
    const sprints = await prisma.sprint.findMany({
      where,
      orderBy,
      skip,
      take,
      include: {
        _count: {
          select: {
            tasks: true
          }
        }
      }
    });

    return apiResponse({
      sprints,
      pagination: {
        total,
        page: query.page,
        limit: query.limit,
        totalPages: Math.ceil(total / query.limit)
      }
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return apiError(
        'INVALID_PARAMETERS',
        '请求参数无效',
        error.format(),
        400
      );
    }

    console.error('获取迭代列表失败:', error);
    return apiError(
      'SERVER_ERROR',
      '获取迭代列表失败',
      process.env.NODE_ENV === 'development' ? error : undefined,
      500
    );
  }
}

// 创建迭代
export async function POST(
  request: NextRequest,
  { params }: { params: { projectId: string } }
) {
  const user = await getCurrentUser();

  if (!user) {
    return apiUnauthorized();
  }

  const projectId = (await params).projectId;

  // 检查用户是否有创建迭代的权限
  const hasPermission = await hasProjectPermission(
    projectId,
    'sprint.create',
    user.id
  );

  if (!hasPermission) {
    return apiForbidden('您没有权限在此项目中创建迭代');
  }

  try {
    const body = await request.json();

    // 验证请求数据
    const validated = createSprintSchema.parse(body);

    // 检查项目是否存在
    const project = await prisma.project.findUnique({
      where: { id: projectId }
    });

    if (!project) {
      return apiError('PROJECT_NOT_FOUND', '项目不存在', null, 404);
    }

    // 如果将新迭代设为活动状态，检查是否已有活动迭代
    if (validated.status === 'ACTIVE') {
      const activeSprintExists = await prisma.sprint.findFirst({
        where: {
          projectId,
          status: 'ACTIVE'
        }
      });

      if (activeSprintExists) {
        return apiError(
          'ACTIVE_SPRINT_EXISTS',
          '项目中已存在活动迭代，请先完成或取消现有活动迭代',
          null,
          400
        );
      }
    }

    // 创建迭代
    const sprint = await prisma.sprint.create({
      data: {
        name: validated.name,
        description: validated.description,
        status: validated.status,
        startDate: validated.startDate ? new Date(validated.startDate) : null,
        endDate: validated.endDate ? new Date(validated.endDate) : null,
        goal: validated.goal,
        projectId
      }
    });

    return apiResponse(sprint, null, 201);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return apiError(
        'INVALID_PARAMETERS',
        '请求参数无效',
        error.format(),
        400
      );
    }

    console.error('创建迭代失败:', error);
    return apiError(
      'SERVER_ERROR',
      '创建迭代失败',
      process.env.NODE_ENV === 'development' ? error : undefined,
      500
    );
  }
}
