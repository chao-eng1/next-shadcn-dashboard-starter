import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/get-current-user';
import {
  apiResponse,
  apiError,
  apiUnauthorized,
  apiNotFound,
  apiForbidden,
  apiValidationError
} from '@/lib/api-response';
import { isProjectMember } from '@/features/project-management/utils/project-auth';
import { updateRequirementSchema } from '@/features/requirement-management/schemas/requirement-schema';
import {
  canViewRequirements,
  canEditRequirement,
  canDeleteRequirement
} from '@/features/requirement-management/utils/requirement-permissions';

// 获取需求详情
export async function GET(
  request: NextRequest,
  { params }: { params: { projectId: string; requirementId: string } }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return apiUnauthorized();
    }

    const { projectId, requirementId } = params;

    // 检查用户是否有查看需求的权限
    const hasViewPermission = await canViewRequirements(projectId, user.id);
    if (!hasViewPermission) {
      return apiForbidden('您没有权限查看此项目的需求');
    }

    // 查询需求详情
    const requirement = await prisma.requirement.findUnique({
      where: {
        id: requirementId,
        projectId // 确保需求属于指定项目
      },
      include: {
        project: {
          select: {
            id: true,
            name: true,
            status: true
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
            status: true,
            priority: true
          }
        },
        children: {
          select: {
            id: true,
            title: true,
            status: true,
            priority: true,
            type: true,
            complexity: true,
            assignedTo: {
              select: {
                id: true,
                name: true,
                image: true
              }
            }
          },
          orderBy: {
            createdAt: 'asc'
          }
        },
        tasks: {
          include: {
            task: {
              select: {
                id: true,
                title: true,
                description: true,
                status: true,
                priority: true,
                dueDate: true,
                createdAt: true,
                assignments: {
                  include: {
                    member: {
                      include: {
                        user: {
                          select: {
                            id: true,
                            name: true,
                            image: true
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
          },
          orderBy: {
            createdAt: 'asc'
          }
        },
        comments: {
          include: {
            user: {
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
        attachments: {
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
        },
        tags: {
          include: {
            tag: true
          }
        },
        versions: {
          include: {
            createdBy: {
              select: {
                id: true,
                name: true,
                email: true,
                image: true
              }
            }
          },
          orderBy: {
            versionNumber: 'desc'
          }
        },
        _count: {
          select: {
            comments: true,
            attachments: true,
            versions: true,
            children: true,
            tasks: true
          }
        }
      }
    });

    if (!requirement) {
      return apiNotFound('需求');
    }

    return apiResponse(requirement);
  } catch (error) {
    console.error('获取需求详情失败:', error);
    return apiError('获取需求详情失败');
  }
}

// 更新需求
export async function PATCH(
  request: NextRequest,
  { params }: { params: { projectId: string; requirementId: string } }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return apiUnauthorized();
    }

    const { projectId, requirementId } = params;

    // 检查用户是否为项目成员
    const isMember = await isProjectMember(projectId, user.id);
    if (!isMember) {
      return apiForbidden('您没有访问此项目的权限');
    }

    // 查询现有需求
    const existingRequirement = await prisma.requirement.findUnique({
      where: {
        id: requirementId,
        projectId
      }
    });

    if (!existingRequirement) {
      return apiNotFound('需求');
    }

    // 检查用户是否有编辑需求的权限
    const hasEditPermission = await canEditRequirement(requirementId, user.id);
    if (!hasEditPermission) {
      return apiForbidden('您没有权限编辑此需求');
    }

    // 解析请求体
    const body = await request.json();

    // 验证请求数据
    const validationResult = updateRequirementSchema.safeParse(body);
    if (!validationResult.success) {
      return apiValidationError(validationResult.error.errors);
    }

    const data = validationResult.data;

    // 如果指定了父需求，验证父需求是否存在且属于同一项目
    if (data.parentId) {
      const parentRequirement = await prisma.requirement.findUnique({
        where: { id: data.parentId }
      });

      if (!parentRequirement || parentRequirement.projectId !== projectId) {
        return apiValidationError([
          { message: '指定的父需求不存在或不属于当前项目' }
        ]);
      }

      // 防止循环引用
      if (data.parentId === requirementId) {
        return apiValidationError([{ message: '需求不能设置自己为父需求' }]);
      }
    }

    // 如果指定了分配人，验证分配人是否为项目成员
    if (data.assignedToId) {
      const isAssigneeMember = await isProjectMember(
        projectId,
        data.assignedToId
      );
      if (!isAssigneeMember) {
        return apiValidationError([{ message: '指定的分配人不是项目成员' }]);
      }
    }

    // 检查是否有重要字段变更，如果有则创建新版本
    const importantFields = [
      'title',
      'description',
      'acceptanceCriteria',
      'businessValue'
    ];
    const hasImportantChanges = importantFields.some(
      (field) =>
        data[field as keyof typeof data] !== undefined &&
        data[field as keyof typeof data] !== (existingRequirement as any)[field]
    );

    let newVersionNumber = existingRequirement.currentVersion;

    if (hasImportantChanges) {
      newVersionNumber = existingRequirement.currentVersion + 1;

      // 创建新版本记录
      await prisma.requirementVersion.create({
        data: {
          requirementId,
          versionNumber: newVersionNumber,
          title: data.title || existingRequirement.title,
          description: data.description || existingRequirement.description,
          acceptanceCriteria:
            data.acceptanceCriteria || existingRequirement.acceptanceCriteria,
          businessValue:
            data.businessValue || existingRequirement.businessValue,
          changeReason: '需求内容更新',
          createdById: user.id
        }
      });
    }

    // 更新需求
    const updatedRequirement = await prisma.requirement.update({
      where: { id: requirementId },
      data: {
        ...data,
        currentVersion: newVersionNumber
      },
      include: {
        project: {
          select: {
            id: true,
            name: true,
            status: true
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
        children: true,
        tasks: {
          include: {
            task: true
          }
        },
        comments: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                image: true
              }
            }
          }
        },
        attachments: {
          include: {
            uploader: {
              select: {
                id: true,
                name: true,
                email: true
              }
            }
          }
        },
        tags: {
          include: {
            tag: true
          }
        },
        versions: {
          include: {
            createdBy: {
              select: {
                id: true,
                name: true,
                email: true
              }
            }
          },
          orderBy: {
            versionNumber: 'desc'
          }
        }
      }
    });

    // 处理标签更新
    if (data.tagIds !== undefined) {
      // 删除现有标签关联
      await prisma.requirementTag.deleteMany({
        where: { requirementId }
      });

      // 创建新的标签关联
      if (data.tagIds.length > 0) {
        await prisma.requirementTag.createMany({
          data: data.tagIds.map((tagId) => ({
            requirementId,
            tagId
          }))
        });
      }
    }

    return apiResponse(updatedRequirement);
  } catch (error) {
    console.error('更新需求失败:', error);
    return apiError('更新需求失败');
  }
}

// 删除需求
export async function DELETE(
  request: NextRequest,
  { params }: { params: { projectId: string; requirementId: string } }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return apiUnauthorized();
    }

    const { projectId, requirementId } = params;

    // 检查用户是否为项目成员
    const isMember = await isProjectMember(projectId, user.id);
    if (!isMember) {
      return apiForbidden('您没有访问此项目的权限');
    }

    // 查询需求
    const requirement = await prisma.requirement.findUnique({
      where: {
        id: requirementId,
        projectId
      },
      include: {
        children: true,
        tasks: true
      }
    });

    if (!requirement) {
      return apiNotFound('需求');
    }

    // 检查用户是否有删除需求的权限
    const hasDeletePermission = await canDeleteRequirement(
      requirementId,
      user.id
    );
    if (!hasDeletePermission) {
      return apiForbidden('您没有权限删除此需求，或需求存在子需求/关联任务');
    }

    // 删除需求（级联删除相关数据）
    await prisma.requirement.delete({
      where: { id: requirementId }
    });

    return apiResponse({ message: '需求删除成功' });
  } catch (error) {
    console.error('删除需求失败:', error);
    return apiError('删除需求失败');
  }
}
