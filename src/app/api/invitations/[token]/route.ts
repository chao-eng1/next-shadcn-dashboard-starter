import { NextRequest } from 'next/server';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/get-current-user';
import {
  apiResponse,
  apiError,
  apiUnauthorized,
  apiNotFound,
  apiForbidden
} from '@/lib/api-response';

// 处理邀请响应请求验证
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const responseInvitationSchema = z.object({
  action: z.enum(['accept', 'reject'])
});

// 通过令牌获取邀请详情
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;

  try {
    // 查询邀请
    const invitation = await prisma.projectInvitation.findUnique({
      where: { token },
      include: {
        project: {
          select: {
            id: true,
            name: true,
            description: true,
            status: true,
            visibility: true,
            owner: {
              select: {
                id: true,
                name: true,
                email: true,
                image: true
              }
            }
          }
        },
        inviter: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true
          }
        }
      }
    });

    if (!invitation) {
      return apiNotFound('邀请不存在');
    }

    // 检查邀请是否已过期
    if (
      invitation.status !== 'PENDING' ||
      new Date() > new Date(invitation.expiresAt)
    ) {
      return apiError('INVITATION_EXPIRED', '邀请已过期或已处理', null, 400);
    }

    // 返回邀请详情
    return apiResponse(invitation);
  } catch (error) {
    return apiError(
      'SERVER_ERROR',
      '获取邀请详情失败',
      process.env.NODE_ENV === 'development' ? error : undefined,
      500
    );
  }
}

// 接受或拒绝邀请
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const user = await getCurrentUser();

  if (!user) {
    return apiUnauthorized();
  }

  const { token } = await params;

  try {
    // 查询邀请
    const invitation = await prisma.projectInvitation.findUnique({
      where: { token }
    });

    if (!invitation) {
      return apiNotFound('邀请不存在');
    }

    // 检查邀请是否已过期
    if (
      invitation.status !== 'PENDING' ||
      new Date() > new Date(invitation.expiresAt)
    ) {
      return apiError('INVITATION_EXPIRED', '邀请已过期或已处理', null, 400);
    }

    // 检查用户是否是邀请的接收者
    if (invitation.email !== user.email) {
      return apiForbidden('此邀请不是发送给您的');
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const body = await request.json();
    const validated = responseInvitationSchema.parse(body);

    if (validated.action === 'accept') {
      // 检查用户是否已经是项目成员
      const existingMember = await prisma.projectMember.findUnique({
        where: {
          userId_projectId: {
            userId: user.id,
            projectId: invitation.projectId
          }
        }
      });

      if (existingMember) {
        // 更新邀请状态
        await prisma.projectInvitation.update({
          where: { id: invitation.id },
          data: { status: 'ACCEPTED' }
        });

        return apiResponse({
          success: true,
          message: '您已经是此项目的成员',
          invitation: { ...invitation, status: 'ACCEPTED' }
        });
      }

      // 使用事务处理接受邀请操作
      const result = await prisma.$transaction(async (prisma) => {
        // 1. 更新邀请状态
        const updatedInvitation = await prisma.projectInvitation.update({
          where: { id: invitation.id },
          data: {
            status: 'ACCEPTED',
            inviteeId: user.id
          }
        });

        // 2. 创建项目成员记录
        const projectMember = await prisma.projectMember.create({
          data: {
            userId: user.id,
            projectId: invitation.projectId,
            role: invitation.role,
            invitationId: invitation.id
          }
        });

        return { updatedInvitation, projectMember };
      });

      return apiResponse({
        success: true,
        message: '您已成功加入项目',
        invitation: result.updatedInvitation,
        membership: result.projectMember
      });
    } else if (validated.action === 'reject') {
      // 拒绝邀请
      const updatedInvitation = await prisma.projectInvitation.update({
        where: { id: invitation.id },
        data: {
          status: 'REJECTED',
          inviteeId: user.id
        }
      });

      return apiResponse({
        success: true,
        message: '您已拒绝邀请',
        invitation: updatedInvitation
      });
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return apiError(
        'INVALID_PARAMETERS',
        '请求参数无效',
        error.format(),
        400
      );
    }

    return apiError(
      'SERVER_ERROR',
      '处理邀请失败',
      process.env.NODE_ENV === 'development' ? error : undefined,
      500
    );
  }
}
