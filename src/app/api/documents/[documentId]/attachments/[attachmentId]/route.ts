import { NextRequest } from 'next/server';
import { unlink } from 'fs/promises';
import { join } from 'path';
import { cwd } from 'process';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/get-current-user';
import {
  apiResponse,
  apiError,
  apiUnauthorized,
  apiNotFound,
  apiForbidden
} from '@/lib/api-response';

// 获取单个附件
export async function GET(
  request: NextRequest,
  { params }: { params: { documentId: string; attachmentId: string } }
) {
  const user = await getCurrentUser();

  if (!user) {
    return apiUnauthorized();
  }

  const { documentId, attachmentId } = params;

  try {
    // 检查附件是否存在
    const attachment = await prisma.documentAttachment.findUnique({
      where: {
        id: attachmentId,
        documentId
      },
      include: {
        document: true,
        uploader: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true
          }
        }
      }
    });

    if (!attachment) {
      return apiNotFound('附件不存在');
    }

    // 检查用户是否有权限访问该附件
    const document = attachment.document;

    if (document.projectId === null && document.createdById !== user.id) {
      return apiForbidden('您没有权限访问此附件');
    }

    if (document.projectId) {
      // 检查用户是否是项目成员
      const isMember = await prisma.projectMember.findFirst({
        where: {
          projectId: document.projectId,
          userId: user.id
        }
      });

      if (!isMember && document.createdById !== user.id) {
        return apiForbidden('您没有权限访问此附件');
      }
    }

    return apiResponse(attachment);
  } catch (error) {
    return apiError(
      'SERVER_ERROR',
      '获取附件失败',
      process.env.NODE_ENV === 'development' ? error : undefined,
      500
    );
  }
}

// 删除附件
export async function DELETE(
  request: NextRequest,
  { params }: { params: { documentId: string; attachmentId: string } }
) {
  const user = await getCurrentUser();

  if (!user) {
    return apiUnauthorized();
  }

  const { documentId, attachmentId } = params;

  try {
    // 检查附件是否存在
    const attachment = await prisma.documentAttachment.findUnique({
      where: {
        id: attachmentId,
        documentId
      },
      include: {
        document: true
      }
    });

    if (!attachment) {
      return apiNotFound('附件不存在');
    }

    // 检查用户是否有权限删除该附件
    const document = attachment.document;

    if (document.projectId === null && document.createdById !== user.id) {
      return apiForbidden('您没有权限删除此附件');
    }

    if (document.projectId) {
      // 检查用户是否是项目成员
      const isMember = await prisma.projectMember.findFirst({
        where: {
          projectId: document.projectId,
          userId: user.id
        }
      });

      if (!isMember && document.createdById !== user.id) {
        return apiForbidden('您没有权限删除此附件');
      }
    }

    // 删除物理文件
    try {
      const filePath = join(cwd(), 'public', attachment.filePath);
      await unlink(filePath);
    } catch (fileError) {
      // 继续删除数据库记录，即使物理文件删除失败
    }

    // 删除数据库记录
    await prisma.documentAttachment.delete({
      where: {
        id: attachmentId
      }
    });

    return apiResponse({ success: true });
  } catch (error) {
    return apiError(
      'SERVER_ERROR',
      '删除附件失败',
      process.env.NODE_ENV === 'development' ? error : undefined,
      500
    );
  }
}
