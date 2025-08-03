import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/get-current-user';
import { prisma } from '@/lib/prisma';
import { apiResponse, apiUnauthorized, apiBadRequest } from '@/lib/api-response';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { randomUUID } from 'crypto';

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_TYPES = [
  'image/jpeg',
  'image/png', 
  'image/gif',
  'image/webp',
  'application/pdf',
  'text/plain',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
];

// 文件上传
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    
    if (!user) {
      return apiUnauthorized();
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const conversationId = formData.get('conversationId') as string;

    if (!file) {
      return apiBadRequest('未提供文件');
    }

    // 验证文件大小
    if (file.size > MAX_FILE_SIZE) {
      return apiBadRequest('文件大小不能超过10MB');
    }

    // 验证文件类型
    if (!ALLOWED_TYPES.includes(file.type)) {
      return apiBadRequest('不支持的文件类型');
    }

    // 生成唯一文件名
    const fileExtension = file.name.split('.').pop() || '';
    const uniqueFileName = `${randomUUID()}.${fileExtension}`;
    
    // 确保上传目录存在
    const uploadsDir = join(process.cwd(), 'public', 'uploads');
    try {
      await mkdir(uploadsDir, { recursive: true });
    } catch (error) {
      // 目录可能已存在，忽略错误
    }

    // 保存文件到本地
    const filePath = join(uploadsDir, uniqueFileName);
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    
    await writeFile(filePath, buffer);
    
    // 保存文件信息到数据库（使用现有的Attachment模型）
    const uploadedFile = await prisma.attachment.create({
      data: {
        id: randomUUID(),
        filename: file.name,
        filepath: `/uploads/${uniqueFileName}`,
        mimetype: file.type,
        size: file.size,
        uploaderId: user.id,
        // 如果有conversationId，可以考虑关联到相关项目，这里暂时留空
        projectId: null,
        taskId: null
      }
    });

    console.log('File uploaded successfully:', {
      id: uploadedFile.id,
      fileName: uploadedFile.filename,
      size: uploadedFile.size
    });

    return apiResponse({
      id: uploadedFile.id,
      url: uploadedFile.filepath,
      fileName: uploadedFile.filename,
      fileSize: uploadedFile.size,
      mimeType: uploadedFile.mimetype
    });

  } catch (error) {
    console.error('File upload failed:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}