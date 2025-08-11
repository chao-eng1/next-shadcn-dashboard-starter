import { NextRequest } from 'next/server';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/get-current-user';
import {
  apiResponse,
  apiError,
  apiUnauthorized,
  apiForbidden
} from '@/lib/api-response';

// 文档移动请求验证
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const moveDocumentSchema = z.object({
  destinationType: z.enum(['PERSONAL', 'PROJECT']),
  destinationProjectId: z.string().nullable()
});

export async function POST(
  request: NextRequest,
  { params }: { params: { documentId: string } }
) {
  const user = await getCurrentUser();

  if (!user) {
    return apiUnauthorized();
  }

  const documentId = (await params).documentId;

  try {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const body = await request.json();

    // 验证请求数据
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const validated = moveDocumentSchema.parse(body);

    // 获取文档
    const document = await prisma.document.findUnique({
      where: { id: documentId },
      include: {
        author: {
          select: { id: true }
        }
      }
    });

    if (!document) {
      return apiError('DOCUMENT_NOT_FOUND', '文档不存在', null, 404);
    }

    // 检查用户是否有权限移动文档（仅文档作者可以移动）
    if (document.authorId !== user.id) {
      return apiForbidden('您没有权限移动此文档');
    }

    // 如果目标类型是PROJECT，则验证项目是否存在
    if (
      validated.destinationType === 'PROJECT' &&
      validated.destinationProjectId
    ) {
      const project = await prisma.project.findUnique({
        where: { id: validated.destinationProjectId },
        include: {
          members: {
            where: { userId: user.id }
          }
        }
      });

      if (!project) {
        return apiError('PROJECT_NOT_FOUND', '目标项目不存在', null, 404);
      }

      // 验证用户是否有权限访问目标项目
      if (project.ownerId !== user.id && project.members.length === 0) {
        return apiForbidden('您没有权限将文档移动到此项目');
      }
    }

    // 执行文档移动操作
    const updatedDocument = await prisma.document.update({
      where: { id: documentId },
      data: {
        type: validated.destinationType,
        projectId:
          validated.destinationType === 'PROJECT'
            ? validated.destinationProjectId
            : null,
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

    return apiError(
      'SERVER_ERROR',
      '移动文档失败',
      process.env.NODE_ENV === 'development' ? error : undefined,
      500
    );
  }
}
