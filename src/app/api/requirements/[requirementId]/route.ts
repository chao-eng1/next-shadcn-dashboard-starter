import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/get-current-user';
import {
  apiResponse,
  apiError,
  apiUnauthorized,
  apiNotFound
} from '@/lib/api-response';
import { hasPermission } from '@/lib/permissions';

// 获取单个需求详情
export async function GET(
  request: NextRequest,
  { params }: { params: { requirementId: string } }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return apiUnauthorized();
    }

    const { requirementId } = await params;

    const requirement = await prisma.requirement.findUnique({
      where: { id: requirementId },
      include: {
        project: {
          select: {
            id: true,
            name: true
          }
        },
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true
          }
        },
        assignedTo: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true
          }
        },
        parent: {
          select: {
            id: true,
            title: true,
            status: true
          }
        },
        children: {
          select: {
            id: true,
            title: true,
            status: true,
            priority: true
          }
        },
        tags: {
          include: {
            tag: true
          }
        },
        _count: {
          select: {
            comments: true,
            attachments: true,
            versions: true
          }
        }
      }
    });

    if (!requirement) {
      return apiNotFound('需求不存在');
    }

    // 检查权限：用户是需求创建者、分配人或有权限查看需求
    const hasViewPermission =
      requirement.createdById === user.id ||
      requirement.assignedToId === user.id ||
      (await hasPermission(user.id, 'requirement:view')) ||
      (await hasPermission(user.id, 'requirement.view'));

    if (!hasViewPermission) {
      return apiError('没有权限查看此需求', 403);
    }

    return apiResponse(requirement);
  } catch (error) {
    console.error('Error getting requirement:', error);
    return apiError('获取需求失败');
  }
}

// 删除需求
export async function DELETE(
  request: NextRequest,
  { params }: { params: { requirementId: string } }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return apiUnauthorized();
    }

    const { requirementId } = await params;

    // 首先检查需求是否存在
    const requirement = await prisma.requirement.findUnique({
      where: { id: requirementId },
      select: {
        id: true,
        title: true,
        createdById: true,
        project: {
          select: {
            id: true,
            name: true
          }
        }
      }
    });

    if (!requirement) {
      return apiNotFound('需求不存在');
    }

    // 检查删除权限：用户是需求创建者或有管理员权限
    const hasDeletePermission =
      requirement.createdById === user.id ||
      (await hasPermission(user.id, 'requirement:delete')) ||
      (await hasPermission(user.id, 'requirement.delete'));

    if (!hasDeletePermission) {
      return apiError('没有权限删除此需求', 403);
    }

    // 使用事务删除需求及相关数据
    await prisma.$transaction(async (tx) => {
      // 删除需求标签关联
      await tx.requirementTag.deleteMany({
        where: { requirementId }
      });

      // 删除需求评论
      await tx.requirementComment.deleteMany({
        where: { requirementId }
      });

      // 删除需求附件
      await tx.requirementAttachment.deleteMany({
        where: { requirementId }
      });

      // 删除需求版本
      await tx.requirementVersion.deleteMany({
        where: { requirementId }
      });

      // 删除需求任务关联
      await tx.requirementTask.deleteMany({
        where: { requirementId }
      });

      // 删除需求本身
      await tx.requirement.delete({
        where: { id: requirementId }
      });
    });

    return apiResponse(
      { id: requirementId, title: requirement.title },
      '需求删除成功'
    );
  } catch (error) {
    console.error('Error deleting requirement:', error);
    return apiError('删除需求失败');
  }
}
