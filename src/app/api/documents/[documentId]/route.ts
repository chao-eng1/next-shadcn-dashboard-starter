import { NextRequest } from 'next/server';
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
import { hasPermission } from '@/lib/permissions';

// 文档更新请求验证
const updateDocumentSchema = z.object({
  title: z.string().min(1, '文档标题不能为空').optional(),
  content: z.string().optional(),
  format: z.enum(['MARKDOWN', 'RICH_TEXT', 'PLAIN_TEXT']).optional(),
  status: z.enum(['DRAFT', 'REVIEW', 'PUBLISHED', 'ARCHIVED']).optional(),
  folderId: z.string().optional().nullable(),
  isPrivate: z.boolean().optional(),
  tags: z.string().optional()
});

// 获取单个文档详情
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ documentId: string }> }
) {
  const user = await getCurrentUser();

  if (!user) {
    return apiUnauthorized();
  }

  const documentId = (await params).documentId;

  // 检查用户是否有查看文档的权限
  const canViewDocuments = await hasPermission(user.id, 'document.view');

  if (!canViewDocuments) {
    return apiForbidden('您没有权限查看文档');
  }

  try {
    // 获取文档详情
    const document = await prisma.document.findUnique({
      where: {
        id: documentId,
        projectId: null,
        createdById: user.id // 确保只能查看自己的个人文档
      },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true
          }
        },
        folder: {
          select: {
            id: true,
            name: true
          }
        },
        comments: {
          include: {
            author: {
              select: {
                id: true,
                name: true,
                email: true,
                image: true
              }
            }
          },
          orderBy: {
            createdAt: 'desc'
          }
        },
        attachments: true,
        _count: {
          select: {
            comments: true,
            attachments: true
          }
        }
      }
    });

    if (!document) {
      return apiNotFound('文档不存在或您无权访问');
    }

    return apiResponse(document);
  } catch (error) {
    console.error('获取文档详情失败:', error);
    return apiError(
      'SERVER_ERROR',
      '获取文档详情失败',
      process.env.NODE_ENV === 'development' ? error : undefined,
      500
    );
  }
}

// 更新文档
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ documentId: string }> }
) {
  const user = await getCurrentUser();

  if (!user) {
    return apiUnauthorized();
  }

  const documentId = (await params).documentId;

  // 检查文档是否存在
  const document = await prisma.document.findUnique({
    where: {
      id: documentId,
      projectId: null
    }
  });

  if (!document) {
    return apiNotFound('文档不存在');
  }

  // 检查用户是否是文档的作者
  if (document.createdById !== user.id) {
    return apiForbidden('您没有权限更新此文档');
  }

  try {
    const body = await request.json();

    // 验证请求数据
    const validated = updateDocumentSchema.parse(body);

    // 如果指定了文件夹，检查它是否存在且属于当前用户
    if (validated.folderId) {
      const folder = await prisma.documentFolder.findUnique({
        where: { id: validated.folderId }
      });

      if (!folder) {
        return apiError('FOLDER_NOT_FOUND', '文件夹不存在', null, 404);
      }

      if (folder.ownerId !== user.id) {
        return apiForbidden('您无权在此文件夹中更新文档');
      }
    }

    // 更新文档版本
    if (validated.content && validated.content !== document.content) {
      // 获取当前最新版本号
      const latestVersion = await prisma.documentVersion.findFirst({
        where: { documentId },
        orderBy: { versionNumber: 'desc' }
      });

      const newVersionNumber = latestVersion
        ? latestVersion.versionNumber + 1
        : 1;

      // 创建新版本
      await prisma.documentVersion.create({
        data: {
          documentId,
          versionNumber: newVersionNumber,
          content: document.content, // 保存旧内容
          createdById: user.id
        }
      });
    }

    // 更新文档
    const updatedDocument = await prisma.document.update({
      where: {
        id: documentId
      },
      data: {
        ...validated,
        updatedById: user.id
      }
    });

    return apiResponse(updatedDocument);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return apiError(
        'INVALID_PARAMETERS',
        '请求参数无效',
        error.format(),
        400
      );
    }

    console.error('更新文档失败:', error);
    return apiError(
      'SERVER_ERROR',
      '更新文档失败',
      process.env.NODE_ENV === 'development' ? error : undefined,
      500
    );
  }
}

// 删除文档
export async function DELETE(
  request: NextRequest,
  { params }: { params: { documentId: string } }
) {
  const user = await getCurrentUser();

  if (!user) {
    return apiUnauthorized();
  }

  const documentId = (await params).documentId;

  // 检查文档是否存在
  const document = await prisma.document.findUnique({
    where: {
      id: documentId,
      projectId: null
    }
  });

  if (!document) {
    return apiNotFound('文档不存在');
  }

  // 检查用户是否是文档的作者
  if (document.createdById !== user.id) {
    return apiForbidden('您没有权限删除此文档');
  }

  try {
    // 删除文档及相关数据
    await prisma.$transaction([
      // 删除文档版本
      prisma.documentVersion.deleteMany({
        where: { documentId }
      }),
      // 删除文档评论
      prisma.documentComment.deleteMany({
        where: { documentId }
      }),
      // 删除文档附件
      prisma.documentAttachment.deleteMany({
        where: { documentId }
      }),
      // 删除文档本身
      prisma.document.delete({
        where: { id: documentId }
      })
    ]);

    return apiResponse({ success: true }, null, 200);
  } catch (error) {
    console.error('删除文档失败:', error);
    return apiError(
      'SERVER_ERROR',
      '删除文档失败',
      process.env.NODE_ENV === 'development' ? error : undefined,
      500
    );
  }
}
