import { NextRequest } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import { join, parse, extname } from 'path';
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

// 确保上传目录存在
async function ensureUploadDir(dir: string) {
  try {
    await mkdir(dir, { recursive: true });
  } catch (error) {
    console.error('创建上传目录失败:', error);
  }
}

// 获取文档的附件列表
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ documentId: string }> }
) {
  const user = await getCurrentUser();

  if (!user) {
    return apiUnauthorized();
  }

  const { documentId } = await params;

  try {
    // 检查文档是否存在并且用户有权访问
    const document = await prisma.document.findUnique({
      where: {
        id: documentId
      }
    });

    if (!document) {
      return apiNotFound('文档不存在');
    }

    // 检查用户是否有权限访问该文档
    if (document.projectId === null && document.createdById !== user.id) {
      return apiForbidden('您没有权限访问此文档的附件');
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
        return apiForbidden('您没有权限访问此文档的附件');
      }
    }

    // 获取附件列表
    const attachments = await prisma.documentAttachment.findMany({
      where: {
        documentId
      },
      include: {
        uploader: {
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
    });

    return apiResponse(attachments);
  } catch (error) {
    console.error('获取附件列表失败:', error);
    return apiError(
      'SERVER_ERROR',
      '获取附件列表失败',
      process.env.NODE_ENV === 'development' ? error : undefined,
      500
    );
  }
}

// 上传文档附件
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ documentId: string }> }
) {
  const user = await getCurrentUser();

  if (!user) {
    return apiUnauthorized();
  }

  const { documentId } = await params;

  try {
    // 检查文档是否存在并且用户有权访问
    const document = await prisma.document.findUnique({
      where: {
        id: documentId
      }
    });

    if (!document) {
      return apiNotFound('文档不存在');
    }

    // 检查用户是否有权限上传附件
    if (document.projectId === null && document.createdById !== user.id) {
      return apiForbidden('您没有权限上传附件到此文档');
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
        return apiForbidden('您没有权限上传附件到此文档');
      }
    }

    // 处理表单数据
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return apiError('INVALID_REQUEST', '未找到上传的文件', null, 400);
    }

    // 获取文件信息
    const filename = file.name;
    const fileSize = file.size;
    const mimeType = file.type;
    const fileExt = extname(filename).toLowerCase();

    // 创建唯一的文件名
    const uniqueFilename = `${Date.now()}-${Math.random().toString(36).substring(2, 15)}${fileExt}`;

    // 确定上传路径
    const uploadDir = join(cwd(), 'public', 'uploads', 'documents', documentId);
    await ensureUploadDir(uploadDir);

    const filePath = join(uploadDir, uniqueFilename);
    const relativePath = `/uploads/documents/${documentId}/${uniqueFilename}`;

    // 保存文件
    const fileBuffer = Buffer.from(await file.arrayBuffer());
    await writeFile(filePath, fileBuffer);

    // 创建附件记录
    const attachment = await prisma.documentAttachment.create({
      data: {
        name: filename,
        fileName: uniqueFilename,
        filePath: relativePath,
        fileSize: fileSize,
        fileType: mimeType,
        documentId,
        uploaderId: user.id
      }
    });

    return apiResponse(attachment, null, 201);
  } catch (error) {
    console.error('上传附件失败:', error);
    return apiError(
      'SERVER_ERROR',
      '上传附件失败',
      process.env.NODE_ENV === 'development' ? error : undefined,
      500
    );
  }
}
