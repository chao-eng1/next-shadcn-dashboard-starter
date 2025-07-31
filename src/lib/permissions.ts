import { prisma } from '@/lib/prisma';

/**
 * 检查用户是否有指定权限
 * @param userId 用户ID
 * @param permission 权限名称
 * @returns 是否有权限
 */
export async function hasPermission(
  userId: string,
  permission: string
): Promise<boolean> {
  // 查询用户拥有的角色
  const userRoles = await prisma.userRole.findMany({
    where: { userId },
    include: {
      role: {
        include: {
          permissions: {
            include: {
              permission: true
            }
          }
        }
      }
    }
  });

  // 检查用户的角色是否包含指定权限
  for (const userRole of userRoles) {
    for (const rolePermission of userRole.role.permissions) {
      if (rolePermission.permission.name === permission) {
        return true;
      }
    }
  }

  return false;
}

/**
 * 检查用户是否有指定项目的权限
 * @param projectId 项目ID
 * @param permission 权限名称
 * @param userId 用户ID
 * @returns 是否有权限
 */
export async function hasProjectPermission(
  projectId: string,
  permission: string,
  userId: string
): Promise<boolean> {
  // 先检查用户是否有全局权限
  const hasGlobalPermission = await hasPermission(userId, permission);

  if (hasGlobalPermission) {
    return true;
  }

  // 检查用户是否是项目所有者
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: { ownerId: true }
  });

  if (!project) {
    return false;
  }

  // 项目所有者拥有所有权限
  if (project.ownerId === userId) {
    return true;
  }

  // 检查用户在项目中的角色
  const projectMember = await prisma.projectMember.findUnique({
    where: {
      userId_projectId: {
        userId,
        projectId
      }
    }
  });

  if (!projectMember) {
    return false;
  }

  // 基于用户在项目中的角色来检查权限
  switch (projectMember.role) {
    case 'ADMIN':
      // 管理员拥有除删除项目外的所有权限
      return permission !== 'project.delete';

    case 'MEMBER':
      // 成员可以查看项目和管理任务，但不能修改项目设置或管理成员
      return [
        'project.view',
        'task.view',
        'task.create',
        'task.update',
        'task.status.update',
        'comment.view',
        'comment.create',
        'document.view',
        'document.create',
        'document.update',
        'document.template.use'
      ].includes(permission);

    case 'VIEWER':
      // 观察者只有查看权限
      return [
        'project.view',
        'task.view',
        'comment.view',
        'document.view',
        'document.create',
        'document.update'
      ].includes(permission);

    default:
      return false;
  }
}

/**
 * 检查用户是否为系统管理员
 * @param userId 用户ID
 * @returns 是否为管理员
 */
export async function isSystemAdmin(userId: string): Promise<boolean> {
  const adminRole = await prisma.role.findUnique({
    where: { name: 'admin' }
  });

  if (!adminRole) {
    return false;
  }

  const userRole = await prisma.userRole.findFirst({
    where: {
      userId,
      roleId: adminRole.id
    }
  });

  return !!userRole;
}
