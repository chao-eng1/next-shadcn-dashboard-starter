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
import { hasProjectPermission } from '@/lib/permissions';

// 文档更新请求验证
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const updateDocumentSchema = z.object({
  title: z.string().min(1, '文档标题不能为空').optional(),
  content: z.string().optional(),
  format: z.enum(['MARKDOWN', 'RICH_TEXT', 'PLAIN_TEXT']).optional(),
  status: z.enum(['DRAFT', 'REVIEW', 'PUBLISHED', 'ARCHIVED']).optional(),
  folderId: z.string().optional().nullable(),
  tags: z.array(z.string()).optional()
});

// 获取单个文档详情
export async function GET(
  request: NextRequest,
  { params }: { params: { projectId: string; documentId: string } }
) {
  const user = await getCurrentUser();

  if (!user) {
    return apiUnauthorized();
  }

  const { projectId, documentId } = await params;

  // 检查用户是否有查看项目的权限
  const hasPermission = await hasProjectPermission(
    projectId,
    'project.view',
    user.id
  );

  if (!hasPermission) {
    return apiForbidden('您没有权限查看此项目');
  }

  try {
    // 获取文档详情
    const document = await prisma.document.findUnique({
      where: {
        id: documentId,
        projectId
      },
      include: {
        project: {
          select: {
            id: true,
            name: true
          }
        },
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
      return apiNotFound('文档不存在');
    }

    return apiResponse(document);
  } catch (error) {
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
  { params }: { params: { projectId: string; documentId: string } }
) {
  const user = await getCurrentUser();

  if (!user) {
    return apiUnauthorized();
  }

  const { projectId, documentId } = await params;

  // 检查文档是否存在
  const document = await prisma.document.findUnique({
    where: {
      id: documentId,
      projectId
    }
  });

  if (!document) {
    return apiNotFound('文档不存在');
  }

  // 检查用户是否有更新文档的权限
  // 如果是作者或有文档更新权限，则允许更新
  const isAuthor = document.authorId === user.id;
  const hasUpdatePermission = await hasProjectPermission(
    projectId,
    'document.update',
    user.id
  );

  if (!isAuthor && !hasUpdatePermission) {
    return apiForbidden('您没有权限更新此文档');
  }

  try {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const body = await request.json();

    // 验证请求数据
    const validated = updateDocumentSchema.parse(body);

    // 如果指定了文件夹，检查它是否存在且属于当前项目
    if (validated.folderId) {
      const folder = await prisma.documentFolder.findUnique({
        where: { id: validated.folderId }
      });

      if (!folder) {
        return apiError('FOLDER_NOT_FOUND', '文件夹不存在', null, 404);
      }

      if (folder.projectId !== projectId) {
        return apiForbidden('文件夹不属于当前项目');
      }
    }

    // 更新文档
    const updatedDocument = await prisma.document.update({
      where: {
        id: documentId
      },
      data: validated
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
  { params }: { params: { projectId: string; documentId: string } }
) {
  const user = await getCurrentUser();

  if (!user) {
    return apiUnauthorized();
  }

  const { projectId, documentId } = await params;

  // 检查文档是否存在
  const document = await prisma.document.findUnique({
    where: {
      id: documentId,
      projectId
    }
  });

  if (!document) {
    return apiNotFound('文档不存在');
  }

  // 检查用户是否有删除文档的权限
  // 如果是作者或有文档删除权限，则允许删除
  const isAuthor = document.authorId === user.id;
  const hasDeletePermission = await hasProjectPermission(
    projectId,
    'document.delete',
    user.id
  );

  if (!isAuthor && !hasDeletePermission) {
    return apiForbidden('您没有权限删除此文档');
  }

  try {
    // 删除文档相关数据
    await prisma.$transaction([
      // 删除文档的评论
      prisma.documentComment.deleteMany({
        where: { documentId }
      }),
      // 删除文档的附件
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
    return apiError(
      'SERVER_ERROR',
      '删除文档失败',
      process.env.NODE_ENV === 'development' ? error : undefined,
      500
    );
  }
}
