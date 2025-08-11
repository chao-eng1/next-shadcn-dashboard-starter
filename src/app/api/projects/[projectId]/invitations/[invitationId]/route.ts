import { NextRequest } from 'next/server';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { z } from 'zod';
import crypto from 'crypto';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/get-current-user';
import {
  apiResponse,
  apiError,
  apiUnauthorized,
  apiNotFound,
  apiForbidden
} from '@/lib/api-response';
import { hasProjectPermission } from '@/lib/permissions';

// 定义邀请有效期（默认7天）
const INVITATION_EXPIRY_DAYS = 7;

// 获取邀请详情
export async function GET(
  request: NextRequest,
  { params }: { params: { projectId: string; invitationId: string } }
) {
  const user = await getCurrentUser();

  if (!user) {
    return apiUnauthorized();
  }

  const { projectId, invitationId } = params;

  try {
    // 查询邀请
    const invitation = await prisma.projectInvitation.findUnique({
      where: { id: invitationId },
      include: {
        project: {
          select: {
            id: true,
            name: true,
            description: true,
            status: true,
            visibility: true,
            ownerId: true,
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

    // 验证项目ID是否匹配
    if (invitation.projectId !== projectId) {
      return apiError('INVALID_PROJECT', '邀请与指定项目不匹配', null, 400);
    }

    // 检查用户是否有权查看此邀请（用户是项目管理员、发送者或接收者）
    const isProjectAdmin = await hasProjectPermission(
      projectId,
      'project.members.manage',
      user.id
    );
    const isInviter = invitation.inviterId === user.id;
    const isInvitee = invitation.email === user.email;

    if (!isProjectAdmin && !isInviter && !isInvitee) {
      return apiForbidden('您没有权限查看此邀请');
    }

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

// 取消邀请或更新邀请
export async function PATCH(
  request: NextRequest,
  { params }: { params: { projectId: string; invitationId: string } }
) {
  const user = await getCurrentUser();

  if (!user) {
    return apiUnauthorized();
  }

  const { projectId, invitationId } = params;

  try {
    // 获取邀请
    const invitation = await prisma.projectInvitation.findUnique({
      where: { id: invitationId }
    });

    if (!invitation) {
      return apiNotFound('邀请不存在');
    }

    // 验证项目ID是否匹配
    if (invitation.projectId !== projectId) {
      return apiError('INVALID_PROJECT', '邀请与指定项目不匹配', null, 400);
    }

    // 只有项目管理员或邀请发送者可以更新邀请
    const isProjectAdmin = await hasProjectPermission(
      projectId,
      'project.members.manage',
      user.id
    );
    const isInviter = invitation.inviterId === user.id;

    if (!isProjectAdmin && !isInviter) {
      return apiForbidden('您没有权限更新此邀请');
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const body = await request.json();

    // 处理不同的操作
    const { action } = body;

    switch (action) {
      case 'cancel':
        // 取消邀请
        const canceledInvitation = await prisma.projectInvitation.update({
          where: { id: invitationId },
          data: { status: 'REJECTED' }
        });
        return apiResponse({ ...canceledInvitation, action: 'canceled' });

      case 'resend':
        // 重新发送邀请 - 生成新令牌并更新过期时间
        const token = crypto.randomBytes(32).toString('hex');
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + INVITATION_EXPIRY_DAYS);

        const resendInvitation = await prisma.projectInvitation.update({
          where: { id: invitationId },
          data: {
            token,
            status: 'PENDING',
            expiresAt,
            updatedAt: new Date()
          }
        });

        // TODO: 在实际应用中，这里应该重新发送邀请邮件
        // sendInvitationEmail(resendInvitation, project.name, user.name);

        return apiResponse({ ...resendInvitation, action: 'resent' });

      default:
        return apiError('INVALID_ACTION', '无效的操作', null, 400);
    }
  } catch (error) {
    return apiError(
      'SERVER_ERROR',
      '更新邀请失败',
      process.env.NODE_ENV === 'development' ? error : undefined,
      500
    );
  }
}

// 删除邀请
export async function DELETE(
  request: NextRequest,
  { params }: { params: { projectId: string; invitationId: string } }
) {
  const user = await getCurrentUser();

  if (!user) {
    return apiUnauthorized();
  }

  const { projectId, invitationId } = params;

  try {
    // 获取邀请
    const invitation = await prisma.projectInvitation.findUnique({
      where: { id: invitationId }
    });

    if (!invitation) {
      return apiNotFound('邀请不存在');
    }

    // 验证项目ID是否匹配
    if (invitation.projectId !== projectId) {
      return apiError('INVALID_PROJECT', '邀请与指定项目不匹配', null, 400);
    }

    // 只有项目管理员或邀请发送者可以删除邀请
    const isProjectAdmin = await hasProjectPermission(
      projectId,
      'project.members.manage',
      user.id
    );
    const isInviter = invitation.inviterId === user.id;

    if (!isProjectAdmin && !isInviter) {
      return apiForbidden('您没有权限删除此邀请');
    }

    // 删除邀请
    await prisma.projectInvitation.delete({
      where: { id: invitationId }
    });

    return apiResponse({ success: true, message: '邀请已删除' });
  } catch (error) {
    return apiError(
      'SERVER_ERROR',
      '删除邀请失败',
      process.env.NODE_ENV === 'development' ? error : undefined,
      500
    );
  }
}
