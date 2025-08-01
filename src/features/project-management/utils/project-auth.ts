import { prisma } from '@/lib/prisma';

// 检查用户是否可以查看需求
export async function canViewRequirements(projectId: string, userId: string): Promise<boolean> {
  try {
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: {
        members: {
          where: { userId }
        }
      }
    });

    if (!project) {
      return false;
    }

    // 项目所有者或项目成员可以查看需求
    return project.ownerId === userId || project.members.length > 0;
  } catch (error) {
    console.error('检查查看需求权限失败:', error);
    return false;
  }
}

// 检查用户是否可以创建需求
export async function canCreateRequirement(projectId: string, userId: string): Promise<boolean> {
  try {
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: {
        members: {
          where: { userId }
        }
      }
    });

    if (!project) {
      return false;
    }

    // 项目所有者或项目成员可以创建需求
    return project.ownerId === userId || project.members.length > 0;
  } catch (error) {
    console.error('检查创建需求权限失败:', error);
    return false;
  }
}

// 检查用户是否可以编辑需求
export async function canEditRequirement(projectId: string, requirementId: string, userId: string): Promise<boolean> {
  try {
    const requirement = await prisma.requirement.findUnique({
      where: { id: requirementId },
      include: {
        project: {
          include: {
            members: {
              where: { userId }
            }
          }
        }
      }
    });

    if (!requirement || requirement.projectId !== projectId) {
      return false;
    }

    // 需求创建者、项目所有者或项目成员可以编辑需求
    return (
      requirement.createdById === userId ||
      requirement.project.ownerId === userId ||
      requirement.project.members.length > 0
    );
  } catch (error) {
    console.error('检查编辑需求权限失败:', error);
    return false;
  }
}

// 检查用户是否可以删除需求
export async function canDeleteRequirement(projectId: string, requirementId: string, userId: string): Promise<boolean> {
  try {
    const requirement = await prisma.requirement.findUnique({
      where: { id: requirementId },
      include: {
        project: {
          include: {
            members: {
              where: { userId }
            }
          }
        }
      }
    });

    if (!requirement || requirement.projectId !== projectId) {
      return false;
    }

    // 需求创建者或项目所有者可以删除需求
    return (
      requirement.createdById === userId ||
      requirement.project.ownerId === userId
    );
  } catch (error) {
    console.error('检查删除需求权限失败:', error);
    return false;
  }
}

// 检查用户是否为项目成员
export async function isProjectMember(projectId: string, userId: string): Promise<boolean> {
  try {
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: {
        members: {
          where: { userId }
        }
      }
    });

    if (!project) {
      return false;
    }

    return project.ownerId === userId || project.members.length > 0;
  } catch (error) {
    console.error('检查项目成员失败:', error);
    return false;
  }
}