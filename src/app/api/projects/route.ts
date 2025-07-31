import { NextRequest } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/get-current-user';
import { apiResponse, apiError, apiUnauthorized } from '@/lib/api-response';
import { hasPermission } from '@/lib/permissions';

// 创建项目请求验证
const createProjectSchema = z.object({
  name: z.string().min(1, '项目名称不能为空'),
  description: z.string().optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  status: z
    .enum(['PLANNING', 'ACTIVE', 'COMPLETED', 'ARCHIVED'])
    .default('PLANNING'),
  visibility: z.enum(['PRIVATE', 'TEAM', 'PUBLIC']).default('PRIVATE')
});

// 查询参数验证
const getProjectsQuerySchema = z.object({
  status: z.enum(['PLANNING', 'ACTIVE', 'COMPLETED', 'ARCHIVED']).optional(),
  search: z.string().optional(),
  limit: z.coerce.number().min(1).max(100).default(10),
  page: z.coerce.number().min(1).default(1),
  sortBy: z
    .enum(['name', 'createdAt', 'updatedAt', 'startDate', 'endDate'])
    .default('updatedAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc')
});

// 获取项目列表
export async function GET(request: NextRequest) {
  const user = await getCurrentUser();

  if (!user) {
    return apiUnauthorized();
  }

  // 检查用户是否有项目查看权限
  const canViewProjects = await hasPermission(user.id, 'project.view');

  if (!canViewProjects) {
    return apiUnauthorized('您没有查看项目的权限');
  }

  // 解析查询参数
  const { searchParams } = new URL(request.url);

  try {
    const query = getProjectsQuerySchema.parse({
      status: searchParams.get('status') || undefined,
      search: searchParams.get('search') || undefined,
      limit: searchParams.get('limit') || 10,
      page: searchParams.get('page') || 1,
      sortBy: searchParams.get('sortBy') || 'updatedAt',
      sortOrder: searchParams.get('sortOrder') || 'desc'
    });

    // 构建查询条件
    const where: any = {};

    // 状态过滤
    if (query.status) {
      where.status = query.status;
    }

    // 搜索过滤
    if (query.search) {
      where.OR = [
        { name: { contains: query.search, mode: 'insensitive' } },
        { description: { contains: query.search, mode: 'insensitive' } }
      ];
    }

    // 用户只能看到自己创建的或者是成员的项目
    where.OR = [
      { ownerId: user.id },
      { members: { some: { userId: user.id } } }
    ];

    // 分页和排序
    const skip = (query.page - 1) * query.limit;
    const take = query.limit;
    const orderBy = { [query.sortBy]: query.sortOrder };

    // 查询项目总数
    const total = await prisma.project.count({ where });

    // 查询项目列表
    const projects = await prisma.project.findMany({
      where,
      orderBy,
      skip,
      take,
      select: {
        id: true,
        name: true,
        description: true,
        status: true,
        visibility: true,
        startDate: true,
        endDate: true,
        createdAt: true,
        updatedAt: true,
        owner: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true
          }
        },
        _count: {
          select: {
            members: true,
            tasks: true,
            sprints: true
          }
        }
      }
    });

    return apiResponse({
      projects,
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

    console.error('获取项目列表失败:', error);
    return apiError(
      'SERVER_ERROR',
      '获取项目列表失败',
      process.env.NODE_ENV === 'development' ? error : undefined,
      500
    );
  }
}

// 创建项目
export async function POST(request: NextRequest) {
  const user = await getCurrentUser();

  if (!user) {
    return apiUnauthorized();
  }

  // 检查用户是否有创建项目权限
  const canCreateProject = await hasPermission(user.id, 'project.create');

  if (!canCreateProject) {
    return apiUnauthorized('您没有创建项目的权限');
  }

  try {
    const body = await request.json();

    // 验证请求数据
    const validated = createProjectSchema.parse(body);

    // 创建项目
    const project = await prisma.project.create({
      data: {
        name: validated.name,
        description: validated.description,
        status: validated.status,
        visibility: validated.visibility,
        startDate: validated.startDate ? new Date(validated.startDate) : null,
        endDate: validated.endDate ? new Date(validated.endDate) : null,
        ownerId: user.id
      }
    });

    // 创建项目成员关系（所有者自动成为成员）
    await prisma.projectMember.create({
      data: {
        userId: user.id,
        projectId: project.id,
        role: 'OWNER'
      }
    });

    return apiResponse(project, null, 201);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return apiError(
        'INVALID_PARAMETERS',
        '请求参数无效',
        error.format(),
        400
      );
    }

    console.error('创建项目失败:', error);
    return apiError(
      'SERVER_ERROR',
      '创建项目失败',
      process.env.NODE_ENV === 'development' ? error : undefined,
      500
    );
  }
}
