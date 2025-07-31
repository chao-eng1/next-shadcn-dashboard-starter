import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/get-current-user';
import { hasPermission } from '@/lib/permissions';

export async function GET(request: NextRequest) {
  try {
    // 获取当前用户
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          error: { message: '未授权，请登录' }
        },
        { status: 401 }
      );
    }

    // 检查权限
    const canViewTasks = await hasPermission(user.id, 'task.view');

    if (!canViewTasks) {
      return NextResponse.json(
        {
          success: false,
          error: { message: '没有权限查看任务' }
        },
        { status: 403 }
      );
    }

    // 获取查询参数
    const searchParams = request.nextUrl.searchParams;

    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const status = searchParams.get('status');
    const priority = searchParams.get('priority');
    const sprintId = searchParams.get('sprintId');
    const parentTaskId = searchParams.get('parentTaskId');
    const projectId = searchParams.get('projectId');
    const search = searchParams.get('search');
    const sortBy = searchParams.get('sortBy') || 'updatedAt';
    const sortOrder = searchParams.get('sortOrder') || 'desc';
    const assignedToMe = searchParams.get('assignedToMe') === 'true';

    // 构建过滤条件
    const where: any = {};

    // 如果指定了项目ID
    if (projectId) {
      where.projectId = projectId;
    }

    // 其他筛选条件
    if (status) {
      where.status = status;
    }

    if (priority) {
      where.priority = priority;
    }

    if (sprintId) {
      where.sprintId = sprintId === 'null' ? null : sprintId;
    }

    if (parentTaskId !== undefined) {
      where.parentTaskId = parentTaskId === 'null' ? null : parentTaskId;
    }

    // 搜索条件
    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } }
      ];
    }

    // 分配给当前用户的任务
    if (assignedToMe) {
      where.assignments = {
        some: {
          member: {
            userId: user.id
          }
        }
      };
    }

    // 排序条件
    const orderBy: any = {};
    orderBy[sortBy] = sortOrder;

    // 获取总数
    const total = await prisma.task.count({ where });

    // 计算分页
    const totalPages = Math.ceil(total / limit);
    const skip = (page - 1) * limit;

    // 获取任务列表
    const tasks = await prisma.task.findMany({
      where,
      orderBy,
      skip,
      take: limit,
      include: {
        assignments: {
          include: {
            member: {
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
            }
          }
        },
        project: {
          select: {
            id: true,
            name: true
          }
        },
        _count: {
          select: {
            subtasks: true,
            comments: true,
            attachments: true
          }
        }
      }
    });

    // 返回数据
    return NextResponse.json({
      success: true,
      data: {
        tasks,
        pagination: {
          total,
          page,
          limit,
          totalPages
        }
      }
    });
  } catch (error) {
    console.error('获取任务列表失败:', error);
    return NextResponse.json(
      {
        success: false,
        error: { message: '获取任务列表失败' }
      },
      { status: 500 }
    );
  }
}
