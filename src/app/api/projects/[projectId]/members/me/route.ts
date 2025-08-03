import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/get-current-user';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: { projectId: string } }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: '未授权访问' }, { status: 401 });
    }

    const { projectId } = await params;

    // 查找用户在项目中的成员记录
    const projectMember = await prisma.projectMember.findFirst({
      where: {
        projectId,
        userId: user.id
      },
      select: {
        id: true,
        role: true,
        joinedAt: true
      }
    });

    if (!projectMember) {
      return NextResponse.json({ error: '用户不是项目成员' }, { status: 403 });
    }

    return NextResponse.json({
      role: projectMember.role,
      joinedAt: projectMember.joinedAt,
      memberId: projectMember.id
    });
  } catch (error) {
    console.error('获取用户项目角色失败:', error);
    return NextResponse.json({ error: '服务器内部错误' }, { status: 500 });
  }
}
