import { NextRequest } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/get-current-user';
import {
  apiResponse,
  apiError,
  apiUnauthorized,
  apiForbidden
} from '@/lib/api-response';
import { hasPermission } from '@/lib/permissions';

// 创建文档请求验证
const createDocumentSchema = z.object({
  title: z.string().min(1, '文档标题不能为空'),
  content: z.string().optional(),
  format: z.enum(['MARKDOWN', 'RICH_TEXT', 'PLAIN_TEXT']).default('MARKDOWN'),
  status: z.enum(['DRAFT', 'REVIEW', 'PUBLISHED', 'ARCHIVED']).default('DRAFT'),
  folderId: z.string().optional().nullable(),
  tags: z.string().optional(),
  isPrivate: z.boolean().default(false),
  projectId: z.string().optional().nullable(), // 添加项目ID字段
  type: z.enum(['PERSONAL', 'PROJECT']).default('PERSONAL') // 添加文档类型字段
});

// 查询参数验证
const getDocumentsQuerySchema = z.object({
  status: z.enum(['DRAFT', 'REVIEW', 'PUBLISHED', 'ARCHIVED']).optional(),
  format: z.enum(['MARKDOWN', 'RICH_TEXT', 'PLAIN_TEXT']).optional(),
  search: z.string().optional(),
  folderId: z.string().optional().nullable(),
  limit: z.coerce.number().min(1).max(100).default(10),
  page: z.coerce.number().min(1).default(1),
  sortBy: z.enum(['title', 'createdAt', 'updatedAt']).default('updatedAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc')
});

// 获取个人文档列表
export async function GET(request: NextRequest) {
  const user = await getCurrentUser();

  if (!user) {
    return apiUnauthorized();
  }

  // 检查用户是否有查看文档的权限
  const canViewDocuments = await hasPermission(user.id, 'document.view');

  if (!canViewDocuments) {
    return apiForbidden('您没有权限查看文档');
  }

  // 解析查询参数
  const { searchParams } = new URL(request.url);

  try {
    const query = getDocumentsQuerySchema.parse({
      status: searchParams.get('status') || undefined,
      format: searchParams.get('format') || undefined,
      search: searchParams.get('search') || undefined,
      folderId: searchParams.get('folderId') || undefined,
      limit: searchParams.get('limit') || 10,
      page: searchParams.get('page') || 1,
      sortBy: searchParams.get('sortBy') || 'updatedAt',
      sortOrder: searchParams.get('sortOrder') || 'desc'
    });

    // 构建查询条件 - 个人文档没有projectId，并且是当前用户的
    const where: any = {
      createdById: user.id,
      projectId: null
    };

    // 状态过滤
    if (query.status) {
      where.status = query.status;
    }

    // 格式过滤
    if (query.format) {
      where.format = query.format;
    }

    // 文件夹过滤
    if (query.folderId === 'null') {
      where.folderId = null;
    } else if (query.folderId) {
      where.folderId = query.folderId;
    }

    // 搜索过滤
    if (query.search) {
      where.OR = [
        { title: { contains: query.search, mode: 'insensitive' } },
        { content: { contains: query.search, mode: 'insensitive' } }
      ];
    }

    // 分页和排序
    const skip = (query.page - 1) * query.limit;
    const take = query.limit;
    const orderBy = { [query.sortBy]: query.sortOrder };

    // 查询文档总数
    const total = await prisma.document.count({ where });

    // 查询文档列表
    const documents = await prisma.document.findMany({
      where,
      orderBy,
      skip,
      take,
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
        _count: {
          select: {
            comments: true,
            attachments: true
          }
        }
      }
    });

    return apiResponse({
      documents,
      pagination: {
        total,
        page: query.page,
        limit: query.limit,
        totalPages: Math.ceil(total / query.limit)
      }
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return apiError(
        'INVALID_PARAMETERS',
        '请求参数无效',
        error.format(),
        400
      );
    }

    console.error('获取文档列表失败:', error);
    return apiError(
      'SERVER_ERROR',
      '获取文档列表失败',
      process.env.NODE_ENV === 'development' ? error : undefined,
      500
    );
  }
}

// 创建个人文档
export async function POST(request: NextRequest) {
  const user = await getCurrentUser();

  if (!user) {
    return apiUnauthorized();
  }

  // 检查用户是否有创建文档的权限
  const canCreateDocument = await hasPermission(user.id, 'document.create');

  if (!canCreateDocument) {
    return apiForbidden('您没有权限创建文档');
  }

  try {
    const body = await request.json();

    // 验证请求数据
    const validated = createDocumentSchema.parse(body);

    // 如果指定了文件夹，检查它是否存在且属于当前用户
    if (validated.folderId) {
      const folder = await prisma.documentFolder.findUnique({
        where: { id: validated.folderId }
      });

      if (!folder) {
        return apiError('FOLDER_NOT_FOUND', '文件夹不存在', null, 404);
      }

      if (folder.ownerId !== user.id) {
        return apiForbidden('您无权在此文件夹中创建文档');
      }
    }

    // 确定文档类型
    const documentType = validated.type || 'PERSONAL';

    // 如果是项目文档，需要检查用户是否有访问该项目的权限
    if (documentType === 'PROJECT' && validated.projectId) {
      const project = await prisma.project.findUnique({
        where: { id: validated.projectId },
        select: {
          id: true,
          ownerId: true,
          members: {
            where: { userId: user.id },
            select: { id: true }
          }
        }
      });

      if (!project) {
        return apiError('PROJECT_NOT_FOUND', '项目不存在', null, 404);
      }

      // 检查用户是否是项目的所有者或成员
      const isOwner = project.ownerId === user.id;
      const isMember = project.members.length > 0;

      if (!isOwner && !isMember) {
        return apiForbidden('您无权在此项目中创建文档');
      }
    }

    // 创建文档
    const document = await prisma.document.create({
      data: {
        title: validated.title,
        content: validated.content || '',
        format: validated.format,
        status: validated.status,
        projectId: documentType === 'PROJECT' ? validated.projectId : null,
        folderId: validated.folderId,
        isPrivate: validated.isPrivate,
        authorId: user.id, // 使用authorId而不是createdById，与schema保持一致
        updatedById: user.id,
        tags: validated.tags || '',
        type: documentType
      }
    });

    return apiResponse(document, null, 201);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return apiError(
        'INVALID_PARAMETERS',
        '请求参数无效',
        error.format(),
        400
      );
    }

    console.error('创建文档失败:', error);
    return apiError(
      'SERVER_ERROR',
      '创建文档失败',
      process.env.NODE_ENV === 'development' ? error : undefined,
      500
    );
  }
}
