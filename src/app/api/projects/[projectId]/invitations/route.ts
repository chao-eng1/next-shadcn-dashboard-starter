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
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { PROJECT_MEMBER_ROLE } from '@/constants/project';

// 定义邀请有效期（默认7天）
const INVITATION_EXPIRY_DAYS = 7;

// 发送邀请请求验证
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const createInvitationSchema = z.object({
  email: z.string().email('邮箱格式不正确'),
  message: z.string().optional(),
  role: z.enum(['ADMIN', 'MEMBER', 'VIEWER']).default('MEMBER')
});

// 获取项目邀请列表
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  const user = await getCurrentUser();

  if (!user) {
    return apiUnauthorized();
  }

  const { projectId } = await params;

  // 检查用户是否有管理项目成员的权限
  const hasPermission = await hasProjectPermission(
    projectId,
    'project.members.manage',
    user.id
  );

  if (!hasPermission) {
    return apiForbidden('您没有权限管理此项目的成员');
  }

  try {
    // 检查项目是否存在
    const project = await prisma.project.findUnique({
      where: { id: projectId }
    });

    if (!project) {
      return apiNotFound('项目不存在');
    }

    // 获取项目的邀请列表
    const invitations = await prisma.projectInvitation.findMany({
      where: {
        projectId,
        // 只返回未过期的邀请
        OR: [
          { status: 'PENDING' },
          { status: 'ACCEPTED' },
          { status: 'REJECTED' }
        ]
      },
      include: {
        inviter: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true
          }
        },
        invitee: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    return apiResponse(invitations);
  } catch (error) {
    return apiError(
      'SERVER_ERROR',
      '获取项目邀请列表失败',
      process.env.NODE_ENV === 'development' ? error : undefined,
      500
    );
  }
}

// 发送项目邀请
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  const user = await getCurrentUser();

  if (!user) {
    return apiUnauthorized();
  }

  const { projectId } = await params;

  // 检查用户是否有管理项目成员的权限
  const hasPermission = await hasProjectPermission(
    projectId,
    'project.members.manage',
    user.id
  );

  if (!hasPermission) {
    return apiForbidden('您没有权限管理此项目的成员');
  }

  try {
    // 检查项目是否存在
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: {
        members: true
      }
    });

    if (!project) {
      return apiNotFound('项目不存在');
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const body = await request.json();

    // 验证请求数据
    const validated = createInvitationSchema.parse(body);

    // 检查邮箱是否已经是项目成员
    const isAlreadyMember = project.members.some(
      (member) => member.user.email === validated.email
    );

    if (isAlreadyMember) {
      return apiError('ALREADY_MEMBER', '该邮箱已经是项目成员', null, 400);
    }

    // 检查是否已有待处理的邀请
    const existingInvitation = await prisma.projectInvitation.findFirst({
      where: {
        projectId,
        email: validated.email,
        status: 'PENDING'
      }
    });

    if (existingInvitation) {
      return apiError(
        'INVITATION_EXISTS',
        '已经向该邮箱发送过邀请，请等待回应或取消之前的邀请',
        null,
        400
      );
    }

    // 查找邮箱对应的用户（如果存在）
    const invitee = await prisma.user.findUnique({
      where: { email: validated.email }
    });

    // 生成邀请令牌
    const token = crypto.randomBytes(32).toString('hex');

    // 计算过期时间
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + INVITATION_EXPIRY_DAYS);

    // 创建邀请
    const invitation = await prisma.projectInvitation.create({
      data: {
        email: validated.email,
        token,
        message: validated.message,
        role: validated.role,
        status: 'PENDING',
        expiresAt,
        projectId,
        inviterId: user.id,
        inviteeId: invitee?.id // 如果是现有用户，关联用户ID
      }
    });

    // TODO: 在实际应用中，这里应该发送邀请邮件
    // sendInvitationEmail(invitation, project.name, user.name);

    return apiResponse(invitation, null, 201);
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
      '发送项目邀请失败',
      process.env.NODE_ENV === 'development' ? error : undefined,
      500
    );
  }
}
