import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/get-current-user';
import {
  apiResponse,
  apiError,
  apiUnauthorized,
  apiValidationError
} from '@/lib/api-response';

// 获取需求关联关系
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return apiUnauthorized();
    }

    // 解析查询参数
    const { searchParams } = new URL(request.url);
    const requirementId = searchParams.get('requirementId');
    const projectId = searchParams.get('projectId');

    // 构建查询条件
    const where: any = {};

    // 只显示用户有权限查看的需求
    where.OR = [
      { createdById: user.id },
      { assignedToId: user.id },
      {
        project: {
          OR: [
            { ownerId: user.id },
            {
              members: {
                some: {
                  userId: user.id
                }
              }
            }
          ]
        }
      }
    ];

    if (projectId) {
      where.projectId = projectId;
    }

    if (requirementId) {
      where.id = requirementId;
    }

    // 获取需求及其关联关系
    const requirements = await prisma.requirement.findMany({
      where,
      include: {
        project: {
          select: {
            id: true,
            name: true
          }
        },
        parent: {
          select: {
            id: true,
            title: true,
            status: true,
            priority: true
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
        tasks: {
          include: {
            task: {
              select: {
                id: true,
                title: true,
                status: true,
                priority: true,
                assignedTo: {
                  select: {
                    id: true,
                    name: true,
                    email: true
                  }
                }
              }
            }
          }
        },
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        assignedTo: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    // 如果查询特定需求，还要获取相关的依赖关系
    let dependencies = [];
    if (requirementId) {
      // 获取依赖此需求的其他需求
      const dependentRequirements = await prisma.requirement.findMany({
        where: {
          parentId: requirementId
        },
        select: {
          id: true,
          title: true,
          status: true,
          priority: true
        }
      });

      dependencies = dependentRequirements;
    }

    // 统计关联信息
    const stats = {
      totalRequirements: requirements.length,
      withParent: requirements.filter(r => r.parent).length,
      withChildren: requirements.filter(r => r.children.length > 0).length,
      withTasks: requirements.filter(r => r.tasks.length > 0).length
    };

    return apiResponse({
      requirements,
      dependencies,
      stats
    });
  } catch (error) {
    console.error('获取需求关联关系失败:', error);
    return apiError('获取需求关联关系失败');
  }
}

// 创建需求关联关系
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return apiUnauthorized();
    }

    const body = await request.json();
    const { parentId, childId, taskId, requirementId, type } = body;

    // 验证输入
    if (!type || !['parent-child', 'requirement-task'].includes(type)) {
      return apiValidationError([{ message: '关联类型无效' }]);
    }

    if (type === 'parent-child') {
      if (!parentId || !childId) {
        return apiValidationError([{ message: '父需求ID和子需求ID不能为空' }]);
      }

      // 防止循环引用
      if (parentId === childId) {
        return apiValidationError([{ message: '需求不能设置自己为父需求' }]);
      }

      // 检查需求是否存在
      const parentRequirement = await prisma.requirement.findUnique({
        where: { id: parentId }
      });
      const childRequirement = await prisma.requirement.findUnique({
        where: { id: childId }
      });

      if (!parentRequirement || !childRequirement) {
        return apiValidationError([{ message: '指定的需求不存在' }]);
      }

      // 更新子需求的父需求
      await prisma.requirement.update({
        where: { id: childId },
        data: { parentId }
      });

      return apiResponse({ message: '需求关联关系创建成功' });
    }

    if (type === 'requirement-task') {
      if (!requirementId || !taskId) {
        return apiValidationError([{ message: '需求ID和任务ID不能为空' }]);
      }

      // 检查需求和任务是否存在
      const requirement = await prisma.requirement.findUnique({
        where: { id: requirementId }
      });
      const task = await prisma.task.findUnique({
        where: { id: taskId }
      });

      if (!requirement || !task) {
        return apiValidationError([{ message: '指定的需求或任务不存在' }]);
      }

      // 创建需求-任务关联
      await prisma.requirementTask.create({
        data: {
          requirementId,
          taskId,
          createdById: user.id
        }
      });

      return apiResponse({ message: '需求任务关联创建成功' });
    }

    return apiValidationError([{ message: '未知的关联类型' }]);
  } catch (error) {
    console.error('创建需求关联关系失败:', error);
    return apiError('创建需求关联关系失败');
  }
}

// 删除需求关联关系
export async function DELETE(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return apiUnauthorized();
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');
    const childId = searchParams.get('childId');
    const requirementId = searchParams.get('requirementId');
    const taskId = searchParams.get('taskId');

    if (type === 'parent-child' && childId) {
      // 移除父需求关联
      await prisma.requirement.update({
        where: { id: childId },
        data: { parentId: null }
      });

      return apiResponse({ message: '父子需求关联已移除' });
    }

    if (type === 'requirement-task' && requirementId && taskId) {
      // 删除需求-任务关联
      await prisma.requirementTask.deleteMany({
        where: {
          requirementId,
          taskId
        }
      });

      return apiResponse({ message: '需求任务关联已移除' });
    }

    return apiValidationError([{ message: '无效的删除参数' }]);
  } catch (error) {
    console.error('删除需求关联关系失败:', error);
    return apiError('删除需求关联关系失败');
  }
}