import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/get-current-user';
import { hasPermission } from '@/lib/permissions';
import { z } from 'zod';

// 查询参数验证
const getUsersQuerySchema = z.object({
  search: z.string().optional(),
  limit: z.coerce.number().min(1).max(100).default(50),
  excludeIds: z.string().optional(), // 逗号分隔的用户ID列表
  includeOnlineStatus: z
    .string()
    .optional()
    .transform((val) => val === 'true')
});

// 获取用户列表 - 用于用户选择器
export async function GET(request: NextRequest) {
  try {
    const currentUser = await getCurrentUser();

    if (!currentUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 检查用户查看权限
    const canViewUsers =
      (await hasPermission(currentUser.id, 'user:list')) ||
      (await hasPermission(currentUser.id, 'user.list'));

    if (!canViewUsers) {
      return NextResponse.json({ error: 'Permission denied' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const query = getUsersQuerySchema.parse({
      search: searchParams.get('search') || undefined,
      limit: searchParams.get('limit') || 50,
      excludeIds: searchParams.get('excludeIds') || undefined,
      includeOnlineStatus: searchParams.get('includeOnlineStatus') || 'false'
    });

    // 构建查询条件
    const where: any = {};

    // 搜索过滤
    if (query.search) {
      where.OR = [
        { name: { contains: query.search, mode: 'insensitive' } },
        { email: { contains: query.search, mode: 'insensitive' } }
      ];
    }

    // 排除指定用户
    if (query.excludeIds) {
      const excludeIdArray = query.excludeIds
        .split(',')
        .filter((id) => id.trim());
      if (excludeIdArray.length > 0) {
        where.id = { notIn: excludeIdArray };
      }
    }

    // 查询用户列表
    const users = await prisma.user.findMany({
      where,
      take: query.limit,
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
        roles: {
          select: {
            role: {
              select: {
                name: true
              }
            }
          }
        }
      },
      orderBy: [{ name: 'asc' }]
    });

    // 转换数据格式以匹配UserSelector期望的格式
    const transformedUsers = users.map((user) => ({
      id: user.id,
      name: user.name,
      email: user.email,
      image: user.image,
      isOnline: false, // 后续可以集成真实的在线状态
      role: user.roles.length > 0 ? user.roles[0].role.name : undefined
    }));

    return NextResponse.json(transformedUsers);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid parameters', details: error.format() },
        { status: 400 }
      );
    }

    console.error('Error fetching users:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
