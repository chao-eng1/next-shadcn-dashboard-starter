import { cookies } from 'next/headers';
import { verifyJwtToken } from './auth';
import { prisma } from './prisma';

/**
 * 从cookie中获取当前登录用户信息
 * @returns 用户信息或null
 */
export async function getCurrentUser() {
  try {
    // 获取cookie中的token
    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;

    if (!token) {
      return null;
    }

    // 验证token
    const payload = await verifyJwtToken(token);

    if (!payload || !payload.sub) {
      return null;
    }

    // 获取用户ID
    const userId = payload.sub as string;

    // 查询用户信息
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
        roles: {
          include: {
            role: true
          }
        }
      }
    });

    return user;
  } catch (error) {
    console.error('获取当前用户失败:', error);
    return null;
  }
}
