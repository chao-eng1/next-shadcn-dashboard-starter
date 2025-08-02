import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/get-current-user';
import {
  apiResponse,
  apiError,
  apiUnauthorized
} from '@/lib/api-response';
import {
  RequirementStatus,
  RequirementPriority,
  RequirementType,
  RequirementComplexity
} from '@/features/requirement-management/types/requirement';

// 获取需求统计数据
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return apiUnauthorized();
    }

    // 解析查询参数
    const { searchParams } = new URL(request.url);
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

    // 如果指定了项目ID，添加项目过滤
    if (projectId) {
      where.projectId = projectId;
    }

    // 获取总需求数
    const totalRequirements = await prisma.requirement.count({ where });

    // 按状态统计
    const statusStats = await prisma.requirement.groupBy({
      by: ['status'],
      where,
      _count: {
        id: true
      }
    });

    // 按优先级统计
    const priorityStats = await prisma.requirement.groupBy({
      by: ['priority'],
      where,
      _count: {
        id: true
      }
    });

    // 按类型统计
    const typeStats = await prisma.requirement.groupBy({
      by: ['type'],
      where,
      _count: {
        id: true
      }
    });

    // 按复杂度统计
    const complexityStats = await prisma.requirement.groupBy({
      by: ['complexity'],
      where,
      _count: {
        id: true
      }
    });

    // 按项目统计（如果不是特定项目查询）
    let projectStats = [];
    if (!projectId) {
      projectStats = await prisma.requirement.groupBy({
        by: ['projectId'],
        where,
        _count: {
          id: true
        }
      });
    }

    // 计算完成率
    const completedCount = statusStats.find(s => s.status === RequirementStatus.COMPLETED)?._count.id || 0;
    const completionRate = totalRequirements > 0 ? (completedCount / totalRequirements) * 100 : 0;

    // 计算高优先级需求数量
    const highPriorityCount = priorityStats.filter(p => 
      p.priority === RequirementPriority.HIGH || p.priority === RequirementPriority.CRITICAL
    ).reduce((sum, p) => sum + p._count.id, 0);

    // 计算进行中的需求数量
    const inProgressCount = statusStats.filter(s => 
      s.status === RequirementStatus.IN_PROGRESS || s.status === RequirementStatus.TESTING
    ).reduce((sum, s) => sum + s._count.id, 0);

    // 获取最近创建的需求
    const recentRequirements = await prisma.requirement.findMany({
      where,
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
            email: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 10
    });

    // 获取即将到期的需求
    const upcomingDue = await prisma.requirement.findMany({
      where: {
        ...where,
        dueDate: {
          gte: new Date(),
          lte: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7天内
        },
        status: {
          notIn: [RequirementStatus.COMPLETED, RequirementStatus.CANCELLED, RequirementStatus.REJECTED]
        }
      },
      include: {
        project: {
          select: {
            id: true,
            name: true
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
        dueDate: 'asc'
      },
      take: 10
    });

    // 生成趋势数据（最近30天）
    const trendData = [];
    const now = new Date();
    for (let i = 29; i >= 0; i--) {
      const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      const startOfDay = new Date(date.getFullYear(), date.getMonth(), date.getDate());
      const endOfDay = new Date(date.getFullYear(), date.getMonth(), date.getDate() + 1);
      
      const createdCount = await prisma.requirement.count({
        where: {
          ...where,
          createdAt: {
            gte: startOfDay,
            lt: endOfDay
          }
        }
      });
      
      const completedCount = await prisma.requirement.count({
        where: {
          ...where,
          status: RequirementStatus.COMPLETED,
          updatedAt: {
            gte: startOfDay,
            lt: endOfDay
          }
        }
      });
      
      trendData.push({
        date: date.toISOString(),
        created: createdCount,
        completed: completedCount
      });
    }

    // 转换统计数据为对象格式
    const byStatus: Record<string, number> = {};
    statusStats.forEach(s => {
      byStatus[s.status] = s._count.id;
    });

    const byPriority: Record<string, number> = {};
    priorityStats.forEach(p => {
      byPriority[p.priority] = p._count.id;
    });

    const byType: Record<string, number> = {};
    typeStats.forEach(t => {
      byType[t.type] = t._count.id;
    });

    const byComplexity: Record<string, number> = {};
    complexityStats.forEach(c => {
      byComplexity[c.complexity] = c._count.id;
    });

    // 计算本月数据
    const thisMonth = new Date();
    const startOfMonth = new Date(thisMonth.getFullYear(), thisMonth.getMonth(), 1);
    const endOfMonth = new Date(thisMonth.getFullYear(), thisMonth.getMonth() + 1, 0);

    const createdThisMonth = await prisma.requirement.count({
      where: {
        ...where,
        createdAt: {
          gte: startOfMonth,
          lte: endOfMonth
        }
      }
    });

    const completedThisMonth = await prisma.requirement.count({
      where: {
        ...where,
        status: RequirementStatus.COMPLETED,
        updatedAt: {
          gte: startOfMonth,
          lte: endOfMonth
        }
      }
    });

    // 计算逾期需求数量
    const overdueCount = await prisma.requirement.count({
      where: {
        ...where,
        dueDate: {
          lt: new Date()
        },
        status: {
          notIn: [RequirementStatus.COMPLETED, RequirementStatus.CANCELLED, RequirementStatus.REJECTED]
        }
      }
    });

    // 计算工作量统计
    const effortStats = await prisma.requirement.aggregate({
      where,
      _sum: {
        estimatedEffort: true,
        actualEffort: true
      },
      _avg: {
        estimatedEffort: true
      }
    });

    return apiResponse({
      total: totalRequirements,
      byStatus,
      byPriority,
      byType,
      byComplexity,
      byProject: projectStats.map(p => ({
        projectId: p.projectId,
        projectName: `项目 ${p.projectId}`,
        count: p._count.id
      })),
      byAssignee: [],
      completionRate: Math.round(completionRate * 100) / 100,
      averageBusinessValue: 0, // businessValue是字符串类型，无法计算平均值
      averageEstimatedEffort: effortStats._avg.estimatedEffort || 0,
      totalEstimatedEffort: effortStats._sum.estimatedEffort || 0,
      totalActualEffort: effortStats._sum.actualEffort || 0,
      overdueCount,
      createdThisMonth,
      completedThisMonth,
      trend: trendData.map(item => ({
        ...item,
        inProgress: 0 // 简化处理
      }))
    });
  } catch (error) {
    console.error('获取需求统计失败:', error);
    return apiError('获取需求统计失败');
  }
}