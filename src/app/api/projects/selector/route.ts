// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/get-current-user';
import { hasPermission } from '@/lib/permissions';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { z } from 'zod';

// 查询参数验证
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const getProjectsQuerySchema = z.object({
  search: z.string().optional(),
  status: z.enum(['PLANNING', 'ACTIVE', 'COMPLETED', 'ARCHIVED']).optional(),
  limit: z.coerce.number().min(1).max(100).default(50)
});

// 获取项目列表 - 用于项目选择器
export async function GET(request: NextRequest) {
  try {
    const currentUser = await getCurrentUser();

    if (!currentUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 检查项目查看权限
    const canViewProjects =
      (await hasPermission(currentUser.id, 'project.view')) ||
      (await hasPermission(currentUser.id, 'project:view'));

    if (!canViewProjects) {
      return NextResponse.json({ error: 'Permission denied' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const query = getProjectsQuerySchema.parse({
      search: searchParams.get('search') || undefined,
      status: searchParams.get('status') || undefined,
      limit: searchParams.get('limit') || 50
    });

    // 构建查询条件
    const where: any = {};

    // 状态过滤 - 排除已归档的项目
    if (query.status) {
      where.status = query.status;
    } else {
      // 默认只显示非归档项目
      where.status = { not: 'ARCHIVED' };
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
      { ownerId: currentUser.id },
      { members: { some: { userId: currentUser.id } } }
    ];

    // 查询项目列表
    const projects = await prisma.project.findMany({
      where,
      take: query.limit,
      select: {
        id: true,
        name: true,
        description: true,
        status: true,
        _count: {
          select: {
            members: true
          }
        },
        members: {
          where: {
            userId: currentUser.id
          },
          select: {
            role: true
          }
        }
      },
      orderBy: [{ updatedAt: 'desc' }, { name: 'asc' }]
    });

    // 转换数据格式以匹配ProjectSelector期望的格式
    const transformedProjects = projects.map((project) => {
      // 获取用户在项目中的角色
      const userRole = project.members[0]?.role;

      // 转换角色名称
      const getRoleDisplayName = (role: string) => {
        switch (role) {
          case 'OWNER':
            return '项目负责人';
          case 'ADMIN':
            return '管理员';
          case 'MEMBER':
            return '成员';
          case 'VIEWER':
            return '观察者';
          default:
            return role;
        }
      };

      // 转换状态
      const getStatusValue = (status: string) => {
        switch (status) {
          case 'PLANNING':
            return 'inactive';
          case 'ACTIVE':
            return 'active';
          case 'COMPLETED':
            return 'inactive';
          case 'ARCHIVED':
            return 'archived';
          default:
            return 'inactive';
        }
      };

      return {
        id: project.id,
        name: project.name,
        description: project.description || undefined,
        status: getStatusValue(project.status),
        memberCount: project._count.members,
        role: userRole ? getRoleDisplayName(userRole) : undefined
      };
    });

    return NextResponse.json(transformedProjects);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid parameters', details: error.format() },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
