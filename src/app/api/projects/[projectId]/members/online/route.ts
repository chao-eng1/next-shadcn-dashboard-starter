// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/get-current-user';
import { prisma } from '@/lib/prisma';

// 获取项目成员在线状态
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

    // 验证用户是否为项目成员
    const projectMember = await prisma.projectMember.findFirst({
      where: {
        projectId,
        userId: user.id
      }
    });

    if (!projectMember) {
      return NextResponse.json({ error: '无权限访问此项目' }, { status: 403 });
    }

    // 获取项目所有成员及其在线状态
    const members = await prisma.projectMember.findMany({
      where: {
        projectId
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
            onlineStatus: {
              select: {
                isOnline: true,
                lastSeenAt: true,
                currentPage: true
              }
            }
          }
        }
      }
    });

    // 获取项目成员在线状态
    const memberOnlineStatus = await prisma.projectMemberOnline.findMany({
      where: {
        projectId
      },
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
    });

    // 合并成员信息和在线状态
    const membersWithStatus = members.map((member) => {
      const onlineStatus = memberOnlineStatus.find(
        (status) => status.userId === member.user.id
      );

      return {
        id: member.id,
        role: member.role,
        joinedAt: member.joinedAt,
        user: {
          ...member.user,
          isOnline: onlineStatus?.isOnline || false,
          lastSeen:
            onlineStatus?.lastSeen || member.user.onlineStatus?.lastSeenAt,
          currentPage: member.user.onlineStatus?.currentPage
        }
      };
    });

    return NextResponse.json({ members: membersWithStatus });
  } catch (error) {
    return NextResponse.json({ error: '服务器内部错误' }, { status: 500 });
  }
}

// 更新用户在项目中的在线状态
export async function POST(
  request: NextRequest,
  { params }: { params: { projectId: string } }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: '未授权访问' }, { status: 401 });
    }

    const { projectId } = await params;
    const body = await request.json();
    const { isOnline, currentPage } = body;

    // 验证用户是否为项目成员
    const projectMember = await prisma.projectMember.findFirst({
      where: {
        projectId,
        userId: user.id
      }
    });

    if (!projectMember) {
      return NextResponse.json({ error: '无权限访问此项目' }, { status: 403 });
    }

    // 更新全局在线状态
    await prisma.userOnlineStatus.upsert({
      where: {
        userId: user.id
      },
      update: {
        isOnline: isOnline ?? true,
        lastSeenAt: new Date(),
        currentPage: currentPage
      },
      create: {
        userId: user.id,
        isOnline: isOnline ?? true,
        lastSeenAt: new Date(),
        currentPage: currentPage
      }
    });

    // 更新项目成员在线状态
    await prisma.projectMemberOnline.upsert({
      where: {
        projectId_userId: {
          projectId,
          userId: user.id
        }
      },
      update: {
        isOnline: isOnline ?? true,
        lastSeen: new Date()
      },
      create: {
        projectId,
        userId: user.id,
        isOnline: isOnline ?? true,
        lastSeen: new Date()
      }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: '服务器内部错误' }, { status: 500 });
  }
}
